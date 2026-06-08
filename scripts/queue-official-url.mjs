import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const args = process.argv.slice(2);
const categories = new Set(["festival", "kpop", "beauty", "duty-free", "department-store", "shopping", "travel-benefits"]);

function valueFor(flag) {
  const index = args.indexOf(flag);
  if (index === -1) return "";
  return args[index + 1] || "";
}

function usage() {
  console.error("Usage:");
  console.error("  npm.cmd run queue:source -- --url https://official.example/notice --source \"Official artist/company social channels\" --category kpop --label \"Artist pop-up notice\"");
  console.error("");
  console.error("Optional:");
  console.error("  --priority 90 --owner \"Agency\" --artist \"Artist\" --topics \"pop-up,merch,reservation\" --notes \"Confirm individual notice before publishing\" --status active");
}

function validUrl(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72) || "official-url";
}

function uniqueId(base, items, currentUrl) {
  const used = new Set(items.filter((item) => item.sourceUrl !== currentUrl).map((item) => item.id));
  let id = base;
  let suffix = 2;
  while (used.has(id)) {
    id = `${base}-${suffix}`;
    suffix += 1;
  }
  return id;
}

const sourceUrl = valueFor("--url").trim();
const sourceName = valueFor("--source").trim();
const category = valueFor("--category").trim();
const label = valueFor("--label").trim();
const priority = Number(valueFor("--priority") || 80);
const status = valueFor("--status").trim() || "active";
const ownerArg = valueFor("--owner").trim();
const artistArg = valueFor("--artist").trim() || valueFor("--brand").trim();
const topicsArg = valueFor("--topics").trim();
const reviewNotesArg = valueFor("--notes").trim();
const refreshArg = valueFor("--refresh").trim();

if (!sourceUrl || !sourceName || !category || !label) {
  usage();
  process.exit(1);
}

if (!validUrl(sourceUrl)) {
  console.error("--url must be a valid http(s) URL.");
  process.exit(1);
}

if (!categories.has(category)) {
  console.error(`--category must be one of: ${[...categories].join(", ")}`);
  process.exit(1);
}

if (!Number.isFinite(priority) || priority < 1 || priority > 100) {
  console.error("--priority must be a number from 1 to 100.");
  process.exit(1);
}

const sources = JSON.parse(await fs.readFile(path.join(root, "data", "sources.json"), "utf8"));
if (!sources.some((source) => source.name === sourceName)) {
  console.error(`--source must match a name in data/sources.json: ${sourceName}`);
  process.exit(1);
}

const queueFile = path.join(root, "data", "curation-queue.json");
const items = await fs.readFile(queueFile, "utf8").then(JSON.parse).catch(() => []);
if (!Array.isArray(items)) {
  console.error("data/curation-queue.json must contain an array.");
  process.exit(1);
}

const existingIndex = items.findIndex((item) => item.sourceUrl === sourceUrl);
const existing = existingIndex >= 0 ? items[existingIndex] : {};
const topics = (topicsArg ? topicsArg.split(",") : (existing.topics || [category]))
  .map((topic) => String(topic).trim())
  .filter(Boolean);
const next = {
  id: existingIndex >= 0 ? items[existingIndex].id : uniqueId(slugify(`${category}-${label}`), items, sourceUrl),
  status,
  priority,
  category,
  sourceName,
  sourceUrl,
  label,
  owner: ownerArg || existing.owner || "",
  artistOrBrand: artistArg || existing.artistOrBrand || "",
  topics,
  refreshCadence: refreshArg || existing.refreshCadence || "manual until promoted to source registry",
  reviewNotes: reviewNotesArg || existing.reviewNotes || "Open the official source, confirm dates, eligibility, reservation rules, and rewrite an original visitor summary before publishing."
};

if (existingIndex >= 0) items[existingIndex] = { ...items[existingIndex], ...next };
else items.push(next);

items.sort((a, b) => (b.priority || 0) - (a.priority || 0) || String(a.id).localeCompare(String(b.id)));
await fs.writeFile(queueFile, `${JSON.stringify(items, null, 2)}\n`, "utf8");

console.log(`${existingIndex >= 0 ? "Updated" : "Queued"} official URL: ${next.id}`);
