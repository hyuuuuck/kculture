import fs from "node:fs";
import path from "node:path";
import { todayString } from "./lib/date.mjs";

const root = path.resolve(".");
const dist = path.join(root, "dist");
const today = todayString();
const dayMs = 24 * 60 * 60 * 1000;
const events = JSON.parse(fs.readFileSync(path.join(root, "data", "events.json"), "utf8"));
const guides = JSON.parse(fs.readFileSync(path.join(root, "data", "guides.json"), "utf8"));
const routes = JSON.parse(fs.readFileSync(path.join(root, "data", "travel-routes.json"), "utf8"));
const weather = JSON.parse(fs.readFileSync(path.join(root, "data", "weather-baselines.json"), "utf8"));
const languages = ["en", "es", "zh", "pt", "ru", "ja"];
const adsenseClientId = normalizeAdSenseClientId(process.env.GOOGLE_ADSENSE_CLIENT || process.env.ADSENSE_CLIENT || process.env.GOOGLE_ADSENSE_PUBLISHER_ID || process.env.ADSENSE_PUBLISHER_ID || "");
const adsenseSlotId = String(process.env.GOOGLE_ADSENSE_SLOT || process.env.ADSENSE_SLOT || "").trim();
const errors = [];

function push(id, message) {
  errors.push({ id, message });
}

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function normalizeAdSenseClientId(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  if (/^pub-\d{16}$/.test(trimmed)) return `ca-${trimmed}`;
  return trimmed;
}

function manualAdsExpected() {
  return /^ca-pub-\d{16}$/.test(adsenseClientId) && /^\d{8,20}$/.test(adsenseSlotId);
}

function statusOf(event) {
  if (event.endDate < today) return "ended";
  if (event.startDate > today) return "upcoming";
  return "live";
}

function monthNameFromIso(iso) {
  const date = new Date(`${String(iso || today).slice(0, 7)}-01T00:00:00Z`);
  return new Intl.DateTimeFormat("en-US", { month: "long", timeZone: "UTC" }).format(date);
}

function weatherIsoForEvent(event) {
  const status = statusOf(event);
  if (status === "live") return today;
  if (status === "ended") return event.endDate || event.startDate || today;
  return event.startDate || event.endDate || today;
}

function weatherBaseline(event) {
  const regionKey = weather.regions[event.weatherRegion] ? event.weatherRegion : "Nationwide";
  const monthName = monthNameFromIso(weatherIsoForEvent(event));
  const regionData = weather.regions[regionKey] || weather.regions.Nationwide;
  const nationalData = weather.regions.Nationwide || {};
  return {
    regionKey,
    monthName,
    baseline: regionData[monthName] || nationalData[monthName] || regionData.June || nationalData.June
  };
}

function routeHref(lang, route) {
  return `/${lang}/routes/${route.slug}.html`;
}

function routesForEvent(event) {
  const regionKeys = new Set([event.city, event.weatherRegion, "Nationwide"].filter(Boolean));
  const matches = routes.filter((route) => {
    const regionMatch = route.regions?.some((region) => regionKeys.has(region));
    const categoryMatch = route.categories?.includes(event.category);
    return regionMatch && categoryMatch;
  });
  const fallback = routes.filter((route) => route.regions?.some((region) => regionKeys.has(region)));
  return (matches.length ? matches : fallback).slice(0, 3);
}

function guidesForEvent(event) {
  const relatedGuides = guides.filter((guide) => guide.category === event.category).slice(0, 3);
  return relatedGuides.length ? relatedGuides : guides.slice(0, 3);
}

function assertIncludes(html, needle, id, message) {
  if (!html.includes(needle)) push(id, message);
}

function validateDetailPage(event, lang) {
  const relativePath = path.join("dist", lang, "events", `${event.slug}.html`);
  const file = path.join(root, relativePath);
  const id = relativePath.replace(/\\/g, "/");
  if (!fs.existsSync(file)) {
    push(id, "event detail page is missing.");
    return;
  }

  const html = fs.readFileSync(file, "utf8");
  const weatherInfo = weatherBaseline(event);
  const routeIdeas = routesForEvent(event);
  const relatedGuides = guidesForEvent(event);

  assertIncludes(html, `href="${esc(event.sourceUrl)}"`, id, "official source link is missing.");
  assertIncludes(html, `href="/events/${event.slug}.ics"`, id, "single-event calendar download link is missing.");
  assertIncludes(html, `data-save-event`, id, "save-event planner button is missing.");
  assertIncludes(html, `data-event-slug="${esc(event.slug)}"`, id, "save-event planner metadata is missing the event slug.");
  assertIncludes(html, esc(event.dateLabel || `${event.startDate} - ${event.endDate}`), id, "event period is missing from visible facts.");
  assertIncludes(html, esc(event.venue), id, "event venue is missing from visible facts.");
  assertIncludes(html, esc(event.city), id, "event city is missing from visible facts.");
  assertIncludes(html, esc(event.sourceName), id, "official source name is missing from the page.");

  assertIncludes(html, "Previous-year monthly baseline", id, "previous-year weather baseline label is missing.");
  assertIncludes(html, esc(weather.source.name), id, "weather source name is missing.");
  assertIncludes(html, esc(weatherInfo.regionKey), id, "weather region is missing.");
  assertIncludes(html, esc(weatherInfo.monthName), id, "weather month is missing.");
  assertIncludes(html, esc(weatherInfo.baseline.range), id, "weather range is missing.");
  for (const item of (weatherInfo.baseline.packing || []).slice(0, 3)) {
    assertIncludes(html, esc(item), id, `weather packing item is missing: ${item}`);
  }

  for (const tip of (event.travelTips || []).slice(0, 2)) {
    assertIncludes(html, esc(tip), id, `travel tip is missing: ${tip}`);
  }

  assertIncludes(html, "www.google.com/maps/search", id, "Google Maps shortcut is missing.");
  assertIncludes(html, "map.naver.com", id, "Naver Map shortcut is missing.");
  assertIncludes(html, "map.kakao.com", id, "Kakao Map shortcut is missing.");

  if (!routeIdeas.length) {
    push(id, "at least one nearby travel route should be available.");
  }
  for (const route of routeIdeas.slice(0, 1)) {
    assertIncludes(html, `href="${routeHref(lang, route)}"`, id, `nearby route link is missing: ${route.slug}`);
  }

  if (!relatedGuides.length) {
    push(id, "at least one related guide should be available.");
  }
  for (const guide of relatedGuides.slice(0, 1)) {
    assertIncludes(html, `href="/${lang}/guides/${guide.slug}.html"`, id, `related guide link is missing: ${guide.slug}`);
  }

  if (manualAdsExpected()) {
    assertIncludes(html, "adsbygoogle", id, "detail ad unit is missing while manual AdSense settings are enabled.");
    assertIncludes(html, `data-ad-slot="${esc(adsenseSlotId)}"`, id, "detail ad unit is missing the configured AdSense slot.");
  }
}

for (const lang of languages) {
  for (const event of events) {
    validateDetailPage(event, lang);
  }
}

if (errors.length) {
  console.error("Detail page validation failed:");
  console.error(JSON.stringify(errors, null, 2));
  process.exit(1);
}

console.log(`Detail page validation passed: ${events.length * languages.length} multilingual event detail pages include official source, calendar, weather, map, route, and guide blocks.`);
