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

const sourceRefresh = read(sourceRefreshFile);
const deploy = read(deployFile);
const verify = read(verifyFile);

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
assertIncludes(deployFile, deploy, "npm run quality:ceo", "manual Cloudflare deploy must run CEO quality review.");
assertIncludes(deployFile, deploy, "cloudflare/wrangler-action@v3", "manual deploy must use Wrangler for Cloudflare Workers.");

assertIncludes(verifyFile, verify, "npm run preflight:launch", "push verification must run launch preflight.");
assertIncludes(verifyFile, verify, "SITE_URL: https://kspotnow.com", "push verification should test the intended custom domain config.");
assertIncludes(verifyFile, verify, "CONTACT_EMAIL: contact@kspotnow.com", "push verification should test the intended domain contact email.");

if (errors.length) {
  console.error("Workflow validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Workflow validation passed: source refresh, deploy, and verify workflows include freshness, audit, artifact, and launch gates.");
