#!/usr/bin/env node

// src/capture-nudge-hook.ts
import { resolve, dirname, join, sep } from "node:path";
import { existsSync } from "node:fs";

// src/stdin.ts
async function readStdin() {
  if (process.stdin.isTTY) return "";
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf-8");
}

// src/capture-nudge-hook.ts
function isKnowledgePath(path) {
  return path.endsWith(".md") || path.split(sep).includes("_agent");
}
function inIdeaspace(startDir) {
  let dir = resolve(startDir);
  for (; ; ) {
    if (existsSync(join(dir, "_agent"))) return true;
    const parent = dirname(dir);
    if (parent === dir) return false;
    dir = parent;
  }
}
async function main() {
  const raw = await readStdin();
  if (!raw.trim()) return;
  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    return;
  }
  const filePath = input?.tool_input?.file_path;
  if (typeof filePath !== "string" || !filePath) return;
  const cwd = typeof input.cwd === "string" ? input.cwd : process.cwd();
  const abs = resolve(cwd, filePath);
  if (!isKnowledgePath(abs)) return;
  if (!inIdeaspace(dirname(abs))) return;
  const nudge = `Knowledge file written with native Write/Edit: \`${filePath}\`. If this captures a decision, finding, or pattern worth keeping, prefer the plugin's capture flow \u2014 \`is_write\` (stages + tracks) \u2192 confirm \u2192 \`is_commit\`. If it's already captured or just a draft edit, ignore this.`;
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: { hookEventName: "PostToolUse", additionalContext: nudge }
    }) + "\n"
  );
}
main().catch((err) => {
  const message = err instanceof Error ? err.message : String(err);
  process.stderr.write(`capture-nudge-hook: ${message}
`);
});
