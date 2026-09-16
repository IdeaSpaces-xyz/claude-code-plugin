import { afterEach, describe, expect, it } from "vitest";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { changeCachePath } from "./session-path.js";

const HOOK = join(process.cwd(), "dist", "awareness-hook.js");
const roots: string[] = [];

function tempDir(prefix: string): string {
  const root = realpathSync(mkdtempSync(join(tmpdir(), prefix)));
  roots.push(root);
  return root;
}

function git(cwd: string, ...args: string[]): string {
  return execFileSync("git", ["-C", cwd, ...args], { encoding: "utf-8" }).trim();
}

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("shipped in-process awareness hook", () => {
  it("orients without the CLI and advances the seen ref after rendering", () => {
    const space = tempDir("is-awareness-hook-space-");
    const home = tempDir("is-awareness-hook-home-");
    const marker = join(home, "cli-was-called");
    const fakeCli = join(home, "failing-cli.js");

    mkdirSync(join(space, "_agent"));
    writeFileSync(
      join(space, "_agent", "foundation.md"),
      "# Foundation\n\nA hook fixture.\n",
    );
    writeFileSync(
      join(space, "_agent", "purpose.md"),
      "# Purpose\n\nKeep SessionStart local.\n",
    );
    writeFileSync(join(space, "_agent", "now.md"), "# Now\n\nFirst state.\n");
    writeFileSync(
      fakeCli,
      `import { writeFileSync } from "node:fs";\nwriteFileSync(${JSON.stringify(marker)}, "called");\nprocess.exit(99);\n`,
    );

    git(space, "init", "-q", "-b", "main");
    git(space, "config", "user.name", "Test");
    git(space, "config", "user.email", "test@example.com");
    git(space, "add", ".");
    git(space, "commit", "-qm", "seed");
    const base = git(space, "rev-parse", "HEAD");
    git(space, "update-ref", "refs/ideaspaces/seen", base);

    writeFileSync(join(space, "_agent", "now.md"), "# Now\n\nSecond state.\n");
    git(space, "add", ".");
    git(space, "commit", "-qm", "advance");
    const head = git(space, "rev-parse", "HEAD");

    const env = {
      ...process.env,
      HOME: home,
      CLAUDE_PROJECT_DIR: space,
      IS_CLI_PATH: fakeCli,
    };
    const first = spawnSync("node", [HOOK], {
      cwd: space,
      env,
      input: JSON.stringify({ session_id: "session-a", cwd: space }),
      encoding: "utf-8",
    });

    expect(first.status).toBe(0);
    expect(first.stderr).toBe("");
    expect(first.stdout).toContain(
      `Position:\n  repo: ${space}\n  cwd: .\n  space root: .\n  active _agent: .`,
    );
    expect(first.stdout).toContain("Now: Second state.");
    // The tail is the protocol's one composition: State supersedes the compact
    // Git line and leads, activity follows — the same bytes `status` renders.
    const headEnd = first.stdout.indexOf("State:\n  branch: main");
    expect(headEnd).toBeGreaterThan(first.stdout.indexOf("Now: Second state."));
    expect(first.stdout).toContain("  working tree: clean\n  captures awaiting commit: 0");
    expect(first.stdout).not.toContain("Git: branch");
    expect(first.stdout.indexOf("Since last session (1 changes):")).toBeGreaterThan(headEnd);
    expect(first.stdout).toContain("M\t_agent/now.md");
    expect(existsSync(marker)).toBe(false);
    expect(git(space, "rev-parse", "refs/ideaspaces/seen")).toBe(head);

    const second = spawnSync("node", [HOOK], {
      cwd: space,
      env,
      input: JSON.stringify({ session_id: "session-a", cwd: space }),
      encoding: "utf-8",
    });
    expect(second.status).toBe(0);
    expect(second.stdout).not.toContain("Since last session");

    // An open Change persisted by the MCP server rides the same composition,
    // last — after State and the manifest tail.
    const changeFile = changeCachePath(home, space);
    mkdirSync(join(changeFile, ".."), { recursive: true });
    writeFileSync(changeFile, JSON.stringify({ change_id: "chg_awareness-hook-0001", session_id: "session-a", opened_at: Date.now() }));
    const third = spawnSync("node", [HOOK], {
      cwd: space,
      env,
      input: JSON.stringify({ session_id: "session-a", cwd: space }),
      encoding: "utf-8",
    });
    expect(third.status).toBe(0);
    expect(third.stdout.trimEnd().split("\n").at(-1)).toContain("Change open: chg_awareness-hook-0001");
    expect(third.stdout.indexOf("Change open:")).toBeGreaterThan(third.stdout.indexOf("State:"));
    expect(readFileSync(join(home, ".ideaspaces", "sessions", sessionCacheName(space)), "utf-8")).toBe(
      "session-a\n",
    );
  });

  it("prefers Agreement without mixing in Foundation", () => {
    const space = tempDir("is-awareness-hook-agreement-");
    const home = tempDir("is-awareness-hook-agreement-home-");
    mkdirSync(join(space, "_agent"));
    writeFileSync(
      join(space, "_agent", "foundation.md"),
      "# Foundation\n\nFOUNDATION BODY SENTINEL\n",
    );
    writeFileSync(
      join(space, "_agent", "agreement.md"),
      "# Agreement\n\nAGREEMENT BODY SENTINEL\n",
    );
    writeFileSync(
      join(space, "_agent", "purpose.md"),
      "---\nsummary: Purpose handle.\n---\nPURPOSE BODY SENTINEL\n",
    );

    const result = spawnSync("node", [HOOK], {
      cwd: space,
      env: { ...process.env, HOME: home, CLAUDE_PROJECT_DIR: space },
      input: JSON.stringify({ session_id: "session-agreement", cwd: space }),
      encoding: "utf-8",
    });

    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("agreement [full]:");
    expect(result.stdout).toContain("AGREEMENT BODY SENTINEL");
    expect(result.stdout).toContain("purpose — Purpose handle.");
    expect(result.stdout).not.toContain("FOUNDATION BODY SENTINEL");
    expect(result.stdout).not.toContain("PURPOSE BODY SENTINEL");
  });

  it("keeps automatic SessionStart silent at the protocol floor", () => {
    const folder = tempDir("is-awareness-hook-floor-");
    const home = tempDir("is-awareness-hook-floor-home-");

    const result = spawnSync("node", [HOOK], {
      cwd: folder,
      env: { ...process.env, HOME: home, CLAUDE_PROJECT_DIR: folder },
      input: JSON.stringify({ session_id: "session-floor", cwd: folder }),
      encoding: "utf-8",
    });

    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toBe("");
  });

  it("renders awareness at the resolved project dir, not the spawn cwd", () => {
    const space = tempDir("is-awareness-hook-proj-");
    const elsewhere = tempDir("is-awareness-hook-elsewhere-");
    const home = tempDir("is-awareness-hook-home2-");

    mkdirSync(join(space, "_agent"));
    writeFileSync(join(space, "_agent", "foundation.md"), "# Foundation\n\nFixture.\n");
    writeFileSync(join(space, "_agent", "now.md"), "# Now\n\nProject-dir state.\n");

    // The harness contract: CLAUDE_PROJECT_DIR names the project; the hook may
    // be spawned from anywhere. The old bug rendered awareness at process.cwd(),
    // which this setup makes an empty unrelated directory.
    const viaEnv = spawnSync("node", [HOOK], {
      cwd: elsewhere,
      env: { ...process.env, HOME: home, CLAUDE_PROJECT_DIR: space },
      input: JSON.stringify({ session_id: "session-b", cwd: elsewhere }),
      encoding: "utf-8",
    });
    expect(viaEnv.status).toBe(0);
    expect(viaEnv.stderr).toBe("");
    expect(viaEnv.stdout).toContain("Now: Project-dir state.");
    expect(viaEnv.stdout).toContain("active _agent: .");

    // Without the env var, input.cwd is the next authority — still not the
    // spawn cwd.
    const envWithout = { ...process.env, HOME: home };
    delete (envWithout as Record<string, string | undefined>).CLAUDE_PROJECT_DIR;
    const viaInput = spawnSync("node", [HOOK], {
      cwd: elsewhere,
      env: envWithout,
      input: JSON.stringify({ session_id: "session-b", cwd: space }),
      encoding: "utf-8",
    });
    expect(viaInput.status).toBe(0);
    expect(viaInput.stdout).toContain("Now: Project-dir state.");
  });
});

/** Mirror the protocol's public project-cache key for the persisted bridge assertion. */
function sessionCacheName(projectDir: string): string {
  return createHash("sha256").update(projectDir).digest("hex").slice(0, 16);
}
