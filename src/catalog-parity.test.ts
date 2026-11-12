import { describe, expect, it } from "vitest";
import {
  readFileSync,
  mkdtempSync,
  writeFileSync,
  mkdirSync,
  rmSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { renderAgentSurfaceLine } from "./agent-surface-line.js";
const read = (p: string) => JSON.parse(readFileSync(p, "utf8"));
describe("vendored catalog parity", () => {
  it("checks the actual installed MCP and its initialize version", async () => {
    const { checkTools } = await import("../scripts/check-agent-tools.mjs");
    await checkTools();
  });
  it("refuses missing look paging or post kind instead of claiming parity by digest alone", async () => {
    const { buildContracts } = await import("../tooling/generate-tools.mjs");
    const { verifyTools } = await import("../scripts/check-agent-tools.mjs");
    const lock = read("vendor-lock.json"),
      catalog = read("cli/bundle/agent-tools.json");
    const contract = buildContracts(
      catalog,
      read("tooling/agent-tools.exposure.json"),
      read("tooling/agent-tools.host.json"),
      { version: lock["mcp-server"].version },
    );
    const actual = Object.values(contract.tools) as unknown as Array<{
      name: string;
      inputSchema: { properties: Record<string, unknown> };
    }>;
    for (const [name, key] of [
      ["is_look", "limit"],
      ["is_look", "post"],
      ["is_threads", "kind"],
    ]) {
      const broken = structuredClone(actual);
      delete broken.find((t) => t.name === name)!.inputSchema.properties[key];
      expect(() => verifyTools(broken, contract.tools)).toThrow("drift");
    }
  });
  it("reports observed wrapper/CLI/protocol build facts without latest-version claims", () => {
    const root = mkdtempSync(join(tmpdir(), "plugin-surface-line-")),
      previous = process.env.IS_CLI_PATH;
    try {
      mkdirSync(join(root, "cli/bundle"), { recursive: true });
      writeFileSync(
        join(root, "cli/bundle/agent-tools.json"),
        JSON.stringify({
          digest: "sha256:generated",
          protocol: { commit: "a".repeat(40) },
        }),
      );
      writeFileSync(
        join(root, "vendor-lock.json"),
        JSON.stringify({ "mcp-server": { version: "1.2.3" } }),
      );
      writeFileSync(
        join(root, "package.json"),
        JSON.stringify({ version: "4.5.6" }),
      );
      const fake = join(root, "cli.cjs");
      writeFileSync(
        fake,
        'console.log(JSON.stringify({cli:{version:"7.8.9"},digest:"sha256:running"}))',
      );
      process.env.IS_CLI_PATH = fake;
      const line = renderAgentSurfaceLine(root);
      expect(line).toContain("plugin 4.5.6; MCP 1.2.3");
      expect(line).toContain("CLI 7.8.9, sha256:running");
      expect(line).toContain("Catalog drift");
      expect(line).not.toContain("latest");
    } finally {
      if (previous === undefined) delete process.env.IS_CLI_PATH;
      else process.env.IS_CLI_PATH = previous;
      rmSync(root, { recursive: true, force: true });
    }
  });
});
