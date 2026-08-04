import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const dist = path.join(root, "dist");
const events = JSON.parse(fs.readFileSync(path.join(root, "data", "events.json"), "utf8"));
const program = JSON.parse(fs.readFileSync(path.join(root, "data", "editorial-program.json"), "utf8"));
const failures = [];
const approvedSlugs = [...new Set(program.indexableEvents || [])];
const eventBySlug = new Map(events.map((event) => [event.slug, event]));

if (!approvedSlugs.length) {
  failures.push("Publication gate requires a non-empty, explicitly reviewed event set.");
}

const eventDir = path.join(dist, "en", "events");
const builtSlugs = fs.existsSync(eventDir)
  ? fs.readdirSync(eventDir).filter((name) => name.endsWith(".html")).map((name) => name.replace(/\.html$/, ""))
  : [];
if (builtSlugs.length !== approvedSlugs.length || builtSlugs.some((slug) => !approvedSlugs.includes(slug))) {
  failures.push(`Built event pages (${builtSlugs.length}) do not exactly match the reviewed publication set (${approvedSlugs.length}).`);
}

const requiredFacts = ["Admission", "Price", "Reservation", "Korean map", "Official source"];
for (const slug of approvedSlugs) {
  const event = eventBySlug.get(slug);
  const htmlPath = path.join(eventDir, `${slug}.html`);
  if (!event || !fs.existsSync(htmlPath)) {
    failures.push(`${slug}: missing reviewed event data or built page.`);
    continue;
  }
  const html = fs.readFileSync(htmlPath, "utf8");
  if (!html.includes("Source-checked desk review") || /\d+\/100 reviewed/.test(html)) {
    failures.push(`${slug}: public review state must be non-numeric and source-accountable.`);
  }
  if (!html.includes('class="event-fact-bar"')) failures.push(`${slug}: first-screen fact bar is missing.`);
  for (const fact of requiredFacts) {
    if (!html.includes(`<dt>${fact}</dt>`)) failures.push(`${slug}: first-screen fact missing: ${fact}.`);
  }
  if (!html.includes("Published ") || !html.includes("Updated ")) failures.push(`${slug}: published/updated dates are missing.`);
  if (!html.includes('class="review-byline"') || !html.includes("event-evidence-section")) {
    failures.push(`${slug}: reviewer ownership or evidence section is missing.`);
  }
  if (!html.includes('"datePublished"') || !html.includes('"dateModified"')) {
    failures.push(`${slug}: structured publication dates are missing.`);
  }
  if (!/^assets\/event-thumbnails\/official\//.test(event.thumbnail || "")) {
    failures.push(`${slug}: image is not marked as an official verified visual.`);
  }
  if (/\bTBA\b|\bunknown venue\b|\bentry rules not confirmed\b/i.test(html)) {
    failures.push(`${slug}: unresolved uncertainty is visible on a public event page.`);
  }
  const review = program.eventReviews?.[slug];
  const evidence = [
    ...(Array.isArray(event.audit?.sourceEvidence) ? event.audit.sourceEvidence : []),
    ...(Array.isArray(review?.sourceEvidence) ? review.sourceEvidence : [])
  ];
  const evidenceHosts = new Set(evidence.map((item) => {
    try { return new URL(item.url).hostname.replace(/^www\./, ""); } catch { return ""; }
  }).filter(Boolean));
  if (!review?.reviewedAt || !review?.reviewedBy || evidence.length < 2 || evidenceHosts.size < 2 || evidence.some((item) => !item.url || (item.mustContain || []).length < 2)) {
    failures.push(`${slug}: manual review record or original-source evidence is incomplete.`);
  }
}

const generatedHtml = [];
function collectHtml(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collectHtml(full);
    else if (entry.name.endsWith(".html")) generatedHtml.push(fs.readFileSync(full, "utf8"));
  }
}
collectHtml(path.join(dist, "en"));
const affiliateMarkers = ["trip.com", "coupa.ng", "Allianceid=", "SID=", "DB17791825"];
const affiliateHits = affiliateMarkers.filter((marker) => generatedHtml.some((html) => html.includes(marker)));
if (affiliateHits.length) failures.push(`Affiliate content must remain off during review: ${affiliateHits.join(", ")}.`);

if (failures.length) {
  console.error("Publication gate failed.");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Publication gate passed: ${approvedSlugs.length} reviewed events with two-source evidence, first-screen facts, dates, and no affiliate content.`);
