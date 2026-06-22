import fs from "node:fs";
import path from "node:path";
import { publicLanguageCodes } from "./lib/public-languages.mjs";

const root = process.cwd();
const distDir = path.join(root, "dist");
const localizedLangs = publicLanguageCodes().filter((lang) => lang !== "en");
const minCandidateLength = 24;

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function hasEnglishWords(value) {
  const withoutCommonCodes = String(value || "").replace(/\b(KST|BTS|KMA|KPOP|VIP|UV|AM|PM)\b/g, "");
  return /\b[A-Za-z]{4,}\b/.test(withoutCommonCodes);
}

function addCandidate(candidates, value, origin) {
  const text = normalizeText(value);
  if (text.length < minCandidateLength || !hasEnglishWords(text)) return;
  if (!candidates.has(text)) candidates.set(text, new Set());
  candidates.get(text).add(origin);
}

function addLocalizedCandidate(candidates, value, origin) {
  if (!value) return;
  if (typeof value === "string") {
    addCandidate(candidates, value, origin);
    return;
  }
  addCandidate(candidates, value.en, `${origin}.en`);
}

function eventRawCandidates(events) {
  const candidates = new Map();
  for (const event of events) {
    addLocalizedCandidate(candidates, event.summary, `${event.slug}:summary`);
    addLocalizedCandidate(candidates, event.whyGo, `${event.slug}:whyGo`);

    if (Array.isArray(event.travelTips)) {
      event.travelTips.forEach((tip, index) => addCandidate(candidates, tip, `${event.slug}:travelTips[${index}]`));
    } else if (Array.isArray(event.travelTips?.en)) {
      event.travelTips.en.forEach((tip, index) => addCandidate(candidates, tip, `${event.slug}:travelTips.en[${index}]`));
    }

    (event.officialHighlights || []).forEach((item, index) => {
      addCandidate(candidates, item, `${event.slug}:officialHighlights[${index}]`);
    });

    for (const key of ["theme", "hours", "programHours", "transportation", "parking", "smartGuide"]) {
      addCandidate(candidates, event.visitorInfo?.[key], `${event.slug}:visitorInfo.${key}`);
    }

    (event.venueSchedule || []).forEach((item, index) => {
      addCandidate(candidates, item.status, `${event.slug}:venueSchedule[${index}].status`);
      addCandidate(candidates, item.note, `${event.slug}:venueSchedule[${index}].note`);
    });

    addCandidate(candidates, event.dateLabel, `${event.slug}:dateLabel`);
  }
  return candidates;
}

function routeRawCandidates(routes, candidates) {
  for (const route of routes) {
    addCandidate(candidates, route.bestFor, `${route.slug}:bestFor`);
    (route.tips || []).forEach((tip, index) => addCandidate(candidates, tip, `${route.slug}:tips[${index}]`));
  }
  return candidates;
}

function listLocalizedOutputFiles() {
  const files = [];
  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (/\.(html|xml|json)$/i.test(entry.name)) {
        files.push(fullPath);
      }
    }
  }
  for (const lang of localizedLangs) walk(path.join(distDir, lang));
  return files;
}

function scanForLeaks(files, candidates) {
  const leaks = [];
  for (const file of files) {
    const relPath = path.relative(distDir, file).replace(/\\/g, "/");
    const content = normalizeText(fs.readFileSync(file, "utf8"));
    for (const [text, origins] of candidates.entries()) {
      if (content.includes(text)) {
        leaks.push({
          file: relPath,
          text,
          origins: [...origins].slice(0, 4)
        });
      }
    }
  }
  return leaks;
}

const events = readJson(path.join(root, "data/events.json"));
const routes = readJson(path.join(root, "data/travel-routes.json"));
const candidates = routeRawCandidates(routes, eventRawCandidates(events));
const files = listLocalizedOutputFiles();
const leaks = scanForLeaks(files, candidates);

if (leaks.length) {
  console.error(`Localization depth audit failed: ${leaks.length} source-language leaks found.`);
  console.error(JSON.stringify(leaks.slice(0, 60), null, 2));
  process.exit(1);
}

console.log(`Localization depth audit passed: ${candidates.size} source strings checked across ${files.length} localized files.`);
