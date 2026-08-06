import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { todayString } from "./lib/date.mjs";
import { assertDataGoSuccess, fetchPublicJson, normalizeDataGoServiceKey } from "./lib/public-data.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const serviceKey = normalizeDataGoServiceKey(process.env.KTO_SERVICE_KEY || process.env.DATA_GO_KR_SERVICE_KEY);
const startDate = process.env.KTO_START_DATE || todayString().replaceAll("-", "");
const rows = process.env.KTO_ROWS || "30";

if (!serviceKey) {
  console.error("Missing KTO_SERVICE_KEY. Get an approved key from data.go.kr, then run:");
  console.error("  $env:KTO_SERVICE_KEY='YOUR_KEY'; npm.cmd run import:tourapi");
  process.exit(1);
}

const url = new URL("https://apis.data.go.kr/B551011/EngService2/searchFestival2");
url.searchParams.set("serviceKey", serviceKey);
url.searchParams.set("MobileOS", "ETC");
url.searchParams.set("MobileApp", "KoreaNowGuide");
url.searchParams.set("_type", "json");
url.searchParams.set("arrange", "R");
url.searchParams.set("eventStartDate", startDate);
url.searchParams.set("numOfRows", rows);
url.searchParams.set("pageNo", "1");

const payload = assertDataGoSuccess(await fetchPublicJson(url, "KTO TourAPI"), "KTO TourAPI");
const items = payload?.response?.body?.items?.item || [];
const rowsToReview = Array.isArray(items) ? items : [items];
const normalized = rowsToReview.map((item) => ({
  externalId: item.contentid,
  contentTypeId: item.contenttypeid,
  title: item.title,
  startDate: item.eventstartdate,
  endDate: item.eventenddate,
  areaCode: item.areacode,
  sigunguCode: item.sigungucode,
  address: item.addr1,
  image: item.firstimage || item.firstimage2 || "",
  mapx: item.mapx,
  mapy: item.mapy,
  sourceName: "Korea Tourism Organization TourAPI",
  sourceUrl: "https://www.data.go.kr/en/data/15101753/openapi.do",
  importedAt: new Date().toISOString()
}));

const feedDir = path.join(root, "data", "feeds");
await fs.mkdir(feedDir, { recursive: true });
const out = path.join(feedDir, `tourapi-${startDate}.json`);
await fs.writeFile(out, `${JSON.stringify(normalized, null, 2)}\n`, "utf8");
console.log(`Imported ${normalized.length} TourAPI festival rows to ${out}`);
console.log("Review, translate, and merge selected rows into data/events.json before publishing.");
