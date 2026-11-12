// Check the installed MCP tool contract against the catalog/exposure vendored
// at the same upstream commits. No workspace siblings or terminal login needed.
import assert from "node:assert/strict";
import { readFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { buildContracts } from "../tooling/generate-tools.mjs";
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const read = (p) => JSON.parse(readFileSync(join(root, p), "utf8"));
export function verifyTools(actual, expected) {
  const select = (t) => ({
    name: t.name,
    description: t.description,
    inputSchema: t.inputSchema,
  });
  assert.deepEqual(
    actual.map(select).sort((a, b) => a.name.localeCompare(b.name)),
    Object.values(expected)
      .map(select)
      .sort((a, b) => a.name.localeCompare(b.name)),
    "Vendored MCP/catalog drift: re-vendor the matching merged inputs",
  );
  for (const key of ["limit", "since", "order", "post", "agreement"])
    assert.ok(
      actual.find((t) => t.name === "is_look").inputSchema.properties[key],
      `Missing look.${key}`,
    );
  assert.ok(
    actual.find((t) => t.name === "is_threads").inputSchema.properties.kind,
    "Missing threads.post kind",
  );
}
export async function checkTools() {
  const catalog = read("cli/bundle/agent-tools.json"),
    lock = read("vendor-lock.json");
  const expected = buildContracts(
    catalog,
    read("tooling/agent-tools.exposure.json"),
    read("tooling/agent-tools.host.json"),
    { version: lock["mcp-server"].version },
  );
  const home = mkdtempSync(join(tmpdir(), "plugin-tool-contract-"));
  const client = new Client({ name: "plugin-contract-proof", version: "test" });
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [join(root, "dist/index.js")],
    cwd: home,
    env: {
      PATH: process.env.PATH ?? "",
      HOME: home,
      IS_CLI_PATH: join(root, "cli/bundle/ideaspaces.js"),
      GIT_CONFIG_NOSYSTEM: "1",
    },
  });
  try {
    await client.connect(transport);
    assert.equal(
      client.getServerVersion()?.version,
      lock["mcp-server"].version,
      "MCP initialize must report the built package version",
    );
    assert.ok(
      client.getInstructions()?.includes(`generated catalog ${catalog.digest}`),
      "MCP generated digest must match the vendored CLI catalog",
    );
    verifyTools((await client.listTools()).tools, expected.tools);
    console.log(
      `Tool parity: ${Object.keys(expected.tools).length} tools, ${catalog.digest}; MCP ${client.getServerVersion().version}`,
    );
  } finally {
    await client.close();
    rmSync(home, { recursive: true, force: true });
  }
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
)
  await checkTools();
