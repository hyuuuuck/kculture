import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { todayString } from "./lib/date.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const today = todayString();
const dayMs = 24 * 60 * 60 * 1000;
const freshnessStrict = process.env.CONTENT_FRESHNESS_STRICT === "1";

const events = JSON.parse(await fs.readFile(path.join(root, "data", "events.json"), "utf8"));
const sources = JSON.parse(await fs.readFile(path.join(root, "data", "sources.json"), "utf8"));
const guides = JSON.parse(await fs.readFile(path.join(root, "data", "guides.json"), "utf8"));
const weather = JSON.parse(await fs.readFile(path.join(root, "data", "weather-baselines.json"), "utf8"));
const routes = JSON.parse(await fs.readFile(path.join(root, "data", "travel-routes.json"), "utf8"));
const curationQueue = await fs.readFile(path.join(root, "data", "curation-queue.json"), "utf8")
  .then(JSON.parse)
  .catch(() => []);

const categories = new Set(["festival", "kpop", "beauty", "duty-free", "department-store", "shopping", "travel-benefits"]);
const requiredLanguages = ["en", "es", "zh", "pt", "ru"];
const sourceNames = new Set(sources.map((source) => source.name));
const queueStatuses = new Set(["active", "paused", "archived"]);
const weatherRegions = new Set(Object.keys(weather.regions));
const fastMovingCategories = new Set(["kpop", "beauty", "duty-free", "department-store"]);
const requiredWeatherMonths = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
const errors = [];
const warnings = [];

function push(list, id, message) {
  list.push({ id, message });
}

function isDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value || "") && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
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
  const status = statusOf(event);
  if (status === "ended") return 45;
  if (status === "live") return fastMovingCategories.has(event.category) ? 2 : 3;
  return fastMovingCategories.has(event.category) ? 3 : 7;
}

function localEn(value) {
  if (typeof value === "string") return value.trim();
  return (value?.en || "").trim();
}

function hasBrokenLocalizedText(value) {
  const text = String(value || "");
  return /�|\?{2,}|[A-Za-zÀ-ž]\?[A-Za-zÀ-ž]|^\?|\s\?/.test(text);
}

function validateLocalizedObject(id, field, value, { requireAll = false } = {}) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    if (requireAll) push(errors, id, `${field} must contain ${requiredLanguages.join(", ")} localized values.`);
    return;
  }
  if (requireAll) {
    for (const lang of requiredLanguages) {
      if (!String(value[lang] || "").trim()) {
        push(errors, id, `${field}.${lang} is required for multilingual publication.`);
      }
    }
  }
  for (const [lang, text] of Object.entries(value)) {
    if (lang === "en") continue;
    if (hasBrokenLocalizedText(text)) {
      push(errors, id, `${field}.${lang} appears to contain mojibake or encoding-loss question marks.`);
    }
  }
}

function guideSections(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.en)) return value.en;
  return [];
}

function assertUrl(id, field, value, required = true) {
  if (!value) {
    if (required) push(errors, id, `${field} is required.`);
    return;
  }
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) push(errors, id, `${field} must be http(s).`);
  } catch {
    push(errors, id, `${field} is not a valid URL.`);
  }
}

async function collectFiles(dir, predicate, out = []) {
  let entries = [];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) await collectFiles(file, predicate, out);
    else if (predicate(file)) out.push(file);
  }
  return out;
}

async function validateGeneratedText() {
  const dist = path.join(root, "dist");
  const files = await collectFiles(dist, (file) => file.endsWith(".html"));
  const mojibake = /[\uFFFD\u7aca\u9e1a\u85e5\u8a1d\u74e6\u8fbb\u9035\u7b60\uf908\ucc30\ucc55\ucc3e]|\?{4,}/;
  for (const file of files) {
    const text = await fs.readFile(file, "utf8");
    if (mojibake.test(text)) {
      push(errors, path.relative(root, file), "generated HTML contains mojibake or replacement characters.");
    }
  }
}

