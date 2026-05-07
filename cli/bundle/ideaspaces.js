#!/usr/bin/env node

// dist/commands/create.js
import { promises as fs2 } from "node:fs";
import { existsSync as existsSync2 } from "node:fs";
import { spawnSync } from "node:child_process";
import { join as join4, resolve as resolve2, basename } from "node:path";

// dist/output.js
function createOutput(flags2) {
  return {
    result(data, humanText) {
      if (flags2.json) {
        process.stdout.write(JSON.stringify(data, null, 2) + "\n");
      } else {
        process.stdout.write(humanText + "\n");
      }
    },
    log(text) {
      if (!flags2.quiet) {
        process.stderr.write(text + "\n");
      }
    },
    progress(text) {
      if (!flags2.quiet && !flags2.json) {
        process.stderr.write(text + "\n");
      }
    },
    error(text) {
      process.stderr.write(text + "\n");
    }
  };
}

// dist/auth/credentials.js
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { join as join2 } from "node:path";

// dist/auth/config-dir.js
import { homedir } from "node:os";
import { join } from "node:path";
function configDir() {
  return join(homedir(), ".ideaspaces");
}

// dist/auth/credentials.js
function credentialsFile() {
  return join2(configDir(), "credentials.json");
}
function loadStoredCredentials() {
  const file = credentialsFile();
  try {
    if (!existsSync(file))
      return null;
    const raw = readFileSync(file, "utf-8");
    const data = JSON.parse(raw);
    if (!data.api_key)
      return null;
    return data;
  } catch {
    return null;
  }
}
function saveCredentials(creds) {
  const dir = configDir();
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true, mode: 448 });
  }
  writeFileSync(credentialsFile(), JSON.stringify(creds, null, 2) + "\n", {
    mode: 384
  });
}
function deleteCredentials() {
  const file = credentialsFile();
  try {
    if (existsSync(file)) {
      unlinkSync(file);
    }
  } catch {
  }
}
var DEFAULT_API_URL = "https://api.ideaspaces.xyz";
function loadConfig() {
  const envKey = process.env.IS_API_KEY;
  if (envKey) {
    return {
      apiUrl: (process.env.IS_API_URL || DEFAULT_API_URL).replace(/\/$/, ""),
      apiKey: envKey
    };
  }
  const stored = loadStoredCredentials();
  if (stored) {
    return {
      apiUrl: (process.env.IS_API_URL || stored.api_url || DEFAULT_API_URL).replace(/\/$/, ""),
      apiKey: stored.api_key
    };
  }
  return null;
}
function getDefaultApiUrl() {
  return (process.env.IS_API_URL || DEFAULT_API_URL).replace(/\/$/, "");
}

