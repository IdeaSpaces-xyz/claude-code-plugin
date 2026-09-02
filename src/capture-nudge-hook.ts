/**
 * PreToolUse hook (Bash) — a deterministic nudge on the commit bypass,
 * before the choice is made.
 *
 * When a Bash command is about to run `git commit` inside an ideaspace, the
 * commit would skip `is_commit`: no attribution trailers (assisting agent,
 * Conversation, open Change-Id), and a bare `git commit` in a shared checkout
 * can sweep a teammate's staged work. That bypass is the one native path with
 * a real cost, so it is the only one that gets a nudge — plain Write/Edit of
 * knowledge files stays silent (stage-tier work needs no ceremony; see the
 * agreement-tiers principle).
 *
 * Three properties, in order of what they cost when missing (worked out on
 * feature/skill-matching-w1 and salvaged from it):
 *
 *   1. **Fires before the choice.** As PostToolUse it could only issue a
 *      receipt for a decision already made.
 *   2. **Watches the verb that matters, and only that.** Bash `git commit`
 *      inside knowledge territory; nothing else.
 *   3. **Silent after the first.** At most one nudge per session — the first
 *      bypass is a signpost, the rest are the agent's informed choice.
 *
 * PreToolUse `additionalContext` is an honored channel: verified live on
 * 2026-09-02 against Claude Code 2.1.251 (the model quoted this nudge back
 * verbatim from a real session) and per the hooks reference. Markers under
 * ~/.ideaspaces/nudges/ are not garbage-collected — same characteristic as
 * the session and Change caches.
 *
 * It never sets `permissionDecision`: this informs, it does not gate. Errors
 * must never block the tool — they go to stderr with exit 0. Scoped to the
 * session cwd; advisory, never blocking.
 *
 * Bundled with `npm run build:hook`; the committed bundle ships pre-built.
 */

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname } from "node:path";
import { isBashGitCommit, nudgeMarkerPath, shouldNudgeCommitCwd } from "./capture-nudge.js";
import { readStdin } from "./stdin.js";

/** Record that the nudge fired. Failure to record is not worth failing over —
 *  the worst case is one repeated nudge, strictly better than blocking. */
function markFired(marker: string): void {
  try {
    mkdirSync(dirname(marker), { recursive: true });
    writeFileSync(marker, "");
  } catch {
    /* best effort */
  }
}

async function main(): Promise<void> {
  const raw = await readStdin();
  if (!raw.trim()) return;

  let input: { tool_input?: { command?: unknown }; cwd?: unknown; session_id?: unknown };
  try {
    input = JSON.parse(raw);
  } catch {
    return; // malformed input — say nothing
  }

  const command = input?.tool_input?.command;
  if (typeof command !== "string" || !isBashGitCommit(command)) return;
  const cwd = typeof input.cwd === "string" ? input.cwd : process.cwd();
  const sessionId = typeof input.session_id === "string" ? input.session_id : "";

  if (!(await shouldNudgeCommitCwd(cwd))) return;

  // Silent after the first this session. Without a session_id the marker
  // would collapse to one shared per-project file — silencing every future
  // session after the first ever nudge — so an absent id means nudge, not
  // remember (review catch on #94).
  if (sessionId) {
    const marker = nudgeMarkerPath(homedir(), sessionId, cwd);
    if (existsSync(marker)) return;
    markFired(marker);
  }

  const nudge =
    `About to run a Bash \`git commit\` inside this ideaspace, bypassing \`is_commit\` — ` +
    `it will carry no attribution trailers (assisting agent, Conversation, open Change-Id), ` +
    `and a bare \`git commit\` in a shared checkout can sweep someone else's staged work. ` +
    `For knowledge paths, prefer \`is_commit\` with explicit paths; ` +
    `if this commit is code or deliberate, carry on — this won't be repeated this session.`;

  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: { hookEventName: "PreToolUse", additionalContext: nudge },
    }) + "\n",
  );
}

main().catch((err: unknown) => {
  // Never block the tool. Log and exit 0.
  const message = err instanceof Error ? err.message : String(err);
  process.stderr.write(`capture-nudge-hook: ${message}\n`);
});
