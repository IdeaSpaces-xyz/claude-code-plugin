/**
 * SessionStart hook — surfaces local Content awareness at session start.
 *
 * Assembles the protocol's structured Content manifest in-process and renders
 * its head — position, Now, tree, agent context, skills — followed by the
 * protocol's one Content-tail composition: local State (branch, upstream,
 * working tree, captures awaiting commit), since-last-session activity,
 * stale-doc drift, missing direction, and the open Change line last. The same
 * composer renders the CLI's `status` and Pi's post-breakpoint register, so
 * the three surfaces cannot order the tail differently. Claude Code exposes no
 * breakpoint-placement primitive, so head and tail ship as one deterministic
 * SessionStart render. The hook then advances the local seen ref for the next
 * session; that ref write stays surface-owned.
 *
 * The session-id bridge and persisted open-Change record are Claude-harness
 * state, not Content awareness. Outside an ideaspace the hook emits only an
 * open Change when present.
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
  assembleContentState,
  renderContentAwareness,
  renderContentTail,
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
    let manifest = await assembleContentAwareness({ position: projectDir });
    // Protocol selection is neutral; the Claude habitat follows the shared
    // Agreement → Foundation → floor policy.
    if (manifest?.status === "contract_choice_required") {
      manifest = await assembleContentAwareness({
        position: projectDir,
        contractSource: "agreement",
      });
    }
    // The protocol's floor is useful to explicit readers, but this hook keeps
    // its established boundary: no automatic injection outside an ideaspace.
    if (manifest?.status === "ok" && manifest.contractSource === null) {
      manifest = null;
    }
    if (manifest && manifest.status === "ok") {
      const head = renderContentAwareness(manifest, { placement: "head" });
      // State is read only inside a repository; elsewhere the tail keeps the
      // manifest's own sections and the compact Git line stays absent anyway.
      const state = manifest.position.repoRoot
        ? await assembleContentState(manifest.position.repoRoot)
        : null;
      const tail = renderContentTail(manifest, { state, change: openChange });
      const text = [head, tail].filter((part) => part.trim()).join("\n\n");
      if (text) process.stdout.write(text + "\n");

      // Read-before-write ordering is load-bearing: this session rendered the
      // previous baseline; only now may it become the next session's baseline.
      if (manifest.position.repoRoot && manifest.git?.headSha) {
        markSeen(manifest.position.repoRoot, manifest.git.headSha);
      }
      return;
    }
    if (manifest) {
      // A diagnostic (invalid contract, unavailable source): render it as before.
      const text = renderContentAwareness(manifest);
      if (text.trim()) process.stdout.write(text + "\n");
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    process.stderr.write(`awareness-hook: awareness failed: ${message}\n`);
  }

  // No Content manifest rendered the Change line: it still surfaces alone.
  if (openChange) process.stdout.write(openChange + "\n");
}

main().catch((err: unknown) => {
  // Hooks must not block session start. Log to stderr and exit 0.
  const message = err instanceof Error ? err.message : String(err);
  process.stderr.write(`awareness-hook: ${message}\n`);
});
