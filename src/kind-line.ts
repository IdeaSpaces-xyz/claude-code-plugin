/**
 * The plugin as a listener: which Agreement conventions it recognises, and
 * the one line it adds to SessionStart when a Space declares one.
 *
 * The protocol transports a root Agreement's `agreement:` reference verbatim
 * and owns no ontology of places; each habitat chooses what it recognises.
 * Claude Code listens for the two public kinds and projects them — an agent
 * is inhabited, a knowledge space is oriented in. Anything else is shown as
 * declared and otherwise ignored, never an error.
 */

import { parseFrontmatter, type ContentAwarenessManifest } from "@ideaspaces/protocol";

/** The two kinds IdeaSpaces listens for, by the reference their Spaces declare. */
const RECOGNISED: Record<string, "agent" | "knowledge"> = {
  "agent:repo:n_0935a5df1f883eeb60bcdfbb": "agent",
  "knowledge:repo:n_f1511280efecd7fcff155152": "knowledge",
};

/** The sentence `ideaspaces create` leaves in an Agreement whose sections are still prompts. */
const PROMPTS_MARKER = "Every section below is a prompt";

/** The Agreement entry's own name, minus the conventional "Agreement — " prefix. */
function agreementName(manifest: ContentAwarenessManifest): string | null {
  const entry = manifest.contract.find((e) => e.name === "agreement" && e.content);
  const name = entry?.content ? parseFrontmatter(entry.content)?.name : undefined;
  if (typeof name !== "string" || !name.trim()) return null;
  return name.replace(/^Agreement\s+[—–-]\s+/u, "").trim() || null;
}

function agreementStillPrompts(manifest: ContentAwarenessManifest): boolean {
  const entry = manifest.contract.find((e) => e.name === "agreement" && e.content);
  return Boolean(entry?.content?.includes(PROMPTS_MARKER));
}

/**
 * One line naming the convention this Space is under, or null when the
 * Agreement declares none. Rendered between the protocol's head and tail.
 */
export function renderKindLine(manifest: ContentAwarenessManifest): string | null {
  const reference = manifest.agreementReference?.trim();
  if (!reference) return null;
  const kind = RECOGNISED[reference];
  const prompts = agreementStillPrompts(manifest)
    ? " Its sections are still prompts — the first conversation draws them out and replaces them."
    : "";
  if (kind === "agent") {
    const name = agreementName(manifest);
    const who = name ? `being ${name}` : "being this agent";
    return `Kind: agent (${reference}) — launching here means ${who}, not studying it; the Agreement above is who you are for the session.${prompts}`;
  }
  if (kind === "knowledge") {
    return `Kind: knowledge space (${reference}) — orient in the Agreement above; knowledge lands as Notes the agent proposes and the person confirms.${prompts}`;
  }
  return `Kind: ${reference} — declared by the Agreement; not a convention this plugin recognises, so it is read as written.`;
}
