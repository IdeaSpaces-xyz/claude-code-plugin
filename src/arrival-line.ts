import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const DEFAULT_API_URL = "https://api.ideaspaces.xyz";

interface StoredCredentials {
  api_url?: string;
  api_key?: string;
}

export function loadAuthConfig(): { apiUrl: string; apiKey: string } | null {
  // An app-owned sign-in is never permission to read the terminal credential store.
  if (process.env.IDEASPACES_AUTH === "host") return null;
  const envKey = process.env.IS_API_KEY?.trim();
  if (envKey) {
    return {
      apiUrl: (process.env.IS_API_URL || DEFAULT_API_URL).replace(/\/$/, ""),
      apiKey: envKey,
    };
  }
  try {
    const credPath = join(homedir(), ".ideaspaces", "credentials.json");
    if (!existsSync(credPath)) return null;
    const creds = JSON.parse(readFileSync(credPath, "utf-8")) as StoredCredentials;
    if (!creds.api_key) return null;
    return {
      apiUrl: (process.env.IS_API_URL || creds.api_url || DEFAULT_API_URL).replace(/\/$/, ""),
      apiKey: creds.api_key,
    };
  } catch {
    return null;
  }
}

/** Arrival only reports incoming access requests; Threads are listed explicitly. */
export function formatArrivalLine(newRequests: number): string | undefined {
  return newRequests > 0 ? `Hosted: ${newRequests} access request${newRequests === 1 ? "" : "s"}.` : undefined;
}

export async function fetchArrivalCounts(config: {
  apiUrl: string;
  apiKey: string;
}): Promise<{ newRequests: number } | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 1500);
  try {
    const res = await fetch(`${config.apiUrl}/api/v1/access-requests/incoming`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        Accept: "application/json",
      },
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { requests?: unknown[] };
    if (!Array.isArray(data.requests)) return null;
    return { newRequests: data.requests.length };
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function renderArrivalLine(): Promise<string | undefined> {
  const config = loadAuthConfig();
  if (!config) return undefined;
  const counts = await fetchArrivalCounts(config);
  if (!counts) return undefined;
  return formatArrivalLine(counts.newRequests);
}
