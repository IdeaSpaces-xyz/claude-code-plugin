import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const DEFAULT_API_URL = "https://api.ideaspaces.xyz";

interface StoredCredentials {
  api_url?: string;
  api_key?: string;
}

export function loadAuthConfig(): { apiUrl: string; apiKey: string } | null {
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

export interface InboxItem {
  kind: "inquiry" | "access_request";
  latest_position?: number;
  cursor?: number | null;
}

export function formatArrivalLine(newMessages: number, newRequests: number): string | undefined {
  if (newMessages === 0 && newRequests === 0) return undefined;
  const parts: string[] = [];
  if (newMessages > 0) {
    parts.push(`${newMessages} new thread message${newMessages === 1 ? "" : "s"}`);
  }
  if (newRequests > 0) {
    parts.push(`${newRequests} access request${newRequests === 1 ? "" : "s"}`);
  }
  return `Hosted: ${parts.join(", ")}.`;
}

export async function fetchArrivalCounts(config: {
  apiUrl: string;
  apiKey: string;
}): Promise<{ newMessages: number; newRequests: number } | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 1500);
  try {
    const res = await fetch(`${config.apiUrl}/api/v1/inbox`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        Accept: "application/json",
      },
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { items?: InboxItem[] };
    if (!Array.isArray(data.items)) return null;

    let newMessages = 0;
    let newRequests = 0;
    for (const item of data.items) {
      if (item.kind === "inquiry") {
        if (
          typeof item.cursor === "number" &&
          typeof item.latest_position === "number" &&
          item.latest_position > item.cursor
        ) {
          newMessages += item.latest_position - item.cursor;
        }
      } else if (item.kind === "access_request") {
        newRequests += 1;
      }
    }
    return { newMessages, newRequests };
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
  return formatArrivalLine(counts.newMessages, counts.newRequests);
}
