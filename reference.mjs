// Build reference/ from the SDK's distribution-canonical skill catalog.
//
// The plugin's skills read shared protocol content from reference/<name>.md
// (the arscontexta pattern) rather than duplicating it. That content is the
// SDK's surface-neutral skill catalog — copied here at build time from the
// installed @ideaspaces/sdk package so there's one canonical source.
//
// reference/ is committed (the plugin ships pre-built). Re-run after bumping
// the SDK dependency.

import { copyFile, mkdir, readdir, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const src = join(root, "node_modules/@ideaspaces/sdk/skills");
const dst = join(root, "reference");

let files;
try {
  files = (await readdir(src)).filter((f) => f.endsWith(".md"));
} catch {
  console.error(`✗ SDK skills not found at ${src} — run \`npm install\` first.`);
  process.exit(1);
}

// Rebuild cleanly so removed skills don't linger.
await rm(dst, { recursive: true, force: true });
await mkdir(dst, { recursive: true });

for (const f of files.sort()) {
  await copyFile(join(src, f), join(dst, f));
  console.log(`✓ reference/${f}`);
}
console.log(`Built reference/ with ${files.length} skill(s).`);
