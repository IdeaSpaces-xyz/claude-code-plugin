// Verify every vendored bundle against vendor-lock.json. Public upstreams are
// rebuilt byte-for-byte; private upstreams rely on their own source/bundle CI and
// are hash-checked here because this repository's token cannot clone across repos.

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

/** The `@ideaspaces/protocol` pin declared by a package.json, from either dep block. */
function protocolPin(path) {
  const pkg = JSON.parse(readFileSync(path, "utf8"));
  return pkg.dependencies?.["@ideaspaces/protocol"] ?? pkg.devDependencies?.["@ideaspaces/protocol"] ?? null;
}

try {
  for (const [name, entry] of Object.entries(lock)) {
    const vendored = join(root, entry.vendoredArtifact);
    const vendoredHash = sha256(vendored);
    if (vendoredHash !== entry.sha256) {
      throw new Error(
        `${name}: ${entry.vendoredArtifact} hash ${vendoredHash} does not match vendor-lock.json ${entry.sha256}`,
      );
    }

    if (!entry.rebuildInCi) {
      console.log(`✓ ${name}: locked hash → ${entry.vendoredArtifact} (upstream rebuild guarded in source repo)`);
      continue;
    }

    const checkout = join(temp, name);
    run("git", ["init", "--quiet", checkout], temp);
    run("git", ["-C", checkout, "remote", "add", "origin", entry.repository], temp);
    run("git", ["-C", checkout, "fetch", "--quiet", "--depth", "1", "origin", entry.commit], temp);
    run("git", ["-C", checkout, "checkout", "--quiet", "--detach", "FETCH_HEAD"], temp);

    // The recorded pin is asserted at vendor time; for repos we clone we can
    // verify it against the commit itself rather than taking the lock's word.
    const cloned = protocolPin(join(checkout, "package.json"));
    if (cloned !== entry.protocolPin) {
      throw new Error(
        `${name}: ${entry.commit.slice(0, 7)} declares protocol ${cloned}, but vendor-lock.json records ${entry.protocolPin}`,
      );
    }

    // Git dependencies need their prepare scripts so declared dist/ exports
    // exist before the connector itself builds.
    run("npm", ["ci", "--no-audit", "--no-fund"], checkout);
    for (const command of entry.commands) shell(command, checkout);

    const builtHash = sha256(join(checkout, entry.sourceArtifact));
    if (builtHash !== entry.sha256) {
      throw new Error(
        `${name}: ${entry.commit} rebuilt ${entry.sourceArtifact} as ${builtHash}; expected ${entry.sha256}`,
      );
    }
    console.log(`✓ ${name}: ${entry.commit.slice(0, 7)} rebuild → ${entry.vendoredArtifact}`);
  }

  // Every input must ship the same protocol. Each bundle inlines its own copy
  // and the plugin's devDependency feeds the hooks and reference/, so without
  // this the versions drift apart silently — no error, no warning, just worse
  // output on whichever surface fell behind. See the preflight in vendor.mjs.
  const pins = { plugin: protocolPin(join(root, "package.json")) };
  for (const [name, entry] of Object.entries(lock)) {
    if (!entry.protocolPin) {
      throw new Error(`${name}: vendor-lock.json records no protocolPin — re-run \`npm run vendor\``);
    }
    pins[name] = entry.protocolPin;
  }

  if (new Set(Object.values(pins)).size !== 1) {
    const rows = Object.entries(pins)
      .map(([n, p]) => `    ${n.padEnd(12)} ${p ?? "(none declared)"}`)
      .join("\n");
    throw new Error(`protocol pin disagreement — inputs ship different protocol versions:\n\n${rows}\n`);
  }
  console.log(`✓ protocol agreement: all ${Object.keys(pins).length} inputs at ${pins.plugin.split("#")[1]?.slice(0, 7)}`);
} finally {
  rmSync(temp, { recursive: true, force: true });
}
