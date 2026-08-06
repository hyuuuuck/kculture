import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { todayString } from "./lib/date.mjs";
import { assertSeoulSuccess, fetchPublicJson } from "./lib/public-data.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const serviceKey = String(process.env.SEOUL_OPEN_DATA_KEY || "").trim();

if (!serviceKey) {
  console.error("Missing SEOUL_OPEN_DATA_KEY. Add the Seoul Open Data general authentication key to .env.");
  process.exit(1);
}

function endpoint(start, end) {
  return `http://openapi.seoul.go.kr:8088/${encodeURIComponent(serviceKey)}/json/culturalSpaceInfo/${start}/${end}/`;
}

const anchors = JSON.parse(await fs.readFile(path.join(root, "data", "public-data-anchors.json"), "utf8"));
const expected = (anchors.anchors || []).filter((anchor) => anchor.sourceName === "Seoul Open Data Cultural Space Information");
const rows = [];
for (const [start, end] of [[1, 1000], [1001, 1100]]) {
  const payload = await fetchPublicJson(endpoint(start, end), `Seoul cultural spaces ${start}-${end}`);
  const service = assertSeoulSuccess(payload, "culturalSpaceInfo", `Seoul cultural spaces ${start}-${end}`);
  rows.push(...(Array.isArray(service?.row) ? service.row : []));
}

const matches = expected.map((anchor) => {
  const record = rows.find((row) => String(row.FAC_NAME || "").trim() === anchor.sourceRecordId);
  return {
    eventSlug: anchor.eventSlug,
    expectedNameKo: anchor.sourceRecordId,
    matched: Boolean(record),
    nameKo: String(record?.FAC_NAME || "").trim(),
    addressKo: String(record?.ADDR || "").trim(),
    latitude: Number(record?.X_COORD) || null,
    longitude: Number(record?.Y_COORD) || null,
    homepage: String(record?.HOMEPAGE || "").trim(),
    closedDayKo: String(record?.CLOSEDAY || "").trim()
  };
});

const output = {
  generatedAt: new Date().toISOString(),
  source: {
    name: "Seoul Open Data Cultural Space Information",
    owner: "Seoul Metropolitan Government",
    url: "https://data.seoul.go.kr/dataList/OA-15487/A/1/datasetView.do",
    service: "culturalSpaceInfo"
  },
  publicationPolicy: "Private verification feed. Coordinates confirm reviewed event anchors; hours and closure text are not published automatically.",
  totalRows: rows.length,
  matches
};

const feedDir = path.join(root, "data", "feeds");
await fs.mkdir(feedDir, { recursive: true });
const out = path.join(feedDir, `seoul-cultural-spaces-${todayString()}.json`);
await fs.writeFile(out, `${JSON.stringify(output, null, 2)}\n`, "utf8");
console.log(`Matched ${matches.filter((item) => item.matched).length}/${matches.length} reviewed Seoul cultural-space anchors.`);
console.log(`Saved private verification feed: ${out}`);
