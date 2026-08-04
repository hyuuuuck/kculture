import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const file = path.join(root, "data", "search-console-audit.json");
const requireReady = process.argv.includes("--require-ready");
const errors = [];
let audit = null;

try {
  audit = JSON.parse(fs.readFileSync(file, "utf8"));
} catch (error) {
  errors.push(`Cannot read data/search-console-audit.json: ${error.message}`);
}

if (audit) {
  if (audit.property !== "sc-domain:kspotnow.com") errors.push("Audit must use the kspotnow.com domain property.");
  if (!/^\d{4}-\d{2}-\d{2}T/.test(String(audit.auditedAt || ""))) errors.push("auditedAt must be an ISO timestamp.");
  if (!["hold", "ready"].includes(audit.status)) errors.push("status must be hold or ready.");
  for (const key of ["indexed", "notIndexed", "notFound404", "alternateWithCanonical", "crawledNotIndexed", "discoveredNotIndexed"]) {
    if (!Number.isFinite(audit.coverage?.[key]) || audit.coverage[key] < 0) errors.push(`coverage.${key} must be a non-negative number.`);
  }
  if (!Array.isArray(audit.releaseCriteria) || audit.releaseCriteria.length < 3) errors.push("releaseCriteria must document the cleanup and recheck sequence.");
  if (requireReady && (audit.status !== "ready" || audit.performance?.legacyPagesDominateTopPages !== false)) {
    errors.push("AdSense re-review is blocked until an authenticated Search Console audit is marked ready and legacy pages no longer dominate top-page signals.");
  }
}

if (errors.length) {
  console.error(`Search Console audit ${requireReady ? "re-review gate" : "record"} failed.`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Search Console audit valid: ${audit.status.toUpperCase()} (${audit.coverage.indexed} indexed, ${audit.coverage.notIndexed} not indexed; checked ${audit.auditedAt}).`);
