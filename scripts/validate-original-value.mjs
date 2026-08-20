import fs from "node:fs";
import path from "node:path";
import { todayString } from "./lib/date.mjs";

const root = process.cwd();
const events = JSON.parse(fs.readFileSync(path.join(root, "data", "events.json"), "utf8"));
const guides = JSON.parse(fs.readFileSync(path.join(root, "data", "guides.json"), "utf8"));
const routes = JSON.parse(fs.readFileSync(path.join(root, "data", "travel-routes.json"), "utf8"));
const program = JSON.parse(fs.readFileSync(path.join(root, "data", "editorial-program.json"), "utf8"));
const eventBySlug = new Map(events.map((event) => [event.slug, event]));
const guideBySlug = new Map(guides.map((guide) => [guide.slug, guide]));
const routeBySlug = new Map(routes.map((route) => [route.slug, route]));
const failures = [];
const today = todayString();
const approvedSet = new Set(program.indexableEvents || []);
const approvedEvents = events.filter((event) => approvedSet.has(event.slug) && event.endDate >= today).map((event) => event.slug);
const approvedGuides = [...new Set(program.indexableGuides || [])];
const approvedRoutes = [...new Set(program.indexableRoutes || [])];
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

function distinctEvidenceHosts(evidence) {
  return new Set(evidence.map((item) => {
    try { return new URL(item.url).hostname.replace(/^www\./, ""); } catch { return ""; }
  }).filter(Boolean)).size;
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
  const decisionFit = review.decisionFit || {};
  const decisionFitFields = ["availability", "bestFor", "poorFit", "timeCost", "commitWhen"];
  const planningProfile = review.planningProfile || {};
  const planningProfileFields = ["commitment", "routeRole", "lockIn", "keepFlexible", "weatherExposure"];
  const reconciliation = review.sourceReconciliation || {};
  const reconciliationFields = ["agreement", "sourceRoles", "unresolved", "visitorMeaning"];

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
  if (firstHandClaimRe.test([summary, whyGo, decision, review.updateSummary, ...checks, ...tips].join(" "))) {
    fail(slug, "contains an unverified first-hand experience claim.");
  }
  if (!review.reviewedAt || !review.reviewedBy) {
    fail(slug, "review date and accountable reviewer are required.");
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(review.publishedAt || "") || review.publishedAt > review.reviewedAt) {
    fail(slug, "needs an immutable first-publication date that is not replaced by the latest review date.");
  }
  if (wordCount(review.updateSummary) < 18) {
    fail(slug, "needs a substantial visitor-facing summary of the latest editorial change.");
  }
  if (decisionFitFields.some((field) => wordCount(decisionFit[field]) < 9)) {
    fail(slug, "needs a complete availability, audience fit, poor fit, time cost, and commitment threshold analysis.");
  }
  if (wordCount(decisionFitFields.map((field) => decisionFit[field]).join(" ")) < 75) {
    fail(slug, "decision-fit analysis needs at least 75 substantive words beyond the source facts.");
  }
  if (planningProfileFields.some((field) => wordCount(planningProfile[field]) < (field === "commitment" ? 2 : 9))) {
    fail(slug, "needs a complete commitment, route-role, lock-in, flexibility, and weather-exposure profile.");
  }
  if (reconciliationFields.some((field) => wordCount(reconciliation[field]) < 12)
      || wordCount(reconciliationFields.map((field) => reconciliation[field]).join(" ")) < 75) {
    fail(slug, "needs a substantial official-source reconciliation with agreement, role split, unresolved variables, and visitor meaning.");
  }
  if (evidence.length < 2 || distinctEvidenceHosts(evidence) < 2 || evidence.some((item) => !item.url || (item.mustContain || []).length < 2)) {
    fail(slug, "needs two traceable official sources on distinct hosts with verification tokens.");
  }
  if (evidence.some((item) => wordCount(item.role) < 2 || wordCount(item.supports) < 8)) {
    fail(slug, "every official source needs a visible role and a substantial explanation of what it supports.");
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
  const decisionTool = guide.decisionTool || {};
  const decisionRows = Array.isArray(decisionTool.rows) ? decisionTool.rows : [];
  const decisionToolText = [
    decisionTool.title,
    decisionTool.scenario,
    decisionTool.verdict,
    decisionTool.limitations,
    ...decisionRows.flatMap((row) => [row.signal, row.interpretation, row.action])
  ].join(" ");
  const worksheet = guide.worksheet || {};
  const worksheetChecks = Array.isArray(worksheet.checks) ? worksheet.checks : [];
  const worksheetText = [
    worksheet.title,
    worksheet.intro,
    worksheet.passRule,
    worksheet.stopRule,
    ...worksheetChecks.flatMap((item) => [item.label, item.prompt])
  ].join(" ");

  if (sections.length !== 4) fail(slug, "guide needs four deliberate editorial sections.");
  if (sections.some((section) => wordCount(section.heading) < 2 || (section.paragraphs || []).length < 2)) {
    fail(slug, "every guide section needs a specific heading and at least two explanatory paragraphs.");
  }
  if (wordCount(body) < 300) fail(slug, "guide body needs at least 300 substantive words.");
  if (wordCount(`${body} ${decisionToolText} ${worksheetText}`) < 650) fail(slug, "guide, worked example, and worksheet need at least 650 substantive words of combined visitor value.");
  if (wordCount(guide.method) < 15) fail(slug, "research method disclosure needs at least 15 substantive words.");
  if ((guide.sources || []).length < 2 || distinctEvidenceHosts(guide.sources || []) < 2 || (guide.sources || []).some((source) => !/^https?:\/\//.test(source.url || ""))) {
    fail(slug, "guide needs at least two valid research sources on distinct official hosts.");
  }
  if (wordCount(guide.audience) < 12) fail(slug, "guide needs a specific intended-audience statement.");
  if (decisionRows.length < 4 || decisionRows.some((row) => wordCount(row.signal) < 5 || wordCount(row.interpretation) < 10 || wordCount(row.action) < 9)) {
    fail(slug, "worked example needs four substantial signal, interpretation, and action rows.");
  }
  if (wordCount(decisionTool.scenario) < 45 || wordCount(decisionTool.verdict) < 35 || wordCount(decisionTool.limitations) < 15) {
    fail(slug, "worked example needs a substantial scenario, verdict, and limitation disclosure.");
  }
  if (worksheetChecks.length !== 5 || worksheetChecks.some((item) => wordCount(item.label) < 1 || wordCount(item.prompt) < 12)) {
    fail(slug, "verification worksheet needs exactly five substantial labeled checks.");
  }
  if (wordCount(worksheet.intro) < 25 || wordCount(worksheet.passRule) < 15 || wordCount(worksheet.stopRule) < 15) {
    fail(slug, "verification worksheet needs a substantial introduction, pass rule, and stop rule.");
  }
  if (!guide.reviewedBy || !guide.publishedAt || !guide.updatedAt) {
    fail(slug, "reviewer, published date, and updated date are required.");
  }
  if (firstHandClaimRe.test(`${body} ${decisionToolText} ${worksheetText}`)) fail(slug, "contains an unverified first-hand experience claim.");
}

const builtGuideDir = path.join(root, "dist", "en", "guides");
if (fs.existsSync(builtGuideDir)) {
  const builtGuides = fs.readdirSync(builtGuideDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".html") && entry.name !== "index.html")
    .map((entry) => entry.name.replace(/\.html$/, ""));
  const unexpected = builtGuides.filter((slug) => !approvedGuides.includes(slug));
  const missing = approvedGuides.filter((slug) => !builtGuides.includes(slug));
  if (unexpected.length || missing.length || builtGuides.length !== approvedGuides.length) {
    failures.push(`Built guide pages must exactly match the focused review set. Unexpected: ${unexpected.join(", ") || "none"}; missing: ${missing.join(", ") || "none"}.`);
  }
}

const aboutPath = path.join(root, "dist", "en", "about", "index.html");
if (fs.existsSync(aboutPath)) {
  const aboutHtml = fs.readFileSync(aboutPath, "utf8");
  for (const marker of ["about-accountability", ">Who<", ">How<", ">Why<", ">Limits<", "contact@kspotnow.com"]) {
    if (!aboutHtml.includes(marker)) fail("about", `editorial accountability marker is missing: ${marker}`);
  }
}

const nowPath = path.join(root, "dist", "en", "now", "index.html");
if (fs.existsSync(nowPath)) {
  const nowHtml = fs.readFileSync(nowPath, "utf8");
  if (!nowHtml.includes("event-decision-board") || (nowHtml.match(/class="decision-board-row"/g) || []).length !== approvedEvents.length) {
    fail("now", `decision board must render exactly ${approvedEvents.length} reviewed event comparisons.`);
  }
}

const guidesHubPath = path.join(root, "dist", "en", "guides", "index.html");
if (fs.existsSync(guidesHubPath)) {
  const guidesHubHtml = fs.readFileSync(guidesHubPath, "utf8");
  if (!guidesHubHtml.includes("guide-scope-ledger") || (guidesHubHtml.match(/class="guide-scope-row"/g) || []).length !== approvedGuides.length) {
    fail("guides", `guide hub must render exactly ${approvedGuides.length} reviewed decision-scope rows.`);
  }
}

const publicHtmlRoot = path.join(root, "dist", "en");
if (fs.existsSync(publicHtmlRoot)) {
  const htmlFiles = [];
  const collectHtml = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) collectHtml(absolute);
      else if (entry.isFile() && entry.name.endsWith(".html")) htmlFiles.push(absolute);
    }
  };
  collectHtml(publicHtmlRoot);
  const withdrawnSlugs = [
    ...events.filter((event) => !approvedEvents.includes(event.slug)).map((event) => event.slug),
    ...guides.filter((guide) => !approvedGuides.includes(guide.slug)).map((guide) => guide.slug),
    ...routes.filter((route) => !approvedRoutes.includes(route.slug)).map((route) => route.slug)
  ];
  for (const file of htmlFiles) {
    const html = fs.readFileSync(file, "utf8");
    const leaked = withdrawnSlugs.filter((slug) => html.includes(slug));
    if (leaked.length) {
      fail(path.relative(root, file), `references withdrawn public records: ${leaked.join(", ")}`);
    }
  }
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

