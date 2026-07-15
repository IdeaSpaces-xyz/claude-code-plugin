import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { shouldNudgeKnowledgePath } from "./capture-nudge.js";

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
  it("nudges for knowledge in the ideaspace repository", () => {
    const root = tempDir();
    initRepo(root);
    mkdirSync(join(root, "_agent"));
    mkdirSync(join(root, "notes"));

    expect(shouldNudgeKnowledgePath(join(root, "notes", "finding.md"))).toBe(true);
    expect(shouldNudgeKnowledgePath(join(root, "notes", "data.json"))).toBe(false);
  });

  it("stays silent across a nested repository boundary", () => {
    const root = tempDir();
    initRepo(root);
    mkdirSync(join(root, "_agent"));

    const nested = join(root, "projects", "code");
    mkdirSync(nested, { recursive: true });
    initRepo(nested);
    mkdirSync(join(nested, "docs"));

    expect(shouldNudgeKnowledgePath(join(nested, "docs", "README.md"))).toBe(false);
  });

  it("nudges when the nested repository has its own contract", () => {
    const root = tempDir();
    initRepo(root);
    mkdirSync(join(root, "_agent"));

    const nested = join(root, "projects", "space");
    mkdirSync(nested, { recursive: true });
    initRepo(nested);
    mkdirSync(join(nested, "_agent"));

    expect(shouldNudgeKnowledgePath(join(nested, "README.md"))).toBe(true);
  });

  it("keeps fractal branch contracts active inside the same repository", () => {
    const root = tempDir();
    initRepo(root);
    mkdirSync(join(root, "_agent"));
    mkdirSync(join(root, "research", "_agent"), { recursive: true });

    expect(shouldNudgeKnowledgePath(join(root, "research", "finding.md"))).toBe(true);
  });
});
