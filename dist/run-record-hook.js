#!/usr/bin/env node
import { createRequire as __isCreateRequire } from "node:module";
const require = __isCreateRequire(import.meta.url);

// src/agent-run.ts
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, openSync, readSync, closeSync, statSync, realpathSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
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
    timeout: 1200,
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
function taskMarker(sessionId, agent) {
  const key = createHash("sha256").update(`${homedir()}\0${agent}\0${sessionId}`).digest("hex");
  return join(tmpdir(), `ideaspaces-claude-first-task-${key}`);
}
function recordFirstTask(sessionId, agent, message) {
  const marker = taskMarker(sessionId, agent);
  if (existsSync(marker)) return;
  try {
    const output = call(["agent", "runs", "--agent", agent, "--json"]);
    if (!output) return;
    const runs = JSON.parse(output).runs;
    if (!runs.some((run) => run.run_id === sessionId && !!run.task)) {
      recordClaudeRun(sessionId, agent, ["--message", message, "--status", "running"]);
    }
  } catch {
  } finally {
    try {
      writeFileSync(marker, "", { flag: "wx", mode: 384 });
    } catch {
    }
  }
}
function claudeTranscript(sessionId, cwd, supplied) {
  if (supplied && existsSync(supplied)) return supplied;
  let project = resolve(cwd);
  try {
    project = realpathSync(project);
  } catch {
  }
  const config = process.env.CLAUDE_CONFIG_DIR?.trim() || join(homedir(), ".claude");
  const file = join(config, "projects", project.replace(/[^a-zA-Z0-9]/gu, "-"), `${sessionId}.jsonl`);
  return existsSync(file) ? file : void 0;
}
function extractModelFromTranscriptTail(filePath) {
  if (!filePath || !existsSync(filePath)) return void 0;
  try {
    const size = statSync(filePath).size;
    const bytes = Math.min(size, 256 * 1024);
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
  if (process.env.IDEASPACES_DISABLE_RUN_RECORDS === "1" || !isInsideIdeaspace(cwd)) return;
  if (input.hook_event_name === "UserPromptSubmit") {
    if (typeof input.prompt === "string" && input.prompt.trim()) {
      recordFirstTask(sessionId, cwd, input.prompt);
    }
  } else {
    const model = extractModelFromTranscriptTail(claudeTranscript(sessionId, cwd, input.transcript_path));
    recordClaudeRun(sessionId, cwd, ["--status", "completed", ...model ? ["--model-observed", model] : []]);
  }
}
main().catch((err) => {
  process.stderr.write(`run-record-hook: ${err instanceof Error ? err.message : String(err)}
`);
});
