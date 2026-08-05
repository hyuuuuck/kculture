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
  if (eventCards !== 5) push(homeId, `home should show exactly 5 representative reviewed event cards; found ${eventCards}.`);
  assertIncludes(home, "home-guide-band", homeId, "home should connect events to original visitor guides.");
  assertIncludes(home, `See all ${approvedEvents.length} reviewed events`, homeId, "home should link to the full reviewed event list.");
  assertIncludes(home, "spotlight-arrow", homeId, "spotlight needs visible previous/next controls.");
  assertIncludes(home, "data-spotlight-dot", homeId, "spotlight needs position controls.");
  assertIncludes(home, 'data-spotlight-prev aria-label="Previous featured event"', homeId, "previous spotlight icon needs an accessible label.");
  assertIncludes(home, 'data-spotlight-next aria-label="Next featured event"', homeId, "next spotlight icon needs an accessible label.");

  const now = read(`${lang}/now/index.html`);
  assertIncludes(now, "event-decision-board", `${lang}/now/index.html`, "current-event page needs a cross-event decision board.");
  if (count(now, /class="decision-board-row"/g) !== approvedEvents.length) {
    push(`${lang}/now/index.html`, `decision board should compare exactly ${approvedEvents.length} reviewed events.`);
  }
  for (const event of approvedEvents) {
    const href = `/${lang}/events/${event.slug}`;
    if (!now.includes(href)) push(`${lang}/now/index.html`, `reviewed event is missing from the current-event page: ${event.slug}`);
  }

  if (approvedRoutes.length) {
    const routeIndex = read(`${lang}/routes/index.html`);
    for (const route of approvedRoutes) {
      if (!routeIndex.includes(`/${lang}/routes/${route.slug}`)) push(`${lang}/routes/index.html`, `approved route is missing: ${route.slug}`);
    }
  } else {
    if (fs.existsSync(path.join(dist, lang, "routes", "index.html"))) push(`${lang}/routes/index.html`, "unreviewed route hub must not be generated.");
    if (home.includes(`/${lang}/routes/`)) push(homeId, "home must not link to the retired route surface.");
  }

  const guideIndex = read(`${lang}/guides/index.html`);
  assertIncludes(guideIndex, "guide-scope-ledger", `${lang}/guides/index.html`, "guide hub needs an audience and stop-rule ledger.");
  if (count(guideIndex, /class="guide-scope-row"/g) !== approvedGuides.length) {
    push(`${lang}/guides/index.html`, `guide scope ledger should contain exactly ${approvedGuides.length} reviewed guides.`);
  }
  for (const guide of approvedGuides) {
    if (!guideIndex.includes(`/${lang}/guides/${guide.slug}`)) push(`${lang}/guides/index.html`, `approved guide is missing: ${guide.slug}`);
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
      "event-decision-fit",
      "review-update-note",
      "source-reconciliation",
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
    for (const marker of ["guide-article-header", "guide-audience", "guide-byline", "guide-method", "guide-decision-tool", "guide-worksheet", "guide-citations", "guide-next-section"]) {
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

const desktopHeroHeight = styles.match(/\.compact-detail-hero \{[\s\S]*?height:\s*clamp\((\d+)px,\s*(\d+(?:\.\d+)?)vh,\s*(\d+)px\)/);
const desktopHeroHeightIsStable = desktopHeroHeight
  && Number(desktopHeroHeight[1]) >= 460
  && Number(desktopHeroHeight[2]) >= 45
  && Number(desktopHeroHeight[2]) <= 70
  && Number(desktopHeroHeight[3]) <= 650
  && Number(desktopHeroHeight[1]) <= Number(desktopHeroHeight[3]);
if (!desktopHeroHeightIsStable
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
if (/\.service-hero h1 \{[^}]*white-space:\s*nowrap/s.test(styles)) {
  push("styles.css", "mobile home title must wrap instead of forcing horizontal overflow.");
}
if (!/\.compact-detail-hero h1 \{[^}]*overflow-wrap:\s*anywhere\s*!important[^}]*white-space:\s*normal\s*!important/s.test(styles)) {
  push("styles.css", "mobile event title needs a specific wrapping guard for Safari.");
}

if (errors.length) {
  console.error("UX quality validation failed:");
  console.error(JSON.stringify(errors, null, 2));
  process.exit(1);
}

console.log(`UX quality validation passed: compact home, ${approvedEvents.length} event pages, ${approvedGuides.length} guides, and responsive editorial layouts.`);
