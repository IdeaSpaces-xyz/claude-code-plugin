import { execFile, execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { afterEach, describe, expect, it } from "vitest";

const run = promisify(execFile);
const CLI = join(process.cwd(), "cli/bundle/ideaspaces.js");
const SOURCE_ROOT = "n_0123456789abcdef01234567";
const SOURCE_HEAD = "a".repeat(40);
const FOUNDATION = "---\nnode_id: n_111111111111111111111111\nname: Foundation\n---\n# Foundation\n";
const README = "---\nnode_id: n_222222222222222222222222\n---\n# Public guide\n";

let root: string | null = null;
afterEach(() => {
  if (root) rmSync(root, { recursive: true, force: true });
  root = null;
});

function git(cwd: string, ...args: string[]): string {
  return execFileSync("git", ["-C", cwd, ...args], { encoding: "utf-8" }).trim();
}

describe("vendored account-free Fork", () => {
  it("materializes the real packaged CLI with no credentials or hosted destination", async () => {
    const authorization: Array<string | undefined> = [];
    const server = createServer((request, response) => {
      authorization.push(request.headers.authorization);
      response.setHeader("content-type", "application/json");
      if (request.url === `/api/v1/spaces/${SOURCE_ROOT}`) {
        response.end(
          JSON.stringify({
            kind: "space",
            node_id: SOURCE_ROOT,
            container_node_id: SOURCE_ROOT,
            name: "Public Guide",
            canonical_url: `/spaces/${SOURCE_ROOT}`,
            copy_enabled: true,
            login_required_to_copy: true,
            summary: null,
            readme_markdown: null,
          }),
        );
        return;
      }
      if (request.url === `/api/v1/spaces/${SOURCE_ROOT}/copy-snapshot`) {
        response.end(
          JSON.stringify({
            source_head: SOURCE_HEAD,
            markdown_file_count: 2,
            markdown_bytes: Buffer.byteLength(FOUNDATION) + Buffer.byteLength(README),
            files: [
              { path: "_agent/foundation.md", content: FOUNDATION },
              { path: "README.md", content: README },
            ],
            asset_file_count: 1,
            asset_bytes: 7,
            assets: [{ path: "_assets/picture.png", content_base64: "cGF5bG9hZA==" }],
          }),
        );
        return;
      }
      response.statusCode = 404;
      response.end(JSON.stringify({ detail: "not found" }));
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));

    try {
      const address = server.address();
      if (!address || typeof address === "string") throw new Error("test server has no TCP port");
      root = mkdtempSync(join(tmpdir(), "claude-public-fork-"));
      const home = join(root, "home");
      const destination = join(root, "guide");
      mkdirSync(home);
      const apiUrl = `http://127.0.0.1:${address.port}`;
      const env: NodeJS.ProcessEnv = { ...process.env, HOME: home, IS_API_URL: apiUrl };
      delete env.IS_API_KEY;

      const result = await run(
        process.execPath,
        [CLI, "fork", `${apiUrl}/spaces/${SOURCE_ROOT}`, destination, "--json"],
        { env, timeout: 30_000, maxBuffer: 8 * 1024 * 1024 },
      );
      const output = JSON.parse(result.stdout);

      expect(output).toMatchObject({
        kind: "unpublished_fork",
        source_root_node_id: SOURCE_ROOT,
        source_head: SOURCE_HEAD,
        source_history_copied: false,
        published: false,
      });
      expect(output).not.toHaveProperty("repo_id");
      expect(output).not.toHaveProperty("remote_url");
      expect(authorization).toEqual([undefined, undefined]);
      expect(git(destination, "symbolic-ref", "--short", "HEAD")).toBe("main");
      expect(git(destination, "rev-list", "--count", "HEAD")).toBe("1");
      expect(git(destination, "status", "--porcelain")).toBe("");
      expect(git(destination, "remote")).toBe("");
      expect(readFileSync(join(destination, "_assets", "picture.png"), "utf-8")).toBe(
        "payload",
      );
      expect(readFileSync(join(destination, "_agent", "foundation.md"), "utf-8")).toContain(
        `root_node_id: ${output.root_node_id}`,
      );
      const registry = JSON.parse(
        readFileSync(join(home, ".ideaspaces", "spaces.json"), "utf-8"),
      );
      const record = Object.values(registry)[0] as Record<string, unknown>;
      expect(record).toMatchObject({
        kind: "unpublished_fork",
        root_node_id: output.root_node_id,
        source_root_node_id: SOURCE_ROOT,
      });
      expect(record).not.toHaveProperty("repo_id");
    } finally {
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
    }
  }, 40_000);
});
