import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { formatArrivalLine, fetchArrivalCounts, type InboxItem } from "./arrival-line.js";

describe("arrival line", () => {
  it("formats arrival text with thread messages and access requests", () => {
    expect(formatArrivalLine(1, 0)).toBe("Hosted: 1 new thread message.");
    expect(formatArrivalLine(3, 0)).toBe("Hosted: 3 new thread messages.");
    expect(formatArrivalLine(0, 1)).toBe("Hosted: 1 access request.");
    expect(formatArrivalLine(0, 2)).toBe("Hosted: 2 access requests.");
    expect(formatArrivalLine(2, 1)).toBe("Hosted: 2 new thread messages, 1 access request.");
    expect(formatArrivalLine(0, 0)).toBeUndefined();
  });

  it("computes unread thread messages and pending requests from inbox payload", async () => {
    const items: InboxItem[] = [
      { kind: "inquiry", latest_position: 5, cursor: 3 }, // 2 new
      { kind: "inquiry", latest_position: 2, cursor: 2 }, // 0 new (read)
      { kind: "inquiry", latest_position: 1, cursor: null }, // unread/unfollowed
      { kind: "access_request" }, // 1 request
    ];

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ items }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const counts = await fetchArrivalCounts({ apiUrl: "https://api.test", apiKey: "token" });
    expect(counts).toEqual({ newMessages: 2, newRequests: 1 });
    expect(formatArrivalLine(counts!.newMessages, counts!.newRequests)).toBe(
      "Hosted: 2 new thread messages, 1 access request.",
    );

    vi.unstubAllGlobals();
  });

  it("returns null on network failure without throwing", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("network error"));
    vi.stubGlobal("fetch", fetchMock);

    const counts = await fetchArrivalCounts({ apiUrl: "https://api.test", apiKey: "token" });
    expect(counts).toBeNull();

    vi.unstubAllGlobals();
  });
});
