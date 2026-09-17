import fs from "node:fs";
import path from "node:path";
import { releaseFingerprint, releaseIssues } from "./lib/editorial-release.mjs";
import { todayString } from "./lib/date.mjs";

const root = process.cwd();
const file = path.join(root, "data/editorial-release.json");
const record = JSON.parse(fs.readFileSync(file, "utf8"));
const fingerprint = releaseFingerprint(root);
const issues = releaseIssues(record, fingerprint, todayString(), relative => {
  const target = path.resolve(root, relative);
  return target.startsWith(root + path.sep) && fs.existsSync(target) && fs.statSync(target).isFile()
    && fs.readFileSync(target, "utf8").trim().length > 0;
}, { productionRequired: !process.argv.includes("--require-content-ready") });
console.log("Editorial release evidence — our internal review process, not Google eligibility rules.");
console.log("Current revision fingerprint: " + fingerprint);
if (issues.length) {
  console.log("NOT READY: " + issues.join("; "));
  if (process.argv.includes("--require-ready") || process.argv.includes("--require-content-ready")) process.exitCode = 1;
} else console.log("Recorded evidence is complete. This does not certify originality or predict approval.");
