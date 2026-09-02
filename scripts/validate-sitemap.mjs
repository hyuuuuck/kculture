import fs from "node:fs";
import path from "node:path";
import { todayString } from "./lib/date.mjs";

const root = process.cwd();
const sitemapPath = path.join(root, "dist", "sitemap.xml");
const events = JSON.parse(fs.readFileSync(path.join(root, "data", "events.json"), "utf8"));
const guides = JSON.parse(fs.readFileSync(path.join(root, "data", "guides.json"), "utf8"));
const routes = JSON.parse(fs.readFileSync(path.join(root, "data", "travel-routes.json"), "utf8"));
const program = JSON.parse(fs.readFileSync(path.join(root, "data", "editorial-program.json"), "utf8"));
const today = todayString();
const errors = [];
const approvedEvents = events.filter((event) => (program.indexableEvents || []).includes(event.slug) && event.endDate >= today);
const approvedGuides = guides.filter((guide) => (program.indexableGuides || []).includes(guide.slug));
const approvedRoutes = routes.filter((route) => (program.indexableRoutes || []).includes(route.slug));
const expectedPaths = new Set([
  ...(program.indexableHubs || []),
  ...approvedEvents.map((event) => `/en/events/${event.slug}`),
  ...approvedGuides.map((guide) => `/en/guides/${guide.slug}`),
  ...approvedRoutes.map((route) => `/en/routes/${route.slug}`)
]);

function validateGeneratedCanonical(kind, slug) {
  const file = path.join(root, "dist", "en", kind, `${slug}.html`);
  const expected = `https://kspotnow.com/en/${kind}/${slug}`;
  if (!fs.existsSync(file)) {
    errors.push(`dist/en/${kind}/${slug}.html is missing.`);
    return;
  }
  const html = fs.readFileSync(file, "utf8");
  if (!html.includes(`<link rel="canonical" href="${expected}">`)) {
    errors.push(`dist/en/${kind}/${slug}.html canonical must be the final non-redirecting URL ${expected}.`);
  }
  if (new RegExp(`(?:href|content)="/en/${kind}/${slug}\\.html"`).test(html)) {
    errors.push(`dist/en/${kind}/${slug}.html still exposes a redirecting .html URL.`);
  }
}

function generatedFileForPublicPath(publicPath) {
  const clean = publicPath.replace(/^\/+|\/+$/g, "");
  return publicPath.endsWith("/")
    ? path.join(root, "dist", clean, "index.html")
    : path.join(root, "dist", `${clean}.html`);
}

if (!fs.existsSync(sitemapPath)) {
  errors.push("dist/sitemap.xml is missing. Run npm run build first.");
} else {
  const xml = fs.readFileSync(sitemapPath, "utf8");
  if (!xml.includes('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"')) errors.push("sitemap.xml is missing the sitemap namespace.");
  if (!xml.includes('xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"')) errors.push("sitemap.xml is missing the image sitemap namespace.");

  const invalidChar = xml.match(/[^\u0009\u000a\u000d\u0020-\ud7ff\ue000-\ufffd]/u);
  if (invalidChar) errors.push(`sitemap.xml contains an invalid XML character near index ${invalidChar.index}.`);

  const actualPaths = new Set([...xml.matchAll(/<url><loc>https:\/\/kspotnow\.com([^<]+)<\/loc>/g)].map((match) => match[1] || "/"));
  const missing = [...expectedPaths].filter((item) => !actualPaths.has(item));
  const extra = [...actualPaths].filter((item) => !expectedPaths.has(item));
  if (missing.length) errors.push(`sitemap.xml is missing approved paths: ${missing.slice(0, 8).join(", ")}.`);
  if (extra.length) errors.push(`sitemap.xml contains non-approved paths: ${extra.slice(0, 8).join(", ")}.`);
  if (actualPaths.size !== expectedPaths.size) errors.push(`sitemap.xml should contain ${expectedPaths.size} URLs; found ${actualPaths.size}.`);
  if (actualPaths.has("/")) errors.push("sitemap.xml must not contain the redirecting root URL.");
  const redirectingDetailUrls = [...actualPaths].filter((item) => /^\/en\/(events|guides|routes)\/[^/]+\.html$/.test(item));
  if (redirectingDetailUrls.length) errors.push(`sitemap.xml contains redirecting .html detail URLs: ${redirectingDetailUrls.slice(0, 8).join(", ")}.`);
  const noindexUrls = [...actualPaths].filter((item) => {
    const file = generatedFileForPublicPath(item);
    if (!fs.existsSync(file)) return false;
    return /<meta\s+name="robots"\s+content="[^"]*\bnoindex\b/i.test(fs.readFileSync(file, "utf8"));
  });
  if (noindexUrls.length) errors.push(`sitemap.xml contains noindex URLs: ${noindexUrls.slice(0, 8).join(", ")}.`);

  const imageCount = (xml.match(/<image:image>/g) || []).length;
  if (imageCount !== approvedEvents.length) errors.push(`sitemap.xml should contain ${approvedEvents.length} approved event image entries; found ${imageCount}.`);

  for (const event of approvedEvents) {
    const review = program.eventReviews?.[event.slug] || {};
    const reviewDate = [review.publishedAt, review.updatedAt, event.updatedAt, review.reviewedAt, event.lastChecked]
      .filter((value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value || "")))
      .sort()
      .at(-1);
    const pattern = new RegExp(`<loc>https://kspotnow\\.com/en/events/${event.slug}</loc><lastmod>${reviewDate}</lastmod>`);
    if (!pattern.test(xml)) errors.push(`${event.slug} sitemap lastmod must match latest editorial or source-check date ${reviewDate}.`);
  }
  for (const guide of approvedGuides) {
    const expectedDate = guide.updatedAt || guide.publishedAt;
    const pattern = new RegExp(`<loc>https://kspotnow\\.com/en/guides/${guide.slug}</loc><lastmod>${expectedDate}</lastmod>`);
    if (!pattern.test(xml)) errors.push(`${guide.slug} sitemap lastmod must match guide update date ${expectedDate}.`);
  }
}

for (const event of approvedEvents) validateGeneratedCanonical("events", event.slug);
for (const guide of approvedGuides) validateGeneratedCanonical("guides", guide.slug);
for (const route of approvedRoutes) validateGeneratedCanonical("routes", route.slug);

if (errors.length) {
  console.error("Sitemap validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Sitemap validation passed: ${expectedPaths.size} approved URLs and ${approvedEvents.length} event image entries.`);
