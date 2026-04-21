#!/usr/bin/env node

// dist/commands/login.js
import { exec as exec2 } from "node:child_process";
import { platform } from "node:os";

// ../sdk/dist/transport.js
var SdkError = class extends Error {
  category;
  status;
  retryable;
  retryAfterMs;
  constructor(opts) {
    super(opts.message);
    this.name = "SdkError";
    this.category = opts.category;
    this.status = opts.status;
    this.retryable = opts.retryable;
    this.retryAfterMs = opts.retryAfterMs;
  }
};
function classifyStatus(status, headers) {
  if (status === 429) {
    const retryAfter = headers["retry-after"];
    let retryAfterMs;
    if (retryAfter) {
      const seconds = Number(retryAfter);
      retryAfterMs = Number.isFinite(seconds) ? seconds * 1e3 : void 0;
    }
    return { category: "rate_limited", retryable: true, retryAfterMs };
  }
  if (status === 502 || status === 503 || status === 529) {
    return { category: "overloaded", retryable: true };
  }
  if (status === 401) {
    return { category: "auth_error", retryable: false };
  }
  if (status === 404) {
    return { category: "not_found", retryable: false };
  }
  if (status >= 400 && status < 500) {
    return { category: "client_error", retryable: false };
  }
  return { category: "overloaded", retryable: true };
}
function backoffMs(attempt) {
  const base = Math.min(500 * Math.pow(2, attempt), 16e3);
  const jitter = Math.random() * base * 0.25;
  return base + jitter;
}
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
var DEFAULT_RETRYABLE_STATUSES = [429, 502, 503, 529];
function createFetchTransport(config) {
  const maxRetries = config.retry?.maxRetries ?? 3;
  const retryableStatuses = config.retry?.retryableStatuses ?? DEFAULT_RETRYABLE_STATUSES;
  const timeout = config.timeout ?? 3e4;
  return {
    async request(method, path, body) {
      const url = `${config.apiUrl}/api/v1${path}`;
      const headers = {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json"
      };
      let lastError;
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), timeout);
          let resp;
          try {
            resp = await fetch(url, {
              method,
              headers,
              body: body ? JSON.stringify(body) : void 0,
              signal: controller.signal
            });
          } finally {
            clearTimeout(timer);
          }
          if (resp.ok) {
            const responseHeaders2 = {};
            resp.headers.forEach((v, k) => {
              responseHeaders2[k.toLowerCase()] = v;
            });
            const bodyText = await resp.text();
            return {
              status: resp.status,
              headers: responseHeaders2,
              json: async () => JSON.parse(bodyText),
              text: async () => bodyText
            };
          }
          const responseHeaders = {};
          resp.headers.forEach((v, k) => {
            responseHeaders[k.toLowerCase()] = v;
          });
          const errorText = await resp.text().catch(() => "");
          let detail = errorText;
          try {
            const json = JSON.parse(errorText);
            detail = json.detail || json.error || errorText;
          } catch {
          }
          const { category, retryable, retryAfterMs } = classifyStatus(resp.status, responseHeaders);
          const canRetry = retryable && retryableStatuses.includes(resp.status) && attempt < maxRetries;
          if (!canRetry) {
            throw new SdkError({
              message: `${method} ${path}: ${resp.status} \u2014 ${detail}`,
              category,
              status: resp.status,
              retryable,
              retryAfterMs
            });
          }
          const delayMs = retryAfterMs ?? backoffMs(attempt);
          await sleep(delayMs);
          lastError = new SdkError({
            message: `${method} ${path}: ${resp.status} \u2014 ${detail}`,
            category,
            status: resp.status,
            retryable,
            retryAfterMs
          });
        } catch (err) {
          if (err instanceof SdkError)
            throw err;
          const isTimeout = err instanceof DOMException && err.name === "AbortError";
          const category = isTimeout ? "timeout" : "network_error";
          if (attempt < maxRetries) {
            await sleep(backoffMs(attempt));
            lastError = err instanceof Error ? err : new Error(String(err));
            continue;
          }
          throw new SdkError({
            message: `${method} ${path}: ${category} \u2014 ${err instanceof Error ? err.message : String(err)}`,
            category,
            retryable: true
          });
        }
      }
      throw lastError || new Error("Unexpected transport error");
    }
  };
}

