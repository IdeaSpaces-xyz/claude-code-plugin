// Rebuild the pinned CLI and MCP bundles from source and compare them byte-for-byte
// with the artifacts committed in this plugin. This is intentionally slower than
// a hash-only check: it proves vendor-lock.json still describes reproducible output.

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const lock = JSON.parse(readFileSync(join(root, "vendor-lock.json"), "utf8"));
const temp = mkdtempSync(join(tmpdir(), "ideaspaces-vendor-check-"));

// Git dependencies in package-lock files may use SSH URLs. All repos involved
// are public; force anonymous HTTPS without mutating the runner's global config.
const env = {
  ...process.env,
  GIT_CONFIG_COUNT: "1",
  GIT_CONFIG_KEY_0: "url.https://github.com/.insteadOf",
  GIT_CONFIG_VALUE_0: "ssh://git@github.com/",
};

function run(command, args, cwd) {
  execFileSync(command, args, { cwd, env, stdio: "inherit" });
}

function shell(command, cwd) {
  run("/bin/sh", ["-lc", command], cwd);
}

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

try {
  for (const [name, entry] of Object.entries(lock)) {
    const checkout = join(temp, name);
    run("git", ["init", "--quiet", checkout], temp);
    run("git", ["-C", checkout, "remote", "add", "origin", entry.repository], temp);
    run("git", ["-C", checkout, "fetch", "--quiet", "--depth", "1", "origin", entry.commit], temp);
    run("git", ["-C", checkout, "checkout", "--quiet", "--detach", "FETCH_HEAD"], temp);

    // Git dependencies (SDK → protocol) need their prepare scripts so their
    // declared dist/ exports exist before the connector itself builds.
    run("npm", ["ci", "--no-audit", "--no-fund"], checkout);
    for (const command of entry.commands) shell(command, checkout);

    const built = join(checkout, entry.sourceArtifact);
    const vendored = join(root, entry.vendoredArtifact);
    const builtHash = sha256(built);
    const vendoredHash = sha256(vendored);

    if (vendoredHash !== entry.sha256) {
      throw new Error(
        `${name}: ${entry.vendoredArtifact} hash ${vendoredHash} does not match vendor-lock.json ${entry.sha256}`,
      );
    }
    if (builtHash !== entry.sha256) {
      throw new Error(
        `${name}: ${entry.commit} rebuilt ${entry.sourceArtifact} as ${builtHash}; expected ${entry.sha256}`,
      );
    }
    console.log(`✓ ${name}: ${entry.commit.slice(0, 7)} → ${entry.vendoredArtifact}`);
  }
} finally {
  rmSync(temp, { recursive: true, force: true });
}
