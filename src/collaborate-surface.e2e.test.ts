import { afterEach, describe, expect, it } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const root = process.cwd();
const cli = join(root, "cli/bundle/ideaspaces.js");
const server = join(root, "dist/index.js");
let workspace: string;
let client: Client;
afterEach(async () => {
  await client?.close();
  if (workspace) rmSync(workspace, { recursive: true, force: true });
});

async function collaborate(args: Record<string, unknown>) {
  const result = await client.callTool({ name: "is_collaborate", arguments: args });
  return { failed: result.isError === true, text: (result.content as Array<{ text: string }>)[0].text };
}

describe.skipIf(process.platform === "win32")("installed Claude plugin fellow launch", () => {
  it("runs an explicit Agreement POV under Claude and Pi; resumes and fails on login", async () => {
    workspace = realpathSync(mkdtempSync(join(tmpdir(), "is-collaborate-plugin-")));
    const pov = join(workspace, "knowledge-repo");
    mkdirSync(join(pov, "_agent"), { recursive: true });
    writeFileSync(join(pov, "_agent/agreement.md"), "---\nname: Knowledge POV\n---\n# Another Agreement\n");
    const bin = join(workspace, "bin"); mkdirSync(bin);
    const claudeScript = join(bin, "fake-claude.cjs");
    const argvLog = join(workspace, "claude-argv.jsonl");
    writeFileSync(claudeScript, `
const fs=require('node:fs'),path=require('node:path'),args=process.argv.slice(2);
fs.appendFileSync(process.env.FAKE_CLAUDE_ARGV,JSON.stringify(args)+'\\n');
const id=args[args.indexOf('--session-id')+1]||args[args.indexOf('--resume')+1];
let prompt='';process.stdin.on('data',d=>prompt+=d);process.stdin.on('end',()=>{
const out=e=>console.log(JSON.stringify(e));out({type:'system',subtype:'init',session_id:id,model:'fake',cwd:process.cwd()});
if(prompt.includes('login_fail')){out({type:'result',subtype:'error_during_execution',is_error:true,errors:['Login required']});return;}
const slug=process.cwd().replace(/[^a-zA-Z0-9]/gu,'-'),file=path.join(process.env.CLAUDE_CONFIG_DIR,'projects',slug,id+'.jsonl');
fs.mkdirSync(path.dirname(file),{recursive:true});
fs.appendFileSync(file,JSON.stringify({type:'user',sessionId:id,message:{role:'user',content:prompt}})+'\\n');
out({type:'stream_event',event:{type:'message_start'}});
out({type:'stream_event',event:{type:'content_block_delta',index:0,delta:{type:'text_delta',text:'claude:'+prompt}}});
out({type:'result',subtype:'success',is_error:false,result:'claude:'+prompt,session_id:id,num_turns:1});
fs.appendFileSync(file,JSON.stringify({type:'assistant',sessionId:id,message:{id:'m'+Date.now(),role:'assistant',content:[{type:'text',text:'claude:'+prompt}]}})+'\\n');
});
`);
    const piScript = join(bin, "fake-pi.cjs");
    const piLog = join(workspace, "pi-argv.jsonl");
    writeFileSync(piScript, `
const fs=require('node:fs'),args=process.argv.slice(2);fs.appendFileSync(process.env.FAKE_PI_ARGV,JSON.stringify(args)+'\\n');
let buf='';process.stdin.on('data',d=>{buf+=String(d);while(buf.includes('\\n')){
const at=buf.indexOf('\\n'),line=buf.slice(0,at);buf=buf.slice(at+1);if(!line)continue;const c=JSON.parse(line);
if(c.type==='get_state')console.log(JSON.stringify({type:'response',command:'get_state',success:true,data:{sessionName:'Existing'}}));
if(c.type==='prompt'){
console.log(JSON.stringify({type:'response',command:'prompt',success:true}));
console.log(JSON.stringify({type:'agent_start'}));console.log(JSON.stringify({type:'turn_start'}));
console.log(JSON.stringify({type:'message_update',assistantMessageEvent:{type:'text_delta',delta:'pi:'+c.message}}));
console.log(JSON.stringify({type:'agent_end'}));
}
}});
`);
    for (const [name, script] of [["claude", claudeScript], ["pi", piScript]]) {
      const wrapper = join(bin, name);
      writeFileSync(wrapper, `#!/bin/sh\nexec "${process.execPath}" "${script}" "$@"\n`);
      chmodSync(wrapper, 0o755);
    }
    client = new Client({ name: "collaborate-e2e", version: "1" });
    await client.connect(new StdioClientTransport({ command: process.execPath, args: [server], cwd: workspace,
      env: { ...process.env, PATH: `${bin}:${process.env.PATH ?? ""}`, HOME: workspace, IS_CLI_PATH: cli,
        CLAUDE_CONFIG_DIR: join(workspace, "claude-config"), FAKE_CLAUDE_ARGV: argvLog,
        FAKE_PI_ARGV: piLog, IDEASPACES_PI_EXTENSIONS: join(workspace, "dummy-ext"), IS_COLLABORATE_DEPTH: "" } }));
    const opened = await collaborate({ action: "open", pov, message: "first", runtime: "claude", model: "sonnet", effort: "high" });
    expect(opened.failed).toBe(false);
    const first = JSON.parse(opened.text);
    expect(first).toMatchObject({ runtime: "claude", answer: "claude:first", read_only: true, permission_mode: "dontAsk" });
    const argv = JSON.parse(readFileSync(argvLog, "utf8").split("\n")[0]) as string[];
    expect(argv).toEqual(expect.arrayContaining(["--tools", "Read,Grep,Glob", "--strict-mcp-config", "--effort", "high"]));
    const second = await collaborate({ action: "say", pov, handle: first.conversation_id, message: "again" });
    expect(JSON.parse(second.text).answer).toBe("claude:again");
    expect(JSON.parse(readFileSync(argvLog, "utf8").trim().split("\n")[1])).toContain("--resume");
    const pi = await collaborate({ action: "open", pov, runtime: "pi", model: "fake/model", thinking: "high", message: "hello" });
    expect(JSON.parse(pi.text)).toMatchObject({ runtime: "pi", answer: "pi:hello" });
    expect(JSON.parse(readFileSync(piLog, "utf8").trim().split("\n")[0])).not.toContain("-a");
    const failed = await collaborate({ action: "open", pov, message: "login_fail" });
    expect(failed.failed).toBe(true);
    expect(failed.text).toContain("Login required");
    const bad = await collaborate({ action: "open", pov, message: "read only", permission_mode: "bypassPermissions" });
    expect(bad.failed).toBe(true);
  }, 30_000);
});
