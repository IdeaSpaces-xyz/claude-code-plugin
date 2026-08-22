import { afterEach, describe, expect, it } from "vitest";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";

const HOOK = join(process.cwd(), "dist", "capture-nudge-hook.js");
const roots: string[] = [];

function tempDir(prefix: string): string {
  const root = realpathSync(mkdtempSync(join(tmpdir(), prefix)));
  roots.push(root);
  return root;
}

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

/** Run the shipped hook bundle the way Claude Code does: JSON on stdin. */
function fire(home: string, input: unknown): { out: string; code: number } {
  const r = spawnSync("node", [HOOK], {
    input: JSON.stringify(input),
    encoding: "utf-8",
    env: { ...process.env, HOME: home },
  });
  return { out: r.stdout.trim(), code: r.status ?? 1 };
}

function parse(out: string): { hookSpecificOutput?: { hookEventName?: string; additionalContext?: string } } {
  return JSON.parse(out);
}

function space(): string {
  const dir = tempDir("is-nudge-space-");
  execFileSync("git", ["init", "-q", dir]);
  mkdirSync(join(dir, "_agent"));
  writeFileSync(join(dir, "_agent", "foundation.md"), "# Foundation\n");
  return dir;
}

describe("shipped capture-nudge hook", () => {
  it("announces itself as PreToolUse and never gates the tool", () => {
    const dir = space();
    const home = tempDir("is-nudge-home-");
    const { out, code } = fire(home, {
      session_id: "s1",
      cwd: dir,
      tool_name: "Write",
      tool_input: { file_path: "notes/finding.md" },
    });

    expect(code).toBe(0);
    const payload = parse(out).hookSpecificOutput;
    expect(payload?.hookEventName).toBe("PreToolUse");
    expect(payload?.additionalContext).toContain("is_write");
    // Informs, never decides: a capture nudge must not be able to block a write.
    expect(out).not.toContain("permissionDecision");
  });

  it("sees a hand-rolled commit, which the Write|Edit matcher never could", () => {
    const dir = space();
    const home = tempDir("is-nudge-home-");
    const { out } = fire(home, {
      session_id: "s1",
      cwd: dir,
      tool_name: "Bash",
      tool_input: { command: 'git add -A && git commit -m "capture"' },
    });
    expect(parse(out).hookSpecificOutput?.additionalContext).toContain("is_commit");
  });

  it("says nothing the second time, per kind, per session", () => {
    const dir = space();
    const home = tempDir("is-nudge-home-");
    const write = {
      session_id: "s1",
      cwd: dir,
      tool_name: "Write",
      tool_input: { file_path: "notes/finding.md" },
    };
    const commit = {
      session_id: "s1",
      cwd: dir,
      tool_name: "Bash",
      tool_input: { command: "git commit -m x" },
    };

    expect(fire(home, write).out).not.toBe("");
    expect(fire(home, write).out).toBe("");
    // A different kind still gets its one signpost.
    expect(fire(home, commit).out).not.toBe("");
    expect(fire(home, commit).out).toBe("");
    // A different session starts fresh.
    expect(fire(home, { ...write, session_id: "s2" }).out).not.toBe("");
  });

  it("stays silent outside an ideaspace, on code, and on ordinary commands", () => {
    const home = tempDir("is-nudge-home-");
    const plain = tempDir("is-nudge-plain-");
    execFileSync("git", ["init", "-q", plain]);
    const dir = space();

    // Markdown, but no contract anywhere above it.
    expect(fire(home, {
      session_id: "s1", cwd: plain, tool_name: "Write",
      tool_input: { file_path: "README.md" },
    }).out).toBe("");

    // Source code inside an ideaspace.
    expect(fire(home, {
      session_id: "s1", cwd: dir, tool_name: "Write",
      tool_input: { file_path: "src/index.ts" },
    }).out).toBe("");

    // A commit outside any ideaspace.
    expect(fire(home, {
      session_id: "s1", cwd: plain, tool_name: "Bash",
      tool_input: { command: "git commit -m x" },
    }).out).toBe("");

    // Bash that is not a commit.
    expect(fire(home, {
      session_id: "s1", cwd: dir, tool_name: "Bash",
      tool_input: { command: "git status && npm test" },
    }).out).toBe("");
  });

  it("survives malformed input without blocking the tool", () => {
    const home = tempDir("is-nudge-home-");
    for (const raw of ["", "not json", "{}", '{"tool_input":{}}']) {
      const r = spawnSync("node", [HOOK], {
        input: raw,
        encoding: "utf-8",
        env: { ...process.env, HOME: home },
      });
      expect(r.status).toBe(0);
      expect(r.stdout.trim()).toBe("");
    }
  });
});
