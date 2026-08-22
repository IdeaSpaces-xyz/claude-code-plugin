import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import {
  isGitCommit,
  nudgeMarkerPath,
  shouldNudgeKnowledgeCommit,
  shouldNudgeKnowledgePath,
} from "./capture-nudge.js";

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

describe("shouldNudgeKnowledgePath", () => {
  it("nudges for knowledge in the ideaspace repository", async () => {
    const root = tempDir();
    initRepo(root);
    mkdirSync(join(root, "_agent"));
    mkdirSync(join(root, "notes"));

    await expect(shouldNudgeKnowledgePath(join(root, "notes", "finding.md"))).resolves.toBe(true);
    await expect(shouldNudgeKnowledgePath(join(root, "notes", "data.json"))).resolves.toBe(false);
  });

  it("stays silent across a nested repository boundary", async () => {
    const root = tempDir();
    initRepo(root);
    mkdirSync(join(root, "_agent"));

    const nested = join(root, "projects", "code");
    mkdirSync(nested, { recursive: true });
    initRepo(nested);
    mkdirSync(join(nested, "docs"));

    await expect(shouldNudgeKnowledgePath(join(nested, "docs", "README.md"))).resolves.toBe(false);
  });

  it("nudges when the nested repository has its own contract", async () => {
    const root = tempDir();
    initRepo(root);
    mkdirSync(join(root, "_agent"));

    const nested = join(root, "projects", "space");
    mkdirSync(nested, { recursive: true });
    initRepo(nested);
    mkdirSync(join(nested, "_agent"));

    await expect(shouldNudgeKnowledgePath(join(nested, "README.md"))).resolves.toBe(true);
  });

  it("keeps fractal branch contracts active inside the same repository", async () => {
    const root = tempDir();
    initRepo(root);
    mkdirSync(join(root, "_agent"));
    mkdirSync(join(root, "research", "_agent"), { recursive: true });

    await expect(shouldNudgeKnowledgePath(join(root, "research", "finding.md"))).resolves.toBe(true);
  });
});

describe("isGitCommit", () => {
  it("matches the shapes a commit actually arrives in", () => {
    for (const command of [
      "git commit",
      'git commit -m "capture the finding"',
      "git commit --amend --no-edit",
      "git add -A && git commit -m x",
      "cd notes; git commit -m x",
      "git -C /work/space commit -m x",
      "git -c user.name=Bot commit -m x",
      "GIT_AUTHOR_NAME=Bot git commit -m x",
    ]) {
      expect(isGitCommit(command), command).toBe(true);
    }
  });

  it("stays out of the way of everything else", () => {
    for (const command of [
      "git status",
      "git log --oneline -5",
      "git commit-tree HEAD^{tree}",
      "npm test",
      "echo committing",
      "gitcommit",
    ]) {
      expect(isGitCommit(command), command).toBe(false);
    }
  });
});

describe("shouldNudgeKnowledgeCommit", () => {
  it("nudges inside an ideaspace and nowhere else", async () => {
    const space = tempDir();
    initRepo(space);
    mkdirSync(join(space, "_agent"));
    await expect(shouldNudgeKnowledgeCommit(space)).resolves.toBe(true);

    const plain = tempDir();
    initRepo(plain);
    await expect(shouldNudgeKnowledgeCommit(plain)).resolves.toBe(false);
  });
});

describe("nudgeMarkerPath", () => {
  it("separates kind, session, and project, and stays out of the repo", () => {
    const a = nudgeMarkerPath("/home/u", "s1", "/work/space", "write");
    const b = nudgeMarkerPath("/home/u", "s1", "/work/space", "commit");
    const c = nudgeMarkerPath("/home/u", "s2", "/work/space", "write");
    const d = nudgeMarkerPath("/home/u", "s1", "/work/other", "write");

    expect(new Set([a, b, c, d]).size).toBe(4);
    expect(a.startsWith("/home/u/.ideaspaces/nudges/")).toBe(true);
    // Same inputs, same path — that is what makes "once per session" hold.
    expect(nudgeMarkerPath("/home/u", "s1", "/work/space", "write")).toBe(a);
  });
});