// ../sdk/dist/client.js
var DEFAULT_API_URL = "https://api.ideaspaces.xyz";
var IsClient = class {
  transport;
  repo;
  constructor(transport, repo) {
    this.transport = transport;
    this.repo = repo;
  }
  /** Current repo ID. Throws if not set. */
  get repoId() {
    if (!this.repo) {
      throw new Error("No repo selected. Pass repo in config, or call autoSelectRepo().");
    }
    return this.repo;
  }
  /** Whether a repo is selected. */
  get isConnected() {
    return !!this.repo;
  }
  /** Update the active repo (e.g. after autoSelectRepo). */
  setRepo(repoId) {
    this.repo = repoId;
  }
  // ─── Internal request wrapper ──────────────────────────────────
  async req(method, path, body) {
    const start = Date.now();
    const resp = await this.transport.request(method, path, body);
    const data = await resp.json();
    const requestMs = Date.now() - start;
    let rateLimit;
    const remaining = resp.headers["x-ratelimit-remaining"];
    const resetAt = resp.headers["x-ratelimit-reset"];
    if (remaining !== void 0) {
      rateLimit = {
        remaining: Number(remaining),
        resetAt: resetAt ? new Date(Number(resetAt) * 1e3) : /* @__PURE__ */ new Date()
      };
    }
    return { data, meta: { requestMs, retries: 0, rateLimit } };
  }
  // ─── Repos ────────────────────────────────────────────────────
  async listRepos() {
    return this.req("GET", "/repos");
  }
  async createRepo(body) {
    return this.req("POST", "/repos", body);
  }
  async connectRepo(body) {
    return this.req("POST", "/repos/connect", body);
  }
  async reindexRepo(repoId = this.repoId) {
    return this.req("POST", `/repos/${repoId}/reindex`);
  }
  // ─── Outline ──────────────────────────────────────────────────
  async outline() {
    return this.req("GET", `/repos/${this.repoId}/nodes/outline`);
  }
  // ─── Tree ─────────────────────────────────────────────────────
  async navigate(path = "") {
    const encodedPath = path ? `/${encodeURIComponent(path)}` : "";
    const resp = await this.req("GET", `/repos/${this.repoId}/tree${encodedPath}`);
    resp.data.children = resp.data.children.map((child) => ({
      ...child,
      type: child.type === "dir" ? "directory" : child.type
    }));
    return resp;
  }
  // ─── Search ───────────────────────────────────────────────────
  async search(params) {
    const qs = new URLSearchParams();
    qs.set("q", params.query);
    qs.set("repo_id", this.repoId);
    if (params.scope)
      qs.set("scope", params.scope);
    if (params.node_type)
      qs.set("node_type", params.node_type);
    if (params.attached_to)
      qs.set("attached_to", params.attached_to);
    if (params.contributed_by)
      qs.set("contributed_by", params.contributed_by);
    const tag = params.tag ?? params.tags;
    if (tag) {
      qs.set("tag", tag);
      qs.set("tags", tag);
    }
    const topK = params.top_k ?? params.limit;
    if (typeof topK === "number") {
      qs.set("top_k", String(topK));
      qs.set("limit", String(topK));
    }
    return this.req("GET", `/search?${qs.toString()}`);
  }
  // ─── Files ────────────────────────────────────────────────────
  async readFile(path, opts) {
    const qs = new URLSearchParams();
    if (opts?.offset)
      qs.set("offset", String(opts.offset));
    if (opts?.limit)
      qs.set("limit", String(opts.limit));
    const query = qs.toString() ? `?${qs.toString()}` : "";
    return this.req("GET", `/repos/${this.repoId}/files/${encodeURIComponent(path)}${query}`);
  }
  async readNode(nodeId) {
    return this.req("GET", `/repos/${this.repoId}/nodes/${nodeId}`);
  }
  async _withDefaultIfMatch(path, body, opts) {
    if (opts?.force || body.if_match !== void 0)
      return body;
    try {
      const { data } = await this.readFile(path);
      if (!data.last_commit_sha)
        return body;
      return { ...body, if_match: data.last_commit_sha };
    } catch (error) {
      if (error instanceof SdkError && error.status === 404) {
        return body;
      }
      throw error;
    }
  }
  async writeFile(path, body, opts) {
    const payload = await this._withDefaultIfMatch(path, body, opts);
    return this.req("PUT", `/repos/${this.repoId}/files/${encodeURIComponent(path)}`, payload);
  }
  // ─── Grep ─────────────────────────────────────────────────────
  async grep(pattern, scope) {
    const qs = new URLSearchParams({ pattern });
    if (scope)
      qs.set("scope", scope);
    return this.req("GET", `/repos/${this.repoId}/grep?${qs.toString()}`);
  }
  async grepSections(heading, scope, maxLines) {
    const qs = new URLSearchParams({ heading });
    if (scope)
      qs.set("scope", scope);
    if (maxLines)
      qs.set("max_lines", String(maxLines));
    return this.req("GET", `/repos/${this.repoId}/grep/sections?${qs.toString()}`);
  }
  // ─── Tags ─────────────────────────────────────────────────────
  async listTags(prefix) {
    const qs = new URLSearchParams();
    if (prefix)
      qs.set("q", prefix);
    const query = qs.toString() ? `?${qs.toString()}` : "";
    return this.req("GET", `/repos/${this.repoId}/tags${query}`);
  }
  // ─── Node history ─────────────────────────────────────────────
  async nodeHistory(nodeId) {
    return this.req("GET", `/repos/${this.repoId}/nodes/${nodeId}/history`);
  }
  async nodeAtVersion(nodeId, sha) {
    return this.req("GET", `/repos/${this.repoId}/nodes/${nodeId}/history/${sha}`);
  }
  // ─── Delete node ──────────────────────────────────────────────
  async deleteNode(nodeId) {
    return this.req("DELETE", `/repos/${this.repoId}/nodes/${nodeId}`);
  }
  // ─── Move / delete file ───────────────────────────────────────
  async moveFile(source, destination) {
    return this.req("POST", `/repos/${this.repoId}/files/move`, {
      source,
      destination: destination ?? null
    });
  }
  // ─── Update metadata ──────────────────────────────────────────
  async updateMetadata(nodeId, fields) {
    return this.req("PATCH", `/repos/${this.repoId}/nodes/${nodeId}/metadata`, fields);
  }
  // ─── List nodes ───────────────────────────────────────────────
  async listNodes(params) {
    const qs = new URLSearchParams();
    if (params?.node_type)
      qs.set("node_type", params.node_type);
    if (params?.tag)
      qs.set("tag", params.tag);
    if (params?.dir_path)
      qs.set("dir_path", params.dir_path);
    if (params?.attached_to)
      qs.set("attached_to", params.attached_to);
    if (params?.contributed_by)
      qs.set("contributed_by", params.contributed_by);
    if (params?.origin)
      qs.set("origin", params.origin);
    if (params?.limit)
      qs.set("limit", String(params.limit));
    if (params?.offset)
      qs.set("offset", String(params.offset));
    if (params?.sort_by)
      qs.set("sort_by", params.sort_by);
    if (params?.sort_order)
      qs.set("sort_order", params.sort_order);
    const query = qs.toString() ? `?${qs.toString()}` : "";
    return this.req("GET", `/repos/${this.repoId}/nodes${query}`);
  }
  // ─── File status (bulk sync) ──────────────────────────────────
  async fileStatus(scope) {
    const qs = new URLSearchParams();
    if (scope)
      qs.set("scope", scope);
    const query = qs.toString() ? `?${qs.toString()}` : "";
    return this.req("GET", `/repos/${this.repoId}/files/status${query}`);
  }
  // ─── Git operations ───────────────────────────────────────────
  async gitOps(params) {
    const qs = new URLSearchParams({ op: params.op });
    if (params.path)
      qs.set("path", params.path);
    if (params.ref)
      qs.set("ref", params.ref);
    if (params.text)
      qs.set("text", params.text);
    if (params.since)
      qs.set("since", params.since);
    if (params.limit)
      qs.set("limit", String(params.limit));
    return this.req("GET", `/repos/${this.repoId}/git?${qs.toString()}`);
  }
};
function createClient(config) {
  const transport = config.transport ?? createFetchTransport({
    apiUrl: config.apiUrl ?? DEFAULT_API_URL,
    apiKey: config.apiKey,
    timeout: config.timeout,
    retry: config.retry
  });
  return new IsClient(transport, config.repo ?? "");
}

// ../sdk/dist/patterns/session.js
function createSession(client, opts) {
  let cachedAwareness = null;
  let knownHeadSha = null;
  let lastSha = opts?.lastSha ?? null;
  async function getCurrentHead() {
    try {
      const { data } = await client.gitOps({ op: "log", limit: 1 });
      return data.entries?.[0]?.sha ?? null;
    } catch {
      return null;
    }
  }
  async function buildAwareness() {
    const { data: root } = await client.navigate("");
    const lines = [];
    if (root.now) {
      const nowLines = root.now.split("\n").filter((l) => l.trim() && !l.startsWith("---") && !l.startsWith("name:") && !l.startsWith("summary:"));
      const firstLine = nowLines.find((l) => !l.startsWith("#") && l.trim().length > 0);
      if (firstLine)
        lines.push(`Now: ${firstLine.trim().slice(0, 200)}`);
    }
    const dirs = root.children.filter((c) => c.type === "directory" || c.type === "dir");
    const files = root.children.filter((c) => c.type !== "directory" && c.type !== "dir");
    if (dirs.length || files.length) {
      lines.push(`
Tree (${root.file_count} files):`);
      for (const d of dirs) {
        const count = d.file_count ? ` (${d.file_count})` : "";
        const summary = d.summary ? ` \u2014 ${d.summary}` : "";
        lines.push(`  ${d.name}/${count}${summary}`);
      }
      for (const f of files) {
        const summary = f.summary ? ` \u2014 ${f.summary}` : "";
        lines.push(`  ${f.name}${summary}`);
      }
    }
    if (root.agent_context.length) {
      const contextNames = root.agent_context.map((a) => a.name).join(", ");
      lines.push(`
Agent context: ${contextNames}`);
    }
    if (lastSha) {
      try {
        const { data: changes } = await client.gitOps({
          op: "changes",
          since: lastSha
        });
        if (changes.changes?.length) {
          lines.push(`
Since last session (${changes.changes.length} changes):`);
          for (const c of changes.changes.slice(0, 15)) {
            lines.push(`  ${c.status} ${c.path}`);
          }
          if (changes.changes.length > 15) {
            lines.push(`  ... and ${changes.changes.length - 15} more`);
          }
        }
      } catch {
      }
    }
    knownHeadSha = await getCurrentHead();
    return lines.join("\n");
  }
  return {
    async getAwarenessBlock() {
      if (cachedAwareness !== null)
        return cachedAwareness;
      cachedAwareness = await buildAwareness();
      return cachedAwareness;
    },
    async getContextFor(query, opts2) {
      const { data } = await client.search({
        query,
        scope: opts2?.scope,
        limit: opts2?.limit ?? 10
      });
      if (!data.results.length)
        return `No results for "${query}"`;
      const lines = [];
      for (const r of data.results) {
        const score = r.score.toFixed(2);
        lines.push(`${score}  ${r.path}`);
        if (r.name)
          lines.push(`      ${r.name}`);
        if (r.summary)
          lines.push(`      ${r.summary}`);
      }
      return lines.join("\n");
    },
    async getChanges() {
      if (!knownHeadSha)
        return null;
      const currentHead = await getCurrentHead();
      if (!currentHead || currentHead === knownHeadSha) {
        return null;
      }
      try {
        const { data } = await client.gitOps({
          op: "changes",
          since: knownHeadSha
        });
        knownHeadSha = currentHead;
        if (!data.changes?.length)
          return null;
        const lines = data.changes.slice(0, 15).map((c) => `  ${c.status} ${c.path}`);
        if (data.changes.length > 15) {
          lines.push(`  ... and ${data.changes.length - 15} more`);
        }
        return {
          changed: true,
          summary: `${data.changes.length} change${data.changes.length === 1 ? "" : "s"}:
${lines.join("\n")}`
        };
      } catch {
        return null;
      }
    },
    async trackHead() {
      knownHeadSha = await getCurrentHead();
    },
    invalidate() {
      cachedAwareness = null;
    }
  };
}

