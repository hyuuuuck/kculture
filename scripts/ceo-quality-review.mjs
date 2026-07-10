import fs from "node:fs/promises";
import fssync from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { todayString } from "./lib/date.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const today = todayString();
const feedDir = path.join(root, "data", "feeds");
const events = JSON.parse(await fs.readFile(path.join(root, "data", "events.json"), "utf8"));
const guides = JSON.parse(await fs.readFile(path.join(root, "data", "guides.json"), "utf8"));
const routes = JSON.parse(await fs.readFile(path.join(root, "data", "travel-routes.json"), "utf8"));
const program = JSON.parse(await fs.readFile(path.join(root, "data", "editorial-program.json"), "utf8"));
const publishedRecheck = JSON.parse(await fs.readFile(path.join(root, "data", "published-event-recheck.json"), "utf8").catch(() => "{}"));
const checks = [];

function exists(relative) {
  return fssync.existsSync(path.join(root, relative));
}

function read(relative) {
  try {
    return fssync.readFileSync(path.join(root, relative), "utf8");
  } catch {
    return "";
  }
}

function latestJson(pattern) {
  if (!fssync.existsSync(feedDir)) return null;
  const name = fssync.readdirSync(feedDir).filter((item) => pattern.test(item)).sort().at(-1);
  if (!name) return null;
  try {
    return JSON.parse(fssync.readFileSync(path.join(feedDir, name), "utf8"));
  } catch {
    return null;
  }
}

function add(owner, area, item, status, detail, task = "") {
  checks.push({ owner, area, item, status, detail, task });
}

function pass(owner, area, item, detail) {
  add(owner, area, item, "pass", detail);
}

function warn(owner, area, item, detail, task) {
  add(owner, area, item, "warn", detail, task);
}

function fail(owner, area, item, detail, task) {
  add(owner, area, item, "fail", detail, task);
}

