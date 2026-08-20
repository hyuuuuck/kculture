import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const auditPath = path.join(root, "data", "adsense-account-audit.json");
const programPath = path.join(root, "data", "editorial-program.json");
const eventsPath = path.join(root, "data", "events.json");
const requireCurrentReview = process.argv.includes("--require-current-review");
const errors = [];
const warnings = [];

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
const events = readJson(eventsPath, "data/events.json");
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
const recognizedAdsTxtStatuses = new Set(["approved", "not-found", "unauthorized", "unknown"]);
const alternativeOwnershipReady = ["adsense-meta-tag", "adsense-code-snippet"].includes(review.selectedOwnershipMethod)
  && review.selectedOwnershipMethodFoundOnLiveSite === true;
if (!recognizedAdsTxtStatuses.has(review.adsTxtStatus)) {
  errors.push("account audit must use a recognized AdSense ads.txt state.");
} else if (review.adsTxtStatus !== "approved") {
  const message = `AdSense currently reports ads.txt as ${review.adsTxtStatus}.`;
  if (requireCurrentReview && !alternativeOwnershipReady) errors.push(`${message} A live, selected alternative ownership method is required before re-review.`);
  else warnings.push(`${message} ${alternativeOwnershipReady ? "A live alternative ownership method is recorded." : "This is allowed for deployment evidence but blocks AdSense re-review."}`);
}
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
const today = new Date().toISOString().slice(0, 10);
const currentEventSlugs = new Set((Array.isArray(events) ? events : [])
  .filter((event) => (program.indexableEvents || []).includes(event.slug) && event.endDate >= today)
  .map((event) => event.slug));
const expectedSitemapUrls = new Set([
  ...(program.indexableHubs || []),
  ...[...currentEventSlugs].map((slug) => `/en/events/${slug}`),
  ...(program.indexableGuides || []).map((slug) => `/en/guides/${slug}`),
  ...(program.indexableRoutes || []).map((slug) => `/en/routes/${slug}`)
]);
if (search.sitemapDiscoveredPages !== expectedSitemapUrls.size) {
  const message = `Search Console discovered ${search.sitemapDiscoveredPages} sitemap pages; expected ${expectedSitemapUrls.size}.`;
  if (requireCurrentReview) errors.push(message);
  else warnings.push(`${message} This is allowed for deployment but must be refreshed before AdSense re-review.`);
}

if (requireCurrentReview) {
  if (ageDays > 7) errors.push("re-review requires authenticated AdSense account evidence no more than 7 days old.");
  if (review.approvalStatus !== "attention-required" || review.statusDetail !== "low-value-content") {
    errors.push("re-review requires a current low-value-content attention-required state.");
  }
  if (review.reviewRequestAvailable !== true || review.reviewRequestSubmitted !== false) {
    errors.push("re-review requires confirmation that the request is available and has not already been submitted.");
  }
  if (review.adsTxtStatus !== "approved" && !alternativeOwnershipReady) {
    errors.push("re-review requires either approved ads.txt or a selected AdSense meta/code ownership method confirmed on the live site.");
  }
}

if (errors.length) {
  console.error("Authenticated AdSense account audit failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

if (warnings.length) {
  console.warn("Authenticated AdSense account audit warnings:");
  for (const warning of warnings) console.warn(`- ${warning}`);
}

console.log(`Authenticated AdSense account audit passed${requireCurrentReview ? " for re-review" : " for deployment"}: ads.txt is ${review.adsTxtStatus}, Policy Center is clear, CMP is published, and Search Console currently reports ${search.sitemapDiscoveredPages} discovered URLs.`);
