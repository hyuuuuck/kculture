// Explicitly opt in to structured records for JS-rendered official sites.
// Never use arbitrary script text as evidence, or silently mix editions.
export function structuredEvidenceText(html, { structuredDataType, structuredDataName } = {}) {
  if (!structuredDataType || !structuredDataName) return "";
  const matches = [];
  function visit(value) {
    if (Array.isArray(value)) return value.forEach(visit);
    if (!value || typeof value !== "object") return;
    const types = Array.isArray(value["@type"]) ? value["@type"] : [value["@type"]];
    if (types.includes(structuredDataType) && value.name === structuredDataName) matches.push(value);
    if (value["@graph"]) visit(value["@graph"]);
  }
  for (const match of String(html).matchAll(/<script\b[^>]*\btype\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try { visit(JSON.parse(match[1])); } catch { /* Malformed data cannot be evidence. */ }
  }
  // Ambiguous duplicate records must fail closed, not combine their tokens.
  return matches.length === 1 ? JSON.stringify(matches[0]) : "";
}
