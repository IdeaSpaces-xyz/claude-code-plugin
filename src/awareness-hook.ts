/**
 * SessionStart hook — surfaces local Content awareness at session start.
 *
 * Assembles and renders the protocol's structured Content manifest in-process:
 * position, Now, tree, agent context, skills, since-last-session activity, git,
 * stale-doc drift, and missing direction. The hook then advances the local seen
 * ref for the next session. That ref write stays surface-owned; protocol shape
 * primitives remain read-only.
 *
 * The session-id bridge and persisted open-Change line are Claude-harness state,
 * not Content awareness, and remain local here. Outside an ideaspace the hook
 * emits only an open Change when present.
 *
 * Hooks must never block session start — errors go to stderr and exit 0.
 * Bundled with `npm run build:hook`; the committed dist artifact ships pre-built.
 */

import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { dirname } from "node:path";
import { homedir } from "node:os";
import {
  assembleContentAwareness,
  renderContentAwareness,
  SEEN_REF,
} from "@ideaspaces/protocol";
import { changeCachePath, sessionIdCachePath } from "./session-path.js";
import { parseChangeRecord, renderChangeLine } from "./change-line.js";
import { readStdin } from "./stdin.js";

/**
 * Bridge the Claude Code session id to the MCP server. The server can't read it
 * from the MCP protocol (only CLAUDE_PROJECT_DIR is set on it), but this hook
 * receives `session_id` on stdin — so persist it in the shared user-level cache.
 * Best-effort: failure never blocks session start.
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
 * Render the persisted open Change into session context. Display-only: arming
 * stays in the MCP server. Session-scoped, so it can surface outside an
 * ideaspace and independently of Content awareness failures.
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

/** Advance the previous-session baseline after rendering the current diff. */
function markSeen(repoRoot: string, headSha: string): void {
  try {
    spawnSync("git", ["-C", repoRoot, "update-ref", SEEN_REF, headSha], {
      encoding: "utf-8",
    });
  } catch {
    // Best-effort lifecycle state; never block session start.
  }
}

async function main(): Promise<void> {
  // Session state is independent of whether an ideaspace resolves here.
  const { sessionId, projectDir } = captureSessionId(await readStdin());
  const openChange = changeLine(sessionId, projectDir);

  try {
    // Awareness renders at the resolved project dir, not the spawn cwd — the
    // harness may launch hooks from elsewhere (CLAUDE_PROJECT_DIR is the
    // contract; input.cwd and process.cwd() are fallbacks, in that order).
    const manifest = await assembleContentAwareness({ position: projectDir });
    if (manifest) {
      const text = renderContentAwareness(manifest);
      if (text.trim()) process.stdout.write(text + "\n");

      // Read-before-write ordering is load-bearing: this session rendered the
      // previous baseline; only now may it become the next session's baseline.
      if (manifest.position.repoRoot && manifest.git?.headSha) {
        markSeen(manifest.position.repoRoot, manifest.git.headSha);
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    process.stderr.write(`awareness-hook: awareness failed: ${message}\n`);
  }

  if (openChange) process.stdout.write(openChange + "\n");
}

main().catch((err: unknown) => {
  // Hooks must not block session start. Log to stderr and exit 0.
  const message = err instanceof Error ? err.message : String(err);
  process.stderr.write(`awareness-hook: ${message}\n`);
});
