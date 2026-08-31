/**
 * Conformance e2e — proves the SHIPPED artifacts against the protocol.
 *
 * Drives is_write / is_commit / is_change_* / is_status through the real
 * vendored MCP server (`dist/index.js`) with `IS_CLI_PATH` pointing at a marker
 * executable that always fails. A bundled CLI scaffolds the temp space before
 * the server starts; local mutation must never invoke it. The suite validates the
 * result with @ideaspaces/protocol: validateSpace over the tree, parseTrailers
 * + CHANGE_ID_PATTERN over the commits it produced.
 *
 * This is the protocol's "prove conformance through the real write paths"
 * item, delivered from the consumer side. Everything runs under a sandboxed
 * $HOME — no real credentials, git config, or session state are touched.
 *
 * The Change-persistence vectors run in their own sandbox (own $HOME + space,
 * one server process per connect) because they flip the session cache and
 * model server restarts — isolation keeps them from contaminating the shared
 * suite's Conversation expectations.
 */

import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import {
  CHANGE_ID_PATTERN,
  isValidChangeId,
  parseFrontmatter,
  parseMap,
  parseTrailers,
  validateSpace,
} from "@ideaspaces/protocol";
import { spawnSync } from "node:child_process";
import {
  chmodSync,
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { changeCachePath, sessionIdCachePath } from "./session-path.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SERVER = join(ROOT, "dist/index.js");
const CLI = join(ROOT, "cli/bundle/ideaspaces.js");

const T = 30_000;

let home: string;
let space: string;
let failingCli: string;
let cliMarker: string;
let client: Client;

/** Run the vendored CLI directly (setup only — the tests go through MCP). */
function cli(args: string[], cwd: string) {
  const r = spawnSync("node", [CLI, ...args], {
    cwd,
    encoding: "utf-8",
    env: { ...baseEnv(), IS_CLI_PATH: CLI },
  });
  if (r.status !== 0) throw new Error(`cli ${args.join(" ")} failed: ${r.stderr || r.stdout}`);
  return r.stdout;
}

function git(args: string[]): string {
  const r = spawnSync("git", ["-C", space, ...args], { encoding: "utf-8", env: baseEnv() });
  if (r.status !== 0) throw new Error(`git ${args.join(" ")} failed: ${r.stderr || r.stdout}`);
  return r.stdout.trim();
}

function baseEnv(): Record<string, string> {
  return {
    PATH: process.env.PATH ?? "",
    HOME: home,
    GIT_CONFIG_NOSYSTEM: "1",
    GIT_TERMINAL_PROMPT: "0",
  };
}

/** Call an MCP tool; returns the text payload. Throws on isError unless allowed. */
async function call(
  name: string,
  args: Record<string, unknown>,
  opts: { allowError?: boolean } = {},
): Promise<{ text: string; isError: boolean }> {
  const res = (await client.callTool({ name, arguments: { ...args, cwd: space } })) as {
    content: Array<{ type: string; text?: string }>;
    isError?: boolean;
  };
  const text = res.content?.map((c) => c.text ?? "").join("") ?? "";
  if (res.isError && !opts.allowError) throw new Error(`${name} errored: ${text}`);
  return { text, isError: Boolean(res.isError) };
}

function lastCommit(): { author: string; message: string } {
  return {
    author: git(["log", "-1", "--format=%an <%ae>"]),
    message: git(["log", "-1", "--format=%B"]),
  };
}

function fakePi(): string {
  const path = join(home, "fake-pi.mjs");
  writeFileSync(path, `#!/usr/bin/env node
const args = process.argv.slice(2);
const index = args.indexOf("--append-system-prompt");
const orientation = index === -1 ? "" : (args[index + 1] ?? "");
let buffered = "";
process.stdin.on("data", (chunk) => {
  buffered += String(chunk);
  while (buffered.includes("\\n")) {
    const split = buffered.indexOf("\\n");
    const line = buffered.slice(0, split);
    buffered = buffered.slice(split + 1);
    if (!line) continue;
    const command = JSON.parse(line);
    if (command.type === "get_state") {
      console.log(JSON.stringify({ type: "response", command: "get_state", success: true, data: { sessionName: "Plugin Map test" } }));
    }
    if (command.type === "prompt") {
      const complete = orientation.includes('kind=position root=0 position="findings/map.md" depth=full');
      console.log(JSON.stringify({ type: "response", command: "prompt", success: true }));
      console.log(JSON.stringify({ type: "agent_start" }));
      console.log(JSON.stringify({ type: "turn_start" }));
      console.log(JSON.stringify({ type: "message_update", assistantMessageEvent: { type: "text_delta", delta: complete ? "captured map available" : "map missing" } }));
      console.log(JSON.stringify({ type: "agent_end" }));
    }
  }
});
`);
  chmodSync(path, 0o755);
  return path;
}

beforeAll(async () => {
  home = mkdtempSync(join(tmpdir(), "is-conformance-home-"));
  space = mkdtempSync(join(tmpdir(), "is-conformance-space-"));

  // Person identity in the sandbox's GLOBAL config, before create runs:
  // create's scaffold commit needs an identity (it stamps one itself only
  // when logged in, and the sandbox never is). Without this, create relies
  // on ambient machine identity — works on a dev laptop via gecos fallback,
  // "Scaffold failed midway: … empty ident name" on a bare CI runner.
  const cfg = spawnSync(
    "git",
    ["config", "--global", "user.name", "Test Person"],
    { env: baseEnv() },
  );
  if (cfg.status !== 0) throw new Error("could not write sandbox git config");
  spawnSync("git", ["config", "--global", "user.email", "person:tester@ideaspaces"], {
    env: baseEnv(),
  });

  // Real scaffold path: `ideaspaces create` inits git and commits the seed
  // contract itself. This happens before the MCP local-effect proof begins.
  cli(["create", "--yes"], space);

  cliMarker = join(home, "platform-cli-invoked");
  failingCli = join(home, "failing-platform-cli.mjs");
  writeFileSync(
    failingCli,
    `import { writeFileSync } from "node:fs";\nwriteFileSync(${JSON.stringify(cliMarker)}, "invoked\\n");\nprocess.exit(73);\n`,
  );

  client = new Client({ name: "conformance-e2e", version: "0.0.0" });
  await client.connect(
    new StdioClientTransport({
      command: "node",
      args: [SERVER],
      cwd: space,
      env: { ...baseEnv(), IS_CLI_PATH: failingCli, CLAUDE_PROJECT_DIR: space },
    }),
  );
}, T);

afterAll(async () => {
  await client?.close();
  expect(existsSync(cliMarker)).toBe(false);
  rmSync(home, { recursive: true, force: true });
  rmSync(space, { recursive: true, force: true });
});

describe("write → commit conformance", () => {
  test("is_write produces a staged Note with Layer-1 frontmatter and a content sha", { timeout: T }, async () => {
    const r = await call("is_write", {
      path: "notes/first-finding.md",
      content: "# First finding\n\nThe write path works end to end.\n",
      name: "First finding",
      summary: "Conformance harness proves the write path end to end.",
    });
    const out = JSON.parse(r.text);
    expect(out.staged).toBe(true);
    expect(out.sha).toMatch(/^[0-9a-f]{40}$/);

    const raw = readFileSync(join(space, "notes/first-finding.md"), "utf-8");
    expect(raw.startsWith("---\n")).toBe(true);
    expect(raw).toContain("name: First finding");
  });

  test("bundled MCP capture feeds the same map-note to bundled CLI launch", { timeout: T }, async () => {
    const path = "notes/territory.md";
    await call("is_write", {
      path,
      content: "# Territory\n\nA durable navigation legend.\n",
      name: "Territory",
      summary: "A bounded territory captured from this conversation.",
      map: {
        roots: [
          {
            space: "https://GitHub.com/Acme/Research.git",
            sha: "a".repeat(40),
          },
        ],
        members: [{ space: 0, position: "findings/map.md", depth: "full" }],
      },
    });

    expect(
      parseMap(parseFrontmatter(readFileSync(join(space, path), "utf8"))?.map),
    ).toMatchObject({
      status: "valid",
      map: { roots: [{ space: "github.com/Acme/Research" }] },
    });

    const launched = spawnSync(
      "node",
      [
        CLI,
        "conversation",
        "send",
        "--local",
        "--context",
        space,
        "--conversation",
        "plugin-map-test",
        "--message",
        "What territory is available?",
        "--map",
        path,
        "--ext",
        "/fake/pi-is-space,/fake/pi-local-context",
        "--pi-bin",
        fakePi(),
      ],
      { cwd: space, encoding: "utf8", env: baseEnv() },
    );

    expect(launched.status, launched.stderr || launched.stdout).toBe(0);
    const events = launched.stdout
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line));
    expect(events).toContainEqual({ type: "text_delta", delta: "captured map available" });
    expect(events.some((event) => event.type === "turn_complete")).toBe(true);
    expect(existsSync(join(space, "Acme"))).toBe(false);

    await call("is_commit", { message: "Capture territory Map", paths: [path], op: "capture" });
  });

  test("is_commit commits path-scoped, authored by the person, with agent trailers; Conversation omitted when no session cache", { timeout: T }, async () => {
    await call("is_commit", {
      message: "Add first finding",
      paths: ["notes/first-finding.md"],
      op: "create",
    });

    const { author, message } = lastCommit();
    expect(author).toBe("Test Person <person:tester@ideaspaces>");

    const trailers = parseTrailers(message);
    expect(trailers.op).toBe("create");
    expect(trailers.coAuthoredBy?.join()).toMatch(/agent:[a-z0-9._-]+/i);
    // No hook ran, no session cache — the trailer must be omitted, not faked.
    expect(trailers.conversation).toBeUndefined();
    expect(trailers.changeId).toBeUndefined();
  });

  test("is_commit all selects only this session and never sweeps unrelated staged work", { timeout: T }, async () => {
    writeFileSync(join(space, "unrelated.md"), "# Someone else's staged file\n");
    git(["add", "unrelated.md"]);

    await call("is_write", {
      path: "notes/second.md",
      content: "# Second\n\nBody.\n",
      name: "Second",
      summary: "Second note.",
    });
    await call("is_commit", { message: "Add second note", all: true });

    const committed = git(["diff-tree", "--no-commit-id", "--name-only", "-r", "HEAD"]);
    expect(committed).toBe("notes/second.md");
    expect(git(["diff", "--cached", "--name-only"])).toBe("unrelated.md");
    git(["restore", "--staged", "unrelated.md"]);
    rmSync(join(space, "unrelated.md"));
  });

  test("session-id bridge: cache present → Conversation trailer stamped", { timeout: T }, async () => {
    const cache = sessionIdCachePath(home, space);
    mkdirSync(dirname(cache), { recursive: true });
    writeFileSync(cache, "e2e-session-0001\n");

    await call("is_write", {
      path: "notes/third.md",
      content: "# Third\n\nBody.\n",
      name: "Third",
      summary: "Third note.",
    });
    await call("is_commit", { message: "Add third note", paths: ["notes/third.md"] });

    expect(parseTrailers(lastCommit().message).conversation).toBe("e2e-session-0001");
  });
});

