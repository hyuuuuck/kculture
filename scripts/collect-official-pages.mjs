import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { todayString } from "./lib/date.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const today = todayString();
const timeoutMs = Number(process.env.COLLECT_TIMEOUT_MS || 10000);
const maxLinksPerSource = Number(process.env.COLLECT_MAX_LINKS || 18);
const minLinkScore = Number(process.env.COLLECT_MIN_LINK_SCORE || 7);
const extraUrls = (process.env.MONITOR_URLS || "")
  .split(",")
  .map((url) => url.trim())
  .filter(Boolean);

const sources = JSON.parse(await fs.readFile(path.join(root, "data", "sources.json"), "utf8"));
const curationQueue = await fs.readFile(path.join(root, "data", "curation-queue.json"), "utf8")
  .then(JSON.parse)
  .catch(() => []);
const sourceByName = new Map(sources.map((source) => [source.name, source]));

function curationSource(item) {
  const registrySource = sourceByName.get(item.sourceName) || {};
  return {
    name: item.sourceName,
    type: "curated-official-url",
    owner: item.owner || registrySource.owner || "curation",
    url: item.sourceUrl,
    coverage: item.topics || [item.category || "manual curation"],
    refreshCadence: item.refreshCadence || registrySource.refreshCadence || "manual",
    automationStatus: "curation-queue",
    notes: item.reviewNotes || registrySource.notes || "Curated official URL queued for manual review.",
    queueId: item.id,
    queueLabel: item.label,
    queueCategory: item.category,
    queuePriority: item.priority,
    artistOrBrand: item.artistOrBrand,
    reviewNotes: item.reviewNotes
  };
}

const queueSources = curationQueue
  .filter((item) => item.status === "active")
  .map(curationSource);
const monitorSources = sources
  .filter((source) => ["official-page-monitor", "official-listing-monitor", "curation-queue"].includes(source.type))
  .concat(queueSources)
  .concat(extraUrls.map((url) => ({
    name: `Manual URL: ${url}`,
    type: "manual-url",
    owner: "manual",
    url,
    coverage: ["manual"],
    refreshCadence: "manual",
    automationStatus: "monitor-and-curate",
    notes: "Added through MONITOR_URLS."
  })));