for (const slug of approvedRoutes) {
  const route = routeBySlug.get(slug);
  if (!route) {
    fail(slug, "reviewed route data is missing.");
    continue;
  }
  const sections = route.sections?.en || [];
  const body = sections.flatMap((section) => section.paragraphs || []).join(" ");
  const evidence = route.sourceEvidence || [];
  if (sections.length < 4 || sections.some((section) => wordCount(section.heading) < 2 || (section.paragraphs || []).length < 2)) {
    fail(slug, "route needs four source-backed decision sections with at least two paragraphs each.");
  }
  if (wordCount(body) < 350) fail(slug, "route needs at least 350 substantive words of visitor decision material.");
  if (evidence.length < 3 || evidence.some((item) => !/^https?:\/\//.test(item.url || "") || (item.mustContain || []).length < 2)) {
    fail(slug, "route needs at least three traceable sources with verification tokens.");
  }
  if (!route.reviewedBy || !route.reviewedAt || !route.method) fail(slug, "route reviewer, review date, and research method are required.");
  if (firstHandClaimRe.test(body)) fail(slug, "contains an unverified first-hand experience claim.");
}

if (failures.length) {
  console.error("Original visitor-value validation failed.");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

const routeSummary = approvedRoutes.length
  ? `${approvedRoutes.length} reviewed travel routes`
  : "no travel routes approved for publication";
console.log(`Original visitor-value validation passed: ${approvedEvents.length} reviewed events, ${approvedGuides.length} guides, and ${routeSummary}; every published page provides distinct, sourced planning value. ${routes.length - approvedRoutes.length} route drafts remain unpublished.`);
