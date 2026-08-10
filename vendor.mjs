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

// Sibling repos normally sit beside this one. `IDEASPACES_REPOS_ROOT` points
// elsewhere so the preflight below can run from a worktree, where `../cli`
// would resolve inside worktrees/ instead of projects/.
const reposRoot = process.env.IDEASPACES_REPOS_ROOT ?? join(root, "..");
const sibling = (entry) => join(reposRoot, entry.repo.replace(/^\.\.\//, ""));

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

/** The `@ideaspaces/protocol` pin declared by a package.json, from either dep block. */
async function protocolPin(pkgPath) {
  const pkg = JSON.parse(await readFile(pkgPath, "utf8"));
  return pkg.dependencies?.["@ideaspaces/protocol"] ?? pkg.devDependencies?.["@ideaspaces/protocol"] ?? null;
}

// Preflight: every input must be built against the same protocol.
//
// Each vendored bundle inlines its own copy of the protocol, and the plugin's
// own devDependency feeds the hooks and reference/. Nothing downstream compares
// them, so a stale input ships beside current ones and simply renders worse —
// no error, no warning, and both surfaces agree with themselves. v0.3.4 shipped
// exactly that: the MCP bundle four protocol commits behind the CLI and the
// hook, dropping tree summaries and advertising skills by body text instead of
// their frontmatter description.
//
// Run this before copying anything, so a disagreement never mutates the tree.
const pins = { plugin: await protocolPin(join(root, "package.json")) };
for (const entry of VENDOR) {
  pins[entry.name] = await protocolPin(join(sibling(entry), "package.json"));
}

const distinct = new Set(Object.values(pins));
if (distinct.size !== 1) {
  console.error("✗ protocol pin disagreement — inputs would ship different protocol versions:\n");
  for (const [name, pin] of Object.entries(pins)) {
    console.error(`    ${name.padEnd(12)} ${pin ?? "(none declared)"}`);
  }
  console.error("\n  Bring every input onto one protocol commit, rebuild the sibling bundles, and re-run.");
  console.error("  Nothing was copied; vendor-lock.json is unchanged.");
  process.exit(1);
}
const protocol = pins.plugin;
console.log(`✓ protocol agreement: all ${Object.keys(pins).length} inputs at ${protocol.split("#")[1]?.slice(0, 7) ?? protocol}`);

const lock = {};

for (const entry of VENDOR) {
  const repo = sibling(entry);
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
    protocolPin: pins[entry.name],
    rebuildInCi: entry.rebuildInCi,
    commands: entry.commands,
  };
  console.log(`✓ vendored ${entry.vendoredArtifact} ← ${entry.name}@${commit.slice(0, 7)}`);
}

if (Object.keys(lock).length === VENDOR.length) {
  await writeFile(join(root, "vendor-lock.json"), `${JSON.stringify(lock, null, 2)}\n`, "utf8");
  console.log("✓ updated vendor-lock.json");
}
