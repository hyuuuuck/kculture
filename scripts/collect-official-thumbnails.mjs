import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const eventsFile = path.join(root, "data", "events.json");
const outputDir = path.join(root, "assets", "event-thumbnails", "official");
const reportFile = path.join(root, "data", "feeds", `official-thumbnails-${new Date().toISOString().slice(0, 10)}.json`);
const timeoutMs = Number(process.env.THUMBNAIL_TIMEOUT_MS || 12000);
const maxBytes = Number(process.env.THUMBNAIL_MAX_BYTES || 5_000_000);
const userAgent = process.env.SOURCE_USER_AGENT || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36 KoreaNowGuide/0.1";

function decodeEntities(text) {
  return String(text || "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

function stripHtml(html) {
  return decodeEntities(html)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function attrValue(tag, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = tag.match(new RegExp(`\\s${escaped}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
  return decodeEntities(match?.[2] || match?.[3] || match?.[4] || "");
}

function absoluteUrl(value, baseUrl) {
  const raw = decodeEntities(String(value || "").trim()).replace(/^\/\//, "https://");
  if (!raw || /^(data:|blob:|javascript:|mailto:|tel:)/i.test(raw)) return "";
  try {
    return new URL(raw, baseUrl).toString();
  } catch {
    return "";
  }
}

function sourceFromSrcset(value, baseUrl) {
  return String(value || "")
    .split(",")
    .map((part) => part.trim().split(/\s+/)[0])
    .map((url) => absoluteUrl(url, baseUrl))
    .filter(Boolean)
    .at(-1) || "";
}

function imageExtension(url, contentType) {
  const fromType = String(contentType || "").toLowerCase();
  if (fromType.includes("png")) return ".png";
  if (fromType.includes("webp")) return ".webp";
  if (fromType.includes("svg")) return ".svg";
  if (fromType.includes("jpeg") || fromType.includes("jpg")) return ".jpg";
  try {
    const ext = path.extname(new URL(url).pathname).toLowerCase();
    if ([".jpg", ".jpeg", ".png", ".webp", ".svg"].includes(ext)) return ext === ".jpeg" ? ".jpg" : ext;
  } catch {
    // ignore
  }
  return ".jpg";
}

function readUInt24LE(buffer, offset) {
  return buffer[offset] | (buffer[offset + 1] << 8) | (buffer[offset + 2] << 16);
}

function imageInfo(buffer) {
  const info = { width: null, height: null, type: "unknown" };

  if (buffer.length >= 24 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    info.type = "png";
    info.width = buffer.readUInt32BE(16);
    info.height = buffer.readUInt32BE(20);
  } else if (buffer.length >= 12 && buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP") {
    info.type = "webp";
    const chunk = buffer.subarray(12, 16).toString("ascii");
    if (chunk === "VP8X" && buffer.length >= 30) {
      info.width = readUInt24LE(buffer, 24) + 1;
      info.height = readUInt24LE(buffer, 27) + 1;
    } else if (chunk === "VP8L" && buffer.length >= 25) {
      const b0 = buffer[21];
      const b1 = buffer[22];
      const b2 = buffer[23];
      const b3 = buffer[24];
      info.width = (((b1 & 0x3f) << 8) | b0) + 1;
      info.height = (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6)) + 1;
    } else if (chunk === "VP8 " && buffer.length >= 30) {
      info.width = buffer.readUInt16LE(26) & 0x3fff;
      info.height = buffer.readUInt16LE(28) & 0x3fff;
    }
  } else if (buffer.subarray(0, 512).toString("utf8").includes("<svg")) {
    info.type = "svg";
    const text = buffer.toString("utf8", 0, Math.min(buffer.length, 2048));
    const width = text.match(/\bwidth="(\d+)"/i)?.[1];
    const height = text.match(/\bheight="(\d+)"/i)?.[1];
    const viewBox = text.match(/\bviewBox="[^"]*?(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)"/i);
    info.width = width ? Number(width) : viewBox ? Number(viewBox[1]) : null;
    info.height = height ? Number(height) : viewBox ? Number(viewBox[2]) : null;
  } else if (buffer.length >= 4 && buffer[0] === 0xff && buffer[1] === 0xd8) {
    info.type = "jpg";
    let offset = 2;
    while (offset + 9 < buffer.length) {
      if (buffer[offset] !== 0xff) {
        offset += 1;
        continue;
      }
      while (buffer[offset] === 0xff) offset += 1;
      const marker = buffer[offset];
      offset += 1;
      if (marker === 0xd9 || marker === 0xda) break;
      const length = buffer.readUInt16BE(offset);
      if (length < 2 || offset + length > buffer.length) break;
      if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
        info.height = buffer.readUInt16BE(offset + 3);
        info.width = buffer.readUInt16BE(offset + 5);
        break;
      }
      offset += length;
    }
  }

  return info;
}

function textTerms(event) {
  const text = [
    event.slug,
    event.sourceName,
    event.venue,
    typeof event.title === "string" ? event.title : event.title?.en,
    typeof event.summary === "string" ? event.summary : event.summary?.en
  ].join(" ").toLowerCase();
  const extra = [
    "bts", "olive", "young", "shilla", "lotte", "hyundai", "shinsegae", "coex",
    "visitkorea", "busan", "seoul", "pentaport", "mud", "pokemon", "weverse",
    "duty", "free", "festival", "popup", "pop-up", "concert", "sale"
  ].filter((term) => text.includes(term));
  const words = text
    .replace(/[^a-z0-9가-힣]+/gi, " ")
    .split(/\s+/)
    .filter((word) => word.length >= 4 && !/^(2026|event|events|korea|seoul|busan|official|global)$/.test(word));
  return [...new Set([...extra, ...words])].slice(0, 36);
}

function candidateScore(candidate, event) {
  const haystack = `${candidate.url} ${candidate.alt} ${candidate.context} ${candidate.kind}`.toLowerCase();
  if (/(?:no-img|no_image|placeholder|blank|favicon|sprite|sns-|ico_|icon_|\/icons?\/|thumb_v01|head_logo|logo_footer|comm\/logo|coex-logo-white|weverseshop-og|mainvisual_txt_bg|wa-mark)/i.test(haystack)) {
    return -100;
  }
  const terms = textTerms(event);
  let score = 0;
  for (const term of terms) {
    if (haystack.includes(term.toLowerCase())) score += term.length > 6 ? 5 : 3;
  }
  if (/og:image|twitter:image|json-ld/i.test(candidate.kind)) score += 18;
  if (/poster|banner|visual|thumb|thumbnail|main|event|festival|popup|pop-up|concert|sale|planning|notice|promotion/i.test(haystack)) score += 12;
  if (/logo|ci|brand/i.test(haystack)) score += event.category === "beauty" || event.category === "duty-free" || event.category === "department-store" ? 8 : 2;
  if (/sns|facebook|instagram|youtube|favicon|icon|sprite|blank|loading|placeholder|arrow|close|search|qr/i.test(haystack)) score -= 30;
  if (/\.(jpg|jpeg|png|webp|svg)(?:[?#]|$)/i.test(candidate.url)) score += 5;
  return score;
}

function addCandidate(candidates, seen, baseUrl, rawUrl, kind, alt = "", context = "") {
  const url = absoluteUrl(rawUrl, baseUrl);
  if (!url || seen.has(url)) return;
  if (!/\.(jpg|jpeg|png|webp|svg)(?:[?#]|$)/i.test(url) && !/image|img|cdn|upload|banner|thumb|poster|visual/i.test(url)) return;
  seen.add(url);
  candidates.push({ url, kind, alt: decodeEntities(alt).trim(), context: stripHtml(context).slice(0, 260) });
}

function extractJsonLdImages(html, baseUrl, candidates, seen) {
  for (const match of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    const raw = decodeEntities(match[1]).trim();
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      const nodes = Array.isArray(parsed) ? parsed : [parsed];
      for (const node of nodes) {
        const graph = Array.isArray(node?.["@graph"]) ? node["@graph"] : [node];
        for (const item of graph) {
          const images = Array.isArray(item?.image) ? item.image : [item?.image];
          for (const image of images.filter(Boolean)) {
            const value = typeof image === "string" ? image : image.url || image.contentUrl;
            addCandidate(candidates, seen, baseUrl, value, "json-ld image", item.name || item.headline || "", raw.slice(0, 500));
          }
        }
      }
    } catch {
      // Many official pages ship malformed JSON-LD. Skip quietly.
    }
  }
}

function extractCandidates(html, baseUrl) {
  const candidates = [];
  const seen = new Set();

  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const tag = match[0];
    const key = `${attrValue(tag, "property")} ${attrValue(tag, "name")}`.toLowerCase();
    if (!/(og:image|twitter:image|image)/.test(key)) continue;
    addCandidate(candidates, seen, baseUrl, attrValue(tag, "content"), key.trim(), "", tag);
  }

  extractJsonLdImages(html, baseUrl, candidates, seen);

  for (const match of html.matchAll(/<img\b[^>]*>/gi)) {
    const tag = match[0];
    const srcset = attrValue(tag, "srcset") || attrValue(tag, "data-srcset");
    const raw = sourceFromSrcset(srcset, baseUrl)
      || attrValue(tag, "src")
      || attrValue(tag, "data-src")
      || attrValue(tag, "data-original")
      || attrValue(tag, "data-lazy")
      || attrValue(tag, "data-url");
    const context = html.slice(Math.max(0, match.index - 320), Math.min(html.length, match.index + tag.length + 320));
    addCandidate(candidates, seen, baseUrl, raw, "img tag", `${attrValue(tag, "alt")} ${attrValue(tag, "title")}`, context);
  }

  for (const match of html.matchAll(/background(?:-image)?\s*:\s*url\((['"]?)([^'")]+)\1\)/gi)) {
    const context = html.slice(Math.max(0, match.index - 260), Math.min(html.length, match.index + 360));
    addCandidate(candidates, seen, baseUrl, match[2], "css background", "", context);
  }

  return candidates;
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "user-agent": userAgent,
        "accept-language": "en-US,en;q=0.9,ko;q=0.8",
        ...(options.headers || {})
      }
    });
  } finally {
    clearTimeout(timer);
  }
}

async function downloadImage(candidate, event) {
  const response = await fetchWithTimeout(candidate.url, {
    headers: {
      accept: "image/avif,image/webp,image/png,image/jpeg,image/svg+xml,image/*,*/*;q=0.8",
      referer: event.sourceUrl
    }
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const contentType = response.headers.get("content-type") || "";
  if (!/image|octet-stream/i.test(contentType)) throw new Error(`not an image content-type: ${contentType}`);

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  if (buffer.byteLength < 1800) throw new Error(`too small: ${buffer.byteLength} bytes`);
  if (buffer.byteLength > maxBytes) throw new Error(`too large: ${buffer.byteLength} bytes`);

  const info = imageInfo(buffer);
  if (info.width !== null && info.height !== null) {
    if (info.width < 240 || info.height < 140) throw new Error(`too small dimensions: ${info.width}x${info.height}`);
    const ratio = info.width / info.height;
    if (ratio > 4.2 || ratio < 0.38) throw new Error(`bad thumbnail aspect ratio: ${info.width}x${info.height}`);
  }

  const ext = imageExtension(candidate.url, contentType);
  const fileName = `${event.slug}${ext}`;
  const filePath = path.join(outputDir, fileName);
  await fs.writeFile(filePath, buffer);
  return { fileName, bytes: buffer.byteLength, contentType, width: info.width, height: info.height };
}

async function collectForEvent(event) {
  const result = {
    slug: event.slug,
    sourceUrl: event.sourceUrl,
    selected: null,
    candidates: [],
    errors: []
  };

  try {
    const response = await fetchWithTimeout(event.sourceUrl, {
      headers: { accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" }
    });
    if (!response.ok) throw new Error(`source page HTTP ${response.status}`);
    const html = await response.text();
    const candidates = extractCandidates(html, event.sourceUrl)
      .map((candidate) => ({ ...candidate, score: candidateScore(candidate, event) }))
      .sort((a, b) => b.score - a.score);
    result.candidates = candidates.slice(0, 8);

    for (const candidate of candidates.slice(0, 8)) {
      if (candidate.score < 8) continue;
      try {
        const downloaded = await downloadImage(candidate, event);
        result.selected = { ...candidate, ...downloaded, localPath: `assets/event-thumbnails/official/${downloaded.fileName}` };
        break;
      } catch (error) {
        result.errors.push(`${candidate.url}: ${error.message}`);
      }
    }
  } catch (error) {
    result.errors.push(error.message);
  }

  return result;
}

const events = JSON.parse(await fs.readFile(eventsFile, "utf8"));
await fs.mkdir(outputDir, { recursive: true });
await fs.mkdir(path.dirname(reportFile), { recursive: true });

const results = [];
for (const event of events) {
  const result = await collectForEvent(event);
  results.push(result);
  console.log(`${result.selected ? "downloaded" : "fallback"} ${event.slug}${result.selected ? ` <- ${result.selected.url}` : ""}`);
}

const downloaded = results.filter((item) => item.selected).length;
await fs.writeFile(reportFile, `${JSON.stringify({ generatedAt: new Date().toISOString(), downloaded, total: events.length, results }, null, 2)}\n`, "utf8");
console.log(`Official thumbnail collection finished: ${downloaded}/${events.length}. Report: ${path.relative(root, reportFile)}`);
