import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const args = process.argv.slice(2);
const fileArg = valueFor("--file");
const write = args.includes("--write");

const categories = new Set(["festival", "kpop", "beauty", "duty-free", "department-store", "shopping", "travel-benefits"]);
const requiredLanguages = ["en", "es", "zh", "pt", "ru"];
const draftTextPatterns = [
  /draft-needs-review/i,
  /needs editor review/i,
  /official-source draft candidate/i,
  /review the page for exact title/i,
  /replace this draft summary/i,
  /official event candidate/i
];

function valueFor(flag) {
  const index = args.indexOf(flag);
  if (index === -1) return "";
  return args[index + 1] || "";
}

function usage() {
  console.error("Usage:");
  console.error("  npm.cmd run publish:reviewed -- --file data/feeds/reviewed-events.json");
  console.error("  npm.cmd run publish:reviewed -- --file data/feeds/reviewed-events.json --write");
}

function asArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.events)) return payload.events;
  if (Array.isArray(payload.drafts)) return payload.drafts;
  return [];
}

function localEn(value) {
  if (typeof value === "string") return value.trim();
  return String(value?.en || "").trim();
}

function localText(value, lang) {
  if (typeof value === "string") return lang === "en" ? value.trim() : "";
  return String(value?.[lang] || "").trim();
}

function textBlob(event) {
  return [
    event.slug,
    event.district,
    event.verification,
    localEn(event.title),
    localEn(event.summary),
    localEn(event.whyGo),
    ...(event.travelTips || [])
  ].join(" ");
}

function validDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value || "") && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

function validUrl(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
}

function cleanEvent(event) {
  const copy = structuredClone(event);
  delete copy.needsReview;
  delete copy.reviewChecklist;
  delete copy.evidence;
  return copy;
}

function pushError(errors, event, message) {
  errors.push({ slug: event.slug || "(missing slug)", message });
}

function validateEvent(event, context) {
  const errors = [];
  const id = event.slug || "(missing slug)";
  if (!event.slug) pushError(errors, event, "slug is required.");
  if (context.existingSlugs.has(event.slug)) pushError(errors, event, "slug already exists in data/events.json.");
  if (!categories.has(event.category)) pushError(errors, event, `unknown category: ${event.category}`);
  if (!Number.isFinite(event.priority)) pushError(errors, event, "priority must be a number.");
  if (!validDate(event.startDate)) pushError(errors, event, "startDate must be YYYY-MM-DD.");
  if (!validDate(event.endDate)) pushError(errors, event, "endDate must be YYYY-MM-DD.");
  if (validDate(event.startDate) && validDate(event.endDate) && event.startDate > event.endDate) pushError(errors, event, "startDate is after endDate.");
  if (!validDate(event.lastChecked)) pushError(errors, event, "lastChecked must be YYYY-MM-DD.");
  if (!localEn(event.title) || localEn(event.title).length < 12) pushError(errors, event, "title.en must be a reviewed title.");
  if (!localEn(event.summary) || localEn(event.summary).length < 80) pushError(errors, event, "summary.en must be a reviewed visitor summary of at least 80 characters.");
  if (!localEn(event.whyGo) || localEn(event.whyGo).length < 70) pushError(errors, event, "whyGo.en must explain visitor value in at least 70 characters.");
  for (const field of ["title", "summary", "whyGo"]) {
    for (const lang of requiredLanguages) {
      if (!localText(event[field], lang)) {
        pushError(errors, event, `${field}.${lang} is required before publishing multilingual content.`);
      }
    }
  }
  if (!event.city) pushError(errors, event, "city is required.");
  if (!event.venue) pushError(errors, event, "venue is required.");
  if (!event.sourceName) pushError(errors, event, "sourceName is required.");
  if (event.sourceName && !context.sourceNames.has(event.sourceName)) pushError(errors, event, "sourceName must match data/sources.json.");
  if (!validUrl(event.sourceUrl)) pushError(errors, event, "sourceUrl must be a valid http(s) URL.");
  if (!event.collectionMode) pushError(errors, event, "collectionMode is required.");
  if (!event.verification || /draft|review/i.test(event.verification)) pushError(errors, event, "verification must be final, not draft/review.");
  if (!Array.isArray(event.travelTips) || event.travelTips.length < 2) pushError(errors, event, "at least two travelTips are required.");
  if (!context.weatherRegions.has(event.weatherRegion)) pushError(errors, event, `weatherRegion is not configured: ${event.weatherRegion}`);
  if (!event.thumbnail) pushError(errors, event, "thumbnail is required.");

  const blob = textBlob(event);
  for (const pattern of draftTextPatterns) {
    if (pattern.test(blob)) pushError(errors, event, "draft placeholder text remains; rewrite before publishing.");
  }
  if (event.needsReview) pushError(errors, event, "needsReview must be removed or false before publishing.");
  if (event.reviewChecklist || event.evidence) pushError(errors, event, "review-only fields must be removed before publishing.");

  if (!errors.length) context.existingSlugs.add(id);
  return errors;
}

if (!fileArg) {
  usage();
  process.exit(1);
}

const sourceFile = path.resolve(root, fileArg);
const eventsFile = path.join(root, "data", "events.json");
const sourcesFile = path.join(root, "data", "sources.json");
const weatherFile = path.join(root, "data", "weather-baselines.json");

const [currentEvents, sources, weather, payload] = await Promise.all([
  fs.readFile(eventsFile, "utf8").then(JSON.parse),
  fs.readFile(sourcesFile, "utf8").then(JSON.parse),
  fs.readFile(weatherFile, "utf8").then(JSON.parse),
  fs.readFile(sourceFile, "utf8").then(JSON.parse)
]);

const reviewedEvents = asArray(payload).map(cleanEvent);
const context = {
  existingSlugs: new Set(currentEvents.map((event) => event.slug)),
  sourceNames: new Set(sources.map((source) => source.name)),
  weatherRegions: new Set(Object.keys(weather.regions))
};

if (!reviewedEvents.length) {
  console.error("No reviewed events found. Provide an array or an object with events/drafts.");
  process.exit(1);
}

const errors = reviewedEvents.flatMap((event) => validateEvent(event, context));
if (errors.length) {
  console.error("Reviewed event publish validation failed:");
  console.table(errors);
  process.exit(1);
}

const merged = [...currentEvents, ...reviewedEvents]
  .sort((a, b) => (b.priority || 0) - (a.priority || 0) || String(a.startDate).localeCompare(String(b.startDate)));

console.table(reviewedEvents.map((event) => ({
  slug: event.slug,
  category: event.category,
  start: event.startDate,
  end: event.endDate,
  source: event.sourceName
})));

if (!write) {
  console.log(`Dry run passed: ${reviewedEvents.length} reviewed events can be merged. Add --write to update data/events.json.`);
} else {
  await fs.writeFile(eventsFile, `${JSON.stringify(merged, null, 2)}\n`, "utf8");
  console.log(`Published ${reviewedEvents.length} reviewed events to ${eventsFile}`);
}
