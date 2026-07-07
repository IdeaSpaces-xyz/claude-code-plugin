/**
 * Read a hook's stdin payload (Claude Code sends the hook input as JSON on
 * stdin). Guards the TTY case so a manual run without piped input doesn't hang
 * on an open stream. Shared by both hooks so their behavior can't drift.
 */
export async function readStdin(): Promise<string> {
  if (process.stdin.isTTY) return "";
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString("utf-8");
}
