#!/usr/bin/env node

// src/capture-nudge-hook.ts
import { resolve as resolve2 } from "node:path";

// src/capture-nudge.ts
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join, resolve, sep } from "node:path";
function isKnowledgePath(path) {
  const normalized = resolve(path);
  return normalized.endsWith(".md") || normalized.split(sep).includes("_agent");
}
function nearestAgentRoot(startDir) {
  let dir = resolve(startDir);
  for (; ; ) {
    if (existsSync(join(dir, "_agent"))) return dir;
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}
function gitRootForDir(dir) {
  const result = spawnSync("git", ["-C", resolve(dir), "rev-parse", "--show-toplevel"], {
    encoding: "utf-8",
    timeout: 5e3
  });
  return result.status === 0 && result.stdout.trim() ? resolve(result.stdout.trim()) : null;
}
function shouldNudgeKnowledgePath(filePath) {
  const absPath = resolve(filePath);
  if (!isKnowledgePath(absPath)) return false;
  const agentRoot = nearestAgentRoot(dirname(absPath));
  if (!agentRoot) return false;
  const fileGitRoot = gitRootForDir(dirname(absPath));
  if (!fileGitRoot) return true;
  return gitRootForDir(agentRoot) === fileGitRoot;
}

// src/stdin.ts
async function readStdin() {
  if (process.stdin.isTTY) return "";
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf-8");
}

// src/capture-nudge-hook.ts
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
  const abs = resolve2(cwd, filePath);
  if (!shouldNudgeKnowledgePath(abs)) return;
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