function htmlWordCount(value) {
  const text = String(value || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z0-9#]+;/gi, " ")
    .replace(/\s+/g, " ");
  return (text.match(/[A-Za-z0-9][A-Za-z0-9'-]*/g) || []).length;
}

const approvedEvents = events.filter((event) => (program.indexableEvents || []).includes(event.slug) && event.endDate >= today);
const approvedGuides = guides.filter((guide) => (program.indexableGuides || []).includes(guide.slug));
const approvedRoutes = routes.filter((route) => (program.indexableRoutes || []).includes(route.slug));

if (program.mode === "adsense-editorial-review" && approvedEvents.length === 15 && approvedGuides.length === 8 && approvedRoutes.length === 5) {
  pass("planner", "Scope", "Editorial review set", "15 current events, 8 guides, and 5 routes are explicitly approved.");
} else {
  fail("planner", "Scope", "Editorial review set", `${approvedEvents.length} events, ${approvedGuides.length} guides, ${approvedRoutes.length} routes.`, "Planner: restore the explicit review set before release.");
}

const missingReviews = approvedEvents.filter((event) => {
  const review = program.eventReviews?.[event.slug];
  const evidence = [...(event.audit?.sourceEvidence || []), ...(review?.sourceEvidence || [])];
  return !review?.reviewedAt || !review?.reviewedBy || String(review?.visitorDecision || "").length < 120
    || !Array.isArray(review?.foreignerChecks) || review.foreignerChecks.length < 3
    || !evidence.length || evidence.some((item) => !item.url || !Array.isArray(item.mustContain) || item.mustContain.length < 2);
});
if (!missingReviews.length) {
  pass("auditor", "Evidence", "Structured event review", "15/15 approved events have ownership, visitor analysis, and official-source evidence tokens.");
} else {
  fail("auditor", "Evidence", "Structured event review", `${missingReviews.length} events incomplete.`, `Auditor: block ${missingReviews.map((event) => event.slug).join(", ")}.`);
}

if (publishedRecheck.date === today && publishedRecheck.passed === approvedEvents.length && publishedRecheck.failed === 0) {
  pass("auditor", "Freshness", "Live official-source recheck", `${publishedRecheck.passed}/${approvedEvents.length} events passed live token checks on ${today}.`);
} else {
  fail("auditor", "Freshness", "Live official-source recheck", `${publishedRecheck.passed || 0}/${approvedEvents.length} passed; ${publishedRecheck.failed ?? "unknown"} failed.`, "Auditor: run npm.cmd run recheck:published and do not publish until all approved events pass.");
}

const home = read("dist/en/index.html");
const homeCards = (home.match(/class="event-card/g) || []).length;
const spotlightSlides = (home.match(/data-spotlight-slide/g) || []).length;
if (homeCards === 6 && spotlightSlides >= 3 && spotlightSlides <= 5 && home.includes("home-guide-band")) {
  pass("designer", "Home", "Scan density", `${homeCards} event cards, ${spotlightSlides} feature slides, and guide entry points.`);
} else {
  fail("designer", "Home", "Scan density", `${homeCards} event cards and ${spotlightSlides} slides.`, "Designer: restore the compact home hierarchy.");
}

const eventPageProblems = [];
for (const event of approvedEvents) {
  const html = read(`dist/en/events/${event.slug}.html`);
  const sectionCount = (html.match(/<section\b/g) || []).length;
  if (!html || sectionCount < 4 || sectionCount > 6
      || !html.includes("event-review-section")
      || !html.includes("event-visit-section")
      || !html.includes("event-evidence-section")
      || !html.includes("review-byline")
      || htmlWordCount(html) < 350) {
    eventPageProblems.push(event.slug);
  }
}
if (!eventPageProblems.length) {
  pass("designer", "Detail", "Compact decision pages", "15/15 pages use the 4-6 section decision, plan, evidence, and related-content layout.");
} else {
  fail("designer", "Detail", "Compact decision pages", `${eventPageProblems.length} pages failed.`, `Designer/Publisher: fix ${eventPageProblems.slice(0, 5).join(", ")}.`);
}

const guideProblems = approvedGuides.filter((guide) => {
  const html = read(`dist/en/guides/${guide.slug}.html`);
  const paragraphWords = (guide.sections?.en || []).flatMap((section) => section.paragraphs || []).join(" ").split(/\s+/).length;
  return !html.includes("guide-byline") || !html.includes("guide-citations") || (guide.sections?.en || []).length !== 4
    || (guide.sources || []).length < 2 || paragraphWords < 280;
});
if (!guideProblems.length) {
  pass("planner", "Guides", "Original editorial depth", "8/8 guides have four decision sections, source citations, method, and authorship.");
} else {
  fail("planner", "Guides", "Original editorial depth", `${guideProblems.length} guides failed.`, `Planner: rewrite ${guideProblems.map((guide) => guide.slug).join(", ")}.`);
}

const sitemap = read("dist/sitemap.xml");
const sitemapUrls = (sitemap.match(/<url>/g) || []).length;
if (sitemapUrls === 34 && !sitemap.includes("<loc>https://kspotnow.com</loc>") && !/\/categories\/|\/cities\//.test(sitemap)) {
  pass("publisher", "Search", "Indexable surface", "34 editorial URLs; no root duplicate, category, or city pages in the sitemap.");
} else {
  fail("publisher", "Search", "Indexable surface", `${sitemapUrls} sitemap URLs.`, "Publisher: rebuild the focused editorial sitemap.");
}

const worker = read("src/worker.js");
if (worker.includes('url.pathname === "/"') && worker.includes("status: 410")) {
  pass("publisher", "Search", "Retired URL handling", "Root redirects and unavailable translation paths return 410 after asset lookup.");
} else {
  fail("publisher", "Search", "Retired URL handling", "Worker rules are incomplete.", "Publisher: restore canonical redirect and language retirement rules.");
}

const policyPages = ["about", "contact", "privacy", "cookie-policy", "advertising", "terms", "editorial-policy", "corrections"];
const missingPolicy = policyPages.filter((page) => !exists(`dist/en/${page}/index.html`));
if (!missingPolicy.length) pass("publisher", "Trust", "Policy access", `${policyPages.length} trust and policy pages are available.`);
else fail("publisher", "Trust", "Policy access", `Missing ${missingPolicy.join(", ")}.`, "Publisher: restore trust pages before release.");

const adsense = latestJson(/^adsense-readiness-\d{4}-\d{2}-\d{2}\.json$/);
if (!adsense) {
  fail("publisher", "AdSense", "Editorial gate report", "No report found.", "Publisher: run npm.cmd run report:adsense.");
} else if (adsense.score.failed) {
  fail("publisher", "AdSense", "Editorial gate report", `${adsense.score.failed} blocking failures.`, "Publisher/CEO: clear every internal gate before release.");
} else {
  pass("publisher", "AdSense", "Editorial gate report", `${adsense.score.passed} pass, ${adsense.score.warned} non-blocking warning, 0 fail.`);
}

if (home.includes("kr.trip.com/partners/ad") || home.includes("coupa.ng/cny5Rl")) {
  warn("publisher", "Monetization", "Affiliate restraint", "Affiliate content appears in the review build.", "Publisher: disable affiliate widgets during AdSense content re-review.");
} else {
  pass("publisher", "Monetization", "Affiliate restraint", "Third-party affiliate widgets are absent from the review build.");
}

const fails = checks.filter((item) => item.status === "fail").length;
const warns = checks.filter((item) => item.status === "warn").length;
const passes = checks.filter((item) => item.status === "pass").length;
const decision = fails ? "REWORK_REQUIRED" : warns ? "APPROVED_WITH_WARNINGS" : "RELEASE_APPROVED";
const tasks = checks.filter((item) => item.status !== "pass" && item.task);
const result = {
  generatedAt: new Date().toISOString(),
  date: today,
  objective: "Compete on visitor usefulness and source accountability without claiming Google approval certainty.",
  decision,
  summary: { pass: passes, warn: warns, fail: fails, tasks: tasks.length },
  checks,
  tasks
};

await fs.mkdir(feedDir, { recursive: true });
const jsonOut = path.join(feedDir, `ceo-quality-review-${today}.json`);
const mdOut = path.join(feedDir, `ceo-quality-review-${today}.md`);
await fs.writeFile(jsonOut, `${JSON.stringify(result, null, 2)}\n`, "utf8");
await fs.writeFile(mdOut, `# CEO Quality Review

Generated: ${result.generatedAt}

Decision: **${decision}**

Objective: ${result.objective}

## Quality Checks

| Status | Owner | Area | Item | Detail |
| --- | --- | --- | --- | --- |
${checks.map((item) => `| ${item.status} | ${item.owner} | ${item.area} | ${item.item} | ${String(item.detail).replaceAll("|", "\\|")} |`).join("\n")}

## CEO Tasks

${tasks.map((item, index) => `${index + 1}. ${item.task}`).join("\n") || "No blocking task. Preserve the review lock and monitor Search Console after deployment."}
`, "utf8");

console.table([{ decision, pass: passes, warn: warns, fail: fails, tasks: tasks.length }]);
console.log(`CEO quality review saved: ${path.relative(root, mdOut)}`);

if (fails) process.exitCode = 1;
