import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const CLI = join(process.cwd(), "cli/bundle/ideaspaces.js");

function run(cwd: string, args: string[]) {
  return spawnSync(process.execPath, [CLI, ...args], {
    cwd,
    encoding: "utf-8",
    env: {
      ...process.env,
      GIT_AUTHOR_NAME: "Test",
      GIT_AUTHOR_EMAIL: "test@example.com",
      GIT_COMMITTER_NAME: "Test",
      GIT_COMMITTER_EMAIL: "test@example.com",
    },
  });
}

describe("portable root identity in the vendored CLI", () => {
  it("mints before login and reports a staged identity race offline", () => {
    const root = mkdtempSync(join(tmpdir(), "claude-plugin-root-identity-"));
    try {
      const created = run(root, ["create", "space", "--yes", "--json"]);
      expect(created.status).toBe(0);
      const result = JSON.parse(created.stdout);
      expect(result.root_node_id).toMatch(/^n_[0-9a-f]{24}$/);
      expect(result.identity_state).toBe("local_only");

      const space = join(root, "space");
      const foundationPath = join(space, "_agent", "foundation.md");
      const original = readFileSync(foundationPath, "utf-8");
      expect(original).toContain(`root_node_id: ${result.root_node_id}`);
      const clean = run(space, ["status", "--json"]);
      expect(clean.status).toBe(0);
      expect(JSON.parse(clean.stdout).root_identity).toMatchObject({
        state: "local_only",
        root_node_id: result.root_node_id,
        declaration: { dirty: false },
      });

      const replacement = "n_aaaaaaaaaaaaaaaaaaaaaaaa";
      writeFileSync(
        foundationPath,
        original.replace(`root_node_id: ${result.root_node_id}`, `root_node_id: ${replacement}`),
      );
      spawnSync("git", ["-C", space, "add", "_agent/foundation.md"]);
      writeFileSync(foundationPath, original);

      const raced = run(space, ["status", "--json"]);
      expect(raced.status).toBe(0);
      expect(JSON.parse(raced.stdout).root_identity).toMatchObject({
        state: "local_only",
        root_node_id: result.root_node_id,
        declaration: {
          head: result.root_node_id,
          index: replacement,
          worktree: result.root_node_id,
          dirty: true,
        },
      });
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
