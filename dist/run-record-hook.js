#!/usr/bin/env node
import { createRequire as __isCreateRequire } from "node:module";
const require = __isCreateRequire(import.meta.url);

// src/agent-run.ts
import { spawnSync } from "node:child_process";
import { existsSync, openSync, readSync, closeSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
var cli = join(dirname(fileURLToPath(import.meta.url)), "..", "cli", "bundle", "ideaspaces.js");
function isInsideIdeaspace(cwd) {
  let cur = resolve(cwd);
  while (true) {
    if (existsSync(join(cur, "_agent", "agreement.md")) || existsSync(join(cur, "_agent", "foundation.md"))) return true;
    if (existsSync(join(cur, ".git"))) return false;
    const parent = dirname(cur);
    if (parent === cur) return false;
    cur = parent;
  }
}
function call(args) {
  const result = spawnSync(process.execPath, [cli, ...args], {
    cwd: tmpdir(),
    encoding: "utf8",
    timeout: 3e3,
    maxBuffer: 8 * 1024 * 1024,
    env: { ...process.env, IDEASPACES_PARENT_RUN_ID: process.env.IDEASPACES_PARENT_RUN_ID || "" }
  });
  if (result.status !== 0 || result.error) {
    process.stderr.write(`run-record-hook: CLI ${args[1]} failed: ${result.error?.message || result.stderr || result.status}
`);
    return null;
  }
  return result.stdout;
}
function recordClaudeRun(sessionId, agent, args) {
  if (process.env.IDEASPACES_DISABLE_RUN_RECORDS === "1") return false;
  return call(["agent", "record", "--run-id", sessionId, "--agent", agent, "--harness", "claude", "--conversation", sessionId, ...args]) !== null;
}
function hasTask(sessionId, agent) {
  const output = call(["agent", "runs", "--agent", agent, "--json"]);
  if (!output) return true;
  try {
    const runs = JSON.parse(output).runs;
    return runs.some((run) => run.run_id === sessionId && !!run.task);
  } catch {
    return true;
  }
}
function extractModelFromTranscriptTail(filePath) {
  if (!filePath || !existsSync(filePath)) return void 0;
  try {
    const size = statSync(filePath).size;
    const bytes = Math.min(size, 16 * 1024);
    if (!bytes) return void 0;
    const buffer = Buffer.alloc(bytes);
    const fd = openSync(filePath, "r");
    try {
      readSync(fd, buffer, 0, bytes, size - bytes);
    } finally {
      closeSync(fd);
    }
    for (const line of buffer.toString("utf8").split("\n").reverse()) {
      try {
        const obj = JSON.parse(line);
        if (obj?.type === "assistant" && !obj.isSidechain) {
          const model = obj.message?.model || obj.requestedModel;
          if (typeof model === "string" && model.trim()) return model.trim();
        }
      } catch {
      }
    }
  } catch {
  }
  return void 0;
}

// src/stdin.ts
async function readStdin() {
  if (process.stdin.isTTY) return "";
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf-8");
}

// src/run-record-hook.ts
async function main() {
  const raw = await readStdin();
  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    return;
  }
  if (!input || input.hook_event_name !== "UserPromptSubmit" && input.hook_event_name !== "SessionEnd") return;
  const sessionId = input.session_id;
  if (typeof sessionId !== "string" || !sessionId) return;
  const cwd = process.env.CLAUDE_PROJECT_DIR?.trim() || input.cwd || process.cwd();
  if (!isInsideIdeaspace(cwd)) return;
  if (input.hook_event_name === "UserPromptSubmit") {
    if (typeof input.prompt === "string" && input.prompt.trim() && !hasTask(sessionId, cwd)) {
      recordClaudeRun(sessionId, cwd, ["--message", input.prompt, "--status", "running"]);
    }
  } else {
    const model = extractModelFromTranscriptTail(input.transcript_path);
    recordClaudeRun(sessionId, cwd, ["--status", "completed", ...model ? ["--model-observed", model] : []]);
  }
}
main().catch((err) => {
  process.stderr.write(`run-record-hook: ${err instanceof Error ? err.message : String(err)}
`);
});
