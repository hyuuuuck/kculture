import fs from "node:fs";
import path from "node:path";
import {
  adSenseCmpEvidenceStatus,
  configuredAdSenseClientId,
  configuredAdSenseCmpReady,
  configuredAdSensePublisherId
} from "./lib/adsense.mjs";
import { todayString } from "./lib/date.mjs";

const root = process.cwd();
const dist = path.join(root, "dist");
const today = todayString();
const requireAdsenseReview = process.argv.includes("--require-adsense-review")
  || process.argv.includes("--require-adsense")
  || process.env.REQUIRE_ADSENSE_REVIEW === "1"
  || process.env.REQUIRE_ADSENSE === "1";
const requireAdServing = process.argv.includes("--require-ad-serving")
  || process.env.REQUIRE_AD_SERVING === "1";
const compliance = readJson(path.join(root, "data", "adsense-compliance.json"));
const cmpEvidence = adSenseCmpEvidenceStatus(compliance, today);
const cmpReady = configuredAdSenseCmpReady(process.env, compliance, today);
const publisherId = configuredAdSensePublisherId();
const clientId = configuredAdSenseClientId();
const events = readJson(path.join(root, "data", "events.json")) || [];
const guides = readJson(path.join(root, "data", "guides.json")) || [];
const routes = readJson(path.join(root, "data", "travel-routes.json")) || [];
const program = readJson(path.join(root, "data", "editorial-program.json")) || {};
const failures = [];
const htmlFiles = collectFiles(dist, (file) => file.endsWith(".html"));
const approvedEventSlugs = new Set(program.indexableEvents || []);
const approvedGuideSlugs = new Set(program.indexableGuides || []);
const approvedRouteSlugs = new Set(program.indexableRoutes || []);
const adEligibleFiles = new Set([
  path.join(dist, "en", "index.html"),
  ...events
    .filter((event) => approvedEventSlugs.has(event.slug) && event.endDate >= today)
    .map((event) => path.join(dist, "en", "events", `${event.slug}.html`)),
  ...guides
    .filter((guide) => approvedGuideSlugs.has(guide.slug))
    .map((guide) => path.join(dist, "en", "guides", `${guide.slug}.html`)),
  ...routes
    .filter((route) => approvedRouteSlugs.has(route.slug))
    .map((route) => path.join(dist, "en", "routes", `${route.slug}.html`))
]);

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

function read(file) {
  try {
    return fs.readFileSync(file, "utf8");
  } catch {
    return "";
  }
}

function collectFiles(dir, predicate, output = []) {
  if (!fs.existsSync(dir)) return output;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) collectFiles(file, predicate, output);
    else if (predicate(file)) output.push(file);
  }
  return output;
}

function relative(file) {
  return path.relative(root, file).replaceAll(path.sep, "/");
}

function fail(message) {
  failures.push(message);
}

if (!compliance) fail("data/adsense-compliance.json is missing or invalid.");
if (!/^pub-\d{16}$/.test(publisherId || "")) fail("AdSense publisher ID is missing or invalid.");
if (!/^ca-pub-\d{16}$/.test(clientId || "")) fail("AdSense client ID is missing or invalid.");

const adsTxt = read(path.join(dist, "ads.txt"));
if (!adsTxt.includes(`google.com, ${publisherId}, DIRECT`)) {
  fail("dist/ads.txt does not match the configured publisher ID.");
}

const privacy = read(path.join(dist, "en", "privacy", "index.html"));
const cookiePolicy = read(path.join(dist, "en", "cookie-policy", "index.html"));
const advertising = read(path.join(dist, "en", "advertising", "index.html"));
for (const [name, html, markers] of [
  ["privacy", privacy, ["Google AdSense", "cookies", "EEA", "Switzerland"]],
  ["cookie policy", cookiePolicy, ["Advertising cookies", "Google-certified consent management platform", "browser"]],
  ["advertising policy", advertising, ["ads cannot buy event inclusion", "Affiliate partners", "contact@kspotnow.com"]]
]) {
  if (!html) {
    fail(`${name} page is missing.`);
    continue;
  }
  const missing = markers.filter((marker) => !html.includes(marker));
  if (missing.length) fail(`${name} page is missing required disclosure: ${missing.join(", ")}.`);
}

const policyFiles = [
  path.join(dist, "en", "privacy", "index.html"),
  path.join(dist, "en", "cookie-policy", "index.html"),
  path.join(dist, "en", "advertising", "index.html"),
  path.join(dist, "en", "terms", "index.html"),
  path.join(dist, "en", "contact", "index.html")
];

let pagesWithAdScript = 0;
let pagesWithManualAds = 0;
for (const file of htmlFiles) {
  const html = read(file);
  const hasAdScript = html.includes("pagead2.googlesyndication.com/pagead/js/adsbygoogle.js");
  const hasManualAds = html.includes('class="adsbygoogle"') || html.includes('class="ad-band');
  const hasAnyAdSignal = hasAdScript || hasManualAds || html.includes("data-ad-client=");
  const noindex = /<meta\s+name="robots"\s+content="[^"]*\bnoindex\b/i.test(html);

  if (hasAdScript) pagesWithAdScript += 1;
  if (hasManualAds) pagesWithManualAds += 1;
  if (hasAnyAdSignal && noindex) fail(`${relative(file)} serves AdSense markup on a noindex page.`);
  if (hasAnyAdSignal && !adEligibleFiles.has(file)) fail(`${relative(file)} serves AdSense markup outside the reviewed content allowlist.`);
  if (hasManualAds && !hasAdScript) fail(`${relative(file)} contains a manual ad unit without the AdSense client script.`);
  if ((html.match(/class="ad-band/g) || []).length > 1) fail(`${relative(file)} contains more than one manual ad band.`);
}

for (const file of policyFiles) {
  const html = read(file);
  if (/adsbygoogle|data-ad-client=|class="ad-band/.test(html)) fail(`${relative(file)} must remain ad-free.`);
}

if (cmpReady) {
  if (!pagesWithAdScript) fail("CMP is marked ready but no reviewed page contains the AdSense client script.");
  if (!privacy.includes("consent is handled through the verified Google-certified consent management platform")) {
    fail("Privacy disclosure does not match the CMP-enabled build state.");
  }
} else {
  if (pagesWithAdScript || pagesWithManualAds) fail("AdSense markup is present before the complete CMP gate is satisfied.");
  if (!privacy.includes("AdSense advertising remains disabled")) {
    fail("Privacy disclosure does not explain the CMP-disabled build state.");
  }
}

if (requireAdsenseReview && !adsTxt.includes(`google.com, ${publisherId}, DIRECT`)) {
  fail("AdSense site-review mode requires a matching ads.txt ownership record.");
}

if (requireAdServing && !cmpReady) {
  fail(`Ad-serving mode requires complete CMP evidence and both release flags. Missing: ${cmpEvidence.missing.join(", ") || "release flags"}.`);
}

if (failures.length) {
  console.error("AdSense compliance validation failed.");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

const state = cmpReady
  ? `enabled with verified ${cmpEvidence.provider} CMP ${cmpEvidence.cmpId}`
  : `held disabled for site review; ad serving is pending ${cmpEvidence.missing.join(", ")}`;
console.log(`AdSense compliance validation passed: ads are ${state}.`);
