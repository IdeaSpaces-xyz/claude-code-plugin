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
    expect(first.stdout).toContain("Since last session (1 changes):");
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
    expect(readFileSync(join(home, ".ideaspaces", "sessions", sessionCacheName(space)), "utf-8")).toBe(
      "session-a\n",
    );
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
