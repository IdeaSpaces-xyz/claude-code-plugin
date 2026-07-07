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

import { resolve, dirname, join, sep } from "node:path";
import { existsSync } from "node:fs";
import { readStdin } from "./stdin.js";

/** A knowledge path: a markdown file, or anything under an `_agent/` dir. */
function isKnowledgePath(path: string): boolean {
  return path.endsWith(".md") || path.split(sep).includes("_agent");
}

/**
 * Whether `startDir` is inside an ideaspace — an ancestor holding `_agent/`.
 * The same `_agent/`-marker convention as the SDK's `findSpaceRoot`, inlined as
 * a small fs walk so this hook carries no SDK import (build:hook ships no SDK).
 */
function inIdeaspace(startDir: string): boolean {
  let dir = resolve(startDir);
  for (;;) {
    if (existsSync(join(dir, "_agent"))) return true;
    const parent = dirname(dir);
    if (parent === dir) return false;
    dir = parent;
  }
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
  if (!inIdeaspace(dirname(abs))) return;

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