function normalizeDate(year, month, day) {
  const y = String(year).padStart(4, "0");
  const m = String(month).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function decodeEntities(text) {
  return text
    .replaceAll("&nbsp;", " ")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

function stripHtml(html) {
  return decodeEntities(html)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim();
}

function cleanAnchorLabel(value) {
  return cleanText(value)
    .replace(/\[[^\]]{1,120}\]/g, " ")
    .replace(/\b(?:w|h|bdr|obj-f|bg|c|d|p|m|ta|fw|fs|lh|bd|radius|aspect|grid|flex|gap|pos|top|left|right|bottom|z|op|translate|scale|rotate|overflow|display|items|justify|rounded|shadow|text|font|leading|tracking|line-clamp)_[^\s]+/gi, " ")
    .replace(/(?:^|\s)[_*>\]:.-]{2,}(?=\s|$)/g, " ")
    .replace(/^(?:\s*[:|/\\-]+\s*)+/, "")
    .replace(/\s+(?:[:|/\\-]\s*){2,}/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function attrValue(tag, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = tag.match(new RegExp(`\\s${escaped}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
  return decodeEntities(match?.[2] || match?.[3] || match?.[4] || "");
}

function officialHostKey(hostname) {
  const parts = String(hostname || "").toLowerCase().replace(/^www\./, "").split(".").filter(Boolean);
  if (parts.length <= 2) return parts.join(".");
  const lastTwo = parts.slice(-2).join(".");
  if (lastTwo === "kr" && parts.length >= 3) return parts.slice(-3).join(".");
  if (/^(co|or|go|ne|ac)\.kr$/.test(lastTwo) && parts.length >= 3) return parts.slice(-3).join(".");
  return parts.slice(-2).join(".");
}

function normalizeCandidateUrl(value) {
  try {
    const url = new URL(value);
    url.hash = "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return "";
  }
}

function isOfficialSameSite(url, baseUrl) {
  try {
    const parsed = new URL(url);
    const base = new URL(baseUrl);
    if (!["http:", "https:"].includes(parsed.protocol)) return false;
    return officialHostKey(parsed.hostname) === officialHostKey(base.hostname);
  } catch {
    return false;
  }
}

function isSkippableLink(url, label) {
  const value = `${url} ${label}`.toLowerCase();
  return /(?:^|[#?/])(login|logout|signin|signup|join|mypage|cart|basket|privacy|terms|policy|customer|faq|notice$|search|language|lang=|javascript|mailto:|tel:)/i.test(value)
    || /^(home|menu|search|login|sign in|cart|my page|privacy policy|terms|facebook|instagram|youtube|wechat|close)$/i.test(cleanText(label));
}

function scoreDiscoveredLink({ url, label, context }) {
  const text = `${label} ${url} ${context}`;
  const lower = text.toLowerCase();
  const hits = keywordHits(text);
  const dates = extractPageDateSignals(text);
  let score = hits.length * 4 + dates.length * 3;
  if (/(event|festival|notice|planning|popup|pop-up|concert|ticket|sale|coupon|benefit|exhibit|show|detail|view|product|contents)/i.test(lower)) score += 5;
  if (/20\d{2}/.test(text)) score += 3;
  if (/(k-pop|kpop|weverse|artist|idol|fan|merch|reservation|duty.?free|olive.?young|department.?store)/i.test(lower)) score += 4;
  if (/(\uD589\uC0AC|\uCD95\uC81C|\uC138\uC77C|\uD560\uC778|\uBA74\uC138|\uBC31\uD654\uC810|\uD31D\uC5C5|\uAD7F\uC988|\uC608\uB9E4|\uC608\uC57D)/.test(text)) score += 4;
  if (label.length >= 12) score += 1;
  return { score, hits, dates };
}

function extractOfficialLinks(html, baseUrl) {
  const links = [];
  const seen = new Set();

  for (const match of html.matchAll(/<a\b[\s\S]*?<\/a>/gi)) {
    const raw = match[0];
    const openTag = raw.match(/^<a\b[^>]*>/i)?.[0] || raw;
    const href = attrValue(openTag, "href");
    if (!href || /^#/.test(href) || /^(javascript|mailto|tel):/i.test(href)) continue;

    let parsed;
    try {
      parsed = new URL(href, baseUrl);
    } catch {
      continue;
    }

    const normalized = normalizeCandidateUrl(parsed.toString());
    if (!normalized || seen.has(normalized) || !isOfficialSameSite(normalized, baseUrl)) continue;

    const label = cleanAnchorLabel([
      stripHtml(raw),
      attrValue(openTag, "aria-label"),
      attrValue(openTag, "title")
    ].filter(Boolean).join(" "));
    if (label.length < 2 || isSkippableLink(normalized, label)) continue;

    const contextHtml = html.slice(Math.max(0, match.index - 360), Math.min(html.length, match.index + raw.length + 420));
    const context = cleanText(stripHtml(contextHtml));
    const scored = scoreDiscoveredLink({ url: normalized, label, context });
    if (scored.score < minLinkScore) continue;

    seen.add(normalized);
    links.push({
      url: normalized,
      text: label.slice(0, 180),
      score: scored.score,
      keywordHits: scored.hits,
      dateSignals: scored.dates,
      context: context.slice(0, 520),
      reason: [
        scored.hits.length ? `${scored.hits.length} keyword hits` : "",
        scored.dates.length ? `${scored.dates.length} date signals` : "",
        /20\d{2}/.test(context) ? "year signal" : ""
      ].filter(Boolean).join("; ") || "official same-site link"
    });
  }

  return links
    .sort((a, b) => b.score - a.score || b.dateSignals.length - a.dateSignals.length || a.text.localeCompare(b.text))
    .slice(0, maxLinksPerSource);
}

function extractTitle(html, fallback) {
  const og = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i);
  const title = og?.[1] || html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  return decodeEntities((title || fallback).replace(/\s+/g, " ").trim());
}

function normalizeCharset(charset) {
  const value = String(charset || "").trim().toLowerCase().replace(/^["']|["']$/g, "");
  if (!value) return "";
  if (["ks_c_5601-1987", "ks_c_5601", "x-windows-949", "cp949", "ms949"].includes(value)) return "euc-kr";
  if (value === "utf8") return "utf-8";
  return value;
}

function sniffCharset(headers, bytes) {
  const contentType = headers.get("content-type") || "";
  const headerCharset = contentType.match(/charset=([^;\s]+)/i)?.[1];
  if (headerCharset) return normalizeCharset(headerCharset);

  const asciiPreview = new TextDecoder("windows-1252").decode(bytes.slice(0, 4096));
  const metaCharset = asciiPreview.match(/<meta[^>]+charset=["']?\s*([^"'\s/>]+)/i)?.[1]
    || asciiPreview.match(/<meta[^>]+content=["'][^"']*charset=([^"'\s;>]+)/i)?.[1];
  return normalizeCharset(metaCharset) || "utf-8";
}

async function decodeHtml(response) {
  const bytes = new Uint8Array(await response.arrayBuffer());
  const charset = sniffCharset(response.headers, bytes);
  try {
    return new TextDecoder(charset).decode(bytes);
  } catch {
    return new TextDecoder("utf-8").decode(bytes);
  }
}

function extractDateSignals(text) {
  const signals = new Map();
  const currentYear = Number(today.slice(0, 4));
  const monthNames = {
    jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4,
    may: 5, jun: 6, june: 6, jul: 7, july: 7, aug: 8, august: 8,
    sep: 9, sept: 9, september: 9, oct: 10, october: 10, nov: 11, november: 11, dec: 12, december: 12
  };

  for (const match of text.matchAll(/\b(20\d{2})[.\-/년]\s*(\d{1,2})[.\-/월]\s*(\d{1,2})/g)) {
    signals.set(normalizeDate(match[1], match[2], match[3]), { date: normalizeDate(match[1], match[2], match[3]), raw: match[0] });
  }

  for (const match of text.matchAll(/\b(\d{1,2})[./](\d{1,2})\s*(?:-|~|–|—|to)\s*(\d{1,2})[./](\d{1,2})\b/g)) {
    signals.set(normalizeDate(currentYear, match[1], match[2]), { date: normalizeDate(currentYear, match[1], match[2]), raw: match[0] });
    signals.set(normalizeDate(currentYear, match[3], match[4]), { date: normalizeDate(currentYear, match[3], match[4]), raw: match[0] });
  }

  for (const match of text.matchAll(/\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{1,2})(?:\s*(?:-|~|–|—|to)\s*(?:(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s*)?(\d{1,2}))?,?\s*(20\d{2})?/gi)) {
    const startMonth = monthNames[match[1].toLowerCase()];
    const year = match[5] || currentYear;
    signals.set(normalizeDate(year, startMonth, match[2]), { date: normalizeDate(year, startMonth, match[2]), raw: match[0] });
    if (match[4]) {
      const endMonth = match[3] ? monthNames[match[3].toLowerCase()] : startMonth;
      signals.set(normalizeDate(year, endMonth, match[4]), { date: normalizeDate(year, endMonth, match[4]), raw: match[0] });
    }
  }

  return [...signals.values()].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 18);
}

function extractPageDateSignals(text) {
  const signals = new Map();
  const currentYear = Number(today.slice(0, 4));
  const monthNames = {
    jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4,
    may: 5, jun: 6, june: 6, jul: 7, july: 7, aug: 8, august: 8,
    sep: 9, sept: 9, september: 9, oct: 10, october: 10, nov: 11, november: 11, dec: 12, december: 12
  };
  const add = (year, month, day, raw) => {
    const date = normalizeDate(year, month, day);
    signals.set(date, { date, raw });
  };

  for (const match of text.matchAll(/\b(20\d{2})\s*(?:[.\-/]|\uB144)\s*(\d{1,2})\s*(?:[.\-/]|\uC6D4|\u6708)\s*(\d{1,2})\s*(?:\uC77C|\u65E5)?/g)) {
    add(match[1], match[2], match[3], match[0]);
  }

  for (const match of text.matchAll(/\b(\d{1,2})[./](\d{1,2})\s*(?:-|~|\u2013|\u2014|to|until|through)\s*(\d{1,2})[./](\d{1,2})\b/gi)) {
    add(currentYear, match[1], match[2], match[0]);
    add(currentYear, match[3], match[4], match[0]);
  }

  for (const match of text.matchAll(/(\d{1,2})\s*(?:\uC6D4|\u6708)\s*(\d{1,2})\s*(?:\uC77C|\u65E5)?\s*(?:-|~|\u2013|\u2014|\uBD80\uD130|\uAE4C\uC9C0)\s*(?:(\d{1,2})\s*(?:\uC6D4|\u6708)\s*)?(\d{1,2})\s*(?:\uC77C|\u65E5)?/g)) {
    add(currentYear, match[1], match[2], match[0]);
    add(currentYear, match[3] || match[1], match[4], match[0]);
  }

  for (const match of text.matchAll(/\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{1,2})(?:\s*(?:-|~|\u2013|\u2014|to|until|through)\s*(?:(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s*)?(\d{1,2}))?,?\s*(20\d{2})?/gi)) {
    const startMonth = monthNames[match[1].toLowerCase()];
    const year = match[5] || currentYear;
    add(year, startMonth, match[2], match[0]);
    if (match[4]) {
      const endMonth = match[3] ? monthNames[match[3].toLowerCase()] : startMonth;
      add(year, endMonth, match[4], match[0]);
    }
  }

  return [...signals.values()].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 18);
}

function snippetsAroundDates(text, dateSignals) {
  return dateSignals.slice(0, 8).map((signal) => {
    const index = text.indexOf(signal.raw);
    if (index === -1) return signal.raw;
    const start = Math.max(0, index - 130);
    const end = Math.min(text.length, index + signal.raw.length + 180);
    return text.slice(start, end).replace(/\s+/g, " ").trim();
  });
}

function keywordHits(text) {
  const keywords = [
    "festival", "popup", "pop-up", "event", "sale", "coupon", "duty free",
    "olive young", "k-pop", "kpop", "weverse", "department store", "travel", "benefit",
    "\uD589\uC0AC", "\uCD95\uC81C", "\uC138\uC77C", "\uD560\uC778", "\uCFE0\uD3F0", "\uD61C\uD0DD",
    "\uBA74\uC138", "\uBC31\uD654\uC810", "\uD31D\uC5C5", "\uD31D\uC5C5\uC2A4\uD1A0\uC5B4",
    "\uC62C\uB9AC\uBE0C\uC601", "\uC544\uC774\uB3CC", "\uAD7F\uC988", "\uC608\uC57D",
    "\u30A4\u30D9\u30F3\u30C8", "\u30BB\u30FC\u30EB", "\u514D\u7A0E", "\u4F18\u60E0", "\u6D3B\u52A8"
  ];
  const lower = text.toLowerCase();
  return keywords.filter((keyword) => lower.includes(keyword));
}

async function fetchSource(source) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(source.url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "accept-language": "en-US,en;q=0.9,ko;q=0.8",
        "user-agent": "Mozilla/5.0 KoreaNowGuideCollector/0.1"
      }
    });
    const html = await decodeHtml(response);
    const text = stripHtml(html);
    const dates = extractPageDateSignals(text);
    const discoveredLinks = extractOfficialLinks(html, response.url || source.url);
    return {
      sourceName: source.name,
      owner: source.owner,
      type: source.type,
      url: source.url,
      finalUrl: response.url,
      status: response.status,
      ok: response.ok,
      checkedAt: new Date().toISOString(),
      pageTitle: extractTitle(html, source.name),
      keywordHits: keywordHits(text),
      dateSignals: dates,
      discoveredLinks,
      snippets: snippetsAroundDates(text, dates),
      reviewRequired: true,
      publishable: false,
      notes: source.notes,
      queueId: source.queueId,
      queueLabel: source.queueLabel,
      queueCategory: source.queueCategory,
      queuePriority: source.queuePriority,
      artistOrBrand: source.artistOrBrand,
      reviewNotes: source.reviewNotes
    };
  } catch (error) {
    return {
      sourceName: source.name,
      owner: source.owner,
      type: source.type,
      url: source.url,
      status: "ERR",
      ok: false,
      checkedAt: new Date().toISOString(),
      error: error.name === "AbortError" ? "timeout" : error.message,
      reviewRequired: true,
      publishable: false,
      notes: source.notes,
      queueId: source.queueId,
      queueLabel: source.queueLabel,
      queueCategory: source.queueCategory,
      queuePriority: source.queuePriority,
      artistOrBrand: source.artistOrBrand,
      reviewNotes: source.reviewNotes
    };
  } finally {
    clearTimeout(timeout);
  }
}

const candidates = [];
for (const source of monitorSources) {
  candidates.push(await fetchSource(source));
}

const feed = {
  generatedAt: new Date().toISOString(),
  policy: "Candidates are not auto-published. Review official source, date range, eligibility, and rights before merging into data/events.json.",
  count: candidates.length,
  candidates
};

const feedDir = path.join(root, "data", "feeds");
await fs.mkdir(feedDir, { recursive: true });
const out = path.join(feedDir, `official-page-candidates-${today}.json`);
await fs.writeFile(out, `${JSON.stringify(feed, null, 2)}\n`, "utf8");

console.table(candidates.map((item) => ({
  ok: item.ok,
  status: item.status,
  source: item.sourceName,
  dates: item.dateSignals?.length || 0,
  links: item.discoveredLinks?.length || 0,
  keywords: item.keywordHits?.join(", ") || "",
  error: item.error || ""
})));
console.log(`Saved review feed: ${out}`);
