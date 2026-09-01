import { findNearestAgent, resolveRepoRoot } from "@ideaspaces/protocol";
import { resolve } from "node:path";

/**
 * Whether a Bash `git commit` run from `cwd` bypassed the plugin's commit
 * boundary inside an ideaspace.
 *
 * A commit in a nested code repo must not inherit the parent ideaspace's
 * nudge: compare git ownership of the cwd against git ownership of the
 * nearest `_agent/` contract, so a nested repo with its own contract still
 * nudges (both roots resolve to that nested repo) while a plain code repo
 * under an ideaspace stays silent.
 */
export async function shouldNudgeCommitCwd(cwd: string): Promise<boolean> {
  const abs = resolve(cwd);
  const agent = await findNearestAgent(abs);
  if (agent.source === "none" || !agent.root) return false;
  const cwdRepo = await resolveRepoRoot(abs);
  if (!cwdRepo) return false; // not a git repo — the commit failed anyway
  return (await resolveRepoRoot(agent.root)) === cwdRepo;
}

/**
 * Whether a Bash command line invokes `git commit` (possibly with global git
 * flags between `git` and the subcommand, e.g. `git -C dir -c k=v commit`).
 *
 * Tokenized rather than one flag-skipping regex: an ambiguous alternation
 * under a star is the ReDoS shape, and this now runs on every Bash call —
 * measured exponential on `git -a -a -a …` before the rewrite. Linear scan,
 * no ambiguity.
 *
 * Advisory precision: a quoted "git commit" inside an echo would match too.
 * The nudge never blocks and asks nothing, so a rare false positive costs a
 * sentence of context; a false negative costs an unattributed commit.
 */
export function isBashGitCommit(command: string): boolean {
  const tokens = command.split(/\s+/).filter(Boolean);
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i] !== "git" && !tokens[i].endsWith("/git")) continue;
    for (let j = i + 1; j < tokens.length; j++) {
      const t = tokens[j];
      if (t === "commit") return true;
      if (t === "-C" || t === "-c") {
        j++; // global flag that takes a value
        continue;
      }
      if (t.startsWith("-")) continue; // other global flags
      break; // first non-flag token is the subcommand, and it isn't commit
    }
  }
  return false;
}
