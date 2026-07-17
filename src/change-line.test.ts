import { describe, expect, it } from "vitest";
import { parseChangeRecord, renderChangeLine } from "./change-line.js";

const NOW = 1_768_600_000_000;
const DAY = 86_400_000;

describe("parseChangeRecord", () => {
  it("parses a full record", () => {
    const raw = JSON.stringify({
      change_id: "chg_token-bucket-a3f9",
      handle: "token bucket",
      opened_at: NOW - DAY,
      session_id: "sess-1",
    });
    expect(parseChangeRecord(raw)).toEqual({
      change_id: "chg_token-bucket-a3f9",
      handle: "token bucket",
      opened_at: NOW - DAY,
      session_id: "sess-1",
    });
  });

  it("rejects malformed JSON, non-objects, and invalid Change-Ids", () => {
    expect(parseChangeRecord("not json {")).toBeUndefined();
    expect(parseChangeRecord('"chg_x-1a2b"')).toBeUndefined();
    expect(parseChangeRecord(JSON.stringify({ opened_at: 1 }))).toBeUndefined();
    expect(parseChangeRecord(JSON.stringify({ change_id: "CHG_NOPE" }))).toBeUndefined();
  });

  it("drops non-string/number optionals instead of failing", () => {
    expect(parseChangeRecord(JSON.stringify({ change_id: "chg_x-1a2b", handle: 7, opened_at: "x", session_id: 9 })))
      .toEqual({ change_id: "chg_x-1a2b", handle: undefined, opened_at: undefined, session_id: undefined });
  });
});

describe("renderChangeLine", () => {
  const rec = (over: Record<string, unknown> = {}) => ({
    change_id: "chg_x-1a2b",
    handle: "auth model",
    opened_at: NOW - 3 * DAY,
    session_id: "sess-1",
    ...over,
  });

  it("same session: states it is stamping, points at close", () => {
    const line = renderChangeLine(rec(), "sess-1", NOW);
    expect(line).toContain('Change open: chg_x-1a2b ("auth model") (this session, opened 3d ago)');
    expect(line).toContain("stamping every is_commit");
    expect(line).toContain("is_change_close");
    expect(line).not.toContain("⚠");
  });

  it("different session: warns, offers explicit resume or clear — never claims to stamp", () => {
    const line = renderChangeLine(rec(), "sess-2", NOW);
    expect(line).toContain("⚠ Change open: chg_x-1a2b");
    expect(line).toContain("opened 3d ago, previous session");
    expect(line).toContain('is_change_open({ id: "chg_x-1a2b" })');
    expect(line).not.toContain("stamping");
  });

  it("opened today reads as today; missing session ids read as previous session", () => {
    expect(renderChangeLine(rec({ opened_at: NOW - DAY / 2 }), "sess-2", NOW)).toContain("opened today");
    expect(renderChangeLine(rec({ session_id: undefined }), undefined, NOW)).toContain("⚠");
  });

  it("handles a minimal record (no handle, no opened_at)", () => {
    const line = renderChangeLine(
      { change_id: "chg_x-1a2b" },
      "sess-1",
      NOW,
    );
    expect(line).toContain("⚠ Change open: chg_x-1a2b (opened in a previous session)");
  });
});