// dist/templates/default.js
var FOUNDATION_MD = `---
name: Foundation
summary: Baseline contract for this ideaspace \u2014 what kind of place this is, how
  the agent and human work together. Lives only at the space root and always
  loads; deeper branches refine via their own \`_agent/\` when they need to.
---

# Foundation

> Baseline for the space. Lives only at the root.

---

## Space

This is an ideaspace \u2014 a markdown folder where knowledge accumulates. The
directory tree is how you navigate. \`_agent/\` carries the Agreement between
you and the user about how to work here.

The five-file contract:

- \`foundation.md\` \u2014 this file. What this place is, baseline behaviors.
- \`guide.md\` \u2014 specific agreements for this space.
- \`purpose.md\` \u2014 why this place exists.
- \`now.md\` \u2014 what's currently active.
- \`next.md\` \u2014 what's queued.

Only \`foundation.md\` and \`guide.md\` are scaffolded at create time.
\`purpose.md\`, \`now.md\`, and \`next.md\` are emergent \u2014 when the agent
reads this contract and finds those files missing, propose creating
them in conversation. Real content from real exchange.

Optional dimensions inside \`_agent/\` (add as the space earns them):

- \`skills/\` \u2014 operating procedures the agent should follow here. Each
  skill is a markdown file (e.g., \`commit.md\` for the commit shape).
  Surfaced at session start by name + summary; body loads on demand.

\`CLAUDE.md\` at the space root tells Claude Code where this contract lives.

\`.gitignore\` is also part of the Agreement \u2014 the boundary between what's
shared and what stays local. Drafts, scratch, secrets, per-developer context
go there. Propose changes; never edit silently.

---

## Identity

You inhabit the Space. Position persists across turns. The Space outlasts
the conversation \u2014 when it matters, verify against the Space rather than
relying on conversation memory.

**Drawing out over filling in.** Your questions surface what's already there.

**Evidence over assertion.** Work with what's provided. Gaps are information.

**Form over meaning.** The user provides meaning. You provide structure.
Structure reveals contradictions.

**Honesty over comfort.** Surface contradictions. Notice when stated criteria
don't match actual decisions.

---

## Practice

- **No slop.** Every line earns its place.
- **Capture is conscious.** Propose; the user confirms. Both sides agree before
  committing.
- **Three-tier commits.** Subject (one line), body (what shifted, why),
  trailers (\`Co-authored-by\`, etc.).

When the Agreement drifts \u2014 \`now.md\` no longer matches reality, or guidance
contradicts current practice \u2014 surface it. Update [guide.md](guide.md) for
this scope, or revisit this file if a baseline needs to shift.
`;
var GUIDE_MD = `---
name: Guide
summary: Specific agreements for working in this space. As patterns emerge \u2014
  how we capture, what conventions live where, how branches are organized \u2014
  capture them here.
---

# Guide

> Specific agreements for this space, beyond [foundation](foundation.md)
> defaults.

---

## What's specific here

_Fill in as patterns emerge. Examples to consider:_

- Is the \`_agent/\` shared (committed) or private (gitignored)?
- Where do conventions live (commit shape, tagging, identity)?
- Are there active tracks running in parallel?

---

## When the Agreement drifts

If \`now.md\` stops matching reality, or [foundation](foundation.md)
contradicts current practice, or this guide is silent on something we keep
doing \u2014 surface it. Update this guide for this scope, or revisit foundation
if a baseline needs to shift.
`;
var GITATTRIBUTES = `*.md diff=markdown text eol=lf
`;
var CLAUDE_MD = `---
name: Claude Code orientation
summary: Tells Claude Code this directory is an ideaspace and points at the seed
  _agent contract. Purpose, Now, and Next may be missing at first; their absence
  is a prompt to capture real direction in conversation.
---

# CLAUDE.md

> This is an ideaspace. The \`_agent/\` contract carries the working agreement.

## Orient

At session start, read the seed files first:

1. [\`_agent/foundation.md\`](_agent/foundation.md) \u2014 what this place is, baseline behaviors
2. [\`_agent/guide.md\`](_agent/guide.md) \u2014 how agent and human work together here

Then look for the emergent direction files:

3. \`_agent/purpose.md\` \u2014 why this exists
4. \`_agent/now.md\` \u2014 what's currently active
5. \`_agent/next.md\` \u2014 what's queued

\`purpose.md\`, \`now.md\`, and \`next.md\` may not exist yet. If missing,
don't invent them. Treat the gap as direction not yet captured and propose
creating them in conversation when there is enough real signal.

## When the Agreement drifts

Now stops matching reality. Foundation contradicts current practice. Guide is
silent on something we keep doing. \u2192 Surface it. Propose an update. Update
[\`_agent/guide.md\`](_agent/guide.md) for this scope, or revisit
[\`_agent/foundation.md\`](_agent/foundation.md) if a baseline needs to shift.
`;
function gitignoreDefaults(opts) {
  const lines = ["", "# ideaspace defaults"];
  if (opts.privateAgent) {
    lines.push("# (code repo with private _agent/ \u2014 each developer's contract stays local)", "_agent/", "CLAUDE.local.md");
  }
  lines.push("*.draft.md", "scratch/", "_local/", "");
  return lines.join("\n");
}
var CONTRACT_TEMPLATES = {
  foundation: FOUNDATION_MD,
  guide: GUIDE_MD
};

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
function composeFrontmatter(fm) {
  const lines = [DELIM];
  if (fm.name !== void 0)
    lines.push(`name: ${escapeScalar(fm.name)}`);
  if (fm.node_id !== void 0)
    lines.push(`node_id: ${escapeScalar(fm.node_id)}`);
  if (fm.summary !== void 0)
    lines.push(`summary: ${escapeScalar(fm.summary)}`);
  if (fm.tags?.length)
    lines.push(...renderArray("tags", fm.tags));
  if (fm.attached_to?.length)
    lines.push(...renderArray("attached_to", fm.attached_to));
  lines.push(DELIM, "");
  return lines.join("\n");
}
function escapeScalar(value) {
  if (needsQuoting(value)) {
    return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
  }
  return value;
}
function needsQuoting(value) {
  if (value === "")
    return true;
  if (/^[\s>|*&!%@`]/.test(value))
    return true;
  if (/^[-?]\s/.test(value))
    return true;
  if (/[:#]\s/.test(value))
    return true;
  if (/[{}[\],]/.test(value))
    return true;
  if (/[:#]$/.test(value))
    return true;
  if (/[\n\r"\\]/.test(value))
    return true;
  if (/^(true|false|null|yes|no|on|off|~)$/i.test(value))
    return true;
  if (/^-?\d/.test(value))
    return true;
  return false;
}
function renderArray(key, items) {
  return [`${key}:`, ...items.map((v) => `  - ${escapeScalar(v)}`)];
}

// node_modules/@ideaspaces/sdk/dist/identity.js
import { randomBytes } from "node:crypto";
import { promises as fs } from "node:fs";
import { join as join3, resolve } from "node:path";
var NODE_ID_RE = /^n_[0-9a-f]{12}(?:[0-9a-f]{12})?$/;
var FRONTMATTER_DELIM = "---";
var SKIP_DIRS = /* @__PURE__ */ new Set([".git", "node_modules"]);
function generateNodeId() {
  return `n_${randomBytes(12).toString("hex")}`;
}
function isNodeId(value) {
  return NODE_ID_RE.test(value);
}
function inspectMarkdownIdentity(content) {
  const block = parseFrontmatter(content);
  if (!block)
    return { status: "missing", node_id: null };
  const matches = findNodeIdLines(block.lines);
  if (matches.length === 0)
    return { status: "missing", node_id: null };
  if (matches.length > 1) {
    return { status: "malformed", node_id: null, message: "multiple node_id fields" };
  }
  const value = parseScalarValue(matches[0].line.slice(matches[0].line.indexOf(":") + 1));
  if (!value || !isNodeId(value)) {
    return { status: "malformed", node_id: value || null, message: "invalid node_id" };
  }
  return { status: "valid", node_id: value };
}
function ensureMarkdownNodeId(content, opts = {}) {
  const block = parseFrontmatter(content);
  if (!block) {
    const nextId2 = generateNodeId();
    return {
      content: `${FRONTMATTER_DELIM}
node_id: ${nextId2}
${FRONTMATTER_DELIM}
${content}`,
      node_id: nextId2,
      old_node_id: null,
      changed: true
    };
  }
  const matches = findNodeIdLines(block.lines);
  if (matches.length > 1) {
    throw new Error("multiple node_id fields");
  }
  if (matches.length === 1) {
    const match = matches[0];
    const oldValue = parseScalarValue(match.line.slice(match.line.indexOf(":") + 1));
    if (!oldValue || !isNodeId(oldValue)) {
      if (!opts.regenerate) {
        throw new Error(`invalid node_id: ${oldValue || "(empty)"}`);
      }
    } else if (!opts.regenerate) {
      return { content, node_id: oldValue, old_node_id: oldValue, changed: false };
    }
    const nextId2 = generateNodeId();
    const lines2 = content.split(/\r?\n/);
    lines2[match.index] = `node_id: ${nextId2}`;
    return {
      content: lines2.join("\n"),
      node_id: nextId2,
      old_node_id: oldValue || null,
      changed: true
    };
  }
  const nextId = generateNodeId();
  const lines = content.split(/\r?\n/);
  const insertAt = insertionIndexForNodeId(block.lines);
  lines.splice(insertAt, 0, `node_id: ${nextId}`);
  return {
    content: lines.join("\n"),
    node_id: nextId,
    old_node_id: null,
    changed: true
  };
}
async function collectMarkdownFiles(target) {
  const abs = resolve(target);
  let stat2;
  try {
    stat2 = await fs.lstat(abs);
  } catch (err) {
    if (err.code === "ENOENT")
      return [];
    throw err;
  }
  if (stat2.isSymbolicLink())
    return [];
  if (stat2.isFile())
    return isMarkdownPath(abs) ? [abs] : [];
  if (!stat2.isDirectory())
    return [];
  const out = [];
  await walk(abs, out);
  return out.sort();
}
function isMarkdownPath(path) {
  return path.toLowerCase().endsWith(".md");
}
async function walk(dir, out) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name))
        continue;
      await walk(join3(dir, entry.name), out);
      continue;
    }
    if (entry.isFile() && isMarkdownPath(entry.name)) {
      out.push(join3(dir, entry.name));
    }
  }
}
function parseFrontmatter(content) {
  if (!content.startsWith(`${FRONTMATTER_DELIM}
`) && !content.startsWith(`${FRONTMATTER_DELIM}\r
`)) {
    return null;
  }
  const lines = content.split(/\r?\n/);
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trimEnd() === FRONTMATTER_DELIM) {
      return { lines: lines.slice(0, i + 1) };
    }
  }
  return null;
}
function findNodeIdLines(lines) {
  const matches = [];
  for (let i = 1; i < lines.length - 1; i++) {
    const line = lines[i];
    if (/^node_id\s*:/.test(line)) {
      matches.push({ index: i, line });
    }
  }
  return matches;
}
function insertionIndexForNodeId(lines) {
  for (let i = 1; i < lines.length - 1; i++) {
    if (/^name\s*:/.test(lines[i]))
      return i + 1;
  }
  return 1;
}
function parseScalarValue(raw) {
  let value = raw.trim();
  const hashIndex = value.indexOf(" #");
  if (hashIndex >= 0)
    value = value.slice(0, hashIndex).trim();
  if (value.startsWith('"') && value.endsWith('"') || value.startsWith("'") && value.endsWith("'")) {
    value = value.slice(1, -1);
  }
  return value;
}

// dist/commands/create.js
var CODE_SIGNALS = [
  ".github",
  "package.json",
  "Cargo.toml",
  "go.mod",
  "pyproject.toml",
  "Gemfile",
  "pom.xml"
];
var OLD_AGENT_FILES = ["always.md", "rules.md", "soul.md", "guidance.md"];
var createCommand = {
  name: "create",
  description: "Scaffold an ideaspace (seed _agent/ contract + CLAUDE.md + .gitignore defaults)",
  usage: "ideaspaces create [name] [--yes] [--shared]",
  examples: [
    "ideaspaces create my-space             # plan in ./my-space/, exit without applying",
    "ideaspaces create my-space --yes       # scaffold and commit",
    "ideaspaces create --yes                # scaffold in current directory",
    "ideaspaces create --yes --shared       # in a code repo, opt into shared (committed) _agent/"
  ],
  async run(args2, flags2, global2) {
    const output = createOutput(global2);
    const name = args2[0];
    const targetDir = name ? resolve2(process.cwd(), name) : process.cwd();
    const apply = global2.yes === true;
    const sharedFlag = Boolean(flags2.shared);
    const inspection = await inspect(targetDir);
    const shape = detectShape(inspection);
    if (shape === "complete") {
      output.error(`${describeTarget(targetDir, name)} is already an ideaspace. Edit \`_agent/\` directly or use \`/is-reflect\` to update direction.`);
      return 5;
    }
    if (shape === "old-shape") {
      output.error(`${describeTarget(targetDir, name)} has an \`_agent/\` in the legacy shape (always.md / rules.md / soul.md). Migration is not yet automated; see \`ideaspace/architecture/plans/plugin-local-first/ideaspace-create.md\` for the manual walk.`);
      return 5;
    }
    const privateAgent = shape === "code-repo" && !sharedFlag;
    const plan = buildPlan({ targetDir, name, shape, inspection, privateAgent });
    if (!apply) {
      output.result({ target: targetDir, shape, privateAgent, plan: plan.steps }, renderPlanText({ targetDir, name, shape, privateAgent, plan }));
      return 0;
    }
    try {
      await applyPlan({ targetDir, inspection, privateAgent });
    } catch (err) {
      output.error(`Scaffold failed midway: ${err instanceof Error ? err.message : String(err)}
Use \`git status\` / \`git restore\` to recover.`);
      return 1;
    }
    const where = name ? `./${name}` : "this directory";
    const lines = [
      `Scaffolded ${describeTarget(targetDir, name)} (${shape}${privateAgent ? ", private _agent/" : ""}).`,
      `Next: open Claude Code in ${where} \u2014 the agent will read foundation+guide and propose capturing purpose / now / next in conversation.`
    ];
    if (loadStoredCredentials()) {
      lines.push(`When ready to host this remotely, run \`ideaspaces publish\` from inside ${where}.`);
    }
    output.result({ target: targetDir, shape, privateAgent, scaffolded: true }, lines.join("\n"));
    return 0;
  }
};
async function inspect(targetDir) {
  if (!existsSync2(targetDir)) {
    return {
      exists: false,
      isGitRepo: false,
      hasNewAgent: false,
      hasOldAgent: false,
      hasClaude: false,
      hasGitignore: false,
      hasCodeSignal: false,
      markdownCount: 0
    };
  }
  const isGitRepo = existsSync2(join4(targetDir, ".git"));
  const hasClaude = existsSync2(join4(targetDir, "CLAUDE.md"));
  const hasGitignore = existsSync2(join4(targetDir, ".gitignore"));
  const agentDir = join4(targetDir, "_agent");
  const hasNewAgent = existsSync2(join4(agentDir, "foundation.md"));
  const hasOldAgent = existsSync2(agentDir) && OLD_AGENT_FILES.some((f) => existsSync2(join4(agentDir, f))) && !hasNewAgent;
  let hasCodeSignal = false;
  for (const sig of CODE_SIGNALS) {
    if (existsSync2(join4(targetDir, sig))) {
      hasCodeSignal = true;
      break;
    }
  }
  let markdownCount = 0;
  try {
    const entries = await fs2.readdir(targetDir, { withFileTypes: true });
    for (const e of entries) {
      if (e.isFile() && e.name.endsWith(".md"))
        markdownCount += 1;
    }
  } catch {
  }
  return {
    exists: true,
    isGitRepo,
    hasNewAgent,
    hasOldAgent,
    hasClaude,
    hasGitignore,
    hasCodeSignal,
    markdownCount
  };
}
function detectShape(inspection) {
  if (!inspection.exists)
    return "greenfield";
  if (inspection.hasNewAgent && inspection.hasClaude)
    return "complete";
  if (inspection.hasOldAgent)
    return "old-shape";
  if (inspection.hasCodeSignal)
    return "code-repo";
  if (inspection.markdownCount > 0)
    return "content-existing";
  return "greenfield";
}
function buildPlan(opts) {
  const { targetDir, name, inspection, privateAgent } = opts;
  const steps = [];
  if (name && !inspection.exists) {
    steps.push({ op: "mkdir", path: targetDir });
  }
  if (!inspection.isGitRepo) {
    steps.push({ op: "git-init", path: targetDir });
  }
  for (const fileName of Object.keys(CONTRACT_TEMPLATES)) {
    steps.push({ op: "write", path: join4(targetDir, "_agent", `${fileName}.md`) });
  }
  const claudeFile = privateAgent ? "CLAUDE.local.md" : "CLAUDE.md";
  if (!inspection.hasClaude) {
    steps.push({ op: "write", path: join4(targetDir, claudeFile) });
  }
  if (!existsSync2(join4(targetDir, ".gitattributes"))) {
    steps.push({
      op: "write",
      path: join4(targetDir, ".gitattributes"),
      detail: "markdown diff/eol attributes"
    });
  }
  steps.push({
    op: inspection.hasGitignore ? "append" : "write",
    path: join4(targetDir, ".gitignore"),
    detail: privateAgent ? "private _agent/ defaults" : "content-space defaults"
  });
  steps.push({ op: "commit", detail: "Initial ideaspace scaffold" });
  return { steps };
}
function renderPlanText(opts) {
  const { targetDir, name, shape, privateAgent, plan } = opts;
  const lines = [];
  lines.push(`Plan for ${describeTarget(targetDir, name)} \u2014 shape: ${shape}${privateAgent ? " (private _agent/)" : ""}`);
  lines.push("");
  for (const step of plan.steps) {
    const tag = step.op.toUpperCase().padEnd(9);
    const detail = step.detail ? ` \u2014 ${step.detail}` : "";
    const path = step.path ? ` ${step.path}` : "";
    lines.push(`  ${tag}${path}${detail}`);
  }
  lines.push("");
  lines.push("Re-run with --yes to apply.");
  return lines.join("\n");
}
async function applyPlan(opts) {
  const { targetDir, inspection, privateAgent } = opts;
  await fs2.mkdir(targetDir, { recursive: true });
  if (!inspection.isGitRepo) {
    runGit(targetDir, ["init", "-q", "-b", "main"]);
  }
  await fs2.mkdir(join4(targetDir, "_agent"), { recursive: true });
  for (const [name, content] of Object.entries(CONTRACT_TEMPLATES)) {
    await fs2.writeFile(join4(targetDir, "_agent", `${name}.md`), withNodeId(content), "utf-8");
  }
  const claudeFile = privateAgent ? "CLAUDE.local.md" : "CLAUDE.md";
  if (!inspection.hasClaude) {
    await fs2.writeFile(join4(targetDir, claudeFile), withNodeId(CLAUDE_MD), "utf-8");
  }
  const gitattributesPath = join4(targetDir, ".gitattributes");
  if (!existsSync2(gitattributesPath)) {
    await fs2.writeFile(gitattributesPath, GITATTRIBUTES, "utf-8");
  }
  const gitignorePath = join4(targetDir, ".gitignore");
  const additions = gitignoreDefaults({ privateAgent });
  if (inspection.hasGitignore) {
    const existing = await fs2.readFile(gitignorePath, "utf-8");
    if (!existing.includes("# ideaspace defaults")) {
      await fs2.writeFile(gitignorePath, existing.endsWith("\n") ? existing + additions : existing + "\n" + additions, "utf-8");
    }
  } else {
    await fs2.writeFile(gitignorePath, additions.replace(/^\n/, ""), "utf-8");
  }
  runGit(targetDir, ["add", "."]);
  runGit(targetDir, ["commit", "-q", "-m", "Initial ideaspace scaffold"]);
}
function withNodeId(content) {
  return ensureMarkdownNodeId(content).content;
}
function runGit(cwd, args2) {
  const r = spawnSync("git", ["-C", cwd, ...args2], { encoding: "utf-8" });
  if (r.status !== 0) {
    const message = r.stderr.trim() || r.stdout.trim() || `exit ${r.status}`;
    throw new Error(`git ${args2.join(" ")}: ${message}`);
  }
}
function describeTarget(targetDir, name) {
  return name ? `./${basename(targetDir)}` : "the current directory";
}

