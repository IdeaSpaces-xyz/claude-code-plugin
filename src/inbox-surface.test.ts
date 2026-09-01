import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const CLI = join(ROOT, "cli/bundle/ideaspaces.js");
const CLI_COMMIT = "5e34fed47e9ebd85c201a2ee41537ca7a0e72cab";

function read(relative: string): string {
  return readFileSync(join(ROOT, relative), "utf-8");
}

describe("direct Inbox distribution", () => {
  it("bumps the plugin and records the exact CLI source", () => {
    const pkg = JSON.parse(read("package.json"));
    const plugin = JSON.parse(read(".claude-plugin/plugin.json"));
    const vendor = JSON.parse(read("vendor-lock.json"));

    expect(pkg.version).toBe("0.3.24");
    expect(plugin.version).toBe("0.3.24");
    expect(vendor.cli.commit).toBe(CLI_COMMIT);
  });

  it("ships list, read, send, and reply through the bundled CLI", () => {
    const result = spawnSync(process.execPath, [CLI, "inbox", "--help"], { encoding: "utf-8" });
    const help = `${result.stdout}${result.stderr}`;

    expect(result.status).toBe(0);
    expect(help).toContain("inbox <list|read|send|reply>");
    expect(help).toContain("inbox send @owner --about");
    expect(help).toContain("inbox reply x_example");
  });

  it("teaches the person-accountable CLI boundary to local agents", () => {
    const skill = read("skills/is-inbox/SKILL.md");

    expect(skill).toContain("${CLAUDE_PLUGIN_ROOT}/cli/bundle/ideaspaces.js");
    expect(skill).toContain('"${CLI[@]}" inbox list');
    expect(skill).toContain('"${CLI[@]}" inbox send');
    expect(skill).toContain('"${CLI[@]}" inbox reply');
    expect(skill).toContain("acts as the logged-in person");
    expect(skill).toContain("Never substitute a bare Agent");
    expect(skill).toContain("reuse that exact id only when retrying");
  });
});
