import { execFile, execFileSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { afterEach, describe, expect, it } from "vitest";

const run = promisify(execFile);
const CLI = join(process.cwd(), "cli/bundle/ideaspaces.js");
const SOURCE_ROOT = "n_0123456789abcdef01234567";
const SOURCE_HEAD = "a".repeat(40);
const NEXT_SOURCE_HEAD = "b".repeat(40);
const FOUNDATION = "---\nnode_id: n_111111111111111111111111\nname: Foundation\n---\n# Foundation\n";
const README = "---\nnode_id: n_222222222222222222222222\n---\n# Public guide\n";
const ADDED = "---\nnode_id: n_333333333333333333333333\n---\n# Added upstream\n";
const REMOVED = "---\nnode_id: n_444444444444444444444444\n---\n# Removed upstream\n";

let root: string | null = null;
afterEach(() => {
  if (root) rmSync(root, { recursive: true, force: true });
  root = null;
});

function git(cwd: string, ...args: string[]): string {
  return execFileSync("git", ["-C", cwd, ...args], { encoding: "utf-8" }).trim();
}

function baselineBytes(home: string): Buffer {
  const directory = join(home, ".ideaspaces", "fork-baselines");
  return readFileSync(join(directory, readdirSync(directory)[0]));
}

describe("vendored account-free Fork", () => {
  it("materializes and maintains the real vendored CLI without credentials", async () => {
    const authorization: Array<string | undefined> = [];
    let sourceHead = SOURCE_HEAD;
    let foundation = FOUNDATION;
    let readme = README;
    let files = [
      { path: "_agent/foundation.md", content: foundation },
      { path: "README.md", content: readme },
      { path: "removed.md", content: REMOVED },
    ];
    let asset = Buffer.from("payload");
    let publicView = true;
    let publicFork = true;
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
        if (!publicView || !publicFork) {
          response.statusCode = 404;
          response.end(JSON.stringify({ detail: "Space not found" }));
          return;
        }
        response.end(
          JSON.stringify({
            source_head: sourceHead,
            markdown_file_count: files.length,
            markdown_bytes: files.reduce(
              (total, file) => total + Buffer.byteLength(file.content),
              0,
            ),
            files,
            asset_file_count: 1,
            asset_bytes: asset.length,
            assets: [{ path: "_assets/picture.png", content_base64: asset.toString("base64") }],
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

      const forked = await run(
        process.execPath,
        [CLI, "fork", `${apiUrl}/spaces/${SOURCE_ROOT}`, destination, "--json"],
        { env, timeout: 30_000, maxBuffer: 8 * 1024 * 1024 },
      );
      const output = JSON.parse(forked.stdout);

      expect(output).toMatchObject({
        kind: "unpublished_fork",
        source_root_node_id: SOURCE_ROOT,
        source_head: SOURCE_HEAD,
        source_history_copied: false,
        published: false,
      });
      expect(output).not.toHaveProperty("repo_id");
      expect(output).not.toHaveProperty("remote_url");
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

      const localReadme = `${README}Local work stays.\n`;
      writeFileSync(join(destination, "README.md"), localReadme);
      writeFileSync(join(destination, "local.md"), "ordinary local addition\n");
      writeFileSync(join(destination, "progress.local.md"), "private progress\n");
      writeFileSync(join(destination, "bystander.txt"), "staged bystander\n");
      execFileSync("git", ["-C", destination, "add", "bystander.txt"]);
      const stagedBefore = git(destination, "diff", "--cached", "--binary");

      sourceHead = NEXT_SOURCE_HEAD;
      foundation = FOUNDATION.replace("# Foundation", "# Updated foundation");
      readme = README.replace("# Public guide", "# Updated upstream guide");
      files = [
        { path: "_agent/foundation.md", content: foundation },
        { path: "README.md", content: readme },
        { path: "added.md", content: ADDED },
      ];
      asset = Buffer.from([0, 255, 10, 13]);

      const preview = JSON.parse(
        (
          await run(process.execPath, [CLI, "update", "--json"], {
            cwd: destination,
            env,
            timeout: 30_000,
            maxBuffer: 8 * 1024 * 1024,
          })
        ).stdout,
      );
      expect(preview).toMatchObject({
        apply: false,
        changed: true,
        writes: ["_agent/foundation.md", "added.md"],
        asset_writes: ["_assets/picture.png"],
        deletes: ["removed.md"],
        conflicts: [{ path: "README.md", kind: "content" }],
      });

      const applied = JSON.parse(
        (
          await run(process.execPath, [CLI, "update", "--yes", "--json"], {
            cwd: destination,
            env,
            timeout: 30_000,
            maxBuffer: 8 * 1024 * 1024,
          })
        ).stdout,
      );
      expect(applied).toMatchObject({ apply: true, changed: true, source_head: NEXT_SOURCE_HEAD });
      expect(readFileSync(join(destination, "README.md"), "utf-8")).toBe(localReadme);
      expect(readFileSync(join(destination, "added.md"), "utf-8")).toContain("# Added upstream");
      expect(existsSync(join(destination, "removed.md"))).toBe(false);
      expect(readFileSync(join(destination, "local.md"), "utf-8")).toBe(
        "ordinary local addition\n",
      );
      expect(readFileSync(join(destination, "progress.local.md"), "utf-8")).toBe(
        "private progress\n",
      );
      expect(readFileSync(join(destination, "_assets", "picture.png"))).toEqual(asset);
      expect(readFileSync(join(destination, "_agent", "foundation.md"), "utf-8")).toContain(
        `root_node_id: ${output.root_node_id}`,
      );
      expect(git(destination, "diff", "--cached", "--binary")).toBe(stagedBefore);

      const second = JSON.parse(
        (
          await run(process.execPath, [CLI, "update", "--yes", "--json"], {
            cwd: destination,
            env,
            timeout: 30_000,
            maxBuffer: 8 * 1024 * 1024,
          })
        ).stdout,
      );
      expect(second).toMatchObject({ apply: true, changed: false, worktree_changed: false });

      const registryPath = join(home, ".ideaspaces", "spaces.json");
      const registryBefore = readFileSync(registryPath);
      const baselineBefore = baselineBytes(home);
      const statusBefore = git(destination, "status", "--porcelain=v1");
      const foundationBefore = readFileSync(join(destination, "_agent", "foundation.md"));
      for (const revoked of ["public View", "public Fork"]) {
        publicView = revoked !== "public View";
        publicFork = revoked !== "public Fork";
        await expect(
          run(process.execPath, [CLI, "update", "--yes", "--json"], {
            cwd: destination,
            env,
            timeout: 30_000,
            maxBuffer: 8 * 1024 * 1024,
          }),
          revoked,
        ).rejects.toMatchObject({ code: 1 });
        expect(readFileSync(registryPath)).toEqual(registryBefore);
        expect(baselineBytes(home)).toEqual(baselineBefore);
        expect(git(destination, "status", "--porcelain=v1")).toBe(statusBefore);
        expect(readFileSync(join(destination, "_agent", "foundation.md"))).toEqual(
          foundationBefore,
        );
        publicView = true;
        publicFork = true;
      }
      expect(authorization.every((value) => value === undefined)).toBe(true);
    } finally {
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
    }
  }, 40_000);
});
