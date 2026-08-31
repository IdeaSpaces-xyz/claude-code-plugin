import {
  findNearestAgent,
  isIdeaspacePath,
  resolveRepoRoot,
} from "@ideaspaces/protocol";
import { realpath } from "node:fs/promises";
import { basename, dirname, join, relative, resolve } from "node:path";

/**
 * Whether a native write should get an IdeaSpaces capture nudge.
 *
 * Markdown in a nested code repo must not inherit a parent ideaspace's nudge.
 * Compare git ownership rather than `_agent/` and git-root paths directly so a
 * deeper fractal `_agent/` inside the same repo still nudges. A nested repo with
 * its own `_agent/` also nudges because both roots resolve to that nested repo.
 */
async function canonicalExistingPath(path: string): Promise<string> {
  try {
    return await realpath(path);
  } catch {
    return resolve(path);
  }
}

export async function shouldNudgeKnowledgePath(
  filePath: string,
): Promise<boolean> {
  const absPath = resolve(filePath);
  const agent = await findNearestAgent(dirname(absPath));
  if (agent.source === "none" || !agent.root) return false;

  const fileGitRoot = await resolveRepoRoot(dirname(absPath));
  const classificationRoot = fileGitRoot ?? await canonicalExistingPath(agent.root);
  const canonicalParent = await canonicalExistingPath(dirname(absPath));
  const canonicalPath = join(canonicalParent, basename(absPath));
  const portablePath = relative(classificationRoot, canonicalPath).replace(/\\/g, "/");
  if (portablePath === ".." || portablePath.startsWith("../") || !isIdeaspacePath(portablePath)) {
    return false;
  }
  if (!fileGitRoot) return true;

  return (await resolveRepoRoot(agent.root)) === fileGitRoot;
}