describe("Change lifecycle", () => {
  let changeId: string;

  test("is_change_open mints a conformant Change-Id", { timeout: T }, async () => {
    const r = await call("is_change_open", { handle: "conformance run" });
    const m = r.text.match(/chg_[a-z0-9-]+/);
    expect(m, `no Change-Id in: ${r.text}`).toBeTruthy();
    changeId = m![0];
    expect(changeId).toMatch(CHANGE_ID_PATTERN);
    expect(isValidChangeId(changeId)).toBe(true);
  });

  test("open Change stamps every commit; close stops it", { timeout: T }, async () => {
    await call("is_write", {
      path: "notes/fourth.md",
      content: "# Fourth\n\nBody.\n",
      name: "Fourth",
      summary: "Fourth note.",
    });
    await call("is_commit", { message: "Add fourth note", paths: ["notes/fourth.md"], op: "update" });
    expect(parseTrailers(lastCommit().message).changeId).toBe(changeId);

    await call("is_change_close", {});
    await call("is_write", {
      path: "notes/fifth.md",
      content: "# Fifth\n\nBody.\n",
      name: "Fifth",
      summary: "Fifth note.",
    });
    await call("is_commit", { message: "Add fifth note", paths: ["notes/fifth.md"] });
    expect(parseTrailers(lastCommit().message).changeId).toBeUndefined();
  });
});

