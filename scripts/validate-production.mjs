import fs from "node:fs";
import path from "node:path";
import { adSenseCmpEvidenceStatus, configuredAdSenseClientId, configuredAdSenseCmpReady, configuredAdSensePublisherId } from "./lib/adsense.mjs";
import { publicLanguageCodes } from "./lib/public-languages.mjs";
import { todayString } from "./lib/date.mjs";

const requireAdsenseReview = process.argv.includes("--require-adsense-review")
  || process.argv.includes("--require-adsense")
  || process.env.REQUIRE_ADSENSE_REVIEW === "1"
  || process.env.REQUIRE_ADSENSE === "1";
const requireAdServing = process.argv.includes("--require-ad-serving")
  || process.env.REQUIRE_AD_SERVING === "1";
const allowPlatformSubdomain = process.env.ALLOW_PLATFORM_SUBDOMAIN === "1";
const siteUrl = process.env.SITE_URL || "https://kspotnow.com";
const contactEmail = process.env.CONTACT_EMAIL || "contact@kspotnow.com";
const today = todayString();
const adsenseCompliance = readJsonIfExists(path.resolve("data", "adsense-compliance.json"));
const cmpEvidence = adSenseCmpEvidenceStatus(adsenseCompliance, today);
const publisherId = configuredAdSensePublisherId();
const clientId = configuredAdSenseClientId();
const slotId = String(process.env.GOOGLE_ADSENSE_SLOT || process.env.ADSENSE_SLOT || "").trim();
const googleSiteVerification = normalizeGoogleSiteVerification(process.env.GOOGLE_SITE_VERIFICATION || "");
const adsenseCmpReady = configuredAdSenseCmpReady(process.env, adsenseCompliance, today);
const events = JSON.parse(fs.readFileSync(path.resolve("data", "events.json"), "utf8"));
const guides = JSON.parse(fs.readFileSync(path.resolve("data", "guides.json"), "utf8"));
const editorialProgram = JSON.parse(fs.readFileSync(path.resolve("data", "editorial-program.json"), "utf8"));
const sources = JSON.parse(fs.readFileSync(path.resolve("data", "sources.json"), "utf8"));
const errors = [];
const warnings = [];
const languages = publicLanguageCodes();
const requiredPolicyPages = ["about", "contact", "privacy", "cookie-policy", "advertising", "terms", "editorial-policy", "corrections", "planner"];
const eventStatusBySlug = new Map(events.map((event) => [event.slug, event.endDate < today ? "ended" : event.startDate > today ? "upcoming" : "live"]));
const approvedEventSlugs = new Set(editorialProgram.indexableEvents || []);
const approvedGuideSlugs = new Set(editorialProgram.indexableGuides || []);
const approvedRouteSlugs = new Set(editorialProgram.indexableRoutes || []);

function normalizeGoogleSiteVerification(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  const contentMatch = trimmed.match(/content=["']([^"']+)["']/i);
  return contentMatch ? contentMatch[1].trim() : trimmed.replace(/^["']|["']$/g, "");
}

function envFlag(value) {
  return /^(1|true|yes)$/i.test(String(value || "").trim());
}

function fail(message) {
  errors.push(message);
}

function warn(message) {
  warnings.push(message);
}

function readJsonIfExists(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

function readTextIfExists(file) {
  try {
    return fs.readFileSync(file, "utf8");
  } catch {
    return "";
  }
}

function requireFile(relativePath) {
  const file = path.join(dist, relativePath);
  if (!fs.existsSync(file)) fail(`dist/${relativePath} is missing. Run npm run build first.`);
  return file;
}

function manualAdSlotFiles() {
  const approvedEvent = events.find((event) => approvedEventSlugs.has(event.slug) && event.endDate >= today);
  const approvedGuide = guides.find((guide) => approvedGuideSlugs.has(guide.slug));
  return [
    path.join("en", "index.html"),
    path.join("en", "events", `${approvedEvent?.slug || ""}.html`),
    path.join("en", "guides", `${approvedGuide?.slug || ""}.html`)
  ].filter((relativePath) => !relativePath.includes("undefined") && fs.existsSync(path.join(dist, relativePath)));
}

function collectFiles(dir, predicate, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) collectFiles(file, predicate, out);
    else if (predicate(file)) out.push(file);
  }
  return out;
}

try {
  const parsed = new URL(siteUrl);
  if (parsed.protocol !== "https:") fail("SITE_URL must use https.");
  if (["example.com", "your-domain.com", "localhost", "127.0.0.1"].includes(parsed.hostname)) fail("SITE_URL must be the real production domain.");
  if (!allowPlatformSubdomain && /\.(pages\.dev|netlify\.app|vercel\.app|github\.io)$/i.test(parsed.hostname)) {
    fail("SITE_URL should be a custom domain for AdSense review, not a platform preview subdomain. Set ALLOW_PLATFORM_SUBDOMAIN=1 only for non-AdSense preview deploys.");
  }
} catch {
  fail("SITE_URL must be set to the real production URL, for example https://example.kr.");
}

if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contactEmail)) {
  fail("CONTACT_EMAIL must be set to a real contact email.");
} else if (contactEmail === "hello@example.com") {
  fail("CONTACT_EMAIL must not be the placeholder hello@example.com.");
}

