import fs from "node:fs/promises";
import fssync from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { configuredAdSenseClientId, configuredAdSensePublisherId } from "./lib/adsense.mjs";
import { affiliatePublishingEnabled, envFlag, publicLanguageCodes } from "./lib/public-languages.mjs";
import { todayString } from "./lib/date.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const today = todayString();
const siteUrl = process.env.SITE_URL || "https://kspotnow.com";
const contactEmail = process.env.CONTACT_EMAIL || "contact@kspotnow.com";
const publisherId = configuredAdSensePublisherId();
const clientId = configuredAdSenseClientId();
const slotId = String(process.env.GOOGLE_ADSENSE_SLOT || process.env.ADSENSE_SLOT || "").trim();
const cmpReady = envFlag(process.env.GOOGLE_ADSENSE_CMP_READY || process.env.ADSENSE_CMP_READY, false);
const strict = !/^(0|false|no)$/i.test(String(process.env.ADSENSE_REPORT_STRICT || "1"));
const languages = publicLanguageCodes();
const affiliateEnabled = affiliatePublishingEnabled();

const events = JSON.parse(await fs.readFile(path.join(root, "data", "events.json"), "utf8"));
const guides = JSON.parse(await fs.readFile(path.join(root, "data", "guides.json"), "utf8"));
const routes = JSON.parse(await fs.readFile(path.join(root, "data", "travel-routes.json"), "utf8"));
const sources = JSON.parse(await fs.readFile(path.join(root, "data", "sources.json"), "utf8"));
const program = JSON.parse(await fs.readFile(path.join(root, "data", "editorial-program.json"), "utf8"));
const thumbnailSources = JSON.parse(await fs.readFile(path.join(root, "data", "thumbnail-sources.json"), "utf8"));
const approvedEvents = events.filter((event) => (program.indexableEvents || []).includes(event.slug) && event.endDate >= today);
const approvedGuides = guides.filter((guide) => (program.indexableGuides || []).includes(guide.slug));
const approvedRoutes = routes.filter((route) => (program.indexableRoutes || []).includes(route.slug));
const checks = [];

function exists(relativePath) {
  return fssync.existsSync(path.join(root, relativePath));
}

function read(relativePath) {
  try {
    return fssync.readFileSync(path.join(root, relativePath), "utf8");
  } catch {
    return "";
  }
}

function statusOf(event) {
  if (event.endDate < today) return "ended";
  if (event.startDate > today) return "upcoming";
  return "live";
}

function add(status, area, item, detail, next = "") {
  checks.push({ status, area, item, detail, next });
}

function pass(area, item, detail) {
  add("pass", area, item, detail);
}

function warn(area, item, detail, next) {
  add("warn", area, item, detail, next);
}

function fail(area, item, detail, next) {
  add("fail", area, item, detail, next);
}

