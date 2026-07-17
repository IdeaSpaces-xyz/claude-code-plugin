/**
 * The SessionStart open-Change line — pure render logic, display-only.
 *
 * The MCP server persists the open Change (change-state.ts in the mcp-server
 * repo); this module parses that record and phrases one line for the awareness
 * block. It NEVER arms anything — arming is the server's decision
 * (`armingDecision`, silent re-arm only for the session that opened it). The
 * line's job in the cross-session case is to force the explicit choice the
 * server won't make silently: resume or close.
 *
 * `/clear` nuance: a new session id is minted but the MCP server process
 * survives, so an armed Change may keep stamping from memory while the record
 * still names the pre-clear session. The line then reads "previous session" —
 * deliberately: it prompts the decision, and either choice realigns record and
 * server (is_change_open re-persists under the new session; is_change_close
 * clears both).
 */

/** Change-Id shape (protocol schema/trailers.md) — display-gate only. */
const CHANGE_ID_SHAPE = /^chg_[a-z0-9]+(-[a-z0-9]+)*$/;

export interface ChangeRecord {
  change_id: string;
  handle?: string;
  opened_at?: number;
  session_id?: string;
}

/** Parse the server-persisted record. Malformed or invalid → undefined (the
 * hook stays silent rather than rendering garbage into session context). */
export function parseChangeRecord(raw: string): ChangeRecord | undefined {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return undefined;
  }
  if (typeof parsed !== "object" || parsed === null) return undefined;
  const rec = parsed as Record<string, unknown>;
  if (typeof rec.change_id !== "string" || !CHANGE_ID_SHAPE.test(rec.change_id)) return undefined;
  return {
    change_id: rec.change_id,
    handle: typeof rec.handle === "string" ? rec.handle : undefined,
    opened_at: typeof rec.opened_at === "number" ? rec.opened_at : undefined,
    session_id: typeof rec.session_id === "string" ? rec.session_id : undefined,
  };
}

/** "today", "1d ago", "3d ago" — coarse on purpose; the id matters, not the clock. */
function age(openedAt: number | undefined, now: number): string | undefined {
  if (!openedAt || openedAt > now) return undefined;
  const days = Math.floor((now - openedAt) / 86_400_000);
  return days < 1 ? "today" : `${days}d ago`;
}

/** One line for the awareness block, phrased by session provenance. */
export function renderChangeLine(
  rec: ChangeRecord,
  currentSessionId: string | undefined,
  now: number,
): string {
  const opened = age(rec.opened_at, now);
  const handle = rec.handle ? ` ("${rec.handle}")` : "";
  if (rec.session_id && currentSessionId && rec.session_id === currentSessionId) {
    return (
      `Change open: ${rec.change_id}${handle} (this session${opened ? `, opened ${opened}` : ""}) — ` +
      `stamping every is_commit; close with is_change_close when the decision lands.`
    );
  }
  return (
    `⚠ Change open: ${rec.change_id}${handle} (opened ${opened ?? "in a previous session"}${opened ? ", previous session" : ""}) — ` +
    `resume with is_change_open({ id: "${rec.change_id}" }) or clear with is_change_close.`
  );
}
