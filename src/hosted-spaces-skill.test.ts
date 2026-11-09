import { spawnSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { expect, it } from "vitest";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

it("routes named hosted Maps and Thread placement to the installed CLI workflow", () => {
  expect(read("skills/is-space/SKILL.md")).toContain("[Hosted Spaces through the CLI](hosted-spaces.md)");
  expect(read("skills/is-threads/SKILL.md")).toContain("../is-space/hosted-spaces.md");
  expect(existsSync(join(process.cwd(), "skills/is-space/hosted-spaces.md"))).toBe(true);
  const workflow = read("skills/is-space/hosted-spaces.md");
  for (const verb of ["list --hosted", "open", "new --hosted", "add", "remove", "import", "export"]) {
    expect(workflow).toContain(`is_cli spaces ${verb}`);
  }
  for (const boundary of ["--if-match", "--command-id", "--home map:", "owner-only", "no access", "another copy"]) {
    expect(workflow).toContain(boundary);
  }
  expect(workflow).toContain("not new native MCP or Pi tools");
});

it("the installed CLI actually advertises the documented Space and placement flags", () => {
  const cli = join(process.cwd(), "cli/bundle/ideaspaces.js");
  const help = (command: string) => {
    const result = spawnSync(process.execPath, [cli, command, "--help"], { encoding: "utf8" });
    expect(result.status).toBe(0);
    return result.stdout + result.stderr;
  };
  const spaces = help("spaces");
  for (const verb of ["list", "open", "new", "add", "remove", "import", "export"]) expect(spaces).toContain(verb);
  for (const flag of ["--hosted", "--vault", "--if-match", "--command-id"]) expect(spaces).toContain(flag);
  expect(help("threads")).toContain("--home map:<id>");
});