// dist/commands/login.js
import { exec as exec2 } from "node:child_process";
import { platform } from "node:os";

// dist/auth/callback-server.js
import { createServer } from "node:http";
import { URL as URL2 } from "node:url";
var SUCCESS_HTML = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>IdeaSpaces \u2014 Logged In</title></head>
<body style="font-family: system-ui; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #0a0a0a; color: #fafafa;">
<div style="text-align: center;">
<h2>Logged in to IdeaSpaces</h2>
<p style="color: #888;">You can close this tab and return to your terminal.</p>
</div>
</body></html>`;
var ERROR_HTML = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>IdeaSpaces \u2014 Error</title></head>
<body style="font-family: system-ui; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #0a0a0a; color: #fafafa;">
<div style="text-align: center;">
<h2>Login failed</h2>
<p style="color: #888;">No token received. Please try again.</p>
</div>
</body></html>`;
function startCallbackServer() {
  return new Promise((resolve6, reject) => {
    let tokenResolve = null;
    let tokenReject = null;
    const server = createServer((req, res) => {
      const url = new URL2(req.url || "/", `http://127.0.0.1`);
      if (url.pathname === "/callback") {
        const token = url.searchParams.get("token");
        if (token) {
          res.writeHead(200, { "Content-Type": "text/html" });
          res.end(SUCCESS_HTML);
          tokenResolve?.(token);
        } else {
          res.writeHead(400, { "Content-Type": "text/html" });
          res.end(ERROR_HTML);
          tokenReject?.(new Error("No token in callback"));
        }
      } else {
        res.writeHead(404);
        res.end();
      }
    });
    server.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      if (!addr || typeof addr === "string") {
        reject(new Error("Failed to get server address"));
        return;
      }
      resolve6({
        port: addr.port,
        waitForCallback(timeoutMs = 12e4) {
          return new Promise((res, rej) => {
            tokenResolve = res;
            tokenReject = rej;
            const timer = setTimeout(() => {
              rej(new Error("Login timed out \u2014 no callback received within 2 minutes"));
              server.close();
            }, timeoutMs);
            const origResolve = tokenResolve;
            tokenResolve = (token) => {
              clearTimeout(timer);
              origResolve(token);
            };
          });
        },
        close() {
          server.close();
        }
      });
    });
    server.on("error", reject);
  });
}

