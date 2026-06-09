import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const eventsFile = path.join(root, "data", "events.json");
const outputDir = path.join(root, "assets", "event-thumbnails");
const officialDir = path.join(outputDir, "official");

const categoryPalettes = {
  festival: ["#bf3f4a", "#f0b84a", "#237b65"],
  kpop: ["#274c9f", "#d84875", "#1a9a96"],
  beauty: ["#2f8b57", "#f06f5c", "#f4c95d"],
  "duty-free": ["#193b62", "#d8a73b", "#1f8a82"],
  "department-store": ["#5d4a98", "#c78b38", "#0f766e"],
  shopping: ["#146c94", "#49a078", "#e7b44f"],
  "travel-benefits": ["#0d7f75", "#2e6c9f", "#f1c75b"]
};

const categoryNames = {
  festival: "FESTIVAL",
  kpop: "K-POP",
  beauty: "BEAUTY",
  "duty-free": "DUTY FREE",
  "department-store": "DEPARTMENT",
  shopping: "SHOPPING",
  "travel-benefits": "TRAVEL"
};

const brandProfiles = [
  {
    label: "OLIVE YOUNG",
    logoType: "olive-young",
    mark: ["OLIVE", "YOUNG"],
    descriptor: "K-BEAUTY DEAL",
    colors: ["#005c43", "#95c93d", "#fff4d2"],
    match: (text) => text.includes("olive young")
  },
  {
    label: "BTS",
    logoType: "bts",
    mark: ["BTS"],
    descriptor: "K-POP EVENT",
    colors: ["#1f1646", "#7c4dff", "#f05a8a"],
    match: (text) => text.includes("bts")
  },
  {
    label: "WEVERSE",
    logoType: "wordmark-pill",
    mark: ["WEVERSE"],
    descriptor: "FAN STORE",
    colors: ["#101820", "#00c8b8", "#8ef4d7"],
    match: (text) => text.includes("weverse")
  },
  {
    label: "SHILLA DUTY FREE",
    logoType: "duty-free",
    mark: ["SHILLA", "DUTY FREE"],
    descriptor: "DUTY FREE",
    colors: ["#11294f", "#c99a2e", "#f7e5b0"],
    match: (text) => text.includes("shilla")
  },
  {
    label: "LOTTE DUTY FREE",
    logoType: "duty-free",
    mark: ["LOTTE", "DUTY FREE"],
    descriptor: "DUTY FREE",
    colors: ["#a6122a", "#1f2d55", "#f4c95d"],
    match: (text) => text.includes("lotte duty")
  },
  {
    label: "DUTY FREE",
    logoType: "duty-free",
    mark: ["DUTY", "FREE"],
    descriptor: "SHOPPING BENEFIT",
    colors: ["#193b62", "#d8a73b", "#1f8a82"],
    match: (text) => text.includes("duty free")
  },
  {
    label: "SHINSEGAE",
    logoType: "department",
    mark: ["SHINSEGAE"],
    descriptor: "DEPARTMENT POP-UP",
    colors: ["#3d1f2b", "#b47b42", "#f1dfbf"],
    match: (text) => text.includes("shinsegae")
  },
  {
    label: "HYUNDAI",
    logoType: "department",
    mark: ["HYUNDAI"],
    descriptor: "DEPARTMENT EVENT",
    colors: ["#103a5f", "#5f8fb8", "#d6b06a"],
    match: (text) => text.includes("hyundai")
  },
  {
    label: "LOUIS VUITTON",
    logoType: "luxury",
    mark: ["LOUIS", "VUITTON"],
    descriptor: "EXHIBITION",
    colors: ["#201711", "#8c6a4f", "#e7d7bd"],
    match: (text) => text.includes("louis vuitton")
  },
  {
    label: "POKEMON",
    logoType: "character",
    mark: ["POKEMON"],
    descriptor: "CHARACTER EVENT",
    colors: ["#1d4f91", "#f3cf35", "#e75b4c"],
    match: (text) => text.includes("pokemon")
  },
  {
    label: "COEX",
    logoType: "wordmark-pill",
    mark: ["COEX"],
    descriptor: "EXPO",
    colors: ["#114b7a", "#21a0a0", "#f4c95d"],
    match: (text) => text.includes("coex")
  },
  {
    label: "PENTAPORT",
    logoType: "rock",
    mark: ["PENTA", "PORT"],
    descriptor: "ROCK FESTIVAL",
    colors: ["#191919", "#e04434", "#f5b942"],
    match: (text) => text.includes("pentaport")
  },
  {
    label: "BOF",
    logoType: "festival-logo",
    mark: ["BOF"],
    descriptor: "BUSAN K-POP",
    colors: ["#0d47a1", "#00a6d6", "#f76707"],
    match: (text) => text.includes("busan one asia")
  },
  {
    label: "MYK FESTA",
    logoType: "festival-logo",
    mark: ["MYK", "FESTA"],
    descriptor: "K-CULTURE FESTA",
    colors: ["#2b2d6e", "#da3f7b", "#f3b33d"],
    match: (text) => text.includes("myk")
  },
  {
    label: "VISITKOREA",
    logoType: "tourism",
    mark: ["VISIT", "KOREA"],
    descriptor: "OFFICIAL TOURISM",
    colors: ["#0d7f75", "#2e6c9f", "#f1c75b"],
    match: (text) => text.includes("visitkorea")
  },
  {
    label: "SEOUL",
    logoType: "city",
    mark: ["SEOUL"],
    descriptor: "CITY EVENT",
    colors: ["#0d7f75", "#2d6cdf", "#f4c95d"],
    match: (text, event) => text.includes("visit seoul") || event.city === "Seoul"
  },
  {
    label: "BUSAN",
    logoType: "city",
    mark: ["BUSAN"],
    descriptor: "CITY EVENT",
    colors: ["#0c5da5", "#00a6d6", "#f47b20"],
    match: (text, event) => text.includes("busan") || event.city === "Busan"
  },
  {
    label: "BORYEONG",
    logoType: "city",
    mark: ["BORYEONG"],
    descriptor: "MUD FESTIVAL",
    colors: ["#68422c", "#1e88a8", "#e7b44f"],
    match: (text) => text.includes("boryeong")
  },
  {
    label: "KOREA GRAND SALE",
    logoType: "sale",
    mark: ["KOREA", "GRAND SALE"],
    descriptor: "SHOPPING FESTA",
    colors: ["#bf3f4a", "#f0b84a", "#237b65"],
    match: (text) => text.includes("korea grand sale")
  }
];

