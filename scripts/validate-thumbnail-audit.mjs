import fs from "node:fs";
import path from "node:path";

const root = path.resolve(".");
const events = JSON.parse(fs.readFileSync(path.join(root, "data", "events.json"), "utf8"));
const editorialProgram = JSON.parse(fs.readFileSync(path.join(root, "data", "editorial-program.json"), "utf8"));
const approvedSlugs = new Set(editorialProgram.indexableEvents || []);
const sourcesPath = path.join(root, "data", "thumbnail-sources.json");
const sources = fs.existsSync(sourcesPath) ? JSON.parse(fs.readFileSync(sourcesPath, "utf8")) : {};
const errors = [];
const warnings = [];

function push(list, id, message) {
  list.push({ id, message });
}

function eventTitle(event) {
  return typeof event.title === "string" ? event.title : event.title?.en || "";
}

function eventSummary(event) {
  return typeof event.summary === "string" ? event.summary : event.summary?.en || "";
}

function textTerms(event) {
  const text = [
    event.slug,
    event.sourceName,
    event.venue,
    eventTitle(event),
    eventSummary(event)
  ].join(" ").toLowerCase();
  const extra = [
    "bts", "olive", "young", "shilla", "lotte", "hyundai", "shinsegae", "coex",
    "visitkorea", "pentaport", "mud", "pokemon", "weverse", "duty", "free",
    "concert", "sale", "rose", "garden", "maskdance", "magic", "port"
  ].filter((term) => text.includes(term));
  const words = text
    .replace(/[^a-z0-9]+/gi, " ")
    .split(/\s+/)
    .filter((word) => word.length >= 4 && !/^(2026|event|events|korea|seoul|busan|official|global|main|park|grand|festival)$/.test(word));
  return [...new Set([...extra, ...words])].slice(0, 40);
}

function strongEventTerms(event) {
  return textTerms(event).filter((term) => (
    term.length >= 4
    && !/^(event|events|korea|seoul|busan|official|global|main|park|grand|festival|popup|pop-up)$/.test(term)
  ));
}

function auditText(source) {
  return [
    source?.sourceUrl,
    source?.sourcePage,
    source?.kind,
    source?.alt,
    source?.context
  ].join(" ").toLowerCase();
}

function auditReasons(source, event) {
  const text = auditText(source);
  const reasons = [];
  const eventIsPopup = /\bpop-?up\b/i.test(eventTitle(event));

  if (/(?:no-img|no_image|placeholder|blank|favicon|sprite|sns-|ico_|icon_|\/icons?\/|thumb_v01|head_logo|logo_footer|comm\/logo|coex-logo-white|weverseshop-og|mainvisual_txt_bg|wa-mark|visitseoul-banner|news-?letter|newsletter|btn\.svg|button)/i.test(text)) {
    reasons.push("site-generic-image");
  }
  if (/(?:공무원\s*사칭|사칭\s*피해|피해\s*주의|선급금|물품\s*납품|입금\s*요구|거래\s*전)/i.test(text)) {
    reasons.push("fraud-or-scam-warning");
  }
  if (/(?:\/upload\/popup\/|\/popup\/|popupzone|layerpopup)/i.test(text) && !eventIsPopup) {
    reasons.push("homepage-popup-image");
  }

  try {
    const parsedSource = new URL(event.sourceUrl);
    const broadSourcePage = /(?:^\/?$|\/main\.do$|\/index\.(?:do|php|html?)$)/i.test(parsedSource.pathname);
    const strongHits = strongEventTerms(event).filter((term) => text.includes(term.toLowerCase()));
    if (broadSourcePage && strongHits.length === 0 && !/og:image|twitter:image|json-ld/i.test(String(source?.kind || ""))) {
      reasons.push("broad-source-without-event-term");
    }
  } catch {
    reasons.push("invalid-source-page");
  }

  return reasons;
}

for (const event of events) {
  const thumbnail = String(event.thumbnail || "");
  if (!thumbnail.includes("assets/event-thumbnails/official/")) continue;

  const source = sources[event.slug];
  if (!source) {
    push(errors, event.slug, `official thumbnail is missing audit metadata in data/thumbnail-sources.json: ${thumbnail}`);
    continue;
  }
  if (source.localPath !== thumbnail) {
    push(errors, event.slug, `thumbnail metadata path mismatch: event has ${thumbnail}, metadata has ${source.localPath}`);
  }
  if (!fs.existsSync(path.join(root, thumbnail))) {
    push(errors, event.slug, `official thumbnail file is missing: ${thumbnail}`);
  }
  if (!source.sourceUrl || !/^https?:\/\//i.test(source.sourceUrl)) {
    push(errors, event.slug, "official thumbnail needs an HTTP sourceUrl.");
  }
  const reasons = auditReasons(source, event);
  if (reasons.length) {
    push(errors, event.slug, `official thumbnail failed audit: ${reasons.join(", ")} (${source.sourceUrl})`);
  }
  if (Number(source.score || 0) < 8) {
    push(errors, event.slug, `official thumbnail score is too low: ${source.score}`);
  }
  if (approvedSlugs.has(event.slug)) {
    if (thumbnail.endsWith(".svg") || /identity card/i.test(String(source.kind || ""))) {
      push(errors, event.slug, `indexable event must use a real official event image, not a generated identity card: ${thumbnail}`);
    }
    if (!/^https?:\/\//i.test(String(source.sourceImageUrl || ""))) {
      push(errors, event.slug, "indexable event image needs a traceable HTTP sourceImageUrl.");
    }
  }
}

const referencedOfficial = new Set(events
  .map((event) => String(event.thumbnail || ""))
  .filter((thumbnail) => thumbnail.includes("assets/event-thumbnails/official/"))
  .map((thumbnail) => path.normalize(path.join(root, thumbnail))));

const officialDir = path.join(root, "assets", "event-thumbnails", "official");
if (fs.existsSync(officialDir)) {
  for (const entry of fs.readdirSync(officialDir, { withFileTypes: true })) {
    if (!entry.isFile() || entry.name === "README.md") continue;
    const file = path.normalize(path.join(officialDir, entry.name));
    if (!referencedOfficial.has(file)) {
      push(warnings, entry.name, "official thumbnail file is not currently referenced by any event.");
    }
  }
}

if (errors.length) {
  console.error("Thumbnail audit failed:");
  console.error(JSON.stringify(errors, null, 2));
  process.exit(1);
}

if (warnings.length) {
  console.warn("Thumbnail audit warnings:");
  console.warn(JSON.stringify(warnings, null, 2));
}

const officialCount = referencedOfficial.size;
console.log(`Thumbnail audit passed: ${officialCount} official thumbnails checked, ${events.length - officialCount} generated fallbacks.`);