// dist/auth/git-credential-helper.js
import { exec } from "node:child_process";
import { promisify } from "node:util";
var execAsync = promisify(exec);
var GIT_HOSTS = [
  "https://git.ideaspaces.xyz",
  "https://git.ideaspaces.localhost"
];
var HELPER_VALUE = "!ideaspaces credential";
async function registerGitCredentialHelper() {
  for (const host of GIT_HOSTS) {
    try {
      const key = `credential.${host}.helper`;
      await execAsync(`git config --global --unset-all ${escapeShellArg(key)}`).catch(() => {
      });
      await execAsync(`git config --global --add ${escapeShellArg(key)} ""`);
      await execAsync(`git config --global --add ${escapeShellArg(key)} ${escapeShellArg(HELPER_VALUE)}`);
    } catch {
    }
  }
}
function escapeShellArg(value) {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

// dist/commands/login.js
function openBrowser(url) {
  const cmd2 = platform() === "darwin" ? "open" : platform() === "win32" ? "start" : "xdg-open";
  exec2(`${cmd2} "${url}"`);
}
var loginCommand = {
  name: "login",
  description: "Log in to IdeaSpaces (optional \u2014 required for sync)",
  usage: "ideaspaces login",
  examples: [
    "ideaspaces login              # OAuth login; saves credentials for git push/pull"
  ],
  async run(_args, _flags, global2) {
    const output = createOutput(global2);
    const apiUrl = getDefaultApiUrl();
    const callbackServer = await startCallbackServer();
    const authUrl = `${apiUrl}/auth/google?response_type=cli&port=${callbackServer.port}`;
    output.progress(`Opening browser for login...
${authUrl}`);
    openBrowser(authUrl);
    let token;
    try {
      token = await callbackServer.waitForCallback(12e4);
      callbackServer.close();
    } catch (err) {
      callbackServer.close();
      output.error(err instanceof Error ? err.message : String(err));
      return 1;
    }
    saveCredentials({ api_url: apiUrl, api_key: token });
    await registerGitCredentialHelper();
    output.result({ logged_in: true }, "Logged in. `git push` / `git pull` against your space repo now picks up credentials automatically.");
    return 0;
  }
};

// dist/commands/publish.js
import { spawnSync as spawnSync2 } from "node:child_process";
import { existsSync as existsSync4 } from "node:fs";
import { basename as basename2, join as join6 } from "node:path";

// dist/auth/api.js
async function request(config, method, path, body) {
  const r = await fetch(`${config.apiUrl}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`
    },
    body: body !== void 0 ? JSON.stringify(body) : void 0
  });
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`${method} ${path} \u2192 ${r.status}: ${text || r.statusText}`);
  }
  return await r.json();
}
async function fetchAuthMe(config) {
  return request(config, "GET", "/auth/me");
}
async function createRepo(config, body) {
  return request(config, "POST", "/repos", body);
}

// dist/auth/spaces.js
import { existsSync as existsSync3, mkdirSync as mkdirSync2, readFileSync as readFileSync2, writeFileSync as writeFileSync2 } from "node:fs";
import { join as join5, resolve as resolve3 } from "node:path";
function spacesFile() {
  return join5(configDir(), "spaces.json");
}
function loadSpaces() {
  const file = spacesFile();
  try {
    if (!existsSync3(file))
      return {};
    const raw = readFileSync2(file, "utf-8");
    const data = JSON.parse(raw);
    if (typeof data !== "object" || data === null)
      return {};
    return data;
  } catch {
    return {};
  }
}
function saveSpace(absolutePath, record) {
  const key = resolve3(absolutePath);
  const map = loadSpaces();
  map[key] = record;
  const dir = configDir();
  if (!existsSync3(dir)) {
    mkdirSync2(dir, { recursive: true, mode: 448 });
  }
  writeFileSync2(spacesFile(), JSON.stringify(map, null, 2) + "\n", { mode: 384 });
}
function findSpaceFor(absolutePath) {
  return loadSpaces()[resolve3(absolutePath)] ?? null;
}

