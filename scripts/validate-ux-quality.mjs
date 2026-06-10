import fs from "node:fs";
import path from "node:path";
import { todayString } from "./lib/date.mjs";

const root = path.resolve(".");
const dist = path.join(root, "dist");
const today = todayString();
const events = JSON.parse(fs.readFileSync(path.join(root, "data", "events.json"), "utf8"));
const sources = JSON.parse(fs.readFileSync(path.join(root, "data", "sources.json"), "utf8"));
const guides = JSON.parse(fs.readFileSync(path.join(root, "data", "guides.json"), "utf8"));
const curationQueue = JSON.parse(fs.readFileSync(path.join(root, "data", "curation-queue.json"), "utf8"));
const languages = ["en", "es", "zh", "pt", "ru", "ja"];
const errors = [];

function push(id, message) {
  errors.push({ id, message });
}

function read(relativePath) {
  const file = path.join(dist, relativePath);
  if (!fs.existsSync(file)) {
    push(relativePath, "generated file is missing.");
    return "";
  }
  return fs.readFileSync(file, "utf8");
}

function countMatches(text, pattern) {
  return [...text.matchAll(pattern)].length;
}

function assertIncludes(text, needle, id, message) {
  if (!text.includes(needle)) push(id, message);
}

function htmlText(value) {
  return String(value || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function comparableHeading(value) {
  return htmlText(value).replace(/^\d+\.\s*/, "").trim();
}

for (const lang of languages) {
  const home = read(path.join(lang, "index.html"));
  assertIncludes(home, `/${lang}/calendar/`, `${lang}/index.html`, "calendar link is missing from the primary experience.");
  assertIncludes(home, `/${lang}/planner/`, `${lang}/index.html`, "planner link is missing from the primary experience.");
  assertIncludes(home, `/${lang}/about/`, `${lang}/index.html`, "about link is missing from the primary experience.");
  assertIncludes(home, "class=\"language-menu\"", `${lang}/index.html`, "language selector should be compact instead of a full header row.");

  const calendar = read(path.join(lang, "calendar", "index.html"));
  const monthBlocks = countMatches(calendar, /class="month-block"/g);
  const monthHeadings = countMatches(calendar, /class="calendar-month-heading"><span>[^<]+<\/span>\s*<span>\d{4}<\/span>/g);
  if (!monthBlocks) push(`${lang}/calendar/index.html`, "calendar has no visible month groups.");
  if (monthBlocks !== monthHeadings) {
    push(`${lang}/calendar/index.html`, `month headings must be split into month and year spans; found ${monthHeadings}/${monthBlocks}.`);
  }
}

const home = read("en/index.html");
const styles = read("styles.css");
const spotlightSlides = countMatches(home, /data-spotlight-slide/g);
const spotlightTabs = countMatches(home, /class="spotlight-tab"/g);
if (spotlightSlides < 3 || spotlightSlides > 5) {
  push("en/index.html", `home spotlight carousel should show 3-5 curated slides; found ${spotlightSlides}.`);
}
if (spotlightSlides !== spotlightTabs) {
  push("en/index.html", `spotlight tab count should match slide count; found ${spotlightTabs}/${spotlightSlides}.`);
}
assertIncludes(home, "data-spotlight-count", "en/index.html", "spotlight count is missing.");
assertIncludes(home, "class=\"spotlight-tabs\"", "en/index.html", "spotlight titled navigation is missing.");
assertIncludes(home, "class=\"spotlight-nav-panel\"", "en/index.html", "spotlight compact navigation panel is missing.");
assertIncludes(home, "data-spotlight-title-label", "en/index.html", "spotlight current title label is missing.");
const summaryBlock = home.match(/<dl class="service-summary"[\s\S]*?<\/dl>/)?.[0] || "";
assertIncludes(summaryBlock, "<dt>Guides</dt>", "en/index.html", "visitor-facing guide count is missing from the hero summary.");
if (summaryBlock.includes("<dt>Sources</dt>")) {
  push("en/index.html", "hero summary should not expose operational source counts.");
}
const primaryNav = home.match(/<nav class="top-nav"[\s\S]*?<\/nav>/)?.[0] || "";
if (primaryNav.includes("/en/sources/") || primaryNav.includes("/en/watchlist/")) {
  push("en/index.html", "primary navigation should stay visitor-facing; source and watchlist pages belong in footer trust links.");
}
if (home.includes("spotlight-dots")) {
  push("en/index.html", "spotlight should use titled navigation tabs, not dot-only navigation.");
}
if (home.includes("class=\"lang-switcher\"")) {
  push("en/index.html", "header should use a compact language menu, not a multi-row language link strip.");
}
assertIncludes(home, "class=\"language-menu-panel\"", "en/index.html", "language menu panel is missing.");
assertIncludes(styles, "@media (max-width: 680px)", "styles.css", "mobile breakpoint is missing.");
assertIncludes(styles, "grid-template-areas:", "styles.css", "mobile header should explicitly place brand, nav, and language controls.");
assertIncludes(styles, ".language-menu summary", "styles.css", "compact language menu styling is missing.");
const categoryMediaCards = countMatches(home, /class="category-pill[^"]*has-media/g);
if (categoryMediaCards < 7) {
  push("en/index.html", `home category cards should use representative event thumbnails; found ${categoryMediaCards}.`);
}
const cityMediaCards = countMatches(home, /class="city-pill[^"]*has-media/g);
if (cityMediaCards < 3) {
  push("en/index.html", `home city cards should use representative event thumbnails; found ${cityMediaCards}.`);
}
const splitBand = home.match(/<section class="split-band">[\s\S]*?<\/section>/)?.[0] || "";
if (splitBand.includes("/en/sources/")) {
  push("en/index.html", "homepage split band should promote visitor routes/guides, not operational source pages.");
}

