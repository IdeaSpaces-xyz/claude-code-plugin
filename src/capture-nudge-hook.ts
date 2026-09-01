/**
 * PostToolUse hook (Bash) — a deterministic nudge on the commit bypass.
 *
 * When a Bash command runs `git commit` from inside an ideaspace, the commit
 * skipped `is_commit`: no attribution trailers (assisting agent, Conversation,
 * open Change-Id), and a bare `git commit` can sweep a teammate's staged work
 * in a shared checkout. That bypass is the one native path with a real cost,
 * so it is the only one that gets a nudge — plain Write/Edit of knowledge
 * files stays silent (stage-tier work needs no ceremony; see the
 * agreement-tiers principle).
 *
 * The nudge is retrospective (PostToolUse fires after the commit) and judges
 * nothing: it marks the observable moment for the agent's next decision.
 * Scoped to the session cwd; a `git -C elsewhere commit` is nudged or not by
 * the cwd's territory — advisory, never blocking.
 *
 * Output reaches the agent via `hookSpecificOutput.additionalContext` (exit 0).
 * Errors must never block the tool — they go to stderr with exit 0.
 *
 * Bundled with `npm run build:hook`; the committed bundle ships pre-built.
 */

import { isBashGitCommit, shouldNudgeCommitCwd } from "./capture-nudge.js";
import { readStdin } from "./stdin.js";

async function main(): Promise<void> {
  const raw = await readStdin();
  if (!raw.trim()) return;

  let input: { tool_input?: { command?: unknown }; cwd?: unknown };
  try {
    input = JSON.parse(raw);
  } catch {
    return; // malformed input — say nothing
  }

  const command = input?.tool_input?.command;
  if (typeof command !== "string" || !isBashGitCommit(command)) return;
  const cwd = typeof input.cwd === "string" ? input.cwd : process.cwd();

  if (!(await shouldNudgeCommitCwd(cwd))) return;

  const nudge =
    `A Bash \`git commit\` ran inside this ideaspace, bypassing \`is_commit\` — ` +
    `it carries no attribution trailers (assisting agent, Conversation, open Change-Id), ` +
    `and a bare \`git commit\` in a shared checkout can sweep someone else's staged work. ` +
    `For knowledge paths, prefer \`is_commit\` with explicit paths next time; ` +
    `if this commit was code or deliberate, ignore this.`;

  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: { hookEventName: "PostToolUse", additionalContext: nudge },
    }) + "\n",
  );
}

main().catch((err: unknown) => {
  // Never block the tool. Log and exit 0.
  const message = err instanceof Error ? err.message : String(err);
  process.stderr.write(`capture-nudge-hook: ${message}\n`);
});
