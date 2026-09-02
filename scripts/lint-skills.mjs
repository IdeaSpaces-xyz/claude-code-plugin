// Lint skill entrypoints for re-stated platform internals.
//
// Entrypoint skills (`skills/*/SKILL.md`) carry intent + this surface's tool
// mechanics. They MUST NOT re-state the identity/provenance contract or
// reference removed commands — those live once in SPEC.md and the protocol
// skill catalog. This guard keeps the entrypoints from drifting back: it would have
// caught both the `contributed_by`-as-frontmatter bug (is-space) and the
// `ideaspaces id --fix` stale-command bug (is-publish).
//
// Run: `npm run lint:skills`.

import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const skillsDir = join(root, "skills");

// Tokens that belong to SPEC.md / the protocol catalog, never an entrypoint.
const FORBIDDEN = [
  { re: /contributed_by/, why: "provenance is a git/projection concern — see SPEC.md Identity" },
  { re: /\bnode_id\b/, why: "platform identity lives in the map — see SPEC.md, not the entrypoint" },
  { re: /\baccessibility:/, why: "platform metadata field — see SPEC.md" },
  { re: /Co-authored-by/i, why: "trailer format lives in SPEC.md / the commit skill" },
  { re: /\bideaspaces id\b/, why: "removed command (identity-in-the-map)" },
  { re: /\bid --fix\b/, why: "removed command flag (identity-in-the-map)" },
  // Conduct/shape restatements deduped 2026-08-05 — the space's foundation
  // (core-composed since cli#99) and reference/ carry these once; entrypoints
  // point, they do not restate. Mirrors the CLI's byte-inclusion test.
  { re: /Real content (over placeholder|from real exchange)/, why: "scaffold-template phrase — the space's foundation carries it" },
  { re: /\.gitignore is also part of the Agreement/, why: "foundation-template sentence — the space carries it" },
  { re: /Capture is conscious/, why: "the foundation core's line — point at the space's contract or reference/, don't restate" },
  { re: /Nothing writes without agreement/, why: "reference/guide.md's line — point, don't restate" },
  { re: /\|\s*`foundation\.md`\s*\|/, why: "the contract table lives in the space's foundation and SPEC — not in entrypoints" },
  { re: /1[–-]64 lowercase ASCII letters/, why: "portable skill-name grammar lives in reference/form-primitive.md — point, don't restate" },
];

// The description formula, measured before it was mandated (agent-surface.md,
// practices 1–3 and 8; trigger eval 2026-08-31): a description routes or it
// doesn't, and the two things every routing description carries are a
// when-signal (the trigger conditions, in the words a person uses) and — for
// skills a person invokes — a boundary clause keeping neighbours apart.
// Agent-machinery skills (`user-invocable: false`) fire from the agent's own
// state, so only the when-signal is required there.
const WHEN_SIGNAL =
  /\buse (when|at|for|before|after)\b|\bwhen (the user|someone|you)\b|\btriggers? (at|on|when)\b/i;
// The handoff alternatives are coupled to the `is-` skill-name prefix; if that
// convention ever changes, these patterns silently stop matching handoffs.
const BOUNDARY =
  /\bnot for\b|\bdo not use\b|\bnever\b|\bdoes not\b|\bprefer is-|\bthat is is-|\buse is-|\bis is-/i;

function leadingFrontmatter(text) {
  const lines = text.split(/\r?\n/);
  if (lines[0]?.trimEnd() !== "---") return "";
  const end = lines.slice(1).findIndex((line) => line.trimEnd() === "---");
  return end === -1 ? "" : lines.slice(1, end + 1).join("\n");
}

// Either form: inline `description: text`, or a `description: >` block scalar
// whose value is the indented lines that follow.
function frontmatterDescription(fm) {
  const m = fm.match(/^description:([^\n]*)\n((?:[ \t]+[^\n]*\n?)*)/m);
  if (!m) return "";
  const inline = m[1].replace(/^\s*[>|][+-]?\s*$/, "").trim();
  const block = m[2].replace(/\s+/g, " ").trim();
  return [inline, block].filter(Boolean).join(" ");
}

const violations = [];
const SKILL_NAME_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
for (const entry of await readdir(skillsDir, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const rel = `skills/${entry.name}/SKILL.md`;
  let text;
  try {
    text = await readFile(join(skillsDir, entry.name, "SKILL.md"), "utf-8");
  } catch {
    continue;
  }
  const fm = leadingFrontmatter(text);
  const name = fm.match(/^name:\s*(.+?)\s*$/m)?.[1];
  const description = frontmatterDescription(fm);
  const userInvocable = !/^user-invocable:\s*false\s*$/m.test(fm);
  if (!WHEN_SIGNAL.test(description)) {
    violations.push(
      `  ${rel}: description has no when-signal — say when to reach for it, in the words a person uses ("Use when …")`,
    );
  }
  if (userInvocable && !BOUNDARY.test(description)) {
    violations.push(
      `  ${rel}: description has no boundary clause — name the adjacent ask it does NOT cover ("Not for …; that is is-…")`,
    );
  }
  if (!name || name.length > 64 || !SKILL_NAME_RE.test(name)) {
    violations.push(`  ${rel}: invalid Agent Skills name ${JSON.stringify(name ?? "(missing)")}`);
  } else if (name !== entry.name) {
    violations.push(`  ${rel}: frontmatter name ${JSON.stringify(name)} must match directory ${JSON.stringify(entry.name)}`);
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
    "Skill entrypoints must use portable names and not re-state platform internals " +
      "(keep shared facts in SPEC.md / the protocol catalog and point to them):\n",
  );
  console.error(violations.join("\n"));
  console.error(`\n${violations.length} violation(s). Move the fact to its canonical home and rephrase the entrypoint.`);
  process.exit(1);
}

console.log("✓ skill entrypoints use portable names and carry no re-stated platform internals");
