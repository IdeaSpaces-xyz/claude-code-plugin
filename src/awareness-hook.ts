/**
 * SessionStart hook — surfaces the awareness block at session start.
 *
 * Walks up from cwd to find `_agent/`. Behavior:
 *   - No `_agent/` found → exit silently. Discovery of `/is-setup` flows
 *     through skill descriptions, not session-start noise. The plugin's
 *     positioning ("optional, opt-in") extends to the entry path.
 *   - `_agent/` found → format the awareness block via `assembleAwareness`
 *     from the SDK, then append drift signals for missing
 *     `_agent/purpose.md` / `_agent/now.md`. The contract names those
 *     files; their absence is direction-not-yet-captured, not ambiguity,
 *     and the agent should propose capturing them.
 *
 * Login state is intentionally not surfaced here. `/is-publish` handles
 * the login prompt when the user actually needs to publish — nudging
 * about it on every session start works against the local-first framing.
 *
 * Claude Code surfaces stdout as session-start context for the agent.
 *
 * Bundled with `npm run build:hook`. The output `dist/awareness-hook.js`
 * is committed so the plugin ships pre-built.
 */

import { findSpaceRoot, assembleAwareness } from "@ideaspaces/sdk";

async function main(): Promise<void> {
  const space = await findSpaceRoot(process.cwd());
  if (space.source === "none" || !space.root) return;

  const block = await assembleAwareness({
    root: space.root,
    contract: space.contract,
    // lastSha can hook into session state once sync ships.
  });

  if (block.trim()) process.stdout.write(block);

  // Drift signals for missing direction. The contract names purpose /
  // now / next; their absence is direction-not-yet-captured. Surface as
  // ⚠ so the agent treats them as first-class — not as ambiguity to be
  // inferred from skill text.
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

  if (drift.length > 0) {
    const prefix = block.trim() ? (block.endsWith("\n") ? "\n" : "\n\n") : "";
    process.stdout.write(`${prefix}${drift.join("\n")}\n`);
  }
}

main().catch((err: unknown) => {
  // Hooks must not block session start. Log to stderr and exit 0.
  const message = err instanceof Error ? err.message : String(err);
  process.stderr.write(`awareness-hook: ${message}\n`);
});
