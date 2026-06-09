import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { todayString } from "./lib/date.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const today = todayString();

const targets = {
  Seoul: { zone: "1114055000", label: "Seoul Myeongdong", ko: "서울특별시 중구 명동" },
  Busan: { zone: "2635053000", label: "Busan Haeundae", ko: "부산광역시 해운대구 중제1동" },
  Incheon: { zone: "2818583000", label: "Incheon Songdo", ko: "인천광역시 연수구 송도2동" },
  Goyang: { zone: "4128151000", label: "Goyang", ko: "경기도 고양시 주교동" },
  Gwacheon: { zone: "4129052000", label: "Gwacheon", ko: "경기도 과천시 갈현동" },
  Boryeong: { zone: "4418051500", label: "Boryeong Daecheon", ko: "충청남도 보령시 대천1동" },
  Daegu: { zone: "2729051500", label: "Daegu Dalseo", ko: "대구광역시 달서구 성당동" },
  Jinju: { zone: "4817051500", label: "Jinju", ko: "경상남도 진주시 천전동" },
  Andong: { zone: "4717051000", label: "Andong", ko: "경상북도 안동시 중구동" },
  Seongnam: { zone: "4113565700", label: "Seongnam Pangyo", ko: "경기도 성남시분당구 백현동" },
  Nationwide: { zone: "1114055000", label: "Seoul national fallback", ko: "서울특별시 중구 명동" }
};

const cityMap = {
  Seoul: "Seoul",
  Busan: "Busan",
  Incheon: "Incheon",
  Goyang: "Goyang",
  Gwacheon: "Gwacheon",
  Boryeong: "Boryeong",
  Daegu: "Daegu",
  Jinju: "Jinju",
  Andong: "Andong",
  Seongnam: "Seongnam",
  Nationwide: "Nationwide"
};

const weatherRegionMap = {
  Seoul: "Seoul",
  Busan: "Busan",
  Incheon: "Incheon",
  Nationwide: "Nationwide"
};

