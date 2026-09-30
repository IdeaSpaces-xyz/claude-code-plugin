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
 * the head is cut at the budget with a line saying so, the tail kept whole.
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
  return `Summarised to fit the inline limit: ${shown}. Read ${it} in full with the Read tool before acting.`;
}

/** Join render parts with a blank line, skipping empty ones. */
export function joinParts(...parts: string[]): string {
  return parts.filter((part) => part.trim()).join("\n\n");
}

/**
 * Join head and tail within the budget. When they do not fit, the head is cut
 * and the tail kept whole: State and the open Change are what the session acts
 * on, and the head's tree, contract and skills are one is_navigate away. The
 * one exception is a tail that alone leaves under 1,000 characters for the
 * head; then the whole render is cut from the end like anything else.
 */
export function fitToBudget(head: string, tail: string, budget = INLINE_BUDGET): string {
  const join = joinParts;
  const whole = join(head, tail);
  if (whole.length <= budget) return whole;
  const room = budget - tail.length - 2;
  // A tail that leaves no useful room for the head is cut like anything else.
  if (room < 1_000) return cutToBudget(whole, budget);
  return join(cutToBudget(head, room), tail);
}

/** Cut an over-budget render at a line boundary and say where the rest is. */
export function cutToBudget(text: string, budget = INLINE_BUDGET): string {
  if (text.length <= budget) return text;
  const note = "\n\n[Orientation cut here to fit the inline limit; is_navigate shows the position in full.]";
  const room = budget - note.length;
  const end = text.lastIndexOf("\n", room);
  return text.slice(0, end > 0 ? end : room) + note;
}
