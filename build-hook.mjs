// Bundles the plugin's hooks → dist/*.js.
// The plugin ships pre-built; users / Claude Code never run npm install here.
//
// The hooks are SDK-free (the awareness hook shells the bundled CLI; the
// capture-nudge hook does local `_agent/` and git-ownership walks), so this
// bundle inlines only node built-ins — no createRequire shim for the SDK's CJS
// deps is needed.

import * as esbuild from "esbuild";

await esbuild.build({
  entryPoints: ["src/awareness-hook.ts", "src/capture-nudge-hook.ts"],
  bundle: true,
  platform: "node",
  target: "node18",
  format: "esm",
  outdir: "dist",
  banner: { js: "#!/usr/bin/env node" },
  legalComments: "none",
  logLevel: "info",
});
