/**
 * Fit the SessionStart render to Claude Code's inline channel.
 *
 * Claude Code inlines a SessionStart hook's stdout only up to 10,000
 * characters (measured on 2.1.285: 10,000 inline, 10,100 persisted; counted in
 * characters, not bytes). Past that it saves the output to a file and shows the
 * session a 2 KB preview and a path, so the Agreement the session is meant to
 * stand in arrives clipped. The render therefore fits or degrades on purpose:
 * the full text when it fits; otherwise every full contract entry falls to its
 * summary and the render names the files to read whole; and as a last resort
 * the text is cut at the budget with a line saying so.
 */

import { relative } from "node:path";
import type { ContentAwarenessManifest } from "@ideaspaces/protocol";

/** Claude Code's inline cap is 10,000 characters; keep a margin for its own framing. */
export const INLINE_BUDGET = 9_500;

/** The manifest with every full contract entry reduced to its summary, and the paths it reduced. */
export function summarizeContract(manifest: ContentAwarenessManifest): {
  manifest: ContentAwarenessManifest;
  demoted: string[];
} {
  const demoted: string[] = [];
  const contract = manifest.contract.map((entry) => {
    if (entry.representation !== "full") return entry;
    demoted.push(entry.path);
    const { content: _content, ...rest } = entry;
    return { ...rest, representation: "summary" as const };
  });
  return { manifest: { ...manifest, contract }, demoted };
}

/** The line that replaces a demoted body: which files to read whole, and with what. */
export function renderDemotedLine(paths: string[], base: string): string {
  const shown = paths.map((path) => relative(base, path) || path).join(", ");
  const it = paths.length === 1 ? "it" : "each";
  return `Summarised to fit the inline limit: ${shown}. Read ${it} in full with Read before acting.`;
}

/** Cut an over-budget render at a line boundary and say where the rest is. */
export function cutToBudget(text: string, budget = INLINE_BUDGET): string {
  if (text.length <= budget) return text;
  const note = "\n\n[Orientation cut to fit the inline limit; is_navigate shows the rest.]";
  const room = budget - note.length;
  const end = text.lastIndexOf("\n", room);
  return text.slice(0, end > 0 ? end : room) + note;
}
