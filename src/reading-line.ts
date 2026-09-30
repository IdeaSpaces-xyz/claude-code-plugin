/**
 * The reading rule, said once at session start inside an ideaspace.
 *
 * A Note read through the shell never reaches the conversation Map: the
 * harvest classifies reads by tool, and `cat`, `head` and `sed` are Bash.
 * Claude Code's bypass-mode guidance tells the agent to read with exactly
 * those, so the ideaspace says its own rule where the session will see it.
 * Only what holds today is said: no refusal exists yet, so none is claimed.
 */
export const READING_LINE =
  "Reading: read Notes here with is_look or Read, not cat, head or sed — only those reads reach the conversation Map. Shell reads of code are fine.";
