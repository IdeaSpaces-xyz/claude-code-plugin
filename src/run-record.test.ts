import { describe, expect, it } from "vitest";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const START = join(ROOT, "dist/awareness-hook.js");
const EVENT = join(ROOT, "dist/run-record-hook.js");
const CLI = join(ROOT, "cli/bundle/ideaspaces.js");

describe("run lifecycle through the bundled CLI", () => {
  it("records start, the first task only, and end (never at Stop)", () => {
    const home = mkdtempSync(join(tmpdir(), "run-home-"));
    const space = mkdtempSync(join(tmpdir(), "run-space-"));
    try {
      mkdirSync(join(space, "_agent"));
      writeFileSync(join(space, "_agent/agreement.md"), "---\nname: Test Agreement\nagreement: agent:repo:n_0123456789abcdef01234567\nsummary: Test\n---\n# Agreement\n");
      execFileSync("git", ["init", "-q", space]);
      execFileSync("git", ["-C", space, "add", "."]);
      execFileSync("git", ["-C", space, "-c", "user.name=Test", "-c", "user.email=test@local", "commit", "-qm", "init"]);
      const env = { ...process.env, HOME: home, IDEASPACES_CONFIG_DIR: join(home, "config"), CLAUDE_PROJECT_DIR: space, PI_SESSION_ID: "", IDEASPACES_PARENT_RUN_ID: "", IDEASPACES_PARENT_ID: "" };
      const id = "claude-test-123";
      function hook(path: string, event: string, extras = {}) {
        const res = spawnSync(process.execPath, [path], { input: JSON.stringify({ session_id: id, cwd: space, hook_event_name: event, ...extras }), env, encoding: "utf8" });
        expect(res.status, res.stderr).toBe(0);
        expect(res.stderr).toBe("");
      }
      function run() {
        const res = spawnSync(process.execPath, [CLI, "agent", "runs", "--agent", space, "--json"], { env, encoding: "utf8" });
        expect(res.status, res.stderr).toBe(0);
        return JSON.parse(res.stdout).runs.find((r: { run_id: string }) => r.run_id === id);
      }
      hook(START, "SessionStart");
      expect(run()).toMatchObject({ status: "running", harness: "claude", conversation_id: id, parent_id: null });
      hook(EVENT, "UserPromptSubmit", { prompt: "First task" });
      expect(run().task).toBe("First task");
      hook(EVENT, "UserPromptSubmit", { prompt: "Private followup" });
      hook(EVENT, "Stop");
      expect(run()).toMatchObject({ status: "running", task: "First task", ended_at: null });
      const transcript = join(home, "transcript.jsonl");
      writeFileSync(transcript, JSON.stringify({ type: "assistant", message: { model: "claude-opus-4-1" } }) + "\n");
      hook(EVENT, "SessionEnd", { transcript_path: transcript });
      expect(run()).toMatchObject({ status: "completed", task: "First task", model_observed: "claude-opus-4-1" });
      expect(run().ended_at).toBeTruthy();
      const lines = readFileSync(join(home, ".ideaspaces", "agent-runs.jsonl"), "utf8").trim().split("\n");
      expect(lines).toHaveLength(3); // only CLI records start, first task and end
    } finally { rmSync(home, { recursive: true, force: true }); rmSync(space, { recursive: true, force: true }); }
  });

  it("does not write outside a Space, on unknown input, or with opt out", () => {
    const home = mkdtempSync(join(tmpdir(), "run-home-"));
    try {
      const env = { ...process.env, HOME: home, IDEASPACES_CONFIG_DIR: join(home, "config"), CLAUDE_PROJECT_DIR: home, IDEASPACES_DISABLE_RUN_RECORDS: "1" };
      for (const input of ["{", JSON.stringify({ session_id: "x", cwd: home, hook_event_name: "UserPromptSubmit", prompt: "hello" }), JSON.stringify({ session_id: "x", hook_event_name: "Stop" })]) {
        const res = spawnSync(process.execPath, [EVENT], { env, input, encoding: "utf8" });
        expect(res.status).toBe(0);
      }
      expect(existsSync(join(home, ".ideaspaces", "agent-runs.jsonl"))).toBe(false);
    } finally { rmSync(home, { recursive: true, force: true }); }
  });
});
