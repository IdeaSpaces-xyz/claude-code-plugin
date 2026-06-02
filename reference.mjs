// Build reference/ from the SDK's canonical skill catalog via readSkill() —
// the same API the embedded catalog backs and the MCP server serves. One
// source for every surface: plugin reference/, MCP resources, and the CLI all
// resolve to the same skill content.
//
// reference/ is committed (the plugin ships pre-built). Re-run after bumping
// the SDK dependency.

import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { listSkills, readSkill } from "@ideaspaces/sdk";

const root = dirname(fileURLToPath(import.meta.url));
const dst = join(root, "reference");

let skills;
try {
  skills = await listSkills();
} catch {
  console.error("✗ SDK skill catalog unavailable — run `npm install` first.");
  process.exit(1);
}

// Rebuild cleanly so removed skills don't linger.
await rm(dst, { recursive: true, force: true });
await mkdir(dst, { recursive: true });

for (const s of skills) {
  const skill = await readSkill(s.name);
  await writeFile(join(dst, `${s.name}.md`), skill.content, "utf-8");
  console.log(`✓ reference/${s.name}.md`);
}
console.log(`Built reference/ with ${skills.length} skill(s) via readSkill().`);
