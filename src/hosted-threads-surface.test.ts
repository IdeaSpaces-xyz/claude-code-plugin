import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");
const cli = join(root, "cli/bundle/ideaspaces.js");
describe("Threads distribution without the Inbox", () => {
  it("ships /threads operations and no Inbox alias", () => {
    const run = (...args: string[]) => spawnSync(process.execPath, [cli, ...args], { encoding: "utf8" });
    const help = run("threads", "--help");
    expect(help.status).toBe(0);
    const text = help.stdout + help.stderr;
    expect(text).toContain("--recipients");
    expect(text).toContain("--reply-to msg_parent");
    expect(text).toContain("threads ack");
    expect(text).toContain("--unread");
    expect(run("inbox", "list").status).not.toBe(0);
    const bytes = readFileSync(cli, "utf8");
    expect(bytes).not.toContain("/api/v1/inbox");
    expect(bytes).not.toContain("/exchanges/");
    expect(bytes).not.toContain("/subscriptions");
    for (const command of ["follow", "unfollow"]) {
      const refused = run(command, "node", "n_" + "a".repeat(24), "--ack", "42");
      expect(refused.status).toBe(1);
      expect(refused.stderr).toContain("No request was sent");
    }
  });
  it("teaches explicit hosted listing, opening, starting, replying and the person-Unread boundary", () => {
    expect(existsSync(join(root, "skills/is-inbox/SKILL.md"))).toBe(false);
    const skill = read("skills/is-threads/SKILL.md");
    for (const text of ["hosted: true", "unread: true", "recipients:", "reply_to:", "Agent-facing acknowledgement is held", "reach: \"knocked\"", "message_stored", "Old `n_`", "does not grant access"]) expect(skill).toContain(text);
  });
});
it("keeps plugin and package versions in agreement", () => {
  expect(JSON.parse(read("package.json")).version).toBe("0.10.0");
  expect(JSON.parse(read(".claude-plugin/plugin.json")).version).toBe("0.10.0");
});
