import { createHash } from "node:crypto";
import { join, resolve } from "node:path";

/**
 * Where the Claude Code session id is cached for a given project dir. A
 * user-level path (NOT inside the project tree) so the plugin leaves no
 * footprint in the repos a session visits, keyed by a hash of the resolved
 * project dir so distinct projects/worktrees don't collide.
 *
 * This is the WRITE side; the MCP server's `sessionIdCachePath` (in the
 * mcp-server repo's `trailers.ts`) is the READ side. The two schemes MUST stay
 * identical — a shared golden-value test in both repos
 * (`sessionIdCachePath("/home/u","/work/a")` → `…/sessions/d7f9747246691548`)
 * locks them together; a drift on either side fails that test loudly rather
 * than silently omitting the Conversation trailer.
 *
 * Accepted v1 limitation: the key is the project dir, NOT the session — because
 * the MCP server (the reader) only knows CLAUDE_PROJECT_DIR, never the session
 * id. So two concurrent Claude Code sessions in the *same* directory share one
 * cache file and the last SessionStart wins; their commits may carry the other
 * session's Conversation id. Distinct dirs (incl. git worktrees) are isolated.
 * Same-dir concurrency is uncommon and the trailer is advisory, so this is left
 * as last-writer-wins rather than adding a PID/session tiebreaker the reader
 * can't resolve anyway.
 */
export function sessionIdCachePath(homeDir: string, projectDir: string): string {
  const key = createHash("sha256").update(resolve(projectDir)).digest("hex").slice(0, 16);
  return join(homeDir, ".ideaspaces", "sessions", key);
}