// ../sdk/dist/patterns/repo.js
async function autoSelectRepo(client) {
  const { data } = await client.listRepos();
  const repos = data.repos;
  if (repos.length === 1) {
    client.setRepo(repos[0].repo_id);
    return { repoId: repos[0].repo_id, repos };
  }
  return { repoId: null, repos };
}

// dist/auth/credentials.js
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
var CONFIG_DIR = join(homedir(), ".ideaspaces");
var CREDENTIALS_FILE = join(CONFIG_DIR, "credentials.json");
function loadStoredCredentials() {
  try {
    if (!existsSync(CREDENTIALS_FILE))
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
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true, mode: 448 });
  }
  writeFileSync(CREDENTIALS_FILE, JSON.stringify(creds, null, 2) + "\n", {
    mode: 384
  });
}
function deleteCredentials() {
  try {
    if (existsSync(CREDENTIALS_FILE)) {
      unlinkSync(CREDENTIALS_FILE);
    }
  } catch {
  }
}
var DEFAULT_API_URL2 = "https://api.ideaspaces.xyz";
function loadConfig() {
  const envKey = process.env.IS_API_KEY;
  const envRepo = process.env.IS_REPO || "";
  if (envKey) {
    return {
      apiUrl: (process.env.IS_API_URL || DEFAULT_API_URL2).replace(/\/$/, ""),
      apiKey: envKey,
      repo: envRepo
    };
  }
  const stored = loadStoredCredentials();
  if (stored) {
    return {
      apiUrl: (process.env.IS_API_URL || stored.api_url || DEFAULT_API_URL2).replace(/\/$/, ""),
      apiKey: stored.api_key,
      repo: envRepo || stored.repo_id || ""
    };
  }
  return null;
}
function getDefaultApiUrl() {
  return (process.env.IS_API_URL || DEFAULT_API_URL2).replace(/\/$/, "");
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
  return new Promise((resolve, reject) => {
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
      resolve({
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
async function registerGitCredentialHelper() {
  for (const host of GIT_HOSTS) {
    try {
      await execAsync(`git config --global credential.${host}.helper "!ideaspaces credential"`);
    } catch {
    }
  }
}

// dist/client.js
function formatRepoList(repos) {
  return repos.map((r) => {
    const key = r.hostname ? `${r.hostname}/${r.slug}` : r.slug;
    const name = r.name || r.slug;
    const parts = [name];
    if (r.file_count != null)
      parts.push(`${r.file_count} files`);
    if (r.last_activity)
      parts.push(`active ${r.last_activity}`);
    return `  ${key} \u2014 ${parts.join(", ")}`;
  }).join("\n");
}
function resolveRepo(repos, ref) {
  const byId = repos.find((r) => r.repo_id === ref);
  if (byId)
    return byId;
  const byHost = repos.find((r) => r.hostname === ref);
  if (byHost)
    return byHost;
  if (ref.includes("/")) {
    const [host, slug] = ref.split("/", 2);
    return repos.find((r) => r.hostname === host && r.slug === slug);
  }
  const bySlug = repos.filter((r) => r.slug === ref);
  if (bySlug.length === 1)
    return bySlug[0];
  return bySlug.find((r) => !r.hostname) || bySlug[0];
}
var REPO_ID_RE = /^repo_[a-f0-9]{12}$/;
async function initClient(flags2) {
  const config = loadConfig();
  if (!config) {
    throw new Error("Not logged in. Run: ideaspaces login");
  }
  const client = createClient({ apiKey: config.apiKey, apiUrl: config.apiUrl });
  let repoId;
  if (flags2.repo) {
    if (REPO_ID_RE.test(flags2.repo)) {
      repoId = flags2.repo;
    } else {
      const { data } = await client.listRepos();
      const match = resolveRepo(data.repos, flags2.repo);
      if (!match) {
        throw new Error(`Space "${flags2.repo}" not found. Available:
${formatRepoList(data.repos)}`);
      }
      repoId = match.repo_id;
    }
  } else if (config.repo) {
    repoId = config.repo;
  }
  if (repoId) {
    client.setRepo(repoId);
    return client;
  }
  const { repoId: autoId, repos } = await autoSelectRepo(client);
  if (autoId) {
    return client;
  }
  if (repos.length > 1) {
    throw new Error(`Multiple spaces available. Use --repo or run: ideaspaces login <slug>
${formatRepoList(repos)}`);
  }
  throw new Error("No spaces found for this account.");
}

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

// dist/commands/login.js
function openBrowser(url) {
  const cmd2 = platform() === "darwin" ? "open" : platform() === "win32" ? "start" : "xdg-open";
  exec2(`${cmd2} "${url}"`);
}
var loginCommand = {
  name: "login",
  description: "Log in to IdeaSpaces or select a space",
  usage: "ideaspaces login [slug]",
  examples: [
    "ideaspaces login              # OAuth login, auto-select if one space",
    "ideaspaces login my-notes     # Select space by slug"
  ],
  async run(args2, _flags, global2) {
    const output = createOutput(global2);
    const slug = args2[0];
    const config = loadConfig();
    if (slug && config) {
      const client2 = createClient({ apiKey: config.apiKey, apiUrl: config.apiUrl });
      const { repos: repos2 } = await autoSelectRepo(client2);
      const match = resolveRepo(repos2, slug);
      if (!match) {
        output.error(`Space "${slug}" not found. Available:
${formatRepoList(repos2)}`);
        return 4;
      }
      client2.setRepo(match.repo_id);
      saveCredentials({ api_url: config.apiUrl, api_key: config.apiKey, repo_id: match.repo_id });
      const session = createSession(client2);
      let awareness = "";
      try {
        awareness = await session.getAwarenessBlock();
      } catch {
      }
      output.result({ space: match.slug, name: match.name, repo_id: match.repo_id }, `Connected to ${match.name || match.slug}.${awareness ? `

${awareness}` : ""}`);
      return 0;
    }
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
    const client = createClient({ apiKey: token, apiUrl });
    const { repoId, repos } = await autoSelectRepo(client);
    if (repoId) {
      saveCredentials({ api_url: apiUrl, api_key: token, repo_id: repoId });
      const session = createSession(client);
      let awareness = "";
      try {
        awareness = await session.getAwarenessBlock();
      } catch {
      }
      output.result({ space: repos[0]?.slug, repo_id: repoId }, `Logged in and connected.${awareness ? `

${awareness}` : ""}`);
      return 0;
    }
    if (repos.length > 1) {
      saveCredentials({ api_url: apiUrl, api_key: token });
      output.result({ spaces: repos.map((r) => ({ slug: r.slug, name: r.name, repo_id: r.repo_id })) }, `Logged in. Select a space:
${formatRepoList(repos)}

Run: ideaspaces login <slug>`);
      return 0;
    }
    output.error("No spaces found for this account.");
    return 1;
  }
};

// dist/commands/init.js
import { execFileSync, spawn } from "node:child_process";
async function fetchAuthMe(config) {
  const resp = await fetch(`${config.apiUrl}/auth/me`, {
    headers: { Authorization: `Bearer ${config.apiKey}` }
  });
  if (!resp.ok) {
    throw new Error(`/auth/me returned ${resp.status} \u2014 try 'ideaspaces login' again`);
  }
  return await resp.json();
}
function gitUrlFor(namespace, slug) {
  const base = (process.env.IS_GIT_URL || "https://git.ideaspaces.xyz").replace(/\/+$/, "");
  return `${base}/${namespace}/${slug}.git`;
}
function spawnGit(args2) {
  return new Promise((resolve) => {
    const proc = spawn("git", args2, { stdio: "inherit" });
    proc.on("error", () => resolve(1));
    proc.on("exit", (code) => resolve(code ?? 1));
  });
}
function configureLocalGit(cwd, email, name) {
  execFileSync("git", ["config", "--local", "user.email", email], { cwd, stdio: "ignore" });
  execFileSync("git", ["config", "--local", "user.name", name], { cwd, stdio: "ignore" });
}
var initCommand = {
  name: "init",
  description: "Create a new space and clone it locally with git identity wired up",
  usage: "ideaspaces init <name> [--slug SLUG] [--hostname HOST] [--purpose PURPOSE] [--dir DIR]",
  examples: [
    "ideaspaces init 'My Notes'",
    "ideaspaces init 'Team Research' --hostname acme.com",
    "ideaspaces init 'Architecture' --slug arch --dir ./arch-space"
  ],
  async run(args2, flags2, global2) {
    const output = createOutput(global2);
    const config = loadConfig();
    if (!config) {
      output.error("Not logged in. Run: ideaspaces login");
      return 2;
    }
    const name = args2[0]?.trim();
    if (!name) {
      output.error("Name required. Usage: ideaspaces init <name>");
      return 1;
    }
    const slug = flags2.slug || void 0;
    const hostname = flags2.hostname || void 0;
    const purpose = flags2.purpose || void 0;
    const dirFlag = flags2.dir || void 0;
    let me;
    try {
      me = await fetchAuthMe(config);
    } catch (e) {
      output.error(e instanceof Error ? e.message : String(e));
      return 1;
    }
    if (!me.email) {
      output.error("Your account has no email recorded. Re-login to refresh, then retry.");
      return 1;
    }
    const client = createClient({ apiKey: config.apiKey, apiUrl: config.apiUrl });
    output.progress(`Creating space "${name}"...`);
    const { data: repo } = await client.createRepo({ name, slug, purpose });
    const namespace = hostname || me.username;
    if (!namespace) {
      output.error("Could not resolve namespace (username missing from account). Complete onboarding at ideaspaces.xyz and retry.");
      return 1;
    }
    const gitUrl = gitUrlFor(namespace, repo.slug);
    const targetDir = dirFlag || repo.slug;
    output.progress(`$ git clone ${gitUrl} ${targetDir}`);
    const cloneExit = await spawnGit(["clone", gitUrl, targetDir]);
    if (cloneExit !== 0) {
      output.error(`git clone failed (exit ${cloneExit}) \u2014 space was created on the server.`);
      return cloneExit;
    }
    try {
      configureLocalGit(targetDir, me.email, me.name || me.username || me.email);
    } catch (e) {
      output.log(`warning: failed to set local git identity (${e instanceof Error ? e.message : e}). Run 'git config --local user.email ${me.email}' inside ${targetDir}.`);
    }
    if (!process.env.IS_API_KEY) {
      saveCredentials({
        api_url: config.apiUrl,
        api_key: config.apiKey,
        repo_id: repo.repo_id
      });
    }
    output.result({
      repo_id: repo.repo_id,
      slug: repo.slug,
      name: repo.name,
      namespace,
      git_url: gitUrl,
      directory: targetDir,
      identity: { email: me.email, name: me.name || me.username || me.email }
    }, [
      `Space created: ${repo.name} (${repo.slug})`,
      `Cloned to: ${targetDir}`,
      `Git identity: ${me.name || me.username} <${me.email}>`,
      "",
      `Next: cd ${targetDir}`
    ].join("\n"));
    return 0;
  }
};

// dist/auth/session-state.js
import { existsSync as existsSync2, mkdirSync as mkdirSync2, readFileSync as readFileSync2, unlinkSync as unlinkSync2, writeFileSync as writeFileSync2 } from "node:fs";
import { homedir as homedir2 } from "node:os";
import { join as join2 } from "node:path";
var CONFIG_DIR2 = join2(homedir2(), ".ideaspaces");
var SESSION_FILE = join2(CONFIG_DIR2, "session.json");
function loadAll() {
  try {
    if (!existsSync2(SESSION_FILE))
      return {};
    return JSON.parse(readFileSync2(SESSION_FILE, "utf-8"));
  } catch {
    return {};
  }
}
function saveAll(data) {
  if (!existsSync2(CONFIG_DIR2)) {
    mkdirSync2(CONFIG_DIR2, { recursive: true, mode: 448 });
  }
  writeFileSync2(SESSION_FILE, JSON.stringify(data, null, 2) + "\n", { mode: 384 });
}
function getLastSha(repoId) {
  return loadAll()[repoId]?.last_sha;
}
function setLastSha(repoId, sha) {
  const data = loadAll();
  data[repoId] = { last_sha: sha, updated_at: (/* @__PURE__ */ new Date()).toISOString() };
  saveAll(data);
}
function clearSessionState() {
  try {
    if (existsSync2(SESSION_FILE))
      unlinkSync2(SESSION_FILE);
  } catch {
  }
}

// dist/commands/navigate.js
var navigateCommand = {
  name: "navigate",
  description: "Explore the knowledge tree",
  usage: "ideaspaces navigate [path]",
  examples: [
    "ideaspaces navigate           # root",
    "ideaspaces navigate core/     # subtree"
  ],
  async run(args2, _flags, global2) {
    const output = createOutput(global2);
    const client = await initClient(global2);
    const path = args2[0] ?? "";
    const { data: r } = await client.navigate(path);
    if (global2.json) {
      const { centroid: _, ...clean } = r;
      output.result(clean, "");
      return 0;
    }
    const lines = [];
    lines.push(r.path || "(root)");
    if (r.file_count > 0)
      lines.push(`${r.file_count} files`);
    if (r.readme) {
      lines.push("");
      lines.push(r.readme);
    }
    if (r.now) {
      lines.push("");
      lines.push(`Now: ${r.now}`);
    }
    const dirs = r.children.filter((c) => c.type === "directory");
    const files = r.children.filter((c) => c.type !== "directory");
    if (dirs.length) {
      lines.push("", "Directories:");
      for (const d of dirs) {
        const count = d.file_count ? ` (${d.file_count})` : "";
        const summary = d.summary ? ` \u2014 ${d.summary}` : "";
        lines.push(`  ${d.name}/${count}${summary}`);
      }
    }
    if (files.length) {
      lines.push("", "Files:");
      for (const f of files) {
        const summary = f.summary ? ` \u2014 ${f.summary}` : "";
        lines.push(`  ${f.name}${summary}`);
      }
    }
    const repoId = client.repoId;
    const lastSha = getLastSha(repoId);
    if (lastSha && path === "") {
      try {
        const { data: changes } = await client.gitOps({ op: "changes", since: lastSha });
        if (changes.changes?.length) {
          lines.push("", `Since last session (${changes.changes.length} changes):`);
          for (const ch of changes.changes.slice(0, 15)) {
            lines.push(`  ${ch.status} ${ch.path}`);
          }
          if (changes.changes.length > 15) {
            lines.push(`  ... and ${changes.changes.length - 15} more`);
          }
        }
      } catch {
      }
    }
    if (path === "") {
      try {
        const { data: log } = await client.gitOps({ op: "log", limit: 1 });
        const headSha = log.entries?.[0]?.sha;
        if (headSha)
          setLastSha(repoId, headSha);
      } catch {
      }
    }
    if (r.agent_context?.length) {
      const kinds = /* @__PURE__ */ new Map();
      for (const a of r.agent_context) {
        const k = a.kind || "other";
        if (!kinds.has(k))
          kinds.set(k, []);
        kinds.get(k).push(a);
      }
      const show = (label, keys) => {
        const items = keys.flatMap((k) => kinds.get(k) || []);
        if (!items.length)
          return;
        lines.push("", `${label}:`);
        for (const a of items) {
          const desc = a.description ? ` \u2014 ${a.description}` : "";
          const from = a.inherited_from ? ` (from ${a.inherited_from})` : "";
          lines.push(`  ${a.name}${from}${desc}`);
        }
      };
      show("Direction", ["now", "purpose"]);
      show("Guidance", ["guidance", "soul", "identity", "custom"]);
      show("Perspectives", ["perspective"]);
      show("Skills", ["skill"]);
    }
    output.result(r, lines.join("\n"));
    return 0;
  }
};

// dist/commands/search.js
var searchCommand = {
  name: "search",
  description: "Find knowledge by meaning",
  usage: "ideaspaces search <query> [--scope DIR] [--type TYPE] [--limit N]",
  examples: [
    'ideaspaces search "authentication flow"',
    'ideaspaces search "pricing" --scope startups/'
  ],
  async run(args2, flags2, global2) {
    const output = createOutput(global2);
    const query = args2[0];
    if (!query) {
      output.error("Usage: ideaspaces search <query>");
      return 1;
    }
    const client = await initClient(global2);
    const { data } = await client.search({
      query,
      scope: flags2.scope,
      node_type: flags2.type,
      attached_to: flags2["attached-to"],
      contributed_by: flags2["contributed-by"],
      tags: flags2.tags,
      limit: flags2.limit ? Number(flags2.limit) : void 0
    });
    if (!data.results.length) {
      output.result({ results: [], query }, `No results for "${query}"`);
      return 0;
    }
    const lines = [`"${query}" (${data.results.length} results)`, ""];
    for (const r of data.results) {
      lines.push(`${r.score.toFixed(2)}  ${r.path}`);
      if (r.name)
        lines.push(`      ${r.name}`);
      if (r.summary)
        lines.push(`      ${r.summary}`);
    }
    output.result(data, lines.join("\n"));
    return 0;
  }
};

// dist/commands/read.js
var NODE_ID_RE = /^(\/?n\/)?n_[a-f0-9]{12}$/;
var readCommand = {
  name: "read",
  description: "Read a note's content and metadata",
  usage: "ideaspaces read <path|node-id> [--offset N] [--limit N]",
  examples: [
    "ideaspaces read core/About.md",
    "ideaspaces read n_8bb8cd420696"
  ],
  async run(args2, flags2, global2) {
    const output = createOutput(global2);
    const path = args2[0];
    if (!path) {
      output.error("Usage: ideaspaces read <path|node-id>");
      return 1;
    }
    const client = await initClient(global2);
    const opts = flags2.offset || flags2.limit ? { offset: flags2.offset ? Number(flags2.offset) : void 0, limit: flags2.limit ? Number(flags2.limit) : void 0 } : void 0;
    const isNodeId = NODE_ID_RE.test(path);
    let r;
    if (isNodeId) {
      const { data: nodeData } = await client.readNode(path.replace(/^\/n\//, ""));
      if (opts && nodeData.path) {
        const { data: windowed } = await client.readFile(nodeData.path, opts);
        r = windowed;
      } else {
        r = nodeData;
      }
    } else {
      const { data: fileData } = await client.readFile(path, opts);
      r = fileData;
    }
    if (global2.json) {
      output.result(r, "");
      return 0;
    }
    const meta = [];
    if (r.node_id)
      meta.push(`Node: /n/${r.node_id}`);
    if (r.tags?.length)
      meta.push(`Tags: ${r.tags.join(", ")}`);
    if (r.attached_to?.length)
      meta.push(`Attached to: ${r.attached_to.join(", ")}`);
    if (r.last_commit_sha)
      meta.push(`SHA: ${r.last_commit_sha}`);
    let text = meta.length ? meta.join("\n") + "\n\n" : "";
    text += r.content;
    if (r.continuation) {
      text += `

[${r.continuation.remaining} more lines. Use --offset=${r.continuation.next_offset} to continue.]`;
    }
    output.result(r, text);
    return 0;
  }
};

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
  description: "Create or update a note",
  usage: "ideaspaces write <path> [--name NAME] [--summary TEXT] [--tags a,b] [--content TEXT] [--if-match SHA] [--force]",
  examples: [
    'echo "# My Note\\nContent here" | ideaspaces write notes/my-note.md --name "My Note"',
    'ideaspaces write notes/test.md --name "Test" --content "# Test\\nHello"',
    'ideaspaces write notes/test.md --content "# overwrite" --force'
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
    const client = await initClient(global2);
    const tags = flags2.tags ? flags2.tags.split(",").map((t) => t.trim()) : void 0;
    const attachedTo = flags2["attached-to"] ? flags2["attached-to"].split(",").map((t) => t.trim()) : void 0;
    const force = Boolean(flags2.force);
    const explicitIfMatch = flags2["if-match"];
    if (force && explicitIfMatch) {
      output.error("Use either --force or --if-match, not both.");
      return 1;
    }
    let ifMatch = explicitIfMatch;
    if (!ifMatch && !force) {
      try {
        const { data } = await client.readFile(path);
        ifMatch = data.last_commit_sha;
      } catch (error) {
        if (!(error instanceof SdkError && error.status === 404)) {
          throw error;
        }
      }
    }
    let r;
    try {
      ({ data: r } = await client.writeFile(path, {
        content,
        name: flags2.name,
        summary: flags2.summary,
        tags,
        attached_to: attachedTo,
        if_match: ifMatch
      }));
    } catch (error) {
      if (error instanceof SdkError && error.status === 409) {
        const rawDetail = error.detail;
        const detail = rawDetail && typeof rawDetail === "object" ? rawDetail.detail ?? rawDetail : null;
        const pathHint = typeof detail?.path === "string" ? detail.path : path;
        const expected = typeof detail?.expected_sha === "string" ? detail.expected_sha : void 0;
        const actual = typeof detail?.actual_sha === "string" ? detail.actual_sha : void 0;
        const lines = [
          "Write conflict: file changed since your last read.",
          pathHint ? `Path: ${pathHint}` : "",
          expected ? `Expected SHA: ${expected}` : "",
          actual ? `Actual SHA:   ${actual}` : "",
          "Re-run with --force to overwrite intentionally."
        ].filter(Boolean);
        output.error(lines.join("\n"));
        return 5;
      }
      throw error;
    }
    if (r.commit_sha) {
      try {
        setLastSha(client.repoId, r.commit_sha);
      } catch {
      }
    }
    output.result(r, `Written: ${r.path}
Node: /n/${r.node_id}
Commit: ${r.commit_sha}`);
    return 0;
  }
};

// dist/commands/awareness.js
var awarenessCommand = {
  name: "awareness",
  description: "Print space orientation (for hooks and piping)",
  usage: "ideaspaces awareness",
  examples: [
    "ideaspaces awareness          # print to stdout",
    "ideaspaces awareness --json   # structured output"
  ],
  async run(_args, _flags, global2) {
    const output = createOutput(global2);
    const client = await initClient(global2);
    const lastSha = getLastSha(client.repoId) ?? null;
    const session = createSession(client, { lastSha });
    const block = await session.getAwarenessBlock();
    output.result({ awareness: block }, block || "");
    return 0;
  }
};

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

// dist/commands/clone.js
import { spawn as spawn2 } from "node:child_process";
var cloneCommand = {
  name: "clone",
  description: "Clone an IdeaSpaces space to your local machine via git",
  usage: "ideaspaces clone <namespace>/<slug> [directory]",
  examples: [
    "ideaspaces clone my-notes",
    "ideaspaces clone stripe.com/architecture",
    "ideaspaces clone stripe.com/notes ./work/notes"
  ],
  async run(args2, _flags, global2) {
    const output = createOutput(global2);
    const target = args2[0];
    const directory = args2[1];
    if (!target) {
      output.error("Usage: ideaspaces clone <namespace>/<slug> [directory]");
      return 2;
    }
    const config = loadConfig();
    if (!config) {
      output.error("Not logged in. Run: ideaspaces login");
      return 1;
    }
    let namespace;
    let slug;
    if (target.includes("/")) {
      const parts = target.split("/");
      if (parts.length !== 2 || !parts[0] || !parts[1]) {
        output.error("Invalid target. Use <namespace>/<slug>.");
        return 2;
      }
      namespace = parts[0];
      slug = parts[1];
    } else {
      slug = target;
      const resolved = await resolveBareSlug(config, slug, output);
      if (!resolved)
        return 4;
      namespace = resolved.namespace;
      if (resolved.hint)
        output.progress(resolved.hint);
    }
    const gitUrl = gitUrlFor2(namespace, slug);
    const gitArgs = ["clone", gitUrl];
    if (directory)
      gitArgs.push(directory);
    output.progress(`$ git ${gitArgs.join(" ")}`);
    return await spawnGit2(gitArgs);
  }
};
function gitUrlFor2(namespace, slug) {
  const base = (process.env.IS_GIT_URL || "https://git.ideaspaces.xyz").replace(/\/+$/, "");
  return `${base}/${namespace}/${slug}.git`;
}
async function resolveBareSlug(config, slug, output) {
  const client = createClient({ apiKey: config.apiKey, apiUrl: config.apiUrl });
  const { data } = await client.listRepos();
  const repos = data.repos;
  const matches = repos.filter((r) => r.slug === slug);
  if (matches.length === 0) {
    output.error(`No space found with slug "${slug}".`);
    return null;
  }
  const personal = matches.find((r) => !r.hostname);
  const hostnameMatches = matches.filter((r) => r.hostname);
  if (personal) {
    const username = await fetchUsername(config);
    if (!username) {
      output.error(`Could not resolve your username. Try the explicit form: ideaspaces clone <namespace>/${slug}`);
      return null;
    }
    let hint;
    if (hostnameMatches.length > 0) {
      const others = hostnameMatches.map((r) => `${r.hostname}/${slug}`).join(", ");
      hint = `Cloning personal "${slug}". Hostname variants also exist: ${others}`;
    }
    return { namespace: username, hint };
  }
  if (hostnameMatches.length === 1) {
    return { namespace: hostnameMatches[0].hostname };
  }
  const options = hostnameMatches.map((r) => `${r.hostname}/${slug}`).join(", ");
  output.error(`Multiple spaces match "${slug}": ${options}. Specify explicitly: ideaspaces clone <namespace>/<slug>`);
  return null;
}
async function fetchUsername(config) {
  try {
    const resp = await fetch(`${config.apiUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${config.apiKey}` }
    });
    if (!resp.ok)
      return null;
    const data = await resp.json();
    return data.username ?? null;
  } catch {
    return null;
  }
}
function spawnGit2(args2) {
  return new Promise((resolve) => {
    const proc = spawn2("git", args2, { stdio: "inherit" });
    proc.on("error", () => resolve(1));
    proc.on("exit", (code) => resolve(code ?? 1));
  });
}

// dist/commands/power/grep.js
var grepCommand = {
  name: "grep",
  description: "Text search or section extraction",
  usage: "ideaspaces power grep <pattern> [--scope DIR] [--heading TITLE]",
  examples: [
    'ideaspaces power grep "authentication"',
    'ideaspaces power grep --heading "## Design" --scope core/'
  ],
  async run(args2, flags2, global2) {
    const output = createOutput(global2);
    const client = await initClient(global2);
    const scope = flags2.scope;
    if (flags2.heading) {
      const { data: r2 } = await client.grepSections(flags2.heading, scope);
      if (!r2.sections?.length) {
        output.result(r2, `No sections matching "${flags2.heading}"`);
        return 0;
      }
      const parts = r2.sections.map((s) => {
        let text = `${s.file}:
${s.content}`;
        if (s.truncated)
          text += "\n[truncated]";
        return text;
      });
      output.result(r2, `${r2.section_count} section(s) with "${flags2.heading}":

${parts.join("\n\n")}`);
      return 0;
    }
    const pattern = args2[0];
    if (!pattern) {
      output.error("Usage: ideaspaces power grep <pattern> or --heading <title>");
      return 1;
    }
    const { data: r } = await client.grep(pattern, scope);
    const lines = r.matches.map((m) => `${m.file}:${m.line_number}: ${m.content}`);
    output.result(r, lines.length ? lines.join("\n") : `No matches for "${pattern}"`);
    return 0;
  }
};

// dist/commands/power/git.js
var gitCommand = {
  name: "git",
  description: "Temporal awareness \u2014 log, changes, diff, find",
  usage: "ideaspaces power git <op> [--path FILE] [--ref SHA] [--since SHA] [--limit N]",
  examples: [
    "ideaspaces power git log",
    "ideaspaces power git changes --since abc1234",
    "ideaspaces power git diff --ref abc1234",
    'ideaspaces power git find --text "authentication"'
  ],
  async run(args2, flags2, global2) {
    const output = createOutput(global2);
    const op = args2[0];
    if (!op) {
      output.error("Usage: ideaspaces power git <log|changes|diff|find|word_diff>");
      return 1;
    }
    const client = await initClient(global2);
    const { data: r } = await client.gitOps({
      op,
      path: flags2.path,
      ref: flags2.ref,
      text: flags2.text,
      since: flags2.since,
      limit: flags2.limit ? Number(flags2.limit) : void 0
    });
    if (global2.json) {
      output.result(r, "");
      return 0;
    }
    const lines = [];
    if (r.entries?.length) {
      for (const e of r.entries)
        lines.push(`${e.sha.slice(0, 7)} ${e.date} ${e.author}: ${e.message}`);
    } else if (r.changes?.length) {
      for (const c of r.changes)
        lines.push(`${c.status} ${c.path}`);
    } else if (r.output) {
      lines.push(r.output.length > 3e3 ? r.output.slice(0, 3e3) + "\n... (truncated)" : r.output);
    }
    output.result(r, lines.length ? lines.join("\n") : "No results.");
    return 0;
  }
};

// dist/commands/power/outline.js
var outlineCommand = {
  name: "outline",
  description: "Full tree of the space",
  usage: "ideaspaces power outline",
  async run(_args, _flags, global2) {
    const output = createOutput(global2);
    const client = await initClient(global2);
    const { data: r } = await client.outline();
    if (global2.json) {
      output.result(r, "");
      return 0;
    }
    const branches = r.items.filter((i) => i.type === "branch");
    const files = r.items.filter((i) => i.type !== "branch");
    const lines = [`${r.items.length} items in ${r.slug}:`, ""];
    if (branches.length) {
      lines.push("Directories:");
      for (const b of branches) {
        const summary = b.summary ? ` \u2014 ${b.summary}` : "";
        lines.push(`  ${b.path}/${summary}`);
      }
      lines.push("");
    }
    lines.push("Files:");
    for (const f of files) {
      const summary = f.summary ? ` \u2014 ${f.summary}` : "";
      lines.push(`  ${f.path}${summary}`);
    }
    output.result(r, lines.join("\n"));
    return 0;
  }
};

// dist/commands/power/find.js
var findCommand = {
  name: "find",
  description: "Filter notes by tag, type, entity, or directory",
  usage: "ideaspaces power find [--tag TAG] [--type TYPE] [--attached-to ENTITY] [--dir PATH] [--limit N]",
  examples: [
    "ideaspaces power find --tag architecture",
    "ideaspaces power find --type perspective",
    "ideaspaces power find --attached-to hostname:acme.com"
  ],
  async run(_args, flags2, global2) {
    const output = createOutput(global2);
    const client = await initClient(global2);
    const { data: r } = await client.listNodes({
      tag: flags2.tag,
      node_type: flags2.type,
      attached_to: flags2["attached-to"],
      contributed_by: flags2["contributed-by"],
      dir_path: flags2.dir,
      origin: flags2.origin,
      limit: flags2.limit ? Number(flags2.limit) : void 0,
      offset: flags2.offset ? Number(flags2.offset) : void 0,
      sort_by: flags2["sort-by"],
      sort_order: flags2["sort-order"]
    });
    if (!r.nodes.length) {
      output.result(r, "No matching nodes.");
      return 0;
    }
    if (global2.json) {
      output.result(r, "");
      return 0;
    }
    const lines = [`${r.total} node(s)${r.total > r.nodes.length ? ` (showing ${r.nodes.length})` : ""}:`, ""];
    for (const n of r.nodes) {
      const summary = n.summary ? ` \u2014 ${n.summary}` : "";
      lines.push(`  ${n.path}${summary}`);
      const meta = [];
      if (n.node_type && n.node_type !== "note")
        meta.push(n.node_type);
      if (n.attached_to?.length)
        meta.push(`attached: ${n.attached_to.join(", ")}`);
      if (n.tags?.length)
        meta.push(`tags: ${n.tags.join(", ")}`);
      if (meta.length)
        lines.push(`    [${meta.join(" | ")}]`);
    }
    output.result(r, lines.join("\n"));
    return 0;
  }
};

// dist/commands/power/move.js
var moveCommand = {
  name: "move",
  description: "Move or rename a file or directory",
  usage: "ideaspaces power move <source> <destination>",
  async run(args2, _flags, global2) {
    const output = createOutput(global2);
    const source = args2[0];
    const destination = args2[1];
    if (!source || !destination) {
      output.error("Usage: ideaspaces power move <source> <destination>");
      return 1;
    }
    const client = await initClient(global2);
    const { data: r } = await client.moveFile(source, destination);
    try {
      const { data: log } = await client.gitOps({ op: "log", limit: 1 });
      if (log.entries?.[0]?.sha)
        setLastSha(client.repoId, log.entries[0].sha);
    } catch {
    }
    const text = r.files_updated != null ? `Moved directory: ${r.moved} \u2192 ${r.destination} (${r.files_updated} files)` : `Moved: ${r.moved} \u2192 ${r.destination}`;
    output.result(r, text);
    return 0;
  }
};

// dist/commands/power/delete.js
import { createInterface } from "node:readline";
async function confirm(message) {
  if (!process.stdin.isTTY)
    return true;
  const rl = createInterface({ input: process.stdin, output: process.stderr });
  return new Promise((resolve) => {
    rl.question(`${message} (y/N) `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === "y");
    });
  });
}
var deleteCommand = {
  name: "delete",
  description: "Delete a file (recoverable via git)",
  usage: "ideaspaces power delete <path> [--yes]",
  async run(args2, _flags, global2) {
    const output = createOutput(global2);
    const path = args2[0];
    if (!path) {
      output.error("Usage: ideaspaces power delete <path>");
      return 1;
    }
    const client = await initClient(global2);
    const { data: file } = await client.readFile(path);
    if (!file.node_id) {
      output.error(`No node found at ${path}`);
      return 4;
    }
    if (!global2.yes) {
      const ok = await confirm(`Delete ${path}?`);
      if (!ok) {
        output.log("Cancelled.");
        return 0;
      }
    }
    const { data: r } = await client.deleteNode(file.node_id);
    try {
      const { data: log } = await client.gitOps({ op: "log", limit: 1 });
      if (log.entries?.[0]?.sha)
        setLastSha(client.repoId, log.entries[0].sha);
    } catch {
    }
    output.result(r, `Deleted: ${r.path}`);
    return 0;
  }
};

// dist/commands/power/tags.js
var tagsCommand = {
  name: "tags",
  description: "List tags in use across the space",
  usage: "ideaspaces power tags [prefix]",
  async run(args2, _flags, global2) {
    const output = createOutput(global2);
    const client = await initClient(global2);
    const { data: r } = await client.listTags(args2[0]);
    if (!r.tags?.length) {
      output.result(r, "No tags found.");
      return 0;
    }
    const lines = r.tags.map((t) => `  ${t.tag}  (${t.total})`);
    output.result(r, `${r.tags.length} tags:
${lines.join("\n")}`);
    return 0;
  }
};

// dist/commands/power/metadata.js
var metadataCommand = {
  name: "metadata",
  description: "Update tags, entities, or accessibility on a node",
  usage: "ideaspaces power metadata <node-id> [--tags a,b] [--attached-to x,y]",
  examples: [
    'ideaspaces power metadata n_abc123 --tags "architecture,decision"'
  ],
  async run(args2, flags2, global2) {
    const output = createOutput(global2);
    const nodeId = args2[0];
    if (!nodeId) {
      output.error("Usage: ideaspaces power metadata <node-id> [--tags a,b]");
      return 1;
    }
    const fields = {};
    if (flags2.tags)
      fields.tags = flags2.tags.split(",").map((t) => t.trim());
    if (flags2["attached-to"])
      fields.attached_to = flags2["attached-to"].split(",").map((t) => t.trim());
    if (flags2.accessibility)
      fields.accessibility = flags2.accessibility.split(",").map((t) => t.trim());
    if (flags2.references)
      fields.references = flags2.references.split(",").map((t) => t.trim());
    if (!Object.keys(fields).length) {
      output.error("Provide at least one field: --tags, --attached-to, --accessibility, --references");
      return 1;
    }
    const client = await initClient(global2);
    const { data: r } = await client.updateMetadata(nodeId, fields);
    output.result(r, `Updated ${r.updated}: ${r.fields.join(", ")}`);
    return 0;
  }
};

// dist/commands/power/repos.js
var reposCommand = {
  name: "repos",
  description: "List available spaces",
  usage: "ideaspaces power repos",
  async run(_args, _flags, global2) {
    const output = createOutput(global2);
    const config = loadConfig();
    if (!config) {
      output.error("Not logged in. Run: ideaspaces login");
      return 2;
    }
    const client = createClient({ apiKey: config.apiKey, apiUrl: config.apiUrl });
    const { repos } = await autoSelectRepo(client);
    if (!repos.length) {
      output.result({ repos: [] }, "No spaces found.");
      return 0;
    }
    const data = repos.map((r) => ({ slug: r.slug, name: r.name, repo_id: r.repo_id, hostname: r.hostname, file_count: r.file_count, last_activity: r.last_activity }));
    output.result({ repos: data }, formatRepoList(repos));
    return 0;
  }
};

// dist/commands/power/status.js
var statusCommand = {
  name: "status",
  description: "Show connection info",
  usage: "ideaspaces power status",
  async run(_args, _flags, global2) {
    const output = createOutput(global2);
    const config = loadConfig();
    if (!config) {
      output.result({ connected: false }, "Not logged in. Run: ideaspaces login");
      return 0;
    }
    const source = process.env.IS_API_KEY ? "env" : "credentials";
    const lastSha = config.repo ? getLastSha(config.repo) : void 0;
    const data = {
      connected: true,
      api_url: config.apiUrl,
      repo: config.repo || null,
      source,
      last_sha: lastSha || null
    };
    const lines = [
      `API: ${config.apiUrl}`,
      `Repo: ${config.repo || "(not selected)"}`,
      `Source: ${source}`
    ];
    if (lastSha)
      lines.push(`Last SHA: ${lastSha.slice(0, 7)}`);
    output.result(data, lines.join("\n"));
    return 0;
  }
};

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

// dist/commands/power/connect.js
function deriveNameFromOrigin(originUrl) {
  const withoutQuery = originUrl.split(/[?#]/, 1)[0];
  const last = withoutQuery.split("/").pop() || "connected-repo";
  return last.replace(/\.git$/i, "") || "connected-repo";
}
function normalizeConnectOrigin(originUrl) {
  const trimmed = originUrl.trim();
  const scpLike = /^git@([^:]+):(.+)$/i.exec(trimmed);
  if (scpLike) {
    return `https://${scpLike[1]}/${scpLike[2]}`;
  }
  const sshLike = /^ssh:\/\/git@([^/]+)\/(.+)$/i.exec(trimmed);
  if (sshLike) {
    return `https://${sshLike[1]}/${sshLike[2]}`;
  }
  return trimmed;
}
var connectCommand = {
  name: "connect",
  description: "Adopt an external git repo (GitHub, GitLab, \u2026) as an IdeaSpaces space",
  usage: "ideaspaces power connect <origin_url> [--name NAME] [--slug SLUG] [--hostname HOST]",
  examples: [
    "ideaspaces power connect https://github.com/IdeaSpaces-xyz/ideaspace.git --name IdeaSpace"
  ],
  async run(args2, flags2, global2) {
    const output = createOutput(global2);
    const config = loadConfig();
    if (!config) {
      output.error("Not logged in. Run: ideaspaces login");
      return 2;
    }
    const originUrl = args2[0]?.trim() || "";
    if (!originUrl) {
      output.error("origin_url is required. For a brand-new space, use 'ideaspaces init <name>' instead.");
      return 1;
    }
    const normalizedOriginUrl = normalizeConnectOrigin(originUrl);
    let name = flags2.name?.trim() || "";
    if (!name) {
      name = deriveNameFromOrigin(normalizedOriginUrl);
    }
    const slug = flags2.slug || void 0;
    const hostname = flags2.hostname || void 0;
    const client = createClient({ apiKey: config.apiKey, apiUrl: config.apiUrl });
    const { data } = await client.connectRepo({
      origin_url: normalizedOriginUrl,
      name,
      slug,
      hostname: hostname ?? null
    });
    if (!process.env.IS_API_KEY) {
      saveCredentials({
        api_url: config.apiUrl,
        api_key: config.apiKey,
        repo_id: data.repo_id
      });
    }
    const result = {
      repo: data,
      source: {
        origin_url: originUrl,
        normalized_origin_url: normalizedOriginUrl
      }
    };
    const lines = [
      `Connected: ${data.name} (${data.repo_id})`,
      `Slug: ${data.slug}`,
      `Origin: ${normalizedOriginUrl}`
    ];
    output.result(result, lines.join("\n"));
    return 0;
  }
};

// dist/commands/power/create.js
var createCommand = {
  name: "create",
  description: "Create a new space",
  usage: "ideaspaces power create <name> [--slug SLUG] [--purpose PURPOSE]",
  examples: [
    "ideaspaces power create 'My Notes'",
    "ideaspaces power create 'Research' --purpose 'Track research findings'",
    "ideaspaces power create 'Team' --slug team-notes"
  ],
  async run(args2, flags2, global2) {
    const output = createOutput(global2);
    const config = loadConfig();
    if (!config) {
      output.error("Not logged in. Run: ideaspaces login");
      return 2;
    }
    const name = args2[0]?.trim();
    if (!name) {
      output.error("Name required. Usage: ideaspaces power create <name>");
      return 1;
    }
    const slug = flags2.slug || void 0;
    const purpose = flags2.purpose || void 0;
    const client = createClient({ apiKey: config.apiKey, apiUrl: config.apiUrl });
    const { data } = await client.createRepo({ name, slug, purpose });
    if (!process.env.IS_API_KEY) {
      saveCredentials({
        api_url: config.apiUrl,
        api_key: config.apiKey,
        repo_id: data.repo_id
      });
    }
    output.result({ repo_id: data.repo_id, slug: data.slug, name: data.name }, `Created and connected: ${data.name} (${data.slug})`);
    return 0;
  }
};

// dist/commands/power/reindex.js
var reindexCommand = {
  name: "reindex",
  description: "Reindex the active space",
  usage: "ideaspaces power reindex [--repo <slug|repo_id>]",
  examples: [
    "ideaspaces power reindex",
    "ideaspaces --repo ideaspace power reindex"
  ],
  async run(_args, _flags, global2) {
    const output = createOutput(global2);
    const client = await initClient(global2);
    const { data: result } = await client.reindexRepo(client.repoId);
    output.result(result, `Reindexed: ${result.repo_id}
Removed entries: ${result.removed_entries}
Indexed files: ${result.indexed_files}`);
    return 0;
  }
};

// dist/commands/power/repo.js
var repoCommand = {
  name: "repo",
  description: "Repo sync operations: status, pull, push, credentials",
  usage: "ideaspaces power repo <status|pull|push|credential set|credential clear> [--value TOKEN]",
  examples: [
    "ideaspaces power repo status",
    "ideaspaces power repo pull",
    "ideaspaces power repo push",
    "ideaspaces power repo credential set --value ghp_xxx",
    "ideaspaces power repo credential clear"
  ],
  async run(args2, flags2, global2) {
    const output = createOutput(global2);
    const op = args2[0];
    if (!op) {
      output.error("Usage: ideaspaces power repo <status|pull|push|credential>");
      return 1;
    }
    const client = await initClient(global2);
    const clientAny = client;
    switch (op) {
      case "status": {
        const { data } = await clientAny.syncStatus(client.repoId);
        const lines = [
          `Repo: ${data.repo_id}`,
          `Status: ${data.status}${data.is_fresh ? " (fresh)" : ""}`,
          `Repo HEAD: ${data.repo_head || "(empty)"}`,
          `Indexed HEAD: ${data.indexed_head || "(none)"}`,
          data.lag_commits != null ? `Lag commits: ${data.lag_commits}` : "",
          data.last_indexed_at ? `Last indexed: ${data.last_indexed_at}` : "",
          data.last_index_error ? `Last index error: ${data.last_index_error}` : ""
        ].filter(Boolean);
        output.result(data, lines.join("\n"));
        return 0;
      }
      case "pull": {
        const { data } = await clientAny.syncPullRepo(client.repoId);
        if (data.new_head) {
          try {
            setLastSha(client.repoId, data.new_head);
          } catch {
          }
        }
        const lines = [
          `Repo: ${data.repo_id}`,
          data.diverged ? "Pull status: diverged (fast-forward only pull rejected)" : "Pull status: ok",
          `Old HEAD: ${data.old_head || "(empty)"}`,
          `New HEAD: ${data.new_head || "(empty)"}`,
          `Indexed files: ${data.indexed_files}`,
          `Removed entries: ${data.removed_entries}`,
          data.changed_markdown_files.length ? `Changed markdown files: ${data.changed_markdown_files.length}` : "Changed markdown files: 0"
        ];
        output.result(data, lines.join("\n"));
        return 0;
      }
      case "push": {
        const { data } = await clientAny.syncPushRepo(client.repoId);
        if (data.head) {
          try {
            setLastSha(client.repoId, data.head);
          } catch {
          }
        }
        const lines = [
          `Repo: ${data.repo_id}`,
          data.rejected ? `Push rejected${data.reason ? ` (${data.reason})` : ""}` : "Push status: ok",
          `HEAD: ${data.head || "(empty)"}`
        ];
        output.result(data, lines.join("\n"));
        return data.rejected ? 5 : 0;
      }
      case "credential": {
        const sub = args2[1];
        if (sub === "set") {
          const value = flags2.value;
          if (!value) {
            output.error("Usage: ideaspaces power repo credential set --value <token>");
            return 1;
          }
          const { data } = await clientAny.setRepoCredential(value, client.repoId);
          output.result(data, `Repo credentials set for ${data.repo_id}.`);
          return 0;
        }
        if (sub === "clear") {
          const { data } = await clientAny.setRepoCredential(null, client.repoId);
          output.result(data, `Repo credentials cleared for ${data.repo_id}.`);
          return 0;
        }
        output.error("Usage: ideaspaces power repo credential <set|clear> [--value TOKEN]");
        return 1;
      }
      default:
        output.error("Usage: ideaspaces power repo <status|pull|push|credential>");
        return 1;
    }
  }
};

// dist/router.js
var topLevel = [
  loginCommand,
  initCommand,
  navigateCommand,
  searchCommand,
  readCommand,
  writeCommand,
  awarenessCommand,
  cloneCommand,
  credentialCommand
];
var power = [
  grepCommand,
  gitCommand,
  outlineCommand,
  findCommand,
  moveCommand,
  deleteCommand,
  tagsCommand,
  metadataCommand,
  reposCommand,
  statusCommand,
  logoutCommand,
  connectCommand,
  createCommand,
  reindexCommand,
  repoCommand
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
  lines.push("", "  power          Advanced tools (grep, git, outline, find, move, delete, tags, metadata, connect, create, reindex, repo, ...)");
  lines.push("", "Global flags:");
  lines.push("  --json         Structured JSON output to stdout");
  lines.push("  --repo <slug>  Override space for this command");
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
var EXIT_CODES = {
  auth_error: 3,
  not_found: 4,
  client_error: 5,
  rate_limited: 6,
  overloaded: 7,
  network_error: 8,
  timeout: 9
};
var HINTS = {
  auth_error: "Run: ideaspaces login",
  not_found: "Check the path with: ideaspaces navigate",
  rate_limited: "Wait a moment and retry.",
  overloaded: "Server is busy. Try again in a moment.",
  network_error: "Check your internet connection.",
  timeout: "Request timed out. Try again."
};
function handleError(err, output) {
  if (err instanceof SdkError) {
    const hint = HINTS[err.category] ?? "";
    const rawDetail = err.detail;
    const detail = rawDetail && typeof rawDetail === "object" ? rawDetail.detail ?? rawDetail : null;
    const pathHint = typeof detail?.path === "string" ? `
Path: ${detail.path}` : "";
    const expected = typeof detail?.expected_sha === "string" ? `
Expected SHA: ${detail.expected_sha}` : "";
    const actual = typeof detail?.actual_sha === "string" ? `
Actual SHA:   ${detail.actual_sha}` : "";
    output.error(`Error: ${err.message}${pathHint}${expected}${actual}${hint ? `
${hint}` : ""}`);
    return EXIT_CODES[err.category] ?? 1;
  }
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
