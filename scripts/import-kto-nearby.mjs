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

const [anchorData, events, program, reviewedNearby] = await Promise.all([
  fs.readFile(path.join(root, "data", "public-data-anchors.json"), "utf8").then(JSON.parse),
  fs.readFile(path.join(root, "data", "events.json"), "utf8").then(JSON.parse),
  fs.readFile(path.join(root, "data", "editorial-program.json"), "utf8").then(JSON.parse),
  fs.readFile(path.join(root, "data", "kto-nearby-reviewed.json"), "utf8").then(JSON.parse)
]);
const approved = new Set(program.indexableEvents || []);
const eventBySlug = new Map(events.filter((event) => approved.has(event.slug)).map((event) => [event.slug, event]));
const reviewedBySlug = new Map((reviewedNearby.events || []).map((item) => [item.eventSlug, item]));

function firstItem(payload) {
  const raw = payload?.response?.body?.items?.item;
  return Array.isArray(raw) ? (raw[0] || {}) : (raw || {});
}

function cleanApiText(value) {
  return String(value || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function detailUrl(endpoint, params) {
  const url = new URL(`https://apis.data.go.kr/B551011/EngService2/${endpoint}`);
  for (const [key, value] of Object.entries({
    serviceKey,
    MobileOS: "ETC",
    MobileApp: "KSpotNowEditorialReview",
    _type: "json",
    ...params
  })) url.searchParams.set(key, String(value));
  return url;
}

async function fetchReviewedDetail(option) {
  const [commonPayload, introPayload] = await Promise.all([
    fetchPublicJson(detailUrl("detailCommon2", { contentId: option.contentId }), `KTO common detail for ${option.contentId}`),
    fetchPublicJson(detailUrl("detailIntro2", { contentId: option.contentId, contentTypeId: option.contentTypeId }), `KTO intro detail for ${option.contentId}`)
  ]);
  assertDataGoSuccess(commonPayload, `KTO common detail for ${option.contentId}`);
  assertDataGoSuccess(introPayload, `KTO intro detail for ${option.contentId}`);
  const common = firstItem(commonPayload);
  const intro = firstItem(introPayload);
  return {
    contentId: String(option.contentId),
    contentTypeId: String(option.contentTypeId),
    title: cleanApiText(common.title),
    address: cleanApiText([common.addr1, common.addr2].filter(Boolean).join(" ")),
    homepage: cleanApiText(common.homepage),
    overview: cleanApiText(common.overview),
    operatingFields: Object.fromEntries(Object.entries(intro)
      .filter(([key, value]) => !["contentid", "contenttypeid"].includes(key) && cleanApiText(value))
      .map(([key, value]) => [key, cleanApiText(value)]))
  };
}

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
  const reviewedOptions = reviewedBySlug.get(anchor.eventSlug)?.options || [];
  const reviewedDetailEvidence = [];
  for (const option of reviewedOptions) reviewedDetailEvidence.push(await fetchReviewedDetail(option));
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
    items,
    reviewedDetailEvidence
  });
}

const output = {
  generatedAt: new Date().toISOString(),
  source: {
    name: "Korea Tourism Organization TourAPI",
    url: "https://www.data.go.kr/en/data/15101753/openapi.do",
    endpoint: "https://apis.data.go.kr/B551011/EngService2/locationBasedList2",
    detailEndpoints: [
      "https://apis.data.go.kr/B551011/EngService2/detailCommon2",
      "https://apis.data.go.kr/B551011/EngService2/detailIntro2"
    ]
  },
  radiusMeters,
  approvedOnly: true,
  publicationPolicy: "Private review feed. Common descriptions and operating fields are evidence for editorial review, never public copy. Only original, manually reviewed decisions in data/kto-nearby-reviewed.json are build-readable.",
  results
};

const feedDir = path.join(root, "data", "feeds");
await fs.mkdir(feedDir, { recursive: true });
const out = path.join(feedDir, `kto-nearby-${todayString()}.json`);
await fs.writeFile(out, `${JSON.stringify(output, null, 2)}\n`, "utf8");
console.log(`Imported nearby KTO review rows for ${results.filter((result) => result.status === "imported").length} approved events.`);
console.log(`Saved private review feed: ${out}`);
