import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, openSync, readSync, closeSync, statSync, realpathSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// The plugin supplies Claude lifecycle facts; only the bundled CLI writes or derives run records.
const cli = join(dirname(fileURLToPath(import.meta.url)), "..", "cli", "bundle", "ideaspaces.js");

export function isInsideIdeaspace(cwd: string): boolean {
  // The full protocol manifest is assembled at SessionStart. On the prompt
  // path, loading it again would read Git and Content on every turn: this is
  // only a cheap contract-file gate, bounded by the first repository root.
  let cur = resolve(cwd);
  while (true) {
    if (existsSync(join(cur, "_agent", "agreement.md")) || existsSync(join(cur, "_agent", "foundation.md"))) return true;
    if (existsSync(join(cur, ".git"))) return false;
    const parent = dirname(cur);
    if (parent === cur) return false;
    cur = parent;
  }
}

function call(args: string[]): string | null {
  // A hook's cached session id is this run, not its parent. Run the CLI outside
  // the Space to avoid its cached-parent fallback; an explicit parent env remains.
  const result = spawnSync(process.execPath, [cli, ...args], {
    cwd: tmpdir(), encoding: "utf8", timeout: 1200, maxBuffer: 8 * 1024 * 1024,
    env: { ...process.env, IDEASPACES_PARENT_RUN_ID: process.env.IDEASPACES_PARENT_RUN_ID || "" },
  });
  if (result.status !== 0 || result.error) {
    process.stderr.write(`run-record-hook: CLI ${args[1]} failed: ${result.error?.message || result.stderr || result.status}\n`);
    return null;
  }
  return result.stdout;
}

export function recordClaudeRun(sessionId: string, agent: string, args: string[]): boolean {
  if (process.env.IDEASPACES_DISABLE_RUN_RECORDS === "1") return false;
  return call(["agent", "record", "--run-id", sessionId, "--agent", agent, "--harness", "claude", "--conversation", sessionId, ...args]) !== null;
}

function taskMarker(sessionId: string, agent: string): string {
  // An empty, user-private fast path, never a second run-record writer. The
  // CLI remains authoritative on the first prompt (including after restart).
  const key = createHash("sha256").update(`${homedir()}\0${agent}\0${sessionId}`).digest("hex");
  return join(tmpdir(), `ideaspaces-claude-first-task-${key}`);
}

export function recordFirstTask(sessionId: string, agent: string, message: string): void {
  const marker = taskMarker(sessionId, agent);
  if (existsSync(marker)) return;
  try {
    const output = call(["agent", "runs", "--agent", agent, "--json"]);
    if (!output) return; // Failed lookup must never overwrite the first task.
    const runs = JSON.parse(output).runs as Array<{ run_id: string; task?: string | null }>;
    if (!runs.some((run) => run.run_id === sessionId && !!run.task)) {
      recordClaudeRun(sessionId, agent, ["--message", message, "--status", "running"]);
    }
  } catch { /* malformed CLI output; no task written */ }
  finally {
    // Even a failed first attempt must not make every subsequent prompt wait
    // for a broken CLI. A future session without this tmp marker rechecks it.
    try { writeFileSync(marker, "", { flag: "wx", mode: 0o600 }); } catch { /* best effort */ }
  }
}

export function claudeTranscript(sessionId: string, cwd: string, supplied?: string): string | undefined {
  if (supplied && existsSync(supplied)) return supplied;
  let project = resolve(cwd);
  try { project = realpathSync(project); } catch { /* use resolved path */ }
  const config = process.env.CLAUDE_CONFIG_DIR?.trim() || join(homedir(), ".claude");
  const file = join(config, "projects", project.replace(/[^a-zA-Z0-9]/gu, "-"), `${sessionId}.jsonl`);
  return existsSync(file) ? file : undefined;
}

export function extractModelFromTranscriptTail(filePath?: string): string | undefined {
  if (!filePath || !existsSync(filePath)) return undefined;
  try {
    const size = statSync(filePath).size;
    // Claude can append >80 KiB attachments after its last assistant entry.
    // Bound the read, but retain enough of the tail to find that model.
    const bytes = Math.min(size, 256 * 1024);
    if (!bytes) return undefined;
    const buffer = Buffer.alloc(bytes);
    const fd = openSync(filePath, "r");
    try { readSync(fd, buffer, 0, bytes, size - bytes); } finally { closeSync(fd); }
    for (const line of buffer.toString("utf8").split("\n").reverse()) {
      try {
        const obj = JSON.parse(line);
        if (obj?.type === "assistant" && !obj.isSidechain) {
          const model = obj.message?.model || obj.requestedModel;
          if (typeof model === "string" && model.trim()) return model.trim();
        }
      } catch { /* partial line at tail boundary */ }
    }
  } catch { /* missing or unreadable transcript */ }
  return undefined;
}
