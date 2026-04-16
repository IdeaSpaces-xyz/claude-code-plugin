/**
 * IdeaSpaces MCP Server — thin wrapper around the `ideaspaces` CLI.
 *
 * Shells out to `ideaspaces --json <command>` for each tool call.
 * Auth, formatting, session tracking — all handled by the CLI.
 *
 * Set IS_CLI_PATH env var to the CLI binary path, or put `ideaspaces` on PATH.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { existsSync } from "node:fs";
import { autoSelectRepo, createClient, createSession, } from "@ideaspaces/sdk";
import { loadConfig, loadStoredCredentials, saveCredentials, } from "./credentials.js";
// ─── CLI runner ─────────────────────────────────────────────────────
function resolveCli() {
    // 1. Explicit env var
    if (process.env.IS_CLI_PATH)
        return process.env.IS_CLI_PATH;
    // 2. Relative to this file (plugin layout: dist/index.js → ../cli/bundle/ideaspaces.js)
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const relative = join(__dirname, "../cli/bundle/ideaspaces.js");
    if (existsSync(relative))
        return relative;
    // 3. Fallback to PATH
    return "ideaspaces";
}
const CLI = resolveCli();
function ok(text) {
    return { content: [{ type: "text", text }] };
}
function fail(text) {
    return { content: [{ type: "text", text }], isError: true };
}
function isErrorResult(result) {
    return result.isError === true;
}
function resultText(result) {
    return result.content[0]?.text ?? "";
}
function appendText(result, appendix) {
    if (isErrorResult(result))
        return result;
    if (!appendix.trim())
        return result;
    return ok(`${resultText(result)}\n\n${appendix}`);
}
function cli(args, stdin) {
    return new Promise((resolve) => {
        const isFile = CLI.includes("/") || CLI.includes("\\") || CLI.endsWith(".js");
        const proc = spawn(isFile ? "node" : CLI, isFile ? [CLI, ...args] : args, {
            stdio: ["pipe", "pipe", "pipe"],
        });
        let out = "";
        let err = "";
        proc.stdout.on("data", (d) => (out += d));
        proc.stderr.on("data", (d) => (err += d));
        proc.on("close", (code) => resolve({ out, err, code: code ?? 1 }));
        proc.on("error", (e) => resolve({ out: "", err: e.message, code: 1 }));
        if (stdin != null)
            proc.stdin.write(stdin);
        proc.stdin.end();
    });
}
async function run(args, stdin) {
    const { out, err, code } = await cli(["--json", ...args], stdin);
    if (code !== 0)
        return fail(err.trim() || out.trim() || `Exit ${code}`);
    return ok(out.trim() || err.trim() || "Done");
}
// ─── SDK session lifecycle (awareness + change tracking) ───────────
const CONTEXT_HOOK_ENABLED = process.env.IS_MCP_CONTEXT_HOOK === "1";
const INCLUDE_AWARENESS_IN_EXPLORE = process.env.IS_MCP_INCLUDE_AWARENESS === "1";
let sdkClient = null;
let sdkSession = null;
let cachedAwareness = null;
function resetLifecycle() {
    sdkClient = null;
    sdkSession = null;
    cachedAwareness = null;
}
async function persistSessionState() {
    if (!sdkClient || !sdkClient.isConnected)
        return;
    const stored = loadStoredCredentials();
    if (!stored)
        return; // do not persist env-only credentials
    try {
        const { data } = await sdkClient.gitOps({ op: "log", limit: 1 });
        const sha = data.entries?.[0]?.sha;
        if (!sha)
            return;
        saveCredentials({
            ...stored,
            repo_id: sdkClient.repoId,
            last_sha: sha,
        });
    }
    catch {
        // Non-fatal: lifecycle should continue even if persistence fails.
    }
}
async function initLifecycle() {
    const config = loadConfig();
    if (!config) {
        resetLifecycle();
        return;
    }
    const client = createClient({
        apiKey: config.apiKey,
        apiUrl: config.apiUrl,
        repo: config.repo || undefined,
    });
    if (!client.isConnected) {
        try {
            const discovered = await autoSelectRepo(client);
            if (!discovered.repoId) {
                resetLifecycle();
                return;
            }
        }
        catch {
            resetLifecycle();
            return;
        }
    }
    const lastSha = loadStoredCredentials()?.last_sha ?? null;
    const session = createSession(client, { lastSha });
    sdkClient = client;
    sdkSession = session;
    try {
        cachedAwareness = await sdkSession.getAwarenessBlock();
    }
    catch {
        cachedAwareness = null;
    }
    await persistSessionState();
}
async function refreshLifecycleAfterMutation() {
    if (!sdkSession)
        return;
    try {
        await sdkSession.trackHead();
        sdkSession.invalidate();
        cachedAwareness = await sdkSession.getAwarenessBlock();
        await persistSessionState();
    }
    catch {
        // Non-fatal: mutation already succeeded in CLI path.
    }
}
async function contextHook(method, query, scope, limit) {
    if (!CONTEXT_HOOK_ENABLED)
        return "";
    if (!sdkSession || method !== "search" || !query)
        return "";
    try {
        const context = await sdkSession.getContextFor(query, { scope, limit });
        if (!context || context.startsWith("No results"))
            return "";
        return `--- Context Preview ---\n${context}`;
    }
    catch {
        return "";
    }
}
async function awarenessHook(path, full) {
    if (!INCLUDE_AWARENESS_IN_EXPLORE)
        return "";
    if (full)
        return "";
    if (path && path.trim().length > 0)
        return "";
    if (!sdkSession)
        return "";
    try {
        if (!cachedAwareness) {
            cachedAwareness = await sdkSession.getAwarenessBlock();
        }
        return cachedAwareness ? `--- Awareness ---\n${cachedAwareness}` : "";
    }
    catch {
        return "";
    }
}
// ─── Server ─────────────────────────────────────────────────────────
const server = new McpServer({ name: "ideaspaces", version: "0.2.0" });
// ─── is_auth ────────────────────────────────────────────────────────
server.tool("is_auth", "Connect to a space, create a new space, or manage credentials. Spaces are either personal (no hostname) or belong to an organization (hostname like 'ideaspaces.xyz'). Use repos to see both scopes. Use hostname/slug to login to org spaces.", {
    action: z
        .enum(["login", "logout", "repos", "status", "create"])
        .default("login")
        .describe("login: authenticate or select space (use hostname/slug for org spaces). logout: clear credentials. repos: list all spaces (personal and org). status: connection info. create: create a new space and connect."),
    repo: z.string().optional().describe("Space slug or hostname/slug to connect to (e.g. 'notes' or 'ideaspaces.xyz/notes')"),
    name: z.string().optional().describe("Space name (for create)"),
    purpose: z.string().optional().describe("Space purpose (for create)"),
    hostname: z.string().optional().describe("Organization hostname for team spaces (for create). Omit for personal space."),
}, async ({ action, repo, name, purpose, hostname }) => {
    switch (action) {
        case "login": {
            const result = await run(repo ? ["login", repo] : ["login"]);
            if (!isErrorResult(result))
                await initLifecycle();
            return result;
        }
        case "logout": {
            const result = await run(["power", "logout"]);
            if (!isErrorResult(result))
                resetLifecycle();
            return result;
        }
        case "repos":
            return run(["power", "repos"]);
        case "status":
            return run(["power", "status"]);
        case "create": {
            if (!name)
                return fail("name required for create");
            const a = ["power", "create", name];
            if (purpose)
                a.push("--purpose", purpose);
            if (repo)
                a.push("--slug", repo);
            if (hostname)
                a.push("--hostname", hostname);
            const result = await run(a);
            if (!isErrorResult(result))
                await initLifecycle();
            return result;
        }
    }
});
// ─── is_explore ─────────────────────────────────────────────────────
server.tool("is_explore", "See what's in the space. Returns tree structure, README context, and what changed since last session.", {
    path: z.string().optional().describe("Directory path. Empty for root."),
    full: z.boolean().optional().describe("Return full outline of every file and directory."),
}, async ({ path, full }) => {
    const result = full
        ? await run(["power", "outline"])
        : await run(path ? ["navigate", path] : ["navigate"]);
    const awareness = await awarenessHook(path, full);
    return appendText(result, awareness);
});
// ─── is_find ────────────────────────────────────────────────────────
server.tool("is_find", "Find knowledge by meaning, text pattern, or metadata. Automatically picks the right search method.", {
    method: z
        .enum(["search", "grep", "list"])
        .default("search")
        .describe("search: semantic. grep: text/regex in files. list: filter by metadata."),
    query: z.string().optional().describe("Search query (search) or text pattern (grep)"),
    scope: z.string().optional().describe("Directory scope"),
    type: z.string().optional().describe("Node type: note, perspective, skill, agent_context"),
    tag: z.string().optional().describe("Tag filter (list)"),
    attached_to: z.string().optional().describe("Entity, e.g. 'hostname:acme.com'"),
    contributed_by: z.string().optional().describe("Author filter"),
    heading: z.string().optional().describe("Extract section by heading (grep)"),
    tags: z.string().optional().describe("Tags filter (search)"),
    limit: z.number().optional(),
}, async ({ method, query, scope, type, tag, attached_to, contributed_by, heading, tags, limit }) => {
    const a = [];
    switch (method) {
        case "search":
            if (!query)
                return fail("query required for search");
            a.push("search", query);
            if (scope)
                a.push("--scope", scope);
            if (type)
                a.push("--type", type);
            if (attached_to)
                a.push("--attached-to", attached_to);
            if (contributed_by)
                a.push("--contributed-by", contributed_by);
            if (tags)
                a.push("--tags", tags);
            if (limit)
                a.push("--limit", String(limit));
            break;
        case "grep":
            a.push("power", "grep");
            if (query)
                a.push(query);
            if (scope)
                a.push("--scope", scope);
            if (heading)
                a.push("--heading", heading);
            break;
        case "list":
            a.push("power", "find");
            if (tag)
                a.push("--tag", tag);
            if (type)
                a.push("--type", type);
            if (attached_to)
                a.push("--attached-to", attached_to);
            if (contributed_by)
                a.push("--contributed-by", contributed_by);
            if (scope)
                a.push("--dir", scope);
            if (limit)
                a.push("--limit", String(limit));
            break;
    }
    const result = await run(a);
    const extraContext = await contextHook(method, query, scope, limit);
    return appendText(result, extraContext);
});
// ─── is_read ────────────────────────────────────────────────────────
server.tool("is_read", "Read a note's content and metadata. Add history=true to see how it evolved.", {
    path: z.string().describe("File path or node ID (e.g. 'core/About.md' or 'n_b4d942f682a0')"),
    offset: z.number().optional().describe("Start line (1-indexed)"),
    limit: z.number().optional().describe("Max lines"),
    history: z.boolean().optional().describe("Include git log for this file"),
}, async ({ path, offset, limit, history }) => {
    const a = ["read", path];
    if (offset)
        a.push("--offset", String(offset));
    if (limit)
        a.push("--limit", String(limit));
    const result = await run(a);
    if (history && !isErrorResult(result)) {
        const hist = await cli(["--json", "power", "git", "log", "--path", path]);
        if (hist.out.trim()) {
            return ok(`${resultText(result)}\n\n--- History ---\n${hist.out.trim()}`);
        }
    }
    return result;
});
// ─── is_write ───────────────────────────────────────────────────────
server.tool("is_write", "Create, update, move, or delete notes. Specify action: write, update_metadata, move, or delete.", {
    action: z.enum(["write", "update_metadata", "move", "delete"]).default("write"),
    path: z.string().optional().describe("File path (write, delete)"),
    content: z.string().optional().describe("Markdown content (write)"),
    name: z.string().optional().describe("Note name"),
    summary: z.string().optional().describe("Dense summary for search"),
    tags: z.array(z.string()).optional(),
    attached_to: z.array(z.string()).optional().describe("Entity bindings"),
    if_match: z.string().optional().describe("SHA from is_read for conditional write"),
    node_id: z.string().optional().describe("Node ID (update_metadata)"),
    accessibility: z.array(z.string()).optional(),
    references: z.array(z.string()).optional(),
    source: z.string().optional().describe("Current path (move)"),
    destination: z.string().optional().describe("New path (move)"),
}, async ({ action, path, content, name, summary, tags, attached_to, if_match, node_id, accessibility, references, source, destination }) => {
    switch (action) {
        case "write": {
            if (!path)
                return fail("path required");
            if (!content)
                return fail("content required");
            const a = ["write", path];
            if (name)
                a.push("--name", name);
            if (summary)
                a.push("--summary", summary);
            if (tags?.length)
                a.push("--tags", tags.join(","));
            if (attached_to?.length)
                a.push("--attached-to", attached_to.join(","));
            if (if_match)
                a.push("--if-match", if_match);
            const result = await run(a, content);
            if (!isErrorResult(result))
                await refreshLifecycleAfterMutation();
            return result;
        }
        case "update_metadata": {
            if (!node_id)
                return fail("node_id required");
            const a = ["power", "metadata", node_id];
            if (tags?.length)
                a.push("--tags", tags.join(","));
            if (attached_to?.length)
                a.push("--attached-to", attached_to.join(","));
            if (accessibility?.length)
                a.push("--accessibility", accessibility.join(","));
            if (references?.length)
                a.push("--references", references.join(","));
            const result = await run(a);
            if (!isErrorResult(result))
                await refreshLifecycleAfterMutation();
            return result;
        }
        case "move": {
            if (!source || !destination)
                return fail("source and destination required");
            const result = await run(["power", "move", source, destination]);
            if (!isErrorResult(result))
                await refreshLifecycleAfterMutation();
            return result;
        }
        case "delete": {
            if (!path)
                return fail("path required");
            const result = await run(["power", "delete", path, "--yes"]);
            if (!isErrorResult(result))
                await refreshLifecycleAfterMutation();
            return result;
        }
    }
});
// ─── Start ──────────────────────────────────────────────────────────
await initLifecycle();
const transport = new StdioServerTransport();
await server.connect(transport);
//# sourceMappingURL=index.js.map