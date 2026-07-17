/**
 * SessionStart hook — surfaces the awareness block at session start.
 *
 * Shells the bundled `ideaspaces navigate --json . --mark-seen` and emits its
 * rendered `text`: orientation (Now, tree, agent context, skills,
 * since-last-session), a git-state line, stale-doc drift, and missing-direction
 * drift — the same block the MCP `is_navigate` tool returns. `--mark-seen`
 * persists HEAD as the since-last-session baseline for the next session. Outside
 * an ideaspace the CLI returns no text and the hook stays silent (the plugin's
 * "optional, opt-in" positioning extends to the entry path).
 *
 * The CLI is the single awareness producer — this hook holds no SDK import, so
 * `build:hook` no longer bundles the SDK into shipped code. It also bridges the
 * session id (below), which is not orientation and stays local.
 *
 * Claude Code surfaces stdout as session-start context. Hooks must never block
 * session start — errors go to stderr and exit 0.
 *
 * Bundled with `npm run build:hook`; the committed `dist/awareness-hook.js`
 * ships pre-built.
 */

import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";
import { changeCachePath, sessionIdCachePath } from "./session-path.js";
import { parseChangeRecord, renderChangeLine } from "./change-line.js";
import { readStdin } from "./stdin.js";

/**
 * Bridge the Claude Code session id to the MCP server. The server can't read it
 * from the MCP protocol (only CLAUDE_PROJECT_DIR is set on it), but this hook
 * *does* receive `session_id` on stdin — so we persist it to a user-level cache
 * (`~/.ideaspaces/sessions/<hash(project-dir)>`, outside the project tree so no
 * visited repo is touched), where `is_commit` reads it to stamp the Conversation
 * trailer. Both sides key off CLAUDE_PROJECT_DIR. Best-effort: a failed write
 * never blocks session start, and the server omits the trailer when it's absent.
 */
function captureSessionId(raw: string): { sessionId?: string; projectDir: string } {
  const fallbackDir = process.env.CLAUDE_PROJECT_DIR?.trim() || process.cwd();
  if (!raw.trim()) return { projectDir: fallbackDir };
  let input: { session_id?: unknown; cwd?: unknown };
  try {
    input = JSON.parse(raw);
  } catch {
    return { projectDir: fallbackDir };
  }
  const projectDir =
    process.env.CLAUDE_PROJECT_DIR?.trim() ||
    (typeof input.cwd === "string" && input.cwd ? input.cwd : process.cwd());
  const sessionId = input.session_id;
  if (typeof sessionId !== "string" || !sessionId) return { projectDir };
  try {
    const file = sessionIdCachePath(homedir(), projectDir);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, sessionId + "\n");
  } catch {
    // Never block session start on a failed write.
  }
  return { sessionId, projectDir };
}

/**
 * The open-Change line. The MCP server persists the open Change per project
 * dir (server-written / hook-read — the inverse of the session-id bridge);
 * this renders it into session context so a restart or a new session never
 * silently hides an open decision. Display-only: arming stays in the server.
 * Session-scoped like the session id, not space-scoped — a Change spans repos,
 * so it surfaces even when `navigate` has nothing to say here. Best-effort:
 * absent/malformed record → no line.
 */
function changeLine(sessionId: string | undefined, projectDir: string): string | undefined {
  try {
    const raw = readFileSync(changeCachePath(homedir(), projectDir), "utf-8");
    const rec = parseChangeRecord(raw);
    return rec ? renderChangeLine(rec, sessionId, Date.now()) : undefined;
  } catch {
    return undefined;
  }
}

// The bundled CLI (plugin layout: dist/awareness-hook.js → ../cli/bundle/…).
function resolveCli(): string {
  if (process.env.IS_CLI_PATH) return process.env.IS_CLI_PATH;
  const dir = dirname(fileURLToPath(import.meta.url));
  const rel = join(dir, "../cli/bundle/ideaspaces.js");
  return existsSync(rel) ? rel : "ideaspaces";
}

async function main(): Promise<void> {
  // Capture the session id first, unconditionally — it's session-scoped, not
  // ideaspace-scoped, so it must be written even outside an `_agent/` space
  // (a commit may target any repo in the session).
  const { sessionId, projectDir } = captureSessionId(await readStdin());
  const openChange = changeLine(sessionId, projectDir);

  const cwd = process.cwd();
  // A bundled `.js` runs under `node`; a bare `ideaspaces` on PATH runs directly
  // (passing it to `node` would try to load a file literally named "ideaspaces").
  const cli = resolveCli();
  const isFile = cli.includes("/") || cli.includes("\\") || cli.endsWith(".js");
  const navArgs = ["--json", "navigate", ".", "--mark-seen"];
  const r = spawnSync(isFile ? "node" : cli, isFile ? [cli, ...navArgs] : navArgs, {
    cwd,
    encoding: "utf-8",
  });
  // Best-effort: never block session start, but surface *why* to stderr so a
  // broken vendor / path-resolution bug is debuggable instead of silent. The
  // Change line still prints on a navigate failure — it is session-scoped
  // state, independent of whether orientation resolves here.
  if (r.status !== 0) {
    if (r.stderr?.trim()) process.stderr.write(`awareness-hook: navigate failed: ${r.stderr.trim()}\n`);
    if (openChange) process.stdout.write(openChange + "\n");
    return;
  }

  let text: unknown;
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

main().catch((err: unknown) => {
  // Hooks must not block session start. Log to stderr and exit 0.
  const message = err instanceof Error ? err.message : String(err);
  process.stderr.write(`awareness-hook: ${message}\n`);
});
