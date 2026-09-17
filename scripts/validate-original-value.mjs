import fs from "node:fs";
import path from "node:path";
import { todayString } from "./lib/date.mjs";
import { briefIssues, guideIssues } from "./lib/article-integrity.mjs";
const root = process.cwd();
const read = name => JSON.parse(fs.readFileSync(path.join(root, "data", name + ".json"), "utf8"));
const events = read("events"), guides = read("guides"), program = read("editorial-program"), briefs = read("visitor-briefs");
const today = todayString();
const failures = [];
const current = events.filter(e => program.indexableEvents.includes(e.slug) && e.endDate >= today);
for (const event of current) {
  const brief = briefs.events[event.slug];
  failures.push(...briefIssues(brief, today).map(issue => event.slug + ": " + issue));
  for (const slug of brief?.guideSlugs || []) {
    if (!program.indexableGuides.includes(slug) || !guides.some(g => g.slug === slug)) failures.push(event.slug + ": missing related guide " + slug);
  }
  if (!program.eventReviews[event.slug]?.publishedAt) failures.push(event.slug + ": missing original publication date");
}
for (const slug of program.indexableGuides) {
  const guide = guides.find(g => g.slug === slug);
  failures.push(...guideIssues(guide, today).map(issue => slug + ": " + issue));
  for (const related of guide?.relatedEventSlugs || []) {
    if (!events.some(e => e.slug === related)) failures.push(slug + ": invalid event reference " + related);
  }
}
const expected = new Set(program.indexableGuides);
const built = fs.readdirSync(path.join(root, "dist/en/guides")).filter(name => name.endsWith(".html") && name !== "index.html").map(name => name.slice(0, -5));
if (built.length !== expected.size || built.some(slug => !expected.has(slug))) failures.push("built guides differ from the explicit publication set");
const about = fs.readFileSync(path.join(root, "dist/en/about/index.html"), "utf8");
for (const marker of ["about-accountability", ">Who<", ">How<", ">Why<", ">Limits<", "contact@kspotnow.com", "AI"]) {
  if (!about.includes(marker)) failures.push("about: missing disclosure " + marker);
}
if (failures.length) {
  console.error("Article integrity failed:\n" + failures.map(f => "- " + f).join("\n"));
  process.exitCode = 1;
} else console.log(`Article integrity passed: ${current.length} event articles and ${expected.size} guides. This checks structure and traceability, NOT originality, reader usefulness or AdSense approval. Run validate:editorial-release for outstanding human/reader/live evidence.`);
