import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const events = JSON.parse(fs.readFileSync(path.join(root, "data", "events.json"), "utf8"));
const guides = JSON.parse(fs.readFileSync(path.join(root, "data", "guides.json"), "utf8"));
const program = JSON.parse(fs.readFileSync(path.join(root, "data", "editorial-program.json"), "utf8"));
const eventBySlug = new Map(events.map((event) => [event.slug, event]));
const guideBySlug = new Map(guides.map((guide) => [guide.slug, guide]));
const failures = [];
const approvedEvents = [...new Set(program.indexableEvents || [])];
const approvedGuides = [...new Set(program.indexableGuides || [])];
const firstHandClaimRe = /\b(?:i|we)\s+(?:visited|attended|bought|tested|tried|stayed|experienced)\b/i;

function words(value) {
  return String(value || "").match(/[\p{L}\p{N}]+(?:['’.-][\p{L}\p{N}]+)*/gu) || [];
}

function wordCount(value) {
  return words(value).length;
}

function tokenSet(value) {
  return new Set(words(value).map((word) => word.toLocaleLowerCase("en")));
}

function jaccardSimilarity(a, b) {
  const left = tokenSet(a);
  const right = tokenSet(b);
  if (!left.size || !right.size) return 0;
  const intersection = [...left].filter((token) => right.has(token)).length;
  return intersection / new Set([...left, ...right]).size;
}

function fail(id, message) {
  failures.push(`${id}: ${message}`);
}

function evidenceFor(event, review) {
  return [
    ...(Array.isArray(event?.audit?.sourceEvidence) ? event.audit.sourceEvidence : []),
    ...(Array.isArray(review?.sourceEvidence) ? review.sourceEvidence : [])
  ];
}

if (!approvedEvents.length) {
  failures.push("No reviewed events are configured for publication.");
}

if (!approvedGuides.length) {
  failures.push("No reviewed guides are configured for publication.");
}

for (const slug of approvedEvents) {
  const event = eventBySlug.get(slug);
  const review = program.eventReviews?.[slug];
  if (!event) {
    fail(slug, "reviewed event data is missing.");
    continue;
  }
  if (!review) {
    fail(slug, "manual editorial review is missing.");
    continue;
  }

  const summary = event.summary?.en || "";
  const whyGo = event.whyGo?.en || "";
  const decision = review.visitorDecision || "";
  const checks = Array.isArray(review.foreignerChecks) ? review.foreignerChecks.filter(Boolean) : [];
  const tips = Array.isArray(event.travelTips) ? event.travelTips.filter(Boolean) : [];
  const editorialText = [whyGo, decision, ...checks, ...tips].join(" ");
  const evidence = evidenceFor(event, review);

  if (wordCount(summary) < 24) fail(slug, "English summary needs at least 24 substantive words.");
  if (wordCount(whyGo) < 20) fail(slug, "visitor-value explanation needs at least 20 substantive words.");
  if (wordCount(decision) < 25) fail(slug, "editorial visitor decision needs at least 25 substantive words.");
  if (checks.length < 3 || checks.some((item) => wordCount(item) < 9)) {
    fail(slug, "needs at least three specific foreign-visitor checks of nine or more words each.");
  }
  if (tips.length < 3 || tips.some((item) => wordCount(item) < 7)) {
    fail(slug, "needs at least three practical travel tips of seven or more words each.");
  }
  if (wordCount(editorialText) < 150) {
    fail(slug, "original visitor-planning material needs at least 150 substantive words beyond the source summary.");
  }
  if (jaccardSimilarity(summary, decision) > 0.55 || jaccardSimilarity(summary, whyGo) > 0.55) {
    fail(slug, "visitor analysis is too similar to the source summary.");
  }
  if (firstHandClaimRe.test([summary, whyGo, decision, ...checks, ...tips].join(" "))) {
    fail(slug, "contains an unverified first-hand experience claim.");
  }
  if (!review.reviewedAt || !review.reviewedBy) {
    fail(slug, "review date and accountable reviewer are required.");
  }
  if (!evidence.length || evidence.some((item) => !item.url || (item.mustContain || []).length < 2)) {
    fail(slug, "needs traceable source evidence with at least two verification tokens.");
  }
  const isNationwide = event.category === "travel-benefits" && event.city === "Nationwide";
  if (!isNationwide && !/[\uac00-\ud7a3]/u.test(event.mapQueryKo || "")) {
    fail(slug, "needs a Korean map query that adds local navigation value.");
  }
}

for (const slug of approvedGuides) {
  const guide = guideBySlug.get(slug);
  if (!guide) {
    fail(slug, "reviewed guide data is missing.");
    continue;
  }
  const sections = guide.sections?.en || [];
  const paragraphs = sections.flatMap((section) => section.paragraphs || []);
  const body = paragraphs.join(" ");

  if (sections.length !== 4) fail(slug, "guide needs four deliberate editorial sections.");
  if (sections.some((section) => wordCount(section.heading) < 2 || (section.paragraphs || []).length < 2)) {
    fail(slug, "every guide section needs a specific heading and at least two explanatory paragraphs.");
  }
  if (wordCount(body) < 300) fail(slug, "guide body needs at least 300 substantive words.");
  if (wordCount(guide.method) < 15) fail(slug, "research method disclosure needs at least 15 substantive words.");
  if ((guide.sources || []).length < 2 || (guide.sources || []).some((source) => !/^https?:\/\//.test(source.url || ""))) {
    fail(slug, "guide needs at least two valid external research sources.");
  }
  if (!guide.reviewedBy || !guide.publishedAt || !guide.updatedAt) {
    fail(slug, "reviewer, published date, and updated date are required.");
  }
  if (firstHandClaimRe.test(body)) fail(slug, "contains an unverified first-hand experience claim.");
}

for (let index = 0; index < approvedGuides.length; index += 1) {
  const left = guideBySlug.get(approvedGuides[index]);
  if (!left) continue;
  const leftBody = (left.sections?.en || []).flatMap((section) => section.paragraphs || []).join(" ");
  for (let cursor = index + 1; cursor < approvedGuides.length; cursor += 1) {
    const right = guideBySlug.get(approvedGuides[cursor]);
    if (!right) continue;
    const rightBody = (right.sections?.en || []).flatMap((section) => section.paragraphs || []).join(" ");
    if (jaccardSimilarity(leftBody, rightBody) > 0.55) {
      failures.push(`${left.slug} and ${right.slug}: guide bodies are too similar to count as distinct visitor value.`);
    }
  }
}

if (failures.length) {
  console.error("Original visitor-value validation failed.");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Original visitor-value validation passed: ${approvedEvents.length} reviewed events and ${approvedGuides.length} guides provide distinct, sourced planning value.`);
