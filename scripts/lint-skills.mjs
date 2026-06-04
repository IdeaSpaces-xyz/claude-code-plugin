// Lint skill entrypoints for re-stated platform internals.
//
// Entrypoint skills (`skills/*/SKILL.md`) carry intent + this surface's tool
// mechanics. They MUST NOT re-state the identity/provenance contract or
// reference removed commands — those live once in SPEC.md and the SDK skill
// catalog. This guard keeps the entrypoints from drifting back: it would have
// caught both the `contributed_by`-as-frontmatter bug (is-space) and the
// `ideaspaces id --fix` stale-command bug (is-publish).
//
// Run: `npm run lint:skills`.

import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const skillsDir = join(root, "skills");

// Tokens that belong to SPEC.md / the SDK catalog, never an entrypoint.
const FORBIDDEN = [
  { re: /contributed_by/, why: "provenance is a git/projection concern — see SPEC.md Identity" },
  { re: /\bnode_id\b/, why: "platform identity lives in the map — see SPEC.md, not the entrypoint" },
  { re: /\baccessibility:/, why: "platform metadata field — see SPEC.md" },
  { re: /Co-authored-by/i, why: "trailer format lives in SPEC.md / the commit skill" },
  { re: /\bideaspaces id\b/, why: "removed command (identity-in-the-map)" },
  { re: /\bid --fix\b/, why: "removed command flag (identity-in-the-map)" },
];

const violations = [];
for (const entry of await readdir(skillsDir, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const rel = `skills/${entry.name}/SKILL.md`;
  let text;
  try {
    text = await readFile(join(skillsDir, entry.name, "SKILL.md"), "utf-8");
  } catch {
    continue;
  }
  text.split("\n").forEach((line, i) => {
    for (const { re, why } of FORBIDDEN) {
      const m = line.match(re);
      if (m) violations.push(`  ${rel}:${i + 1}: "${m[0]}" — ${why}`);
    }
  });
}

if (violations.length) {
  console.error(
    "Skill entrypoints must not re-state platform internals " +
      "(keep them in SPEC.md / the SDK catalog and point to them):\n",
  );
  console.error(violations.join("\n"));
  console.error(`\n${violations.length} violation(s). Move the fact to its canonical home and rephrase the entrypoint.`);
  process.exit(1);
}

console.log("✓ skill entrypoints carry no re-stated platform internals");
