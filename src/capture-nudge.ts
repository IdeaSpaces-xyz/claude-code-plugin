import {
  findNearestAgent,
  isIdeaspacePath,
  resolveRepoRoot,
} from "@ideaspaces/protocol";
import { dirname, resolve } from "node:path";

/**
 * Whether a native write should get an IdeaSpaces capture nudge.
 *
 * Markdown in a nested code repo must not inherit a parent ideaspace's nudge.
 * Compare git ownership rather than `_agent/` and git-root paths directly so a
 * deeper fractal `_agent/` inside the same repo still nudges. A nested repo with
 * its own `_agent/` also nudges because both roots resolve to that nested repo.
 */
export async function shouldNudgeKnowledgePath(
  filePath: string,
): Promise<boolean> {
  const absPath = resolve(filePath);
  if (!isIdeaspacePath(absPath)) return false;

  const agent = await findNearestAgent(dirname(absPath));
  if (agent.source === "none" || !agent.root) return false;

  const fileGitRoot = await resolveRepoRoot(dirname(absPath));
  if (!fileGitRoot) return true;

  return (await resolveRepoRoot(agent.root)) === fileGitRoot;
}