function esc(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function local(value) {
  if (typeof value === "string") return value.trim();
  return (value?.en || "").trim();
}

function brandProfileFor(event) {
  const text = `${event.sourceName || ""} ${local(event.title)} ${event.venue || ""}`.toLowerCase();
  const profile = brandProfiles.find((item) => item.match(text, event));
  if (profile) return profile;
  const [primary, secondary, accent] = categoryPalettes[event.category] || categoryPalettes.festival;
  const fallback = categoryNames[event.category] || "KOREA";
  return {
    label: fallback,
    mark: wrapWords(fallback, 10, 2),
    descriptor: "KOREA EVENT",
    colors: [primary, secondary, accent]
  };
}

function brandFor(event) {
  return brandProfileFor(event).label;
}

function wrapWords(text, maxChars, maxLines) {
  const words = String(text || "").replace(/\s+/g, " ").trim().split(" ");
  const lines = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
    if (lines.length === maxLines - 1 && current.length > maxChars) break;
  }
  if (current) lines.push(current);
  if (lines.length > maxLines) lines.length = maxLines;
  if (lines.length === maxLines && words.join(" ").length > lines.join(" ").length) {
    lines[maxLines - 1] = `${lines[maxLines - 1].replace(/[.,:;!?-]+$/g, "")}...`;
  }
  return lines;
}

