/**
 * PostToolUse hook (Write|Edit) — a deterministic capture nudge.
 *
 * When a *knowledge* file is written with the native Write/Edit tools — `*.md`
 * or anything under `_agent/`, inside an ideaspace — emit a short nudge toward
 * the plugin's capture flow. It does NOT judge whether the write is worth
 * capturing (that's the `is-capture` skill's job); it only marks the observable
 * moment: a knowledge write happened via native tools rather than `is_write`.
 *
 * Silent for everything else — source code, configs, build artifacts, and any
 * markdown outside an ideaspace. A root ideaspace can contain code repos; this
 * never fires on arbitrary source changes.
 *
 * Output reaches the agent via `hookSpecificOutput.additionalContext` (exit 0).
 * Errors must never block the tool — they go to stderr with exit 0.
 *
 * Bundled with `npm run build:hook`; the committed bundle ships pre-built.
 */

import { resolve, dirname, sep } from "node:path";
import { findSpaceRoot } from "@ideaspaces/sdk";

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString("utf-8");
}

/** A knowledge path: a markdown file, or anything under an `_agent/` dir. */
function isKnowledgePath(path: string): boolean {
  return path.endsWith(".md") || path.split(sep).includes("_agent");
}

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

  // Code, configs, build artifacts → not knowledge → silent.
  if (!isKnowledgePath(abs)) return;

  // Only inside an ideaspace (an `_agent/` ancestor). Stray markdown in a
  // non-ideaspace repo doesn't nudge.
  const space = await findSpaceRoot(dirname(abs));
  if (space.source === "none") return;

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
