import { afterEach, describe, expect, it } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";

const root = process.cwd();
const cli = join(root, "cli/bundle/ideaspaces.js");
const server = join(root, "dist/index.js");
let dir: string;
let outside: string | undefined;
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
  if (outside) { rmSync(outside, { recursive: true, force: true }); outside = undefined; }
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
    for (const depth of ["name", "summary", "children"]) {
      const row = JSON.parse(await call("is_threads", { action: "open", path: "test", depth }));
      expect(row.thread.name).toBe("A local test");
    }
    const first = JSON.parse(await call("is_threads", { action: "post", path: "test", message: "Initial decision", name: "One", summary: "Pinned decision", author: "Claude Agent" }));
    const child = JSON.parse(await call("is_threads", { action: "new", path: "child", about: "Child", attached_to: `post:${first.id}` }));
    expect(child.attached_to).toBe(`post:${first.id}`);
    const noteLinked = JSON.parse(await call("is_threads", { action: "new", path: "note-linked", about: "Note linked", attached_to: "note:@home//notes/topic.md" }));
    expect(noteLinked.attached_to).toBe("note:@home//notes/topic.md");
    expect(JSON.parse(await call("is_threads", { action: "open", path: "note-linked", depth: "name" })).thread.parent.status).toBe("none");
    const marked = JSON.parse(await call("is_threads", { action: "post", path: "test", kind: "mark", mark: "claimed", reply_to: [first.id], message: "Claimed", author: "Claude Agent" }));
    expect(marked.mark).toBe("claimed");
    const viewed = JSON.parse(await call("is_threads", { action: "open", path: "test", post: first.id }));
    expect(viewed.child_threads.map((row: { slug: string }) => row.slug)).toEqual(["child"]);
    expect(viewed.posts[0].marks).toMatchObject([{ mark: "claimed", author: "Claude Agent" }]);
    await call("is_threads", { action: "post", path: "test", kind: "correction", supersedes: marked.id, reply_to: [first.id], message: "Retract", author: "Claude Agent" });
    expect(JSON.parse(await call("is_threads", { action: "open", path: "test", post: first.id })).posts[0].marks).toBeUndefined();
    const typo = await client.callTool({ name: "is_threads", arguments: { action: "post", path: "test", kind: "snapshto", message: "Typo", author: "Claude Agent" } });
    expect(typo.isError).toBe(true);
    const custom = JSON.parse(await call("is_threads", { action: "post", path: "test", kind: "custom_signal", confirm_kind: true, message: "Intentional custom kind", author: "Claude Agent" }));
    expect(custom.kind).toBe("custom_signal");
    const blockedWrite = await client.callTool({ name: "is_write", arguments: { path: first.path, content: "No edit" } });
    expect(blockedWrite.isError).toBe(true);
    writeFileSync(join(dir, "_threads", "test", "zz-map.md"), "---\nid: msg_bad_map\nmap: [broken]\n---\nStill readable");
    expect(await call("is_look", { path: join(dir, "_threads", "test", "zz-map.md"), depth: "summary" })).toContain("map: invalid_map_type");
    expect(JSON.parse(await call("is_threads", { action: "open", path: "test", depth: "name" })).thread.warnings).toContain("_threads/test/zz-map.md: map: invalid_map_type");
    writeFileSync(join(dir, "_threads", "test", "zz-unreadable.md"), "---\nkind: closure\n---\nNo id");
    const uncertain = JSON.parse(await call("is_threads", { action: "open", path: "test", depth: "name" }));
    expect(uncertain.thread.closed).toBe("unknown");
    expect(JSON.parse(await call("is_threads", { action: "list" })).local_complete).toBe(false);
    expect(JSON.parse(await call("is_threads", { action: "list" })).threads.find((row: { slug: string }) => row.slug === "test").closed).toBe("unknown");
    await call("is_threads", { action: "post", path: "test", message: "Still writable after unreadable later post", author: "Claude Agent" });
    for (const depth of ["surface", "full"]) {
      expect(JSON.parse(await call("is_threads", { action: "open", path: "test", post: first.id, depth })).thread.name).toBe("A local test");
    }
    expect(readFileSync(first.path, "utf8")).toContain("author: Claude Agent");
    expect(JSON.parse(await call("is_threads", { action: "open", path: "test", depth: "summary" })).thread.name).toBe("A local test");
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
    expect(JSON.parse(await call("is_threads", { action: "open", path: "test", depth: "children" })).thread.closed).toBe(true);
  }, 60_000);

  it("pages beyond 50 by pinned address, opens the fix by id, and starts with a Map", async () => {
    dir = realpathSync(mkdtempSync(join(tmpdir(), "is-claude-thread-page-")));
    outside = realpathSync(mkdtempSync(join(tmpdir(), "is-claude-outside-")));
    run("git", ["init", "-q", "-b", "main"]);
    run("git", ["config", "user.name", "Test Agent"]);
    run("git", ["config", "user.email", "test@example.org"]);
    const rootId = "n_0123456789abcdef01234567";
    mkdirSync(join(dir, "_agent"));
    writeFileSync(join(dir, "_agent/agreement.md"), `---\nname: Fixture\nroot_node_id: ${rootId}\n---\n# Fixture\n`);
    run("git", ["add", "_agent"]); run("git", ["commit", "-qm", "root identity"]);
    const folder = join(dir, "_threads", "engine");
    mkdirSync(join(folder, "_agent"), { recursive: true });
    writeFileSync(join(folder, "README.md"), "# Engine\n");
    writeFileSync(join(folder, "_agent/agreement.md"), "---\nname: Engine\n---\n# Terms\n");
    const fixId = "msg_75cc2f37-e925-48e0-a801-c0ac7920c8be";
    for (let i = 0; i < 58; i++) {
      const id = i === 55 ? fixId : `msg_${String(i).padStart(8, "0")}-fixture`;
      writeFileSync(join(folder, `${String(i).padStart(2, "0")}-post.md`),
        `---\nid: ${id}\nname: ${i === 55 ? "Dev run fixed" : `Post ${i}`}\n---\n${i === 55 ? "The dev-run panic was fixed at a3cf9b2." : `Body ${i}`}\n`);
    }
    run("git", ["add", "_threads"]); run("git", ["commit", "-qm", "pinned Thread snapshot"]);
    const pin = run("git", ["rev-parse", "HEAD"]);
    const map = join(dir, "selection.map.md");
    writeFileSync(map, `---\nname: Selection\nmap:\n  roots:\n    - root_node_id: ${rootId}\n      sha: ${pin}\n  members:\n    - root: 0\n      position: _threads/engine\n      depth: children\n    - root: 0\n      position: _threads/engine/msg_75cc2f37\n      depth: full\n---\nPinned moment\n`);
    client = new Client({ name: "thread-page-e2e", version: "1" });
    await client.connect(new StdioClientTransport({ command: process.execPath, args: [server], cwd: outside,
      env: { ...process.env, HOME: outside, IS_CLI_PATH: cli, CLAUDE_PROJECT_DIR: outside } }));
    const address = `@${rootId}//_threads/engine`;
    const first = await call("is_look", { address, map, at: "pin", depth: "children", limit: 50 });
    expect(first).toContain("showing 50 of 58 (older)");
    const cursor = /next cursor: ([^\n]+)/.exec(first)?.[1];
    expect(cursor).toBe("49-post.md");
    const second = await call("is_look", { address, map, at: "pin", depth: "children", since: cursor, limit: 10 });
    expect(second).toContain("showing 8 of 58 (older)");
    expect(second).toContain("55-post.md");
    const fixed = await call("is_look", { address: `@${rootId}//_threads/engine/msg_75cc2f37`, map, at: "pin", depth: "full" });
    expect(fixed).toContain("The dev-run panic was fixed at a3cf9b2.");
    expect(await call("is_look", { post: "msg_75cc2f37", cwd: dir, depth: "summary" })).toContain("Dev run fixed");
    const child = JSON.parse(await call("is_threads", { action: "new", path: "child", about: "Map on opening", map,
      attached_to: "post:msg_00000000-fixture", cwd: dir }));
    expect(child.slug).toBe("child");
    const opening = readdirSync(join(dir, "_threads", "child")).find((name) => name.endsWith(".md") && name !== "README.md")!;
    const authored = readFileSync(join(dir, "_threads", "child", opening), "utf8");
    expect(authored).toContain("attached_to: post:msg_00000000-fixture");
    expect(authored).toContain("map:\n");
    expect(authored).toContain(`sha: ${pin}`);
  }, 60_000);
});