// dist/identity-report.js
import { readFile } from "node:fs/promises";
import { relative } from "node:path";
async function scanMarkdownIdentityFiles(files) {
  const statuses = await Promise.all(files.map(async (path) => {
    const content = await readFile(path, "utf-8");
    const identity = inspectMarkdownIdentity(content);
    return {
      path,
      status: identity.status,
      node_id: identity.node_id,
      duplicate: false,
      message: identity.message
    };
  }));
  const byId = /* @__PURE__ */ new Map();
  for (const status of statuses) {
    if (status.status !== "valid" || !status.node_id)
      continue;
    const group = byId.get(status.node_id) ?? [];
    group.push(status);
    byId.set(status.node_id, group);
  }
  const duplicates = [];
  for (const group of byId.values()) {
    if (group.length <= 1)
      continue;
    for (const item of group) {
      item.duplicate = true;
      duplicates.push(item);
    }
  }
  return {
    files: statuses,
    missing: statuses.filter((s) => s.status === "missing"),
    malformed: statuses.filter((s) => s.status === "malformed"),
    duplicates
  };
}
function hasIdentityProblems(scan) {
  return scan.missing.length > 0 || scan.malformed.length > 0 || scan.duplicates.length > 0;
}
function renderIdentityProblems(scan, opts = {}) {
  if (!hasIdentityProblems(scan))
    return "";
  const cwd = opts.cwd ?? process.cwd();
  const lines = [...opts.header ?? []];
  if (scan.missing.length) {
    lines.push(`Missing node_id (${scan.missing.length}):`);
    for (const item of scan.missing)
      lines.push(`  ${displayPath(cwd, item.path)}`);
  }
  if (scan.malformed.length) {
    if (lines.length && lines.at(-1) !== "")
      lines.push("");
    lines.push(`Malformed node_id (${scan.malformed.length}):`);
    for (const item of scan.malformed) {
      const suffix = item.message ? ` \u2014 ${item.message}` : "";
      lines.push(`  ${displayPath(cwd, item.path)}${suffix}`);
    }
  }
  if (scan.duplicates.length) {
    if (lines.length && lines.at(-1) !== "")
      lines.push("");
    lines.push(`Duplicate node_id (${scan.duplicates.length} files):`);
    const byId = /* @__PURE__ */ new Map();
    for (const item of scan.duplicates) {
      if (!item.node_id)
        continue;
      const group = byId.get(item.node_id) ?? [];
      group.push(item);
      byId.set(item.node_id, group);
    }
    for (const [id, group] of byId) {
      lines.push(`  ${id}`);
      for (const item of group)
        lines.push(`    ${displayPath(cwd, item.path)}`);
    }
  }
  if (opts.footer?.length) {
    if (lines.length && lines.at(-1) !== "")
      lines.push("");
    lines.push(...opts.footer);
  }
  return lines.join("\n");
}
function displayPath(cwd, path) {
  return relative(cwd, path) || path;
}

// dist/commands/publish.js
function runGit2(cwd, args2) {
  const r = spawnSync2("git", ["-C", cwd, ...args2], { encoding: "utf-8" });
  if (r.error) {
    return { ok: false, stderr: `git not available: ${r.error.message}`, stdout: "" };
  }
  return {
    ok: r.status === 0,
    stderr: (r.stderr || "").trim(),
    stdout: (r.stdout || "").trim()
  };
}
function deriveGitBase(apiUrl) {
  const override = process.env.IS_GIT_URL;
  if (override)
    return override.replace(/\/+$/, "");
  try {
    const url = new URL(apiUrl);
    if (url.hostname.startsWith("api.")) {
      url.hostname = "git." + url.hostname.slice(4);
    }
    return url.toString().replace(/\/+$/, "");
  } catch {
    return apiUrl.replace(/\/+$/, "");
  }
}
function defaultGitUrl(apiUrl, namespace, slug) {
  return `${deriveGitBase(apiUrl)}/${namespace}/${slug}.git`;
}
var SIZE_CAP_MARKERS = ["size cap", "too large", "exceeds"];
async function checkMarkdownIdentities(cwd) {
  const files = trackedMarkdownFiles(cwd);
  if (!files.length)
    return null;
  const scan = await scanMarkdownIdentityFiles(files);
  if (!hasIdentityProblems(scan))
    return null;
  return renderIdentityProblems(scan, {
    cwd,
    header: [
      "Cannot publish yet: markdown identity check failed.",
      "Every committed markdown file needs a stable node_id before it can be pushed.",
      ""
    ],
    footer: [
      "Fix missing IDs with: `ideaspaces id --fix .`",
      "Fix copied/duplicate IDs with: `ideaspaces id --regenerate <path>`",
      "Then commit the identity changes and re-run `ideaspaces publish`."
    ]
  });
}
function trackedMarkdownFiles(cwd) {
  const r = spawnSync2("git", ["-C", cwd, "ls-files", "-z", "--", "*.md"], { encoding: "utf-8" });
  if (r.error)
    throw new Error(`git not available: ${r.error.message}`);
  if (r.status !== 0) {
    throw new Error(r.stderr.trim() || "git ls-files failed while checking markdown identities");
  }
  return r.stdout.split("\0").filter(Boolean).map((path) => join6(cwd, path));
}
var publishCommand = {
  name: "publish",
  description: "Publish this folder as a remote ideaspace (tracked .md files need node_id)",
  usage: "ideaspaces publish [--slug <slug>] [--name <name>] [--hostname <host>] [--force]",
  examples: [
    "ideaspaces publish                     # publish current directory; preflights tracked .md node_id fields",
    "ideaspaces publish --slug my-notes     # explicit slug",
    "ideaspaces publish --hostname acme.com # publish into an org space (must be a member)",
    "ideaspaces publish --force             # force a fresh remote even if this dir already mapped"
  ],
  async run(_args, rawFlags, global2) {
    const output = createOutput(global2);
    const flags2 = rawFlags;
    const cwd = process.cwd();
    if (!existsSync4(join6(cwd, ".git"))) {
      output.error("Not a git repo. Run `ideaspaces create` first, or `git init` here.");
      return 1;
    }
    const branchResult = runGit2(cwd, ["symbolic-ref", "--short", "HEAD"]);
    if (!branchResult.ok) {
      output.error("Couldn't determine the current branch \u2014 is HEAD detached?");
      return 1;
    }
    const branch = branchResult.stdout;
    let identityProblem;
    try {
      identityProblem = await checkMarkdownIdentities(cwd);
    } catch (err) {
      output.error(err instanceof Error ? err.message : String(err));
      return 1;
    }
    if (identityProblem) {
      output.error(identityProblem);
      return 1;
    }
    const stored = loadStoredCredentials();
    if (!stored) {
      output.error("Not logged in. Run `ideaspaces login` first.");
      return 1;
    }
    const config = { apiUrl: stored.api_url, apiKey: stored.api_key };
    let me;
    try {
      me = await fetchAuthMe(config);
    } catch (err) {
      output.error(`Couldn't reach the IdeaSpaces server: ${err instanceof Error ? err.message : String(err)}`);
      return 1;
    }
    if (!me.username) {
      output.error("Account has no username yet. Complete onboarding before publishing.");
      return 1;
    }
    const existing = findSpaceFor(cwd);
    let repo;
    let namespace;
    if (existing && !flags2.force) {
      const ignored = [
        flags2.name && "--name",
        flags2.slug && "--slug",
        flags2.hostname && "--hostname"
      ].filter(Boolean);
      if (ignored.length > 0) {
        output.error(`${ignored.join(", ")} only apply on first publish. This folder is already mapped to ${existing.namespace}/${existing.slug}; re-publish reuses that record. Use --force to provision a new remote.`);
        return 1;
      }
      output.log(`This folder is already published as ${existing.namespace}/${existing.slug} (repo_id=${existing.repo_id}). Re-pushing to the same remote. Use --force to provision a new one \u2014 the old server repo isn't deleted, just unlinked from this folder.`);
      repo = { repo_id: existing.repo_id, slug: existing.slug, name: existing.slug };
      namespace = existing.namespace;
    } else {
      const name = flags2.name?.toString() || basename2(cwd);
      const slug = flags2.slug?.toString();
      const hostname = flags2.hostname?.toString() ?? null;
      namespace = hostname ?? me.username;
      try {
        repo = await createRepo(config, { name, slug, hostname });
      } catch (err) {
        output.error(`Couldn't create remote space: ${err instanceof Error ? err.message : String(err)}`);
        return 1;
      }
    }
    const identityEmail = `person:${me.username}@ideaspaces`;
    const setEmail = runGit2(cwd, ["config", "--local", "user.email", identityEmail]);
    if (!setEmail.ok) {
      output.error(`git config user.email failed: ${setEmail.stderr}`);
      return 1;
    }
    const remoteUrl = defaultGitUrl(config.apiUrl, namespace, repo.slug);
    const existingRemote = runGit2(cwd, ["remote", "get-url", "origin"]);
    if (existingRemote.ok) {
      if (existingRemote.stdout && existingRemote.stdout !== remoteUrl) {
        output.log(`Replacing existing origin: ${existingRemote.stdout} \u2192 ${remoteUrl}`);
      }
      const setUrl = runGit2(cwd, ["remote", "set-url", "origin", remoteUrl]);
      if (!setUrl.ok) {
        output.error(`git remote set-url failed: ${setUrl.stderr}`);
        return 1;
      }
    } else {
      const addRemote = runGit2(cwd, ["remote", "add", "origin", remoteUrl]);
      if (!addRemote.ok) {
        output.error(`git remote add failed: ${addRemote.stderr}`);
        return 1;
      }
    }
    output.progress(`Pushing ${branch} to ${remoteUrl} ...`);
    const push = runGit2(cwd, ["push", "-u", "origin", branch]);
    if (!push.ok) {
      const sizeRelated = SIZE_CAP_MARKERS.some((m) => push.stderr.includes(m));
      const hint = sizeRelated ? "\nA blob exceeded the 200KB cap \u2014 shrink it or move it out of the repo." : "";
      output.error(`Push failed:
${push.stderr}${hint}`);
      return 1;
    }
    saveSpace(cwd, {
      repo_id: repo.repo_id,
      slug: repo.slug,
      namespace
    });
    output.result({
      repo_id: repo.repo_id,
      slug: repo.slug,
      namespace,
      remote_url: remoteUrl,
      identity_email: identityEmail
    }, [
      `Published ${repo.name} \u2192 ${remoteUrl}`,
      `Local git identity set to ${identityEmail} (this dir only \u2014 your global git config is untouched).`
    ].join("\n"));
    return 0;
  }
};

