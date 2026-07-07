#!/usr/bin/env node

// src/awareness-hook.ts
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join as join2 } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

// src/session-path.ts
import { createHash } from "node:crypto";
import { join, resolve } from "node:path";
function sessionIdCachePath(homeDir, projectDir) {
  const key = createHash("sha256").update(resolve(projectDir)).digest("hex").slice(0, 16);
  return join(homeDir, ".ideaspaces", "sessions", key);
}

// src/stdin.ts
async function readStdin() {
  if (process.stdin.isTTY) return "";
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf-8");
}

// src/awareness-hook.ts
function captureSessionId(raw) {
  if (!raw.trim()) return;
  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    return;
  }
  const sessionId = input.session_id;
  if (typeof sessionId !== "string" || !sessionId) return;
  const projectDir = process.env.CLAUDE_PROJECT_DIR?.trim() || (typeof input.cwd === "string" ? input.cwd : process.cwd());
  try {
    const file = sessionIdCachePath(homedir(), projectDir);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, sessionId + "\n");
  } catch {
  }
}
function resolveCli() {
  if (process.env.IS_CLI_PATH) return process.env.IS_CLI_PATH;
  const dir = dirname(fileURLToPath(import.meta.url));
  const rel = join2(dir, "../cli/bundle/ideaspaces.js");
  return existsSync(rel) ? rel : "ideaspaces";
}
async function main() {
  captureSessionId(await readStdin());
  const cwd = process.cwd();
  const cli = resolveCli();
  const isFile = cli.includes("/") || cli.includes("\\") || cli.endsWith(".js");
  const navArgs = ["--json", "navigate", ".", "--mark-seen"];
  const r = spawnSync(isFile ? "node" : cli, isFile ? [cli, ...navArgs] : navArgs, {
    cwd,
    encoding: "utf-8"
  });
  if (r.status !== 0) {
    if (r.stderr?.trim()) process.stderr.write(`awareness-hook: navigate failed: ${r.stderr.trim()}
`);
    return;
  }
  let text;
  try {
    text = JSON.parse(r.stdout).text;
  } catch {
    process.stderr.write("awareness-hook: could not parse navigate output\n");
    return;
  }
  if (typeof text === "string" && text.trim()) process.stdout.write(text + "\n");
}
main().catch((err) => {
  const message = err instanceof Error ? err.message : String(err);
  process.stderr.write(`awareness-hook: ${message}
`);
});
