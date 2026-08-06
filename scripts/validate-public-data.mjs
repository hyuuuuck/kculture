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
    ...textFilesUnder("data/kto-nearby-reviewed.json"),
    ...textFilesUnder("data/public-data-anchors.json"),
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
const nearbyPath = "data/kto-nearby-reviewed.json";
const nearbyText = fs.existsSync(path.join(root, nearbyPath)) ? fs.readFileSync(path.join(root, nearbyPath), "utf8") : "";
const nearby = readJson(nearbyPath, nearbyPath);
const anchors = readJson("data/public-data-anchors.json", "data/public-data-anchors.json");
const events = readJson("data/events.json", "data/events.json");
const program = readJson("data/editorial-program.json", "data/editorial-program.json");
const today = new Date().toISOString().slice(0, 10);
const currentApproved = events.filter((event) => (program.indexableEvents || []).includes(event.slug) && event.endDate >= today);
const items = Array.isArray(snapshot.items) ? snapshot.items : [];
const bySlug = new Map(items.map((item) => [item.eventSlug, item]));
const approvedSlugs = new Set(program.indexableEvents || []);

function duplicates(values) {
  const seen = new Set();
  return values.filter((value) => seen.has(value) || !seen.add(value));
}

function narrativeTokens(value) {
  return new Set(String(value || "").toLowerCase().match(/[a-z0-9]+/g) || []);
}

function narrativeSimilarity(left, right) {
  const a = narrativeTokens(left);
  const b = narrativeTokens(right);
  const union = new Set([...a, ...b]);
  if (!union.size) return 0;
  return [...a].filter((token) => b.has(token)).length / union.size;
}

function latestFeed(pattern) {
  const feedDir = path.join(root, "data", "feeds");
  if (!fs.existsSync(feedDir)) return null;
  const file = fs.readdirSync(feedDir).filter((name) => pattern.test(name)).sort().at(-1);
  if (!file) return null;
  try {
    return JSON.parse(fs.readFileSync(path.join(feedDir, file), "utf8"));
  } catch {
    return null;
  }
}

validateLocalSecretIsolation();

if (normalizeDataGoServiceKey("sample%2Bkey%3D") !== "sample+key=") {
  errors.push("data.go.kr key normalization must accept percent-encoded Encoding keys.");
}
if (snapshot.source?.endpoint !== "https://apis.data.go.kr/1360000/AsosDalyInfoService/getWthrDataList") {
  errors.push("KMA historical observations must identify the official ASOS endpoint.");
}
if (snapshot.approvedOnly !== true) errors.push("KMA historical observations must be restricted to approved public events.");
if (/serviceKey|api[_-]?key|credential/i.test(snapshotText)) errors.push("public KMA snapshot must not contain API credentials or credential field names.");
if (/serviceKey|api[_-]?key|credential/i.test(nearbyText)) errors.push("public reviewed-nearby data must not contain API credentials or credential field names.");
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

if (nearby.source?.endpoint !== "https://apis.data.go.kr/B551011/EngService2/locationBasedList2") {
  errors.push("reviewed nearby data must identify the official KTO locationBasedList2 endpoint.");
}
if (!String(nearby.reviewedBy || "").includes("K-Spot Now")) errors.push("reviewed nearby data needs an accountable K-Spot Now reviewer.");
const nearbyReviewedAt = Date.parse(nearby.reviewedAt || "");
const nearbyAgeDays = Number.isFinite(nearbyReviewedAt) ? Math.floor((Date.now() - nearbyReviewedAt) / 86400000) : Number.NaN;
if (!Number.isFinite(nearbyReviewedAt)) errors.push("reviewed nearby data needs a valid reviewedAt date.");
if (Number.isFinite(nearbyAgeDays) && nearbyAgeDays > 90) errors.push(`reviewed nearby data is ${nearbyAgeDays} days old; refresh and re-review before publication.`);

