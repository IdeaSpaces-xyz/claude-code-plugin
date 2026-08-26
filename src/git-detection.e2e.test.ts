import { spawnSync } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const CLI = join(process.cwd(), "cli/bundle/ideaspaces.js");

describe("truthful Git detection in the vendored CLI", () => {
  it("doctor reports the nonzero Git shim as unusable with stable JSON", () => {
    const root = mkdtempSync(join(tmpdir(), "ideaspaces-plugin-doctor-broken-git-"));
    const bin = join(root, "bin");
    try {
      mkdirSync(bin);
      symlinkSync(process.execPath, join(bin, "node"));
      const git = join(bin, "git");
      writeFileSync(
        git,
        '#!/bin/sh\nprintf "%s\\n" "xcrun: error: active developer path is missing" >&2\nexit 69\n',
      );
      chmodSync(git, 0o755);
      const env: NodeJS.ProcessEnv = { ...process.env, PATH: bin, HOME: root };
      delete env.IS_API_KEY;

      const result = spawnSync(process.execPath, [CLI, "doctor", "--json"], {
        encoding: "utf-8",
        env,
      });
      const report = JSON.parse(result.stdout);

      expect(result.status).toBe(1);
      expect(report.schema_version).toBe(1);
      expect(report.ok).toBe(false);
      expect(report.checks.node.state).toBe("usable");
      expect(report.checks.git).toMatchObject({
        state: "unusable",
        detail: "xcrun: error: active developer path is missing",
        exit_code: 69,
      });
      expect(report.checks.git.fix).toContain(
        process.platform === "darwin" ? "xcode-select --install" : "Repair or reinstall Git",
      );
      expect(report.checks.remote_auth.state).toBe("not_configured");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

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