// dist/commands/write.js
import { promises as fs3 } from "node:fs";
import { existsSync as existsSync5 } from "node:fs";
import { spawnSync as spawnSync3 } from "node:child_process";
import { dirname, resolve as resolve4 } from "node:path";
async function readStdin() {
  if (process.stdin.isTTY)
    return "";
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf-8");
}
var writeCommand = {
  name: "write",
  description: "Create or update a Note (local file with Layer 1 frontmatter)",
  usage: "ideaspaces write <path> [--name NAME] [--summary TEXT] [--tags a,b] [--attached-to ent1,ent2] [--content TEXT] [--force] [--commit]",
  examples: [
    'echo "# My Note\\nContent here" | ideaspaces write notes/my-note.md --name "My Note"',
    'ideaspaces write notes/test.md --name "Test" --content "# Test\\nHello"',
    'ideaspaces write notes/test.md --content "# overwrite" --force',
    'ideaspaces write notes/test.md --content "..." --commit  # also git-commits'
  ],
  async run(args2, flags2, global2) {
    const output = createOutput(global2);
    const path = args2[0];
    if (!path) {
      output.error("Usage: ideaspaces write <path> [--name NAME] [--summary TEXT]");
      return 1;
    }
    let content = flags2.content;
    if (!content) {
      content = await readStdin();
      if (!content) {
        output.error("No content provided. Pipe content via stdin or use --content.");
        return 1;
      }
    }
    const fm = {
      name: flags2.name,
      summary: flags2.summary,
      tags: parseList(flags2.tags),
      attached_to: parseList(flags2["attached-to"])
    };
    const force = Boolean(flags2.force);
    const commit = Boolean(flags2.commit);
    const absPath = resolve4(path);
    const exists = existsSync5(absPath);
    if (exists && !force) {
      output.error(`File exists: ${path}
Re-run with --force to overwrite.`);
      return 5;
    }
    if (exists) {
      try {
        const existing = await fs3.readFile(absPath, "utf-8");
        fm.node_id = ensureMarkdownNodeId(existing).node_id;
      } catch (err) {
        output.error(`Existing file has a malformed node_id: ${err instanceof Error ? err.message : String(err)}
Run \`ideaspaces id --regenerate ${path}\` if you intend to reset this file's identity.`);
        return 1;
      }
    } else {
      fm.node_id = generateNodeId();
    }
    const body = stripFrontmatter(content);
    const finalContent = composeFrontmatter(fm) + body;
    await fs3.mkdir(dirname(absPath), { recursive: true });
    await fs3.writeFile(absPath, finalContent, "utf-8");
    let commitSha;
    if (commit) {
      try {
        commitSha = gitCommitFile(absPath, flags2["commit-message"]);
      } catch (err) {
        output.error(`File written but commit failed: ${err instanceof Error ? err.message : String(err)}`);
        return 1;
      }
    }
    output.result({ path: absPath, commit_sha: commitSha ?? null }, commitSha ? `Written: ${absPath}
Committed: ${commitSha}` : `Written: ${absPath}`);
    return 0;
  }
};
function parseList(value) {
  if (typeof value !== "string" || !value)
    return void 0;
  return value.split(",").map((t) => t.trim()).filter(Boolean);
}
function gitCommitFile(absPath, message) {
  const stage = spawnSync3("git", ["add", absPath], { encoding: "utf-8" });
  if (stage.status !== 0) {
    throw new Error(stage.stderr.trim() || `git add exit ${stage.status}`);
  }
  const subject = message?.trim() || `Update ${absPath.split("/").pop()}`;
  const commit = spawnSync3("git", ["commit", "-q", "-m", subject], { encoding: "utf-8" });
  if (commit.status !== 0) {
    throw new Error(commit.stderr.trim() || commit.stdout.trim() || `git commit exit ${commit.status}`);
  }
  const sha = spawnSync3("git", ["rev-parse", "HEAD"], { encoding: "utf-8" });
  return sha.stdout.trim();
}

// dist/commands/credential.js
var credentialCommand = {
  name: "credential",
  description: "Git credential helper (invoked by git \u2014 usually not run directly)",
  usage: "ideaspaces credential <get|store|erase>",
  async run(args2) {
    const action = args2[0];
    if (action === "store" || action === "erase") {
      await drainStdin();
      return 0;
    }
    if (action !== "get") {
      await drainStdin();
      return 1;
    }
    return handleGet();
  }
};
async function handleGet() {
  const input = await readStdin2();
  const params = parseCredentialInput(input);
  if (!isIdeaspacesHost(params.host)) {
    return 0;
  }
  const config = loadConfig();
  if (!config) {
    return 0;
  }
  const username = params.username && params.username.length > 0 ? params.username : "token";
  const reply = [
    `username=${username}`,
    `password=${config.apiKey}`,
    "",
    ""
  ].join("\n");
  process.stdout.write(reply);
  return 0;
}
function isIdeaspacesHost(host) {
  if (!host)
    return false;
  return host === "git.ideaspaces.xyz" || host === "git.ideaspaces.localhost" || host.endsWith(".ideaspaces.xyz");
}
function parseCredentialInput(input) {
  const params = {};
  for (const line of input.split("\n")) {
    const trimmed = line.replace(/\r$/, "");
    if (!trimmed)
      continue;
    const idx = trimmed.indexOf("=");
    if (idx < 0)
      continue;
    params[trimmed.slice(0, idx)] = trimmed.slice(idx + 1);
  }
  return params;
}
async function readStdin2() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf-8");
}
async function drainStdin() {
  for await (const _ of process.stdin) {
  }
}

