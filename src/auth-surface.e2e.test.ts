import { execFile } from "node:child_process";
import { once } from "node:events";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { expect, it } from "vitest";

const root = process.cwd();
const cli = join(root, "cli/bundle/ideaspaces.js");
const read = (path: string) => readFileSync(join(root, path), "utf8");

it("teaches session-aware status and server-first sign-out", () => {
  const publish = read("skills/is-publish/SKILL.md");
  expect(publish).toContain("status account --json");
  expect(publish).not.toContain("test -f ~/.ideaspaces/credentials.json");
  expect(publish).toContain("not** signed out");
  expect(publish).toContain("credentials stay for retry");
  expect(read("skills/is-space/SKILL.md")).toContain("Offline/failure keeps credentials for retry");
});

it("ships CLI 0.5.0 and MCP logout retains a failed session before a successful server revoke", async () => {
  const home = mkdtempSync(join(tmpdir(), "plugin-auth-"));
  const file = join(home, ".ideaspaces/credentials.json");
  // Explicit allowlist: never inherit installed account or model credentials.
  const env = { HOME: home, USERPROFILE: home, PATH: process.env.PATH ?? "", IS_CLI_PATH: cli,
    CLAUDE_PROJECT_DIR: home, XDG_CONFIG_HOME: join(home, "config") };
  const client = new Client({ name: "plugin-auth-test", version: "1" });
  let fail = true;
  const requests: Array<{ method: string | undefined; url: string | undefined; token: string | null }> = [];
  const server = createServer(async (req, res) => {
    let body = "";
    for await (const chunk of req) body += chunk;
    requests.push({ method: req.method, url: req.url, token: new URLSearchParams(body).get("token") });
    res.writeHead(fail ? 503 : 200, { "content-type": "application/json" });
    res.end(JSON.stringify(fail ? { detail: "test unavailable" } : { ok: true }));
  });
  try {
    server.listen(0, "127.0.0.1"); await once(server, "listening");
    const port = (server.address() as { port: number }).port;
    mkdirSync(join(home, ".ideaspaces"));
    const saved = JSON.stringify({ api_url: `http://127.0.0.1:${port}`, api_key: "synthetic-access",
      session: { id: "synthetic-session", install_id: "synthetic-install", refresh_token: "synthetic-refresh",
        expires_at: Date.now() + 3600000, refresh_expires_at: Date.now() + 7200000 } });
    writeFileSync(file, saved, { mode: 0o600 });
    const help = await promisify(execFile)(process.execPath, [cli, "login", "--help"], { env, cwd: home });
    expect(`${help.stdout}${help.stderr}`).toContain("Browser sign-in on this machine");
    expect(JSON.parse(read("vendor-lock.json")).cli.commit).toBe("d402284f65b4642046777575ac5aadc0915d85f2");
    await client.connect(new StdioClientTransport({ command: process.execPath, args: [join(root, "dist/index.js")], cwd: home, env }));
    const failed = await client.callTool({ name: "is_auth", arguments: { action: "logout" } });
    expect(failed.isError).toBe(true);
    expect(readFileSync(file, "utf8")).toBe(saved);
    fail = false;
    const success = await client.callTool({ name: "is_auth", arguments: { action: "logout" } });
    expect(success.isError).not.toBe(true);
    expect(existsSync(file)).toBe(false);
    expect(requests).toEqual(Array(2).fill({ method: "POST", url: "/auth/desktop/revoke", token: "synthetic-refresh" }));
    const status = await promisify(execFile)(process.execPath, [cli, "status", "account", "--json"], { env, cwd: home });
    expect(JSON.parse(status.stdout).logged_in).toBe(false);
  } finally {
    await client.close();
    await new Promise<void>(resolve => server.close(() => resolve()));
    rmSync(home, { recursive: true, force: true });
  }
}, 30000);
