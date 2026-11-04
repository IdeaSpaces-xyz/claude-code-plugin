import { afterEach, describe, expect, it, vi } from "vitest";
import { ARRIVAL_BUDGET_MS, formatArrivalLine, fetchArrivalCounts, renderArrivalLine } from "./arrival-line.js";
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
describe("access-request arrival notice without Inbox polling", () => {
  it("formats pending requests only", () => {
    expect(formatArrivalLine(0)).toBeUndefined();
    expect(formatArrivalLine(1)).toBe("Hosted: 1 access request.");
    expect(formatArrivalLine(2)).toBe("Hosted: 2 access requests.");
  });
  it("uses the access-request incoming route alone", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ requests: [{}, {}] }) });
    vi.stubGlobal("fetch", fetchMock);
    expect(await fetchArrivalCounts({ apiUrl: "https://api.test", apiKey: "synthetic" })).toEqual({ newRequests: 2 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe("https://api.test/api/v1/access-requests/incoming");
  });
  it.each([null, {}, { requests: null }])("stays silent for malformed data %s", async data => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => data }));
    expect(await fetchArrivalCounts({ apiUrl: "https://api.test", apiKey: "synthetic" })).toBeNull();
  });
  it("stays silent on network failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    expect(await fetchArrivalCounts({ apiUrl: "https://api.test", apiKey: "synthetic" })).toBeNull();
  });
});

it("does not spend terminal credentials from an app-owned host session", async () => {
  vi.stubEnv("IDEASPACES_AUTH", "host"); vi.stubEnv("IS_API_KEY", "synthetic-should-not-be-spent");
  const fetchMock = vi.fn(); vi.stubGlobal("fetch", fetchMock);
  expect(await renderArrivalLine()).toBeUndefined(); expect(fetchMock).not.toHaveBeenCalled();
});

describe("hard optional-network deadline", () => {
  it.each(["fetch", "body"])("settles a hung %s within 100ms even when abort is ignored", async phase => {
    vi.useFakeTimers();
    let signal: AbortSignal | undefined;
    vi.stubGlobal("fetch", vi.fn((_url, init) => {
      signal = init.signal;
      return phase === "fetch" ? new Promise(() => {}) : Promise.resolve({ ok: true, json: () => new Promise(() => {}) });
    }));
    const result = fetchArrivalCounts({ apiUrl: "https://api.test", apiKey: "synthetic" });
    let settled = false; void result.then(() => { settled = true; });
    await vi.advanceTimersByTimeAsync(ARRIVAL_BUDGET_MS - 1);
    expect(settled).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(await result).toBeNull(); expect(signal?.aborted).toBe(true);
    expect(ARRIVAL_BUDGET_MS).toBe(100);
    expect(vi.getTimerCount()).toBe(0);
  });
  it("handles late rejection silently and clears the deadline on fast success", async () => {
    vi.useFakeTimers();
    let reject!: (err: Error) => void;
    vi.stubGlobal("fetch", vi.fn(() => new Promise((_r, no) => { reject = no; })));
    const result = fetchArrivalCounts({ apiUrl: "https://api.test", apiKey: "synthetic" });
    await vi.advanceTimersByTimeAsync(100); expect(await result).toBeNull();
    reject(new Error("late failure")); await vi.advanceTimersByTimeAsync(1);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ requests: [{}] }) }));
    expect(await fetchArrivalCounts({ apiUrl: "https://api.test", apiKey: "synthetic" })).toEqual({ newRequests: 1 });
    expect(vi.getTimerCount()).toBe(0);
  });
});
