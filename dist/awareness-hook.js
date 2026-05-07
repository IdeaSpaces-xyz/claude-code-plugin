#!/usr/bin/env node

// src/awareness-hook.ts
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join as join3 } from "node:path";

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
function extractSummary(content) {
  if (!content.startsWith(`${DELIM}
`) && !content.startsWith(`${DELIM}\r
`)) {
    return null;
  }
  const lines = content.split(/\r?\n/);
  let endIdx = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trimEnd() === DELIM) {
      endIdx = i;
      break;
    }
  }
  if (endIdx === -1)
    return null;
  let summaryStart = -1;
  for (let i = 1; i < endIdx; i++) {
    if (/^summary:/.test(lines[i])) {
      summaryStart = i;
      break;
    }
  }
  if (summaryStart === -1)
    return null;
  const parts = [];
  const firstLineRaw = lines[summaryStart].slice("summary:".length).trim();
  if (firstLineRaw && !/^[>|][+-]?$/.test(firstLineRaw)) {
    parts.push(firstLineRaw);
  }
  for (let i = summaryStart + 1; i < endIdx; i++) {
    const line = lines[i];
    if (/^\s+\S/.test(line)) {
      parts.push(line.trim());
    } else {
      break;
    }
  }
  if (!parts.length)
    return null;
  let result = parts.join(" ");
  if (result.startsWith('"') && result.endsWith('"') || result.startsWith("'") && result.endsWith("'")) {
    result = result.slice(1, -1);
  }
  return result || null;
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
  const { root, contract, lastSha, maxChanges = 15, nowExcerptLength = 200, summaryExcerptLength = 200 } = opts;
  const sections = [];
  const nowLine = extractNowLine(contract, nowExcerptLength);
  if (nowLine)
    sections.push(`Now: ${nowLine}`);
  const tree = await buildTreeSection(root);
  if (tree)
    sections.push(tree);
  const agentContext = buildAgentContextSection(contract, summaryExcerptLength);
  if (agentContext)
    sections.push(agentContext);
  const skills = await buildSkillsSection(root, summaryExcerptLength);
  if (skills)
    sections.push(skills);
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
function buildAgentContextSection(contract, max) {
  const present = CONTRACT_ORDER.filter((name) => contract[name]);
  if (!present.length)
    return null;
  const lines = ["Agent context:"];
  for (const name of present) {
    const entry = contract[name];
    const blurb = describeFile(entry.content, max);
    lines.push(blurb ? `  ${name} \u2014 ${blurb}` : `  ${name}`);
  }
  return lines.join("\n");
}
async function buildSkillsSection(root, max) {
  const skillsDir = join2(root, "_agent", "skills");
  let entries;
  try {
    entries = (await fs2.readdir(skillsDir)).filter((name) => name.endsWith(".md")).sort();
  } catch {
    return null;
  }
  if (!entries.length)
    return null;
  const blurbs = await Promise.all(entries.map(async (file) => {
    try {
      const content = await fs2.readFile(join2(skillsDir, file), "utf-8");
      return describeFile(content, max);
    } catch {
      return null;
    }
  }));
  const lines = ["Operating skills:"];
  for (let i = 0; i < entries.length; i++) {
    const name = entries[i].replace(/\.md$/, "");
    const blurb = blurbs[i];
    lines.push(blurb ? `  ${name} \u2014 ${blurb}` : `  ${name}`);
  }
  return lines.join("\n");
}
function describeFile(content, max) {
  const summary = extractSummary(content);
  if (summary)
    return truncate(summary, max);
  const body = stripFrontmatter(content);
  for (const raw of body.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#"))
      continue;
    return truncate(line, max);
  }
  return null;
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
function isLoggedIn() {
  return existsSync(join3(homedir(), ".ideaspaces", "credentials.json"));
}
async function main() {
  const space = await findSpaceRoot(process.cwd());
  if (space.source === "none" || !space.root) {
    process.stdout.write(
      "Not an ideaspace yet.\nIf the user wants this folder structured for knowledge work, suggest `/is-setup`.\n"
    );
    return;
  }
  const block = await assembleAwareness({
    root: space.root,
    contract: space.contract
    // lastSha can hook into session state once sync ships.
  });
  if (block.trim()) process.stdout.write(block);
  const drift = [];
  if (!space.contract.purpose) {
    drift.push(
      "\u26A0 `_agent/purpose.md` not yet captured. The contract names it; propose capturing in conversation before doing other work."
    );
  }
  if (!space.contract.now) {
    drift.push(
      "\u26A0 `_agent/now.md` not yet captured. Propose capturing what's currently active."
    );
  }
  if (!isLoggedIn()) {
    drift.push(
      "(Not logged in to IdeaSpaces. `/is-publish` will offer login when the user is ready to host this remotely.)"
    );
  }
  if (drift.length > 0) {
    const prefix = block.trim() ? block.endsWith("\n") ? "\n" : "\n\n" : "";
    process.stdout.write(`${prefix}${drift.join("\n")}
`);
  }
}
main().catch((err) => {
  const message = err instanceof Error ? err.message : String(err);
  process.stderr.write(`awareness-hook: ${message}
`);
});
