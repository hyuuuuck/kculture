import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { todayString } from "./lib/date.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const serviceKey = process.env.KMA_SERVICE_KEY || process.env.DATA_GO_KR_SERVICE_KEY;
const today = todayString();
const maxDays = Number(process.env.KMA_MAX_DAYS || 31);

const stationByRegion = {
  Seoul: { stnIds: "108", label: "Seoul ASOS" },
  Busan: { stnIds: "159", label: "Busan ASOS" },
  Jeju: { stnIds: "184", label: "Jeju ASOS" },
  Daegu: { stnIds: "143", label: "Daegu ASOS" },
  Daejeon: { stnIds: "133", label: "Daejeon ASOS" },
  Gwangju: { stnIds: "156", label: "Gwangju ASOS" },
  Incheon: { stnIds: "112", label: "Incheon ASOS" },
  Nationwide: { stnIds: "108", label: "Seoul ASOS fallback" }
};

if (!serviceKey) {
  console.error("Missing KMA_SERVICE_KEY or DATA_GO_KR_SERVICE_KEY.");
  console.error("Get an approved key from data.go.kr AsosDaIyInfoService, then run:");
  console.error("  $env:KMA_SERVICE_KEY='YOUR_KEY'; npm.cmd run import:weather");
  process.exit(1);
}

const events = JSON.parse(await fs.readFile(path.join(root, "data", "events.json"), "utf8"));

function compactDate(iso) {
  return iso.replaceAll("-", "");
}

function shiftYear(iso, delta) {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCFullYear(date.getUTCFullYear() + delta);
  return date.toISOString().slice(0, 10);
}

function daysBetween(startIso, endIso) {
  const start = new Date(`${startIso}T00:00:00Z`);
  const end = new Date(`${endIso}T00:00:00Z`);
  return Math.max(1, Math.round((end - start) / 86400000) + 1);
}

function clampEnd(startIso, endIso) {
  if (daysBetween(startIso, endIso) <= maxDays) return endIso;
  const start = new Date(`${startIso}T00:00:00Z`);
  start.setUTCDate(start.getUTCDate() + maxDays - 1);
  return start.toISOString().slice(0, 10);
}

function num(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function average(values) {
  const usable = values.filter((value) => value !== null);
  if (!usable.length) return null;
  return Number((usable.reduce((sum, value) => sum + value, 0) / usable.length).toFixed(1));
}

function sum(values) {
  const usable = values.filter((value) => value !== null);
  if (!usable.length) return null;
  return Number(usable.reduce((total, value) => total + value, 0).toFixed(1));
}

async function fetchWeather({ region, startDate, endDate }) {
  const station = stationByRegion[region] || stationByRegion.Nationwide;
  const url = new URL("https://apis.data.go.kr/1360000/AsosDalyInfoService/getWthrDataList");
  url.searchParams.set("serviceKey", serviceKey);
  url.searchParams.set("pageNo", "1");
  url.searchParams.set("numOfRows", String(maxDays + 5));
  url.searchParams.set("dataType", "JSON");
  url.searchParams.set("dataCd", "ASOS");
  url.searchParams.set("dateCd", "DAY");
  url.searchParams.set("startDt", compactDate(startDate));
  url.searchParams.set("endDt", compactDate(endDate));
  url.searchParams.set("stnIds", station.stnIds);

  const response = await fetch(url);
  const text = await response.text();
  let payload;
  try {
    payload = JSON.parse(text);
  } catch {
    throw new Error(`KMA returned non-JSON for ${region}: ${text.slice(0, 160)}`);
  }

  const header = payload?.response?.header;
  if (header && header.resultCode !== "00") {
    throw new Error(`KMA ${region} ${header.resultCode}: ${header.resultMsg}`);
  }

  const items = payload?.response?.body?.items?.item || [];
  const rows = Array.isArray(items) ? items : [items];
  return {
    region,
    station,
    requestedRange: { startDate, endDate },
    rows: rows.map((item) => ({
      date: item.tm,
      avgTempC: num(item.avgTa),
      minTempC: num(item.minTa),
      maxTempC: num(item.maxTa),
      precipitationMm: num(item.sumRn),
      humidityPct: num(item.avgRhm),
      weatherText: item.iscs || ""
    }))
  };
}

const targets = events.map((event) => {
  const startDate = shiftYear(event.startDate, -1);
  const endDate = clampEnd(startDate, shiftYear(event.endDate, -1));
  return {
    eventSlug: event.slug,
    eventTitle: event.title?.en || event.slug,
    region: event.weatherRegion || "Nationwide",
    eventRange: { startDate: event.startDate, endDate: event.endDate },
    previousYearRange: { startDate, endDate }
  };
});

const output = [];
for (const target of targets) {
  try {
    const weather = await fetchWeather({
      region: target.region,
      startDate: target.previousYearRange.startDate,
      endDate: target.previousYearRange.endDate
    });
    output.push({
      ...target,
      ok: true,
      station: weather.station,
      rows: weather.rows,
      summary: {
        avgTempC: average(weather.rows.map((row) => row.avgTempC)),
        avgMinTempC: average(weather.rows.map((row) => row.minTempC)),
        avgMaxTempC: average(weather.rows.map((row) => row.maxTempC)),
        totalPrecipitationMm: sum(weather.rows.map((row) => row.precipitationMm)),
        avgHumidityPct: average(weather.rows.map((row) => row.humidityPct)),
        observedDays: weather.rows.length
      }
    });
  } catch (error) {
    output.push({
      ...target,
      ok: false,
      error: error.message
    });
  }
}

const feed = {
  generatedAt: new Date().toISOString(),
  source: {
    name: "KMA ASOS Daily Weather API",
    url: "https://www.data.go.kr/en/data/15059093/openapi.do",
    endpoint: "https://apis.data.go.kr/1360000/AsosDalyInfoService/getWthrDataList"
  },
  note: "Previous-year observations are planning references, not forecasts. Review before merging into public copy.",
  count: output.length,
  items: output
};

const feedDir = path.join(root, "data", "feeds");
await fs.mkdir(feedDir, { recursive: true });
const out = path.join(feedDir, `weather-previous-year-${today}.json`);
await fs.writeFile(out, `${JSON.stringify(feed, null, 2)}\n`, "utf8");

console.table(output.map((item) => ({
  ok: item.ok,
  event: item.eventSlug,
  region: item.region,
  range: `${item.previousYearRange.startDate}..${item.previousYearRange.endDate}`,
  avgC: item.summary?.avgTempC ?? "",
  rainMm: item.summary?.totalPrecipitationMm ?? "",
  error: item.error || ""
})));
console.log(`Saved weather feed: ${out}`);
