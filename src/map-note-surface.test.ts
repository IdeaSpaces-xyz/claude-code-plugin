import { spawnSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseMap } from "@ideaspaces/protocol";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const CLI = join(ROOT, "cli/bundle/ideaspaces.js");

function read(relative: string): string {
  return readFileSync(join(ROOT, relative), "utf8");
}

function git(repo: string, args: string[]): string {
  const result = spawnSync("git", args, { cwd: repo, encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr || `git ${args.join(" ")} failed`);
  return result.stdout.trim();
}

describe("file-first Map distribution", () => {
  it("ships the consuming CLI and teaches the existing capture boundary", () => {
    const launch = spawnSync(process.execPath, [CLI, "conversation", "send", "--help"], {
      encoding: "utf8",
    });
    const map = spawnSync(process.execPath, [CLI, "map", "--help"], { encoding: "utf8" });
    const launchHelp = `${launch.stdout}${launch.stderr}`;
    const mapHelp = `${map.stdout}${map.stderr}`;
    const capture = read("skills/is-capture/SKILL.md");

    expect(launch.status).toBe(0);
    expect(launchHelp).toContain("--map maps/research.md");
    expect(launchHelp).toContain("local pi turn over a map-note");
    expect(map.status).toBe(0);
    expect(mapHelp).toContain("map [<repo>] [--depth <1..4|full>]");
    expect(capture).toContain("structured `map` argument to `is_write`");
    expect(capture).toContain("never resolves, clones, or fetches roots");
    expect(capture).toContain("Omitting `map` on a later safe refinement preserves an existing Map");
    expect(capture).toContain("map <repo> --depth full --json");
    expect(capture).toContain("working-tree observation, not an automatic capture");
  });

  it("runs the vendored full-depth Map over a plain local repository", () => {
    const repo = mkdtempSync(join(tmpdir(), "is-plugin-derived-map-"));
    try {
      git(repo, ["init", "-q", "-b", "main"]);
      git(repo, ["config", "user.email", "map@example.com"]);
      git(repo, ["config", "user.name", "Map Test"]);
      git(repo, ["remote", "add", "origin", "https://GitHub.com/Acme/Research.git"]);
      const deep = join(repo, "one", "two", "three", "four", "five");
      mkdirSync(deep, { recursive: true });
      writeFileSync(
        join(deep, "finding.md"),
        "---\nname: Finding\nsummary: Deep finding.\n---\n# Finding\n",
      );
      git(repo, ["add", "."]);
      git(repo, ["commit", "-q", "-m", "seed"]);

      const result = spawnSync(
        process.execPath,
        [CLI, "map", repo, "--depth", "full", "--json"],
        { cwd: repo, encoding: "utf8" },
      );

      expect(result.status, result.stderr).toBe(0);
      const output = JSON.parse(result.stdout);
      expect(output).toMatchObject({
        kind: "derived-map",
        depth: "full",
        complete: true,
        portable: true,
        dirty: false,
      });
      expect(parseMap(output.map).status).toBe("valid");
      expect(output.map.members).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            position: "one/two/three/four/five/finding.md",
            depth: "summary",
          }),
        ]),
      );
    } finally {
      rmSync(repo, { recursive: true, force: true });
    }
  });
});
