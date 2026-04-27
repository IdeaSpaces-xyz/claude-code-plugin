#!/usr/bin/env node

// dist/commands/create.js
import { promises as fs } from "node:fs";
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, resolve, basename } from "node:path";

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
var PURPOSE_MD = `---
name: Purpose
summary: Why this space exists \u2014 the North Star. Fill in via \`/is-setup\` or
  edit directly.
---

# Purpose

_Why does this space exist? What's it for?_

Two or three sentences. Concrete over aspirational. What would make this
valuable to you six months from now?
`;
var NOW_MD = `---
name: Now
summary: What's currently active in this space. Fill in via \`/is-setup\` or
  edit directly. Update at natural breaks; let it drift, then reflect.
---

# Now

_What are you working on right now? What would progress look like this week?_

A single paragraph or a short list. Concrete, evaluable.
`;
var NEXT_MD = `---
name: Next
summary: What's queued after Now. Vague is OK \u2014 agents and humans figure out
  the flow.
---

# Next

_What's queued after the current focus? What's plausibly next but not yet
active?_

Vague is OK. Leave a placeholder if nothing comes to mind.
`;
var CLAUDE_MD = `# CLAUDE.md

> This is an ideaspace. The five-file \`_agent/\` contract carries the Agreement.

## Orient

At session start, read in order:

1. [\`_agent/foundation.md\`](_agent/foundation.md) \u2014 what this place is, baseline behaviors
2. [\`_agent/guide.md\`](_agent/guide.md) \u2014 how agent and human work together here
3. [\`_agent/purpose.md\`](_agent/purpose.md) \u2014 why this exists
4. [\`_agent/now.md\`](_agent/now.md) \u2014 what's currently active
5. [\`_agent/next.md\`](_agent/next.md) \u2014 what's queued

These five files are loaded by position. Read them before answering.

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
  guide: GUIDE_MD,
  purpose: PURPOSE_MD,
  now: NOW_MD,
  next: NEXT_MD
};

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
  description: "Scaffold an ideaspace (five-file _agent/ contract + CLAUDE.md + .gitignore defaults)",
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
    const targetDir = name ? resolve(process.cwd(), name) : process.cwd();
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
    output.result({ target: targetDir, shape, privateAgent, scaffolded: true }, `Scaffolded ${describeTarget(targetDir, name)} (${shape}${privateAgent ? ", private _agent/" : ""}).