function tag(block, name) {
  const match = block.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`));
  return match ? decodeXml(match[1].trim()) : "";
}

function decodeXml(value) {
  return String(value || "")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", "\"")
    .replaceAll("&apos;", "'")
    .replaceAll("&amp;", "&");
}

function num(value) {
  const n = Number(String(value || "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function compactDateToIso(value) {
  const text = String(value || "");
  if (!/^\d{12}$/.test(text)) return today;
  return `${text.slice(0, 4)}-${text.slice(4, 6)}-${text.slice(6, 8)}`;
}

function addDays(iso, days) {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function average(values) {
  const usable = values.filter((value) => value !== null && Number.isFinite(value));
  if (!usable.length) return null;
  return Number((usable.reduce((sum, value) => sum + value, 0) / usable.length).toFixed(1));
}

function min(values) {
  const usable = values.filter((value) => value !== null && Number.isFinite(value));
  return usable.length ? Math.min(...usable) : null;
}

function max(values) {
  const usable = values.filter((value) => value !== null && Number.isFinite(value));
  return usable.length ? Math.max(...usable) : null;
}

function mode(values) {
  const counts = new Map();
  for (const value of values.filter(Boolean)) {
    counts.set(value, (counts.get(value) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] || "";
}

function rainSignal(row) {
  return row.pty !== 0 || (row.popPct || 0) >= 50 || /rain|shower|비|소나기/i.test(`${row.weatherEn} ${row.weatherKo}`);
}

function summarizePeriod(rows) {
  if (!rows.length) return null;
  return {
    weatherEn: mode(rows.map((row) => row.weatherEn)),
    weatherKo: mode(rows.map((row) => row.weatherKo)),
    maxPopPct: max(rows.map((row) => row.popPct)),
    minTempC: min(rows.map((row) => row.tempC)),
    maxTempC: max(rows.map((row) => row.tempC)),
    rainLikely: rows.some(rainSignal)
  };
}

function summarizeDay(date, rows) {
  const weatherEn = mode(rows.map((row) => row.weatherEn));
  const weatherKo = mode(rows.map((row) => row.weatherKo));
  const rainLikely = rows.some(rainSignal);
  const maxPopPct = max(rows.map((row) => row.popPct));
  const minTempC = min(rows.map((row) => row.tempC));
  const maxTempC = max(rows.map((row) => row.tempC));
  const avgHumidityPct = average(rows.map((row) => row.humidityPct));
  const minHumidityPct = min(rows.map((row) => row.humidityPct));
  const maxHumidityPct = max(rows.map((row) => row.humidityPct));
  const amRows = rows.filter((row) => row.hour < 12);
  const pmRows = rows.filter((row) => row.hour >= 12);
  return {
    date,
    hourCount: rows.length,
    weatherEn,
    weatherKo,
    minTempC,
    maxTempC,
    maxPopPct,
    avgHumidityPct,
    minHumidityPct,
    maxHumidityPct,
    rainLikely,
    periods: {
      am: summarizePeriod(amRows),
      pm: summarizePeriod(pmRows)
    }
  };
}

function summarizeRegion(rows) {
  const byDate = new Map();
  for (const row of rows) {
    if (!byDate.has(row.date)) byDate.set(row.date, []);
    byDate.get(row.date).push(row);
  }
  const days = [...byDate.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, dayRows]) => summarizeDay(date, dayRows));
  return {
    days,
    firstDate: days[0]?.date || null,
    lastDate: days.at(-1)?.date || null,
    minTempC: min(days.map((day) => day.minTempC)),
    maxTempC: max(days.map((day) => day.maxTempC)),
    maxPopPct: max(days.map((day) => day.maxPopPct)),
    minHumidityPct: min(days.map((day) => day.minHumidityPct)),
    maxHumidityPct: max(days.map((day) => day.maxHumidityPct)),
    rainLikely: days.some((day) => day.rainLikely),
    weatherEn: mode(days.map((day) => day.weatherEn)),
    weatherKo: mode(days.map((day) => day.weatherKo))
  };
}

async function fetchForecast(key, target) {
  const url = `https://www.weather.go.kr/w/rss/dfs/hr1-forecast.do?zone=${target.zone}`;
  const response = await fetch(url);
  const text = await response.text();
  if (!response.ok || !/^<\?xml|<rss/i.test(text.trim())) {
    throw new Error(`KMA RSS returned non-XML for ${key}: ${text.slice(0, 120)}`);
  }

  const title = tag(text, "title");
  const publishedAtText = tag(text, "pubDate");
  const tm = tag(text, "tm");
  const baseDate = compactDateToIso(tm);
  const blocks = [...text.matchAll(/<data seq="[^"]+">([\s\S]*?)<\/data>/g)].map((match) => match[1]);
  const rows = blocks.map((block) => {
    const dayOffset = Number(tag(block, "day") || 0);
    return {
      date: addDays(baseDate, Number.isFinite(dayOffset) ? dayOffset : 0),
      hour: Number(tag(block, "hour") || 0),
      tempC: num(tag(block, "temp")),
      weatherKo: tag(block, "wfKor"),
      weatherEn: tag(block, "wfEn"),
      pcp: tag(block, "pcp"),
      popPct: num(tag(block, "pop")),
      humidityPct: num(tag(block, "reh")),
      pty: Number(tag(block, "pty") || 0)
    };
  });

  return {
    key,
    ...target,
    title,
    sourceUrl: `https://www.weather.go.kr/w/weather/forecast/short-term.do#dong/${target.zone}`,
    publishedAtText,
    baseTime: tm,
    generatedDate: today,
    rowCount: rows.length,
    summary: summarizeRegion(rows)
  };
}

const regions = {};
for (const [key, target] of Object.entries(targets)) {
  try {
    regions[key] = await fetchForecast(key, target);
  } catch (error) {
    regions[key] = {
      key,
      ...target,
      ok: false,
      error: error.message,
      rows: [],
      summary: { days: [] }
    };
  }
}

const payload = {
  generatedAt: new Date().toISOString(),
  generatedDate: today,
  source: {
    name: "KMA 1-hour Village Forecast RSS",
    owner: "Korea Meteorological Administration",
    url: "https://www.weather.go.kr/plus/rss.jsp",
    endpointTemplate: "https://www.weather.go.kr/w/rss/dfs/hr1-forecast.do?zone={code}",
    terms: "KMA RSS page states source attribution is required."
  },
  cityMap,
  weatherRegionMap,
  regions
};

await fs.writeFile(path.join(root, "data", "kma-forecast.json"), `${JSON.stringify(payload, null, 2)}\n`, "utf8");

console.table(Object.values(regions).map((region) => ({
  region: region.key,
  label: region.label,
  days: region.summary?.days?.length || 0,
  range: [region.summary?.firstDate, region.summary?.lastDate].filter(Boolean).join(".."),
  temp: region.summary?.minTempC === null ? "" : `${region.summary?.minTempC}-${region.summary?.maxTempC}C`,
  rain: region.summary?.maxPopPct ?? "",
  error: region.error || ""
})));
console.log("Saved data/kma-forecast.json");
