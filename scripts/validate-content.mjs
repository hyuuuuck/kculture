import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const events = JSON.parse(await fs.readFile(path.join(root, "data", "events.json"), "utf8"));
const sources = JSON.parse(await fs.readFile(path.join(root, "data", "sources.json"), "utf8"));
const guides = JSON.parse(await fs.readFile(path.join(root, "data", "guides.json"), "utf8"));
const weather = JSON.parse(await fs.readFile(path.join(root, "data", "weather-baselines.json"), "utf8"));
const routes = JSON.parse(await fs.readFile(path.join(root, "data", "travel-routes.json"), "utf8"));

const categories = new Set(["festival", "kpop", "beauty", "duty-free", "department-store", "shopping", "travel-benefits"]);
const sourceNames = new Set(sources.map((source) => source.name));
const weatherRegions = new Set(Object.keys(weather.regions));
const errors = [];
const warnings = [];

function push(list, id, message) {
  list.push({ id, message });
}

function isDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value || "") && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

function localEn(value) {
  if (typeof value === "string") return value.trim();
  return (value?.en || "").trim();
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
  if (!localEn(event.title)) push(errors, id, "title.en is required.");
  if (!localEn(event.summary)) push(errors, id, "summary.en is required.");
  if (!localEn(event.whyGo)) push(errors, id, "whyGo.en is required.");
  if (!event.city) push(errors, id, "city is required.");
  if (!event.venue) push(errors, id, "venue is required.");
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
}

for (const guide of guides) {
  const id = guide.slug || "(missing guide slug)";
  if (!guide.slug) push(errors, id, "guide slug is required.");
  if (!categories.has(guide.category)) push(errors, id, `unknown guide category: ${guide.category}`);
  if (!localEn(guide.title)) push(errors, id, "guide title.en is required.");
  if (!localEn(guide.summary)) push(errors, id, "guide summary.en is required.");
  if (!Array.isArray(guide.sections) || guide.sections.length < 2) push(errors, id, "guide needs at least two sections.");
}

for (const route of routes) {
  const id = route.slug || "(missing route slug)";
  if (!route.slug) push(errors, id, "route slug is required.");
  if (!Array.isArray(route.regions) || !route.regions.length) push(errors, id, "route regions are required.");
  if (!Array.isArray(route.categories) || !route.categories.length) push(errors, id, "route categories are required.");
  for (const category of route.categories || []) {
    if (!categories.has(category)) push(errors, id, `unknown route category: ${category}`);
  }
  if (!route.title) push(errors, id, "route title is required.");
  if (!Array.isArray(route.stops) || route.stops.length < 3) push(errors, id, "route needs at least three stops.");
  if (!Array.isArray(route.tips) || route.tips.length < 2) push(errors, id, "route needs at least two tips.");
}

if (warnings.length) {
  console.warn("Content warnings:");
  console.table(warnings);
}

if (errors.length) {
  console.error("Content validation failed:");
  console.table(errors);
  process.exitCode = 1;
} else {
  console.log(`Content validation passed: ${events.length} events, ${sources.length} sources, ${guides.length} guides, ${routes.length} routes.`);
}
