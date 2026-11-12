import { execFile, type ChildProcess } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

export const CATALOG_BUDGET_MS = 1200;
type Runtime = { digest: string; cli: { version: string } };

/** One wall-clock deadline, including a CLI that ignores SIGTERM or holds pipes. */
function observeCli(cli: string): Promise<Runtime | undefined> {
  return new Promise((resolve) => {
    let child: ChildProcess | undefined;
    let settled = false;
    const finish = (runtime?: Runtime) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(runtime);
    };
    const timer = setTimeout(() => {
      child?.kill("SIGKILL");
      child?.stdin?.destroy();
      child?.stdout?.destroy();
      child?.stderr?.destroy();
      finish();
    }, CATALOG_BUDGET_MS);
    try {
      const script = /\.(?:[cm]?js)$/.test(cli);
      child = execFile(
        script ? process.execPath : cli,
        script ? [cli, "capabilities", "--json"] : ["capabilities", "--json"],
        { encoding: "utf8", maxBuffer: 1024 * 1024, killSignal: "SIGKILL", windowsHide: true },
        (error, stdout) => {
          try {
            const data = error ? undefined : JSON.parse(stdout);
            finish(typeof data?.digest === "string" && typeof data?.cli?.version === "string" ? data : undefined);
          } catch { finish(); }
        },
      );
      child.stdin?.end();
    } catch { finish(); }
  });
}

/** Built/installed facts only; called beside other startup work, inside an ideaspace. */
export async function renderAgentSurfaceLine(root: string): Promise<string> {
  try {
    const read = (p: string) => JSON.parse(readFileSync(join(root, p), "utf8"));
    const catalog = read("cli/bundle/agent-tools.json");
    const lock = read("vendor-lock.json");
    const pkg = read("package.json");
    const runtime = await observeCli(process.env.IS_CLI_PATH?.trim() || join(root, "cli/bundle/ideaspaces.js"));
    const short = (digest: string) => digest.replace(/^sha256:/, "").slice(0, 8);
    const catalogText = runtime && runtime.digest !== catalog.digest
      ? `catalog differs (built ${short(catalog.digest)}, running ${short(runtime.digest)}); tools keep working. Update the plugin to match.`
      : `catalog ${short(catalog.digest)}.`;
    return `Agent tools: plugin ${pkg.version} · MCP ${lock["mcp-server"].version} · CLI ${runtime?.cli.version ?? "unknown (no answer in 1.2 s)"} · ${catalogText}`;
  } catch { return ""; }
}
