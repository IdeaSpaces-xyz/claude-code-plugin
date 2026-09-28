import { afterEach, describe, expect, it } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";

const root = process.cwd();
const cli = join(root, "cli/bundle/ideaspaces.js");
const server = join(root, "dist/index.js");
let dir: string;
let client: Client;
function run(program: string, args: string[]): string {
  const result = spawnSync(program, args, { cwd: dir, encoding: "utf8", env: { ...process.env, HOME: dir } });
  if (result.status !== 0) throw new Error(`${program} ${args.join(" ")}: ${result.stderr}`);
  return result.stdout.trim();
}
async function call(name: string, args: Record<string, unknown>): Promise<string> {
  const result = await client.callTool({ name, arguments: args });
  expect(result.isError, JSON.stringify(result.content)).not.toBe(true);
  return (result.content as Array<{ text: string }>)[0].text;
}

afterEach(async () => {
  await client?.close();
  if (dir) rmSync(dir, { recursive: true, force: true });
});

describe("installed Claude plugin local Threads", () => {
  it("reads three rungs and preserves authored pins while two agents append and close", async () => {
    dir = realpathSync(mkdtempSync(join(tmpdir(), "is-claude-threads-")));
    run("git", ["init", "-q"]);
    run("git", ["config", "user.name", "Test Agent"]);
    run("git", ["config", "user.email", "test@example.org"]);
    mkdirSync(join(dir, "_agent"));
    writeFileSync(join(dir, "_agent/agreement.md"), "---\nname: Agreement — Test\nagreement: agent:repo:n_0935a5df1f883eeb60bcdfbb\n---\n# Test\n");
    run("node", [cli, "--json", "threads", "new", "test", "--about", "A local test"]);
    client = new Client({ name: "threads-e2e", version: "1" });
    await client.connect(new StdioClientTransport({ command: "node", args: [server], cwd: dir,
      env: { PATH: process.env.PATH ?? "", HOME: dir, IS_CLI_PATH: cli, CLAUDE_PROJECT_DIR: dir } }));
    expect(JSON.parse(await call("is_threads", { action: "list" })).threads[0].name).toBe("A local test");
    for (const depth of ["name", "summary", "full"]) {
      const row = JSON.parse(await call("is_threads", { action: "open", path: "test", depth }));
      expect(row.thread.name).toBe("A local test");
    }
    const first = JSON.parse(await call("is_threads", { action: "post", path: "test", message: "Initial decision", name: "One", summary: "Pinned decision", author: "Claude Agent" }));
    expect(readFileSync(first.path, "utf8")).toContain("author: Claude Agent");
    run("git", ["add", "_threads"]);
    run("git", ["commit", "-qm", "pin first post"]);
    const pin = run("git", ["rev-parse", "HEAD"]);
    const position = relative(dir, first.path).replaceAll("\\", "/");
    await call("is_threads", { action: "post", path: "test", message: "Second decision", author: "Pi Agent", reply_to: [first.id] });
    expect(await call("is_threads", { action: "open", path: "test", pin, position, depth: "summary" })).toContain("Pinned decision");
    expect(await call("is_look", { path: first.path, pin, position, depth: "full" })).toContain("Initial decision");
    mkdirSync(join(dir, "nested"));
    expect(await call("is_look", { path: `../${position}`, cwd: join(dir, "nested"), pin, position, depth: "full" })).toContain("Initial decision");
    expect(await call("is_look", { path: first.path, depth: "summary" })).toContain("Pinned decision");
    for (const bad of [{ pin }, { pin, position: "_threads/other/post.md" }, { depth: "children" }, { contract: "agreement" }]) {
      const refused = await client.callTool({ name: "is_look", arguments: { path: first.path, ...bad } });
      expect(refused.isError).toBe(true);
    }
    const closed = JSON.parse(await call("is_threads", { action: "close", path: "test", message: "Resolved", author: "Claude Agent" }));
    expect(readFileSync(closed.path, "utf8")).toContain("kind: closure");
    expect(JSON.parse(await call("is_threads", { action: "open", path: "test", depth: "full" })).thread.closed).toBe(true);
  }, 30_000);
});
