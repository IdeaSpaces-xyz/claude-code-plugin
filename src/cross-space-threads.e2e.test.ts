import { afterEach, describe, expect, it } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";

const plugin = process.cwd();
const cli = join(plugin, "cli/bundle/ideaspaces.js");
const server = join(plugin, "dist/index.js");
const HOME_ID = "n_0123456789abcdef01234567";
const AGENT_ID = "n_ffffffffffffffffffffffff";
let workspace: string;
let client: Client;
function git(cwd: string, ...args: string[]) { return execFileSync("git", args, { cwd, encoding: "utf8" }).trim(); }
function space(path: string, id: string, name: string) {
  mkdirSync(join(path, "_agent"), { recursive: true });
  writeFileSync(join(path, "_agent/agreement.md"), `---\nname: Agreement — ${name}\nroot_node_id: ${id}\n---\n`);
  git(path, "init", "-q"); git(path, "config", "user.name", "Test"); git(path, "config", "user.email", "test@example.test");
  git(path, "add", "_agent/agreement.md"); git(path, "commit", "-qm", "Agreement");
}
function command(cwd: string, ...args: string[]) {
  const result = spawnSync(process.execPath, [cli, "--json", "threads", ...args], { cwd, encoding: "utf8", env: { ...process.env, HOME: workspace } });
  expect(result.status, result.stderr).toBe(0);
  return JSON.parse(result.stdout);
}
async function thread(args: Record<string, unknown>) {
  const result = await client.callTool({ name: "is_threads", arguments: args });
  return { error: result.isError === true, text: (result.content as Array<{ text: string }>)[0].text };
}
afterEach(async () => {
  await client?.close();
  if (workspace) rmSync(workspace, { recursive: true, force: true });
});

describe("vendored Claude plugin cross-Space Threads", () => {
  it("opens an authored pin from an untyped Agreement cwd and branches without overriding its author; refusals leave no post", async () => {
    workspace = realpathSync(mkdtempSync(join(tmpdir(), "plugin-cross-thread-")));
    const home = join(workspace, "home"); const agent = join(workspace, "agent");
    space(home, HOME_ID, "Home"); space(agent, AGENT_ID, "Claude Adapter");
    command(home, "new", "decision", "--about", "Home target");
    const openingFiles = new Set(readdirSync(join(home, "_threads/decision")));
    const seed = command(home, "post", "decision", "--author", "Seed", "--message", "Pinned seed");
    git(home, "add", "_threads/decision"); git(home, "commit", "-qm", "Pin seed");
    const pin = git(home, "rev-parse", "HEAD");
    const position = `_threads/decision/${basename(seed.path)}`;
    const selection = (sha = pin, id = HOME_ID) => ({ roots: [{ root_node_id: id, sha }], members: [{ root: 0, position, depth: "full" }] });
    const map = join(agent, "selection.json"); writeFileSync(map, JSON.stringify({ map: selection() }));
    command(agent, "new", "decision", "--about", "Agent's own Thread");
    const agentFiles = readdirSync(join(agent, "_threads/decision")).filter((name) => name.endsWith(".md"));
    client = new Client({ name: "plugin-selected-test", version: "1" });
    await client.connect(new StdioClientTransport({ command: process.execPath, args: [server], cwd: agent,
      env: { ...process.env, HOME: workspace, IS_CLI_PATH: cli, CLAUDE_PROJECT_DIR: agent } }));
    const target = { path: "decision", map, member: 0, checkout: home };
    const opened = await thread({ action: "open", ...target, depth: "full" });
    expect(opened.error).toBe(false);
    expect(opened.text).toContain("Pinned seed");
    const files = () => readdirSync(join(home, "_threads/decision")).filter((name) => name.endsWith(".md"));
    const before = files().length;
    const refuse = async (args: Record<string, unknown>, reason: RegExp) => {
      const result = await thread(args);
      expect(result.error).toBe(true);
      expect(result.text).toMatch(reason);
      expect(files()).toHaveLength(before);
    };
    await refuse({ action: "open", ...target, checkout: agent }, /mismatch|drift/i);
    await refuse({ action: "open", path: "decision", map, member: 0 }, /registered (local )?checkout|verifiable root/i);
    await refuse({ action: "open", path: "decision", map }, /member/i);
    await refuse({ action: "open", ...target, map: JSON.stringify({ map: selection("a".repeat(40)) }) }, /pin|commit/i);
    await refuse({ action: "post", ...target, message: "No implicit parent" }, /reply_to/i);
    await refuse({ action: "post", ...target, message: "No author override", reply_to: [seed.id], author: "Home" }, /author/i);
    await refuse({ action: "post", ...target, message: "Missing parent", reply_to: ["msg_missing"] }, /reply-to|parent/i);
    const readme = join(home, "_threads/decision/README.md");
    const original = readFileSync(readme, "utf8"); writeFileSync(readme, original + "\nChanged live target\n");
    try { await refuse({ action: "post", ...target, message: "Stale target", reply_to: [seed.id] }, /changed|differs|stale/i); }
    finally { writeFileSync(readme, original); }
    const posted = await thread({ action: "post", ...target, message: "Claude branch from seed", reply_to: [seed.id] });
    expect(posted.error, posted.text).toBe(false);
    const added = files().filter((name) => !openingFiles.has(name) && name !== basename(seed.path));
    expect(added).toHaveLength(1);
    const body = readFileSync(join(home, "_threads/decision", added[0]), "utf8");
    expect(body).toContain("author: Claude Adapter");
    expect(body).toContain(seed.id);
    expect(body).toContain(pin);
    expect(readdirSync(join(agent, "_threads/decision")).filter((name) => name.endsWith(".md"))).toEqual(agentFiles);
    expect(git(agent, "rev-parse", "--show-toplevel")).toBe(agent);
  }, 30_000);
});
