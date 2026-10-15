/** Claude prompt and session-end events. The CLI owns all persistent run records. */
import { recordClaudeRun, hasTask, isInsideIdeaspace, extractModelFromTranscriptTail } from "./agent-run.js";
import { readStdin } from "./stdin.js";

async function main(): Promise<void> {
  const raw = await readStdin();
  let input: { session_id?: string; cwd?: string; prompt?: string; transcript_path?: string; hook_event_name?: string };
  try { input = JSON.parse(raw); } catch { return; }
  if (!input || (input.hook_event_name !== "UserPromptSubmit" && input.hook_event_name !== "SessionEnd")) return;
  const sessionId = input.session_id;
  if (typeof sessionId !== "string" || !sessionId) return;
  const cwd = process.env.CLAUDE_PROJECT_DIR?.trim() || input.cwd || process.cwd();
  if (!isInsideIdeaspace(cwd)) return;

  if (input.hook_event_name === "UserPromptSubmit") {
    if (typeof input.prompt === "string" && input.prompt.trim() && !hasTask(sessionId, cwd)) {
      // Only the first prompt supplies the task. CLI derives it from the message.
      recordClaudeRun(sessionId, cwd, ["--message", input.prompt, "--status", "running"]);
    }
  } else {
    const model = extractModelFromTranscriptTail(input.transcript_path);
    recordClaudeRun(sessionId, cwd, ["--status", "completed", ...(model ? ["--model-observed", model] : [])]);
  }
}

main().catch((err: unknown) => {
  process.stderr.write(`run-record-hook: ${err instanceof Error ? err.message : String(err)}\n`);
});
