import { afterEach, describe, expect, it, vi } from "vitest";
import { formatArrivalLine, fetchArrivalCounts, renderArrivalLine } from "./arrival-line.js";
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
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
