import fs from "node:fs";
import path from "node:path";

const root = path.resolve(".");
const errors = [];

function read(relativePath) {
  const file = path.join(root, relativePath);
  if (!fs.existsSync(file)) {
    errors.push(`${relativePath} is missing.`);
    return "";
  }
  return fs.readFileSync(file, "utf8");
}

function assertIncludes(file, text, needle, message) {
  if (!text.includes(needle)) errors.push(`${file}: ${message}`);
}

function assertOrder(file, text, first, second, message) {
  const firstIndex = text.indexOf(first);
  const secondIndex = text.indexOf(second);
  if (firstIndex === -1 || secondIndex === -1 || firstIndex > secondIndex) {
    errors.push(`${file}: ${message}`);
  }
}

const sourceRefreshFile = ".github/workflows/source-refresh.yml";
const deployFile = ".github/workflows/deploy-cloudflare-pages.yml";
const verifyFile = ".github/workflows/verify.yml";
const draftEventsFile = "scripts/draft-events-from-feed.mjs";
const launchChecklistFile = "launch-checklist.md";

const sourceRefresh = read(sourceRefreshFile);
const deploy = read(deployFile);
const verify = read(verifyFile);
const draftEvents = read(draftEventsFile);
const launchChecklist = read(launchChecklistFile);

assertIncludes(sourceRefreshFile, sourceRefresh, "cron: \"20 */4 * * *\"", "source refresh should run every 4 hours.");
assertIncludes(sourceRefreshFile, sourceRefresh, "npm run import:forecast", "source refresh must import current KMA forecast before building review artifacts.");
assertIncludes(sourceRefreshFile, sourceRefresh, "npm run check:sources", "source refresh must audit official source availability.");
assertIncludes(sourceRefreshFile, sourceRefresh, "npm run collect:official", "source refresh must collect official page candidates.");
assertIncludes(sourceRefreshFile, sourceRefresh, "npm run source:summary", "source refresh must publish source summary artifacts.");
assertIncludes(sourceRefreshFile, sourceRefresh, "npm run source:issue", "source refresh must generate the GitHub issue digest.");
assertIncludes(sourceRefreshFile, sourceRefresh, "npm run verify", "source refresh must validate current site data after generating artifacts.");
assertIncludes(sourceRefreshFile, sourceRefresh, "actions/upload-artifact@v4", "source refresh must upload review artifacts.");
assertIncludes(sourceRefreshFile, sourceRefresh, "issues: write", "source refresh needs issue write permission for the operating inbox.");
assertOrder(sourceRefreshFile, sourceRefresh, "npm run import:forecast", "npm run check:sources", "KMA forecast import should happen before source checks.");
assertOrder(sourceRefreshFile, sourceRefresh, "npm run source:summary", "npm run source:issue", "source summary should be generated before the issue digest.");
assertOrder(sourceRefreshFile, sourceRefresh, "npm run source:issue", "gh issue", "issue body should be generated before updating GitHub issues.");

assertIncludes(deployFile, deploy, "npm run source:refresh", "manual Cloudflare deploy should be able to refresh official sources before build.");
assertIncludes(deployFile, deploy, "npm run validate:event-audit", "manual Cloudflare deploy must run high-risk event audit.");
assertIncludes(deployFile, deploy, "npm run validate:workflows", "manual Cloudflare deploy must validate workflow guardrails before release.");
assertIncludes(deployFile, deploy, "npm run quality:ceo", "manual Cloudflare deploy must run CEO quality review.");
assertIncludes(deployFile, deploy, "GOOGLE_ADSENSE_CMP_READY", "manual Cloudflare deploy must pass Google-certified CMP readiness into AdSense checks.");
assertIncludes(deployFile, deploy, "cloudflare/wrangler-action@v3", "manual deploy must use Wrangler for Cloudflare Workers.");

assertIncludes(verifyFile, verify, "npm run preflight:launch", "push verification must run launch preflight.");
assertIncludes(verifyFile, verify, "SITE_URL: https://kspotnow.com", "push verification should test the intended custom domain config.");
assertIncludes(verifyFile, verify, "CONTACT_EMAIL: contact@kspotnow.com", "push verification should test the intended domain contact email.");

assertIncludes(draftEventsFile, draftEvents, "similarPublishedEvent", "draft generation must compare candidates against already published events.");
assertIncludes(draftEventsFile, draftEvents, "duplicateBrandTokens", "draft generation must use brand tokens for cross-source duplicate detection.");
assertIncludes(draftEventsFile, draftEvents, "already published similar event", "duplicate candidate skips must explain the matched published event.");
assertIncludes(draftEventsFile, draftEvents, "busan one asia festival", "duplicate detection must handle BOF / Busan One Asia Festival aliases.");
assertIncludes(draftEventsFile, draftEvents, "\\uC6CC\\uD130\\uBC24", "duplicate detection must handle Korean WATERBOMB title aliases.");

const sourceIssueFile = "scripts/source-refresh-issue-body.mjs";
const sourceIssue = read(sourceIssueFile);
assertIncludes(sourceIssueFile, sourceIssue, "Title Cleanup Required", "source review issue must separate mojibake/manual-title candidates from clean top drafts.");
assertIncludes(sourceIssueFile, sourceIssue, "titleNeedsManualCleanup", "source review issue must detect drafts whose titles need manual cleanup.");
assertIncludes(sourceIssueFile, sourceIssue, "questionMarks >= 2", "source review issue must catch repeated question-mark mojibake in draft titles.");

assertIncludes(launchChecklistFile, launchChecklist, "https://kspotnow.com", "launch checklist must use the intended custom domain.");
assertIncludes(launchChecklistFile, launchChecklist, "contact@kspotnow.com", "launch checklist must document the public domain contact address.");
assertIncludes(launchChecklistFile, launchChecklist, "GOOGLE_SITE_VERIFICATION", "launch checklist must document Search Console verification.");
assertIncludes(launchChecklistFile, launchChecklist, "GOOGLE_ADSENSE_CMP_READY", "launch checklist must document CMP readiness before serving ads.");
assertIncludes(launchChecklistFile, launchChecklist, "/en/advertising/", "launch checklist must include the advertising policy trust page.");
assertIncludes(launchChecklistFile, launchChecklist, "npm.cmd run preflight:launch", "launch checklist must require full launch preflight.");
assertIncludes(launchChecklistFile, launchChecklist, "npm.cmd run preflight:adsense", "launch checklist must require strict AdSense preflight after IDs are issued.");
assertIncludes(launchChecklistFile, launchChecklist, "AdSense Submission Gate", "launch checklist must separate the final AdSense submission gate.");

if (errors.length) {
  console.error("Workflow validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Workflow validation passed: source refresh, deploy, and verify workflows include freshness, audit, artifact, and launch gates.");
