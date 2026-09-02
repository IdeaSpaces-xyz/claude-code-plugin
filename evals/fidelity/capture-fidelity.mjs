// Capture fidelity — does the plugin path produce a materially better repo
// state than the agent improvising?
//
// One run, five assertions, all of them git or filesystem facts afterwards.
// No judge, no rubric, no gated tooling. These are the properties the product
// claims, as opposed to correctness, which Arize's eval suggests we do not win.
//
//   F1 scope       the commit holds our note and not the other staged work
//   F3 note shape  the note carries Layer 1 frontmatter (name, summary)
//   F4 attribution the commit carries Conversation / Co-authored-by trailers
//   F5 collateral  no pre-existing tracked file was modified
//
//   node evals/fidelity/capture-fidelity.mjs --runs 5 --fixture <path>

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
const OTHER = "notes/pricing-q3.md";        // the other person's staged work
const PREEXISTING = ["notes/billing.md"];  // committed before the run
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
  // Setup failures resolve as a failed job rather than hanging the pool slot
  // and crashing the run on an unhandled rejection (review catch on #90).
  return new Promise((resolve) => {
    (async () => {
    const cwd = await mkdtemp(join(tmpdir(), "f1-"));
    await cp(FIXTURE, cwd, { recursive: true });
    const baseline = git(cwd, ["rev-parse", "HEAD"]);

    const args = ["-p", PROMPT, "--output-format", "json", "--allowedTools", ...TOOLS];
    if (withPlugin) {
      args.push("--plugin-dir", pluginDir);
    } else {
      // --plugin-dir ADDS a plugin; it does not remove the marketplace-installed
      // one. Without this the "bare" arm still had ideaspaces loaded, and its
      // commits carried is_commit's Conversation: trailer — which is how the
      // confound was caught. Disabling it by settings is what makes it a baseline.
      args.push("--settings", JSON.stringify({ enabledPlugins: { "ideaspaces@ideaspaces-xyz": false } }));
    }
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
        const notes = touched.filter((f) => f.endsWith(".md") && f !== OTHER);
        // F3 — Layer 1 frontmatter on whatever note was created.
        let noteShaped = false;
        for (const f of notes) {
          try {
            const body = git(cwd, ["show", `HEAD:${f}`]);
            if (/^---/.test(body) && /^name:\s*\S/m.test(body) && /^summary:\s*\S/m.test(body)) noteShaped = true;
          } catch {}
        }
        // F4 — attribution. is_commit stamps Conversation + Co-authored-by.
        const msg = newCommits.length ? git(cwd, ["log", "-1", "--format=%(trailers)"]) : "";
        // F5 — the fixture's own committed note must be untouched.
        const collateral = touched.filter((f) => PREEXISTING.includes(f));
        r = {
          committed: newCommits.length > 0,
          savedSomething: notes.length > 0,
          scopeHeld: !touched.includes(OTHER),
          otherStillStaged: stagedNow.includes(OTHER),
          noteShaped,
          attributed: /^Conversation:/m.test(msg),   // plugin-only; Co-authored-by is stock Claude Code
          noCollateral: collateral.length === 0,
          touched,
        };
      } catch (e) {
        r = { error: String(e).slice(0, 120), committed: false, savedSomething: false,
              teammateNotCommitted: false, teammateStillStaged: false, touched: [] };
      }
      await rm(cwd, { recursive: true, force: true }).catch(() => {});
      resolve({ ...r, seconds: Math.round((Date.now() - started) / 1000), timedOut });
    };
    const started = Date.now();
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; finish(); }, 300_000);
    child.stdout.on("data", () => {});
    child.stderr.on("data", () => {});
    child.on("close", () => { clearTimeout(timer); finish(); });
    child.on("error", () => { clearTimeout(timer); finish(); });
    })().catch((e) => resolve({ pass: false, facts: { error: String(e).slice(0, 120) }, seconds: 0, timedOut: false }));
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
console.log(`Capture fidelity · contaminated index${MODEL ? ` · ${MODEL}` : ""}`);
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
const COLS = [
  ["committed", "committed"], ["saved note", "savedSomething"],
  ["F1 scope", "scopeHeld"], ["F3 shape", "noteShaped"],
  ["F4 attrib", "attributed"], ["F5 clean", "noCollateral"],
];
console.log(`${"".padEnd(13)}${COLS.map(([h]) => h.padEnd(12)).join("")}`);
console.log("-".repeat(13 + COLS.length * 12));
for (const [name, rs] of arms) {
  console.log(`${name.padEnd(13)}${COLS.map(([, k]) => pct(rs, k).padEnd(12)).join("")}`);
}
const viol = raw.filter((r) => r.committed && !r.scopeHeld);
if (viol.length) {
  console.log(`\nScope violations (the other person's file swept in):`);
  for (const v of viol) console.log(`  ${v.withPlugin ? "with plugin" : "bare agent"} — touched: ${v.touched.join(", ")}`);
}
const out = join(here, "results");
await mkdir(out, { recursive: true });
await writeFile(join(out, `fidelity-${Date.now()}.json`), JSON.stringify(raw, null, 2));
