import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { todayString } from "./lib/date.mjs";
import { publicLanguageCodes } from "./lib/public-languages.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const today = todayString();
const dayMs = 24 * 60 * 60 * 1000;
const freshnessStrict = process.env.CONTENT_FRESHNESS_STRICT === "1";

const events = JSON.parse(await fs.readFile(path.join(root, "data", "events.json"), "utf8"));
const sources = JSON.parse(await fs.readFile(path.join(root, "data", "sources.json"), "utf8"));
const guides = JSON.parse(await fs.readFile(path.join(root, "data", "guides.json"), "utf8"));
const weather = JSON.parse(await fs.readFile(path.join(root, "data", "weather-baselines.json"), "utf8"));
const currentWeather = await fs.readFile(path.join(root, "data", "kma-forecast.json"), "utf8")
  .then(JSON.parse)
  .catch(() => null);
const routes = JSON.parse(await fs.readFile(path.join(root, "data", "travel-routes.json"), "utf8"));
const curationQueue = await fs.readFile(path.join(root, "data", "curation-queue.json"), "utf8")
  .then(JSON.parse)
  .catch(() => []);
const editorialProgram = JSON.parse(await fs.readFile(path.join(root, "data", "editorial-program.json"), "utf8"));
const reviewedEventSlugs = new Set(editorialProgram.indexableEvents || []);

const categories = new Set(["festival", "kpop", "beauty", "duty-free", "department-store", "shopping", "travel-benefits"]);
const publicLanguages = publicLanguageCodes();
const requiredLanguages = publicLanguages;
const sourceNames = new Set(sources.map((source) => source.name));
const queueStatuses = new Set(["active", "paused", "archived"]);
const weatherRegions = new Set(Object.keys(weather.regions));
const fastMovingCategories = new Set(["kpop", "beauty", "duty-free", "department-store"]);
const visitorInfoRequiredFields = ["theme", "hours", "address", "transportation"];
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

