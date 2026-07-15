/**
 * PostToolUse hook (Write|Edit) — a deterministic capture nudge.
 *
 * When a *knowledge* file is written with the native Write/Edit tools — `*.md`
 * or anything under `_agent/`, inside an ideaspace — emit a short nudge toward
 * the plugin's capture flow. It does NOT judge whether the write is worth
 * capturing (that's the `is-capture` skill's job); it only marks the observable
 * moment: a knowledge write happened via native tools rather than `is_write`.
 *
 * Silent for everything else — source code, configs, build artifacts, markdown
 * outside an ideaspace, and markdown inside a nested code repo that does not
 * carry its own `_agent/` contract.
 *
 * Output reaches the agent via `hookSpecificOutput.additionalContext` (exit 0).
 * Errors must never block the tool — they go to stderr with exit 0.
 *
 * Bundled with `npm run build:hook`; the committed bundle ships pre-built.
 */

import { resolve } from "node:path";
import { shouldNudgeKnowledgePath } from "./capture-nudge.js";
import { readStdin } from "./stdin.js";

async function main(): Promise<void> {
  const raw = await readStdin();
  if (!raw.trim()) return;

  let input: { tool_input?: { file_path?: unknown }; cwd?: unknown };
  try {
    input = JSON.parse(raw);
  } catch {
    return; // malformed input — say nothing
  }

  const filePath = input?.tool_input?.file_path;
  if (typeof filePath !== "string" || !filePath) return;
  const cwd = typeof input.cwd === "string" ? input.cwd : process.cwd();
  const abs = resolve(cwd, filePath);

  // Silent outside an ideaspace and across a nested repo boundary unless that
  // nested repo carries its own `_agent/` contract.
  if (!shouldNudgeKnowledgePath(abs)) return;

  const nudge =
    `Knowledge file written with native Write/Edit: \`${filePath}\`. ` +
    `If this captures a decision, finding, or pattern worth keeping, prefer the plugin's ` +
    `capture flow — \`is_write\` (stages + tracks) → confirm → \`is_commit\`. ` +
    `If it's already captured or just a draft edit, ignore this.`;

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
