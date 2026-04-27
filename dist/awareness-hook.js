#!/usr/bin/env node

// node_modules/@ideaspaces/sdk/dist/space.js
import { promises as fs } from "node:fs";
import { dirname, join, resolve } from "node:path";
var CONTRACT_FILES = [
  "foundation",
  "guide",
  "purpose",
  "now",
  "next"
];
async function findSpaceRoot(cwd) {
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

// node_modules/@ideaspaces/sdk/dist/awareness.js
import { promises as fs2 } from "node:fs";
import { spawn } from "node:child_process";
import { join as join2 } from "node:path";

// node_modules/@ideaspaces/sdk/dist/frontmatter.js
var DELIM = "---";
function stripFrontmatter(content) {
  if (!content.startsWith(`${DELIM}
`) && !content.startsWith(`${DELIM}\r
`)) {
    return content;
  }
  const lines = content.split("\n");
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trimEnd() === DELIM) {
      return lines.slice(i + 1).join("\n");
    }
  }
  return content;
}

// node_modules/@ideaspaces/sdk/dist/awareness.js
var SKIP_DIRS = /* @__PURE__ */ new Set([
  "_agent",
  "node_modules",
  ".git",
  ".github",
  ".vscode",
  ".idea",
  "dist",
  "build"
]);
var CONTRACT_ORDER = ["foundation", "guide", "purpose", "now", "next"];
async function assembleAwareness(opts) {
  const { root, contract, lastSha, maxChanges = 15, nowExcerptLength = 200 } = opts;
  const sections = [];
  const nowLine = extractNowLine(contract, nowExcerptLength);
  if (nowLine)
    sections.push(`Now: ${nowLine}`);
  const tree = await buildTreeSection(root);
  if (tree)
    sections.push(tree);
  const agentContext = CONTRACT_ORDER.filter((name) => contract[name]);
  if (agentContext.length) {
    sections.push(`Agent context: ${agentContext.join(", ")}`);
  }
  if (lastSha) {
    const changes = await gitChanges(root, lastSha);
    if (changes.length) {
      const total = changes.length;
      const head = changes.slice(0, maxChanges);
      const lines = [`Since last session (${total} changes):`];
      for (const c of head)
        lines.push(`  ${c}`);
      if (total > maxChanges)
        lines.push(`  ... and ${total - maxChanges} more`);
      sections.push(lines.join("\n"));
    }
  }
  return sections.join("\n\n");
}
function extractNowLine(contract, max) {
  if (!contract.now)
    return null;
  const body = stripFrontmatter(contract.now.content);
  for (const raw of body.split("\n")) {
    const line = raw.trim();
    if (!line)
      continue;
    if (line.startsWith("#"))
      continue;
    if (line.startsWith(">")) {
      const stripped = line.replace(/^>+\s*/, "").trim();
      if (stripped)
        return truncate(stripped, max);
      continue;
    }
    return truncate(line, max);
  }
  return null;
}
function truncate(s, max) {
  return s.length <= max ? s : `${s.slice(0, max).trimEnd()}\u2026`;
}
async function buildTreeSection(root) {
  let entries;
  try {
    const dirents = await fs2.readdir(root, { withFileTypes: true });
    entries = dirents.filter((e) => !e.name.startsWith(".") || e.name === ".gitignore").map((e) => ({ name: e.name, isDir: e.isDirectory() }));
  } catch {
    return null;
  }
  const dirs = entries.filter((e) => e.isDir && !SKIP_DIRS.has(e.name)).map((e) => e.name).sort();
  const files = entries.filter((e) => !e.isDir && e.name.endsWith(".md")).map((e) => e.name).sort();
  if (!dirs.length && !files.length)
    return null;
  const totalFiles = await countMarkdown(root);
  const lines = [`Tree (${totalFiles} files):`];
  for (const d of dirs) {
    const count = await countMarkdown(join2(root, d));
    lines.push(count ? `  ${d}/ (${count})` : `  ${d}/`);
  }
  for (const f of files)
    lines.push(`  ${f}`);
  return lines.join("\n");
}
async function countMarkdown(dir) {
  let count = 0;
  let dirents;
  try {
    dirents = await fs2.readdir(dir, { withFileTypes: true });
  } catch {
    return 0;
  }
  for (const entry of dirents) {
    if (entry.name.startsWith("."))
      continue;
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name))
        continue;
      count += await countMarkdown(join2(dir, entry.name));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      count += 1;
    }
  }
  return count;
}
async function gitChanges(root, since) {
  return new Promise((resolve2) => {
    const proc = spawn("git", ["-C", root, "diff", "--name-status", `${since}..HEAD`], { stdio: ["ignore", "pipe", "pipe"] });
    let out = "";
    proc.stdout.on("data", (d) => out += d);
    proc.on("close", (code) => {
      if (code !== 0)
        return resolve2([]);
      const lines = out.split("\n").map((l) => l.trim()).filter(Boolean);
      resolve2(lines);
    });
    proc.on("error", () => resolve2([]));
  });
}

// src/awareness-hook.ts
async function main() {
  const space = await findSpaceRoot(process.cwd());
  if (space.source === "none" || !space.root) return;
  const block = await assembleAwareness({
    root: space.root,
    contract: space.contract
    // lastSha can hook into session state once sync ships.
  });
  if (block.trim()) process.stdout.write(block);
}
main().catch((err) => {
  const message = err instanceof Error ? err.message : String(err);
  process.stderr.write(`awareness-hook: ${message}
`);
});
