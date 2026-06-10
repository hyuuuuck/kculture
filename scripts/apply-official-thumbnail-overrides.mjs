import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const eventsFile = path.join(root, "data", "events.json");
const sourcesFile = path.join(root, "data", "thumbnail-sources.json");
const overridesFile = path.join(root, "data", "official-thumbnail-overrides.json");
const outputDir = path.join(root, "assets", "event-thumbnails", "official");
const timeoutMs = Number(process.env.THUMBNAIL_TIMEOUT_MS || 20000);

function escapeXml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrapWords(value, max = 16) {
  const words = String(value || "").split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > max && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 3);
}

const palettes = {
  bts: { bg: "#151519", panel: "#f7f7f2", accent: "#ffffff", ink: "#ffffff", sub: "#d8dbe2" },
  coex: { bg: "#0f4c81", panel: "#ffffff", accent: "#75d0ff", ink: "#ffffff", sub: "#dceeff" },
  "seoul-green": { bg: "#0f6248", panel: "#f4fff9", accent: "#b8e65c", ink: "#ffffff", sub: "#d9f4e8" },
  weverse: { bg: "#101820", panel: "#f8fafc", accent: "#00d8c0", ink: "#ffffff", sub: "#d7e1e7" },
  seventeen: { bg: "#173f5f", panel: "#f6f0ff", accent: "#f7cac9", ink: "#ffffff", sub: "#dce8ff" },
  health: { bg: "#075c6b", panel: "#f7fffb", accent: "#70e1b5", ink: "#ffffff", sub: "#d8f3f0" },
  hyundai: { bg: "#1f2933", panel: "#f8f3ea", accent: "#c8a15a", ink: "#ffffff", sub: "#efe8d7" },
  blackpink: { bg: "#121212", panel: "#fff0f6", accent: "#ff9ec3", ink: "#ffffff", sub: "#f3cfdd" },
  nol: { bg: "#2a1230", panel: "#fff5f7", accent: "#ff5d7e", ink: "#ffffff", sub: "#f0d3da" },
  melon: { bg: "#0c2b16", panel: "#f3fff5", accent: "#42e06b", ink: "#ffffff", sub: "#cdebd2" },
  "kpop-navy": { bg: "#101d3a", panel: "#f2f6ff", accent: "#7aa7ff", ink: "#ffffff", sub: "#d4e0f7" }
};

function brandMark(config) {
  const brand = String(config.brand || "").toUpperCase();
  const brandFontSize = brand.length > 12 ? 32 : brand.length > 8 ? 40 : brand.length > 6 ? 46 : 52;
  if (config.palette === "bts") {
    return `<g transform="translate(70 70)">
        <rect width="250" height="300" rx="8" fill="#202124"/>
        <path d="M52 38 L118 100 L118 232 L52 260 Z" fill="#ffffff"/>
        <path d="M198 38 L132 100 L132 232 L198 260 Z" fill="#ffffff"/>
        <text x="125" y="286" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="48" font-weight="800" letter-spacing="10" fill="#ffffff">BTS</text>
      </g>`;
  }

  return `<g transform="translate(70 78)">
      <rect width="300" height="170" rx="18" fill="${palettes[config.palette]?.panel || "#ffffff"}"/>
      <text x="150" y="96" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="${brandFontSize}" font-weight="800" fill="#102033">${escapeXml(brand)}</text>
    </g>`;
}

function renderIdentityCard(config) {
  const palette = palettes[config.palette] || palettes.weverse;
  const titleLines = wrapWords(config.title, 14);
  const subtitleLines = wrapWords(config.subtitle, 24);
  const titleSvg = titleLines.map((line, index) => (
    `<text x="420" y="${226 + index * 68}" font-family="Arial, Helvetica, sans-serif" font-size="58" font-weight="850" fill="${palette.ink}">${escapeXml(line)}</text>`
  )).join("\n");
  const subtitleSvg = subtitleLines.map((line, index) => (
    `<text x="420" y="${452 + index * 42}" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="700" fill="${palette.sub}">${escapeXml(line)}</text>`
  )).join("\n");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675" role="img" aria-label="${escapeXml(config.alt)}">
  <rect width="1200" height="675" fill="${palette.bg}"/>
  <rect x="42" y="42" width="1116" height="591" rx="28" fill="none" stroke="rgba(255,255,255,0.22)" stroke-width="2"/>
  ${brandMark(config)}
  <text x="420" y="126" font-family="Arial, Helvetica, sans-serif" font-size="21" font-weight="800" fill="${palette.accent}">OFFICIAL SOURCE CARD</text>
  ${titleSvg}
  ${subtitleSvg}
  <rect x="420" y="548" width="540" height="46" rx="23" fill="rgba(255,255,255,0.13)"/>
  <text x="446" y="579" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="700" fill="${palette.ink}">Source: ${escapeXml(config.sourceLabel)}</text>
  <path d="M1010 545 h64 a24 24 0 0 1 0 48 h-64 a24 24 0 0 1 0-48z" fill="${palette.accent}"/>
  <text x="1042" y="577" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="900" fill="#102033">KS</text>
</svg>
`;
}

async function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: {
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 KSpotNow/0.1",
        "accept": "image/avif,image/webp,image/png,image/jpeg,image/*,*/*;q=0.8"
      }
    });
  } finally {
    clearTimeout(timer);
  }
}

async function writeOverrideAsset(config) {
  const extension = config.extension || ".svg";
  const localPath = `assets/event-thumbnails/official/${config.slug}${extension}`;
  const filePath = path.join(root, localPath);

  if (config.mode === "download") {
    const response = await fetchWithTimeout(config.downloadUrl || config.sourceUrl);
    if (!response.ok) throw new Error(`${config.slug}: thumbnail download failed HTTP ${response.status}`);
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.byteLength < 1800) throw new Error(`${config.slug}: downloaded thumbnail is too small`);
    await fs.writeFile(filePath, buffer);
    return { localPath, width: null, height: null };
  }

  await fs.writeFile(filePath, renderIdentityCard(config), "utf8");
  return { localPath, width: 1200, height: 675 };
}

const [events, sources, overrides] = await Promise.all([
  fs.readFile(eventsFile, "utf8").then(JSON.parse),
  fs.readFile(sourcesFile, "utf8").then(JSON.parse).catch(() => ({})),
  fs.readFile(overridesFile, "utf8").then(JSON.parse)
]);

await fs.mkdir(outputDir, { recursive: true });

const eventsBySlug = new Map(events.map((event) => [event.slug, event]));
for (const config of overrides) {
  const event = eventsBySlug.get(config.slug);
  if (!event) throw new Error(`Unknown event slug in official thumbnail override: ${config.slug}`);

  const asset = await writeOverrideAsset(config);
  event.thumbnail = asset.localPath;
  sources[config.slug] = {
    localPath: asset.localPath,
    sourceUrl: config.sourceUrl,
    sourceImageUrl: config.downloadUrl || "",
    sourcePage: config.sourcePage || config.sourceUrl,
    kind: config.kind,
    score: config.score,
    width: asset.width,
    height: asset.height,
    alt: config.alt,
    context: config.context,
    collectedAt: new Date().toISOString()
  };
  console.log(`official override ${config.slug} -> ${asset.localPath}`);
}

await fs.writeFile(eventsFile, `${JSON.stringify(events, null, 2)}\n`, "utf8");
await fs.writeFile(sourcesFile, `${JSON.stringify(sources, null, 2)}\n`, "utf8");
console.log(`Applied ${overrides.length} official thumbnail overrides.`);
