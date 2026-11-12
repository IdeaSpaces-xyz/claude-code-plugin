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
  it("keeps the staged plugin and vendored source coordinates explicit", () => {
    const pkg = JSON.parse(read("package.json"));
    const plugin = JSON.parse(read(".claude-plugin/plugin.json"));
    const vendor = JSON.parse(read("vendor-lock.json"));

    expect(pkg.version).toBe("0.10.2");
    expect(plugin.version).toBe("0.10.2");
    expect(vendor.cli.commit).toBe("e2f1c100f58525ef8883b4d450abcb37c715dade");
    expect(vendor["mcp-server"].commit).toBe("2b770dbccde4af9c38c3e911adee71a220a751c8");
    expect(vendor.cli.protocolPin).toBe(
      "github:IdeaSpaces-xyz/ideaspace-protocol#916ae9ffb2733295b04b192abc29cf3fe1b736c6",
    );
  });

  it("ships a CLI that reports its version", () => {
    const version = spawnSync(process.execPath, [CLI, "--version"], { encoding: "utf-8" });
    expect(version.status).toBe(0);
    expect(version.stdout.trim()).toBe("0.10.1");
  });

  it("ships the people, teams, and visibility help through the bundled CLI", () => {
    const result = spawnSync(process.execPath, [CLI, "share", "--help"], { encoding: "utf-8" });
    const help = `${result.stdout}${result.stderr}`;

    expect(result.status).toBe(0);
    expect(help).toContain("share <status|log|person|team|list|remove|resend|history|visibility>");
    expect(help).toContain("--grade explore");
    expect(help).toContain("--grade fork");
    expect(help).toContain("--grade collaborate");
    expect(help).toContain("share resend someone@example.com");
    expect(help).toContain("share history @someone off");
    expect(help).toContain("share visibility public");
    expect(help).toContain("share visibility private");
    expect(read("skills/is-share/SKILL.md")).toContain(
      "anyone may View and materialize a local Fork without an account",
    );
    expect(help).not.toContain("share <invite|");
    expect(help).not.toContain("set-access");
  });

  it("routes recipient access through is-share rather than is-push", () => {
    const share = read("skills/is-share/SKILL.md");
    const fork = read("skills/is-fork/SKILL.md");
    const push = read("skills/is-push/SKILL.md");

    expect(share).toContain("share person");
    expect(share).toContain("share team");
    expect(share).toContain("share resend");
    expect(share).toContain("share history");
    expect(share).toContain("share visibility public");
    expect(share).toContain("${CLAUDE_PLUGIN_ROOT}/cli/bundle/ideaspaces.js");
    expect(share).toContain("there is no\nnative `is_share` tool");
    expect(share).toContain("Never ask for internal user, organization, Grant, userset, or repository");
    expect(fork).toContain('"${CLI[@]}" fork "<space-url>" "<destination>"');
    expect(fork).toContain('"${CLI[@]}" update --yes');
    expect(fork).toContain("A public source remains account-free");
    expect(fork).toContain("Publishing is the account boundary;\nFork itself is not");
    expect(push).toContain("Push is not access sharing");
    expect(push).toContain("belong to **is-share**");
  });

  it("speaks the agreed access words and maps each to its CLI grade once", () => {
    const share = read("skills/is-share/SKILL.md");

    expect(share).toContain("Access levels: Viewer (look around), Allow copying (take a copy home),");
    expect(share).toContain("| **Viewer** | `explore` |");
    expect(share).toContain("| **Allow copying** | `fork` |");
    expect(share).toContain("| **Editor** | `collaborate` |");
    expect(share.replace(/\s+/g, " ")).toContain("never offer Explore, Fork or Collaborate as an access level");
    expect(share).not.toMatch(/\*\*(Explore|Fork|Collaborate)\*\*/);
  });

  it("names is-push and is-share as the next steps after publish", () => {
    const publish = read("skills/is-publish/SKILL.md");

    expect(publish).toContain("It's online and still private");
    expect(publish).toContain("**is-push** sends it there");
    expect(publish).toContain("use **is-share**");
    expect(publish).toContain("- **is-push** — send new commits");
    expect(publish).toContain("- **is-share** — let someone in");
  });
});
