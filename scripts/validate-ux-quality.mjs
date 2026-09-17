import fs from "node:fs";
import path from "node:path";
import { publicLanguageCodes } from "./lib/public-languages.mjs";
import { todayString } from "./lib/date.mjs";

const root = path.resolve(".");
const dist = path.join(root, "dist");
const readData = (file) => JSON.parse(fs.readFileSync(path.join(root, "data", file), "utf8"));
const program = readData("editorial-program.json");
const events = readData("events.json").filter((event) => program.indexableEvents.includes(event.slug) && event.endDate >= todayString());
const guides = readData("guides.json").filter((guide) => program.indexableGuides.includes(guide.slug));
const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const errors = [];
const check = (condition, file, message) => { if (!condition) errors.push({ file, message }); };
function read(file) {
  const full = path.join(dist, file);
  if (!fs.existsSync(full)) { check(false, file, "Generated page missing"); return ""; }
  return fs.readFileSync(full, "utf8");
}
function needs(html, markers, file) { for (const marker of markers) check(html.includes(marker), file, "Missing " + marker); }
function occurrences(text, literal) { return text.split(literal).length - 1; }

// This validates the approved programme redesign, not the removed carousel.
// Browser evidence separately covers visual fidelity, viewport overflow and interaction.
for (const lang of publicLanguageCodes()) {
  const homeId = lang + "/index.html", home = read(homeId);
  needs(home, ["programme-cover", "home-introduction", "utility-strip", "home-guide-band", "5b81c184", "/guides/seoul-culture-first-visit", "archive, 2020"], homeId);
  check(!home.includes("data-spotlight-carousel"), homeId, "Retired carousel must not return");
  check(!/Fresh checked today|verified today/i.test(home), homeId, "Do not relabel dated evidence as checked today");
  for (const id of [homeId, lang + "/now/index.html"]) {
    const html = read(id);
    check(occurrences(html, 'class="experience-card event-card"') === events.length, id, "Exactly one current experience card per event is required");
    for (const event of events) {
      check(occurrences(html, 'data-event-slug="' + event.slug + '"') === 1, id, "Missing or duplicate save action: " + event.slug);
      needs(html, ['href="/' + lang + "/events/" + event.slug + '"'], id);
    }
  }
  const now = read(lang + "/now/index.html");
  needs(now, ["data-gallery-scope", "data-gallery-search", "data-city-filter", "data-status-filter", "data-clear-filters", "data-no-results"], "experiences");
  check(!now.includes("event-decision-board"), "experiences", "Duplicate decision-board inventory must not return");

  const index = read(lang + "/guides/index.html");
  needs(index, ["guide-index", "guide-lead", "guide-list", "documentary research"], "guide index");
  check(!index.includes("guide-scope-ledger"), "guide index", "Duplicate guide ledger must not return");
  for (const guide of guides) {
    needs(index, ['href="/' + lang + "/guides/" + guide.slug + '"'], "guide index");
    const id = lang + "/guides/" + guide.slug + ".html", html = read(id);
    needs(html, ["guide-article-header", "guide-reading-layout", "guide-audience", "guide-byline", "guide-method", "guide-original-evidence", "guide-citations", "guide-next-section"], id);
    const expected = guide.sections?.en?.length || 0;
    check(occurrences(html, 'class="guide-content-section"') === expected, id, "Every original narrative section must remain");
  }
  for (const event of events) {
    const id = lang + "/events/" + event.slug + ".html", html = read(id);
    needs(html, ["compact-detail-hero", "detail-hero-media", "event-reading-layout", "event-fact-bar", "visitor-narrative", "participation-facts", "review-update-note", "source-record", "event-visit-section", "event-evidence-section", "compact-related-section", "save-event-label"], id);
    check(html.indexOf("visitor-narrative") < html.indexOf('class="event-fact-bar"'), id, "Narrative must precede the supporting facts in reading order");
    check(!/source-transparency-section|editorial-brief-section|affiliate-planning-rail/.test(html), id, "Retired repetitive or monetization-first panels must not return");
  }
  const planner = read(lang + "/planner/index.html");
  needs(planner, ["data-planner-grid", "data-planner-empty", "data-download-saved-calendar", "data-clear-saved", "Saved only in this browser", "<noscript>"], "planner");
  const calendar = read(lang + "/calendar/index.html");
  needs(calendar, ['href="/events.ics"', "data-gallery-scope", "calendar-month-heading"], "calendar");
  for (const kind of ["privacy","contact","cookie-policy","advertising","terms","editorial-policy","corrections"]) {
    needs(read(lang + "/" + kind + "/index.html"), ["policy-layout", "policy-nav", "article-page"], kind);
  }
}

function walk(directory) {
  return fs.readdirSync(directory, {withFileTypes:true}).flatMap((item) => item.isDirectory() ? walk(path.join(directory,item.name)) : item.name.endsWith(".html") ? [path.join(directory,item.name)] : []);
}
for (const file of walk(dist)) {
  const html = fs.readFileSync(file, "utf8");
  if (!html.includes('class="site-header"')) continue; // Legacy redirects have no reader-facing shell.
  needs(html, ['class="skip-link"', 'id="main-content"', "Primary", "/assets/fonts/roboto-condensed-800.ttf"], file);
  check(occurrences(html, "<h1") === 1, file, "Exactly one page heading");
  check(!html.includes('class="eyebrow"'), file, "Eyebrow scaffolding is retired");
  check(!html.includes("fonts.googleapis.com"), file, "Fonts must remain self-hosted");
}
needs(styles, ["--violet:#251d48", "--amber:#f4c95d", ".programme-cover", ".event-reading-layout", ".guide-reading-layout", ".guide-table-wrap", ":focus-visible", "@media (max-width: 680px)", "prefers-reduced-motion", "[hidden]", "font-display:swap"], "styles.css");
needs(app, ["koreaNowGuide.savedEvents.v1", "data-city-filter", "data-status-filter", "renderSavedPlanner", "downloadSavedCalendar"], "app.js");
if (errors.length) { console.error("Programme UX validation failed:"); console.error(JSON.stringify(errors,null,2)); process.exit(1); }
console.log("Programme UX validation passed: complete public templates, " + events.length + " experiences, " + guides.length + " guides, preserved planning controls and accessible reading structure.");