const eventSlugs = new Set();
for (const event of events) {
  const id = event.slug || "(missing event slug)";
  if (!event.slug) push(errors, id, "slug is required.");
  if (eventSlugs.has(event.slug)) push(errors, id, "duplicate event slug.");
  eventSlugs.add(event.slug);

  if (!categories.has(event.category)) push(errors, id, `unknown category: ${event.category}`);
  if (!Number.isFinite(event.priority)) push(errors, id, "priority must be a number.");
  if (!isDate(event.startDate)) push(errors, id, "startDate must be YYYY-MM-DD.");
  if (!isDate(event.endDate)) push(errors, id, "endDate must be YYYY-MM-DD.");
  if (isDate(event.startDate) && isDate(event.endDate) && event.startDate > event.endDate) push(errors, id, "startDate is after endDate.");
  if (!isDate(event.lastChecked)) push(errors, id, "lastChecked must be YYYY-MM-DD.");
  if (isDate(event.lastChecked)) {
    const ageDays = daysSince(event.lastChecked);
    if (ageDays < 0) {
      push(errors, id, "lastChecked cannot be in the future.");
    }
    if (ageDays >= 0 && isDate(event.startDate) && isDate(event.endDate)) {
      const status = statusOf(event);
      const limitDays = freshnessLimitDays(event);
      const freshnessTarget = freshnessStrict ? errors : warnings;
      if (ageDays > limitDays) {
        push(freshnessTarget, id, `${status} listing was last checked ${ageDays} days ago; limit is ${limitDays} days.`);
      }
      if (status === "live" && event.lastChecked < event.startDate) {
        push(freshnessTarget, id, "live listing should be rechecked on or after its start date.");
      }
    }
  }
  if (!localEn(event.title)) push(errors, id, "title.en is required.");
  if (!localEn(event.summary)) push(errors, id, "summary.en is required.");
  if (!localEn(event.whyGo)) push(errors, id, "whyGo.en is required.");
  validateLocalizedObject(id, "title", event.title, { requireAll: true });
  validateLocalizedObject(id, "summary", event.summary, { requireAll: true });
  validateLocalizedObject(id, "whyGo", event.whyGo, { requireAll: true });
  if (!event.city) push(errors, id, "city is required.");
  if (!event.venue) push(errors, id, "venue is required.");
  if (!event.mapQueryKo) {
    push(errors, id, "mapQueryKo is required for Korean map search links.");
  } else if (!/[\uac00-\ud7a3]/.test(event.mapQueryKo)) {
    push(errors, id, "mapQueryKo must include a Korean place name.");
  }
  if (!event.sourceName) push(errors, id, "sourceName is required.");
  if (!event.collectionMode) push(errors, id, "collectionMode is required.");
  if (!event.verification) push(errors, id, "verification is required.");
  if (!Array.isArray(event.travelTips) || event.travelTips.length < 2) push(errors, id, "at least two travelTips are required.");
  if (!weatherRegions.has(event.weatherRegion)) push(errors, id, `weatherRegion is not configured: ${event.weatherRegion}`);
  assertUrl(id, "sourceUrl", event.sourceUrl);

  if (event.thumbnail) {
    const thumb = path.join(root, event.thumbnail);
    try {
      await fs.access(thumb);
    } catch {
      push(errors, id, `thumbnail does not exist: ${event.thumbnail}`);
    }
  } else {
    push(errors, id, "thumbnail is required.");
  }

  if (event.sourceName && !sourceNames.has(event.sourceName)) {
    push(warnings, id, `sourceName is not an exact source registry name: ${event.sourceName}`);
  }
}

const sourceSeen = new Set();
for (const source of sources) {
  const id = source.name || "(missing source name)";
  if (!source.name) push(errors, id, "source name is required.");
  if (sourceSeen.has(source.name)) push(errors, id, "duplicate source name.");
  sourceSeen.add(source.name);
  assertUrl(id, "url", source.url);
  if (!source.type) push(errors, id, "type is required.");
  if (!source.owner) push(errors, id, "owner is required.");
  if (!Array.isArray(source.coverage) || !source.coverage.length) push(errors, id, "coverage must contain at least one item.");
  if (!source.refreshCadence) push(errors, id, "refreshCadence is required.");
  if (!source.automationStatus) push(errors, id, "automationStatus is required.");
  if (source.alternateUrls !== undefined) {
    if (!Array.isArray(source.alternateUrls)) {
      push(errors, id, "alternateUrls must be an array when provided.");
    } else {
      source.alternateUrls.forEach((url, index) => assertUrl(id, `alternateUrls[${index}]`, url));
    }
  }
}

for (const [regionName, months] of Object.entries(weather.regions || {})) {
  for (const month of requiredWeatherMonths) {
    const item = months?.[month];
    if (!item) {
      push(errors, `weather:${regionName}`, `${month} weather baseline is required.`);
      continue;
    }
    if (!String(item.range || "").trim()) push(errors, `weather:${regionName}:${month}`, "range is required.");
    if (!Array.isArray(item.packing) || item.packing.length < 3) push(errors, `weather:${regionName}:${month}`, "packing must contain at least three items.");
    if (!String(item.outdoorAdvice || "").trim()) push(errors, `weather:${regionName}:${month}`, "outdoorAdvice is required.");
  }
}