describe("optimistic concurrency", () => {
  test("is_write refuses a stale if_match and accepts the current sha", { timeout: T }, async () => {
    const stale = await call(
      "is_write",
      {
        path: "notes/first-finding.md",
        content: "# Overwrite attempt\n",
        name: "First finding",
        summary: "Stale update.",
        if_match: "0".repeat(40),
      },
      { allowError: true },
    );
    expect(stale.isError).toBe(true);

    const status = await call("is_status", { path: "notes/first-finding.md" });
    const sha = JSON.parse(status.text).sha as string;
    const ok = await call("is_write", {
      path: "notes/first-finding.md",
      content: "# First finding\n\nRefined body.\n",
      name: "First finding",
      summary: "Conformance harness proves the write path end to end.",
      if_match: sha,
    });
    expect(JSON.parse(ok.text).staged).toBe(true);
  });
});

describe("space conformance", () => {
  test("everything the write path produced validates against the protocol", { timeout: T }, async () => {
    const report = await validateSpace(space);
    const errors = report.issues.filter((i) => i.level === "error");
    expect(errors, JSON.stringify(errors, null, 2)).toEqual([]);
    expect(report.ok).toBe(true);
    expect(report.notesChecked).toBeGreaterThanOrEqual(5);
  });
});

describe("move / delete write paths", () => {
  // Named paths commit in whatever state the tree holds — content, rename, or
  // deletion (cli#85). These prove the Op: move / Op: delete flows the trailer
  // schema anticipates.
  test("a git-mv'd Note commits path-scoped with Op: move", { timeout: T }, async () => {
    await call("is_write", {
      path: "notes/mover.md",
      content: "# Mover\n\nBody.\n",
      name: "Mover",
      summary: "Note that gets moved.",
    });
    await call("is_commit", { message: "Add mover", paths: ["notes/mover.md"] });

    git(["mv", "notes/mover.md", "notes/moved.md"]);
    await call("is_commit", {
      message: "Move mover to moved",
      paths: ["notes/mover.md", "notes/moved.md"],
      op: "move",
    });

    expect(parseTrailers(lastCommit().message).op).toBe("move");
    const status = git(["show", "--name-status", "--format=", "-M", "HEAD"]).trim();
    expect(status).toBe("R100\tnotes/mover.md\tnotes/moved.md");
  });

  test("a deleted Note commits path-scoped with Op: delete", { timeout: T }, async () => {
    await call("is_write", {
      path: "notes/doomed.md",
      content: "# Doomed\n\nBody.\n",
      name: "Doomed",
      summary: "Note that gets deleted.",
    });
    await call("is_commit", { message: "Add doomed", paths: ["notes/doomed.md"] });

    git(["rm", "-q", "notes/doomed.md"]);
    await call("is_commit", {
      message: "Delete doomed",
      paths: ["notes/doomed.md"],
      op: "delete",
    });

    expect(parseTrailers(lastCommit().message).op).toBe("delete");
    const status = git(["show", "--name-status", "--format=", "HEAD"]).trim();
    expect(status).toBe("D\tnotes/doomed.md");
  });
});

