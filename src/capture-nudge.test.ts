import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { isBashGitCommit, shouldNudgeCommitCwd } from "./capture-nudge.js";

const roots: string[] = [];

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

function tempDir(): string {
  const root = mkdtempSync(join(tmpdir(), "is-capture-nudge-"));
  roots.push(root);
  return root;
}

function initRepo(root: string): void {
  const result = spawnSync("git", ["init", "-q", root], { encoding: "utf-8" });
  if (result.status !== 0) throw new Error(result.stderr || "git init failed");
}

describe("isBashGitCommit", () => {
  it("matches plain and flagged git commits", () => {
    expect(isBashGitCommit('git commit -m "save"')).toBe(true);
    expect(isBashGitCommit("git -C notes commit -q -m x")).toBe(true);
    expect(isBashGitCommit('git -c user.email=x@y commit -m "z"')).toBe(true);
    expect(isBashGitCommit('git add -A && git commit -m "both"')).toBe(true);
  });

  it("ignores other git and non-git commands", () => {
    expect(isBashGitCommit("git add -A")).toBe(false);
    expect(isBashGitCommit("git log --oneline")).toBe(false);
    expect(isBashGitCommit('node cli/bundle/ideaspaces.js commit -m "x" notes/a.md')).toBe(false);
    expect(isBashGitCommit("npm run commit")).toBe(false);
  });
});

describe("shouldNudgeCommitCwd", () => {
  it("nudges for a commit from inside the ideaspace repository", async () => {
    const root = tempDir();
    initRepo(root);
    mkdirSync(join(root, "_agent"));
    mkdirSync(join(root, "notes"));

    await expect(shouldNudgeCommitCwd(root)).resolves.toBe(true);
    await expect(shouldNudgeCommitCwd(join(root, "notes"))).resolves.toBe(true);
  });

  it("stays silent in a nested code repository under the ideaspace", async () => {
    const root = tempDir();
    initRepo(root);
    mkdirSync(join(root, "_agent"));

    const nested = join(root, "projects", "code");
    mkdirSync(nested, { recursive: true });
    initRepo(nested);

    await expect(shouldNudgeCommitCwd(nested)).resolves.toBe(false);
  });

  it("nudges when the nested repository carries its own contract", async () => {
    const root = tempDir();
    initRepo(root);
    mkdirSync(join(root, "_agent"));

    const nested = join(root, "projects", "space");
    mkdirSync(nested, { recursive: true });
    initRepo(nested);
    mkdirSync(join(nested, "_agent"));

    await expect(shouldNudgeCommitCwd(nested)).resolves.toBe(true);
  });

  it("stays silent outside any ideaspace", async () => {
    const root = tempDir();
    initRepo(root);

    await expect(shouldNudgeCommitCwd(root)).resolves.toBe(false);
  });
});

describe("nudgeMarkerPath", () => {
  it("keys by session and project, stable across calls", async () => {
    const { nudgeMarkerPath } = await import("./capture-nudge.js");
    const a = nudgeMarkerPath("/home/u", "sess-1", "/proj/a");
    expect(nudgeMarkerPath("/home/u", "sess-1", "/proj/a")).toBe(a);
    expect(nudgeMarkerPath("/home/u", "sess-2", "/proj/a")).not.toBe(a);
    expect(nudgeMarkerPath("/home/u", "sess-1", "/proj/b")).not.toBe(a);
    expect(a.startsWith("/home/u/.ideaspaces/nudges/")).toBe(true);
  });
});
