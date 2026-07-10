import fs from "node:fs";
import path from "node:path";
import { publicLanguageCodes } from "./lib/public-languages.mjs";
import { todayString } from "./lib/date.mjs";

const root = path.resolve(".");
const dist = path.join(root, "dist");
const events = JSON.parse(fs.readFileSync(path.join(root, "data", "events.json"), "utf8"));
const program = JSON.parse(fs.readFileSync(path.join(root, "data", "editorial-program.json"), "utf8"));
const languages = publicLanguageCodes();
const today = todayString();
const approved = new Set(program.indexableEvents || []);
const publicEvents = events.filter((event) => approved.has(event.slug) && event.endDate >= today);
const errors = [];

function push(id, message) {
  errors.push({ id, message });
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function evidenceFor(event) {
  return [
    ...(event.audit?.sourceEvidence || []),
    ...(program.eventReviews?.[event.slug]?.sourceEvidence || [])
  ];
}

for (const lang of languages) {
  for (const event of publicEvents) {
    const relative = `${lang}/events/${event.slug}.html`;
    const file = path.join(dist, relative);
    if (!fs.existsSync(file)) {
      push(`dist/${relative}`, "approved event detail page is missing.");
      continue;
    }
    const html = fs.readFileSync(file, "utf8");
    const review = program.eventReviews?.[event.slug];
    const markers = [
      'class="detail-layout compact-event-detail"',
      'class="detail-hero compact-detail-hero"',
      'class="event-fact-bar"',
      'class="detail-section event-review-section"',
      'class="detail-section event-visit-section"',
      'class="detail-section event-evidence-section"',
      'class="review-byline"',
      'class="compact-weather-panel"',
      "What matters before you go",
      "What we checked"
    ];
    for (const marker of markers) {
      if (!html.includes(marker)) push(`dist/${relative}`, `required compact detail marker is missing: ${marker}`);
    }
    if (!html.includes(`href="${escapeHtml(event.sourceUrl)}"`)) push(`dist/${relative}`, "official source link is missing.");
    if (!html.includes(`href="/events/${event.slug}.ics"`)) push(`dist/${relative}`, "event calendar download is missing.");
    if (!html.includes(`src="/${event.thumbnail}"`)) push(`dist/${relative}`, "event-specific visual is missing.");
    for (const value of [event.startDate, event.endDate, event.venue, event.city]) {
      if (value && !html.includes(escapeHtml(value))) push(`dist/${relative}`, `essential event fact is missing: ${value}`);
    }
    if (!review || !html.includes(escapeHtml(review.visitorDecision))) push(`dist/${relative}`, "editorial visitor decision is missing.");
    for (const item of review?.foreignerChecks || []) {
      if (!html.includes(escapeHtml(item))) push(`dist/${relative}`, `foreign-visitor check is missing: ${item.slice(0, 60)}`);
    }
    const evidence = evidenceFor(event);
    if (!evidence.length) push(`dist/${relative}`, "structured source evidence is missing.");
    for (const item of evidence) {
      if (!html.includes(`href="${escapeHtml(item.url)}"`)) push(`dist/${relative}`, `evidence source link is missing: ${item.url}`);
      for (const token of (item.mustContain || []).slice(0, 5)) {
        if (!html.includes(escapeHtml(token))) push(`dist/${relative}`, `visible evidence token is missing: ${token}`);
      }
    }
    if (event.category !== "travel-benefits" || event.city !== "Nationwide") {
      const encoded = encodeURIComponent(event.mapQueryKo || event.venue || event.city);
      for (const mapHost of ["google.com/maps", "map.naver.com", "map.kakao.com"]) {
        if (!html.includes(mapHost)) push(`dist/${relative}`, `map shortcut is missing: ${mapHost}`);
      }
      if (!html.includes(encoded)) push(`dist/${relative}`, "encoded Korean map query is missing.");
    } else if (!html.includes("No single venue")) {
      push(`dist/${relative}`, "nationwide campaign must explain that it has no single venue.");
    }
  }
}

if (errors.length) {
  console.error("Detail page validation failed:");
  console.error(JSON.stringify(errors, null, 2));
  process.exit(1);
}

console.log(`Detail page validation passed: ${publicEvents.length} approved events across ${languages.length} public language.`);
