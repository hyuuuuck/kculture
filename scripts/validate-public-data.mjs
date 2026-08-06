import fs from "node:fs";
import path from "node:path";
import { normalizeDataGoServiceKey } from "./lib/public-data.mjs";

const root = process.cwd();
const errors = [];

function textFilesUnder(relative) {
  const target = path.join(root, relative);
  if (!fs.existsSync(target)) return [];
  const stat = fs.statSync(target);
  if (stat.isFile()) return [target];
  return fs.readdirSync(target, { withFileTypes: true }).flatMap((entry) => {
    if ([".git", "node_modules", "feeds", "assets"].includes(entry.name)) return [];
    return textFilesUnder(path.relative(root, path.join(target, entry.name)));
  });
}

function validateLocalSecretIsolation() {
  const envPath = path.join(root, ".env");
  if (!fs.existsSync(envPath)) return;
  const credentials = fs.readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .map((line) => line.match(/^\s*(KTO_SERVICE_KEY|KMA_SERVICE_KEY|SEOUL_OPEN_DATA_KEY)\s*=\s*(.*?)\s*$/))
    .filter(Boolean)
    .map((match) => ({ name: match[1], value: match[2].replace(/^['"]|['"]$/g, "") }))
    .filter((item) => item.value.length >= 8)
    .flatMap((item) => {
      const normalized = item.name === "SEOUL_OPEN_DATA_KEY" ? item.value : normalizeDataGoServiceKey(item.value);
      return [...new Set([item.value, normalized])].map((value) => ({ name: item.name, value }));
    });
  const allowedExtensions = new Set([".css", ".html", ".js", ".json", ".md", ".mjs", ".yaml", ".yml"]);
  const publicFiles = [
    ...textFilesUnder("data/kma-historical-observations.json"),
    ...textFilesUnder("data/source-refresh-summary.json"),
    ...textFilesUnder("dist"),
    ...textFilesUnder("scripts"),
    ...textFilesUnder(".github")
  ].filter((file) => allowedExtensions.has(path.extname(file)) && fs.statSync(file).size <= 2_000_000);
  for (const file of publicFiles) {
    const text = fs.readFileSync(file, "utf8");
    for (const credential of credentials) {
      if (text.includes(credential.value)) {
        errors.push(`${path.relative(root, file)} contains the local ${credential.name} value.`);
      }
    }
  }
}

function readJson(relative, label) {
  try {
    return JSON.parse(fs.readFileSync(path.join(root, relative), "utf8"));
  } catch (error) {
    errors.push(`${label} is missing or invalid: ${error.message}`);
    return {};
  }
}

const snapshotPath = "data/kma-historical-observations.json";
const snapshotText = fs.existsSync(path.join(root, snapshotPath)) ? fs.readFileSync(path.join(root, snapshotPath), "utf8") : "";
const snapshot = readJson(snapshotPath, snapshotPath);
const events = readJson("data/events.json", "data/events.json");
const program = readJson("data/editorial-program.json", "data/editorial-program.json");
const today = new Date().toISOString().slice(0, 10);
const currentApproved = events.filter((event) => (program.indexableEvents || []).includes(event.slug) && event.endDate >= today);
const items = Array.isArray(snapshot.items) ? snapshot.items : [];
const bySlug = new Map(items.map((item) => [item.eventSlug, item]));

validateLocalSecretIsolation();

if (normalizeDataGoServiceKey("sample%2Bkey%3D") !== "sample+key=") {
  errors.push("data.go.kr key normalization must accept percent-encoded Encoding keys.");
}
if (snapshot.source?.endpoint !== "https://apis.data.go.kr/1360000/AsosDalyInfoService/getWthrDataList") {
  errors.push("KMA historical observations must identify the official ASOS endpoint.");
}
if (snapshot.approvedOnly !== true) errors.push("KMA historical observations must be restricted to approved public events.");
if (/serviceKey|api[_-]?key|credential/i.test(snapshotText)) errors.push("public KMA snapshot must not contain API credentials or credential field names.");
if (new Set(items.map((item) => item.eventSlug)).size !== items.length) errors.push("KMA historical observations contain duplicate event slugs.");

for (const event of currentApproved) {
  const item = bySlug.get(event.slug);
  if (!item) {
    errors.push(`${event.slug} is missing a KMA same-period observation record.`);
    continue;
  }
  if (!item.ok || item.summary?.observedDays < 1) errors.push(`${event.slug} has no usable KMA observed days.`);
  if (!item.previousYearRange?.startDate || !item.previousYearRange?.endDate) errors.push(`${event.slug} is missing its previous-year observation range.`);
}

const generatedAt = Date.parse(snapshot.generatedAt || "");
if (!Number.isFinite(generatedAt)) errors.push("KMA historical observations need a valid generatedAt timestamp.");
const ageDays = Number.isFinite(generatedAt) ? Math.floor((Date.now() - generatedAt) / 86400000) : Number.NaN;

if (errors.length) {
  console.error("Public-data validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

if (ageDays > 14) {
  console.warn(`Public-data validation warning: KMA observation snapshot is ${ageDays} days old and will be hidden by the build until refreshed.`);
} else {
  console.log(`Public-data validation passed: ${currentApproved.length} current approved events have credential-free KMA observation evidence (${ageDays} day(s) old).`);
}
