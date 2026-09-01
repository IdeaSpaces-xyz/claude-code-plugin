#!/usr/bin/env node
import { createRequire as __isCreateRequire } from "node:module";
const require = __isCreateRequire(import.meta.url);

// src/capture-nudge-hook.ts
import { resolve as resolve3 } from "node:path";

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

// node_modules/@ideaspaces/protocol/dist/repository-path.js
var AGENT_DIRECTORY = "_agent";
function classifyRepositoryPath(path, kind) {
  if (kind !== "file" && kind !== "directory") {
    return { status: "invalid", code: "invalid_kind" };
  }
  if (typeof path !== "string" || path.length === 0 || path.startsWith("/") || path.endsWith("/") || path.includes("//") || path.includes("\\") || path.includes("\0")) {
    return { status: "invalid", code: "invalid_path" };
  }
  const segments = path.split("/");
  if (segments.some((segment) => segment === "." || segment === "..")) {
    return { status: "invalid", code: "invalid_path" };
  }
  const directorySegments = kind === "directory" ? segments : segments.slice(0, -1);
  for (const segment of directorySegments) {
    if (segment.toLowerCase() === ".git") {
      return { status: "ok", role: "reserved" };
    }
    if (segment.startsWith("_")) {
      if (segment === AGENT_DIRECTORY) {
        return { status: "ok", role: "agent-context" };
      }
      return { status: "ok", role: "extension", extension: segment };
    }
  }
  if (kind === "file" && segments.at(-1).endsWith(".md")) {
    return { status: "ok", role: "knowledge" };
  }
  return { status: "ok", role: "ordinary" };
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
  const classification = classifyRepositoryPath(path.replace(/\\/g, "/"), "file");
  return classification.status === "ok" && (classification.role === "knowledge" || classification.role === "agent-context" || classification.role === "extension");
}

// src/capture-nudge.ts
import { realpath } from "node:fs/promises";
import { basename, dirname as dirname2, join as join2, relative, resolve as resolve2 } from "node:path";
async function canonicalExistingPath(path) {
  try {
    return await realpath(path);
  } catch {
    return resolve2(path);
  }
}
async function shouldNudgeKnowledgePath(filePath) {
  const absPath = resolve2(filePath);
  const agent = await findNearestAgent(dirname2(absPath));
  if (agent.source === "none" || !agent.root) return false;
  const fileGitRoot = await resolveRepoRoot(dirname2(absPath));
  const classificationRoot = fileGitRoot ?? await canonicalExistingPath(agent.root);
  const canonicalParent = await canonicalExistingPath(dirname2(absPath));
  const canonicalPath = join2(canonicalParent, basename(absPath));
  const portablePath = relative(classificationRoot, canonicalPath).replace(/\\/g, "/");
  if (portablePath === ".." || portablePath.startsWith("../") || !isIdeaspacePath(portablePath)) {
    return false;
  }
  if (!fileGitRoot) return true;
  return await resolveRepoRoot(agent.root) === fileGitRoot;
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
  const abs = resolve3(cwd, filePath);
  if (!await shouldNudgeKnowledgePath(abs)) return;
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