const activeEvents = events.filter((event) => event.endDate >= today).slice(0, 6);
for (const event of activeEvents) {
  const html = read(path.join("en", "events", `${event.slug}.html`));
  for (const needle of ["fact-grid", "fact-calendar", "fact-pin", "fact-check", "fact-shield", "weather-overview", "map-link-list"]) {
    assertIncludes(html, needle, `en/events/${event.slug}.html`, `${needle} block is missing.`);
  }
  if (event.eventKind === "concert") {
    assertIncludes(html, "Concert", `en/events/${event.slug}.html`, "concert date basis is missing from the detail audit facts.");
  }
}

for (const lang of languages) {
  for (const guide of guides) {
    const html = read(path.join(lang, "guides", `${guide.slug}.html`));
    const sections = [...html.matchAll(/<section>\s*<h2>([\s\S]*?)<\/h2>\s*<p>([\s\S]*?)<\/p>\s*<\/section>/g)];
    const expectedSections = Array.isArray(guide.sections?.[lang]) ? guide.sections[lang].length : 0;
    if (sections.length !== expectedSections) {
      push(`${lang}/guides/${guide.slug}.html`, `guide should render ${expectedSections} section headings; found ${sections.length}.`);
    }
    for (const [index, match] of sections.entries()) {
      const heading = comparableHeading(match[1]);
      const paragraph = htmlText(match[2]);
      if (!heading) push(`${lang}/guides/${guide.slug}.html`, `guide section ${index + 1} heading is empty.`);
      if (heading.length > 8 && paragraph.startsWith(heading)) {
        push(`${lang}/guides/${guide.slug}.html`, `guide section ${index + 1} heading duplicates the paragraph opening.`);
      }
    }
  }
}

const kpopSourceText = JSON.stringify([...sources, ...curationQueue]).toLowerCase();
for (const keyword of ["concert", "ticket", "fan meeting", "weverse", "yes24", "ticketlink", "melon"]) {
  if (!kpopSourceText.includes(keyword)) {
    push("data/source-quality", `K-pop monitoring system should include ${keyword} coverage.`);
  }
}

if (errors.length) {
  console.error("UX quality validation failed:");
  console.error(JSON.stringify(errors, null, 2));
  process.exit(1);
}

console.log("UX quality validation passed: compact mobile header, multilingual pages, carousel tabs, calendar headings, detail facts, weather blocks, and K-pop concert monitoring are present.");
