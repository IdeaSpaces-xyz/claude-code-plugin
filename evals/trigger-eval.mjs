// Trigger eval — does an intention in a person's words reach the right skill?
//
// Runs each prompt in intentions.csv through `claude -p`, watches the stream
// for the first Skill invocation, and reports which skill fired at what rate.
// No gated tooling: this is the plain CLI.
//
//   node evals/trigger-eval.mjs                    # both arms, all cases
//   node evals/trigger-eval.mjs --runs 5
//   node evals/trigger-eval.mjs --case 'implicit-*'
//   node evals/trigger-eval.mjs --arm with         # skip the baseline
//
// Each run gets a throwaway cwd and a read-only tool grant, and is killed the
// moment the decision is visible — the skill's own allowed-tools would
// otherwise let a fired skill write before its answer came back.

import { spawn } from "node:child_process";
import { readFile, writeFile, mkdtemp, rm, cp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const pluginDir = dirname(here);

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? fallback : process.argv[i + 1];
}
const RUNS = Number(arg("runs", 3));
const CONCURRENCY = Number(arg("concurrency", 4));
const CASE_GLOB = arg("case", "*");
const ARM = arg("arm", "both");
const JOB = arg("job", null);
const MODEL = arg("model", null);
const SPACE = arg("space", null); // seeded ideaspace copied into each run's cwd
const PLUGIN = arg("plugin", null); // override the plugin dir (e.g. a tools-only copy)

// The full plugin surface. Withholding the write tools made the Pi-shaped route
// — reach the intention by calling is_write directly, no skill in between —
// impossible, and then scored its absence as a failure. Runs happen in a
// throwaway copy of a space and are killed the moment the route is visible.
const IS_TOOLS = [
  "is_status", "is_navigate", "is_spaces", "is_write", "is_commit",
  "is_push", "is_pull", "is_auth", "is_clone",
].map((t) => `mcp__plugin_ideaspaces_core__${t}`);
const ALLOWED = ["Read", "Glob", "Grep", "Skill", "Bash", "Write", "Edit", ...IS_TOOLS];

function parseCsv(text) {
  const rows = [];
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const cells = []; let cur = "", quoted = false;
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
  return body.map((c) => Object.fromEntries(header.map((h, i) => [h, c[i] ?? ""])));
}

const globToRe = (g) => new RegExp("^" + g.split("*").map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join(".*") + "$");

// One run. Resolves { skill, tools } — skill is the first Skill invocation's
// target, or null if the turn finished without one.
function runOnce(prompt, withPlugin) {
  return new Promise(async (resolve) => {
    const cwd = await mkdtemp(join(tmpdir(), "is-eval-"));
    if (SPACE) await cp(SPACE, cwd, { recursive: true });
    const args = [
      "-p", prompt,
      "--output-format", "stream-json", "--verbose", "--include-partial-messages",
      "--allowedTools", ...ALLOWED,
      // --plugin-dir adds a plugin, it does not replace the marketplace install —
      // the same confound the fidelity probe hit. Every arm disables the installed
      // copy so the only ideaspaces surface is the one this run declares.
      "--settings", JSON.stringify({ enabledPlugins: { "ideaspaces@ideaspaces-xyz": false } }),
    ];
    if (withPlugin) args.push("--plugin-dir", PLUGIN ?? pluginDir);
    if (MODEL) args.push("--model", MODEL);

    const child = spawn("claude", args, { cwd, stdio: ["ignore", "pipe", "ignore"] });
    const tools = new Set();
    let skill = null, directTool = null, buf = "", done = false;

    const finish = () => {
      if (done) return;
      done = true;
      child.kill("SIGKILL");
      rm(cwd, { recursive: true, force: true }).catch(() => {});
      resolve({ skill, directTool, tools: [...tools] });
    };

    // Belt and braces: a run that neither fires nor finishes is a failed run,
    // not a hung suite.
    const timer = setTimeout(finish, 180_000);

    child.stdout.on("data", (chunk) => {
      buf += chunk;
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.trim()) continue;
        let ev; try { ev = JSON.parse(line); } catch { continue; }

        // Complete tool_use blocks on assistant messages.
        for (const block of ev?.message?.content ?? []) {
          if (block?.type !== "tool_use") continue;
          tools.add(block.name);
          if (block.name === "Skill" && !skill) {
            skill = block.input?.skill ?? block.input?.name ?? block.input?.command ?? "(unnamed)";
          }
          // Reaching an is_* tool with no skill in between answers the
          // intention. That is a route, not a miss — record it as its own.
          if (!skill && !directTool && block.name?.startsWith("mcp__plugin_ideaspaces_core__")) {
            directTool = block.name.replace("mcp__plugin_ideaspaces_core__", "");
          }
        }
        // Early signal from partials — cheaper and cuts the run sooner.
        if (ev?.event?.type === "content_block_start" && ev.event.content_block?.type === "tool_use") {
          tools.add(ev.event.content_block.name);
        }
        if (!skill && ev?.event?.type === "content_block_delta" && ev.event.delta?.partial_json) {
          const m = /"(?:skill|name|command)"\s*:\s*"([^"]+)"/.exec(ev.event.delta.partial_json);
          if (m && tools.has("Skill")) skill = m[1];
        }
        if (skill || directTool) { clearTimeout(timer); return finish(); }
        if (ev?.type === "result") { clearTimeout(timer); return finish(); }
      }
    });
    child.on("close", () => { clearTimeout(timer); finish(); });
    child.on("error", () => { clearTimeout(timer); finish(); });
  });
}

