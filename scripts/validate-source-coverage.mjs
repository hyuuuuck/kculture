import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const sources = JSON.parse(await fs.readFile(path.join(root, "data", "sources.json"), "utf8"));
const curationQueue = await fs.readFile(path.join(root, "data", "curation-queue.json"), "utf8")
  .then(JSON.parse)
  .catch(() => []);

const requiredBuckets = [
  {
    id: "tourism-festivals",
    label: "tourism, festivals, and city calendars",
    minSources: 12,
    pattern: /\b(tourism|tourist|visitkorea|tourapi|festival|visit seoul|visit jeju|busan|incheon|daegu|boryeong|andong|jinju|coex|ddp)\b/i
  },
  {
    id: "government-culture",
    label: "government and culture policy confirmation",
    minSources: 4,
    pattern: /\b(ministry|mcst|government|policy briefing|culture portal|culture|metropolitan government|kofice)\b/i
  },
  {
    id: "sale-shopping",
    label: "national sale and shopping campaigns",
    minSources: 4,
    pattern: /\b(korea grand sale|korea sale festa|shopping|sale|retail|benefits|promotion)\b/i
  },
  {
    id: "beauty-olive-young",
    label: "OLIVE YOUNG and beauty campaigns",
    minSources: 2,
    pattern: /\b(olive young|beauty|cosmetic|cj olive)\b/i
  },
  {
    id: "duty-free",
    label: "duty-free promotions",
    minSources: 4,
    pattern: /\b(duty free|duty-free|dfs|shilla|lottedfs|shinsegaedf)\b/i
  },
  {
    id: "department-store",
    label: "department-store events and sales",
    minSources: 5,
    pattern: /\b(department store|lotte department|hyundai department|shinsegae department|galleria|ak plaza|e-hyundai|ehyundai)\b/i
  },
  {
    id: "kpop-popups",
    label: "K-pop pop-ups, artist notices, and official shops",
    minSources: 8,
    pattern: /\b(k-pop|kpop|pop-up|popup|weverse|fans shop|smtown|yg select|nol world|artist|fan|merch)\b/i
  },
  {
    id: "ticketing",
    label: "ticketing and reservation paths",
    minSources: 4,
    pattern: /\b(ticket|ticketing|yes24|ticketlink|melon ticket|nol world|reservation)\b/i
  },
  {
    id: "weather",
    label: "weather baselines and observation data",
    minSources: 1,
    pattern: /\b(weather|meteorological|kma|asos|temperature|precipitation)\b/i
  }
];

const requiredAutomationStatuses = new Set([
  "ready-with-api-key",
  "planned-api",
  "monitor-and-curate"
]);

const errors = [];
const warnings = [];

function haystack(source) {
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

function push(list, id, message) {
  list.push({ id, message });
}

const activeSources = sources.filter((source) => requiredAutomationStatuses.has(source.automationStatus));

for (const bucket of requiredBuckets) {
  const matches = activeSources.filter((source) => bucket.pattern.test(haystack(source)));
  if (matches.length < bucket.minSources) {
    push(errors, bucket.id, `${bucket.label} coverage has ${matches.length}/${bucket.minSources} required active sources.`);
  }
}

const officialQueueItems = curationQueue.filter((item) => item.status === "active");
if (officialQueueItems.length < 5) {
  push(warnings, "curation-queue", `active curation queue is thin: ${officialQueueItems.length} active items.`);
}

const officialQueueByCategory = officialQueueItems.reduce((acc, item) => {
  acc[item.category] = (acc[item.category] || 0) + 1;
  return acc;
}, {});

for (const category of ["kpop", "beauty", "duty-free", "department-store", "shopping"]) {
  if (!officialQueueByCategory[category]) {
    push(warnings, `curation-queue:${category}`, `no active curation queue item for ${category}; add official one-off URLs when a campaign is announced.`);
  }
}

if (errors.length) {
  console.error("Source coverage validation failed:");
  console.error(JSON.stringify(errors, null, 2));
  process.exit(1);
}

if (warnings.length) {
  console.warn("Source coverage warnings:");
  console.warn(JSON.stringify(warnings, null, 2));
}

const summary = requiredBuckets.map((bucket) => {
  const count = activeSources.filter((source) => bucket.pattern.test(haystack(source))).length;
  return `${bucket.id}:${count}`;
}).join(", ");

console.log(`Source coverage validation passed: ${sources.length} sources, ${activeSources.length} active automation sources, buckets ${summary}.`);