Next: open Claude Code in ${name ? `./${name}` : "this directory"} and run \`/is-setup\` to seed purpose / now / next.`);
    return 0;
  }
};
async function inspect(targetDir) {
  if (!existsSync(targetDir)) {
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
  const isGitRepo = existsSync(join(targetDir, ".git"));
  const hasClaude = existsSync(join(targetDir, "CLAUDE.md"));
  const hasGitignore = existsSync(join(targetDir, ".gitignore"));
  const agentDir = join(targetDir, "_agent");
  const hasNewAgent = existsSync(join(agentDir, "foundation.md"));
  const hasOldAgent = existsSync(agentDir) && OLD_AGENT_FILES.some((f) => existsSync(join(agentDir, f))) && !hasNewAgent;
  let hasCodeSignal = false;
  for (const sig of CODE_SIGNALS) {
    if (existsSync(join(targetDir, sig))) {
      hasCodeSignal = true;
      break;
    }
  }
  let markdownCount = 0;
  try {
    const entries = await fs.readdir(targetDir, { withFileTypes: true });
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
    steps.push({ op: "write", path: join(targetDir, "_agent", `${fileName}.md`) });
  }
  const claudeFile = privateAgent ? "CLAUDE.local.md" : "CLAUDE.md";
  if (!inspection.hasClaude) {
    steps.push({ op: "write", path: join(targetDir, claudeFile) });
  }
  steps.push({
    op: inspection.hasGitignore ? "append" : "write",
    path: join(targetDir, ".gitignore"),
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
  await fs.mkdir(targetDir, { recursive: true });
  if (!inspection.isGitRepo) {
    runGit(targetDir, ["init", "-q", "-b", "main"]);
  }
  await fs.mkdir(join(targetDir, "_agent"), { recursive: true });
  for (const [name, content] of Object.entries(CONTRACT_TEMPLATES)) {
    await fs.writeFile(join(targetDir, "_agent", `${name}.md`), content, "utf-8");
  }
  const claudeFile = privateAgent ? "CLAUDE.local.md" : "CLAUDE.md";
  if (!inspection.hasClaude) {
    await fs.writeFile(join(targetDir, claudeFile), CLAUDE_MD, "utf-8");
  }
  const gitignorePath = join(targetDir, ".gitignore");
  const additions = gitignoreDefaults({ privateAgent });
  if (inspection.hasGitignore) {
    const existing = await fs.readFile(gitignorePath, "utf-8");
    if (!existing.includes("# ideaspace defaults")) {
      await fs.writeFile(gitignorePath, existing.endsWith("\n") ? existing + additions : existing + "\n" + additions, "utf-8");
    }
  } else {
    await fs.writeFile(gitignorePath, additions.replace(/^\n/, ""), "utf-8");
  }
  runGit(targetDir, ["add", "."]);
  runGit(targetDir, ["commit", "-q", "-m", "Initial ideaspace scaffold"]);
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

// dist/auth/credentials.js
import { existsSync as existsSync2, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join as join2 } from "node:path";
var CONFIG_DIR = join2(homedir(), ".ideaspaces");
var CREDENTIALS_FILE = join2(CONFIG_DIR, "credentials.json");
function loadStoredCredentials() {
  try {
    if (!existsSync2(CREDENTIALS_FILE))
      return null;
    const raw = readFileSync(CREDENTIALS_FILE, "utf-8");
    const data = JSON.parse(raw);
    if (!data.api_key)
      return null;
    return data;
  } catch {
    return null;
  }
}
function saveCredentials(creds) {
  if (!existsSync2(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true, mode: 448 });
  }
  writeFileSync(CREDENTIALS_FILE, JSON.stringify(creds, null, 2) + "\n", {
    mode: 384
  });
}
function deleteCredentials() {
  try {
    if (existsSync2(CREDENTIALS_FILE)) {
      unlinkSync(CREDENTIALS_FILE);
    }
  } catch {
  }
}
var DEFAULT_API_URL = "https://api.ideaspaces.xyz";
function loadConfig() {
  const envKey = process.env.IS_API_KEY;
  const envRepo = process.env.IS_REPO || "";
  if (envKey) {
    return {
      apiUrl: (process.env.IS_API_URL || DEFAULT_API_URL).replace(/\/$/, ""),
      apiKey: envKey,
      repo: envRepo
    };
  }
  const stored = loadStoredCredentials();
  if (stored) {
    return {
      apiUrl: (process.env.IS_API_URL || stored.api_url || DEFAULT_API_URL).replace(/\/$/, ""),
      apiKey: stored.api_key,
      repo: envRepo || stored.repo_id || ""
    };
  }
  return null;
}
function getDefaultApiUrl() {
  return (process.env.IS_API_URL || DEFAULT_API_URL).replace(/\/$/, "");
}

// dist/auth/callback-server.js
import { createServer } from "node:http";
import { URL } from "node:url";
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
  return new Promise((resolve3, reject) => {
    let tokenResolve = null;
    let tokenReject = null;
    const server = createServer((req, res) => {
      const url = new URL(req.url || "/", `http://127.0.0.1`);
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
      resolve3({
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

// dist/commands/write.js
import { promises as fs2 } from "node:fs";
import { existsSync as existsSync3 } from "node:fs";
import { spawnSync as spawnSync2 } from "node:child_process";
import { dirname, resolve as resolve2 } from "node:path";

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

// dist/commands/write.js
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
    const absPath = resolve2(path);
    if (existsSync3(absPath) && !force) {
      output.error(`File exists: ${path}
Re-run with --force to overwrite.`);
      return 5;
    }
    const body = stripFrontmatter(content);
    const finalContent = composeFrontmatter(fm) + body;
    await fs2.mkdir(dirname(absPath), { recursive: true });
    await fs2.writeFile(absPath, finalContent, "utf-8");
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
  const stage = spawnSync2("git", ["add", absPath], { encoding: "utf-8" });
  if (stage.status !== 0) {
    throw new Error(stage.stderr.trim() || `git add exit ${stage.status}`);
  }
  const subject = message?.trim() || `Update ${absPath.split("/").pop()}`;
  const commit = spawnSync2("git", ["commit", "-q", "-m", subject], { encoding: "utf-8" });
  if (commit.status !== 0) {
    throw new Error(commit.stderr.trim() || commit.stdout.trim() || `git commit exit ${commit.status}`);
  }
  const sha = spawnSync2("git", ["rev-parse", "HEAD"], { encoding: "utf-8" });
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

// dist/auth/session-state.js
import { existsSync as existsSync4, mkdirSync as mkdirSync2, readFileSync as readFileSync2, unlinkSync as unlinkSync2, writeFileSync as writeFileSync2 } from "node:fs";
import { homedir as homedir2 } from "node:os";
import { join as join3 } from "node:path";
var CONFIG_DIR2 = join3(homedir2(), ".ideaspaces");
var SESSION_FILE = join3(CONFIG_DIR2, "session.json");
function clearSessionState() {
  try {
    if (existsSync4(SESSION_FILE))
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
  writeCommand,
  credentialCommand
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
