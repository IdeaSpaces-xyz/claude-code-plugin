export function canonical(value: unknown): string;
export function generate(catalog: unknown, exposure: unknown, hosts: unknown, pkg: unknown): string;
export function buildContracts(catalog: unknown, exposure: unknown, hosts: unknown, pkg: unknown): {
  metadata: Record<string, unknown>;
  tools: Record<string, { name: string; description: string; inputSchema: Record<string, unknown> }>;
  divergences: unknown[];
  entries: unknown[];
};
