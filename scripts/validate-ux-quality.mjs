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
const designSystem = JSON.parse(fs.readFileSync(path.join(root, "data", "design-system.json"), "utf8").replace(/^\uFEFF/, ""));
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
  return fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");
}

function countMatches(text, pattern) {
  return [...text.matchAll(pattern)].length;
}

function assertIncludes(text, needle, id, message) {
  if (!text.includes(needle)) push(id, message);
}

function assertMinHeightAtLeast(selector, minimum, id, message) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = styles.match(new RegExp(`${escapedSelector}\\s*\\{[\\s\\S]*?min-height:\\s*(\\d+)px;[\\s\\S]*?\\}`));
  if (!match || Number(match[1]) < minimum) push(id, message);
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

const englishGuideTitles = guides.map((guide) => guide.title?.en).filter(Boolean);

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
  assertIncludes(home, "class=\"language-flag flag-", `${lang}/index.html`, "language selector should include visual flag cues.");

  const calendar = read(path.join(lang, "calendar", "index.html"));
  const monthBlocks = countMatches(calendar, /class="month-block"/g);
  const monthHeadings = countMatches(calendar, /class="calendar-month-heading"><span>[^<]+<\/span>\s*<span>\d{4}<\/span>/g);
  if (!monthBlocks) push(`${lang}/calendar/index.html`, "calendar has no visible month groups.");
  if (monthBlocks !== monthHeadings) {
    push(`${lang}/calendar/index.html`, `month headings must be split into month and year spans; found ${monthHeadings}/${monthBlocks}.`);
  }
  const firstCalendarMonth = calendar.match(/data-calendar-month="(\d{4}-\d{2})"/)?.[1] || "";
  if (!firstCalendarMonth) {
    push(`${lang}/calendar/index.html`, "calendar month blocks must expose data-calendar-month for audit.");
  } else if (firstCalendarMonth < today.slice(0, 7)) {
    push(`${lang}/calendar/index.html`, `calendar must not open on an archive month; found ${firstCalendarMonth}.`);
  }
}

const portugueseHome = read(path.join("pt", "index.html"));
if (!portugueseHome.includes("language-flag flag-br") || portugueseHome.includes("language-flag flag-pt")) {
  push("pt/index.html", "Portuguese is formatted as pt-BR, so the language selector should use the Brazil flag consistently.");
}

for (const lang of ["fr", "de"]) {
  const localizedGuideIndex = read(path.join(lang, "guides", "index.html"));
  const localizedGuideText = htmlText(localizedGuideIndex);
  for (const title of englishGuideTitles) {
    if (localizedGuideText.includes(title)) {
      push(`${lang}/guides/index.html`, `localized guide index still exposes English guide title: ${title}`);
    }
  }
  const shoppingCategory = htmlText(read(path.join(lang, "categories", "shopping", "index.html")));
  const departmentCategory = htmlText(read(path.join(lang, "categories", "department-store", "index.html")));
  if (/Korea shopping festivals and seasonal sale archives/i.test(shoppingCategory)) {
    push(`${lang}/categories/shopping/index.html`, "localized shopping category still exposes the English page heading.");
  }
  if (/Korea department store sales and pop-ups/i.test(departmentCategory)) {
    push(`${lang}/categories/department-store/index.html`, "localized department-store category still exposes the English page heading.");
  }
}

const home = read("en/index.html");
const calendarEn = read(path.join("en", "calendar", "index.html"));
const styles = read("styles.css");
const appJs = read("app.js");
const plannerPage = read("en/planner/index.html");