function textLines(lines, x, y, size, weight, fill, lineHeight = Math.round(size * 1.1)) {
  return lines.map((line, index) => (
    `<text x="${x}" y="${y + index * lineHeight}" fill="${fill}" font-size="${size}" font-weight="${weight}" letter-spacing="0">${esc(line)}</text>`
  )).join("\n");
}

function centeredTextLines(lines, x, y, size, weight, fill, lineHeight = Math.round(size * 1.05)) {
  return lines.map((line, index) => (
    `<text x="${x}" y="${y + index * lineHeight}" text-anchor="middle" fill="${fill}" font-size="${size}" font-weight="${weight}" letter-spacing="0">${esc(line)}</text>`
  )).join("\n");
}

function brandMark(profile, { primary, secondary, accent }) {
  const label = profile.label;
  const lines = profile.mark || wrapWords(label, 10, 2);
  const logoType = profile.logoType || "wordmark";

  if (logoType === "bts") {
    return `
    <g transform="translate(458 144)">
      <rect x="0" y="0" width="284" height="300" fill="#1f2024"/>
      <path d="M64 40 L134 106 L134 194 L64 226 Z" fill="#ffffff"/>
      <path d="M220 40 L150 106 L150 194 L220 226 Z" fill="#ffffff"/>
      <text x="142" y="278" text-anchor="middle" fill="#ffffff" font-size="58" font-weight="900" letter-spacing="18">BTS</text>
    </g>`;
  }

  if (logoType === "olive-young") {
    return `
    <g transform="translate(350 218)">
      <text x="250" y="0" text-anchor="middle" fill="#ffffff" font-size="86" font-weight="900">OLIVE</text>
      <text x="250" y="82" text-anchor="middle" fill="#ffffff" font-size="86" font-weight="900">YOUNG</text>
      <line x1="68" y1="118" x2="432" y2="118" stroke="#95c93d" stroke-width="12" stroke-linecap="round"/>
    </g>`;
  }

  if (logoType === "duty-free") {
    return `
    <g transform="translate(300 230)">
      ${centeredTextLines(lines, 300, lines.length > 1 ? 18 : 54, lines.length > 1 ? 64 : 92, 900, "#ffffff", 76)}
      <text x="300" y="158" text-anchor="middle" fill="${accent}" font-size="30" font-weight="900">TAX FREE SHOPPING</text>
    </g>`;
  }

  if (logoType === "department" || logoType === "luxury") {
    return `
    <g transform="translate(260 236)">
      ${centeredTextLines(lines, 340, lines.length > 1 ? 22 : 62, lines.length > 1 ? 72 : 98, 900, "#ffffff", 82)}
      <line x1="148" y1="132" x2="532" y2="132" stroke="${accent}" stroke-width="8" stroke-linecap="round"/>
    </g>`;
  }

  if (logoType === "character") {
    return `
    <g transform="translate(352 214)">
      <text x="248" y="88" text-anchor="middle" fill="#ffffff" font-size="82" font-weight="900">${esc(label)}</text>
      <circle cx="248" cy="142" r="18" fill="${secondary}"/>
    </g>`;
  }

  if (logoType === "rock") {
    return `
    <g transform="translate(320 194)">
      <path d="M34 194 L118 28 L206 166 L288 42 L382 170 L474 28 L550 194 Z" fill="#ffffff"/>
      ${centeredTextLines(lines, 292, 288, 58, 900, "#ffffff", 62)}
    </g>`;
  }

  if (logoType === "festival-logo" || logoType === "sale") {
    return `
    <g transform="translate(330 218)">
      ${centeredTextLines(lines, 270, lines.length > 1 ? 18 : 70, lines.length > 1 ? 78 : 108, 900, "#ffffff", 86)}
      <line x1="64" y1="146" x2="476" y2="146" stroke="${accent}" stroke-width="10" stroke-linecap="round"/>
    </g>`;
  }

  if (logoType === "tourism" || logoType === "city") {
    return `
    <g transform="translate(316 220)">
      ${centeredTextLines(lines, 284, lines.length > 1 ? 18 : 76, lines.length > 1 ? 76 : 110, 900, "#ffffff", 84)}
      <path d="M62 150 C150 90 230 90 314 148 C374 188 442 178 506 122" fill="none" stroke="${accent}" stroke-width="12" stroke-linecap="round"/>
    </g>`;
  }

  return centeredTextLines(lines, 600, lines.length > 1 ? 268 : 330, lines.length > 1 ? 96 : label.length > 12 ? 102 : 132, 900, "#ffffff", lines.length > 1 ? 100 : 132);
}

