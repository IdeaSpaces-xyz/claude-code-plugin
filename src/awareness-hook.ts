/**
 * SessionStart hook — surfaces the awareness block at session start.
 *
 * Walks up from cwd to find `_agent/`. Behavior:
 *   - No `_agent/` found → surface the entry-point hint (offer `/is-setup`)
 *     instead of going silent. The agent should know there's a way to
 *     turn this dir into an ideaspace.
 *   - `_agent/` found → format the awareness block via `assembleAwareness`
 *     from the SDK, then append drift signals (missing purpose/now,
 *     login state) so the agent has explicit cues rather than having to
 *     infer them from contract files alone.
 *
 * Claude Code surfaces stdout as session-start context for the agent.
 *
 * Bundled with `npm run build:hook`. The output `dist/awareness-hook.js`
 * is committed so the plugin ships pre-built.
 */

import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { findSpaceRoot, assembleAwareness } from "@ideaspaces/sdk";

function isLoggedIn(): boolean {
  return existsSync(join(homedir(), ".ideaspaces", "credentials.json"));
}

async function main(): Promise<void> {
  const space = await findSpaceRoot(process.cwd());

  // No ideaspace here yet — surface the entry point so the agent can offer
  // the right next step instead of going silent.
  if (space.source === "none" || !space.root) {
    process.stdout.write(
      "Not an ideaspace yet.\n" +
        "If the user wants this folder structured for knowledge work, suggest `/is-setup`.\n",
    );
    return;
  }

  const block = await assembleAwareness({
    root: space.root,
    contract: space.contract,
    // lastSha can hook into session state once sync ships.
  });

  if (block.trim()) process.stdout.write(block);

  // Drift signals — make the missing-file state and login state explicit so
  // the agent doesn't have to infer from contract files. The contract names
  // purpose / now / next; their absence is direction-not-captured-yet, not
  // ambiguity. Surface as ⚠ so the agent treats them as first-class.
  const drift: string[] = [];
  if (!space.contract.purpose) {
    drift.push(
      "⚠ `_agent/purpose.md` not yet captured. The contract names it; propose capturing in conversation before doing other work.",
    );
  }
  if (!space.contract.now) {
    drift.push(
      "⚠ `_agent/now.md` not yet captured. Propose capturing what's currently active.",
    );
  }
  if (!isLoggedIn()) {
    drift.push(
      "(Not logged in to IdeaSpaces. `/is-publish` will offer login when the user is ready to host this remotely.)",
    );
  }

  if (drift.length > 0) {
    // Blank-line separator before drift if there's already content above.
    const prefix = block.trim() ? (block.endsWith("\n") ? "\n" : "\n\n") : "";
    process.stdout.write(`${prefix}${drift.join("\n")}\n`);
  }
}

main().catch((err: unknown) => {
  // Hooks must not block session start. Log to stderr and exit 0.
  const message = err instanceof Error ? err.message : String(err);
  process.stderr.write(`awareness-hook: ${message}\n`);
});
