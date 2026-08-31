import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const CLI = join(ROOT, "cli/bundle/ideaspaces.js");

function read(relative: string): string {
  return readFileSync(join(ROOT, relative), "utf8");
}

describe("file-first Map distribution", () => {
  it("ships the consuming CLI and teaches the existing capture boundary", () => {
    const result = spawnSync(process.execPath, [CLI, "conversation", "send", "--help"], {
      encoding: "utf8",
    });
    const help = `${result.stdout}${result.stderr}`;
    const capture = read("skills/is-capture/SKILL.md");

    expect(result.status).toBe(0);
    expect(help).toContain("--map maps/research.md");
    expect(help).toContain("local pi turn over a map-note");
    expect(capture).toContain("structured `map` argument to `is_write`");
    expect(capture).toContain("never resolves, clones, or fetches roots");
    expect(capture).toContain("Omitting `map` on a later safe refinement preserves an existing Map");
  });
});
