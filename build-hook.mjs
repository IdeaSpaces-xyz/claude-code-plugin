// Bundles src/awareness-hook.ts → dist/awareness-hook.js with the SDK inlined.
// The plugin ships pre-built; users / Claude Code never run npm install here.

import * as esbuild from "esbuild";

await esbuild.build({
  entryPoints: ["src/awareness-hook.ts"],
  bundle: true,
  platform: "node",
  target: "node18",
  format: "esm",
  outfile: "dist/awareness-hook.js",
  banner: { js: "#!/usr/bin/env node" },
  legalComments: "none",
  logLevel: "info",
});
