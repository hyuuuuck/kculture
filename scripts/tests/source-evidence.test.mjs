import test from "node:test";
import assert from "node:assert/strict";
import { structuredEvidenceText } from "../lib/source-evidence.mjs";

test("structured evidence is scoped to one named edition and excludes executable scripts", () => {
  const record = { "@type": "Festival", name: "2026 Festival", startDate: "2026-10-03", location: { name: "Namgang" } };
  const script = value => `<script type="application/ld+json">${JSON.stringify(value)}</script>`;
  const config = { structuredDataType: "Festival", structuredDataName: "2026 Festival" };
  const html = `<script>const falseClaim = '18:00';</script>${script({ "@graph": [record] })}`;
  assert.equal(structuredEvidenceText(html, config), JSON.stringify(record));
  assert.equal(structuredEvidenceText(html), "");
  assert.equal(structuredEvidenceText(html, { ...config, structuredDataName: "2025 Festival" }), "");
  assert.equal(structuredEvidenceText(html + script(record), config), "");
  assert.equal(structuredEvidenceText('<script type="application/ld+json">{bad}</script>', config), "");
});
