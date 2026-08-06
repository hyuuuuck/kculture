import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { todayString } from "./lib/date.mjs";
import { assertDataGoSuccess, fetchPublicJson, normalizeDataGoServiceKey } from "./lib/public-data.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const serviceKey = normalizeDataGoServiceKey(process.env.KTO_SERVICE_KEY || process.env.DATA_GO_KR_SERVICE_KEY);
const radiusMeters = Math.min(5000, Math.max(100, Number(process.env.KTO_NEARBY_RADIUS || 3000)));

if (!serviceKey) {
  console.error("Missing KTO_SERVICE_KEY. Add the approved data.go.kr key to .env before importing nearby records.");
  process.exit(1);
}

const [anchorData, events, program] = await Promise.all([
  fs.readFile(path.join(root, "data", "public-data-anchors.json"), "utf8").then(JSON.parse),
  fs.readFile(path.join(root, "data", "events.json"), "utf8").then(JSON.parse),
  fs.readFile(path.join(root, "data", "editorial-program.json"), "utf8").then(JSON.parse)
]);
const approved = new Set(program.indexableEvents || []);
const eventBySlug = new Map(events.filter((event) => approved.has(event.slug)).map((event) => [event.slug, event]));

async function fetchNearby(anchor) {
  const url = new URL("https://apis.data.go.kr/B551011/EngService2/locationBasedList2");
  url.searchParams.set("serviceKey", serviceKey);
  url.searchParams.set("MobileOS", "ETC");
  url.searchParams.set("MobileApp", "KSpotNowEditorialReview");
  url.searchParams.set("_type", "json");
  url.searchParams.set("mapX", String(anchor.longitude));
  url.searchParams.set("mapY", String(anchor.latitude));
  url.searchParams.set("radius", String(radiusMeters));
  url.searchParams.set("arrange", "E");
  url.searchParams.set("numOfRows", "100");
  url.searchParams.set("pageNo", "1");

  const payload = assertDataGoSuccess(await fetchPublicJson(url, `KTO nearby records for ${anchor.eventSlug}`), `KTO nearby records for ${anchor.eventSlug}`);
  const raw = payload?.response?.body?.items?.item || [];
  const items = Array.isArray(raw) ? raw : [raw];
  return items.map((item) => ({
    contentId: String(item.contentid || ""),
    contentTypeId: String(item.contenttypeid || ""),
    title: String(item.title || "").trim(),
    address: [item.addr1, item.addr2].filter(Boolean).join(" ").trim(),
    distanceMeters: Number(item.dist),
    latitude: Number(item.mapy),
    longitude: Number(item.mapx),
    image: String(item.firstimage || item.firstimage2 || "").trim()
  })).filter((item) => item.contentId && item.title && Number.isFinite(item.distanceMeters));
}

const results = [];
for (const anchor of anchorData.anchors || []) {
  if (!approved.has(anchor.eventSlug)) {
    throw new Error(`${anchor.eventSlug} is not approved in data/editorial-program.json.`);
  }
  if (anchor.status !== "verified") {
    results.push({ eventSlug: anchor.eventSlug, status: "excluded", reason: anchor.reason });
    continue;
  }
  const event = eventBySlug.get(anchor.eventSlug);
  const items = await fetchNearby(anchor);
  results.push({
    eventSlug: anchor.eventSlug,
    eventTitle: event?.title?.en || anchor.eventSlug,
    status: "imported",
    anchor: {
      label: anchor.label,
      latitude: anchor.latitude,
      longitude: anchor.longitude,
      sourceName: anchor.sourceName,
      sourceUrl: anchor.sourceUrl,
      sourceRecordId: anchor.sourceRecordId
    },
    count: items.length,
    items
  });
}

const output = {
  generatedAt: new Date().toISOString(),
  source: {
    name: "Korea Tourism Organization TourAPI",
    url: "https://www.data.go.kr/en/data/15101753/openapi.do",
    endpoint: "https://apis.data.go.kr/B551011/EngService2/locationBasedList2"
  },
  radiusMeters,
  approvedOnly: true,
  publicationPolicy: "Private review feed. Never publish raw nearby rows, API descriptions, or inferred recommendations. Only data/kto-nearby-reviewed.json is build-readable after manual review.",
  results
};

const feedDir = path.join(root, "data", "feeds");
await fs.mkdir(feedDir, { recursive: true });
const out = path.join(feedDir, `kto-nearby-${todayString()}.json`);
await fs.writeFile(out, `${JSON.stringify(output, null, 2)}\n`, "utf8");
console.log(`Imported nearby KTO review rows for ${results.filter((result) => result.status === "imported").length} approved events.`);
console.log(`Saved private review feed: ${out}`);