function dateLabel(event) {
  return event.dateLabel || `${event.startDate} - ${event.endDate}`;
}

function svgFor(event) {
  const profile = brandProfileFor(event);
  const [primary, secondary, accent] = profile.colors || categoryPalettes[event.category] || categoryPalettes.festival;
  const brand = profile.label;
  const title = local(event.title);
  const sourceLine = `${event.city} / ${event.sourceName}`;
  const eventKind = event.eventKind ? event.eventKind.replace("-", " ").toUpperCase() : categoryNames[event.category] || "EVENT";
  const initials = brand.split(/\s+/).map((part) => part[0]).join("").slice(0, 3);
  const mark = brandMark(profile, { primary, secondary, accent });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675" role="img" aria-labelledby="title desc">
  <title id="title">${esc(title)}</title>
  <desc id="desc">${esc(`${brand} ${dateLabel(event)} ${sourceLine}`)}</desc>
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${primary}"/>
      <stop offset="0.56" stop-color="${secondary}"/>
      <stop offset="1" stop-color="${accent}"/>
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#0b171b" flood-opacity="0.22"/>
    </filter>
  </defs>
  <rect width="1200" height="675" fill="url(#bg)"/>
  <text x="56" y="62" fill="#ffffff" font-size="20" font-weight="900" opacity="0.86">${esc(categoryNames[event.category] || "KOREA EVENT")}</text>
  <text x="1144" y="62" text-anchor="end" fill="#ffffff" font-size="20" font-weight="900" opacity="0.86">${esc(eventKind)}</text>
  <g filter="url(#shadow)">
    ${mark}
  </g>
  <text x="600" y="562" text-anchor="middle" fill="#ffffff" font-size="28" font-weight="900" opacity="0.92">${esc(brand)}</text>
  <text x="600" y="604" text-anchor="middle" fill="#ffffff" font-size="23" font-weight="850" opacity="0.82">${esc(dateLabel(event))}</text>
  <text x="1144" y="640" text-anchor="end" fill="#ffffff" font-size="18" font-weight="850" opacity="0.62">KOREA NOW GUIDE</text>
</svg>
`;
}

const events = JSON.parse(await fs.readFile(eventsFile, "utf8"));
await fs.mkdir(outputDir, { recursive: true });
await fs.mkdir(officialDir, { recursive: true });

const officialFiles = new Map();
for (const file of await fs.readdir(officialDir)) {
  const ext = path.extname(file).toLowerCase();
  if ([".jpg", ".jpeg", ".png", ".webp", ".svg"].includes(ext)) {
    officialFiles.set(path.basename(file, ext), file);
  }
}

for (const event of events) {
  const officialFile = officialFiles.get(event.slug);
  if (officialFile) {
    event.thumbnail = `assets/event-thumbnails/official/${officialFile}`;
    continue;
  }

  const fileName = `${event.slug}.svg`;
  event.thumbnail = `assets/event-thumbnails/${fileName}`;
  await fs.writeFile(path.join(outputDir, fileName), svgFor(event), "utf8");
}

await fs.writeFile(eventsFile, `${JSON.stringify(events, null, 2)}\n`, "utf8");
console.log(`Generated ${events.length} event thumbnails in ${path.relative(root, outputDir)}`);
