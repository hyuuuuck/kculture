import fs from "node:fs";
import path from "node:path";
import { publicLanguageCodes } from "./lib/public-languages.mjs";
import { todayString } from "./lib/date.mjs";

const root = path.resolve(".");
const dist = path.join(root, "dist");
const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");
const events = JSON.parse(fs.readFileSync(path.join(root, "data", "events.json"), "utf8"));
const guides = JSON.parse(fs.readFileSync(path.join(root, "data", "guides.json"), "utf8"));
const routes = JSON.parse(fs.readFileSync(path.join(root, "data", "travel-routes.json"), "utf8"));
const program = JSON.parse(fs.readFileSync(path.join(root, "data", "editorial-program.json"), "utf8"));
const today = todayString();
const languages = publicLanguageCodes();
const approvedEvents = events.filter((event) => (program.indexableEvents || []).includes(event.slug) && event.endDate >= today);
const approvedGuides = guides.filter((guide) => (program.indexableGuides || []).includes(guide.slug));
const approvedRoutes = routes.filter((route) => (program.indexableRoutes || []).includes(route.slug));
const errors = [];

function push(id, message) {
  errors.push({ id, message });
}

function read(relative) {
  const file = path.join(dist, relative);
  if (!fs.existsSync(file)) {
    push(relative, "generated file is missing.");
    return "";
  }
  return fs.readFileSync(file, "utf8");
}

function count(html, pattern) {
  return (html.match(pattern) || []).length;
}

function assertIncludes(html, marker, id, message) {
  if (!html.includes(marker)) push(id, message);
}

for (const lang of languages) {
  const homeId = `${lang}/index.html`;
  const home = read(homeId);
  const spotlightSlides = count(home, /data-spotlight-slide/g);
  const eventCards = count(home, /class="event-card/g);
  if (spotlightSlides < 3 || spotlightSlides > 5) push(homeId, `home should expose 3-5 spotlight slides; found ${spotlightSlides}.`);
  if (eventCards !== 6) push(homeId, `home should show exactly 6 reviewed event cards; found ${eventCards}.`);
  assertIncludes(home, "home-guide-band", homeId, "home should connect events to original visitor guides.");
  assertIncludes(home, `See all ${approvedEvents.length} reviewed events`, homeId, "home should link to the full reviewed event list.");
  assertIncludes(home, "spotlight-arrow", homeId, "spotlight needs visible previous/next controls.");
  assertIncludes(home, "data-spotlight-dot", homeId, "spotlight needs position controls.");
  assertIncludes(home, 'data-spotlight-prev aria-label="Previous featured event"', homeId, "previous spotlight icon needs an accessible label.");
  assertIncludes(home, 'data-spotlight-next aria-label="Next featured event"', homeId, "next spotlight icon needs an accessible label.");

  const now = read(`${lang}/now/index.html`);
  for (const event of approvedEvents) {
    const href = `/${lang}/events/${event.slug}.html`;
    if (!now.includes(href)) push(`${lang}/now/index.html`, `reviewed event is missing from the current-event page: ${event.slug}`);
  }

  const routeIndex = read(`${lang}/routes/index.html`);
  for (const route of approvedRoutes) {
    if (!routeIndex.includes(`/${lang}/routes/${route.slug}.html`)) push(`${lang}/routes/index.html`, `approved route is missing: ${route.slug}`);
  }

  const guideIndex = read(`${lang}/guides/index.html`);
  for (const guide of approvedGuides) {
    if (!guideIndex.includes(`/${lang}/guides/${guide.slug}.html`)) push(`${lang}/guides/index.html`, `approved guide is missing: ${guide.slug}`);
  }

  for (const event of approvedEvents) {
    const id = `${lang}/events/${event.slug}.html`;
    const html = read(id);
    const sectionCount = count(html, /<section\b/g);
    if (sectionCount < 4 || sectionCount > 6) push(id, `compact event detail should contain 4-6 sections; found ${sectionCount}.`);
    for (const marker of [
      "compact-detail-hero",
      "detail-hero-media",
      "event-fact-bar",
      "event-review-section",
      "event-visit-section",
      "event-evidence-section",
      "compact-related-section",
      "save-event-label"
    ]) assertIncludes(html, marker, id, `compact event detail marker is missing: ${marker}`);
    if (html.includes("source-transparency-section") || html.includes("editorial-brief-section") || html.includes("affiliate-planning-rail")) {
      push(id, "retired verbose or monetization-first detail section is still rendered.");
    }
  }

  for (const guide of approvedGuides) {
    const id = `${lang}/guides/${guide.slug}.html`;
    const html = read(id);
    const guideSections = count(html, /class="guide-content-section"/g);
    if (guideSections !== 4) push(id, `guide should render exactly 4 editorial sections; found ${guideSections}.`);
    for (const marker of ["guide-article-header", "guide-byline", "guide-method", "guide-citations", "guide-next-section"]) {
      assertIncludes(html, marker, id, `guide trust or workflow marker is missing: ${marker}`);
    }
    if (count(html, /<h2/g) < 5) push(id, "guide needs visible section headings and source heading.");
  }
}

for (const marker of [
  ".compact-detail-hero {",
  ".event-fact-bar {",
  ".event-check-list {",
  ".event-visit-grid {",
  ".evidence-list article {",
  ".editorial-guide {",
  ".guide-table-wrap {",
  "@media (max-width: 680px)",
  ".compact-detail-hero .detail-actions {",
  ".compact-weather-panel .forecast-strip {"
]) {
  if (!styles.includes(marker)) push("styles.css", `required responsive editorial style is missing: ${marker}`);
}

if (!/\.compact-detail-hero \{[\s\S]*?height:\s*clamp\(520px,\s*64vh,\s*620px\)/.test(styles)
    || !/\.compact-detail-hero \.detail-hero-media \{[\s\S]*?overflow:\s*hidden/.test(styles)) {
  push("styles.css", "desktop event visual needs a stable hero height and constrained media track.");
}
if (!/\.compact-detail-hero \.detail-hero-media \{[\s\S]*?aspect-ratio:\s*4\s*\/\s*3/.test(styles)) {
  push("styles.css", "mobile event visual needs a stable 4:3 ratio.");
}
if (!/\.compact-detail-hero \.detail-actions \{[\s\S]*?grid-template-columns:\s*repeat\(2/.test(styles)) {
  push("styles.css", "mobile hero actions must use a stable two-column grid.");
}
if (!/\.event-fact-bar \{[\s\S]*?grid-template-columns:\s*1fr/.test(styles)) {
  push("styles.css", "mobile essential facts must collapse to one column.");
}

if (errors.length) {
  console.error("UX quality validation failed:");
  console.error(JSON.stringify(errors, null, 2));
  process.exit(1);
}

console.log(`UX quality validation passed: compact home, ${approvedEvents.length} event pages, ${approvedGuides.length} guides, and responsive editorial layouts.`);
