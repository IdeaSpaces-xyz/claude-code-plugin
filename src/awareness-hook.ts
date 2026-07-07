/**
 * SessionStart hook — surfaces the awareness block at session start.
 *
 * Walks up from cwd to find `_agent/`. Behavior:
 *   - No `_agent/` found → exit silently. Discovery of `/is-setup` flows
 *     through skill descriptions, not session-start noise. The plugin's
 *     "optional, opt-in" positioning extends to the entry path.
 *   - `_agent/` found → emit the orientation block (Now, tree, agent context,
 *     skills, and — in a git repo — what changed since last session). In a git
 *     repo, also emit a git-state line and a **stale-doc drift** block (docs
 *     whose referenced code is newer), then persist HEAD for next session.
 *   - Missing `_agent/purpose.md` / `_agent/now.md` surface as direction-not-
 *     yet-captured drift.
 *
 * Composes the SDK's data primitives here (the plugin owns rendering). Output
 * is bounded: `assembleAwareness` caps the tree/changes, the drift block is
 * capped to a handful of signals.
 *
 * Claude Code surfaces stdout as session-start context for the agent. Hooks
 * must never block session start — errors go to stderr and exit 0.
 *
 * Bundled with `npm run build:hook`; the committed `dist/awareness-hook.js`
 * ships pre-built.
 */

import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { homedir } from "node:os";
import {
  findSpaceRoot,
  assembleAwareness,
  gitState,
  collectDocDependencies,
  staleDocSignals,
} from "@ideaspaces/sdk";
import { sessionIdCachePath } from "./session-path.js";

/** Drift signals shown before the list is truncated. */
const MAX_DRIFT = 10;

/** Read the hook's stdin payload (Claude Code sends JSON). Guard the TTY case
 * so a manual run without piped input doesn't hang on an open stream. */
async function readStdin(): Promise<string> {
  if (process.stdin.isTTY) return "";
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString("utf-8");
}

/**
 * Bridge the Claude Code session id to the MCP server. The server can't read it
 * from the MCP protocol (only CLAUDE_PROJECT_DIR is set on it), but this hook
 * *does* receive `session_id` on stdin — so we persist it to a user-level cache
 * (`~/.ideaspaces/sessions/<hash(project-dir)>`, outside the project tree so no
 * visited repo is touched), where `is_commit` reads it to stamp the Conversation
 * trailer. Both sides key off CLAUDE_PROJECT_DIR. Best-effort: a failed write
 * never blocks session start, and the server omits the trailer when it's absent.
 */
function captureSessionId(raw: string): void {
  if (!raw.trim()) return;
  let input: { session_id?: unknown; cwd?: unknown };
  try {
    input = JSON.parse(raw);
  } catch {
    return;
  }
  const sessionId = input.session_id;
  if (typeof sessionId !== "string" || !sessionId) return;
  // Key off CLAUDE_PROJECT_DIR to match the server's read; fall back to the
  // payload cwd only for manual runs (the real flow always has the env set).
  const projectDir =
    process.env.CLAUDE_PROJECT_DIR?.trim() ||
    (typeof input.cwd === "string" ? input.cwd : process.cwd());
  try {
    const file = sessionIdCachePath(homedir(), projectDir);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, sessionId + "\n");
  } catch {
    // Never block session start on a failed write.
  }
}

function isGitRepo(cwd: string): boolean {
  const r = spawnSync("git", ["-C", cwd, "rev-parse", "--is-inside-work-tree"], {
    encoding: "utf-8",
  });
  return r.status === 0 && r.stdout.trim() === "true";
}

function headSha(cwd: string): string | null {
  const r = spawnSync("git", ["-C", cwd, "rev-parse", "HEAD"], { encoding: "utf-8" });
  return r.status === 0 ? r.stdout.trim() || null : null;
}

// The "last seen" marker — HEAD at the start of the previous session — lives in
// a local git ref, not a file in HOME. Local refs aren't pushed, `update-ref` is
// atomic, and `recentActivity` diffs HEAD against it for the since-last-session
// view. (Replaces the SDK session-state file.)
const SEEN_REF = "refs/ideaspaces/seen";

