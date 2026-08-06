import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { todayString } from "./lib/date.mjs";
import { assertSeoulSuccess, fetchPublicJson } from "./lib/public-data.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const today = todayString();
const serviceKey = String(process.env.SEOUL_OPEN_DATA_KEY || "").trim();

if (!serviceKey) {
  console.error("Missing SEOUL_OPEN_DATA_KEY. Issue a General API key from data.seoul.go.kr.");
  process.exit(1);
}

const [events, program] = await Promise.all([
  fs.readFile(path.join(root, "data", "events.json"), "utf8").then(JSON.parse),
  fs.readFile(path.join(root, "data", "editorial-program.json"), "utf8").then(JSON.parse)
]);
const approvedSlugs = new Set(program.indexableEvents || []);
const approvedSeoulEvents = events.filter((event) => approvedSlugs.has(event.slug) && event.city === "Seoul" && event.endDate >= today);

function endpoint(endIndex) {
  const blank = encodeURIComponent(" ");
  return `http://openapi.seoul.go.kr:8088/${encodeURIComponent(serviceKey)}/json/culturalEventInfo/1/${endIndex}/${blank}/${blank}/${today}/`;
}

function isoDate(value) {
  const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[1]}-${match[2]}-${match[3]}` : "";
}

function tokens(value) {
  return new Set(String(value || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, " ")
    .split(/\s+/)
    .filter((token) => token.length >= 2)
    .filter((token) => !["서울", "행사", "공연", "전시", "센터", "2026", "seoul", "event"].includes(token)));
}

function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart && aEnd && bStart <= aEnd && aStart <= bEnd;
}

function potentialMatches(row) {
  const rowTokens = tokens(`${row.TITLE} ${row.PLACE} ${row.GUNAME}`);
  return approvedSeoulEvents.flatMap((event) => {
    const startDate = isoDate(row.STRTDATE) || isoDate(row.DATE);
    const endDate = isoDate(row.END_DATE) || startDate;
    if (!overlaps(startDate, endDate, event.startDate, event.endDate)) return [];
    const eventTokens = tokens(`${event.title?.en || ""} ${event.venue || ""} ${event.mapQueryKo || ""} ${event.visitorInfo?.address || ""}`);
    const shared = [...rowTokens].filter((token) => eventTokens.has(token));
    if (!shared.length) return [];
    return [{ slug: event.slug, sharedTokens: shared.slice(0, 6), requiresEditorConfirmation: true }];
  });
}

const payload = await fetchPublicJson(endpoint(1000), "Seoul cultural events");
const service = assertSeoulSuccess(payload, "culturalEventInfo", "Seoul cultural events");
const rows = Array.isArray(service?.row) ? service.row : [];
const items = rows.map((row) => ({
  titleKo: String(row.TITLE || "").trim(),
  categoryKo: String(row.CODENAME || "").trim(),
  districtKo: String(row.GUNAME || "").trim(),
  venueKo: String(row.PLACE || "").trim(),
  organizerKo: String(row.ORG_NAME || "").trim(),
  startDate: isoDate(row.STRTDATE) || isoDate(row.DATE),
  endDate: isoDate(row.END_DATE) || isoDate(row.STRTDATE) || isoDate(row.DATE),
  timeKo: String(row.PRO_TIME || "").trim(),
  priceKo: String(row.USE_FEE || "").trim(),
  audienceKo: String(row.USE_TRGT || "").trim(),
  isFreeKo: String(row.IS_FREE || "").trim(),
  latitude: Number(row.LAT) || null,
  longitude: Number(row.LOT) || null,
  sourceUrl: String(row.HMPG_ADDR || "").trim(),
  organizerUrl: String(row.ORG_LINK || "").trim(),
  potentialMatches: potentialMatches(row)
}));

const output = {
  generatedAt: new Date().toISOString(),
  queryDate: today,
  source: {
    name: "Seoul Open Data Cultural Event Information",
    owner: "Seoul Metropolitan Government",
    url: "https://data.seoul.go.kr/dataList/OA-15486/A/1/datasetView.do",
    service: "culturalEventInfo"
  },
  publicationPolicy: "Review-only. Never publish API descriptions or matches without checking the organizer page and writing original visitor guidance.",
  total: Number(service?.list_total_count || items.length),
  count: items.length,
  matchedCount: items.filter((item) => item.potentialMatches.length).length,
  items
};

const feedDir = path.join(root, "data", "feeds");
await fs.mkdir(feedDir, { recursive: true });
const out = path.join(feedDir, `seoul-cultural-events-${today}.json`);
await fs.writeFile(out, `${JSON.stringify(output, null, 2)}\n`, "utf8");

console.log(`Imported ${output.count} Seoul cultural events active on ${today}; ${output.matchedCount} require comparison with an approved K-Spot Now event.`);
console.log(`Saved review-only feed: ${out}`);