// dist/commands/id.js
import { spawnSync as spawnSync4 } from "node:child_process";
import { existsSync as existsSync6 } from "node:fs";
import { chmod, mkdir, readFile as readFile2, stat, writeFile } from "node:fs/promises";
import { dirname as dirname2, join as join7, relative as relative2, resolve as resolve5 } from "node:path";
var HOOK_MARKER = "# ideaspaces-node-id-hook";
var idCommand = {
  name: "id",
  description: "Check and repair local markdown node_id frontmatter",
  usage: "ideaspaces id [path] [--fix] [--staged] | ideaspaces id --regenerate <path> | ideaspaces id install-hook",
  examples: [
    "ideaspaces id .                         # check all markdown files",
    "ideaspaces id notes/acme.md             # check one file",
    "ideaspaces id --fix .                   # inject missing node_id fields",
    "ideaspaces id --fix --staged            # pre-commit mode: fix staged markdown files and re-stage",
    "ideaspaces id --regenerate copy.md      # replace one file's node_id",
    "ideaspaces id install-hook              # install repo-local pre-commit hook"
  ],
  async run(args2, flags2, global2) {
    const output = createOutput(global2);
    if (args2[0] === "install-hook") {
      return installHook(output);
    }
    if (flags2.regenerate === true) {
      output.error("Usage: ideaspaces id --regenerate <path>");
      return 1;
    }
    const regeneratePath = typeof flags2.regenerate === "string" ? flags2.regenerate : void 0;
    if (regeneratePath) {
      return regenerateFile(regeneratePath, output, Boolean(flags2.staged));
    }
    const staged = Boolean(flags2.staged);
    const fix = Boolean(flags2.fix);
    const target = args2[0] ?? ".";
    if (!staged && !existsSync6(resolve5(target))) {
      output.error(`Path not found: ${target}`);
      return 1;
    }
    let files;
    if (staged) {
      try {
        files = stagedMarkdownFiles();
      } catch (err) {
        output.error(err instanceof Error ? err.message : String(err));
        return 1;
      }
    } else {
      files = await collectMarkdownFiles(target);
    }
    if (!files.length) {
      output.result({ files: 0, ok: true }, "No markdown files found.");
      return 0;
    }
    const scan = await scanMarkdownIdentityFiles(files);
    if (fix) {
      if (scan.malformed.length || scan.duplicates.length) {
        output.error(renderIdentityProblems(scan));
        output.error("Run `ideaspaces id --regenerate <path>` to intentionally reset a malformed or duplicate identity.");
        return 1;
      }
      let fixed = 0;
      for (const file of scan.missing) {
        const content = await readFile2(file.path, "utf-8");
        const result = ensureMarkdownNodeId(content);
        if (result.changed) {
          await writeFile(file.path, result.content, "utf-8");
          fixed += 1;
        }
      }
      if (staged && fixed > 0) {
        try {
          gitAdd(scan.missing.map((f) => f.path));
        } catch (err) {
          output.error(err instanceof Error ? err.message : String(err));
          return 1;
        }
      }
      output.result({ files: scan.files.length, fixed, ok: true }, fixed === 0 ? `OK: ${scan.files.length} markdown files already have node_id.` : `Fixed ${fixed} markdown files.`);
      return 0;
    }
    if (scan.missing.length || scan.malformed.length || scan.duplicates.length) {
      output.error(renderIdentityProblems(scan));
      return 1;
    }
    output.result({ files: scan.files.length, ok: true }, `OK: ${scan.files.length} markdown files have valid node_id fields.`);
    return 0;
  }
};
async function regenerateFile(path, output, staged) {
  const abs = resolve5(path);
  if (!existsSync6(abs) || !isMarkdownPath(abs)) {
    output.error(`Not a markdown file: ${path}`);
    return 1;
  }
  const s = await stat(abs);
  if (!s.isFile()) {
    output.error(`Not a file: ${path}`);
    return 1;
  }
  if (staged) {
    try {
      assertNoUnstagedMarkdown([abs]);
    } catch (err) {
      output.error(err instanceof Error ? err.message : String(err));
      return 1;
    }
  }
  const content = await readFile2(abs, "utf-8");
  const result = ensureMarkdownNodeId(content, { regenerate: true });
  await writeFile(abs, result.content, "utf-8");
  if (staged) {
    try {
      gitAdd([abs]);
    } catch (err) {
      output.error(err instanceof Error ? err.message : String(err));
      return 1;
    }
  }
  output.result({ path: abs, node_id: result.node_id, old_node_id: result.old_node_id, regenerated: true }, result.old_node_id ? `Regenerated ${relative2(process.cwd(), abs) || abs}: ${result.old_node_id} \u2192 ${result.node_id}` : `Added ${relative2(process.cwd(), abs) || abs}: ${result.node_id}`);
  return 0;
}
function stagedMarkdownFiles() {
  const repoRoot = gitRepoRoot();
  const staged = gitNameList(repoRoot, ["diff", "--cached", "--name-only", "-z", "--diff-filter=ACMR", "--", "*.md"]);
  assertNoUnstagedMarkdown(staged);
  return staged;
}
function assertNoUnstagedMarkdown(paths) {
  const repoRoot = gitRepoRoot();
  const unstaged = new Set(gitNameList(repoRoot, ["diff", "--name-only", "-z", "--", "*.md"]));
  const overlap = paths.filter((p) => unstaged.has(p));
  if (overlap.length > 0) {
    throw new Error("staged identity fix refuses partially-staged markdown files:\n" + overlap.map((p) => `  ${relative2(process.cwd(), p) || p}`).join("\n") + "\nStage or stash those changes, then retry.");
  }
}
function gitRepoRoot() {
  const r = spawnSync4("git", ["rev-parse", "--show-toplevel"], { encoding: "utf-8" });
  if (r.status !== 0) {
    throw new Error(r.stderr.trim() || "git rev-parse --show-toplevel failed");
  }
  return r.stdout.trim();
}
function gitNameList(repoRoot, args2) {
  const r = spawnSync4("git", ["-C", repoRoot, ...args2], { encoding: "utf-8" });
  if (r.status !== 0) {
    throw new Error(r.stderr.trim() || `git ${args2.join(" ")} failed`);
  }
  return r.stdout.split("\0").filter(Boolean).map((p) => join7(repoRoot, p));
}
function gitAdd(paths) {
  if (!paths.length)
    return;
  const r = spawnSync4("git", ["add", "--", ...paths], { encoding: "utf-8" });
  if (r.status !== 0) {
    throw new Error(r.stderr.trim() || "git add failed");
  }
}
async function installHook(output) {
  const gitDir = findGitDir();
  if (!gitDir) {
    output.error("Not a git repo. Run this from inside the repo where you want the hook installed.");
    return 1;
  }
  const hookPath = join7(gitDir, "hooks", "pre-commit");
  const hook = [
    "#!/bin/sh",
    HOOK_MARKER,
    "set -e",
    hookCommand(),
    ""
  ].join("\n");
  if (existsSync6(hookPath)) {
    const existing = await readFile2(hookPath, "utf-8");
    if (existing.includes(HOOK_MARKER)) {
      output.result({ installed: true, path: hookPath, already_installed: true }, `Pre-commit hook already installed: ${hookPath}`);
      return 0;
    }
    output.error(`pre-commit hook already exists: ${hookPath}
Refusing to overwrite it. Move it aside or merge \`ideaspaces id --fix --staged\` manually.`);
    return 1;
  }
  await mkdir(dirname2(hookPath), { recursive: true });
  await writeFile(hookPath, hook, "utf-8");
  await chmod(hookPath, 493);
  output.result({ installed: true, path: hookPath }, `Installed pre-commit hook: ${hookPath}`);
  return 0;
}
function hookCommand() {
  const entry = process.argv[1];
  if (entry && existsSync6(entry)) {
    return `node ${shellQuote(resolve5(entry))} id --fix --staged`;
  }
  return "ideaspaces id --fix --staged";
}
function shellQuote(value) {
  return `'${value.replace(/'/g, `'"'"'`)}'`;
}
function findGitDir() {
  const r = spawnSync4("git", ["rev-parse", "--git-dir"], { encoding: "utf-8" });
  if (r.status !== 0)
    return null;
  const gitDir = r.stdout.trim();
  if (!gitDir)
    return null;
  return resolve5(gitDir);
}

