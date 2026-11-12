import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
/** Built/installed facts only; never latest-online claims or terminal sign-in. */
export function renderAgentSurfaceLine(root: string): string {
  try {
    const read = (p: string) => JSON.parse(readFileSync(join(root, p), "utf8"));
    const catalog = read("cli/bundle/agent-tools.json"),
      lock = read("vendor-lock.json"),
      pkg = read("package.json");
    const cli =
      process.env.IS_CLI_PATH?.trim() || join(root, "cli/bundle/ideaspaces.js");
    const script = /\.(?:[cm]?js)$/.test(cli);
    const result = spawnSync(
      script ? process.execPath : cli,
      script ? [cli, "capabilities", "--json"] : ["capabilities", "--json"],
      {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
        timeout: 1500,
        windowsHide: true,
      },
    );
    let runtime: { digest?: string; cli?: { version?: string } } = {};
    try {
      if (result.status === 0) runtime = JSON.parse(result.stdout);
    } catch {
      /* unavailable is unknown */
    }
    return `Agent tools: plugin ${pkg.version}; MCP ${lock["mcp-server"].version}; generated ${catalog.digest}; CLI ${runtime.cli?.version ?? "unknown"}, ${runtime.digest ?? "unknown"}; protocol ${catalog.protocol.commit}.${runtime.digest && runtime.digest !== catalog.digest ? " Catalog drift: MCP initialization names changed exposed entries; tools keep running." : ""}`;
  } catch {
    return "";
  }
}
