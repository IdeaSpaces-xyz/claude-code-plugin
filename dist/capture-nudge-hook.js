#!/usr/bin/env node
import { createRequire as __isCreateRequire } from "node:module";
const require = __isCreateRequire(import.meta.url);

// src/capture-nudge-hook.ts
import { mkdirSync, existsSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname as dirname3, resolve as resolve3 } from "node:path";

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
  return new Promise((resolve4) => {
    const proc = spawn("git", ["-C", repoRoot, ...args], {
      stdio: ["ignore", "pipe", "pipe"]
    });
    let out = "";
    proc.stdout.on("data", (d) => out += d);
    proc.on("close", (code) => resolve4({ ok: code === 0, out, code }));
    proc.on("error", () => resolve4({ ok: false, out: "", code: null }));
  });
}
async function resolveRepoRoot(cwd) {
  const result = await runGit(cwd, ["rev-parse", "--show-toplevel"]);
  return result.ok ? result.out.trim() || null : null;
}
function isIdeaspacePath(path) {
  const normalized = path.replace(/\\/g, "/");
  return normalized.endsWith(".md") || normalized.split("/").includes("_agent");
}

// src/capture-nudge.ts
import { createHash } from "node:crypto";
import { dirname as dirname2, join as join2, resolve as resolve2 } from "node:path";
async function shouldNudgeKnowledgePath(filePath) {
  const absPath = resolve2(filePath);
  if (!isIdeaspacePath(absPath)) return false;
  const agent = await findNearestAgent(dirname2(absPath));
  if (agent.source === "none" || !agent.root) return false;
  const fileGitRoot = await resolveRepoRoot(dirname2(absPath));
  if (!fileGitRoot) return true;
  return await resolveRepoRoot(agent.root) === fileGitRoot;
}
async function shouldNudgeKnowledgeCommit(cwd) {
  const agent = await findNearestAgent(resolve2(cwd));
  return agent.source !== "none" && Boolean(agent.root);
}
function isGitCommit(command) {
  return command.split(/&&|\|\||[;|\n]/).some(
    (segment) => /(?:^|\s|\$\(|`)(?:\w+=\S*\s+)*git\s+(?:-[Cc]\s+\S+\s+)*commit(?:\s|$)/.test(segment)
  );
}
function nudgeMarkerPath(homeDir, sessionId, projectDir, kind) {
  const key = createHash("sha256").update(`${sessionId}\0${resolve2(projectDir)}\0${kind}`).digest("hex").slice(0, 16);
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
var NUDGE = {
  write: (path) => `About to write a knowledge file with native Write/Edit: \`${path}\`. If this captures a decision, finding, or pattern worth keeping, prefer the plugin's capture flow \u2014 \`is_write\` (stages + tracks) \u2192 confirm \u2192 \`is_commit\`. If it's a draft edit or already captured, carry on; this won't be repeated.`,
  commit: (command) => `About to commit by hand inside an ideaspace: \`${command}\`. \`is_commit\` commits only the paths you name and stamps attribution \u2014 a bare \`git commit\` can sweep another session's staged work into your commit. If you meant to commit code, or scoped this yourself, carry on; this won't be repeated.`
};
function markFired(marker) {
  try {
    mkdirSync(dirname3(marker), { recursive: true });
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
  const cwd = typeof input.cwd === "string" ? input.cwd : process.cwd();
  const sessionId = typeof input.session_id === "string" ? input.session_id : "";
  let kind;
  let subject;
  const filePath = input.tool_input?.file_path;
  const command = input.tool_input?.command;
  if (typeof filePath === "string" && filePath) {
    if (!await shouldNudgeKnowledgePath(resolve3(cwd, filePath))) return;
    kind = "write";
    subject = filePath;
  } else if (typeof command === "string" && isGitCommit(command)) {
    if (!await shouldNudgeKnowledgeCommit(cwd)) return;
    kind = "commit";
    subject = command.length > 120 ? `${command.slice(0, 117)}...` : command;
  } else {
    return;
  }
  const marker = nudgeMarkerPath(homedir(), sessionId, cwd, kind);
  if (existsSync(marker)) return;
  markFired(marker);
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        additionalContext: NUDGE[kind](subject)
      }
    }) + "\n"
  );
}
main().catch((err) => {
  const message = err instanceof Error ? err.message : String(err);
  process.stderr.write(`capture-nudge-hook: ${message}
`);
});
