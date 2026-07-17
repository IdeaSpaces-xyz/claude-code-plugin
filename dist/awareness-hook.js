#!/usr/bin/env node

// src/awareness-hook.ts
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";
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
function changeCachePath(homeDir, projectDir) {
  const key = createHash("sha256").update(resolve(projectDir)).digest("hex").slice(0, 16);
  return join(homeDir, ".ideaspaces", "changes", key);
}

// src/change-line.ts
var CHANGE_ID_SHAPE = /^chg_[a-z0-9]+(-[a-z0-9]+)*$/;
function parseChangeRecord(raw) {
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return void 0;
  }
  if (typeof parsed !== "object" || parsed === null) return void 0;
  const rec = parsed;
  if (typeof rec.change_id !== "string" || !CHANGE_ID_SHAPE.test(rec.change_id)) return void 0;
  return {
    change_id: rec.change_id,
    handle: typeof rec.handle === "string" ? rec.handle : void 0,
    opened_at: typeof rec.opened_at === "number" ? rec.opened_at : void 0,
    session_id: typeof rec.session_id === "string" ? rec.session_id : void 0
  };
}
function age(openedAt, now) {
  if (!openedAt || openedAt > now) return void 0;
  const days = Math.floor((now - openedAt) / 864e5);
  return days < 1 ? "today" : `${days}d ago`;
}
function renderChangeLine(rec, currentSessionId, now) {
  const opened = age(rec.opened_at, now);
  const handle = rec.handle ? ` ("${rec.handle}")` : "";
  if (rec.session_id && currentSessionId && rec.session_id === currentSessionId) {
    return `Change open: ${rec.change_id}${handle} (this session${opened ? `, opened ${opened}` : ""}) \u2014 stamping every is_commit; close with is_change_close when the decision lands.`;
  }
  return `\u26A0 Change open: ${rec.change_id}${handle} (opened ${opened ?? "in a previous session"}${opened ? ", previous session" : ""}) \u2014 resume with is_change_open({ id: "${rec.change_id}" }) or clear with is_change_close.`;
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
  const fallbackDir = process.env.CLAUDE_PROJECT_DIR?.trim() || process.cwd();
  if (!raw.trim()) return { projectDir: fallbackDir };
  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    return { projectDir: fallbackDir };
  }
  const projectDir = process.env.CLAUDE_PROJECT_DIR?.trim() || (typeof input.cwd === "string" && input.cwd ? input.cwd : process.cwd());
  const sessionId = input.session_id;
  if (typeof sessionId !== "string" || !sessionId) return { projectDir };
  try {
    const file = sessionIdCachePath(homedir(), projectDir);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, sessionId + "\n");
  } catch {
  }
  return { sessionId, projectDir };
}
function changeLine(sessionId, projectDir) {
  try {
    const raw = readFileSync(changeCachePath(homedir(), projectDir), "utf-8");
    const rec = parseChangeRecord(raw);
    return rec ? renderChangeLine(rec, sessionId, Date.now()) : void 0;
  } catch {
    return void 0;
  }
}
function resolveCli() {
  if (process.env.IS_CLI_PATH) return process.env.IS_CLI_PATH;
  const dir = dirname(fileURLToPath(import.meta.url));
  const rel = join2(dir, "../cli/bundle/ideaspaces.js");
  return existsSync(rel) ? rel : "ideaspaces";
}
async function main() {
  const { sessionId, projectDir } = captureSessionId(await readStdin());
  const openChange = changeLine(sessionId, projectDir);
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
    if (openChange) process.stdout.write(openChange + "\n");
    return;
  }
  let text;
  try {
    text = JSON.parse(r.stdout).text;
  } catch {
    process.stderr.write("awareness-hook: could not parse navigate output\n");
    if (openChange) process.stdout.write(openChange + "\n");
    return;
  }
  if (typeof text === "string" && text.trim()) process.stdout.write(text + "\n");
  if (openChange) process.stdout.write(openChange + "\n");
}
main().catch((err) => {
  const message = err instanceof Error ? err.message : String(err);
  process.stderr.write(`awareness-hook: ${message}
`);
});
