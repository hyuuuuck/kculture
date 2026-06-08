import fs from "node:fs";
import path from "node:path";

const requireAdsense = process.argv.includes("--require-adsense") || process.env.REQUIRE_ADSENSE === "1";
const siteUrl = process.env.SITE_URL || "";
const contactEmail = process.env.CONTACT_EMAIL || "";
const publisherId = normalizePublisherId(process.env.GOOGLE_ADSENSE_PUBLISHER_ID || process.env.ADSENSE_PUBLISHER_ID || "");
const clientId = normalizeAdSenseClientId(process.env.GOOGLE_ADSENSE_CLIENT || process.env.ADSENSE_CLIENT || publisherId);
const errors = [];
const warnings = [];

function normalizePublisherId(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  if (/^ca-pub-\d{16}$/.test(trimmed)) return trimmed.replace("ca-", "");
  if (/^pub-\d{16}$/.test(trimmed)) return trimmed;
  return trimmed;
}

function normalizeAdSenseClientId(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  if (/^pub-\d{16}$/.test(trimmed)) return `ca-${trimmed}`;
  return trimmed;
}

function fail(message) {
  errors.push(message);
}

function warn(message) {
  warnings.push(message);
}

try {
  const parsed = new URL(siteUrl);
  if (parsed.protocol !== "https:") fail("SITE_URL must use https.");
  if (["example.com", "your-domain.com", "localhost", "127.0.0.1"].includes(parsed.hostname)) fail("SITE_URL must be the real production domain.");
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

if (requireAdsense && !publisherId) {
  fail("GOOGLE_ADSENSE_PUBLISHER_ID is required for AdSense preflight.");
}

const dist = path.resolve("dist");
const distIndex = path.join(dist, "index.html");
if (!fs.existsSync(distIndex)) {
  fail("dist/index.html is missing. Run npm run build first.");
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

if (clientId && fs.existsSync(distIndex)) {
  const home = fs.readFileSync(distIndex, "utf8");
  if (!home.includes(`client=${clientId}`)) fail("AdSense client script was not found in dist/index.html.");
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

console.log("Production preflight passed.");