// dist/auth/session-state.js
import { existsSync as existsSync7, mkdirSync as mkdirSync3, readFileSync as readFileSync3, unlinkSync as unlinkSync2, writeFileSync as writeFileSync3 } from "node:fs";
import { homedir as homedir2 } from "node:os";
import { join as join8 } from "node:path";
var CONFIG_DIR = join8(homedir2(), ".ideaspaces");
var SESSION_FILE = join8(CONFIG_DIR, "session.json");
function clearSessionState() {
  try {
    if (existsSync7(SESSION_FILE))
      unlinkSync2(SESSION_FILE);
  } catch {
  }
}

// dist/commands/power/logout.js
var logoutCommand = {
  name: "logout",
  description: "Log out and clear stored credentials",
  usage: "ideaspaces power logout",
  async run(_args, _flags, global2) {
    const output = createOutput(global2);
    deleteCredentials();
    clearSessionState();
    output.result({ logged_out: true }, "Logged out. Credentials and session state removed.");
    return 0;
  }
};

// dist/router.js
var topLevel = [
  createCommand,
  loginCommand,
  publishCommand,
  writeCommand,
  credentialCommand,
  idCommand
];
var power = [
  logoutCommand
];
function findCommand_(name) {
  return topLevel.find((c) => c.name === name) ?? power.find((c) => c.name === name);
}
function printHelp() {
  const lines = [
    "Usage: ideaspaces <command> [options]",
    "",
    "Commands:"
  ];
  for (const cmd2 of topLevel) {
    lines.push(`  ${cmd2.name.padEnd(14)} ${cmd2.description}`);
  }
  lines.push("", "  power          Advanced tools (logout, ...)");
  lines.push("", "Global flags:");
  lines.push("  --json         Structured JSON output to stdout");
  lines.push("  --quiet        Suppress non-essential output");
  lines.push("  --yes          Skip confirmation prompts");
  lines.push("  --help         Show help");
  lines.push("", "Run: ideaspaces <command> --help for command-specific help.");
  process.stderr.write(lines.join("\n") + "\n");
}
function printPowerHelp() {
  const lines = [
    "Usage: ideaspaces power <command> [options]",
    "",
    "Power tools:"
  ];
  for (const cmd2 of power) {
    lines.push(`  ${cmd2.name.padEnd(14)} ${cmd2.description}`);
  }
  lines.push("", "Run: ideaspaces power <command> --help for details.");
  process.stderr.write(lines.join("\n") + "\n");
}

// dist/errors.js
function handleError(err, output) {
  if (err instanceof Error) {
    if (err.message.includes("Not logged in")) {
      output.error(`Error: ${err.message}
Run: ideaspaces login`);
      return 2;
    }
    output.error(`Error: ${err.message}`);
    return 1;
  }
  output.error(`Error: ${String(err)}`);
  return 1;
}

// dist/argv.js
function parseBool(value) {
  const v = value.trim().toLowerCase();
  return !(v === "false" || v === "0" || v === "no" || v === "off");
}
function parseArgs(argv) {
  const global2 = { json: false, quiet: false, yes: false, help: false };
  const flags2 = {};
  const positional = [];
  let stopFlags = false;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--") {
      stopFlags = true;
      continue;
    }
    if (!stopFlags && arg.startsWith("--")) {
      const eqIdx = arg.indexOf("=");
      if (eqIdx !== -1) {
        const key2 = arg.slice(2, eqIdx);
        const value = arg.slice(eqIdx + 1);
        if (key2 === "json") {
          global2.json = parseBool(value);
          continue;
        }
        if (key2 === "quiet") {
          global2.quiet = parseBool(value);
          continue;
        }
        if (key2 === "yes") {
          global2.yes = parseBool(value);
          continue;
        }
        if (key2 === "help") {
          global2.help = parseBool(value);
          continue;
        }
        if (key2 === "repo") {
          global2.repo = value;
          continue;
        }
        flags2[key2] = value;
        continue;
      }
      const key = arg.slice(2);
      if (key === "json") {
        global2.json = true;
        continue;
      }
      if (key === "quiet") {
        global2.quiet = true;
        continue;
      }
      if (key === "yes") {
        global2.yes = true;
        continue;
      }
      if (key === "help") {
        global2.help = true;
        continue;
      }
      if (key === "repo" && i + 1 < argv.length && !argv[i + 1].startsWith("--")) {
        global2.repo = argv[++i];
        continue;
      }
      if (i + 1 < argv.length && !argv[i + 1].startsWith("--")) {
        flags2[key] = argv[++i];
      } else {
        flags2[key] = true;
      }
    } else {
      positional.push(arg);
    }
  }
  const command2 = positional[0];
  const args2 = positional.slice(1);
  return { global: global2, command: command2, args: args2, flags: flags2 };
}

// dist/main.js
var { global, command, args, flags } = parseArgs(process.argv.slice(2));
if (!command || global.help && !command) {
  printHelp();
  process.exit(0);
}
var resolvedCommand = command;
var resolvedArgs = args;
if (command === "power") {
  if (global.help || !args[0]) {
    printPowerHelp();
    process.exit(0);
  }
  resolvedCommand = args[0];
  resolvedArgs = args.slice(1);
}
var cmd = findCommand_(resolvedCommand);
if (!cmd) {
  process.stderr.write(`Unknown command: ${resolvedCommand}
Run: ideaspaces --help
`);
  process.exit(1);
}
if (global.help) {
  const lines = [`Usage: ${cmd.usage}`, "", cmd.description];
  if (cmd.examples?.length) {
    lines.push("", "Examples:");
    for (const ex of cmd.examples)
      lines.push(`  ${ex}`);
  }
  process.stderr.write(lines.join("\n") + "\n");
  process.exit(0);
}
try {
  const exitCode = await cmd.run(resolvedArgs, flags, global);
  process.exit(exitCode);
} catch (err) {
  const output = createOutput(global);
  const exitCode = handleError(err, output);
  process.exit(exitCode);
}
