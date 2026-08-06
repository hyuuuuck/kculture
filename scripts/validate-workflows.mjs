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
const packageJsonFile = "package.json";
const domainCheckFile = "scripts/check-domain-live.mjs";
const workerFile = "src/worker.js";

const sourceRefresh = read(sourceRefreshFile);
const deploy = read(deployFile);
const verify = read(verifyFile);
const draftEvents = read(draftEventsFile);
const launchChecklist = read(launchChecklistFile);
const packageJson = read(packageJsonFile);
const domainCheck = read(domainCheckFile);
const worker = read(workerFile);

assertIncludes(sourceRefreshFile, sourceRefresh, "cron: \"20 */4 * * *\"", "source refresh should run every 4 hours.");
assertIncludes(sourceRefreshFile, sourceRefresh, "npm run import:forecast", "source refresh must import current KMA forecast before building review artifacts.");
assertIncludes(sourceRefreshFile, sourceRefresh, "npm run check:sources", "source refresh must audit official source availability.");
assertIncludes(sourceRefreshFile, sourceRefresh, "npm run collect:official", "source refresh must collect official page candidates.");
assertIncludes(sourceRefreshFile, sourceRefresh, "npm run source:summary", "source refresh must publish source summary artifacts.");
assertIncludes(sourceRefreshFile, sourceRefresh, "npm run source:issue", "source refresh must generate the GitHub issue digest.");
assertIncludes(sourceRefreshFile, sourceRefresh, "npm run stage:review-candidates", "source refresh must stage a PR-ready review candidate package.");
assertIncludes(sourceRefreshFile, sourceRefresh, "npm run verify", "source refresh must validate current site data after generating artifacts.");
assertIncludes(sourceRefreshFile, sourceRefresh, "Commit operational refresh snapshots", "source refresh must auto-commit weather and source summary snapshots after verification.");
assertIncludes(sourceRefreshFile, sourceRefresh, "data/kma-forecast.json data/source-refresh-summary.json", "source refresh must limit direct auto-commits to operational snapshots.");
assertIncludes(sourceRefreshFile, sourceRefresh, "STASHED_REVIEW_CANDIDATES", "source refresh must keep review candidate files out of the operational snapshot commit.");
assertIncludes(sourceRefreshFile, sourceRefresh, "peter-evans/create-pull-request@v6", "source refresh must open or update a review PR instead of publishing draft events directly.");
assertIncludes(sourceRefreshFile, sourceRefresh, "continue-on-error: true", "source refresh PR creation should not break the operating refresh if repository PR permissions are disabled.");
assertIncludes(sourceRefreshFile, sourceRefresh, "Allow GitHub Actions to create and approve pull requests", "source refresh must document the repository setting required for automated review PRs.");
assertIncludes(sourceRefreshFile, sourceRefresh, "automation/source-review-candidates", "source refresh review PR should use a stable automation branch.");
assertIncludes(sourceRefreshFile, sourceRefresh, "data/review-candidates/latest.md", "source refresh review PR must include a readable candidate brief.");
assertIncludes(sourceRefreshFile, sourceRefresh, "actions/upload-artifact@v4", "source refresh must upload review artifacts.");
assertIncludes(sourceRefreshFile, sourceRefresh, "issues: write", "source refresh needs issue write permission for the operating inbox.");
assertIncludes(sourceRefreshFile, sourceRefresh, "contents: write", "source refresh needs contents write permission to commit operational snapshots.");
assertIncludes(sourceRefreshFile, sourceRefresh, "pull-requests: write", "source refresh needs pull request write permission for candidate review PRs.");
assertOrder(sourceRefreshFile, sourceRefresh, "npm run import:forecast", "npm run check:sources", "KMA forecast import should happen before source checks.");
assertOrder(sourceRefreshFile, sourceRefresh, "npm run source:summary", "npm run source:issue", "source summary should be generated before the issue digest.");
assertOrder(sourceRefreshFile, sourceRefresh, "npm run source:issue", "npm run stage:review-candidates", "issue digest should be ready before staging the PR review package.");
assertOrder(sourceRefreshFile, sourceRefresh, "npm run source:issue", "gh issue", "issue body should be generated before updating GitHub issues.");
assertOrder(sourceRefreshFile, sourceRefresh, "npm run verify", "Commit operational refresh snapshots", "source refresh should verify site data before committing operational snapshots.");
assertOrder(sourceRefreshFile, sourceRefresh, "Commit operational refresh snapshots", "Create or update source review PR", "operational snapshots should be committed before the candidate PR is created.");

