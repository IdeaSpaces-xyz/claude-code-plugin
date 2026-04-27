/**
 * SessionStart hook — surfaces the awareness block at session start.
 *
 * Walks up from cwd to find `_agent/`. If found, formats the block via
 * `assembleAwareness` from the SDK and writes it to stdout. Claude Code
 * surfaces stdout as session-start context for the agent.
 *
 * Silent no-op when no `_agent/` is found — the cwd isn't an ideaspace,
 * so there's nothing to orient toward.
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
}

main().catch((err: unknown) => {
  // Hooks must not block session start. Log to stderr and exit 0.
  const message = err instanceof Error ? err.message : String(err);
  process.stderr.write(`awareness-hook: ${message}\n`);
});