function htmlText(value) {
  return String(value || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function wordCount(value) {
  return (htmlText(value).match(/[A-Za-z0-9][A-Za-z0-9'-]*/g) || []).length;
}

function expectedSitemapPaths() {
  return new Set([
    ...(program.indexableHubs || []),
    ...approvedEvents.map((event) => `/en/events/${event.slug}`),
    ...approvedGuides.map((guide) => `/en/guides/${guide.slug}`),
    ...approvedRoutes.map((route) => `/en/routes/${route.slug}`)
  ]);
}

function sitemapPaths() {
  const xml = read("dist/sitemap.xml");
  return new Set([...xml.matchAll(/<url><loc>https:\/\/kspotnow\.com([^<]+)<\/loc>/g)].map((match) => match[1] || "/"));
}

function eventEvidence(event) {
  return [
    ...(event.audit?.sourceEvidence || []),
    ...(program.eventReviews?.[event.slug]?.sourceEvidence || [])
  ];
}

function eventPageAudit() {
  const failures = [];
  for (const event of approvedEvents) {
    const relative = `dist/en/events/${event.slug}.html`;
    const html = read(relative);
    const requiredMarkers = [
      "compact-event-detail",
      "event-review-section",
      "event-visit-section",
      "event-evidence-section",
      "review-byline",
      "What matters before you go",
      "What we checked"
    ];
    if (!html) {
      failures.push(`${event.slug}:missing-page`);
      continue;
    }
    for (const marker of requiredMarkers) {
      if (!html.includes(marker)) failures.push(`${event.slug}:missing-${marker}`);
    }
    if (/<meta\s+name="robots"\s+content="[^"]*noindex/i.test(html)) failures.push(`${event.slug}:noindex`);
    if (wordCount(html) < 350) failures.push(`${event.slug}:thin-${wordCount(html)}-words`);
  }
  return failures;
}

function guidePageAudit() {
  const failures = [];
  for (const guide of approvedGuides) {
    const relative = `dist/en/guides/${guide.slug}.html`;
    const html = read(relative);
    const structuredSections = guide.sections?.en || [];
    const paragraphWords = structuredSections.flatMap((section) => section.paragraphs || []).join(" ");
    if (!html) failures.push(`${guide.slug}:missing-page`);
    if (!html.includes("guide-byline") || !html.includes("guide-citations")) failures.push(`${guide.slug}:missing-authorship-or-citations`);
    if (structuredSections.length < 4) failures.push(`${guide.slug}:fewer-than-4-sections`);
    if (!Array.isArray(guide.sources) || guide.sources.length < 2) failures.push(`${guide.slug}:fewer-than-2-sources`);
    if (wordCount(paragraphWords) < 280) failures.push(`${guide.slug}:thin-${wordCount(paragraphWords)}-words`);
    if (!guide.method || !guide.reviewedBy || !guide.updatedAt) failures.push(`${guide.slug}:missing-method-or-review`);
  }
  return failures;
}

function imageAudit() {
  const failures = [];
  for (const event of approvedEvents) {
    if (!event.thumbnail || !exists(event.thumbnail)) failures.push(`${event.slug}:missing-image`);
    const imageSource = thumbnailSources[event.slug];
    if (!imageSource) failures.push(`${event.slug}:missing-image-audit`);
    if (event.thumbnail?.endsWith(".svg") || /identity card/i.test(String(imageSource?.kind || ""))) failures.push(`${event.slug}:generated-image-card`);
    if (!/^https?:\/\//i.test(String(imageSource?.sourceImageUrl || ""))) failures.push(`${event.slug}:missing-source-image-url`);
    const html = read(`dist/en/events/${event.slug}.html`);
    if (!html.includes(`src="/${event.thumbnail}"`)) failures.push(`${event.slug}:image-not-rendered`);
  }
  return failures;
}

function runChecks() {
  try {
    const parsed = new URL(siteUrl);
    if (parsed.protocol === "https:" && parsed.hostname === "kspotnow.com") pass("Production", "Canonical domain", siteUrl);
    else fail("Production", "Canonical domain", siteUrl, "Use https://kspotnow.com as SITE_URL.");
  } catch {
    fail("Production", "Canonical domain", siteUrl, "Set a valid production URL.");
  }

  if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contactEmail)) pass("Trust", "Public contact", contactEmail);
  else fail("Trust", "Public contact", contactEmail || "missing", "Set a working public contact address.");

  if (languages.length === 1 && languages[0] === "en") {
    pass("Content", "Public language scope", "English-only review edition; unfinished translations are retired");
  } else {
    fail("Content", "Public language scope", languages.join(", "), "Publish only languages that have completed human editorial review.");
  }

  if (approvedEvents.length >= 12 && approvedEvents.length <= 18) {
    pass("Content", "Curated event catalog", `${approvedEvents.length} current events selected from ${events.length} records`);
  } else {
    fail("Content", "Curated event catalog", `${approvedEvents.length} approved current events`, "Keep a focused 12-18 event review set rather than indexing the full feed.");
  }

  if (approvedGuides.length === 8) pass("Content", "Editorial guides", "8 structured source-backed guides");
  else fail("Content", "Editorial guides", `${approvedGuides.length} approved guides`, "Maintain the eight reviewed guide topics in editorial-program.json.");

  if (approvedRoutes.length >= 5) pass("Content", "Useful route pages", `${approvedRoutes.length} selected routes`);
  else fail("Content", "Useful route pages", `${approvedRoutes.length} selected routes`, "Keep at least five route pages tied to reviewed events.");

  const evidenceFailures = approvedEvents.filter((event) => {
    const review = program.eventReviews?.[event.slug];
    const evidence = eventEvidence(event);
    return !review?.reviewedAt || !review?.reviewedBy || String(review?.visitorDecision || "").length < 120
      || !Array.isArray(review?.foreignerChecks) || review.foreignerChecks.length < 3
      || !evidence.length || evidence.some((item) => !item.url || !Array.isArray(item.mustContain) || item.mustContain.length < 2);
  });
  if (!evidenceFailures.length) pass("Trust", "Event evidence coverage", `${approvedEvents.length}/${approvedEvents.length} events have source tokens, review ownership, and visitor checks`);
  else fail("Trust", "Event evidence coverage", `${approvedEvents.length - evidenceFailures.length}/${approvedEvents.length} complete`, evidenceFailures.map((event) => event.slug).join(", "));

  const eventFailures = eventPageAudit();
  if (!eventFailures.length) pass("Content", "Event page usefulness", `${approvedEvents.length}/${approvedEvents.length} pages include decision, practical plan, evidence, and authorship`);
  else fail("Content", "Event page usefulness", `${eventFailures.length} page issues`, eventFailures.slice(0, 6).join(", "));

  const guideFailures = guidePageAudit();
  if (!guideFailures.length) pass("Content", "Guide originality", `${approvedGuides.length}/${approvedGuides.length} guides have 4 sections, 2+ sources, method, and byline`);
  else fail("Content", "Guide originality", `${guideFailures.length} guide issues`, guideFailures.slice(0, 6).join(", "));

  const expected = expectedSitemapPaths();
  const actual = sitemapPaths();
  const missing = [...expected].filter((item) => !actual.has(item));
  const extra = [...actual].filter((item) => !expected.has(item));
  if (!missing.length && !extra.length && actual.size === expected.size) {
    pass("Search", "Focused sitemap", `${actual.size} approved URLs; no root duplicate, filter, legal, city, or category URLs`);
  } else {
    fail("Search", "Focused sitemap", `${actual.size} URLs; ${missing.length} missing, ${extra.length} extra`, `Missing: ${missing.slice(0, 3).join(", ")}; extra: ${extra.slice(0, 3).join(", ")}`);
  }

  const worker = read("src/worker.js");
  if (worker.includes('url.pathname === "/"') && worker.includes('/en/') && worker.includes("status: 410")) {
    pass("Search", "Legacy URL control", "Root redirects to /en/ and retired translations return 410 after asset lookup");
  } else {
    fail("Search", "Legacy URL control", "Worker redirect/retirement rule incomplete", "Keep one canonical home and explicitly retire removed translations.");
  }

  const imageFailures = imageAudit();
  if (!imageFailures.length) pass("UX", "Approved event visuals", `${approvedEvents.length}/${approvedEvents.length} event pages render a local visual`);
  else fail("UX", "Approved event visuals", `${imageFailures.length} visual issues`, imageFailures.slice(0, 5).join(", "));

  const home = read("dist/en/index.html");
  const homeCards = (home.match(/class="event-card/g) || []).length;
  if (homeCards === 5 && home.includes("home-guide-band")) pass("UX", "Compact home", "5 representative event cards plus reviewed guide entry points");
  else fail("UX", "Compact home", `${homeCards} event cards`, "Keep the home scan short and link to the full reviewed list.");

  const prohibitedCopy = ["For AdSense-safe content", "AdSense-safe", "260+ word", "low-value content fix"];
  const generatedHtml = fssync.readdirSync(path.join(root, "dist", "en"), { recursive: true })
    .filter((item) => String(item).endsWith(".html"))
    .map((item) => read(path.join("dist", "en", String(item))));
  const foundProhibited = prohibitedCopy.filter((phrase) => generatedHtml.some((html) => html.includes(phrase)));
  if (!foundProhibited.length) pass("Content", "Visitor-facing language", "No internal AdSense or word-count language appears in public copy");
  else fail("Content", "Visitor-facing language", foundProhibited.join(", "), "Remove publisher-internal language from public pages.");

  if (publisherId && /^pub-\d{16}$/.test(publisherId) && read("dist/ads.txt").includes(`google.com, ${publisherId}, DIRECT`)) {
    pass("AdSense", "Publisher and ads.txt", `${publisherId} present`);
  } else {
    fail("AdSense", "Publisher and ads.txt", publisherId || "missing", "Build with the verified AdSense publisher ID.");
  }

  if (!cmpReady && !home.includes("adsbygoogle.js") && !home.includes("adsbygoogle")) {
    pass("AdSense", "Client script placement", "Held behind the CMP gate; no ad script or slot is served until CMP is confirmed");
  } else if (cmpReady && clientId && /^ca-pub-\d{16}$/.test(clientId) && home.includes(`client=${clientId}`)) {
    pass("AdSense", "Client script placement", "Present on the approved /en/ home after CMP confirmation");
  } else {
    fail("AdSense", "Client script placement", clientId || "missing", "Keep the AdSense client script on approved indexable pages only.");
  }

  if (!affiliateEnabled && !generatedHtml.some((html) => /kr\.trip\.com\/partners\/ad|coupa\.ng\/cny5Rl/.test(html))) {
    pass("AdSense", "Monetization restraint", "Affiliate widgets are disabled during low-value-content re-review");
  } else {
    warn("AdSense", "Monetization restraint", "Affiliate content is enabled", "Disable affiliate widgets until the AdSense content review is resolved.");
  }

  if (slotId && !/^\d{8,20}$/.test(slotId)) fail("AdSense", "Manual ad slot", "Invalid slot ID", "Use a numeric AdSense unit ID.");
  else if (slotId) pass("AdSense", "Manual ad slot", slotId);
  else warn("AdSense", "Manual ad slot", "Not configured", "This is not a content-review blocker; add units only after approval if desired.");

  const sourceRefresh = exists("dist/source-refresh.json") ? JSON.parse(read("dist/source-refresh.json")) : null;
  if (sourceRefresh?.generatedAt && Number(sourceRefresh.counts?.auditedSources || 0) >= 20) {
    pass("Operations", "Source monitor", `${sourceRefresh.counts.auditedSources} registered sources audited`);
  } else {
    warn("Operations", "Source monitor", "Refresh summary is missing or shallow", "Run source:refresh after the editorial release, but keep automatic publishing behind review.");
  }

  if (sources.length >= 20) pass("Operations", "Official source registry", `${sources.length} sources registered`);
  else warn("Operations", "Official source registry", `${sources.length} sources`, "Expand only with primary sources that can be reviewed reliably.");
}

function escapeMd(value) {
  return String(value || "").replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}

function markdownTable(rows) {
  return `| Status | Area | Item | Detail | Next |\n| --- | --- | --- | --- | --- |\n${rows.map((row) => `| ${row.status} | ${escapeMd(row.area)} | ${escapeMd(row.item)} | ${escapeMd(row.detail)} | ${escapeMd(row.next)} |`).join("\n")}`;
}

runChecks();

const passed = checks.filter((item) => item.status === "pass").length;
const warned = checks.filter((item) => item.status === "warn").length;
const failed = checks.filter((item) => item.status === "fail").length;
const result = {
  generatedAt: new Date().toISOString(),
  siteUrl,
  scope: "Internal editorial release gates; not a Google approval prediction",
  stats: {
    totalEventRecords: events.length,
    approvedCurrentEvents: approvedEvents.length,
    approvedGuides: approvedGuides.length,
    approvedRoutes: approvedRoutes.length,
    sitemapUrls: sitemapPaths().size,
    publicLanguages: languages
  },
  score: {
    passed,
    warned,
    failed,
    percent: Math.round((passed / Math.max(checks.length, 1)) * 100)
  },
  checks
};

const feedDir = path.join(root, "data", "feeds");
await fs.mkdir(feedDir, { recursive: true });
const jsonOut = path.join(feedDir, `adsense-readiness-${today}.json`);
const mdOut = path.join(feedDir, `adsense-readiness-${today}.md`);
await fs.writeFile(jsonOut, `${JSON.stringify(result, null, 2)}\n`, "utf8");
await fs.writeFile(mdOut, `# AdSense Editorial Release Gates

Generated: ${result.generatedAt}

Site: ${siteUrl}

Scope: **${result.scope}**

Gate result: ${failed ? "BLOCKED" : "PASS"} (${passed} pass, ${warned} warning, ${failed} fail)

## Review Scope

- Approved current events: ${result.stats.approvedCurrentEvents}
- Approved guides: ${result.stats.approvedGuides}
- Approved routes: ${result.stats.approvedRoutes}
- Sitemap URLs: ${result.stats.sitemapUrls}
- Public languages: ${result.stats.publicLanguages.join(", ")}

## Checks

${markdownTable(checks)}

## Blocking Actions

${checks.filter((item) => item.status === "fail").map((item) => `- ${item.area} / ${item.item}: ${item.next || item.detail}`).join("\n") || "- No internal release blocker. Google may still reject the site based on signals outside this audit."}
`, "utf8");

console.log(`AdSense editorial gates: ${failed ? "BLOCKED" : "PASS"} (${passed} pass, ${warned} warn, ${failed} fail)`);
console.table(checks.map((item) => ({ status: item.status, area: item.area, item: item.item, detail: item.detail })));
console.log(`Saved gate report: ${mdOut}`);

if (strict && failed) process.exitCode = 1;
