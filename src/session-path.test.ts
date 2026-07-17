import { describe, expect, it } from "vitest";
import { changeCachePath, sessionIdCachePath } from "./session-path.js";

describe("sessionIdCachePath (hook write side)", () => {
  it("lives under <home>/.ideaspaces/sessions, never inside the project tree", () => {
    const p = sessionIdCachePath("/home/u", "/work/my-space");
    expect(p.startsWith("/home/u/.ideaspaces/sessions/")).toBe(true);
    expect(p.includes("/work/my-space")).toBe(false);
  });

  it("normalizes the project dir so equivalent paths key identically", () => {
    expect(sessionIdCachePath("/home/u", "/work/a")).toBe(sessionIdCachePath("/home/u", "/work/./a"));
  });

  // Cross-repo lock: the mcp-server's `sessionIdCachePath` (its read side)
  // asserts this SAME golden value. If either repo's derivation drifts, its own
  // test fails loudly instead of the two silently disagreeing and dropping the
  // Conversation trailer. Keep in sync with mcp-server/src/trailers.test.ts.
  it("matches the cross-repo golden value", () => {
    expect(sessionIdCachePath("/home/u", "/work/a")).toBe(
      "/home/u/.ideaspaces/sessions/d7f9747246691548",
    );
  });
});

describe("changeCachePath (hook read side)", () => {
  it("lives under <home>/.ideaspaces/changes, never inside the project tree", () => {
    const p = changeCachePath("/home/u", "/work/my-space");
    expect(p.startsWith("/home/u/.ideaspaces/changes/")).toBe(true);
    expect(p.includes("/work/my-space")).toBe(false);
  });

  it("shares the session derivation, differing only in the subdir", () => {
    expect(changeCachePath("/home/u", "/work/a").split("/").pop()).toBe(
      sessionIdCachePath("/home/u", "/work/a").split("/").pop(),
    );
  });

  // Cross-repo lock: the mcp-server's `changeCachePath` (its WRITE side —
  // direction inverted vs. the session id) asserts this SAME golden value in
  // change-state.test.ts. Drift on either side fails loudly instead of the
  // awareness line silently going blind to the server's persisted Change.
  it("matches the cross-repo golden value", () => {
    expect(changeCachePath("/home/u", "/work/a")).toBe(
      "/home/u/.ideaspaces/changes/d7f9747246691548",
    );
  });
});