const anchorRows = Array.isArray(anchors.anchors) ? anchors.anchors : [];
const anchorBySlug = new Map(anchorRows.map((anchor) => [anchor.eventSlug, anchor]));
const anchorDuplicates = duplicates(anchorRows.map((anchor) => anchor.eventSlug));
if (anchorDuplicates.length) errors.push(`public-data anchors contain duplicate event slugs: ${[...new Set(anchorDuplicates)].join(", ")}.`);
for (const slug of approvedSlugs) {
  const anchor = anchorBySlug.get(slug);
  if (!anchor) {
    errors.push(`${slug} is missing an explicit nearby-data anchor or exclusion.`);
    continue;
  }
  if (anchor.status === "verified") {
    if (!Number.isFinite(anchor.latitude) || !Number.isFinite(anchor.longitude)) errors.push(`${slug} has invalid official anchor coordinates.`);
    if (!/^https:\/\//.test(anchor.sourceUrl || "") || !anchor.sourceName || !anchor.sourceRecordId) errors.push(`${slug} has incomplete official anchor evidence.`);
  } else if (anchor.status === "excluded") {
    if (String(anchor.reason || "").length < 60) errors.push(`${slug} needs a specific reason for nearby-data exclusion.`);
  } else {
    errors.push(`${slug} has an unsupported nearby anchor status: ${anchor.status || "missing"}.`);
  }
}
for (const anchor of anchorRows) {
  if (!approvedSlugs.has(anchor.eventSlug)) errors.push(`${anchor.eventSlug} has a public-data anchor but is not approved for publication.`);
}

const nearbyEvents = Array.isArray(nearby.events) ? nearby.events : [];
const nearbyExclusions = Array.isArray(nearby.exclusions) ? nearby.exclusions : [];
const nearbyBySlug = new Map(nearbyEvents.map((item) => [item.eventSlug, item]));
const exclusionBySlug = new Map(nearbyExclusions.map((item) => [item.eventSlug, item]));
const nearbyDuplicates = duplicates(nearbyEvents.map((item) => item.eventSlug));
if (nearbyDuplicates.length) errors.push(`reviewed nearby data contains duplicate event slugs: ${[...new Set(nearbyDuplicates)].join(", ")}.`);
if (duplicates(nearbyExclusions.map((item) => item.eventSlug)).length) errors.push("reviewed nearby exclusions contain duplicate event slugs.");

const selectedContentIds = [];
const narrativeSamples = [];
for (const event of currentApproved) {
  const anchor = anchorBySlug.get(event.slug);
  const reviewed = nearbyBySlug.get(event.slug);
  const exclusion = exclusionBySlug.get(event.slug);
  if (anchor?.status === "verified" && !reviewed) errors.push(`${event.slug} has a verified anchor but no reviewed nearby options.`);
  if (anchor?.status === "excluded" && !exclusion) errors.push(`${event.slug} is excluded at the anchor layer but missing the public review exclusion record.`);
  if (reviewed && exclusion) errors.push(`${event.slug} cannot have both reviewed nearby options and an exclusion.`);
}

for (const item of nearbyEvents) {
  if (!approvedSlugs.has(item.eventSlug)) errors.push(`${item.eventSlug} has reviewed nearby options but is not an approved event.`);
  if (anchorBySlug.get(item.eventSlug)?.status !== "verified") errors.push(`${item.eventSlug} publishes nearby options without a verified official anchor.`);
  if (!item.anchorLabel || !Array.isArray(item.options) || item.options.length < 1 || item.options.length > 3) {
    errors.push(`${item.eventSlug} needs one to three deliberately reviewed nearby options.`);
    continue;
  }
  if (String(item.routeQuestion || "").length < 90) errors.push(`${item.eventSlug} needs a specific editorial route question.`);
  if (!Array.isArray(item.routeEssay) || item.routeEssay.length !== 2 || item.routeEssay.some((paragraph) => String(paragraph).length < 220)) {
    errors.push(`${item.eventSlug} needs two substantive, event-specific route paragraphs.`);
  } else {
    item.routeEssay.forEach((paragraph, index) => narrativeSamples.push({ id: `${item.eventSlug}:routeEssay:${index}`, text: paragraph }));
  }
  for (const option of item.options) {
    selectedContentIds.push(option.contentId);
    if (!/^\d+$/.test(String(option.contentId || ""))) errors.push(`${item.eventSlug} has an invalid KTO contentId.`);
    if (["80", "85"].includes(String(option.contentTypeId))) errors.push(`${item.eventSlug}/${option.contentId} cannot publish accommodation or event-listing records as a nearby option.`);
    if (!Number.isFinite(option.distanceMeters) || option.distanceMeters <= 0 || option.distanceMeters > 3000) errors.push(`${item.eventSlug}/${option.contentId} has an invalid nearby distance.`);
    if (!/[가-힣]/.test(option.mapQueryKo || "")) errors.push(`${item.eventSlug}/${option.contentId} needs a Korean map query.`);
    if (String(option.routeRole || "").length < 15) errors.push(`${item.eventSlug}/${option.contentId} needs a distinct route role.`);
    if (String(option.officialRecordNote || "").length < 170) errors.push(`${item.eventSlug}/${option.contentId} needs an editorial explanation of what the KTO record changes.`);
    if (String(option.visitorDecision || "").length < 100) errors.push(`${item.eventSlug}/${option.contentId} needs substantive original visitor-decision guidance.`);
    if (String(option.stopRule || "").length < 70) errors.push(`${item.eventSlug}/${option.contentId} needs a specific stop rule.`);
    narrativeSamples.push({ id: `${item.eventSlug}/${option.contentId}:officialRecordNote`, text: option.officialRecordNote });
  }
}
if (duplicates(selectedContentIds).length) errors.push("the same KTO contentId is selected more than once across reviewed event routes.");
for (let left = 0; left < narrativeSamples.length; left += 1) {
  for (let right = left + 1; right < narrativeSamples.length; right += 1) {
    if (narrativeSimilarity(narrativeSamples[left].text, narrativeSamples[right].text) > 0.62) {
      errors.push(`${narrativeSamples[left].id} and ${narrativeSamples[right].id} are too structurally similar; write distinct editorial analysis.`);
    }
  }
}
for (const exclusion of nearbyExclusions) {
  if (!approvedSlugs.has(exclusion.eventSlug) || String(exclusion.reason || "").length < 60) errors.push(`${exclusion.eventSlug || "unknown exclusion"} has an invalid nearby-data exclusion.`);
}

const rawNearby = latestFeed(/^kto-nearby-\d{4}-\d{2}-\d{2}\.json$/);
if (rawNearby) {
  for (const item of nearbyEvents) {
    const rawEvent = (rawNearby.results || []).find((candidate) => candidate.eventSlug === item.eventSlug);
    for (const option of item.options || []) {
      const raw = rawEvent?.items?.find((candidate) => String(candidate.contentId) === String(option.contentId));
      if (!raw) {
        errors.push(`${item.eventSlug}/${option.contentId} is not present in the latest private KTO nearby feed.`);
        continue;
      }
      if (!String(raw.title || "").startsWith(option.title)) errors.push(`${item.eventSlug}/${option.contentId} title no longer matches the latest KTO record.`);
      if (String(raw.contentTypeId) !== String(option.contentTypeId)) errors.push(`${item.eventSlug}/${option.contentId} content type no longer matches the latest KTO record.`);
      if (Math.abs(Number(raw.distanceMeters) - Number(option.distanceMeters)) > 5) errors.push(`${item.eventSlug}/${option.contentId} distance changed by more than five metres from the reviewed value.`);
      const detail = rawEvent?.reviewedDetailEvidence?.find((candidate) => String(candidate.contentId) === String(option.contentId));
      if (!detail || String(detail.overview || "").length < 80) errors.push(`${item.eventSlug}/${option.contentId} is missing current private KTO detail evidence for the editorial note.`);
    }
  }
}

if (errors.length) {
  console.error("Public-data validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

if (ageDays > 14) {
  console.warn(`Public-data validation warning: KMA observation snapshot is ${ageDays} days old and will be hidden by the build until refreshed.`);
} else {
  console.log(`Public-data validation passed: ${currentApproved.length} current approved events have KMA evidence; ${nearbyEvents.length} have reviewed KTO nearby decisions and ${nearbyExclusions.length} has an explicit no-guess exclusion.`);
}
