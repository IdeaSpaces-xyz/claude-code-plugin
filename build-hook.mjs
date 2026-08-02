// Bundles the plugin's hooks → dist/*.js.
// The plugin ships pre-built; users / Claude Code never run npm install here.
//
// The hooks import the protocol directly for local shape reads. Its YAML parser
// includes guarded CommonJS requires, so the ESM bundle needs a Node
// `createRequire` bridge (the same boundary as the MCP server bundle).

import * as esbuild from "esbuild";

await esbuild.build({
  entryPoints: ["src/awareness-hook.ts", "src/capture-nudge-hook.ts"],
  bundle: true,
  platform: "node",
  target: "node18",
  format: "esm",
  outdir: "dist",
  banner: {
    js: [
      "#!/usr/bin/env node",
      'import { createRequire as __isCreateRequire } from "node:module";',
      "const require = __isCreateRequire(import.meta.url);",
    ].join("\n"),
  },
  legalComments: "none",
  logLevel: "info",
});
