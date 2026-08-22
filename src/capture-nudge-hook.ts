/**
 * PreToolUse hook (Write|Edit|Bash) — a deterministic capture nudge.
 *
 * Two bypasses of the plugin's capture flow are worth marking, both *before*
 * they happen:
 *
 *   - a *knowledge* file written with native Write/Edit — `*.md` or anything
 *     under `_agent/`, inside an ideaspace — instead of `is_write`;
 *   - a hand-rolled `git commit` inside an ideaspace instead of `is_commit`,
 *     which is the one with a real cost: `is_commit` scopes the commit to the
 *     paths you named and stamps attribution, and a bare `git commit` can
 *     sweep a concurrent session's staged work into your commit.
 *
 * It does NOT judge whether the write is worth capturing (that's the
 * `is-capture` skill's job); it marks the observable moment while the choice
 * is still open.
 *
 * Three properties this hook is built for, in order of how much they cost when
 * missing:
 *
 *   1. **Fires before the choice.** As PostToolUse it could only ever issue a
 *      receipt for a decision already made.
 *   2. **Watches the verb that matters.** The Write|Edit-only matcher nagged
 *      about harmless file writes and never saw `git commit`.
 *   3. **Silent when there is nothing to say.** At most one nudge per kind per
 *      session — the first bypass is a signpost, the rest are the agent's
 *      informed choice. A nudge on every write is noise, and an agent working
 *      in this very repo reported reading it as noise and continuing.
 *
 * Output reaches the agent via `hookSpecificOutput.additionalContext` (exit 0).
 * It never sets `permissionDecision`: this informs, it does not gate. Errors
 * must never block the tool — they go to stderr with exit 0.
 *
 * Bundled with `npm run build:hook`; the committed bundle ships pre-built.
 */

import { mkdirSync, existsSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, resolve } from "node:path";
import {
  isGitCommit,
  nudgeMarkerPath,
  shouldNudgeKnowledgeCommit,
  shouldNudgeKnowledgePath,
  type NudgeKind,
} from "./capture-nudge.js";
import { readStdin } from "./stdin.js";

interface HookInput {
  tool_name?: unknown;
  tool_input?: { file_path?: unknown; command?: unknown };
  cwd?: unknown;
  session_id?: unknown;
}

const NUDGE: Record<NudgeKind, (subject: string) => string> = {
  write: (path) =>
    `About to write a knowledge file with native Write/Edit: \`${path}\`. ` +
    `If this captures a decision, finding, or pattern worth keeping, prefer the plugin's ` +
    `capture flow — \`is_write\` (stages + tracks) → confirm → \`is_commit\`. ` +
    `If it's a draft edit or already captured, carry on; this won't be repeated.`,
  commit: (command) =>
    `About to commit by hand inside an ideaspace: \`${command}\`. ` +
    `\`is_commit\` commits only the paths you name and stamps attribution — a bare ` +
    `\`git commit\` can sweep another session's staged work into your commit. ` +
    `If you meant to commit code, or scoped this yourself, carry on; this won't be repeated.`,
};

/** Record that a nudge fired. Failure to record is not worth failing over — the
 *  worst case is one repeated nudge, which is strictly better than blocking. */
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

  let input: HookInput;
  try {
    input = JSON.parse(raw);
  } catch {
    return; // malformed input — say nothing
  }

  const cwd = typeof input.cwd === "string" ? input.cwd : process.cwd();
  const sessionId = typeof input.session_id === "string" ? input.session_id : "";

  let kind: NudgeKind;
  let subject: string;

  const filePath = input.tool_input?.file_path;
  const command = input.tool_input?.command;

  if (typeof filePath === "string" && filePath) {
    if (!(await shouldNudgeKnowledgePath(resolve(cwd, filePath)))) return;
    kind = "write";
    subject = filePath;
  } else if (typeof command === "string" && isGitCommit(command)) {
    if (!(await shouldNudgeKnowledgeCommit(cwd))) return;
    kind = "commit";
    subject = command.length > 120 ? `${command.slice(0, 117)}...` : command;
  } else {
    return;
  }

  // Silent after the first of its kind this session.
  const marker = nudgeMarkerPath(homedir(), sessionId, cwd, kind);
  if (existsSync(marker)) return;
  markFired(marker);

  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        additionalContext: NUDGE[kind](subject),
      },
    }) + "\n",
  );
}

main().catch((err: unknown) => {
  // Never block the tool. Log and exit 0.
  const message = err instanceof Error ? err.message : String(err);
  process.stderr.write(`capture-nudge-hook: ${message}\n`);
});