if (publisherId && !/^pub-\d{16}$/.test(publisherId)) {
  fail("GOOGLE_ADSENSE_PUBLISHER_ID must look like pub-0000000000000000.");
}

if (clientId && !/^ca-pub-\d{16}$/.test(clientId)) {
  fail("GOOGLE_ADSENSE_CLIENT must look like ca-pub-0000000000000000.");
}

if (slotId && !/^\d{8,20}$/.test(slotId)) {
  fail("GOOGLE_ADSENSE_SLOT must be the numeric ad slot ID from an AdSense ad unit.");
}

if ((requireAdsenseReview || requireAdServing) && !publisherId) {
  fail("GOOGLE_ADSENSE_PUBLISHER_ID is required for AdSense site review or ad serving.");
}

if (requireAdServing && !adsenseCmpReady) {
  fail(`Ad serving requires both CMP environment flags and a complete data/adsense-compliance.json record. Missing evidence: ${cmpEvidence.missing.join(", ") || "release flags"}.`);
} else if ((publisherId || clientId || slotId) && !adsenseCmpReady) {
  warn(`AdSense site ownership can be verified through ads.txt while ads remain disabled. Ad serving still requires CMP evidence and release flags. Missing evidence: ${cmpEvidence.missing.join(", ") || "release flags"}.`);
}

const currentEventPages = events.filter((event) => approvedEventSlugs.has(event.slug) && event.endDate >= today).length;
const approvedGuidePages = guides.filter((guide) => approvedGuideSlugs.has(guide.slug)).length;
if (!currentEventPages) fail("At least one current, explicitly reviewed event page is required for the live event product.");
if (!approvedGuidePages) fail("At least one source-backed editorial guide is required for the visitor guidance product.");

const root = path.resolve(".");
const dist = path.join(root, "dist");
const distIndex = path.join(dist, "index.html");
if (!fs.existsSync(distIndex)) {
  fail("dist/index.html is missing. Run npm run build first.");
}

for (const required of [
  "index.html",
  "sitemap.xml",
  "robots.txt",
  "events.ics",
  "feed.xml",
  "latest.json",
  "recheck.json",
  "source-refresh.json",
  "_headers"
]) {
  requireFile(required);
}

