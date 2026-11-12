// The catalog owns CLI contracts; this host owns exposure, aliases and authority.
import { Ajv2020 } from "ajv/dist/2020.js";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

export const canonical = (value) =>
  Array.isArray(value)
    ? `[${value.map(canonical).join(",")}]`
    : value && typeof value === "object"
      ? `{${Object.keys(value)
          .sort()
          .map((k) => `${JSON.stringify(k)}:${canonical(value[k])}`)
          .join(",")}}`
      : JSON.stringify(value);
export function buildContracts(catalog, exposure, hosts, pkg) {
  const digest = `sha256:${createHash("sha256").update(canonical(catalog.entries)).digest("hex")}`;
  if (
    catalog.schema !== "ideaspaces.agent-tools" ||
    catalog.version !== 1 ||
    digest !== catalog.digest
  )
    throw new Error("Catalog format/digest mismatch");
  const entries = new Map([...catalog.entries, ...hosts].map((e) => [e.id, e]));
  const tools = {},
    divergences = [];
  for (const [name, spec] of Object.entries(exposure)) {
    const properties = {},
      sourceNames = new Set(),
      selected = spec.entries.map((id) => {
        const entry = entries.get(id);
        if (entry && !/^>=[0-9]+\.[0-9]+\.[0-9]+$/.test(entry.requires.cli))
          throw new Error(
            `${name}: unsupported requires.cli ${entry.requires.cli}`,
          );
        if (!entry || entry.status !== "active")
          throw new Error(`${name}: missing active entry ${id}`);
        for (const field of ["does", "use_when", "check", "bound"])
          if (!entry.text[field]?.trim())
            throw new Error(`${id}: empty ${field}`);
        for (const [key, schema] of Object.entries(
          entry.parameters.properties,
        )) {
          sourceNames.add(key);
          if (spec.omit[key]) {
            divergences.push({
              tool: name,
              parameter: key,
              kind: "host-owned omission",
              reason: spec.omit[key],
            });
            continue;
          }
          const alias = spec.aliases[key] ?? key;
          if (alias !== key)
            divergences.push({
              tool: name,
              parameter: key,
              kind: "alias",
              alias,
            });
          // Shared union parameters must agree in type; enum/limits may be narrowed below.
          if (properties[alias] && properties[alias].type !== schema.type)
            throw new Error(`${name}.${alias}: union type disagreement`);
          properties[alias] ??= structuredClone(schema);
        }
        return entry;
      });
    for (const key of Object.keys(spec.omit))
      if (!sourceNames.has(key))
        throw new Error(`${name}: stale omission ${key}`);
    for (const [key, change] of Object.entries(spec.add)) {
      if (properties[key] || !change.reason?.trim())
        throw new Error(`${name}: invalid host addition ${key}`);
      properties[key] = change.schema;
      divergences.push({
        tool: name,
        parameter: key,
        kind: "host-owned addition",
        reason: change.reason,
      });
    }
    for (const [key, change] of Object.entries(spec.host_parameters)) {
      if (!properties[key] || !change.reason?.trim())
        throw new Error(`${name}: invalid host override ${key}`);
      properties[key] = change.schema;
      divergences.push({
        tool: name,
        parameter: key,
        kind: "host-owned override",
        reason: change.reason,
      });
    }
    for (const [key, narrow] of Object.entries(spec.narrow)) {
      if (!properties[key])
        throw new Error(`${name}: unknown narrowed parameter ${key}`);
      for (const bound of ["minimum", "minItems"])
        if (
          narrow[bound] !== undefined &&
          properties[key][bound] !== undefined &&
          narrow[bound] < properties[key][bound]
        )
          throw new Error(`${name}.${key}: widened ${bound}`);
      for (const bound of ["maximum", "maxItems"])
        if (
          narrow[bound] !== undefined &&
          properties[key][bound] !== undefined &&
          narrow[bound] > properties[key][bound]
        )
          throw new Error(`${name}.${key}: widened ${bound}`);
      if (
        narrow.enum &&
        properties[key].enum &&
        narrow.enum.some((v) => !properties[key].enum.includes(v))
      )
        throw new Error(`${name}.${key}: widened enum`);
      properties[key] = { ...properties[key], ...narrow };
    }
    for (const key of spec.required)
      if (!properties[key])
        throw new Error(`${name}: undeclared required ${key}`);
    const text = spec.host_text
      ? [spec.host_text.text]
      : selected.map((e) => e.text);
    const description = text
      .map((t) =>
        ["does", "use_when", "check", "bound"].map((k) => t[k]).join("\n"),
      )
      .join("\n\n");
    tools[name] = {
      name,
      description,
      inputSchema: {
        type: "object",
        properties: sortObject(properties),
        required: [...spec.required].sort(),
        additionalProperties: false,
      },
      entries: spec.entries,
      requires: selected.map((e) => e.requires.cli),
    };
  }
  const metadata = {
    schema: catalog.schema,
    version: catalog.version,
    digest: catalog.digest,
    cli: catalog.cli,
    protocol: catalog.protocol,
    wrapper: { version: pkg.version },
  };
  const data = {
    metadata,
    tools,
    divergences,
    entries: catalog.entries.filter((e) =>
      Object.values(exposure).some(
        (s) =>
          s.entries.includes(e.id) ||
          s.entries.some((id) => entries.get(id)?.calls?.includes(e.id)),
      ),
    ),
  };
  return data;
}
export function generate(catalog, exposure, hosts, pkg) {
  const data = buildContracts(catalog, exposure, hosts, pkg);
  const tools = data.tools;
  return `// Generated by scripts/generate-tools.mjs. Do not edit.\nexport const AGENT_TOOLS = ${JSON.stringify(data, null, 2)} as const;\n\nexport interface ToolInputs {\n${Object.entries(
    tools,
  )
    .map(([name, t]) => `  ${JSON.stringify(name)}: ${tsType(t.inputSchema)};`)
    .join("\n")}\n}\n`;
}
function sortObject(value) {
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((k) => [k, value[k]]),
  );
}
function tsType(s) {
  if (s.anyOf) return s.anyOf.map(tsType).join(" | ");
  if (s.enum) return s.enum.map(JSON.stringify).join(" | ");
  if (s.type === "string") return "string";
  if (s.type === "boolean") return "boolean";
  if (s.type === "number" || s.type === "integer") return "number";
  if (s.type === "array") return `Array<${tsType(s.items)}>`;
  if (s.type === "object")
    return `{ ${Object.entries(s.properties ?? {})
      .map(
        ([k, v]) =>
          `${JSON.stringify(k)}${s.required?.includes(k) ? "" : "?"}: ${tsType(v)}`,
      )
      .join("; ")} }`;
  return "unknown";
}
export function main(args = process.argv.slice(2)) {
  const catalogPath = args.includes("--catalog")
    ? args[args.indexOf("--catalog") + 1]
    : "node_modules/@ideaspaces/cli/bundle/agent-tools.json";
  const read = (p) => JSON.parse(readFileSync(p, "utf8"));
  const catalog = read(catalogPath);
  const schema = read(
    catalogPath.replace(/agent-tools\.json$/, "agent-tools.schema.json"),
  );
  const validate = new Ajv2020({ strict: false, allErrors: true }).compile(
    schema,
  );
  if (
    !validate({
      ...catalog,
      entries: [...catalog.entries, ...read("agent-tools.host.json")],
    })
  )
    throw new Error(
      `Host/catalog schema mismatch: ${JSON.stringify(validate.errors)}`,
    );
  const output = generate(
    read(catalogPath),
    read("agent-tools.exposure.json"),
    read("agent-tools.host.json"),
    read("package.json"),
  );
  const dest = "src/generated/agent-tools.ts";
  if (args.includes("--check")) {
    if (readFileSync(dest, "utf8") !== output)
      throw new Error(
        "Catalog drift: run npm run generate:tools and commit the generated contracts",
      );
  } else {
    mkdirSync("src/generated", { recursive: true });
    writeFileSync(dest, output);
  }
  console.error(`Generated contracts from ${read(catalogPath).digest}`);
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
)
  main();
