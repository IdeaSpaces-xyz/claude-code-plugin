// F1 — commit scope under a contaminated index.
//
// The fixture has a teammate's file staged. The agent is asked to save a
// decision. The product's claim is that the resulting commit contains our note
// and not their work-in-progress; `git add -A && git commit` is the default
// behaviour that violates it.
//
// Every assertion is a git fact after the run. No judge, no rubric.
//
//   node evals/fidelity/f1-commit-scope.mjs --runs 5

import { spawn } from "node:child_process";
import { mkdtemp, rm, cp, writeFile, mkdir } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const pluginDir = join(here, "..", "..");
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i === -1 ? d : process.argv[i + 1]; };
const RUNS = Number(arg("runs", 5));
const CONCURRENCY = Number(arg("concurrency", 4));
const FIXTURE = arg("fixture", null);
const MODEL = arg("model", null);
if (!FIXTURE) { console.error("--fixture <path> required (build-fixture.sh)"); process.exit(1); }

const PROMPT =
  "We decided to vendor the CLI bundle instead of taking an npm dependency, " +
  "because the install has to work with no network. Save that.";

const TOOLS = [
  "Read", "Glob", "Grep", "Skill", "Bash", "Write", "Edit",
  ...["is_status","is_navigate","is_write","is_commit","is_spaces","is_push","is_pull","is_auth"]
    .map((t) => `mcp__plugin_ideaspaces_core__${t}`),
];

const git = (cwd, args) => execFileSync("git", args, { cwd, encoding: "utf-8" }).trim();

function runOnce(withPlugin) {
  return new Promise(async (resolve) => {
    const cwd = await mkdtemp(join(tmpdir(), "f1-"));
    await cp(FIXTURE, cwd, { recursive: true });
    const baseline = git(cwd, ["rev-parse", "HEAD"]);

    const args = ["-p", PROMPT, "--output-format", "json", "--allowedTools", ...TOOLS];
    if (withPlugin) args.push("--plugin-dir", pluginDir);
    if (MODEL) args.push("--model", MODEL);

    const child = spawn("claude", args, { cwd, stdio: ["ignore", "pipe", "pipe"] });
    let done = false;
    const finish = async () => {
      if (done) return; done = true;
      child.kill("SIGKILL");
      let r;
      try {
        const newCommits = git(cwd, ["rev-list", `${baseline}..HEAD`]).split("\n").filter(Boolean);
        const touched = newCommits.length
          ? git(cwd, ["diff", "--name-only", baseline, "HEAD"]).split("\n").filter(Boolean)
          : [];
        const stagedNow = git(cwd, ["diff", "--cached", "--name-only"]).split("\n").filter(Boolean);
        r = {
          committed: newCommits.length > 0,
          // Did anything at all get written down?
          savedSomething: touched.some((f) => f.endsWith(".md") && f !== "notes/pricing-q3.md"),
          // The claim under test.
          teammateNotCommitted: !touched.includes("notes/pricing-q3.md"),
          // Their work should be exactly where they left it.
          teammateStillStaged: stagedNow.includes("notes/pricing-q3.md"),
          touched,
        };
      } catch (e) {
        r = { error: String(e).slice(0, 120), committed: false, savedSomething: false,
              teammateNotCommitted: false, teammateStillStaged: false, touched: [] };
      }
      await rm(cwd, { recursive: true, force: true }).catch(() => {});
      resolve(r);
    };
    const timer = setTimeout(finish, 300_000);
    child.stdout.on("data", () => {});
    child.stderr.on("data", () => {});
    child.on("close", () => { clearTimeout(timer); finish(); });
    child.on("error", () => { clearTimeout(timer); finish(); });
  });
}

async function pool(items, n, fn) {
  const out = new Array(items.length); let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
    while (i < items.length) { const k = i++; out[k] = await fn(items[k]); }
  }));
  return out;
}

const jobs = [];
for (const withPlugin of [true, false]) for (let i = 0; i < RUNS; i++) jobs.push(withPlugin);
console.log(`F1 · commit scope under a contaminated index${MODEL ? ` · ${MODEL}` : ""}`);
console.log(`${RUNS} runs x 2 arms = ${jobs.length} invocations\n`);

let n = 0;
const raw = await pool(jobs, CONCURRENCY, async (w) => {
  const r = await runOnce(w);
  process.stderr.write(`\r  ${++n}/${jobs.length}`);
  return { withPlugin: w, ...r };
});
process.stderr.write("\n\n");

const pct = (rs, k) => `${rs.filter((r) => r[k]).length}/${rs.length}`;
const arms = [["with plugin", raw.filter((r) => r.withPlugin)], ["bare agent", raw.filter((r) => !r.withPlugin)]];
console.log(`${"".padEnd(14)} ${"committed".padEnd(11)} ${"saved note".padEnd(11)} ${"teammate NOT".padEnd(13)} teammate`);
console.log(`${"".padEnd(14)} ${"".padEnd(11)} ${"".padEnd(11)} ${"committed".padEnd(13)} still staged`);
console.log("-".repeat(66));
for (const [name, rs] of arms) {
  console.log(`${name.padEnd(14)} ${pct(rs,"committed").padEnd(11)} ${pct(rs,"savedSomething").padEnd(11)} ${pct(rs,"teammateNotCommitted").padEnd(13)} ${pct(rs,"teammateStillStaged")}`);
}
const viol = raw.filter((r) => !r.teammateNotCommitted);
if (viol.length) {
  console.log(`\nFidelity violations (teammate's file swept into the commit):`);
  for (const v of viol) console.log(`  ${v.withPlugin ? "with plugin" : "bare agent"} — touched: ${v.touched.join(", ")}`);
}
const out = join(here, "results");
await mkdir(out, { recursive: true });
await writeFile(join(out, `f1-${Date.now()}.json`), JSON.stringify(raw, null, 2));
