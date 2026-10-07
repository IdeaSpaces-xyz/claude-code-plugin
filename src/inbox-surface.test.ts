import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const CLI = join(ROOT, "cli/bundle/ideaspaces.js");
const CLI_COMMIT = "84e12f2ec55ac9f4bc14a6de6b77e54bb61b8e2e";

function read(relative: string): string {
  return readFileSync(join(ROOT, relative), "utf-8");
}

describe("direct Inbox distribution", () => {
  it("bumps the plugin and records the exact CLI source", () => {
    const pkg = JSON.parse(read("package.json"));
    const plugin = JSON.parse(read(".claude-plugin/plugin.json"));
    const vendor = JSON.parse(read("vendor-lock.json"));

    expect(pkg.version).toBe("0.6.5");
    expect(plugin.version).toBe("0.6.5");
    expect(vendor.cli.commit).toBe(CLI_COMMIT);
  });

  it("ships follow, cursor reads, send, and reply through the bundled CLI", () => {
    const result = spawnSync(process.execPath, [CLI, "inbox", "--help"], { encoding: "utf-8" });
    const help = `${result.stdout}${result.stderr}`;

    expect(result.status).toBe(0);
    expect(help).toContain("inbox <list|read|send|reply|add|close|rename|expand>");
    expect(help).toContain("inbox list --new --depth name");
    expect(help).toContain("inbox read x_example --new --depth full --ack");
    expect(help).toContain("inbox send @owner --about");
    expect(help).toContain("inbox reply x_example");

    const follow = spawnSync(process.execPath, [CLI, "follow", "--help"], { encoding: "utf-8" });
    const followHelp = `${follow.stdout}${follow.stderr}`;
    expect(follow.status).toBe(0);
    expect(followHelp).toContain("follow <thread|node|repo> <id> [--ack <position>]");
  });

  it("teaches the person-accountable CLI boundary to local agents", () => {
    const skill = read("skills/is-inbox/SKILL.md");

    expect(skill).toContain("${CLAUDE_PLUGIN_ROOT}/cli/bundle/ideaspaces.js");
    expect(skill).toContain('"${CLI[@]}" inbox list --new --depth name');
    expect(skill).toContain("Use `is_follow`");
    expect(skill).toContain("Only explicit acknowledgement advances");
    expect(skill).toContain('"${CLI[@]}" inbox send');
    expect(skill).toContain('"${CLI[@]}" inbox reply');
    expect(skill).toContain("acts as the logged-in person");
    expect(skill).toContain("Never substitute a bare Agent");
    expect(skill).toContain("reuse that exact id only when retrying");
    expect(read("dist/index.js")).toContain('"is_follow"');
  });
});