function guideSections(value, lang = "en") {
  if (Array.isArray(value)) return lang === "en" ? value : [];
  if (Array.isArray(value?.[lang])) return value[lang];
  if (lang === "en" && Array.isArray(value?.en)) return value.en;
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

function nonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function shortHash(value) {
  let hash = 0;
  for (const char of String(value || "")) {
    hash = ((hash << 5) - hash + char.charCodeAt(0)) | 0;
  }
  return Math.abs(hash).toString(36).slice(0, 6) || "0";
}

function citySlugForValidation(city) {
  const slug = String(city || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return slug || `city-${shortHash(city)}`;
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
  const localizedTrustPages = ["about", "contact", "privacy", "cookie-policy", "terms", "editorial-policy", "corrections", "sources", "watchlist"];
  const englishTrustPhrases = [
    "K-Spot Now is a multilingual event and shopping radar",
    "K-Spot Now is not a ticket marketplace or checkout service",
    "For corrections, source suggestions, or partnership inquiries",
    "This static site does not require user accounts",
    "K-Spot Now uses a small amount of browser-side storage",
    "Information is provided for travel planning and may change without notice",
    "Editorial Policy",
    "Corrections and Updates",
    "Source System",
    "Official Monitoring Watchlist",
    "Latest source refresh",
    "Sources needing attention",
    "High-signal candidate pages",
    "Top draft sources",
    "Audited sources",
    "Monitor checks",
    "Discovered official links",
    "Sources watched",
    "Refresh model",
    "Review pipeline",
    "K-pop curation queue",
    "official fallback link",
    "Published listings must come from official APIs",
    "Official monitors collect candidate dates",
    "K-pop pop-ups, fan events, ticketing notices",
    "Advertising must not influence event inclusion",
    "with the official URL, event or offer name",
    "Corrections are checked against official APIs",
    "Duty-free campaigns, OLIVE YOUNG promotions",
    "Public event pages show last-checked dates",
    "Corrections, source suggestions, ads",
    "Image and takedown policy",
    "disputed images are taken down during review",
    "Stay nearby",
    "Sponsored hotel link"
  ];
  const englishUiPhrases = [
    "Saved Korea plan",
    "Map and transit checks",
    "Weather planning",
    "Travel ideas",
    "Nearby route ideas",
    "Download calendar file",
    "Official source",
    "Visitor Guides",
    "Open planner",
    "Clear saved",
    "1 saved event",
    "saved events",
    "How to verify a Korea K-pop pop-up before you go",
    "What tourists should check before using Korea duty-free deals",
    "Korea shopping sale calendar for foreign visitors",
    "How to plan Korea events with weather in mind",
    "How to plan an OLIVE YOUNG shopping day in Korea",
    "How to use Korea department-store pop-ups while traveling",
    "How to verify K-pop pop-up notices before planning a Korea trip",
    "Korea shopping festivals and seasonal sale archives",
    "Korea department store sales and pop-ups",
    "Korea travel benefits and visitor coupons",
    "Korea festivals and cultural events",
    "K-pop concerts, pop-ups, merch stores, and fan events",
    "K-beauty deals and OLIVE YOUNG promotions",
    "Korea duty-free events and airport pickup deals"
  ];
  for (const file of files) {
    const text = await fs.readFile(file, "utf8");
    if (mojibake.test(text)) {
      push(errors, path.relative(root, file), "generated HTML contains mojibake or replacement characters.");
    }
  }
  for (const lang of publicLanguages.filter((item) => item !== "en")) {
    const localizedFiles = files.filter((file) => path.relative(dist, file).split(path.sep)[0] === lang);
    for (const file of localizedFiles) {
      const text = await fs.readFile(file, "utf8");
      for (const phrase of englishUiPhrases) {
        if (text.includes(phrase)) {
          push(errors, path.relative(root, file), `localized page still contains English UI fallback: ${phrase}`);
        }
      }
    }
    for (const page of localizedTrustPages) {
      const file = path.join(dist, lang, page, "index.html");
      let text = "";
      try {
        text = await fs.readFile(file, "utf8");
      } catch {
        push(errors, path.relative(root, file), "localized trust page is missing.");
        continue;
      }
      for (const phrase of englishTrustPhrases) {
        if (text.includes(phrase)) {
          push(errors, path.relative(root, file), "localized trust page still contains English fallback policy copy.");
        }
      }
    }
  }
}

const eventSlugs = new Set();
const cityWeatherRegions = new Map();
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
      const freshnessTarget = freshnessStrict && status !== "ended" && reviewedEventSlugs.has(event.slug) ? errors : warnings;
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
  if (!event.city) {
    push(errors, id, "city is required.");
  } else if (event.weatherRegion) {
    const previousWeatherRegion = cityWeatherRegions.get(event.city);
    if (previousWeatherRegion && previousWeatherRegion !== event.weatherRegion) {
      push(errors, id, `city uses inconsistent weatherRegion values: ${event.city} is both ${previousWeatherRegion} and ${event.weatherRegion}.`);
    }
    cityWeatherRegions.set(event.city, event.weatherRegion);
  }
  if (!event.venue) push(errors, id, "venue is required.");
  if (!event.mapQueryKo) {
    push(errors, id, "mapQueryKo is required for Korean map search links.");
  } else if (!/[\uac00-\ud7a3]/.test(event.mapQueryKo)) {
    push(errors, id, "mapQueryKo must include a Korean place name.");
  }
  if (!event.sourceName) push(errors, id, "sourceName is required.");
  if (!event.collectionMode) push(errors, id, "collectionMode is required.");
  if (!event.verification) push(errors, id, "verification is required.");
  if (!Array.isArray(event.travelTips) || event.travelTips.length < 3) push(errors, id, "at least three travelTips are required for original visitor guidance.");
  if (!weatherRegions.has(event.weatherRegion)) push(errors, id, `weatherRegion is not configured: ${event.weatherRegion}`);
  assertUrl(id, "sourceUrl", event.sourceUrl);
  if (event.alternateSourceUrls !== undefined) {
    if (!Array.isArray(event.alternateSourceUrls)) {
      push(errors, id, "alternateSourceUrls must be an array when provided.");
    } else {
      event.alternateSourceUrls.forEach((url, index) => assertUrl(id, `alternateSourceUrls[${index}]`, url));
    }
  }
  assertUrl(id, "officialWebsiteUrl", event.officialWebsiteUrl, false);
  if (event.officialWebsiteUrl && !nonEmptyString(event.officialWebsiteName)) {
    push(errors, id, "officialWebsiteName is required when officialWebsiteUrl is present.");
  }

  if (event.visitorInfo !== undefined) {
    if (!event.visitorInfo || typeof event.visitorInfo !== "object" || Array.isArray(event.visitorInfo)) {
      push(errors, id, "visitorInfo must be an object when provided.");
    } else {
      for (const field of visitorInfoRequiredFields) {
        if (!nonEmptyString(event.visitorInfo[field])) {
          push(errors, id, `visitorInfo.${field} is required when visitorInfo is provided.`);
        }
      }
      if (event.visitorInfo.websiteLanguages !== undefined) {
        if (!Array.isArray(event.visitorInfo.websiteLanguages) || !event.visitorInfo.websiteLanguages.every(nonEmptyString)) {
          push(errors, id, "visitorInfo.websiteLanguages must be an array of language names.");
        }
      }
    }
  }

  if (event.venueSchedule !== undefined) {
    if (!Array.isArray(event.venueSchedule) || !event.venueSchedule.length) {
      push(errors, id, "venueSchedule must be a non-empty array when provided.");
    } else {
      event.venueSchedule.forEach((item, index) => {
        const field = `venueSchedule[${index}]`;
        if (!nonEmptyString(item?.venue)) push(errors, id, `${field}.venue is required.`);
        if (!isDate(item?.startDate)) push(errors, id, `${field}.startDate must be YYYY-MM-DD.`);
        if (!isDate(item?.endDate)) push(errors, id, `${field}.endDate must be YYYY-MM-DD.`);
        if (isDate(item?.startDate) && isDate(item?.endDate) && item.startDate > item.endDate) {
          push(errors, id, `${field}.startDate must not be after endDate.`);
        }
        if (isDate(item?.startDate) && item.startDate < event.startDate) {
          push(errors, id, `${field}.startDate is outside the parent event period.`);
        }
        if (isDate(item?.endDate) && item.endDate > event.endDate) {
          push(errors, id, `${field}.endDate is outside the parent event period.`);
        }
      });
    }
  }

  if (event.officialHighlights !== undefined) {
    if (!Array.isArray(event.officialHighlights) || event.officialHighlights.length < 2 || !event.officialHighlights.every(nonEmptyString)) {
      push(errors, id, "officialHighlights must contain at least two visible strings when provided.");
    }
  }

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

const citySlugSeen = new Map();
for (const city of new Set(events.map((event) => event.city).filter(Boolean))) {
  const slug = citySlugForValidation(city);
  if (!slug) {
    push(errors, `city:${city}`, "city slug must not be empty.");
    continue;
  }
  const previousCity = citySlugSeen.get(slug);
  if (previousCity && previousCity !== city) {
    push(errors, `city:${city}`, `city slug collision with ${previousCity}: ${slug}.`);
  }
  citySlugSeen.set(slug, city);
  if (!/[A-Za-z]/.test(city)) {
    push(warnings, `city:${city}`, "city should use a Romanized public label for foreign visitors; put Korean search text in mapQueryKo.");
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

if (!currentWeather?.source?.name) {
  push(errors, "kma-forecast", "data/kma-forecast.json is required and must include source metadata.");
} else {
  if (currentWeather.source.name !== "KMA 1-hour Village Forecast RSS") {
    push(errors, "kma-forecast", "source.name should be KMA 1-hour Village Forecast RSS.");
  }
  const forecastRegions = currentWeather.regions || {};
  for (const [city, weatherRegion] of cityWeatherRegions) {
    const key = currentWeather.cityMap?.[city] || currentWeather.weatherRegionMap?.[weatherRegion] || currentWeather.weatherRegionMap?.[city] || weatherRegion || "Nationwide";
    const usableKey = forecastRegions[key]?.summary?.days?.length
      ? key
      : (forecastRegions.Nationwide?.summary?.days?.length ? "Nationwide" : "");
    if (!usableKey) {
      push(errors, `kma-forecast:${city}`, `missing current KMA forecast region for city: ${city}.`);
    } else {
      if (!currentWeather.cityMap?.[city]) {
        push(warnings, `kma-forecast:${city}`, `city has no direct KMA cityMap entry; using ${usableKey} forecast fallback.`);
      }
      for (const day of forecastRegions[usableKey].summary.days) {
        if (!day.periods || typeof day.periods !== "object") {
          push(errors, `kma-forecast:${city}:${day.date}`, "daily forecast must include periods.am and periods.pm containers.");
        } else if (!("am" in day.periods) || !("pm" in day.periods)) {
          push(errors, `kma-forecast:${city}:${day.date}`, "daily forecast periods must include both am and pm keys.");
        }
      }
    }
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

if (!guides.length) {
  push(errors, "guides", "at least one source-backed editorial guide record is required.");
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
  if (!isDate(guide.publishedAt)) push(errors, id, "guide.publishedAt must be YYYY-MM-DD.");
  if (!isDate(guide.updatedAt)) push(errors, id, "guide.updatedAt must be YYYY-MM-DD.");
  if (isDate(guide.publishedAt) && isDate(guide.updatedAt) && guide.publishedAt > guide.updatedAt) {
    push(errors, id, "guide.publishedAt cannot be later than guide.updatedAt.");
  }
  if (isDate(guide.publishedAt) && guide.publishedAt > today) push(errors, id, "guide.publishedAt cannot be in the future.");
  if (isDate(guide.updatedAt) && guide.updatedAt > today) push(errors, id, "guide.updatedAt cannot be in the future.");
  if (!nonEmptyString(guide.reviewedBy)) push(errors, id, "guide.reviewedBy is required.");
  if (!nonEmptyString(guide.method) || guide.method.length < 60) push(errors, id, "guide.method must explain the editorial research method.");
  if (!Array.isArray(guide.sources) || guide.sources.length < 2) {
    push(errors, id, "guide.sources needs at least two primary or authoritative sources.");
  } else {
    guide.sources.forEach((source, index) => {
      if (!nonEmptyString(source.name)) push(errors, id, `guide.sources[${index}].name is required.`);
      assertUrl(id, `guide.sources[${index}].url`, source.url);
      if (!nonEmptyString(source.note)) push(errors, id, `guide.sources[${index}].note is required.`);
    });
  }
  const sections = guideSections(guide.sections, "en");
  if (sections.length < 4) push(errors, id, "guide.sections.en needs at least four decision-focused sections.");
  let totalParagraphText = "";
  for (const [index, section] of sections.entries()) {
    if (!section || typeof section !== "object" || Array.isArray(section)) {
      push(errors, id, `guide.sections.en[${index}] must be a structured section object.`);
      continue;
    }
    if (!nonEmptyString(section.heading)) push(errors, id, `guide.sections.en[${index}].heading is required.`);
    if (!Array.isArray(section.paragraphs) || section.paragraphs.length < 2 || !section.paragraphs.every(nonEmptyString)) {
      push(errors, id, `guide.sections.en[${index}].paragraphs needs at least two substantial paragraphs.`);
    } else {
      totalParagraphText += ` ${section.paragraphs.join(" ")}`;
    }
  }
  if (totalParagraphText.trim().split(/\s+/).length < 280) {
    push(errors, id, "guide needs at least 280 words of original decision-focused paragraph copy.");
  }
}

const approvedEventSlugs = new Set(editorialProgram.indexableEvents || []);
const approvedGuideSlugs = new Set(editorialProgram.indexableGuides || []);
for (const slug of approvedEventSlugs) {
  const event = events.find((item) => item.slug === slug);
  const review = editorialProgram.eventReviews?.[slug];
  if (!event) {
    push(errors, slug, "editorial-program references a missing event.");
    continue;
  }
  const evidence = [...(event.audit?.sourceEvidence || []), ...(review?.sourceEvidence || [])];
  const evidenceHosts = new Set(evidence.map((item) => {
    try { return new URL(item.url).hostname.replace(/^www\./, ""); } catch { return ""; }
  }).filter(Boolean));
  if (!review?.reviewedAt || !review?.reviewedBy || String(review?.visitorDecision || "").length < 120) {
    push(errors, slug, "approved event needs a dated editorial review and substantial visitor decision.");
  }
  if (!Array.isArray(review?.foreignerChecks) || review.foreignerChecks.length < 3) {
    push(errors, slug, "approved event needs at least three foreign-visitor checks.");
  }
  const fit = review?.decisionFit || {};
  if (["availability", "bestFor", "poorFit", "timeCost", "commitWhen"].some((field) => !nonEmptyString(fit[field]) || fit[field].length < 60)) {
    push(errors, slug, "approved event needs a substantial decision-fit analysis separated from reported source facts.");
  }
  if (evidence.length < 2 || evidenceHosts.size < 2 || evidence.some((item) => !item.url || !Array.isArray(item.mustContain) || item.mustContain.length < 2)) {
    push(errors, slug, "approved event needs two structured official sources on distinct hosts.");
  }
}
for (const slug of approvedGuideSlugs) {
  const guide = guides.find((item) => item.slug === slug);
  if (!guide) {
    push(errors, slug, "editorial-program references a missing guide.");
    continue;
  }
  const sourceHosts = new Set((guide.sources || []).map((source) => {
    try { return new URL(source.url).hostname.replace(/^www\./, ""); } catch { return ""; }
  }).filter(Boolean));
  if (sourceHosts.size < 2) push(errors, slug, "approved guide needs authoritative sources on at least two distinct hosts.");
  if (!nonEmptyString(guide.audience) || !guide.decisionTool || !Array.isArray(guide.decisionTool.rows) || guide.decisionTool.rows.length < 4) {
    push(errors, slug, "approved guide needs an intended audience and a four-row worked decision example.");
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