assertIncludes(deployFile, deploy, "npm run source:refresh", "manual Cloudflare deploy should be able to refresh official sources before build.");
assertIncludes(deployFile, deploy, "npm run validate:event-audit", "manual Cloudflare deploy must run high-risk event audit.");
assertIncludes(deployFile, deploy, "npm run validate:original-value", "manual Cloudflare deploy must enforce original visitor value.");
assertIncludes(deployFile, deploy, "npm run validate:adsense-compliance", "manual Cloudflare deploy must enforce the versioned CMP and ad placement gate.");
assertIncludes(deployFile, deploy, "npm run validate:adsense-account", "manual Cloudflare deploy must enforce the authenticated AdSense account audit.");
assertIncludes(deployFile, deploy, "npm run validate:workflows", "manual Cloudflare deploy must validate workflow guardrails before release.");
assertIncludes(deployFile, deploy, "npm run quality:ceo", "manual Cloudflare deploy must run CEO quality review.");
assertIncludes(deployFile, deploy, "GOOGLE_ADSENSE_CMP_READY", "manual Cloudflare deploy must pass Google-certified CMP readiness into AdSense checks.");
assertIncludes(deployFile, deploy, "GOOGLE_ADSENSE_CMP_EVIDENCE", "manual Cloudflare deploy must require human CMP evidence before enabling AdSense.");
assertIncludes(deployFile, deploy, "preflight:adsense-review", "manual deploy must expose an ads.txt-based site-review gate.");
assertIncludes(deployFile, deploy, "preflight:ad-serving", "manual deploy must keep CMP-gated ad serving separate from site review.");
assertIncludes(deployFile, deploy, "require_ad_serving", "manual deploy must require an explicit ad-serving release choice.");
assertIncludes(deployFile, deploy, "GOOGLE_ADSENSE_SERVING_ENABLED", "ad serving must require a release flag that is absent from ordinary Cloudflare Git builds.");
assertIncludes(deployFile, deploy, "inputs.require_ad_serving && '1' || '0'", "ordinary pushes must keep the AdSense serving release flag disabled.");
assertIncludes(deployFile, deploy, "inputs.require_ad_serving && vars.GOOGLE_ADSENSE_CMP_READY || '0'", "ordinary pushes must keep the AdSense CMP release flag disabled.");
assertIncludes(deployFile, deploy, "inputs.require_ad_serving && vars.GOOGLE_ADSENSE_CMP_EVIDENCE || '0'", "ordinary pushes must keep the AdSense evidence release flag disabled.");
assertIncludes(deployFile, deploy, "cloudflare/wrangler-action@v3", "manual deploy must use Wrangler for Cloudflare Workers.");
assertIncludes(deployFile, deploy, "Check Cloudflare deploy secret", "manual deploy should check the API token only after validation can report quality gates.");
assertOrder(deployFile, deploy, "npm run quality:ceo", "Check Cloudflare deploy secret", "Cloudflare token checks should run after CEO quality review so missing secrets do not hide build quality.");

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
assertIncludes(launchChecklistFile, launchChecklist, "GOOGLE_ADSENSE_CMP_EVIDENCE", "launch checklist must document human CMP evidence before serving ads.");
assertIncludes(launchChecklistFile, launchChecklist, "GOOGLE_ADSENSE_SERVING_ENABLED", "launch checklist must document the separate ad-serving release switch.");
assertIncludes(launchChecklistFile, launchChecklist, "data/adsense-compliance.json", "launch checklist must require a versioned CMP evidence record.");
assertIncludes(launchChecklistFile, launchChecklist, "/en/advertising/", "launch checklist must include the advertising policy trust page.");
assertIncludes(launchChecklistFile, launchChecklist, "npm.cmd run preflight:launch", "launch checklist must require full launch preflight.");
assertIncludes(launchChecklistFile, launchChecklist, "npm.cmd run preflight:adsense-review", "launch checklist must document the site-review gate.");
assertIncludes(launchChecklistFile, launchChecklist, "npm.cmd run preflight:ad-serving", "launch checklist must document the separate ad-serving gate.");
assertIncludes(launchChecklistFile, launchChecklist, "npm.cmd run check:domain", "launch checklist must require live custom-domain verification.");
assertIncludes(launchChecklistFile, launchChecklist, "AdSense Submission Gate", "launch checklist must separate the final AdSense submission gate.");

assertIncludes(packageJsonFile, packageJson, "\"check:domain\"", "package scripts must expose the live domain verification command.");
assertIncludes(packageJsonFile, packageJson, "\"preflight:adsense-review\"", "package scripts must expose the AdSense site-review preflight.");
assertIncludes(packageJsonFile, packageJson, "\"preflight:ad-serving\"", "package scripts must expose the CMP-gated ad-serving preflight.");
assertIncludes(packageJsonFile, packageJson, "\"stage:review-candidates\"", "package scripts must expose review candidate staging for scheduled PRs.");
assertIncludes(domainCheckFile, domainCheck, "https://kspotnow.com", "domain check must default to the intended custom domain.");
assertIncludes(domainCheckFile, domainCheck, "/sitemap.xml", "domain check must verify the live sitemap.");
assertIncludes(domainCheckFile, domainCheck, "/robots.txt", "domain check must verify robots.txt.");
assertIncludes(domainCheckFile, domainCheck, "Advertising Policy", "domain check must verify a public advertising policy page.");
assertIncludes(workerFile, worker, "retiredSectionPath", "the worker must explicitly retire withdrawn sections.");
assertOrder(workerFile, worker, "if (retiredSectionPath)", "env.ASSETS.fetch", "withdrawn sections must return 410 before stale asset lookup.");

if (errors.length) {
  console.error("Workflow validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Workflow validation passed: source refresh, deploy, and verify workflows include freshness, audit, artifact, and launch gates.");