async function pool(items, n, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
    while (i < items.length) { const k = i++; out[k] = await fn(items[k], k); }
  }));
  return out;
}

const norm = (s) => (s ?? "").replace(/^ideaspaces:/, "");

// pass / fail / gap. A row whose expected_skill is "(none today)" has no right
// answer to reach yet — scoring it as a failure would bury it in the same
// bucket as a description that simply needs better words.
function verdict(row, fired, direct) {
  const hit = fired.filter(Boolean).length;
  const rate = fired.length ? hit / fired.length : 0;
  const viaTool = direct.filter(Boolean).length / Math.max(direct.length, 1);
  const toolNames = [...new Set(direct.filter(Boolean))].join(", ");
  if (row.expected_skill === "(none today)") {
    if (viaTool >= 0.5) return { state: "tool", rate: viaTool, note: `no skill, served by ${toolNames}` };
    return { state: "gap", rate, note: "no skill exists for this intention" };
  }
  if (row.should_trigger !== "TRUE") {
    return { state: rate === 0 ? "pass" : "fail", rate, note: rate ? "fired when it should not" : "" };
  }
  const want = norm(row.expected_skill);
  const right = fired.filter((f) => norm(f) === want).length / fired.length;
  if (right >= 0.5) return { state: "pass", rate: right, note: "" };
  // The right skill firing on some runs is a marginal match, not a wrong one.
  // Collapsing the two hides the cheapest fixes: a description that already
  // half-works needs different work from one that never fires at all.
  if (right > 0) return { state: "flaky", rate: right, note: `right skill, ${Math.round(right * fired.length)}/${fired.length} runs` };
  if (viaTool >= 0.5) return { state: "tool", rate: viaTool, note: `skipped the skill, used ${toolNames}` };
  const others = [...new Set(fired.filter(Boolean).map(norm))];
  if (others.length) return { state: "fail", rate: 0, note: `wrong skill: ${others.join(", ")}` };
  return { state: "fail", rate: 0, note: "nothing fired" };
}

const rows = parseCsv(await readFile(join(here, "intentions.csv"), "utf-8"))
  .filter((r) => globToRe(CASE_GLOB).test(r.id))
  .filter((r) => !JOB || r.job === JOB);
const arms = ARM === "both" ? [true, false] : [ARM === "with"];

console.log(`${rows.length} intentions x ${RUNS} runs x ${arms.length} arm(s) = ${rows.length * RUNS * arms.length} invocations\n`);

const jobs = [];
for (const row of rows) for (const withPlugin of arms) for (let r = 0; r < RUNS; r++) jobs.push({ row, withPlugin, r });

let finished = 0;
const raw = await pool(jobs, CONCURRENCY, async (j) => {
  const res = await runOnce(j.row.prompt, j.withPlugin);
  process.stderr.write(`\r  ${++finished}/${jobs.length}`);
  return { ...j, ...res };
});
process.stderr.write("\n\n");

const results = rows.map((row) => {
  const withRuns = raw.filter((x) => x.row.id === row.id && x.withPlugin);
  const baseRuns = raw.filter((x) => x.row.id === row.id && !x.withPlugin);
  const v = verdict(row, withRuns.map((x) => x.skill), withRuns.map((x) => x.directTool));
  return {
    id: row.id, job: row.job, type: row.type,
    expected_skill: row.expected_skill || null,
    fired: [...new Set(withRuns.map((x) => norm(x.skill)).filter(Boolean))],
    baseline_tools: [...new Set(baseRuns.flatMap((x) => x.tools))],
    tools: [...new Set(withRuns.flatMap((x) => x.tools))],
    expected_tool_seen: row.expected_tool
      ? withRuns.some((x) => x.tools.includes(row.expected_tool))
      : null,
    ...v,
  };
});

const mark = { pass: "PASS ", fail: "FAIL ", flaky: "FLAKY", tool: "TOOL ", gap: "GAP  " };
const pad = (s, n) => String(s).padEnd(n).slice(0, n);
console.log(`${pad("case", 34)} ${pad("expected", 12)} ${pad("fired", 22)} result`);
console.log("-".repeat(84));
for (const r of results) {
  console.log(
    `${pad(r.id, 34)} ${pad(norm(r.expected_skill) || "-", 12)} ${pad(r.fired.join(",") || "-", 22)} ` +
    `${mark[r.state]} ${r.note}`,
  );
}
const tally = results.reduce((a, r) => ({ ...a, [r.state]: (a[r.state] ?? 0) + 1 }), {});
console.log(`\n${tally.pass ?? 0} pass · ${tally.flaky ?? 0} flaky · ${tally.tool ?? 0} via tool, no skill · ${tally.fail ?? 0} fail · ${tally.gap ?? 0} gap`);

const out = join(here, "results", `${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
await writeFile(out, JSON.stringify({ runs: RUNS, arms: ARM, results }, null, 2)).catch(async () => {
  const { mkdir } = await import("node:fs/promises");
  await mkdir(join(here, "results"), { recursive: true });
  await writeFile(out, JSON.stringify({ runs: RUNS, arms: ARM, results }, null, 2));
});
console.log(`\n${out}`);
