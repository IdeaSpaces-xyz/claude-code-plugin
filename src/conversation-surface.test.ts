import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const CLI = join(process.cwd(), "cli/bundle/ideaspaces.js");

describe("private conversation distribution", () => {
  it("vendors only private conversation operations in help", () => {
    const result = spawnSync(process.execPath, [CLI, "conversation", "--help"], {
      encoding: "utf-8",
    });
    const help = `${result.stdout}${result.stderr}`;

    expect(result.status).toBe(0);
    expect(help).toContain("conversation <new|send|get|cancel>");
    expect(help).toContain("Create and run a private conversation");
    expect(help).not.toMatch(/conversation (members|participants|add|remove)/);
  });

  it.each(["members", "participants", "add", "remove"])(
    "vendors local migration guidance for retired conversation %s",
    (sub) => {
      const result = spawnSync(
        process.execPath,
        [CLI, "conversation", sub, "repo_abc", "c1", "alice", "--json"],
        { encoding: "utf-8" },
      );

      expect(result.status).toBe(1);
      expect(result.stdout).toBe("");
      expect(result.stderr).toContain(`conversation ${sub}`);
      expect(result.stderr).toContain("Conversations are private");
      expect(result.stderr).toContain("ideaspaces share person <email|@handle>");
      expect(result.stderr).toContain("collaborate through Inbox");
    },
  );
});
