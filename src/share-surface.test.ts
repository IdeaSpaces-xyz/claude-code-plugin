import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const CLI = join(ROOT, "cli/bundle/ideaspaces.js");

function read(relative: string): string {
  return readFileSync(join(ROOT, relative), "utf-8");
}

describe("recipient-shaped Share distribution", () => {
  it("keeps the plugin release and vendored runtime coordinates explicit", () => {
    const pkg = JSON.parse(read("package.json"));
    const plugin = JSON.parse(read(".claude-plugin/plugin.json"));
    const vendor = JSON.parse(read("vendor-lock.json"));

    expect(pkg.version).toBe("0.3.18");
    expect(plugin.version).toBe("0.3.18");
    expect(vendor.cli.commit).toBe("65a6204d15fa99562af2af45337720a1221764c9");
    expect(vendor["mcp-server"].commit).toBe("f659899a9979b7809907fb2eaa9d837ee4fafeea");
    expect(vendor.cli.protocolPin).toBe(
      "github:IdeaSpaces-xyz/ideaspace-protocol#e9b13e8d79da5fbd4c3cdd535e818ed9781258b2",
    );
  });

  it("ships the people, teams, and visibility help through the bundled CLI", () => {
    const result = spawnSync(process.execPath, [CLI, "share", "--help"], { encoding: "utf-8" });
    const help = `${result.stdout}${result.stderr}`;

    expect(result.status).toBe(0);
    expect(help).toContain("share <person|team|list|remove|visibility>");
    expect(help).toContain("--grade explore");
    expect(help).toContain("--grade fork");
    expect(help).toContain("--grade collaborate");
    expect(help).toContain("share visibility public");
    expect(help).toContain("share visibility private");
    expect(help).not.toContain("share <invite|");
    expect(help).not.toContain("set-access");
  });

  it("routes recipient access through is-share rather than is-push", () => {
    const share = read("skills/is-share/SKILL.md");
    const push = read("skills/is-push/SKILL.md");

    expect(share).toContain("share person");
    expect(share).toContain("share team");
    expect(share).toContain("share visibility public");
    expect(share).toContain("${CLAUDE_PLUGIN_ROOT}/cli/bundle/ideaspaces.js");
    expect(share).toContain("there is no\nnative `is_share` tool");
    expect(share).toContain("Never ask for internal user, organization, Grant, userset, or repository");
    expect(push).toContain("Push is not access sharing");
    expect(push).toContain("belong to **is-share**");
  });
});
