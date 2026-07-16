/**
 * Conformance e2e — proves the SHIPPED artifacts against the protocol.
 *
 * Drives is_write / is_commit / is_change_* / is_status through the real
 * vendored MCP server (dist/index.js, IS_CLI_PATH → cli/bundle/ideaspaces.js)
 * into a temp space scaffolded by `ideaspaces create`, then validates the
 * result with @ideaspaces/protocol: validateSpace over the tree, parseTrailers
 * + CHANGE_ID_PATTERN over the commits it produced.
 *
 * This is the protocol's "prove conformance through the real write paths"
 * item, delivered from the consumer side. Everything runs under a sandboxed
 * $HOME — no real credentials, git config, or session state are touched.
 *
 * The rename/delete vectors are `.skip` pending the commitPaths fix
 * (roadmap bugs/is-commit-staged-rename): `git add -- <old-path>` exits fatal
 * on a staged rename's vanished source path.
 */

import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import {
  CHANGE_ID_PATTERN,
  isValidChangeId,
  parseTrailers,
  validateSpace,
} from "@ideaspaces/protocol";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { sessionIdCachePath } from "./session-path.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SERVER = join(ROOT, "dist/index.js");
const CLI = join(ROOT, "cli/bundle/ideaspaces.js");

const T = 30_000;

let home: string;
let space: string;
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

beforeAll(async () => {
  home = mkdtempSync(join(tmpdir(), "is-conformance-home-"));
  space = mkdtempSync(join(tmpdir(), "is-conformance-space-"));

  // Real scaffold path: `ideaspaces create` inits git and commits the seed
  // contract itself. We only stamp the person identity for OUR commits —
  // create stamps it solely when logged in, and the sandbox never is.
  cli(["create", "--yes"], space);
  git(["config", "user.name", "Test Person"]);
  git(["config", "user.email", "person:tester@ideaspaces"]);

  client = new Client({ name: "conformance-e2e", version: "0.0.0" });
  await client.connect(
    new StdioClientTransport({
      command: "node",
      args: [SERVER],
      cwd: space,
      env: { ...baseEnv(), IS_CLI_PATH: CLI, CLAUDE_PROJECT_DIR: space },
    }),
  );
}, T);

afterAll(async () => {
  await client?.close();
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

  test("is_commit never sweeps unrelated staged work", { timeout: T }, async () => {
    writeFileSync(join(space, "unrelated.md"), "# Someone else's staged file\n");
    git(["add", "unrelated.md"]);

    await call("is_write", {
      path: "notes/second.md",
      content: "# Second\n\nBody.\n",
      name: "Second",
      summary: "Second note.",
    });
    await call("is_commit", { message: "Add second note", paths: ["notes/second.md"] });

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
  // Pending roadmap bugs/is-commit-staged-rename: commitPaths runs
  // `git add -- <old-path>` which exits fatal on a rename's vanished source,
  // poisoning the whole multi-path commit. Unskip when the CLI ships
  // `git add -A -- <paths>` and the vendored bundle is bumped.
  test.skip("a git-mv'd Note commits path-scoped with Op: move", () => {});
  test.skip("a deleted Note commits path-scoped with Op: delete", () => {});
});
