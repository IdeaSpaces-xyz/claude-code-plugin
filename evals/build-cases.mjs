// Generate eval case directories from intentions.csv + rubrics/.
//
// The roster is the source of truth: one row per intention, in the words a
// person would use, with the skill it should reach and the tool that skill
// should end at. Cases are generated so the two cannot drift — the exact
// failure this suite exists to catch, applied to the suite itself.
//
//   node evals/build-cases.mjs          # write case dirs
//   node evals/build-cases.mjs --check  # report drift, exit 3 when stale
//
// A rubric is resolved as rubrics/<id>.md, else rubrics/<job>.md.

import { readdir, readFile, writeFile, mkdir, rm, stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const check = process.argv.includes("--check");

// Minimal CSV reader — quoted fields with embedded commas, no embedded newlines.
function parseCsv(text) {
  const rows = [];
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const cells = [];
    let cur = "";
    let quoted = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (quoted) {
        if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
        else if (ch === '"') quoted = false;
        else cur += ch;
      } else if (ch === '"') quoted = true;
      else if (ch === ",") { cells.push(cur); cur = ""; }
      else cur += ch;
    }
    cells.push(cur);
    rows.push(cells);
  }
  const [header, ...body] = rows;
  return body.map((cells) => Object.fromEntries(header.map((h, i) => [h, cells[i] ?? ""])));
}

const rows = parseCsv(await readFile(join(here, "intentions.csv"), "utf-8"));

async function rubricFor(row) {
  for (const name of [`${row.id}.md`, `${row.job}.md`]) {
    try { return await readFile(join(here, "rubrics", name), "utf-8"); } catch {}
  }
  throw new Error(`${row.id}: no rubric at rubrics/${row.id}.md or rubrics/${row.job}.md`);
}

// Read-only grant. A skill that fires still self-grants its own declared
// allowed-tools, so this is the floor, not a ceiling — see README.
const TOOLS = '["Read", "Glob", "Grep", "Skill"]';

function promptFile(row) {
  return `---
runs: 3
max_turns: 8
timeout_seconds: 180
allowed_tools: ${TOOLS}
---
${row.prompt}
`;
}

function skillGrader(row) {
  // Reported under ablation, excluded from the score in both arms — a display
  // indicator that says *which* skill fired, which is usually the diagnosis.
  return row.should_trigger === "TRUE"
    ? `---\ntype: tool_used\ntool: Skill\nmin: 1\n---\n`
    : `---\ntype: tool_used\ntool: Skill\nmax: 0\n---\n`;
}

function toolGrader(row) {
  if (!row.expected_tool) return null;
  return `---\ntype: tool_used\ntool: ${row.expected_tool}\nmin: 1\nweight: 0.5\n---\n`;
}

const planned = new Map();
for (const row of rows) {
  const files = {
    "prompt.md": promptFile(row),
    "graders/outcome.md": `---\ntype: llm\nfocus: last_message\n---\n${await rubricFor(row)}`,
    "graders/skill-fired.md": skillGrader(row),
  };
  const tg = toolGrader(row);
  if (tg) files["graders/expected-tool.md"] = tg;
  planned.set(row.id, files);
}

// Generated case dirs are exactly the ids in the roster; anything else that
// looks like a case dir is stale and gets reported.
const entries = await readdir(here, { withFileTypes: true });
const existing = entries
  .filter((e) => e.isDirectory() && e.name !== "rubrics")
  .map((e) => e.name);

const created = [], updated = [], removed = [];

for (const [id, files] of planned) {
  for (const [rel, content] of Object.entries(files)) {
    const path = join(here, id, rel);
    let before = null;
    try { before = await readFile(path, "utf-8"); } catch {}
    if (before === content) continue;
    (before === null ? created : updated).push(`${id}/${rel}`);
    if (!check) {
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, content);
    }
  }
}

for (const name of existing) {
  if (planned.has(name)) continue;
  removed.push(`${name}/`);
  if (!check) await rm(join(here, name), { recursive: true, force: true });
}

const verb = check ? "would " : "";
for (const p of created) console.log(`  ${verb}create ${p}`);
for (const p of updated) console.log(`  ${verb}update ${p}`);
for (const p of removed) console.log(`  ${verb}remove ${p}`);
const drift = created.length + updated.length + removed.length;
console.log(
  `${check ? "Drift check" : "Built"}: ${planned.size} cases — ` +
  `${created.length} created, ${updated.length} updated, ${removed.length} removed.`,
);
if (check && drift) process.exit(3);