const headersText = readTextIfExists(path.join(dist, "_headers"));
if (!headersText.includes("Content-Type: text/html; charset=utf-8")) {
  fail("dist/_headers must set text/html; charset=utf-8 so multilingual pages are not misdecoded.");
}
for (const pattern of ["/", "/*.html", "/*/*.html", "/*/*/*.html", "/*/", "/*/*/", "/*/*/*/"]) {
  if (!headersText.includes(`${pattern}\n  Content-Type: text/html; charset=utf-8`)) {
    fail(`dist/_headers is missing UTF-8 HTML content type for ${pattern}.`);
  }
}
if (!headersText.includes("Strict-Transport-Security:")) {
  fail("dist/_headers must send Strict-Transport-Security on production responses.");
}
if (!headersText.includes("Content-Security-Policy:")) {
  fail("dist/_headers must send a Content-Security-Policy that allows AdSense domains.");
}
if (!headersText.includes("https://kr.trip.com") || !headersText.includes("https://*.trip.com")) {
  fail("dist/_headers CSP frame-src must allow the Trip.com sponsored iframe.");
}
if (!headersText.includes("https://coupa.ng") || !headersText.includes("https://ads-partners.coupang.com")) {
  fail("dist/_headers CSP frame-src must allow the Coupang Partners sponsored iframe.");
}
if (!fs.existsSync(path.join(dist, ".well-known", "security.txt"))) {
  fail("dist/.well-known/security.txt is missing. Run npm run build.");
}
const workerSource = readTextIfExists(path.join(root, "src", "worker.js"));
if (!workerSource.includes("Response.redirect") || !workerSource.includes("www.")) {
  fail("src/worker.js must 301 plain-HTTP and www requests to the canonical HTTPS host.");
}
const wranglerText = readTextIfExists(path.join(root, "wrangler.toml"));
const workerText = readTextIfExists(path.join(root, "src", "worker.js"));
if (!wranglerText.includes('main = "src/worker.js"') || !wranglerText.includes('binding = "ASSETS"') || !wranglerText.includes("run_worker_first = true")) {
  fail("wrangler.toml must route asset requests through src/worker.js so HTML responses keep UTF-8 headers.");
}
if (!workerText.includes("env.ASSETS.fetch") || !workerText.includes("text/html; charset=utf-8")) {
  fail("src/worker.js must fetch static assets and force text/html; charset=utf-8 for multilingual pages.");
}
if (!workerText.includes('url.pathname.endsWith(".html")') || !workerText.includes("retiredBrowsePath")
    || !workerText.includes("retiredOperationsPath") || !workerText.includes("retiredEditorialPath")) {
  fail("src/worker.js must collapse .html duplicates and retire removed browse, operations, and editorial URLs.");
}

for (const lang of languages) {
  for (const page of requiredPolicyPages) {
    requireFile(path.join(lang, page, "index.html"));
  }
}

const keyFiles = [
  distIndex,
  path.join(dist, "robots.txt"),
  path.join(dist, "sitemap.xml"),
  path.join(dist, "feed.xml"),
  path.join(dist, "latest.json"),
  path.join(dist, "recheck.json"),
  path.join(dist, "source-refresh.json")
];
for (const lang of languages) {
  for (const page of ["contact", "privacy", "cookie-policy", "advertising", "about", "terms"]) {
    keyFiles.push(path.join(dist, lang, page, "index.html"));
  }
}

for (const file of keyFiles) {
  const text = readTextIfExists(file);
  if (text.includes("https://example.com") || text.includes("your-domain.com")) {
    fail(`${path.relative(dist, file)} still contains a placeholder domain. Rebuild with SITE_URL set.`);
  }
  if (text.includes("hello@example.com")) {
    fail(`${path.relative(dist, file)} still contains the placeholder contact email. Rebuild with CONTACT_EMAIL set.`);
  }
  if (/should be updated|TODO|lorem ipsum/i.test(text)) {
    fail(`${path.relative(dist, file)} contains unfinished placeholder copy.`);
  }
}

