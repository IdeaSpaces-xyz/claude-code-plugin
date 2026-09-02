#!/usr/bin/env node
import { createRequire as __isCreateRequire } from "node:module";
const require = __isCreateRequire(import.meta.url);

// src/capture-nudge-hook.ts
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname as dirname2 } from "node:path";

// node_modules/@ideaspaces/protocol/dist/space.js
import { promises as fs } from "node:fs";
import { dirname, join, resolve } from "node:path";
var CONTRACT_FILES = [
  "foundation",
  "guide",
  "purpose",
  "now",
  "next"
];
async function findNearestAgent(cwd) {
  let dir = resolve(cwd);
  while (true) {
    const agentDir = join(dir, "_agent");
    if (await isDirectory(agentDir)) {
      const contract = await readContract(agentDir);
      return { root: dir, contract, source: "local" };
    }
    const parent = dirname(dir);
    if (parent === dir) {
      return { root: null, contract: {}, source: "none" };
    }
    dir = parent;
  }
}
async function isDirectory(path) {
  try {
    const stat = await fs.stat(path);
    return stat.isDirectory();
  } catch {
    return false;
  }
}
async function readContract(agentDir) {
  const entries = {};
  await Promise.all(CONTRACT_FILES.map(async (name) => {
    const path = join(agentDir, `${name}.md`);
    try {
      const content = await fs.readFile(path, "utf-8");
      entries[name] = { path, content };
    } catch {
    }
  }));
  return entries;
}

// node_modules/@ideaspaces/protocol/dist/git.js
import { spawn } from "node:child_process";
function runGit(repoRoot, args) {
  return new Promise((resolve3) => {
    const proc = spawn("git", ["-C", repoRoot, ...args], {
      stdio: ["ignore", "pipe", "pipe"]
    });
    let out = "";
    proc.stdout.on("data", (d) => out += d);
    proc.on("close", (code) => resolve3({ ok: code === 0, out, code }));
    proc.on("error", () => resolve3({ ok: false, out: "", code: null }));
  });
}
async function resolveRepoRoot(cwd) {
  const result = await runGit(cwd, ["rev-parse", "--show-toplevel"]);
  return result.ok ? result.out.trim() || null : null;
}

// src/capture-nudge.ts
import { createHash } from "node:crypto";
import { join as join2, resolve as resolve2 } from "node:path";
async function shouldNudgeCommitCwd(cwd) {
  const abs = resolve2(cwd);
  const agent = await findNearestAgent(abs);
  if (agent.source === "none" || !agent.root) return false;
  const cwdRepo = await resolveRepoRoot(abs);
  if (!cwdRepo) return false;
  return await resolveRepoRoot(agent.root) === cwdRepo;
}
function isBashGitCommit(command) {
  const tokens = command.split(/\s+/).filter(Boolean);
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i] !== "git" && !tokens[i].endsWith("/git")) continue;
    for (let j = i + 1; j < tokens.length; j++) {
      const t = tokens[j];
      if (t === "commit") return true;
      if (t === "-C" || t === "-c") {
        j++;
        continue;
      }
      if (t.startsWith("-")) continue;
      break;
    }
  }
  return false;
}
function nudgeMarkerPath(homeDir, sessionId, projectDir) {
  const key = createHash("sha256").update(`${sessionId}\0${resolve2(projectDir)}\0commit`).digest("hex").slice(0, 16);
  return join2(homeDir, ".ideaspaces", "nudges", key);
}

// src/stdin.ts
async function readStdin() {
  if (process.stdin.isTTY) return "";
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf-8");
}

// src/capture-nudge-hook.ts
function markFired(marker) {
  try {
    mkdirSync(dirname2(marker), { recursive: true });
    writeFileSync(marker, "");
  } catch {
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
  const command = input?.tool_input?.command;
  if (typeof command !== "string" || !isBashGitCommit(command)) return;
  const cwd = typeof input.cwd === "string" ? input.cwd : process.cwd();
  const sessionId = typeof input.session_id === "string" ? input.session_id : "";
  if (!await shouldNudgeCommitCwd(cwd)) return;
  const marker = nudgeMarkerPath(homedir(), sessionId, cwd);
  if (existsSync(marker)) return;
  markFired(marker);
  const nudge = `About to run a Bash \`git commit\` inside this ideaspace, bypassing \`is_commit\` \u2014 it will carry no attribution trailers (assisting agent, Conversation, open Change-Id), and a bare \`git commit\` in a shared checkout can sweep someone else's staged work. For knowledge paths, prefer \`is_commit\` with explicit paths; if this commit is code or deliberate, carry on \u2014 this won't be repeated this session.`;
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: { hookEventName: "PreToolUse", additionalContext: nudge }
    }) + "\n"
  );
}
main().catch((err) => {
  const message = err instanceof Error ? err.message : String(err);
  process.stderr.write(`capture-nudge-hook: ${message}
`);
});
