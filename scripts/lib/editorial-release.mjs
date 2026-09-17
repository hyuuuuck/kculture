import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export function releaseFingerprint(root) {
  const files = ["data/events.json", "data/guides.json", "data/visitor-briefs.json",
    "data/editorial-program.json", "data/kto-nearby-reviewed.json", "scripts/build.mjs",
    "scripts/lib/visitor-render.mjs", "scripts/lib/editorial.mjs", "app.js", "planning.js", "data/visit-planning.json", "styles.css"];
  const hash = crypto.createHash("sha256");
  for (const file of files) {
    let value = fs.readFileSync(path.join(root, file), "utf8");
    if (file === "data/events.json") {
      // Monitoring alone must neither renew editorial dates nor invalidate a reviewed text.
      value = JSON.stringify(JSON.parse(value).map(({ sourceCheckedAt, lastChecked, ...event }) => event));
    }
    hash.update(file + "\0" + value + "\0");
  }
  return hash.digest("hex");
}
export function releaseIssues(record, fingerprint, today, evidenceExists, { productionRequired = true } = {}) {
  const issues = [];
  if (record.revisionFingerprint !== fingerprint) issues.push("evidence is not tied to the current text/build revision");
  const required = ["humanEditorialReview", "readerTaskCheck", ...(productionRequired ? ["productionVerification"] : [])];
  for (const key of required) {
    const entry = record[key] || {};
    if (entry.status !== "passed") { issues.push(key + " is " + (entry.status || "unrecorded")); continue; }
    if (!entry.by || !/^\d{4}-\d{2}-\d{2}$/.test(entry.date || "") || entry.date > today
        || entry.date < record.revisionDate || !entry.evidencePath || !evidenceExists(entry.evidencePath)) {
      issues.push(key + " lacks dated, traceable evidence");
    }
  }
  return issues;
}
