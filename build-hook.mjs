// Bundles the plugin's hooks → dist/*.js with the SDK inlined.
// The plugin ships pre-built; users / Claude Code never run npm install here.

import * as esbuild from "esbuild";

await esbuild.build({
  entryPoints: ["src/awareness-hook.ts", "src/capture-nudge-hook.ts"],
  bundle: true,
  platform: "node",
  target: "node18",
  format: "esm",
  outdir: "dist",
  // The SDK pulls in CJS deps (yaml) that `require("process")`/`require("buffer")`.
  // esbuild's ESM `__require` shim uses a global `require` when one exists, so
  // define it via createRequire — otherwise those dynamic requires throw at
  // runtime ("Dynamic require of process is not supported").
  banner: {
    js: [
      "#!/usr/bin/env node",
      "import { createRequire as __createRequire } from 'node:module';",
      "const require = __createRequire(import.meta.url);",
    ].join("\n"),
  },
  legalComments: "none",
  logLevel: "info",
});