if (!Array.isArray(curationQueue)) {
  push(errors, "curation-queue", "data/curation-queue.json must contain an array.");
}

const queueSeen = new Set();
for (const item of Array.isArray(curationQueue) ? curationQueue : []) {
  const id = item.id || "(missing queue id)";
  if (!item.id) push(errors, id, "curation queue id is required.");
  if (queueSeen.has(item.id)) push(errors, id, "duplicate curation queue id.");
  queueSeen.add(item.id);
  if (!queueStatuses.has(item.status)) push(errors, id, "status must be active, paused, or archived.");
  if (!sourceNames.has(item.sourceName)) push(errors, id, "sourceName must match data/sources.json.");
  if (!categories.has(item.category)) push(errors, id, `unknown curation category: ${item.category}`);
  if (!Number.isFinite(item.priority) || item.priority < 1 || item.priority > 100) push(errors, id, "priority must be a number from 1 to 100.");
  if (!item.label) push(errors, id, "label is required.");
  if (!item.owner) push(errors, id, "owner is required.");
  if (!item.artistOrBrand) push(errors, id, "artistOrBrand is required.");
  if (!item.reviewNotes) push(errors, id, "reviewNotes is required.");
  if (!Array.isArray(item.topics) || !item.topics.length) push(errors, id, "topics must contain at least one item.");
  assertUrl(id, "sourceUrl", item.sourceUrl);
}

if (guides.length < 10) {
  push(errors, "guides", "at least 10 evergreen guides are required for AdSense readiness.");
}

const guideSlugs = new Set();
for (const guide of guides) {
  const id = guide.slug || "(missing guide slug)";
  if (!guide.slug) push(errors, id, "guide slug is required.");
  if (guideSlugs.has(guide.slug)) push(errors, id, "duplicate guide slug.");
  guideSlugs.add(guide.slug);
  if (!categories.has(guide.category)) push(errors, id, `unknown guide category: ${guide.category}`);
  if (!localEn(guide.title)) push(errors, id, "guide title.en is required.");
  if (!localEn(guide.summary)) push(errors, id, "guide summary.en is required.");
  validateLocalizedObject(id, "guide.title", guide.title, { requireAll: true });
  validateLocalizedObject(id, "guide.summary", guide.summary, { requireAll: true });
  const sections = guideSections(guide.sections);
  if (sections.length < 2) push(errors, id, "guide needs at least two English sections.");
  for (const section of sections) {
    if (String(section || "").trim().length < 60) push(errors, id, "guide sections should be substantial visitor guidance.");
  }
}

const routeSlugs = new Set();
for (const route of routes) {
  const id = route.slug || "(missing route slug)";
  if (!route.slug) push(errors, id, "route slug is required.");
  if (routeSlugs.has(route.slug)) push(errors, id, "duplicate route slug.");
  routeSlugs.add(route.slug);
  if (!Array.isArray(route.regions) || !route.regions.length) push(errors, id, "route regions are required.");
  if (!Array.isArray(route.categories) || !route.categories.length) push(errors, id, "route categories are required.");
  for (const category of route.categories || []) {
    if (!categories.has(category)) push(errors, id, `unknown route category: ${category}`);
  }
  if (!route.title) push(errors, id, "route title is required.");
  if (!Array.isArray(route.stops) || route.stops.length < 3) push(errors, id, "route needs at least three stops.");
  if (!Array.isArray(route.tips) || route.tips.length < 2) push(errors, id, "route needs at least two tips.");
  const relatedEvents = events.filter((event) => route.regions?.includes(event.city) && route.categories?.includes(event.category));
  if (!relatedEvents.length) push(warnings, id, "route has no directly related events yet.");
}

await validateGeneratedText();

if (warnings.length) {
  console.warn("Content warnings:");
  console.table(warnings);
}

if (errors.length) {
  console.error("Content validation failed:");
  console.table(errors);
  process.exitCode = 1;
} else {
  console.log(`Content validation passed: ${events.length} events, ${sources.length} sources, ${guides.length} guides, ${routes.length} routes, ${Array.isArray(curationQueue) ? curationQueue.length : 0} curation items.`);
}