function readSeenMarker(cwd: string): string | undefined {
  const r = spawnSync("git", ["-C", cwd, "rev-parse", "--verify", "--quiet", SEEN_REF], {
    encoding: "utf-8",
  });
  return r.status === 0 && r.stdout.trim() ? r.stdout.trim() : undefined;
}

function setSeenMarker(cwd: string, sha: string): void {
  // Best-effort: a failed marker update must never block session start.
  spawnSync("git", ["-C", cwd, "update-ref", SEEN_REF, sha], { encoding: "utf-8" });
}

async function main(): Promise<void> {
  // Capture the session id first, unconditionally — it's session-scoped, not
  // ideaspace-scoped, so it must be written even outside an `_agent/` space
  // (a commit may target any repo in the session).
  captureSessionId(await readStdin());

  const cwd = process.cwd();
  const space = await findSpaceRoot(cwd);
  if (space.source === "none" || !space.root) return;

  const sections: string[] = [];

  // `lastSha` drives the "since last session" diff; only meaningful in a repo.
  const git = isGitRepo(cwd);
  let lastSha: string | undefined;
  let repoRoot: string | undefined;
  let gs: Awaited<ReturnType<typeof gitState>> | undefined;
  if (git) {
    gs = await gitState(cwd);
    repoRoot = gs.repoRoot;
    lastSha = readSeenMarker(cwd);
  }

  // Orientation: Now, tree, agent context, skills, since-last-session.
  const block = await assembleAwareness({
    root: space.root,
    contract: space.contract,
    lastSha,
  });
  if (block.trim()) sections.push(block);

  if (git && gs && repoRoot) {
    // Compact git-state line.
    const bits: string[] = [];
    if (gs.branch) bits.push(`branch ${gs.branch}`);
    if (gs.ahead != null && gs.behind != null && (gs.ahead || gs.behind)) {
      bits.push(`↑${gs.ahead} ↓${gs.behind}`);
    }
    if (gs.dirty) bits.push("dirty");
    if (gs.untrackedInTrackedDirs.length) {
      bits.push(`${gs.untrackedInTrackedDirs.length} untracked`);
    }
    if (bits.length) sections.push(`Git: ${bits.join(", ")}`);

    // Stale-doc drift — the headline. Opt-in: only docs declaring `code_paths`
    // are checked, so most repos emit nothing here.
    const deps = await collectDocDependencies(repoRoot, repoRoot);
    const signals = await staleDocSignals(repoRoot, deps);
    if (signals.length) {
      const lines = ["⚠ Possible stale docs — verify before quoting their status:"];
      for (const s of signals.slice(0, MAX_DRIFT)) {
        lines.push(
          s.kind === "stale"
            ? `  ${s.doc} — \`${s.newestCode}\` was committed after the doc`
            : `  ${s.doc} — references missing path(s): ${s.missing.join(", ")}`,
        );
      }
      if (signals.length > MAX_DRIFT) {
        lines.push(`  … and ${signals.length - MAX_DRIFT} more`);
      }
      sections.push(lines.join("\n"));
    }

    // Persist HEAD so the next session can diff against it.
    const head = headSha(cwd);
    if (head) setSeenMarker(cwd, head);
  }

  // Missing-direction drift. The contract names purpose and now; their absence
  // is direction-not-yet-captured. `next` is a queue, not load-bearing — skip.
  const direction: string[] = [];
  if (!space.contract.purpose) {
    direction.push(
      "⚠ `_agent/purpose.md` not yet captured. The contract names it; suggest capturing in conversation at a natural moment.",
    );
  }
  if (!space.contract.now) {
    direction.push("⚠ `_agent/now.md` not yet captured. Suggest capturing what's currently active.");
  }
  if (direction.length) sections.push(direction.join("\n"));

  if (sections.length) process.stdout.write(sections.join("\n\n") + "\n");
}

main().catch((err: unknown) => {
  // Hooks must not block session start. Log to stderr and exit 0.
  const message = err instanceof Error ? err.message : String(err);
  process.stderr.write(`awareness-hook: ${message}\n`);
});
