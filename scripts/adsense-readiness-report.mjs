import fs from "node:fs/promises";
import fssync from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { todayString } from "./lib/date.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const today = todayString();
const dayMs = 24 * 60 * 60 * 1000;
const strict = process.argv.includes("--strict") || process.env.ADSENSE_READINESS_STRICT === "1";

const siteUrl = process.env.SITE_URL || "";
const contactEmail = process.env.CONTACT_EMAIL || "";
const publisherId = normalizePublisherId(process.env.GOOGLE_ADSENSE_PUBLISHER_ID || process.env.ADSENSE_PUBLISHER_ID || "");
const clientId = normalizeAdSenseClientId(process.env.GOOGLE_ADSENSE_CLIENT || process.env.ADSENSE_CLIENT || publisherId);
const slotId = String(process.env.GOOGLE_ADSENSE_SLOT || process.env.ADSENSE_SLOT || "").trim();
const googleSiteVerification = normalizeGoogleSiteVerification(process.env.GOOGLE_SITE_VERIFICATION || "");
const adsenseCmpReady = envFlag(process.env.GOOGLE_ADSENSE_CMP_READY || process.env.ADSENSE_CMP_READY || "");

const events = JSON.parse(await fs.readFile(path.join(root, "data", "events.json"), "utf8"));
const guides = JSON.parse(await fs.readFile(path.join(root, "data", "guides.json"), "utf8"));
const sources = JSON.parse(await fs.readFile(path.join(root, "data", "sources.json"), "utf8"));
const curationQueue = await fs.readFile(path.join(root, "data", "curation-queue.json"), "utf8")
  .then(JSON.parse)
  .catch(() => []);
const languages = ["en", "es", "zh", "pt", "ru", "ja", "fr", "de"];
const eventRichResultCategories = new Set(["festival", "kpop"]);
const sourceCoverageBuckets = [
  { id: "tourism-festivals", minSources: 12, pattern: /\b(tourism|tourist|visitkorea|tourapi|festival|visit seoul|visit jeju|busan|incheon|daegu|boryeong|andong|jinju|coex|ddp)\b/i },
  { id: "government-culture", minSources: 4, pattern: /\b(ministry|mcst|government|policy briefing|culture portal|culture|metropolitan government|kofice)\b/i },
  { id: "sale-shopping", minSources: 4, pattern: /\b(korea grand sale|korea sale festa|shopping|sale|retail|benefits|promotion)\b/i },
  { id: "beauty-olive-young", minSources: 2, pattern: /\b(olive young|beauty|cosmetic|cj olive)\b/i },
  { id: "duty-free", minSources: 4, pattern: /\b(duty free|duty-free|dfs|shilla|lottedfs|shinsegaedf)\b/i },
  { id: "department-store", minSources: 5, pattern: /\b(department store|lotte department|hyundai department|shinsegae department|galleria|ak plaza|e-hyundai|ehyundai)\b/i },
  { id: "kpop-popups", minSources: 8, pattern: /\b(k-pop|kpop|pop-up|popup|weverse|fans shop|smtown|yg select|nol world|artist|fan|merch)\b/i },
  { id: "ticketing", minSources: 4, pattern: /\b(ticket|ticketing|yes24|ticketlink|melon ticket|nol world|reservation)\b/i },
  { id: "weather", minSources: 1, pattern: /\b(weather|meteorological|kma|asos|temperature|precipitation)\b/i }
];
const sourceAutomationStatuses = new Set(["ready-with-api-key", "planned-api", "monitor-and-curate"]);

const checks = [];

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

