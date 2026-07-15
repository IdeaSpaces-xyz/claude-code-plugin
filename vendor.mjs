// Vendor the sibling repos' bundles into the plugin and record exact provenance.
//
// The plugin ships pre-built — Claude Code never runs `npm install` here. Run
// this from the canonical projects/ideaspaces-plugin checkout after the sibling
// CLI and MCP repositories have built their current bundles.

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFile, mkdir, access, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));

const VENDOR = [
  {
    name: "cli",
    repository: "https://github.com/IdeaSpaces-xyz/cli.git",
    repo: "../cli",
    sourceArtifact: "bundle/ideaspaces.js",
    vendoredArtifact: "cli/bundle/ideaspaces.js",
    rebuildInCi: true,
    commands: ["npm run build", "npm run bundle"],
  },
  {
    name: "mcp-server",
    repository: "https://github.com/IdeaSpaces-xyz/mcp-server.git",
    repo: "../mcp-server",
    sourceArtifact: "bundle/index.js",
    vendoredArtifact: "dist/index.js",
    // mcp-server is private. Its own CI proves source ↔ committed bundle;
    // plugin CI verifies the copied bundle hash without cloning across repos.
    rebuildInCi: false,
    commands: ["npm run bundle"],
  },
];

const lock = {};

for (const entry of VENDOR) {
  const repo = join(root, entry.repo);
  const src = join(repo, entry.sourceArtifact);
  const dst = join(root, entry.vendoredArtifact);
  try {
    await access(src);
  } catch {
    console.error(`✗ missing source: ${entry.repo}/${entry.sourceArtifact} — build the sibling repo first.`);
    process.exitCode = 1;
    continue;
  }

  const commit = execFileSync("git", ["-C", repo, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  const sha256 = createHash("sha256").update(await readFile(src)).digest("hex");

  await mkdir(dirname(dst), { recursive: true });
  await copyFile(src, dst);
  lock[entry.name] = {
    repository: entry.repository,
    commit,
    sourceArtifact: entry.sourceArtifact,
    vendoredArtifact: entry.vendoredArtifact,
    sha256,
    rebuildInCi: entry.rebuildInCi,
    commands: entry.commands,
  };
  console.log(`✓ vendored ${entry.vendoredArtifact} ← ${entry.name}@${commit.slice(0, 7)}`);
}

if (Object.keys(lock).length === VENDOR.length) {
  await writeFile(join(root, "vendor-lock.json"), `${JSON.stringify(lock, null, 2)}\n`, "utf8");
  console.log("✓ updated vendor-lock.json");
}