if (/font-size\s*:[^;]*\bvw\b/i.test(styles)) {
  push("styles.css", "font sizes should use stable type tokens and media overrides, not viewport-width scaling.");
}
const designHeroTypes = Array.isArray(designSystem.heroTypes) ? designSystem.heroTypes : [];
const designPages = Array.isArray(designSystem.pages) ? designSystem.pages : [];
const designHeroIds = new Set(designHeroTypes.map((type) => type.id));
if (designHeroTypes.length < 6) {
  push("data/design-system.json", "design system must define the core hero taxonomy.");
}
for (const id of ["product-entry", "utility-page", "workspace-tool", "city-landing", "detail-decision", "identity-page"]) {
  if (!designHeroIds.has(id)) push("data/design-system.json", `design system is missing hero type: ${id}.`);
}
for (const page of designPages) {
  if (!page.heroType || !designHeroIds.has(page.heroType)) {
    push("data/design-system.json", `representative page has no valid heroType: ${page.id || page.title}.`);
  }
}
for (const rule of [
  "Page eyebrows use coral",
  "Status is shown as flags",
  "Ads stay peripheral",
  "Each page type has a distinct purpose",
  "Home spotlight uses swipeable dots, not numbered sequence labels",
  "Home event gallery starts short and expands on request",
  "Calendar starts with current or upcoming planning months",
  "Typography uses a modern service font with multilingual fallbacks",
  "Role council reviews changes before execution"
]) {
  if (!designSystem.reviewRules?.includes(rule)) {
    push("data/design-system.json", `design review rule is missing: ${rule}.`);
  }
}
const governanceRoles = Array.isArray(designSystem.governanceLoop?.roles) ? designSystem.governanceLoop.roles : [];
const governanceRoleIds = new Set(governanceRoles.map((role) => role.id));
for (const roleId of ["executive-lead", "designer", "developer", "advisory-board", "audit-board", "user-panel"]) {
  if (!governanceRoleIds.has(roleId)) {
    push("data/design-system.json", `role council is missing role: ${roleId}.`);
  }
}
if (!Array.isArray(designSystem.governanceLoop?.stages) || designSystem.governanceLoop.stages.length < 6) {
  push("data/design-system.json", "role council must define the full review loop stages.");
}
const spotlightSlides = countMatches(home, /data-spotlight-slide/g);
const spotlightDots = countMatches(home, /class="spotlight-dot"/g);
if (spotlightSlides < 3 || spotlightSlides > 5) {
  push("en/index.html", `home spotlight carousel should show 3-5 curated slides; found ${spotlightSlides}.`);
}
if (spotlightSlides !== spotlightDots) {
  push("en/index.html", `spotlight dot count should match slide count; found ${spotlightDots}/${spotlightSlides}.`);
}
assertIncludes(home, "class=\"spotlight-tabs\"", "en/index.html", "spotlight dot navigation is missing.");
assertIncludes(home, "class=\"spotlight-nav-panel\"", "en/index.html", "spotlight dot navigation panel is missing.");
if (home.includes("data-spotlight-count") || home.includes("data-spotlight-title-label")) {
  push("en/index.html", "spotlight controls should stay simple: no repeated title label or sequence count below the hero.");
}
if (home.includes("spotlight-content")) {
  push("en/index.html", "spotlight should not repeat the event title in a bottom overlay; keep the hero image, status flag, dots, and swipe only.");
}
if (/class="spotlight-dot"[\s\S]*?>\s*<span>(0?\d+)<\/span>/.test(home)) {
  push("en/index.html", "spotlight dots should not expose visible 1-5 sequence numbers.");
}
if (/class="spotlight-dot"[^>]*\btitle=/.test(home)) {
  push("en/index.html", "spotlight dots should avoid browser title tooltips; keep only compact dots with accessible labels.");
}
if (home.includes(">Dept.<") || calendarEn.includes(">Dept.<")) {
  push("en/calendar/index.html", "mobile category filters should use visitor-facing labels, not the abbreviation Dept.");
}
for (const snippet of [
  "track?.addEventListener(\"pointerdown\", startDrag)",
  "track?.addEventListener(\"touchmove\", moveTouchDrag",
  "Math.abs(deltaX) >= 45",
  "track?.addEventListener(\"wheel\", handleWheel, { passive: false })",
  "function shouldSuppressCarouselClick",
  "event.target.closest?.(\"[data-spotlight-slide]\")",
  "window.location.assign(slideLink.href)"
]) {
  assertIncludes(appJs, snippet, "app.js", "spotlight carousel swipe handling is missing.");
}
assertIncludes(home, "data-spotlight-slide href=", "en/index.html", "spotlight slides must remain direct links to event detail pages.");
assertIncludes(home, "draggable=\"false\"", "en/index.html", "spotlight cards and images must disable browser-native drag so swipe remains reliable.");
assertIncludes(styles, ".spotlight-card.is-active {\n  opacity: 1;\n  pointer-events: auto;\n  transform: translateX(0);\n  cursor: pointer;", "styles.css", "active spotlight cards must visibly behave like clickable links.");
assertIncludes(styles, "-webkit-user-drag: none;", "styles.css", "spotlight media must disable browser-native image dragging.");
const summaryBlock = home.match(/<dl class="service-summary"[\s\S]*?<\/dl>/)?.[0] || "";
assertIncludes(summaryBlock, "<dt>Guides</dt>", "en/index.html", "visitor-facing guide count is missing from the hero summary.");
if (summaryBlock.includes("<dt>Sources</dt>")) {
  push("en/index.html", "hero summary should not expose operational source counts.");
}
const primaryNav = home.match(/<nav class="top-nav"[\s\S]*?<\/nav>/)?.[0] || "";
if (primaryNav.includes("/en/sources/") || primaryNav.includes("/en/watchlist/")) {
  push("en/index.html", "primary navigation should stay visitor-facing; source and watchlist pages belong in footer trust links.");
}
if (home.includes("class=\"lang-switcher\"")) {
  push("en/index.html", "header should use a compact language menu, not a multi-row language link strip.");
}
assertIncludes(home, "class=\"language-menu-panel\"", "en/index.html", "language menu panel is missing.");
assertIncludes(home, "fonts.googleapis.com/css2?family=Geist", "en/index.html", "Geist webfont should be loaded for the modern service typography direction.");
assertIncludes(styles, "font-family: Geist, Inter, \"Pretendard Variable\", Pretendard", "styles.css", "font stack should use Geist with Pretendard/Inter fallbacks.");
assertIncludes(styles, "@media (max-width: 680px)", "styles.css", "mobile breakpoint is missing.");
assertIncludes(styles, "grid-template-areas:", "styles.css", "mobile header should explicitly place brand, nav, and language controls.");
assertIncludes(styles, ".language-menu summary", "styles.css", "compact language menu styling is missing.");
assertIncludes(home, "class=\"nav-full\"", "en/index.html", "primary navigation should include full labels for desktop.");
assertIncludes(home, "class=\"nav-short\"", "en/index.html", "primary navigation should include short mobile labels.");
assertIncludes(styles, ".nav-short", "styles.css", "short mobile navigation label styling is missing.");
assertIncludes(styles, ".service-hero h1 {\n    max-width: none;\n    font-size: var(--type-display-xl);\n    line-height: 1.02;\n    white-space: nowrap;", "styles.css", "mobile home brand title must stay on one line.");
const categoryMediaCards = countMatches(home, /class="category-pill[^"]*has-media/g);
if (categoryMediaCards < 7) {
  push("en/index.html", `home category cards should use representative event thumbnails; found ${categoryMediaCards}.`);
}
const cityMediaCards = countMatches(home, /class="city-pill[^"]*has-media/g);
if (cityMediaCards < 3) {
  push("en/index.html", `home city cards should use representative event thumbnails; found ${cityMediaCards}.`);
}
const homeEventCards = countMatches(home, /class="event-card"/g);
assertIncludes(home, "data-gallery-limit=\"8\"", "en/index.html", "home event gallery should start with a short list instead of dumping every card.");
assertIncludes(home, "data-gallery-mobile-limit=\"6\"", "en/index.html", "home event gallery should stay shorter on mobile.");
assertIncludes(appJs, "gallery-load-more", "app.js", "event galleries should expose a clear more button when the initial list is limited.");
assertIncludes(appJs, "is-gallery-limited", "app.js", "event galleries should hide extra cards before the visitor asks for more.");
const homeSourceRows = countMatches(home, /class="event-source-row"/g);
if (homeEventCards !== homeSourceRows) {
  push("en/index.html", `each home event card must show a linked-source role row; found ${homeSourceRows}/${homeEventCards}.`);
}
const savedMapQueries = countMatches(home, /data-event-map-query="/g);
if (homeEventCards !== savedMapQueries) {
  push("en/index.html", `each home event card save button must carry a Korean map query for the planner; found ${savedMapQueries}/${homeEventCards}.`);
}
const homePlanTools = countMatches(home, /class="event-plan-tools"/g);
if (homeEventCards !== homePlanTools) {
  push("en/index.html", `each home event card must expose weather, Korean map, and calendar planning tools; found ${homePlanTools}/${homeEventCards}.`);
}
for (const label of ["Weather", "Korean map", "Calendar"]) {
  assertIncludes(home, label, "en/index.html", `home event cards must surface ${label} as a visible planning tool.`);
}
for (const role of ["official", "ticketing", "listing", "offer"]) {
  assertIncludes(home, `data-source-role="${role}"`, "en/index.html", `home cards must expose ${role} source-role labels so visitors understand the handoff.`);
}
const splitBand = home.match(/<section class="split-band">[\s\S]*?<\/section>/)?.[0] || "";
if (splitBand.includes("/en/sources/")) {
  push("en/index.html", "homepage split band should promote visitor routes/guides, not operational source pages.");
}
const planningLayer = home.match(/<section class="planning-layer"[\s\S]*?<\/section>/)?.[0] || "";
if (planningLayer) {
  push("en/index.html", "homepage should not show the internal planning-layer explainer before visitor listings.");
}
const differenceSection = home.match(/<section class="service-difference"[\s\S]*?<\/section>/)?.[0] || "";
if (differenceSection) {
  push("en/index.html", "homepage should not show the source-comparison explainer before visitor listings.");
}
assertIncludes(styles, ".handoff-note", "styles.css", "detail handoff-note styling is missing.");
assertIncludes(styles, ".handoff-chip", "styles.css", "detail handoff chips must replace long handoff prose.");
assertIncludes(styles, ".visitor-action-grid", "styles.css", "detail visitor action checklist styling is missing.");
assertIncludes(styles, ".detail-section-head h2 {\n  margin: 0;\n  line-height: 1.26;", "styles.css", "detail section headings need enough line-height so descenders are not clipped.");
assertIncludes(styles, ".visitor-action-section .detail-section-head {\n  padding: 22px 22px 18px;", "styles.css", "visit-ready checklist heading needs bottom padding before the divider.");
assertIncludes(styles, ".source-transparency-grid", "styles.css", "detail source transparency styling is missing.");
assertIncludes(styles, ".source-boundary-callout", "styles.css", "detail source boundary callout styling is missing.");
assertIncludes(styles, ".guide-decision-panel", "styles.css", "guide decision panel styling is missing.");
assertIncludes(styles, ".guide-event-grid", "styles.css", "guide related-event grid styling hook is missing.");
assertIncludes(styles, ".guide-source-strip", "styles.css", "guide official-source strip styling is missing.");
assertIncludes(styles, ".save-event-label", "styles.css", "save buttons must preserve a visible text label beside the icon.");
assertIncludes(styles, ".event-source-row", "styles.css", "event cards must style source-role rows.");
assertIncludes(styles, ".source-role-chip", "styles.css", "event cards must style linked-source role chips.");
assertIncludes(styles, ".event-plan-tools", "styles.css", "event cards must style visible planning-tool chips.");
assertIncludes(styles, ".recheck-card {\n  display: grid;\n  grid-template-columns:", "styles.css", "recheck cards need a stable thumbnail-plus-content grid.");
assertIncludes(styles, ".recheck-thumb", "styles.css", "recheck cards need a visual thumbnail area instead of text-only blocks.");
assertIncludes(styles, ".recheck-card-body", "styles.css", "recheck cards need a structured content body below/alongside the thumbnail.");
assertIncludes(styles, ".recheck-source", "styles.css", "recheck source links need subdued structured styling instead of oversized blue text.");
assertIncludes(read(path.join("en", "now", "index.html")), "class=\"recheck-thumb\"", "en/now/index.html", "recheck cards need visible event imagery.");
assertIncludes(read(path.join("en", "now", "index.html")), "class=\"recheck-title\"", "en/now/index.html", "recheck cards need structured title/meta/source slots.");
assertIncludes(styles, "clip-path: polygon(0 0, calc(100% - 13px) 0, 100% 50%", "styles.css", "now page status groups should render as compact flag labels, not large headings.");
assertIncludes(read(path.join("en", "now", "index.html")), "class=\"now-status-flag", "en/now/index.html", "now page cards must show event timing as status flags, not inline meta text.");
assertIncludes(styles, ".now-status-flag", "styles.css", "now page card timing flags need dedicated styling.");
assertIncludes(styles, ".routes-ad-rail .ad-disclosure", "styles.css", "sponsored route ad label should be a compact horizontal disclosure.");
assertNotVisible(styles, /routes-ad-rail > span[\s\S]*?writing-mode:\s*vertical-rl/, "styles.css", "route ad disclosure must not render as vertical text.");
assertIncludes(read(path.join("en", "routes", "index.html")), "class=\"routes-ad-rail\"", "en/routes/index.html", "routes page should keep the Trip.com sponsored hotel card in the side rail.");
assertIncludes(styles, ".trip-rail-card", "styles.css", "Trip.com route ad needs a visible, constrained rail card.");
assertIncludes(plannerPage, "class=\"page-hero compact planner-page-hero\"", "en/planner/index.html", "planner page must use the shared compact page hero pattern.");
if (plannerPage.includes("class=\"planner-hero\"") || plannerPage.includes("class=\"planner-preview\"")) {
  push("en/planner/index.html", "planner page should not use a separate oversized hero or preview panel that breaks page consistency.");
}
if (styles.includes(".planner-hero") || styles.includes(".planner-preview")) {
  push("styles.css", "planner-specific hero/preview CSS should be removed so the planner header follows the shared page system.");
}
if (plannerPage.includes("class=\"planner-utility\"") || styles.includes(".planner-utility")) {
  push("en/planner/index.html", "planner page should not show non-clickable quick-check explainer cards.");
}
assertIncludes(plannerPage, "class=\"planner-starter\"", "en/planner/index.html", "planner page must offer starter events when no saved list exists.");
assertIncludes(plannerPage, "data-map-label=\"Korean map\"", "en/planner/index.html", "planner page must expose a localized map label for saved event cards.");
assertIncludes(appJs, "planner-card-map-links", "app.js", "saved planner cards must render Google, Naver, and Kakao map links from the saved Korean map query.");
assertIncludes(appJs, "map.naver.com/p/search", "app.js", "saved planner map links must include Naver Map search.");
assertIncludes(appJs, "map.kakao.com/?q=", "app.js", "saved planner map links must include Kakao Map search.");
assertIncludes(styles, ".planner-starter-card", "styles.css", "planner starter cards must be styled.");
assertIncludes(styles, ".planner-card-map-links a {\n  min-height: 44px;", "styles.css", "saved planner map links must preserve a minimum 44px touch target.");
assertIncludes(styles, ".button,\n.filter-bar button {\n  display: inline-flex;", "styles.css", "primary buttons must share a stable touch-target rule.");
assertIncludes(styles, "min-height: 44px;", "styles.css", "visitor controls must preserve a minimum 44px touch target.");
assertMinHeightAtLeast(".save-event", 44, "styles.css", "save buttons must preserve a minimum 44px touch target.");
assertIncludes(styles, ".saved-clear {\n  min-height: 44px;", "styles.css", "saved planner clear button must preserve a minimum 44px touch target.");
assertIncludes(styles, ".saved-open,\n.planner-card-actions a,\n.planner-card-actions button {\n  min-height: 44px;", "styles.css", "saved planner controls must preserve a minimum 44px touch target.");
if (styles.includes(".spotlight-arrow")) {
  push("styles.css", "spotlight controls should not use arrow buttons on the first-screen carousel.");
}
assertIncludes(styles, ".spotlight-controls .spotlight-dot {\n    width: 24px;\n    min-height: 24px;", "styles.css", "mobile spotlight dots must stay compact and uncluttered.");
assertIncludes(styles, ".calendar-month-heading {\n  display: grid;", "styles.css", "calendar month headings should stack month and year consistently.");
const about = read("en/about/index.html");
assertIncludes(about, "not a ticket marketplace or checkout service", "en/about/index.html", "about page must define the non-ticketing service boundary.");
assertIncludes(about, "class=\"about-identity-hero\"", "en/about/index.html", "about page must show a branded service identity hero.");
assertIncludes(about, "class=\"about-brand-mark\"", "en/about/index.html", "about page must surface the K-Spot Now logo mark.");
assertIncludes(about, "class=\"about-principles\"", "en/about/index.html", "about page must summarize service principles visually.");
assertIncludes(styles, ".about-page h1", "styles.css", "about page needs dedicated brand-layout styling.");
assertIncludes(styles, "text-wrap: nowrap;", "styles.css", "K-Spot Now brand title must stay on one line.");
assertIncludes(styles, "word-break: keep-all;", "styles.css", "K-Spot Now brand title must not split awkwardly.");
assertIncludes(styles, ".page-hero > .eyebrow", "styles.css", "top page eyebrow labels must use one consistent brand color.");
assertIncludes(styles, ".city-strip.page-strip {\n  display: flex;\n  flex-wrap: wrap;", "styles.css", "desktop city page strip should wrap instead of clipping the final city chip.");
assertIncludes(styles, ".city-strip.page-strip {\n    display: grid;\n    grid-template-columns: repeat(2, minmax(0, 1fr));", "styles.css", "mobile city page strip should use a compact two-column grid instead of clipped horizontal chips.");
assertIncludes(home, "/en/advertising/", "en/index.html", "footer trust links must include the advertising policy.");
const advertising = read("en/advertising/index.html");
assertIncludes(advertising, "Advertising Policy", "en/advertising/index.html", "advertising policy page title is missing.");
assertIncludes(advertising, "ads cannot buy event inclusion", "en/advertising/index.html", "advertising policy must state ads cannot buy editorial inclusion.");
assertIncludes(advertising, "K-Spot Now does not process payments", "en/advertising/index.html", "advertising policy must keep payments and official-source actions separated.");
const frAdvertising = read("fr/advertising/index.html");
const deAdvertising = read("de/advertising/index.html");
assertIncludes(frAdvertising, "Politique publicitaire", "fr/advertising/index.html", "French advertising policy title is missing.");
assertIncludes(frAdvertising, "ne peuvent pas acheter", "fr/advertising/index.html", "French advertising policy must separate ads from editorial placement.");
assertIncludes(deAdvertising, "Werberichtlinie", "de/advertising/index.html", "German advertising policy title is missing.");
assertIncludes(deAdvertising, "keinen Eintrag", "de/advertising/index.html", "German advertising policy must separate ads from editorial placement.");
const frHome = read("fr/index.html");
const deHome = read("de/index.html");
assertIncludes(frHome, "Listing / billetterie", "fr/index.html", "French home must expose linked-source role labels on event cards.");
assertIncludes(frHome, "Carte coreenne", "fr/index.html", "French home cards must expose planning-tool chips.");
assertIncludes(deHome, "Koreanische Karte", "de/index.html", "German home cards must expose planning-tool chips.");
assertIncludes(deHome, "Listing / Ticketquelle", "de/index.html", "German home must expose linked-source role labels on event cards.");
const deHomeText = htmlText(deHome);
for (const phrase of ["Veranstaltungsarten", "Feste & Kultur", "Zollfrei", "Einkaufen", "Landesweit", "Aktiv /"]) {
  assertIncludes(deHomeText, phrase, "de/index.html", `German home browse/event UI should expose localized label: ${phrase}`);
}
for (const [pattern, label] of [
  [/\b\d+\s+Events\b/, "English event count unit"],
  [/\bDuty[- ]free\b/, "English duty-free category label"],
  [/\bShopping\b/, "English shopping label"],
  [/\bSHOPPING\b/, "English shopping thumbnail label"],
  [/\bTRAVEL BENEFITS\b/, "English travel-benefits thumbnail label"],
  [/\bNationwide\b/, "English nationwide city label"],
  [/\bLive\b/, "English live status label"],
  [/\bCity project\b/, "English event-kind label"]
]) {
  if (pattern.test(deHomeText)) push("de/index.html", `German home still exposes ${label}.`);
}

const frHomeText = htmlText(frHome);
for (const phrase of ["Types d'evenements", "Hors taxes", "Achats", "National", "En cours"]) {
  assertIncludes(frHomeText, phrase, "fr/index.html", `French home browse/event UI should expose localized label: ${phrase}`);
}
for (const [pattern, label] of [
  [/\bDuty[- ]free\b/, "English duty-free category label"],
  [/\bShopping\b/, "English shopping label"],
  [/\bSHOPPING\b/, "English shopping thumbnail label"],
  [/\bTRAVEL BENEFITS\b/, "English travel-benefits thumbnail label"],
  [/\bNationwide\b/, "English nationwide city label"],
  [/\bLive\b/, "English live status label"],
  [/\bCity project\b/, "English event-kind label"]
]) {
  if (pattern.test(frHomeText)) push("fr/index.html", `French home still exposes ${label}.`);
}

const visitorUiExpectations = {
  es: ["Saltar al contenido principal", "Guardar", "revisado"],
  zh: ["跳到主要内容", "保存", "新鲜度"],
  pt: ["Ir para o conteudo principal", "Salvar", "revisado"],
  ru: ["Перейти к основному содержанию", "Сохранить", "Актуальность"],
  ja: ["本文へ移動", "保存", "更新状態"],
  fr: ["Aller au contenu principal", "Enregistrer", "Fraicheur"],
  de: ["Zum Hauptinhalt springen", "Speichern", "Aktualitat"]
};

visitorUiExpectations.es[1] = "Guardar en plan";
visitorUiExpectations.zh[1] = "\u52a0\u5165\u884c\u7a0b";
visitorUiExpectations.pt[1] = "Salvar no plano";
visitorUiExpectations.ru[1] = "\u0412 \u043f\u043b\u0430\u043d";
visitorUiExpectations.ja[1] = "\u8a08\u753b\u306b\u4fdd\u5b58";
visitorUiExpectations.fr[1] = "Ajouter au plan";
visitorUiExpectations.de[1] = "Zum Plan speichern";
visitorUiExpectations.es[2] = visitorUiExpectations.es[1];
visitorUiExpectations.zh[2] = visitorUiExpectations.zh[1];
visitorUiExpectations.pt[2] = visitorUiExpectations.pt[1];
visitorUiExpectations.ru[2] = visitorUiExpectations.ru[1];
visitorUiExpectations.ja[2] = visitorUiExpectations.ja[1];
visitorUiExpectations.fr[2] = visitorUiExpectations.fr[1];
visitorUiExpectations.de[2] = visitorUiExpectations.de[1];

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

const frDetail = read("fr/events/bts-city-arirang-busan-2026.html");
const deDetail = read("de/events/bts-city-arirang-busan-2026.html");
assertIncludes(frDetail, "Checklist avant visite", "fr/events/bts-city-arirang-busan-2026.html", "French detail must expose the compact visit checklist.");
assertIncludes(frDetail, "Cherchez le nom coreen", "fr/events/bts-city-arirang-busan-2026.html", "French detail must preserve the map-ready local place action.");
assertIncludes(frDetail, "source officielle", "fr/events/bts-city-arirang-busan-2026.html", "French detail must explain the official-source handoff.");
assertIncludes(deDetail, "Besuchs-Checkliste", "de/events/bts-city-arirang-busan-2026.html", "German detail must expose the compact visit checklist.");
assertIncludes(deDetail, "Koreanischen Ortsnamen suchen", "de/events/bts-city-arirang-busan-2026.html", "German detail must preserve the map-ready local place action.");
assertIncludes(deDetail, "offiziellen", "de/events/bts-city-arirang-busan-2026.html", "German detail must explain the official-source handoff.");
const frNolDetail = read("fr/events/blackpink-tamagotchi-seoul-forest-2026.html");
const deNolDetail = read("de/events/blackpink-tamagotchi-seoul-forest-2026.html");
assertIncludes(frNolDetail, "Pourquoi cette page avant la source liee", "fr/events/blackpink-tamagotchi-seoul-forest-2026.html", "French NOL detail must explain why K-Spot Now comes before the linked source.");
assertIncludes(frNolDetail, "La source liee de listing ou billetterie", "fr/events/blackpink-tamagotchi-seoul-forest-2026.html", "French detail must describe linked listing/ticket sources without defensive platform naming.");
assertIncludes(deNolDetail, "Warum diese Seite vor der verlinkten Quelle", "de/events/blackpink-tamagotchi-seoul-forest-2026.html", "German NOL detail must explain why K-Spot Now comes before the linked source.");
assertIncludes(deNolDetail, "Die verlinkte Listing- oder Ticketquelle", "de/events/blackpink-tamagotchi-seoul-forest-2026.html", "German detail must describe linked listing/ticket sources without defensive platform naming.");

const frRouteIndex = read("fr/routes/index.html");
const deRouteIndex = read("de/routes/index.html");
const enRouteIndex = read("en/routes/index.html");
assertIncludes(enRouteIndex, "class=\"routes-with-ad\"", "en/routes/index.html", "Travel routes index must use the route grid with a left ad rail.");
assertIncludes(enRouteIndex, "class=\"routes-ad-rail\"", "en/routes/index.html", "Travel routes index must place the Trip.com sponsored card beside route cards.");
assertIncludes(enRouteIndex, "class=\"trip-rail-card\"", "en/routes/index.html", "Travel routes ad must render a visible rail card, not an empty iframe shell.");
assertIncludes(enRouteIndex, "rel=\"sponsored nofollow noopener\"", "en/routes/index.html", "Travel routes ad card must keep affiliate disclosure attributes.");
assertNotVisible(enRouteIndex, /class="trip-square-ad"|TD17833727|width="1200" height="1200"|class="trip-skyscraper-frame"|<iframe/i, "en/routes/index.html", "Travel routes index must not render square or blank-prone Trip.com iframe ads.");
assertIncludes(frRouteIndex, "Soiree au Hangang", "fr/routes/index.html", "French route index must localize route titles and route copy.");
assertIncludes(deRouteIndex, "Hangang-Abendroute", "de/routes/index.html", "German route index must localize route titles and route copy.");
assertIncludes(frDetail, "Vue rapide", "fr/events/bts-city-arirang-busan-2026.html", "French weather overview heading must be localized.");
assertIncludes(frDetail, "Prevision courte KMA", "fr/events/bts-city-arirang-busan-2026.html", "French KMA forecast source line must be localized.");
assertIncludes(frDetail, "bouteille d&#39;eau", "fr/events/bts-city-arirang-busan-2026.html", "French weather packing tags must be localized.");
assertIncludes(deDetail, "Kurzuberblick", "de/events/bts-city-arirang-busan-2026.html", "German weather overview heading must be localized.");
assertIncludes(deDetail, "KMA-Kurzfristprognose", "de/events/bts-city-arirang-busan-2026.html", "German KMA forecast source line must be localized.");
assertIncludes(deDetail, "Wasserflasche", "de/events/bts-city-arirang-busan-2026.html", "German weather packing tags must be localized.");

const localizedLeakPhrases = [
  "At a glance",
  "Weather summary",
  "Rain peak",
  "KMA forecast updated",
  "Forecast source",
  "Previous-year monthly baseline",
  "water bottle",
  "UV protection",
  "comfortable walking shoes",
  "Official source:",
  "Practical Korea travel routes",
  "Hangang evening route",
  "Outdoor festivals",
  "Fresh multilingual Korea events",
  "Seasonal baseline",
  "Typical range",
  "previous-year pattern",
  "visitor packing",
  "Live forecast",
  "before leaving",
  "daily before public build",
  "Busan festivals / city events",
  "Busan pop-ups / K-pop regional events",
  "official event watch",
  "official campaign watch",
  "duty-free event",
  "foreign visitor benefits",
  "shopping tourism",
  "daily; hourly",
  "manual queue; hourly",
  "TOURISM-FESTIVALS",
  "SHOPPING-BEAUTY-DUTYFREE",
  "KPOP-POPUPS-TICKETING",
  "WEATHER-ROUTES"
];

for (const lang of ["fr", "de"]) {
  const leakTargets = [
    [`${lang}/index.html`, read(`${lang}/index.html`)],
    [`${lang}/routes/index.html`, read(`${lang}/routes/index.html`)],
    [`${lang}/events/bts-city-arirang-busan-2026.html`, read(`${lang}/events/bts-city-arirang-busan-2026.html`)],
    [`${lang}/sources/index.html`, read(`${lang}/sources/index.html`)],
    [`${lang}/watchlist/index.html`, read(`${lang}/watchlist/index.html`)],
    [`${lang}/feed.xml`, read(`${lang}/feed.xml`)],
    [`${lang}/latest.json`, read(`${lang}/latest.json`)]
  ];
  for (const [id, raw] of leakTargets) {
    const text = id.endsWith(".html") ? htmlText(raw) : raw;
    for (const phrase of localizedLeakPhrases) {
      if (text.includes(phrase)) push(id, `French/German public surface still exposes English UI phrase: ${phrase}`);
    }
  }
  const localizedHome = read(`${lang}/index.html`);
  if (/\bitems<\/span>|\bevents<\/span>/.test(localizedHome)) {
    push(`${lang}/index.html`, "French/German browse pills must localize item/event count labels.");
  }
}

const activeEvents = events.filter((event) => event.endDate >= today).slice(0, 6);
for (const event of activeEvents) {
  const html = read(path.join("en", "events", `${event.slug}.html`));
  for (const needle of ["fact-grid", "fact-calendar", "fact-pin", "fact-check", "fact-shield", "weather-overview", "map-link-list"]) {
    assertIncludes(html, needle, `en/events/${event.slug}.html`, `${needle} block is missing.`);
  }
  assertIncludes(html, "class=\"handoff-note\"", `en/events/${event.slug}.html`, "detail page must include an official-source handoff note.");
  assertIncludes(html, "class=\"handoff-chip\"", `en/events/${event.slug}.html`, "detail page must show compact handoff chips instead of long handoff prose.");
  assertIncludes(html, "data-save-event-label", `en/events/${event.slug}.html`, "detail save button must include a durable visible label node.");
  assertIncludes(html, "Visit-ready checklist", `en/events/${event.slug}.html`, "detail page must surface an at-a-glance visitor action checklist.");
  assertIncludes(html, "Confirm on the official page", `en/events/${event.slug}.html`, "detail checklist must direct visitors to final official confirmation.");
  assertIncludes(html, "Search the Korean place name", `en/events/${event.slug}.html`, "detail checklist must explain map-ready Korean place search.");
  assertIncludes(html, "Source transparency", `en/events/${event.slug}.html`, "detail page must explain K-Spot Now's planning role versus the linked source.");
  assertIncludes(html, "K-Spot Now adds", `en/events/${event.slug}.html`, "detail page must identify the value added beyond source listings.");
  assertIncludes(html, "source-boundary-callout", `en/events/${event.slug}.html`, "detail page must include a visible linked-source boundary callout.");
  assertIncludes(html, "Why this page before the linked source", `en/events/${event.slug}.html`, "detail page must explain why visitors use K-Spot Now before the linked source.");
  assertIncludes(html, "detail-quick-plan", `en/events/${event.slug}.html`, "detail page must surface a visible before-booking planning rail near the hero.");
  assertIncludes(html, "Before you book", `en/events/${event.slug}.html`, "detail page must make the pre-booking planning role visible near the hero.");
  assertIncludes(html, "affiliate-action", `en/events/${event.slug}.html`, "detail hero must include a visible hotel CTA, not bury affiliate links lower on the page.");
  assertIncludes(html, "Sponsored hotel link", `en/events/${event.slug}.html`, "detail page must show hotel affiliate links as labeled planning CTAs, not hidden utility links.");
  if (event.eventKind === "concert") {
    assertIncludes(html, "Concert", `en/events/${event.slug}.html`, "concert date basis is missing from the detail audit facts.");
  }
}

const seoulAffiliateEvent = events.find((event) => event.city === "Seoul" && event.endDate >= today) || events.find((event) => event.city === "Seoul");
if (seoulAffiliateEvent) {
  const html = read(path.join("en", "events", `${seoulAffiliateEvent.slug}.html`));
  assertIncludes(html, "https://www.trip.com/hotels/list?city=274", `en/events/${seoulAffiliateEvent.slug}.html`, "Trip.com Seoul affiliate hotel link must be available for visitor planning.");
  assertIncludes(html, "Allianceid=8627235", `en/events/${seoulAffiliateEvent.slug}.html`, "Trip.com affiliate Allianceid must be present.");
  assertIncludes(html, "SID=318693138", `en/events/${seoulAffiliateEvent.slug}.html`, "Trip.com affiliate SID must be present.");
  assertIncludes(html, "trip_sub3=D17791636", `en/events/${seoulAffiliateEvent.slug}.html`, "Trip.com campaign sub id must be present.");
  assertIncludes(html, "rel=\"sponsored nofollow noopener\"", `en/events/${seoulAffiliateEvent.slug}.html`, "Affiliate links must be labeled with sponsored/nofollow rel attributes.");
  assertIncludes(html, "Sponsored hotel link", `en/events/${seoulAffiliateEvent.slug}.html`, "Affiliate disclosure must be visible without heavy copy.");
}

const nolDetail = read("en/events/blackpink-tamagotchi-seoul-forest-2026.html");
assertIncludes(nolDetail, "Listing / ticket source", "en/events/blackpink-tamagotchi-seoul-forest-2026.html", "Listing pages must be labeled as listing/ticket sources, not generic official-source pages.");
assertIncludes(nolDetail, "The linked listing or ticket source", "en/events/blackpink-tamagotchi-seoul-forest-2026.html", "Listing pages must keep a concise linked-source boundary.");
assertIncludes(nolDetail, "The linked listing or ticket source is where final details can change", "en/events/blackpink-tamagotchi-seoul-forest-2026.html", "Listing details must explain the official handoff without defensive platform naming.");

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
    if (lang === "fr" || lang === "de") {
      const visible = htmlText(html);
      for (const title of englishGuideTitles) {
        if (visible.includes(title)) {
          push(`${lang}/guides/${guide.slug}.html`, `localized guide detail still exposes English guide title: ${title}`);
        }
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

console.log("UX quality validation passed: compact mobile header, multilingual pages, carousel dots, calendar headings, detail facts, weather blocks, and K-pop concert monitoring are present.");
