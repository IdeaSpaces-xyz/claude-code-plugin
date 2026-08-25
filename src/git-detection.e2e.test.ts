import { spawnSync } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const CLI = join(process.cwd(), "cli/bundle/ideaspaces.js");

describe("truthful Git detection in the vendored CLI", () => {
  it("creates an unversioned Space when a present git exits nonzero", () => {
    const root = mkdtempSync(join(tmpdir(), "ideaspaces-plugin-broken-git-"));
    const bin = join(root, "bin");
    const target = join(root, "space");
    try {
      // The macOS Command Line Tools shim is discoverable but exits nonzero.
      mkdirSync(bin);
      const git = join(bin, "git");
      writeFileSync(
        git,
        '#!/bin/sh\nprintf "%s\\n" "xcrun: error: active developer path is missing" >&2\nexit 69\n',
      );
      chmodSync(git, 0o755);

      const result = spawnSync(process.execPath, [CLI, "create", "space", "--yes"], {
        cwd: root,
        encoding: "utf-8",
        env: { ...process.env, PATH: bin },
      });
      const output = `${result.stdout}${result.stderr}`;

      expect(result.status).toBe(0);
      expect(existsSync(join(target, "_agent", "foundation.md"))).toBe(true);
      expect(existsSync(join(target, ".git"))).toBe(false);
      expect(output).toContain("git is present but unusable");
      expect(output).toContain("xcode-select --install");
      expect(output).not.toContain("brew install git");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
