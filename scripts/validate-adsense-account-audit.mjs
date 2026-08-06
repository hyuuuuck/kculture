import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const auditPath = path.join(root, "data", "adsense-account-audit.json");
const programPath = path.join(root, "data", "editorial-program.json");
const requireCurrentReview = process.argv.includes("--require-current-review");
const errors = [];

function readJson(file, label) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    errors.push(`${label} is missing or invalid: ${error.message}`);
    return {};
  }
}

const audit = readJson(auditPath, "data/adsense-account-audit.json");
const program = readJson(programPath, "data/editorial-program.json");
const review = audit.siteReview || {};
const policy = audit.policyCenter || {};
const cmp = audit.cmp || {};
const choices = cmp.choices || {};
const search = audit.searchConsole || {};

const auditedTime = Date.parse(audit.auditedAt || "");
const ageDays = Number.isFinite(auditedTime) ? Math.floor((Date.now() - auditedTime) / 86400000) : Number.NaN;
if (!Number.isFinite(ageDays) || ageDays < 0) errors.push("authenticated AdSense account evidence must use a valid timestamp that is not in the future.");
if (audit.publisherId !== "pub-4973303868067114") errors.push("publisher ID does not match the production ads.txt account.");
if (audit.site !== "kspotnow.com") errors.push("account audit must cover kspotnow.com.");
if (!["attention-required", "getting-ready", "ready"].includes(review.approvalStatus)) {
  errors.push("account audit must use a recognized AdSense site approval state.");
}
if (review.adsTxtStatus !== "approved") errors.push("AdSense must report ads.txt as approved before re-review.");
if (typeof review.reviewRequestAvailable !== "boolean" || typeof review.reviewRequestSubmitted !== "boolean") {
  errors.push("account audit must record whether re-review is available and whether it was submitted.");
}
if (policy.issueCount !== 0) errors.push("Policy Center must have no separate active policy violations.");
if (cmp.status !== "published" || cmp.site !== "kspotnow.com" || cmp.publishedLanguageCount < 1) {
  errors.push("the Google European regulations message must be published for kspotnow.com.");
}
for (const region of ["EEA", "UK", "CH"]) {
  if (!(cmp.regions || []).includes(region)) errors.push(`CMP evidence is missing ${region} coverage.`);
}
if (!choices.consent || !choices.manageOptions || !choices.doNotConsent || choices.closeWithoutConsent !== false) {
  errors.push("the published CMP must expose consent, manage options, and do-not-consent without a consent-assuming close choice.");
}
if (search.property !== "sc-domain:kspotnow.com" || search.sitemapStatus !== "success") {
  errors.push("authenticated Search Console evidence must use the successful kspotnow.com domain sitemap.");
}
const expectedSitemapUrls = new Set([
  ...(program.indexableHubs || []),
  ...(program.indexableEvents || []).map((slug) => `/en/events/${slug}`),
  ...(program.indexableGuides || []).map((slug) => `/en/guides/${slug}`),
  ...(program.indexableRoutes || []).map((slug) => `/en/routes/${slug}`)
]);
if (search.sitemapDiscoveredPages !== expectedSitemapUrls.size) {
  errors.push(`Search Console discovered ${search.sitemapDiscoveredPages} sitemap pages; expected ${expectedSitemapUrls.size}.`);
}

if (requireCurrentReview) {
  if (ageDays > 7) errors.push("re-review requires authenticated AdSense account evidence no more than 7 days old.");
  if (review.approvalStatus !== "attention-required" || review.statusDetail !== "low-value-content") {
    errors.push("re-review requires a current low-value-content attention-required state.");
  }
  if (review.reviewRequestAvailable !== true || review.reviewRequestSubmitted !== false) {
    errors.push("re-review requires confirmation that the request is available and has not already been submitted.");
  }
}

if (errors.length) {
  console.error("Authenticated AdSense account audit failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Authenticated AdSense account audit passed${requireCurrentReview ? " for re-review" : ""}: ads.txt is approved, Policy Center is clear, CMP is published, and Search Console discovered ${search.sitemapDiscoveredPages} approved URLs.`);
