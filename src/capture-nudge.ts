import {
  findNearestAgent,
  isIdeaspacePath,
  resolveRepoRoot,
} from "@ideaspaces/protocol";
import { createHash } from "node:crypto";
import { dirname, join, resolve } from "node:path";

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

/**
 * Whether a hand-rolled commit is happening inside an ideaspace.
 *
 * `git commit` names no file, so the position is the only thing to judge on:
 * a commit run from a directory under an `_agent/` contract is the one that
 * bypasses `is_commit`'s scoping and attribution.
 */
export async function shouldNudgeKnowledgeCommit(cwd: string): Promise<boolean> {
  const agent = await findNearestAgent(resolve(cwd));
  return agent.source !== "none" && Boolean(agent.root);
}

/**
 * Whether a Bash command runs `git commit`.
 *
 * Matched here rather than through the hook config's `if` field: a matcher
 * dialect that silently never fires would leave the nudge shipped and dead,
 * which is the failure this hook change exists to correct. The cost is a hook
 * process per Bash call; the check is a regex over one string.
 *
 * Scans every segment of a compound command, tolerates leading environment
 * assignments and `git -C <dir>` / `git -c k=v` prefixes, and requires
 * `commit` as a whole word so `git commit-tree` does not match.
 */
export function isGitCommit(command: string): boolean {
  return command
    .split(/&&|\|\||[;|\n]/)
    .some((segment) =>
      /(?:^|\s|\$\(|`)(?:\w+=\S*\s+)*git\s+(?:-[Cc]\s+\S+\s+)*commit(?:\s|$)/.test(segment),
    );
}

/** The two things the nudge can be about. One marker each. */
export type NudgeKind = "write" | "commit";

/**
 * Where a nudge records that it already fired.
 *
 * A user-level path, so the plugin leaves no footprint in the repos a session
 * visits — the same scheme as the session and Change caches, keyed by session
 * *and* project so two sessions in one directory nudge independently and a
 * single session nudges once per kind.
 *
 * Once per session is the point: the first bypass is worth a signpost, and
 * every one after it is the agent's informed choice. Repeating turns the nudge
 * into noise an agent learns to read past, which is what the PostToolUse
 * version did.
 */
export function nudgeMarkerPath(
  homeDir: string,
  sessionId: string,
  projectDir: string,
  kind: NudgeKind,
): string {
  const key = createHash("sha256")
    .update(`${sessionId}\0${resolve(projectDir)}\0${kind}`)
    .digest("hex")
    .slice(0, 16);
  return join(homeDir, ".ideaspaces", "nudges", key);
}