describe("Change persistence across server restarts (shipped artifacts)", () => {
  // Own sandbox: these vectors flip the session cache and restart servers,
  // which must not contaminate the shared suite's Conversation expectations.
  let phome: string;
  let pspace: string;
  let sessionFile: string;
  let changeFile: string;
  const clients: Client[] = [];

  const HOOK = join(ROOT, "dist/awareness-hook.js");

  function penv(): Record<string, string> {
    return {
      PATH: process.env.PATH ?? "",
      HOME: phome,
      GIT_CONFIG_NOSYSTEM: "1",
      GIT_TERMINAL_PROMPT: "0",
    };
  }

  /** Fresh server + client — each connect models a server (re)start. */
  async function connect(): Promise<Client> {
    const c = new Client({ name: "persistence-e2e", version: "0.0.0" });
    await c.connect(
      new StdioClientTransport({
        command: "node",
        args: [SERVER],
        cwd: pspace,
        env: { ...penv(), IS_CLI_PATH: failingCli, CLAUDE_PROJECT_DIR: pspace },
      }),
    );
    clients.push(c);
    return c;
  }

  async function pcall(c: Client, name: string, args: Record<string, unknown> = {}) {
    const res = (await c.callTool({ name, arguments: { ...args, cwd: pspace } })) as {
      content: Array<{ type: string; text?: string }>;
      isError?: boolean;
    };
    const text = res.content?.map((x) => x.text ?? "").join("") ?? "";
    if (res.isError) throw new Error(`${name} errored: ${text}`);
    return text;
  }

  /** Run the SHIPPED SessionStart hook with a given session id; returns stdout. */
  function runHook(sessionId: string): string {
    const r = spawnSync("node", [HOOK], {
      cwd: pspace,
      encoding: "utf-8",
      env: { ...penv(), IS_CLI_PATH: failingCli, CLAUDE_PROJECT_DIR: pspace },
      input: JSON.stringify({ session_id: sessionId, cwd: pspace }),
    });
    expect(r.status).toBe(0);
    return r.stdout;
  }

  beforeAll(() => {
    phome = mkdtempSync(join(tmpdir(), "is-persist-home-"));
    pspace = mkdtempSync(join(tmpdir(), "is-persist-space-"));
    for (const [k, v] of [
      ["user.name", "Test Person"],
      ["user.email", "person:tester@ideaspaces"],
    ]) {
      spawnSync("git", ["config", "--global", k, v], { env: penv() });
    }
    const r = spawnSync("node", [CLI, "create", "--yes"], {
      cwd: pspace,
      encoding: "utf-8",
      env: { ...penv(), IS_CLI_PATH: CLI },
    });
    if (r.status !== 0) throw new Error(`create failed: ${r.stderr || r.stdout}`);

    sessionFile = sessionIdCachePath(phome, pspace);
    changeFile = changeCachePath(phome, pspace);
    mkdirSync(dirname(sessionFile), { recursive: true });
    writeFileSync(sessionFile, "sess-A\n");
  }, T);

  afterAll(async () => {
    for (const c of clients) await c.close().catch(() => {});
    rmSync(phome, { recursive: true, force: true });
    rmSync(pspace, { recursive: true, force: true });
  });

  let changeId: string;

  test("open persists a session-stamped record; same-session restart re-arms", { timeout: T }, async () => {
    const c1 = await connect();
    const open = await pcall(c1, "is_change_open", { handle: "persistence vector" });
    changeId = open.match(/chg_[a-z0-9-]+/)?.[0] ?? "";
    expect(isValidChangeId(changeId)).toBe(true);

    const rec = JSON.parse(readFileSync(changeFile, "utf-8"));
    expect(rec.change_id).toBe(changeId);
    expect(rec.session_id).toBe("sess-A");
    await c1.close(); // the mid-session server crash

    const c2 = await connect();
    const status = JSON.parse(await pcall(c2, "is_status"));
    expect(status.change?.open).toBe(changeId); // silently re-armed
    await c2.close();
  });

  test("a different session surfaces the record without arming; close clears it", { timeout: T }, async () => {
    writeFileSync(sessionFile, "sess-B\n");
    const c3 = await connect();
    const status = JSON.parse(await pcall(c3, "is_status"));
    expect(status.change?.persisted).toBe(changeId);
    expect(status.change?.open).toBeUndefined();

    const closed = await pcall(c3, "is_change_close");
    expect(closed).toContain(`Cleared persisted Change ${changeId}`);
    expect(existsSync(changeFile)).toBe(false);
    await c3.close();
  });

  test("close as the FIRST call after a same-session restart reports a normal close", { timeout: T }, async () => {
    const c4 = await connect();
    const open = await pcall(c4, "is_change_open", { handle: "close first vector" });
    const id2 = open.match(/chg_[a-z0-9-]+/)?.[0] ?? "";
    await c4.close();

    const c5 = await connect();
    const closed = await pcall(c5, "is_change_close");
    expect(closed).toContain(`Change closed: ${id2}`);
    expect(closed).not.toContain("previous session");
    expect(existsSync(changeFile)).toBe(false);
    await c5.close();
  });

  test("shipped awareness hook renders the line, session-aware; silent with no record", { timeout: T }, async () => {
    const c6 = await connect();
    const open = await pcall(c6, "is_change_open", { handle: "hook line vector" });
    const id3 = open.match(/chg_[a-z0-9-]+/)?.[0] ?? "";

    const sameSession = runHook("sess-B");
    expect(sameSession).toContain(`Change open: ${id3}`);
    expect(sameSession).toContain("this session");
    expect(sameSession).toContain("stamping every is_commit");

    const otherSession = runHook("sess-C");
    expect(otherSession).toContain(`⚠ Change open: ${id3}`);
    expect(otherSession).toContain(`is_change_open({ id: "${id3}" })`);
    expect(otherSession).not.toContain("stamping");

    // runHook("sess-C") rewrote the session cache — restore before closing so
    // the record comparison below stays about the file, not the session.
    writeFileSync(sessionFile, "sess-B\n");
    await pcall(c6, "is_change_close");
    await c6.close();

    const silent = runHook("sess-B");
    expect(silent).not.toContain("Change open");
  });
});