const generatedHtmlFiles = collectFiles(dist, (file) => file.endsWith(".html"));
const indexableRelativeFiles = new Set([
  ...(editorialProgram.indexableHubs || []).map((url) => `${url.replace(/^\//, "")}index.html`),
  ...events.filter((event) => approvedEventSlugs.has(event.slug) && event.endDate >= today).map((event) => `en/events/${event.slug}.html`),
  ...(editorialProgram.indexableGuides || []).map((slug) => `en/guides/${slug}.html`),
  ...(editorialProgram.indexableRoutes || []).map((slug) => `en/routes/${slug}.html`)
]);
for (const file of generatedHtmlFiles) {
  const text = readTextIfExists(file);
  const relative = path.relative(dist, file).replaceAll(path.sep, "/");
  const hasNoindex = /<meta\s+name=["']robots["']\s+content=["'][^"']*noindex/i.test(text);
  if (indexableRelativeFiles.has(relative) && hasNoindex) {
    fail(`${relative} is approved for the editorial sitemap but contains a noindex robots meta tag.`);
  }
}

const robotsText = readTextIfExists(path.join(dist, "robots.txt"));
if (siteUrl && !robotsText.includes(`Sitemap: ${siteUrl}/sitemap.xml`)) {
  fail("dist/robots.txt must point to the production sitemap URL.");
}

const sitemapText = readTextIfExists(path.join(dist, "sitemap.xml"));
if (siteUrl && !sitemapText.includes(`<loc>${siteUrl}/`)) {
  fail("dist/sitemap.xml does not contain production SITE_URL loc entries.");
}

const editorialHome = path.join(dist, "en", "index.html");
if (fs.existsSync(editorialHome)) {
  const home = readTextIfExists(editorialHome);
  if (siteUrl && !home.includes(`<link rel="canonical" href="${siteUrl}/en/">`)) {
    fail("dist/en/index.html does not contain the editorial home canonical URL.");
  }
}

const sourceRefreshFile = path.join(dist, "source-refresh.json");
const sourceRefresh = readJsonIfExists(sourceRefreshFile);
if (!sourceRefresh) {
  fail("dist/source-refresh.json is missing or invalid. Run npm run build after a source refresh summary exists.");
} else if (!sourceRefresh.generatedAt || Number(sourceRefresh.counts?.auditedSources || 0) < Math.min(20, sources.length)) {
  fail("dist/source-refresh.json does not contain a useful latest source refresh summary. Run npm run source:refresh before an AdSense application.");
}

if (publisherId) {
  const adsTxt = path.join(dist, "ads.txt");
  if (!fs.existsSync(adsTxt)) {
    fail("dist/ads.txt is missing even though a publisher ID was provided. Run npm run build with the same environment.");
  } else {
    const text = fs.readFileSync(adsTxt, "utf8");
    if (!text.includes(`google.com, ${publisherId}, DIRECT`)) fail("dist/ads.txt does not contain the configured publisher ID.");
  }
} else {
  warn("AdSense publisher ID is not set. This is fine before approval, but not ready for AdSense launch.");
}

if (clientId && fs.existsSync(editorialHome)) {
  const home = fs.readFileSync(editorialHome, "utf8");
  if (adsenseCmpReady && !home.includes(`client=${clientId}`)) fail("AdSense client script was not found in dist/en/index.html after CMP confirmation.");
  if (!adsenseCmpReady && home.includes("adsbygoogle")) fail("AdSense markup must remain disabled until both CMP readiness and human evidence flags are set.");
  if (adsenseCmpReady && slotId) {
    const missingSlotFiles = manualAdSlotFiles().filter((relativePath) => !readTextIfExists(path.join(dist, relativePath)).includes(`data-ad-slot="${slotId}"`));
    if (missingSlotFiles.length) fail(`Manual AdSense slot was not found in checked pages: ${missingSlotFiles.join(", ")}.`);
  }
} else if (slotId) {
  fail("GOOGLE_ADSENSE_SLOT requires GOOGLE_ADSENSE_CLIENT or GOOGLE_ADSENSE_PUBLISHER_ID.");
}

if (googleSiteVerification) {
  if (!/^[A-Za-z0-9._:+/=-]{8,300}$/.test(googleSiteVerification)) {
    fail("GOOGLE_SITE_VERIFICATION should be the Search Console meta content token, or the full meta tag copied from Search Console.");
  } else if (fs.existsSync(distIndex)) {
    const home = fs.readFileSync(distIndex, "utf8");
    if (!home.includes(`name="google-site-verification"`) || !home.includes(`content="${googleSiteVerification}"`)) {
      fail("Search Console verification meta tag was not found in dist/index.html.");
    }
  }
} else {
  warn("GOOGLE_SITE_VERIFICATION is not set. DNS verification is fine, but meta verification will not be available in the deployed HTML.");
}

if (warnings.length) {
  console.warn("Production preflight warnings:");
  for (const item of warnings) console.warn(`- ${item}`);
}

if (errors.length) {
  console.error("Production preflight failed:");
  for (const item of errors) console.error(`- ${item}`);
  process.exit(1);
}

const preflightScope = requireAdServing
  ? "Ad-serving"
  : requireAdsenseReview
    ? "AdSense site-review"
    : "Production";
console.log(`${preflightScope} preflight passed.`);
