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
const languages = ["en", "es", "zh", "pt", "ru", "ja", "fr", "de"];
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
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<style[\s\S]*?<\/style>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function assertNotVisible(text, pattern, id, message) {
  const visible = htmlText(text);
  if (pattern.test(visible)) push(id, message);
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
const planningLayer = home.match(/<section class="planning-layer"[\s\S]*?<\/section>/)?.[0] || "";
assertIncludes(planningLayer, "Plan first. Book on official sources.", "en/index.html", "home must explain the planning-first positioning.");
assertIncludes(planningLayer, "not a ticket shop", "en/index.html", "home must clearly distinguish K-Spot Now from ticket shops.");
assertIncludes(planningLayer, "official tourism, brand, venue, duty-free, department-store, and ticketing marketplace pages", "en/index.html", "home must explain the cross-source comparison layer.");
assertIncludes(planningLayer, "map-ready Korean place names", "en/index.html", "home must explain visitor context beyond raw event listings.");
assertIncludes(planningLayer, "class=\"planning-flow\"", "en/index.html", "home must show the visitor workflow, not only explanatory copy.");
assertIncludes(planningLayer, "Find signal", "en/index.html", "home workflow must start with event discovery.");
assertIncludes(planningLayer, "Verify visitor details", "en/index.html", "home workflow must include date, weather, map, and route verification.");
assertIncludes(planningLayer, "Continue officially", "en/index.html", "home workflow must hand final action to official sources.");
assertIncludes(styles, ".planning-layer-grid", "styles.css", "planning-layer grid styling is missing.");
assertIncludes(styles, ".planning-flow", "styles.css", "planning workflow styling is missing.");
assertIncludes(styles, ".handoff-note", "styles.css", "detail handoff-note styling is missing.");
assertIncludes(styles, ".visitor-action-grid", "styles.css", "detail visitor action checklist styling is missing.");
assertIncludes(styles, ".guide-decision-panel", "styles.css", "guide decision panel styling is missing.");
assertIncludes(styles, ".guide-event-grid", "styles.css", "guide related-event grid styling hook is missing.");
assertIncludes(styles, ".guide-source-strip", "styles.css", "guide official-source strip styling is missing.");
assertIncludes(styles, ".save-event-label", "styles.css", "save buttons must preserve a visible text label beside the icon.");
assertIncludes(styles, ".calendar-month-heading {\n  display: grid;", "styles.css", "calendar month headings should stack month and year consistently.");
const about = read("en/about/index.html");
assertIncludes(about, "not a ticket marketplace or checkout service", "en/about/index.html", "about page must define the non-ticketing service boundary.");
const frHome = read("fr/index.html");
const deHome = read("de/index.html");
assertIncludes(frHome, "Planifiez d&#39;abord", "fr/index.html", "French home must explain planning-first positioning.");
assertIncludes(frHome, "n&#39;est pas une billetterie", "fr/index.html", "French home must distinguish K-Spot Now from ticket shops.");
assertIncludes(deHome, "Erst planen", "de/index.html", "German home must explain planning-first positioning.");
assertIncludes(deHome, "kein Ticketshop", "de/index.html", "German home must distinguish K-Spot Now from ticket shops.");

const visitorUiExpectations = {
  es: ["Saltar al contenido principal", "Destacado oficial", "Guardar", "revisado"],
  zh: ["跳到主要内容", "官方精选", "保存", "新鲜度"],
  pt: ["Ir para o conteudo principal", "Destaque oficial", "Salvar", "revisado"],
  ru: ["Перейти к основному содержанию", "Официальный акцент", "Сохранить", "Актуальность"],
  ja: ["本文へ移動", "公式ハイライト", "保存", "更新状態"],
  fr: ["Aller au contenu principal", "Selection officielle", "Enregistrer", "Fraicheur"],
  de: ["Zum Hauptinhalt springen", "Offizielles Highlight", "Speichern", "Aktualitat"]
};

for (const [lang, expected] of Object.entries(visitorUiExpectations)) {
  const localizedHome = read(`${lang}/index.html`);
  const localizedDetail = read(`${lang}/events/bts-city-arirang-busan-2026.html`);
  for (const phrase of expected.slice(0, 2)) {
    assertIncludes(htmlText(localizedHome), phrase, `${lang}/index.html`, `visitor UI label should be localized: ${phrase}`);
  }
  for (const phrase of expected.slice(2)) {
    assertIncludes(htmlText(localizedDetail), phrase, `${lang}/events/bts-city-arirang-busan-2026.html`, `detail UI label should be localized: ${phrase}`);
  }
  assertNotVisible(localizedHome, /\bOfficial highlight\b|\bSkip to main content\b/, `${lang}/index.html`, "home should not expose English spotlight or skip-link UI labels.");
  assertNotVisible(localizedDetail, /\bSave\b|\bFreshness\b|\bchecked yesterday\b/, `${lang}/events/bts-city-arirang-busan-2026.html`, "detail should not expose English save/freshness UI labels.");
}

const activeEvents = events.filter((event) => event.endDate >= today).slice(0, 6);
for (const event of activeEvents) {
  const html = read(path.join("en", "events", `${event.slug}.html`));
  for (const needle of ["fact-grid", "fact-calendar", "fact-pin", "fact-check", "fact-shield", "weather-overview", "map-link-list"]) {
    assertIncludes(html, needle, `en/events/${event.slug}.html`, `${needle} block is missing.`);
  }
  assertIncludes(html, "class=\"handoff-note\"", `en/events/${event.slug}.html`, "detail page must include an official-source handoff note.");
  assertIncludes(html, "Plan here, then complete tickets, reservations, purchases", `en/events/${event.slug}.html`, "detail page must explain that final action happens on the official source.");
  assertIncludes(html, "data-save-event-label", `en/events/${event.slug}.html`, "detail save button must include a durable visible label node.");
  assertIncludes(html, "Visit-ready checklist", `en/events/${event.slug}.html`, "detail page must surface an at-a-glance visitor action checklist.");
  assertIncludes(html, "Confirm on the official page", `en/events/${event.slug}.html`, "detail checklist must direct visitors to final official confirmation.");
  assertIncludes(html, "Search the Korean place name", `en/events/${event.slug}.html`, "detail checklist must explain map-ready Korean place search.");
  if (event.eventKind === "concert") {
    assertIncludes(html, "Concert", `en/events/${event.slug}.html`, "concert date basis is missing from the detail audit facts.");
  }
}

for (const lang of languages) {
  for (const guide of guides) {
    const html = read(path.join(lang, "guides", `${guide.slug}.html`));
    assertIncludes(html, "class=\"guide-decision-panel\"", `${lang}/guides/${guide.slug}.html`, "guide must connect article advice to live visitor workflow data.");
    assertIncludes(html, "class=\"gallery-grid guide-event-grid\"", `${lang}/guides/${guide.slug}.html`, "guide must show related real event cards for comparison.");
    assertIncludes(html, "class=\"guide-source-strip\"", `${lang}/guides/${guide.slug}.html`, "guide must show official-source starting points.");
    assertIncludes(html, "class=\"route-grid\"", `${lang}/guides/${guide.slug}.html`, "guide must show route ideas so it is not a thin standalone article.");
    const sections = [...html.matchAll(/<section>\s*<h2>([\s\S]*?)<\/h2>\s*<p>([\s\S]*?)<\/p>\s*<\/section>/g)];
    const expectedSections = Array.isArray(guide.sections?.[lang]) ? guide.sections[lang].length : (lang === "fr" || lang === "de" ? 4 : 0);
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
