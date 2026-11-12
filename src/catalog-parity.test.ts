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
  it("uses the same short session-start wording for matching, drifting and unknown CLI metadata", async () => {
    const root = mkdtempSync(join(tmpdir(), "plugin-surface-line-"));
    const previous = process.env.IS_CLI_PATH;
    const built = "sha256:00eb3df2" + "0".repeat(56);
    const running = "sha256:7a1b2c3d" + "a".repeat(56);
    try {
      mkdirSync(join(root, "cli/bundle"), { recursive: true });
      writeFileSync(join(root, "cli/bundle/agent-tools.json"), JSON.stringify({ digest: built, protocol: { commit: "b".repeat(40) } }));
      writeFileSync(join(root, "vendor-lock.json"), JSON.stringify({ "mcp-server": { version: "0.1.36" } }));
      writeFileSync(join(root, "package.json"), JSON.stringify({ version: "0.10.2" }));
      const fake = join(root, "cli.cjs");
      process.env.IS_CLI_PATH = fake;
      const answer = (version: string, digest: string) => writeFileSync(fake, `console.log(${JSON.stringify(JSON.stringify({cli:{version},digest}))})`);
      answer("0.10.1", built);
      expect(await renderAgentSurfaceLine(root)).toBe("Agent tools: plugin 0.10.2 · MCP 0.1.36 · CLI 0.10.1 · catalog 00eb3df2.");
      answer("0.11.0", running);
      expect(await renderAgentSurfaceLine(root)).toBe("Agent tools: plugin 0.10.2 · MCP 0.1.36 · CLI 0.11.0 · catalog differs (built 00eb3df2, running 7a1b2c3d); tools keep working. Update the plugin to match.");
      writeFileSync(fake, "process.exit(1)");
      expect(await renderAgentSurfaceLine(root)).toBe("Agent tools: plugin 0.10.2 · MCP 0.1.36 · CLI unknown (no answer in 1.2 s) · catalog 00eb3df2.");
      writeFileSync(fake, "process.on('SIGTERM', () => {}); setInterval(() => {}, 1000)");
      let settled = false;
      const pending = renderAgentSurfaceLine(root).then(line => { settled = true; return line; });
      await new Promise(resolve => setTimeout(resolve, 25));
      expect(settled, "the probe must leave the event loop free for other startup work").toBe(false);
      expect(await pending).toContain("CLI unknown (no answer in 1.2 s)");
    } finally {
      if (previous === undefined) delete process.env.IS_CLI_PATH;
      else process.env.IS_CLI_PATH = previous;
      rmSync(root, { recursive: true, force: true });
    }
  });
});
