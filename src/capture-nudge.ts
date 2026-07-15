import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join, resolve, sep } from "node:path";

/** A knowledge path: a markdown file, or anything under an `_agent/` dir. */
export function isKnowledgePath(path: string): boolean {
  const normalized = resolve(path);
  return normalized.endsWith(".md") || normalized.split(sep).includes("_agent");
}

/** Nearest ancestor carrying the ideaspace `_agent/` marker. */
export function nearestAgentRoot(startDir: string): string | null {
  let dir = resolve(startDir);
  for (;;) {
    if (existsSync(join(dir, "_agent"))) return dir;
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

/** Git repository owning `dir`, or null when it is outside git. */
export function gitRootForDir(dir: string): string | null {
  const result = spawnSync("git", ["-C", resolve(dir), "rev-parse", "--show-toplevel"], {
    encoding: "utf-8",
    timeout: 5_000,
  });
  return result.status === 0 && result.stdout.trim() ? resolve(result.stdout.trim()) : null;
}

/**
 * Whether a native write should get an IdeaSpaces capture nudge.
 *
 * Markdown in a nested code repo must not inherit a parent ideaspace's nudge.
 * Compare git ownership rather than `_agent/` and git-root paths directly so a
 * deeper fractal `_agent/` inside the same repo still nudges. A nested repo with
 * its own `_agent/` also nudges because both roots resolve to that nested repo.
 */
export function shouldNudgeKnowledgePath(filePath: string): boolean {
  const absPath = resolve(filePath);
  if (!isKnowledgePath(absPath)) return false;

  const agentRoot = nearestAgentRoot(dirname(absPath));
  if (!agentRoot) return false;

  const fileGitRoot = gitRootForDir(dirname(absPath));
  if (!fileGitRoot) return true;

  return gitRootForDir(agentRoot) === fileGitRoot;
}
