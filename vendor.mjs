// Vendor the sibling repos' bundles into the plugin.
//
// The plugin ships pre-built — Claude Code never runs `npm install` here, so
// the CLI and MCP-server bundles are committed copies. This script refreshes
// them from the sibling checkouts (projects/cli, projects/mcp-server next to
// this repo). Run it after those repos cut new bundles.
//
//   plugin/cli/bundle/ideaspaces.js  ←  ../cli/bundle/ideaspaces.js
//   plugin/dist/index.js             ←  ../mcp-server/bundle/index.js
//
// Requires the sibling repos checked out alongside this one with current
// bundles (`npm run bundle` in each).

import { copyFile, mkdir, access } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));

const VENDOR = [
  { from: "../cli/bundle/ideaspaces.js", to: "cli/bundle/ideaspaces.js" },
  { from: "../mcp-server/bundle/index.js", to: "dist/index.js" },
];

for (const { from, to } of VENDOR) {
  const src = join(root, from);
  const dst = join(root, to);
  try {
    await access(src);
  } catch {
    console.error(`✗ missing source: ${from} — is the sibling repo checked out and bundled?`);
    process.exitCode = 1;
    continue;
  }
  await mkdir(dirname(dst), { recursive: true });
  await copyFile(src, dst);
  console.log(`✓ vendored ${to} ← ${from}`);
}