function normalizeGoogleSiteVerification(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  const contentMatch = trimmed.match(/content=["']([^"']+)["']/i);
  return contentMatch ? contentMatch[1].trim() : trimmed.replace(/^["']|["']$/g, "");
}

function envFlag(value) {
  return /^(1|true|yes)$/i.test(String(value || "").trim());
}

function exists(relativePath) {
  return fssync.existsSync(path.join(root, relativePath));
}

function htmlEsc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function readJson(relativePath) {
  try {
    return JSON.parse(fssync.readFileSync(path.join(root, relativePath), "utf8"));
  } catch {
    return null;
  }
}

function structuredEventStats() {
  const missing = [];
  let ok = 0;
  for (const lang of languages) {
    for (const event of events) {
      const relativePath = `dist/${lang}/events/${event.slug}.html`;
      const file = path.join(root, relativePath);
      if (!fssync.existsSync(file)) {
        missing.push(relativePath);
        continue;
      }
      const html = fssync.readFileSync(file, "utf8");
      const shouldUseEventSchema = eventRichResultCategories.has(event.category);
      const hasExpectedDetailSchema = shouldUseEventSchema
        ? html.includes("\"@type\":\"Event\"") && html.includes("\"mainEntityOfPage\"")
        : html.includes("\"@type\":\"WebPage\"") && html.includes("\"primaryImageOfPage\"");
      if (hasExpectedDetailSchema && html.includes("\"@type\":\"BreadcrumbList\"")) {
        ok += 1;
      } else {
        missing.push(relativePath);
      }
    }
  }
  return {
    expected: events.length * languages.length,
    ok,
    missing
  };
}

function manualAdSlotStats(slotId) {
  const checks = [
    "dist/index.html",
    `dist/en/events/${events[0]?.slug || ""}.html`,
    `dist/en/guides/${guides[0]?.slug || ""}.html`
  ].filter((relativePath) => !relativePath.includes("undefined") && exists(relativePath));
  const ok = checks.filter((relativePath) => fssync.readFileSync(path.join(root, relativePath), "utf8").includes(`data-ad-slot="${slotId}"`));
  return {
    expected: checks.length,
    ok: ok.length,
    missing: checks.filter((relativePath) => !ok.includes(relativePath))
  };
}

function recognizedImage(file) {
  try {
    const buffer = fssync.readFileSync(file);
    return (
      (buffer.length >= 4 && buffer[0] === 0xff && buffer[1] === 0xd8) ||
      (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) ||
      (buffer.length >= 12 && buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP") ||
      buffer.subarray(0, Math.min(buffer.length, 512)).toString("utf8").includes("<svg")
    );
  } catch {
    return false;
  }
}

function thumbnailStats() {
  const missing = [];
  const invalid = [];
  const generatedFallbacks = [];
  for (const event of events) {
    if (!event.thumbnail) {
      missing.push(event.slug);
      continue;
    }
    const file = path.join(root, event.thumbnail);
    if (!fssync.existsSync(file)) missing.push(event.slug);
    else if (!recognizedImage(file)) invalid.push(event.slug);
    if (!String(event.thumbnail).includes("/official/")) generatedFallbacks.push(event.slug);
  }
  return {
    expected: events.length,
    ok: events.length - missing.length - invalid.length,
    missing,
    invalid,
    generatedFallbacks
  };
}

function calendarStats() {
  const missingPages = [];
  const missingLinks = [];
  for (const lang of languages) {
    const relativePath = `dist/${lang}/calendar/index.html`;
    if (!exists(relativePath)) {
      missingPages.push(lang);
      continue;
    }
    const html = fssync.readFileSync(path.join(root, relativePath), "utf8");
    for (const event of events) {
      if (!html.includes(`href="/${lang}/events/${event.slug}.html"`)) missingLinks.push(`${lang}:${event.slug}`);
    }
  }
  const icsBlocks = exists("dist/events.ics")
    ? (fssync.readFileSync(path.join(root, "dist", "events.ics"), "utf8").match(/BEGIN:VEVENT/g) || []).length
    : 0;
  return {
    expectedPages: languages.length,
    presentPages: languages.length - missingPages.length,
    expectedLinks: languages.length * events.length,
    presentLinks: languages.length * events.length - missingLinks.length,
    expectedIcsBlocks: events.length,
    icsBlocks,
    missingPages,
    missingLinks
  };
}

function detailPlanningStats() {
  const missing = [];
  for (const lang of languages) {
    for (const event of events) {
      const relativePath = `dist/${lang}/events/${event.slug}.html`;
      if (!exists(relativePath)) {
        missing.push(`${lang}:${event.slug}:page`);
        continue;
      }
      const html = fssync.readFileSync(path.join(root, relativePath), "utf8");
      const requiredSignals = [
        htmlEsc(event.sourceUrl),
        `/events/${event.slug}.ics`,
        "data-save-event",
        "Previous-year monthly baseline",
        "www.google.com/maps/search",
        "map.naver.com",
        "map.kakao.com",
        `/${lang}/routes/`,
        `/${lang}/guides/`
      ];
      for (const signal of requiredSignals) {
        if (!html.includes(signal)) missing.push(`${lang}:${event.slug}:${signal}`);
      }
    }
  }
  return {
    expected: languages.length * events.length,
    ok: languages.length * events.length - new Set(missing.map((item) => item.split(":").slice(0, 2).join(":"))).size,
    missing
  };
}

function detailSourceBoundaryStats() {
  const checkedLanguages = ["en", "es", "pt", "fr", "de"];
  const missing = [];
  for (const lang of checkedLanguages) {
    for (const event of events) {
      const relativePath = `dist/${lang}/events/${event.slug}.html`;
      if (!exists(relativePath)) {
        missing.push(`${lang}:${event.slug}:page`);
        continue;
      }
      const html = fssync.readFileSync(path.join(root, relativePath), "utf8");
      if (!html.includes("source-boundary-callout")) {
        missing.push(`${lang}:${event.slug}:source-boundary`);
      }
    }
  }
  return {
    expected: checkedLanguages.length * events.length,
    ok: checkedLanguages.length * events.length - missing.length,
    missing
  };
}

function sourceHaystack(source) {
  return [
    source.name,
    source.type,
    source.owner,
    source.url,
    ...(source.alternateUrls || []),
    ...(source.coverage || []),
    source.refreshCadence,
    source.automationStatus,
    source.notes
  ].filter(Boolean).join(" ");
}

function sourceCoverageStats() {
  const active = sources.filter((source) => sourceAutomationStatuses.has(source.automationStatus));
  const buckets = sourceCoverageBuckets.map((bucket) => ({
    id: bucket.id,
    minSources: bucket.minSources,
    count: active.filter((source) => bucket.pattern.test(sourceHaystack(source))).length
  }));
  return {
    active: active.length,
    buckets,
    missing: buckets.filter((bucket) => bucket.count < bucket.minSources)
  };
}

function check(status, area, item, detail, next = "") {
  checks.push({ status, area, item, detail, next });
}

function pass(area, item, detail, next = "") {
  check("pass", area, item, detail, next);
}

function warn(area, item, detail, next = "") {
  check("warn", area, item, detail, next);
}

function fail(area, item, detail, next = "") {
  check("fail", area, item, detail, next);
}

function statusOf(event) {
  if (event.endDate < today) return "ended";
  if (event.startDate > today) return "upcoming";
  return "live";
}

function daysSince(iso) {
  return Math.floor((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${iso}T00:00:00Z`)) / dayMs);
}

function freshnessLimitDays(event) {
  const fastMoving = new Set(["kpop", "beauty", "duty-free", "department-store"]);
  const status = statusOf(event);
  if (status === "ended") return 45;
  if (status === "live") return fastMoving.has(event.category) ? 2 : 3;
  return fastMoving.has(event.category) ? 3 : 7;
}

function publicUrlOk() {
  try {
    const parsed = new URL(siteUrl);
    return parsed.protocol === "https:" && !["example.com", "your-domain.com", "localhost", "127.0.0.1"].includes(parsed.hostname);
  } catch {
    return false;
  }
}

function markdownTable(rows) {
  const header = "| Status | Area | Item | Detail | Next |\n| --- | --- | --- | --- | --- |";
  const body = rows.map((row) => `| ${row.status} | ${escapeMd(row.area)} | ${escapeMd(row.item)} | ${escapeMd(row.detail)} | ${escapeMd(row.next)} |`).join("\n");
  return `${header}\n${body}`;
}

function escapeMd(value) {
  return String(value || "").replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}

function score() {
  const passed = checks.filter((item) => item.status === "pass").length;
  const failed = checks.filter((item) => item.status === "fail").length;
  const warned = checks.filter((item) => item.status === "warn").length;
  const possible = checks.length || 1;
  return {
    passed,
    warned,
    failed,
    percent: Math.round((passed / possible) * 100)
  };
}

function summaryStats() {
  const statusCounts = events.reduce((acc, event) => {
    acc[statusOf(event)] = (acc[statusOf(event)] || 0) + 1;
    return acc;
  }, {});
  const categoryCounts = events.reduce((acc, event) => {
    acc[event.category] = (acc[event.category] || 0) + 1;
    return acc;
  }, {});
  return {
    events: events.length,
    guides: guides.length,
    publicContentPages: events.length + guides.length,
    sources: sources.length,
    curationItems: Array.isArray(curationQueue) ? curationQueue.length : 0,
    statusCounts,
    categoryCounts
  };
}

function originalVisitorValueStats() {
  const missing = [];
  for (const event of events) {
    const whyGo = String(event.whyGo?.en || "").trim();
    const tips = Array.isArray(event.travelTips) ? event.travelTips.filter(Boolean) : [];
    if (whyGo.length < 70 || tips.length < 3) {
      missing.push({
        slug: event.slug,
        whyGoLength: whyGo.length,
        tips: tips.length
      });
    }
  }
  return {
    expected: events.length,
    ok: events.length - missing.length,
    missing
  };
}

function runChecks() {
  const stats = summaryStats();
  if (publicUrlOk()) pass("Production", "SITE_URL", siteUrl);
  else fail("Production", "SITE_URL", siteUrl || "missing", "Set a real https production domain before applying to AdSense.");

  if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contactEmail) && contactEmail !== "hello@example.com") {
    pass("Production", "CONTACT_EMAIL", contactEmail);
  } else {
    fail("Production", "CONTACT_EMAIL", contactEmail || "missing", "Set a real public contact email for policy and correction requests.");
  }

  if (stats.publicContentPages >= 40) {
    pass("Content", "Public content depth", `${stats.publicContentPages} event/guide pages`);
  } else if (stats.publicContentPages >= 30) {
    warn("Content", "Public content depth", `${stats.publicContentPages} event/guide pages`, "Keep publishing verified official event pages before applying.");
  } else {
    fail("Content", "Public content depth", `${stats.publicContentPages} event/guide pages`, "Reach at least 30 original event/guide/archive pages.");
  }

  if (events.length >= 30) {
    pass("Content", "Event catalog", `${events.length} public events`);
  } else {
    warn("Content", "Event catalog", `${events.length} public events`, "Aim for 30+ verified event pages so the gallery feels substantial.");
  }

  if (guides.length >= 10) pass("Content", "Evergreen guides", `${guides.length} guides`);
  else fail("Content", "Evergreen guides", `${guides.length} guides`, "Add at least 10 useful visitor guides.");

  const originalValue = originalVisitorValueStats();
  if (originalValue.ok === originalValue.expected) {
    pass("Content", "Original visitor value", `${originalValue.ok}/${originalValue.expected} events include why-go context and 3+ practical visitor tips`);
  } else {
    fail("Content", "Original visitor value", `${originalValue.ok}/${originalValue.expected} events meet the original-value floor`, `Add stronger whyGo copy or 3+ practical tips: ${originalValue.missing.slice(0, 4).map((item) => item.slug).join(", ")}.`);
  }

  const thumbnails = thumbnailStats();
  if (thumbnails.ok === thumbnails.expected) {
    pass("UX", "Gallery thumbnails", `${thumbnails.ok}/${thumbnails.expected} event thumbnails`);
    if (thumbnails.generatedFallbacks.length) {
      warn("UX", "Official thumbnail coverage", `${events.length - thumbnails.generatedFallbacks.length}/${events.length} official or collected images`, `Replace generated fallbacks when official event, brand, or venue images become available: ${thumbnails.generatedFallbacks.slice(0, 4).join(", ")}.`);
    }
  } else {
    fail("UX", "Gallery thumbnails", `${thumbnails.ok}/${thumbnails.expected} event thumbnails`, `Run npm.cmd run validate:images and fix ${[...thumbnails.missing, ...thumbnails.invalid].slice(0, 4).join(", ")}.`);
  }

  const calendar = calendarStats();
  if (calendar.presentPages === calendar.expectedPages && calendar.presentLinks === calendar.expectedLinks && calendar.icsBlocks === calendar.expectedIcsBlocks) {
    pass("UX", "Calendar coverage", `${calendar.presentLinks}/${calendar.expectedLinks} event links; ${calendar.icsBlocks}/${calendar.expectedIcsBlocks} ICS events`);
  } else {
    fail("UX", "Calendar coverage", `${calendar.presentLinks}/${calendar.expectedLinks} event links; ${calendar.icsBlocks}/${calendar.expectedIcsBlocks} ICS events`, "Run npm.cmd run validate:calendar and rebuild if any event is missing.");
  }

  const detailPlanning = detailPlanningStats();
  if (detailPlanning.ok === detailPlanning.expected) {
    pass("UX", "Detail planning blocks", `${detailPlanning.ok}/${detailPlanning.expected} event detail pages`);
  } else {
    fail("UX", "Detail planning blocks", `${detailPlanning.ok}/${detailPlanning.expected} event detail pages`, "Run npm.cmd run validate:details and fix missing source, weather, map, route, or guide blocks.");
  }

  const sourceBoundary = detailSourceBoundaryStats();
  if (sourceBoundary.ok === sourceBoundary.expected) {
    pass("UX", "Planning-layer differentiation", `${sourceBoundary.ok}/${sourceBoundary.expected} checked detail pages explain K-Spot Now before the linked source`);
  } else {
    fail("UX", "Planning-layer differentiation", `${sourceBoundary.ok}/${sourceBoundary.expected} checked detail pages include source-boundary copy`, `Add linked-source boundary copy to ${sourceBoundary.missing.slice(0, 4).join(", ")}.`);
  }

  const officialEvents = events.filter((event) => /^official/.test(event.verification || "")).length;
  if (officialEvents === events.length) pass("Trust", "Official verification labels", `${officialEvents}/${events.length} events`);
  else fail("Trust", "Official verification labels", `${officialEvents}/${events.length} events`, "Every public event should be official or official-ended.");

  const staleLiveUpcoming = events
    .filter((event) => ["live", "upcoming"].includes(statusOf(event)))
    .filter((event) => daysSince(event.lastChecked) > freshnessLimitDays(event));
  if (!staleLiveUpcoming.length) {
    pass("Freshness", "Live/upcoming freshness", "No stale live or upcoming event pages");
  } else {
    fail("Freshness", "Live/upcoming freshness", `${staleLiveUpcoming.length} stale live/upcoming events`, staleLiveUpcoming.slice(0, 4).map((event) => event.slug).join(", "));
  }

  const requiredFiles = [
    "dist/index.html",
    "dist/sitemap.xml",
    "dist/robots.txt",
    "dist/events.ics",
    "dist/feed.xml",
    "dist/latest.json",
    "dist/recheck.json",
    "dist/source-refresh.json",
    "dist/_headers"
  ];
  for (const file of requiredFiles) {
    if (exists(file)) pass("Build", file, "present");
    else fail("Build", file, "missing", "Run npm.cmd run build before deploy.");
  }

  const structuredEvents = structuredEventStats();
  if (structuredEvents.ok === structuredEvents.expected) {
    pass("Build", "Detail structured data", `${structuredEvents.ok}/${structuredEvents.expected} multilingual detail pages`);
  } else {
    fail("Build", "Detail structured data", `${structuredEvents.ok}/${structuredEvents.expected} pages valid`, `Run npm.cmd run validate:structured and inspect ${structuredEvents.missing.slice(0, 3).join(", ")}.`);
  }

  const policyPages = ["privacy", "cookie-policy", "contact", "about", "terms", "editorial-policy", "corrections", "sources", "freshness", "watchlist", "planner"];
  const missingPolicy = policyPages.filter((page) => !exists(`dist/en/${page}/index.html`));
  if (!missingPolicy.length) pass("Trust", "English policy/source pages", `${policyPages.length} required pages present`);
  else fail("Trust", "English policy/source pages", `Missing ${missingPolicy.join(", ")}`, "Run build and keep all trust pages available.");

  const publicSourceRefresh = readJson("dist/source-refresh.json");
  const watchlistHtml = exists("dist/en/watchlist/index.html")
    ? fssync.readFileSync(path.join(root, "dist", "en", "watchlist", "index.html"), "utf8")
    : "";
  if (publicSourceRefresh?.generatedAt && Number(publicSourceRefresh.counts?.auditedSources || 0) >= 20) {
    pass("Trust", "Public source refresh status", `${publicSourceRefresh.counts.auditedSources} audited sources`);
  } else if (publicSourceRefresh) {
    warn("Trust", "Public source refresh status", "present but empty", "Run npm.cmd run source:refresh before a major content push or AdSense application.");
  } else {
    fail("Trust", "Public source refresh status", "missing or invalid", "Run npm.cmd run build after a source refresh summary is available.");
  }
  if (watchlistHtml.includes("source-refresh-panel") && watchlistHtml.includes("/source-refresh.json")) {
    pass("Trust", "Watchlist source refresh panel", "present");
  } else {
    fail("Trust", "Watchlist source refresh panel", "missing", "Rebuild the site and confirm /en/watchlist/ links to /source-refresh.json.");
  }

  if (publisherId && /^pub-\d{16}$/.test(publisherId)) {
    pass("AdSense", "Publisher ID", publisherId);
    if (exists("dist/ads.txt")) pass("AdSense", "ads.txt", "present");
    else fail("AdSense", "ads.txt", "missing", "Build with GOOGLE_ADSENSE_PUBLISHER_ID set.");
  } else {
    warn("AdSense", "Publisher ID", "not set", "Normal before approval; required before enabling ads and ads.txt.");
    if (exists("dist/ads.txt.example")) pass("AdSense", "ads.txt example", "present");
    else warn("AdSense", "ads.txt example", "missing", "Run build to create ads.txt.example before approval.");
  }

  if (clientId && /^ca-pub-\d{16}$/.test(clientId)) {
    pass("AdSense", "Auto ads client", clientId);
  } else {
    warn("AdSense", "Auto ads client", "not set", "Add GOOGLE_ADSENSE_CLIENT after the publisher ID is issued.");
  }

  if (slotId && /^\d{8,20}$/.test(slotId) && exists("dist/index.html")) {
    const adSlots = manualAdSlotStats(slotId);
    if (adSlots.expected && adSlots.ok === adSlots.expected) {
      pass("AdSense", "Manual ad slot", `${slotId} on ${adSlots.ok}/${adSlots.expected} checked pages`);
    } else {
      fail("AdSense", "Manual ad slot", `${adSlots.ok}/${adSlots.expected} checked pages`, `Rebuild with GOOGLE_ADSENSE_SLOT set and inspect ${adSlots.missing.slice(0, 3).join(", ")}.`);
    }
  } else if (slotId) {
    fail("AdSense", "Manual ad slot", "invalid", "Use the numeric ad slot ID from an AdSense ad unit.");
  } else {
    warn("AdSense", "Manual ad slot", "not set", "Optional before approval; add GOOGLE_ADSENSE_SLOT to enable reserved in-page ad placements.");
  }

  if (adsenseCmpReady) {
    pass("AdSense", "Google-certified CMP readiness", "confirmed");
  } else {
    warn("AdSense", "Google-certified CMP readiness", "not set", "Choose and configure a Google-certified consent management platform before serving ads to EEA, UK, and Switzerland visitors, then set GOOGLE_ADSENSE_CMP_READY=1.");
  }

  if (googleSiteVerification && exists("dist/index.html")) {
    const home = fssync.readFileSync(path.join(root, "dist", "index.html"), "utf8");
    if (home.includes(`name="google-site-verification"`) && home.includes(`content="${googleSiteVerification}"`)) {
      pass("Search", "Search Console meta verification", "present");
    } else {
      fail("Search", "Search Console meta verification", "configured but missing from dist/index.html", "Rebuild with GOOGLE_SITE_VERIFICATION set.");
    }
  } else {
    warn("Search", "Search Console meta verification", "not set", "Set GOOGLE_SITE_VERIFICATION or verify the domain through DNS before submitting the sitemap.");
  }

  if (sources.length >= 20) pass("Operations", "Official source registry", `${sources.length} sources`);
  else warn("Operations", "Official source registry", `${sources.length} sources`, "Keep expanding official monitors.");

  const sourceCoverage = sourceCoverageStats();
  if (!sourceCoverage.missing.length) {
    pass("Operations", "Required source coverage", `${sourceCoverage.buckets.length} buckets covered by ${sourceCoverage.active} active automation sources`);
  } else {
    fail("Operations", "Required source coverage", `${sourceCoverage.missing.length} missing buckets`, sourceCoverage.missing.map((bucket) => `${bucket.id} ${bucket.count}/${bucket.minSources}`).join(", "));
  }

  const latestAudit = latestMatchingFile(/^source-audit-\d{4}-\d{2}-\d{2}\.md$/);
  if (latestAudit) pass("Operations", "Source audit report", latestAudit);
  else warn("Operations", "Source audit report", "not found", "Run npm.cmd run check:sources before an application or major content push.");

  const latestDraft = latestMatchingFile(/^draft-events-\d{4}-\d{2}-\d{2}\.json$/);
  if (latestDraft) pass("Operations", "Candidate draft feed", latestDraft);
  else warn("Operations", "Candidate draft feed", "not found", "Run npm.cmd run source:refresh to keep the pipeline warm.");
}

function latestMatchingFile(pattern) {
  const dir = path.join(root, "data", "feeds");
  if (!fssync.existsSync(dir)) return "";
  return fssync.readdirSync(dir)
    .filter((name) => pattern.test(name))
    .sort()
    .at(-1) || "";
}

runChecks();

const stats = summaryStats();
const result = {
  generatedAt: new Date().toISOString(),
  siteUrl,
  contactEmail,
  publisherIdSet: Boolean(publisherId),
  clientIdSet: Boolean(clientId),
  slotIdSet: Boolean(slotId),
  googleSiteVerificationSet: Boolean(googleSiteVerification),
  adsenseCmpReadySet: Boolean(adsenseCmpReady),
  stats,
  score: score(),
  checks
};

const feedDir = path.join(root, "data", "feeds");
await fs.mkdir(feedDir, { recursive: true });
const jsonOut = path.join(feedDir, `adsense-readiness-${today}.json`);
const mdOut = path.join(feedDir, `adsense-readiness-${today}.md`);
await fs.writeFile(jsonOut, `${JSON.stringify(result, null, 2)}\n`, "utf8");
await fs.writeFile(mdOut, `# AdSense Readiness Report

Generated: ${result.generatedAt}

Site: ${siteUrl || "(not set)"}

Score: ${result.score.percent}% (${result.score.passed} pass, ${result.score.warned} warn, ${result.score.failed} fail)

## Content Stats

- Events: ${stats.events}
- Guides: ${stats.guides}
- Public event/guide pages: ${stats.publicContentPages}
- Official sources watched: ${stats.sources}
- Curation queue items: ${stats.curationItems}
- Event statuses: ${JSON.stringify(stats.statusCounts)}
- Event categories: ${JSON.stringify(stats.categoryCounts)}

## Checks

${markdownTable(checks)}

## Recommended Next Actions

${checks.filter((item) => item.status !== "pass" && item.next).map((item) => `- ${item.area} / ${item.item}: ${item.next}`).join("\n") || "- No blocking next action from this report."}
`, "utf8");

console.log(`AdSense readiness score: ${result.score.percent}% (${result.score.passed} pass, ${result.score.warned} warn, ${result.score.failed} fail)`);
console.table(checks.map((item) => ({
  status: item.status,
  area: item.area,
  item: item.item,
  detail: item.detail,
  next: item.next
})));
console.log(`Saved AdSense readiness report: ${mdOut}`);

if (strict && checks.some((item) => item.status === "fail")) {
  process.exitCode = 1;
}
