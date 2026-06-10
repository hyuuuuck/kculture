import fs from "node:fs";
import path from "node:path";
import { todayString } from "./lib/date.mjs";

const root = path.resolve(".");
const dist = path.join(root, "dist");
const feedDir = path.join(root, "data", "feeds");
const today = todayString();

const qualitySystem = readJson("data/quality-system.json");
const events = readJson("data/events.json");
const sources = readJson("data/sources.json");
const guides = readJson("data/guides.json");
const curationQueue = readJson("data/curation-queue.json");
const routes = readJson("data/travel-routes.json");
const thumbnailSources = readJson("data/thumbnail-sources.json", {});

const languages = ["en", "es", "zh", "pt", "ru", "ja", "fr", "de"];
const requiredPolicyPages = ["about", "contact", "privacy", "cookie-policy", "advertising", "terms", "editorial-policy", "corrections", "sources", "freshness", "watchlist", "planner"];
const checks = [];
const dayMs = 24 * 60 * 60 * 1000;
const fastMovingCategories = new Set(["kpop", "beauty", "duty-free", "department-store"]);

function readJson(relativePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
  } catch {
    if (fallback !== null) return fallback;
    throw new Error(`Missing or invalid JSON: ${relativePath}`);
  }
}

function readText(relativePath) {
  try {
    return fs.readFileSync(path.join(root, relativePath), "utf8");
  } catch {
    return "";
  }
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

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function statusOf(event) {
  if (event.endDate < today) return "ended";
  if (event.startDate > today) return "upcoming";
  return "live";
}

function daysSince(iso) {
  return Math.floor((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${iso}T00:00:00Z`)) / dayMs);
}

function freshnessLimitDays(event) {
  const status = statusOf(event);
  if (status === "ended") return 45;
  if (status === "live") return fastMovingCategories.has(event.category) ? 2 : 3;
  return fastMovingCategories.has(event.category) ? 3 : 7;
}

function countMatches(text, pattern) {
  return [...text.matchAll(pattern)].length;
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

function latestMatchingFile(pattern) {
  if (!fs.existsSync(feedDir)) return "";
  return fs.readdirSync(feedDir)
    .filter((name) => pattern.test(name))
    .sort()
    .at(-1) || "";
}

function latestJson(pattern) {
  const fileName = latestMatchingFile(pattern);
  if (!fileName) return null;
  try {
    return JSON.parse(fs.readFileSync(path.join(feedDir, fileName), "utf8"));
  } catch {
    return null;
  }
}

function customDomainStatus() {
  const siteUrl = String(process.env.SITE_URL || "").trim();
  if (!siteUrl) return { ok: false, detail: "SITE_URL not set in this review run." };
  try {
    const parsed = new URL(siteUrl);
    const platformPreview = /\.(pages\.dev|netlify\.app|vercel\.app|github\.io)$/i.test(parsed.hostname);
    return {
      ok: parsed.protocol === "https:" && !platformPreview && !["localhost", "127.0.0.1", "example.com", "your-domain.com"].includes(parsed.hostname),
      detail: siteUrl
    };
  } catch {
    return { ok: false, detail: siteUrl };
  }
}

function collectHomeUx() {
  const home = readText("dist/en/index.html");
  if (!home) {
    fail("publisher", "Build", "Home page generated", "dist/en/index.html missing.", "Publisher: rebuild dist before CEO review.");
    return;
  }

  const slides = countMatches(home, /data-spotlight-slide/g);
  const tabs = countMatches(home, /class="spotlight-tab"/g);
  const hasCompactNavigation = home.includes("class=\"spotlight-nav-panel\"") && home.includes("data-spotlight-title-label");
  if (slides >= 3 && slides <= 5 && tabs === slides && hasCompactNavigation && !home.includes("spotlight-dots")) {
    pass("designer", "Hero", "Spotlight carousel", `${slides} slides with numbered controls and a readable current-title label.`);
  } else {
    fail("designer", "Hero", "Spotlight carousel", `${slides} slides, ${tabs} tabs, compact navigation ${hasCompactNavigation}.`, "Designer: keep 3-5 spotlight slides, compact numbered controls, and a current-title label; remove dot-only navigation.");
  }

  if (home.includes("Live Korea events, pop-ups, and deals for visitors.") && home.includes("K-Spot Now")) {
    pass("planner", "Positioning", "Brand promise", "Homepage states the live Korea events/pop-ups/deals promise.");
  } else {
    fail("planner", "Positioning", "Brand promise", "Homepage promise is missing or unclear.", "Planner: restore brand promise above the fold.");
  }

  const navHasOpsNoise = /<nav class="top-nav"[\s\S]*?(Sources|Watchlist)[\s\S]*?<\/nav>/i.test(home);
  if (!navHasOpsNoise) pass("designer", "Navigation", "Visitor-first primary nav", "Operations pages are not in the primary visitor nav.");
  else warn("designer", "Navigation", "Visitor-first primary nav", "Sources or Watchlist appear in primary nav.", "Designer: keep operations pages in footer or trust sections, not the main visitor nav.");

  const summaryBlock = home.match(/<dl class="service-summary"[\s\S]*?<\/dl>/)?.[0] || "";
  if (summaryBlock.includes("<dt>Guides</dt>") && !summaryBlock.includes("<dt>Sources</dt>")) {
    pass("designer", "Hero", "Visitor-facing summary stats", "Hero summary shows content value instead of operational source counts.");
  } else {
    warn("designer", "Hero", "Visitor-facing summary stats", "Hero summary may expose operational source counts.", "Designer: use visitor-facing counts such as guides, languages, live, and upcoming instead of source totals.");
  }

  const categoryMediaCards = countMatches(home, /class="category-pill[^"]*has-media/g);
  const cityMediaCards = countMatches(home, /class="city-pill[^"]*has-media/g);
  if (categoryMediaCards >= 7 && cityMediaCards >= 3) {
    pass("designer", "Browse", "Representative browse cards", `${categoryMediaCards} topic cards and ${cityMediaCards} place cards use real event thumbnails.`);
  } else {
    fail("designer", "Browse", "Representative browse cards", `${categoryMediaCards} topic cards and ${cityMediaCards} place cards use real event thumbnails.`, "Designer/Planner: use representative event or brand imagery for browse cards so visitors can recognize topics and destinations at a glance.");
  }

  const eventCards = countMatches(home, /class="event-card"/g);
  const sourceRows = countMatches(home, /class="event-source-row"/g);
  const sourceRoles = ["official", "ticketing", "listing", "offer"].filter((role) => home.includes(`data-source-role="${role}"`));
  if (eventCards && sourceRows === eventCards && sourceRoles.length === 4) {
    pass("planner", "Positioning", "Card-level source roles", `${sourceRows}/${eventCards} event cards show official, ticketing, listing, or offer handoff roles.`);
  } else {
    fail(
      "planner",
      "Positioning",
      "Card-level source roles",
      `${sourceRows}/${eventCards} rows; roles ${sourceRoles.join(", ") || "none"}.`,
      "Planner/Designer: every event card must show the linked-source role so visitors understand K-Spot Now is the planning layer before official, ticketing, listing, or offer pages."
    );
  }

  const planToolRows = countMatches(home, /class="event-plan-tools"/g);
  const hasPlanToolLabels = ["Weather", "Korean map", "Calendar"].every((label) => home.includes(label));
  if (eventCards && planToolRows === eventCards && hasPlanToolLabels) {
    pass("planner", "Visitor retention", "Card-level planning tools", `${planToolRows}/${eventCards} event cards show weather, Korean map, and calendar planning context before the click.`);
  } else {
    fail(
      "planner",
      "Visitor retention",
      "Card-level planning tools",
      `${planToolRows}/${eventCards} rows; labels ${hasPlanToolLabels}.`,
      "Planner/Designer: every event card must show why K-Spot Now is useful before the handoff: weather, Korean map names, and calendar planning tools."
    );
  }

  const savedMapQueries = countMatches(home, /data-event-map-query="/g);
  const plannerPage = readText("dist/en/planner/index.html");
  const appJs = readText("dist/app.js");
  const hasPlannerUtility = plannerPage.includes("class=\"planner-utility\"")
    && plannerPage.includes("data-map-label=\"Korean map\"");
  const hasSavedMapLinks = appJs.includes("planner-card-map-links")
    && appJs.includes("map.naver.com/p/search")
    && appJs.includes("map.kakao.com/?q=");
  if (eventCards && savedMapQueries === eventCards && hasPlannerUtility && hasSavedMapLinks) {
    pass("planner", "Visitor retention", "Saved planner map utility", `${savedMapQueries}/${eventCards} save buttons carry Korean map queries; planner renders local map handoff links.`);
  } else {
    fail(
      "planner",
      "Visitor retention",
      "Saved planner map utility",
      `${savedMapQueries}/${eventCards} map queries; utility ${hasPlannerUtility}; map links ${hasSavedMapLinks}.`,
      "Planner/Publisher: saved events must preserve Korean map search terms and render Google, Naver, and Kakao map handoff links inside the planner."
    );
  }

  const splitBand = home.match(/<section class="split-band">[\s\S]*?<\/section>/)?.[0] || "";
  if (splitBand && !splitBand.includes("/en/sources/") && splitBand.includes("/en/routes/")) {
    pass("planner", "Homepage utility", "Visitor-facing next step", "Homepage promotes routes and calendar instead of operational source pages.");
  } else {
    warn("planner", "Homepage utility", "Visitor-facing next step", "Homepage split band may still promote operational pages.", "Planner: route visitors toward calendar, routes, planner, or guides before source/audit pages.");
  }

  const planningLayer = home.match(/<section class="planning-layer"[\s\S]*?<\/section>/)?.[0] || "";
  const hasWorkflow = planningLayer.includes("class=\"planning-flow\"")
    && planningLayer.includes("Find signal")
    && planningLayer.includes("Verify visitor details")
    && planningLayer.includes("Continue officially");
  const hasServiceBoundary = planningLayer.includes("not a ticket shop")
    && planningLayer.includes("official tourism, brand, venue, duty-free, department-store, and ticketing marketplace pages");
  if (hasWorkflow && hasServiceBoundary) {
    pass("planner", "Positioning", "Planning-layer workflow", "Homepage explains why visitors plan on K-Spot Now before completing the final action on official sources.");
  } else {
    fail("planner", "Positioning", "Planning-layer workflow", `workflow ${hasWorkflow}, service boundary ${hasServiceBoundary}.`, "Planner/Designer: show the find, verify, continue-officially workflow and keep the non-ticket-shop boundary visible.");
  }

  const differenceSection = home.match(/<section class="service-difference"[\s\S]*?<\/section>/)?.[0] || "";
  const answersNolQuestion = differenceSection.includes("Why use this before NOL World or a ticket page?")
    && differenceSection.includes("Planning desk vs listing page")
    && differenceSection.includes("Single-source listing")
    && differenceSection.includes("K-Spot Now is the planning desk");
  const provesAddedValue = differenceSection.includes("Korean map names, calendar files, weather, route ideas")
    && differenceSection.includes("official, ticketing, listing, or offer");
  if (answersNolQuestion && provesAddedValue) {
    pass("planner", "Positioning", "Single-source differentiation", "Homepage explains why visitors use K-Spot Now before NOL World, ticketing, or other single-source listing pages.");
  } else {
    fail("planner", "Positioning", "Single-source differentiation", `answers NOL question ${answersNolQuestion}, proves added value ${provesAddedValue}.`, "Planner/Designer: add a clear K-Spot Now vs single-source listing comparison that highlights planning context, source-role labels, maps, weather, routes, calendar, and official handoff.");
  }
}

function collectCalendarUx() {
  for (const lang of languages) {
    const html = readText(`dist/${lang}/calendar/index.html`);
    const blocks = countMatches(html, /class="month-block"/g);
    const headings = countMatches(html, /class="calendar-month-heading"><span>[^<]+<\/span>\s*<span>\d{4}<\/span>/g);
    if (html && blocks && blocks === headings) {
      pass("designer", "Calendar", `${lang} month heading rhythm`, `${headings}/${blocks} month headings use split month/year spans.`);
    } else {
      fail("designer", "Calendar", `${lang} month heading rhythm`, `${headings}/${blocks} month headings are split.`, "Designer: keep all calendar month headings as month/year spans.");
    }
  }
}

function collectDetailUx() {
  let missing = 0;
  let missingChecklist = 0;
  let missingSourceBoundary = 0;
  let missingLocalizedBrief = 0;
  let internalKeyLeaks = 0;
  let checked = 0;
  const sourceBoundaryLangs = new Set(["en", "es", "pt", "fr", "de"]);
  for (const event of events) {
    for (const lang of languages) {
      checked += 1;
      const html = readText(`dist/${lang}/events/${event.slug}.html`);
      for (const token of ["fact-grid", "weather-overview", "map-link-list", "data-save-event", `href=\"/events/${event.slug}.ics\"`]) {
        if (!html.includes(token)) missing += 1;
      }
      if (!html.includes("visitor-action-grid")) missingChecklist += 1;
      if (sourceBoundaryLangs.has(lang) && !html.includes("source-boundary-callout")) missingSourceBoundary += 1;
      if ((lang === "fr" || lang === "de") && !html.includes("localized-visitor-brief")) missingLocalizedBrief += 1;
      if (/verificationOfficial|collectionOfficial[A-Za-z]+/.test(html)) internalKeyLeaks += 1;
    }
  }
  if (!missing) pass("designer", "Detail pages", "Visitor planning blocks", `${checked} detail pages include fact, weather, map, save, and calendar blocks.`);
  else fail("designer", "Detail pages", "Visitor planning blocks", `${missing} required blocks missing across ${checked} pages.`, "Designer/Publisher: rebuild detail page layout and rerun validate:details.");

  if (!missingChecklist) pass("designer", "Detail pages", "Visit-ready checklist", `${checked} detail pages show official confirmation, Korean map search, and flexible-plan reminders.`);
  else fail("designer", "Detail pages", "Visit-ready checklist", `${missingChecklist}/${checked} detail pages are missing the checklist.`, "Designer/Planner: add the visit-ready checklist to every detail page.");

  if (!missingSourceBoundary) {
    pass("planner", "Positioning", "Detail source boundary", `${events.length * sourceBoundaryLangs.size} detail pages explain why visitors use K-Spot Now before the linked source.`);
  } else {
    fail("planner", "Positioning", "Detail source boundary", `${missingSourceBoundary}/${events.length * sourceBoundaryLangs.size} detail pages are missing linked-source boundary copy.`, "Planner/Designer: add a concise K-Spot Now before source handoff explanation to detail pages.");
  }

  if (!internalKeyLeaks) pass("audit-institution", "Public copy", "No internal label leakage", `${checked} detail pages hide internal verification and collection translation keys.`);
  else fail("audit-institution", "Public copy", "No internal label leakage", `${internalKeyLeaks}/${checked} detail pages expose internal keys.`, "Audit Institution: block release until public labels replace internal translation keys.");

  if (!missingLocalizedBrief) {
    pass("audit-institution", "Translation quality", "FR/DE localized visitor briefs", `${events.length * 2} French/German detail pages include event-specific visitor brief blocks.`);
  } else {
    fail("audit-institution", "Translation quality", "FR/DE localized visitor briefs", `${missingLocalizedBrief}/${events.length * 2} French/German detail pages are missing localized visitor briefs.`, "Audit Institution: require French/German detail pages to show localized decision, map, and official-handoff context.");
  }
}

function collectGuideLocalization() {
  const englishGuideTitles = guides.map((guide) => guide.title?.en).filter(Boolean);
  const localizedLangs = ["fr", "de"];
  const leaks = [];
  for (const lang of localizedLangs) {
    const indexText = htmlText(readText(`dist/${lang}/guides/index.html`));
    for (const title of englishGuideTitles) {
      if (indexText.includes(title)) leaks.push(`${lang}/guides:${title}`);
    }
    for (const guide of guides) {
      const visible = htmlText(readText(`dist/${lang}/guides/${guide.slug}.html`));
      for (const title of englishGuideTitles) {
        if (visible.includes(title)) leaks.push(`${lang}/${guide.slug}:${title}`);
      }
    }
  }

  const frShopping = htmlText(readText("dist/fr/categories/shopping/index.html"));
  const deShopping = htmlText(readText("dist/de/categories/shopping/index.html"));
  const frDepartment = htmlText(readText("dist/fr/categories/department-store/index.html"));
  const deDepartment = htmlText(readText("dist/de/categories/department-store/index.html"));
  const categoryLeaks = [
    [frShopping, /Korea shopping festivals and seasonal sale archives/i, "fr shopping"],
    [deShopping, /Korea shopping festivals and seasonal sale archives/i, "de shopping"],
    [frDepartment, /Korea department store sales and pop-ups/i, "fr department-store"],
    [deDepartment, /Korea department store sales and pop-ups/i, "de department-store"]
  ].filter(([text, pattern]) => pattern.test(text)).map(([, , label]) => label);

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
    "Busan pop-ups / K-pop regional events"
  ];
  const surfaceLeaks = [];
  for (const lang of localizedLangs) {
    const targets = [
      [`${lang}/index`, readText(`dist/${lang}/index.html`), true],
      [`${lang}/routes`, readText(`dist/${lang}/routes/index.html`), true],
      [`${lang}/detail`, readText(`dist/${lang}/events/bts-city-arirang-busan-2026.html`), true],
      [`${lang}/sources`, readText(`dist/${lang}/sources/index.html`), true],
      [`${lang}/watchlist`, readText(`dist/${lang}/watchlist/index.html`), true],
      [`${lang}/feed`, readText(`dist/${lang}/feed.xml`), false],
      [`${lang}/latest`, readText(`dist/${lang}/latest.json`), false]
    ];
    for (const [id, raw, visibleOnly] of targets) {
      const text = visibleOnly ? htmlText(raw) : raw;
      for (const phrase of localizedLeakPhrases) {
        if (text.includes(phrase)) surfaceLeaks.push(`${id}:${phrase}`);
      }
    }
    if (/\bitems<\/span>|\bevents<\/span>/.test(readText(`dist/${lang}/index.html`))) {
      surfaceLeaks.push(`${lang}/index:items-events-count-label`);
    }
  }

  const frRoute = readText("dist/fr/routes/index.html");
  const deRoute = readText("dist/de/routes/index.html");
  const frDetail = readText("dist/fr/events/bts-city-arirang-busan-2026.html");
  const deDetail = readText("dist/de/events/bts-city-arirang-busan-2026.html");
  const requiredLocalizedPhrases = [
    [frRoute, "Soiree au Hangang", "fr route"],
    [deRoute, "Hangang-Abendroute", "de route"],
    [frDetail, "Vue rapide", "fr weather"],
    [frDetail, "Prevision courte KMA", "fr weather source"],
    [deDetail, "Kurzuberblick", "de weather"],
    [deDetail, "KMA-Kurzfristprognose", "de weather source"]
  ].filter(([text, phrase]) => !text.includes(phrase)).map(([, , label]) => label);

  if (!leaks.length && !categoryLeaks.length && !surfaceLeaks.length && !requiredLocalizedPhrases.length) {
    pass("audit-institution", "Translation quality", "FR/DE public-surface localization", `${localizedLangs.length * guides.length} guide details plus routes, weather, feeds, source pages, and browse labels avoid audited English leaks.`);
  } else {
    fail(
      "audit-institution",
      "Translation quality",
      "FR/DE public-surface localization",
      `${leaks.length} guide title leaks, ${categoryLeaks.length} category heading leaks, ${surfaceLeaks.length} surface leaks, ${requiredLocalizedPhrases.length} missing localized proofs.`,
      "Audit Institution: block release until French/German guide titles, topic pages, weather blocks, routes, feed summaries, source pages, and browse labels are localized instead of exposing English UI copy."
    );
  }
}

function collectInteractionQuality() {
  const styles = readText("styles.css");
  const baseButtons = styles.match(/\.button,\s*\.filter-bar button\s*\{[\s\S]*?\}/)?.[0] || "";
  const saveButton = styles.match(/\.save-event\s*\{[\s\S]*?\}/)?.[0] || "";
  const savedClear = styles.match(/\.saved-clear\s*\{[\s\S]*?\}/)?.[0] || "";
  const savedPlannerControls = styles.match(/\.saved-open,\s*\.planner-card-actions a,\s*\.planner-card-actions button\s*\{[\s\S]*?\}/)?.[0] || "";
  const savedPlannerMapLinks = styles.match(/\.planner-card-map-links a\s*\{[\s\S]*?\}/)?.[0] || "";
  const mobileSpotlight = styles.match(/@media \(max-width: 680px\)\s*\{[\s\S]*?\.service-summary dd[\s\S]*?\n\}/)?.[0] || "";
  const hasPrimaryTouchTargets = baseButtons.includes("min-height: 44px") && saveButton.includes("min-height: 44px");
  const hasSavedPlannerTouchTargets = savedClear.includes("min-height: 44px") && savedPlannerControls.includes("min-height: 44px") && savedPlannerMapLinks.includes("min-height: 44px");
  const hasMobileSpotlightTargets = mobileSpotlight.includes(".spotlight-controls .spotlight-tab")
    && mobileSpotlight.includes("width: 44px")
    && mobileSpotlight.includes("min-height: 44px")
    && mobileSpotlight.includes(".spotlight-arrow")
    && mobileSpotlight.includes("display: none");

  if (hasPrimaryTouchTargets && hasSavedPlannerTouchTargets && hasMobileSpotlightTargets) {
    pass("designer", "Interaction", "Mobile touch targets", "Primary buttons, save buttons, saved planner actions/map links, and mobile spotlight tabs preserve 44px touch targets.");
  } else {
    fail(
      "designer",
      "Interaction",
      "Mobile touch targets",
      `primary ${hasPrimaryTouchTargets}, saved planner ${hasSavedPlannerTouchTargets}, spotlight ${hasMobileSpotlightTargets}.`,
      "Designer/Publisher: keep visitor controls and saved planner actions at least 44px high, and prevent cramped mobile spotlight arrows."
    );
  }
}

function collectContentPlanning() {
  if (events.length >= 35) pass("planner", "Content depth", "Event catalog", `${events.length} public events.`);
  else fail("planner", "Content depth", "Event catalog", `${events.length} public events.`, "Planner: add reviewed official events before AdSense submission.");

  if (guides.length >= 10) pass("planner", "Content depth", "Evergreen guides", `${guides.length} visitor guides.`);
  else fail("planner", "Content depth", "Evergreen guides", `${guides.length} visitor guides.`, "Planner: publish more original evergreen guides.");

  const thinEventGuidance = events.filter((event) => {
    const whyGo = String(event.whyGo?.en || "").trim();
    const tips = Array.isArray(event.travelTips) ? event.travelTips.filter(Boolean) : [];
    return whyGo.length < 70 || tips.length < 3;
  });
  if (!thinEventGuidance.length) {
    pass("audit-institution", "Low-value content guard", "Original event guidance", `${events.length}/${events.length} events include why-go context and 3+ practical visitor tips.`);
  } else {
    fail("audit-institution", "Low-value content guard", "Original event guidance", `${thinEventGuidance.length} event pages are too thin.`, `Planner: strengthen whyGo or travelTips for ${thinEventGuidance.slice(0, 4).map((event) => event.slug).join(", ")}.`);
  }

  if (routes.length >= 8) pass("planner", "Travel utility", "Route ideas", `${routes.length} route plans.`);
  else warn("planner", "Travel utility", "Route ideas", `${routes.length} route plans.`, "Planner: add more city and shopping route plans.");

  const categories = new Set(events.map((event) => event.category));
  const requiredCategories = ["festival", "kpop", "beauty", "duty-free", "department-store", "shopping", "travel-benefits"];
  const missingCategories = requiredCategories.filter((category) => !categories.has(category));
  if (!missingCategories.length) pass("planner", "Coverage", "Topic coverage", `${requiredCategories.length} public topic categories represented.`);
  else fail("planner", "Coverage", "Topic coverage", `Missing ${missingCategories.join(", ")}.`, "Planner: add reviewed events for missing topic categories.");

  const concertEvents = events.filter((event) => event.category === "kpop" && event.eventKind === "concert");
  if (concertEvents.length) pass("planner", "K-pop", "Concert coverage", `${concertEvents.length} audited K-pop concert listing(s).`);
  else fail("planner", "K-pop", "Concert coverage", "No K-pop concert listing exists.", "Planner: add at least one officially audited K-pop concert page.");
}

function collectSourceAudit() {
  const officialVerified = events.filter((event) => String(event.verification || "").startsWith("official")).length;
  if (officialVerified === events.length) pass("audit-institution", "Trust", "Official verification labels", `${officialVerified}/${events.length} events.`);
  else fail("audit-institution", "Trust", "Official verification labels", `${officialVerified}/${events.length} events.`, "Audit Institution: block non-official public listings.");

  const stale = events.filter((event) => {
    const status = statusOf(event);
    if (status === "ended") return false;
    const age = daysSince(event.lastChecked);
    return Number.isFinite(age) && age > freshnessLimitDays(event);
  });
  if (!stale.length) pass("audit-institution", "Freshness", "Live/upcoming recheck windows", "No stale live or upcoming event pages.");
  else fail("audit-institution", "Freshness", "Live/upcoming recheck windows", `${stale.length} stale active listings.`, `Audit Institution: recheck official sources for ${stale.slice(0, 4).map((event) => event.slug).join(", ")}.`);

  const auditedHighRisk = events.filter((event) => event.audit).length;
  if (auditedHighRisk >= 2) pass("audit-institution", "High-risk facts", "Event audit blocks", `${auditedHighRisk} high-risk listings have explicit audit evidence.`);
  else warn("audit-institution", "High-risk facts", "Event audit blocks", `${auditedHighRisk} high-risk listings have audit evidence.`, "Audit Institution: add explicit audit blocks to more K-pop, ticketing, and sale-window pages.");

  const officialThumbnails = events.filter((event) => String(event.thumbnail || "").includes("/official/")).length;
  if (officialThumbnails >= Math.ceil(events.length * 0.8)) {
    pass("audit-institution", "Imagery", "Official thumbnail coverage", `${officialThumbnails}/${events.length} official or collected thumbnails.`);
  } else {
    warn("audit-institution", "Imagery", "Official thumbnail coverage", `${officialThumbnails}/${events.length} official or collected thumbnails.`, "Audit Institution: keep replacing generated thumbnails with official event, brand, or venue images.");
  }

  const registeredThumbnailMetadata = Object.keys(thumbnailSources || {}).length;
  if (registeredThumbnailMetadata >= officialThumbnails) pass("audit-institution", "Imagery", "Thumbnail provenance", `${registeredThumbnailMetadata} thumbnail source records.`);
  else warn("audit-institution", "Imagery", "Thumbnail provenance", `${registeredThumbnailMetadata}/${officialThumbnails} source records.`, "Audit Institution: record source URL, page, dimensions, and collection date for official thumbnails.");
}

function collectBenchmarkWatch() {
  const sourceText = JSON.stringify(sources).toLowerCase();
  const queueText = JSON.stringify(curationQueue).toLowerCase();
  const benchmarkTerms = [
    ["visitkorea", "VisitKorea/KTO tourism source coverage"],
    ["olive young", "OLIVE YOUNG shopping source coverage"],
    ["duty free", "Duty-free source coverage"],
    ["department", "Department-store source coverage"],
    ["kma", "Weather/KMA source coverage"],
    ["ticketlink", "K-pop ticketing source coverage"],
    ["yes24", "YES24 ticketing source coverage"],
    ["melon", "Melon ticketing source coverage"],
    ["weverse", "Weverse artist/shop source coverage"]
  ];
  for (const [term, label] of benchmarkTerms) {
    if (sourceText.includes(term) || queueText.includes(term)) pass("audit-institution", "Benchmark watch", label, `Term "${term}" present in source registry or curation queue.`);
    else fail("audit-institution", "Benchmark watch", label, `Term "${term}" missing.`, "Audit Institution: add official benchmark-equivalent source coverage.");
  }

  if (qualitySystem.benchmarks?.length >= 4) pass("ceo", "Benchmark strategy", "Reference set", `${qualitySystem.benchmarks.length} benchmark websites tracked.`);
  else warn("ceo", "Benchmark strategy", "Reference set", `${qualitySystem.benchmarks?.length || 0} benchmark websites tracked.`, "CEO: add more official benchmark sites to data/quality-system.json.");
}

function collectPublishing() {
  const requiredRootFiles = ["dist/index.html", "dist/sitemap.xml", "dist/robots.txt", "dist/events.ics", "dist/feed.xml", "dist/latest.json", "dist/recheck.json", "dist/source-refresh.json", "dist/_headers"];
  const missingRootFiles = requiredRootFiles.filter((file) => !exists(file));
  if (!missingRootFiles.length) pass("publisher", "Build", "Production artifacts", `${requiredRootFiles.length} required root files present.`);
  else fail("publisher", "Build", "Production artifacts", `Missing ${missingRootFiles.join(", ")}.`, "Publisher: run npm.cmd run build and validate production artifacts.");

  const missingPolicyPages = [];
  for (const lang of languages) {
    for (const page of requiredPolicyPages) {
      if (!exists(`dist/${lang}/${page}/index.html`)) missingPolicyPages.push(`${lang}/${page}`);
    }
  }
  if (!missingPolicyPages.length) pass("publisher", "Policy pages", "Multilingual trust pages", `${languages.length * requiredPolicyPages.length} required pages present.`);
  else fail("publisher", "Policy pages", "Multilingual trust pages", `Missing ${missingPolicyPages.slice(0, 6).join(", ")}.`, "Publisher: restore policy pages before launch.");

  const domain = customDomainStatus();
  if (domain.ok) pass("publisher", "Production config", "Custom HTTPS domain", domain.detail);
  else warn("publisher", "Production config", "Custom HTTPS domain", domain.detail, "Publisher: set SITE_URL to the real custom HTTPS domain for launch and AdSense review.");

  const contactEmail = String(process.env.CONTACT_EMAIL || "").trim();
  if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contactEmail) && !/@gmail\.com$/i.test(contactEmail)) {
    pass("publisher", "Production config", "Public contact email", contactEmail);
  } else {
    warn("publisher", "Production config", "Public contact email", contactEmail || "not set", "Publisher: use a domain email alias such as contact@kspotnow.com.");
  }

  const adsense = latestJson(/^adsense-readiness-\d{4}-\d{2}-\d{2}\.json$/);
  if (adsense?.score) {
    const failed = Number(adsense.score.failed || 0);
    const warned = Number(adsense.score.warned || 0);
    const warningItems = Array.isArray(adsense.checks)
      ? adsense.checks.filter((item) => item.status === "warn").map((item) => item.item).join(", ")
      : "";
    if (failed) {
      fail("publisher", "AdSense readiness", "Internal scorecard", `${adsense.score.percent}% with ${failed} fail.`, "Publisher/CEO: clear AdSense readiness failures before applying.");
    } else if (warned) {
      warn(
        "publisher",
        "AdSense readiness",
        "Internal scorecard",
        `${adsense.score.percent}% with 0 fail, ${warned} warn: ${warningItems || "warning items pending"}.`,
        "Publisher/CEO: finish the non-code AdSense launch tasks, especially Search Console verification and real AdSense IDs after Google issues them."
      );
    } else {
      pass("publisher", "AdSense readiness", "Internal scorecard", `${adsense.score.percent}% with 0 fail, 0 warn.`);
    }
  } else {
    warn("publisher", "AdSense readiness", "Internal scorecard", "No latest adsense-readiness JSON found.", "Publisher: run npm.cmd run report:adsense before CEO review.");
  }
}

function roleName(id) {
  return qualitySystem.roles?.find((role) => role.id === id)?.name || id;
}

function statusIcon(status) {
  if (status === "pass") return "PASS";
  if (status === "warn") return "WARN";
  return "FAIL";
}

function decision() {
  const fails = checks.filter((item) => item.status === "fail").length;
  const warns = checks.filter((item) => item.status === "warn").length;
  if (fails) return qualitySystem.releasePolicy?.failDecision || "REWORK_REQUIRED";
  if (warns) return qualitySystem.releasePolicy?.warningDecision || "APPROVED_WITH_CEO_TASKS";
  return qualitySystem.releasePolicy?.passDecision || "APPROVED_FOR_PUBLISH";
}

function ceoTasks() {
  const items = checks
    .filter((item) => item.status !== "pass")
    .map((item, index) => ({
      id: `CEO-${today}-${String(index + 1).padStart(2, "0")}`,
      priority: item.status === "fail" ? "P0" : "P1",
      owner: item.owner,
      area: item.area,
      task: item.task || `${roleName(item.owner)}: review ${item.item}.`,
      evidence: `${item.item}: ${item.detail}`
    }));
  if (!items.some((item) => item.task.includes("official event, brand, or venue images"))) {
    const officialThumbnails = events.filter((event) => String(event.thumbnail || "").includes("/official/")).length;
    if (officialThumbnails < events.length) {
      items.push({
        id: `CEO-${today}-${String(items.length + 1).padStart(2, "0")}`,
        priority: "P2",
        owner: "designer",
        area: "Imagery",
        task: "Designer + Audit Institution: replace generated fallback thumbnails with official event, brand, or venue images as new official pages become available.",
        evidence: `${officialThumbnails}/${events.length} official or collected thumbnails.`
      });
    }
  }
  return items;
}

function writeReports() {
  fs.mkdirSync(feedDir, { recursive: true });
  const result = {
    generatedAt: new Date().toISOString(),
    decision: decision(),
    score: {
      pass: checks.filter((item) => item.status === "pass").length,
      warn: checks.filter((item) => item.status === "warn").length,
      fail: checks.filter((item) => item.status === "fail").length
    },
    benchmarks: qualitySystem.benchmarks || [],
    roles: qualitySystem.roles || [],
    checks,
    ceoTasks: ceoTasks()
  };

  const jsonOut = path.join(feedDir, `ceo-quality-review-${today}.json`);
  const mdOut = path.join(feedDir, `ceo-quality-review-${today}.md`);
  fs.writeFileSync(jsonOut, `${JSON.stringify(result, null, 2)}\n`, "utf8");

  const roleLines = (qualitySystem.roles || [])
    .map((role) => `- ${role.name}: ${role.responsibility}`)
    .join("\n");
  const benchmarkLines = (qualitySystem.benchmarks || [])
    .map((item) => `- ${item.name}: ${item.url} - ${item.standard}`)
    .join("\n");
  const checkRows = checks
    .map((item) => `| ${roleName(item.owner)} | ${item.area} | ${statusIcon(item.status)} | ${item.item} | ${item.detail.replace(/\|/g, "/")} | ${(item.task || "").replace(/\|/g, "/")} |`)
    .join("\n");
  const taskRows = result.ceoTasks.length
    ? result.ceoTasks.map((item) => `| ${item.id} | ${item.priority} | ${roleName(item.owner)} | ${item.area} | ${item.task.replace(/\|/g, "/")} | ${item.evidence.replace(/\|/g, "/")} |`).join("\n")
    : "| - | - | CEO | Release | No new tasks. | All checks passed. |";

  const md = `# CEO Quality Review - ${today}

Decision: **${result.decision}**

Score: ${result.score.pass} pass / ${result.score.warn} warn / ${result.score.fail} fail

## Organization

${roleLines}

## Benchmark Watch

${benchmarkLines}

## Audit Board

| Owner | Area | Status | Check | Evidence | CEO Task |
| --- | --- | --- | --- | --- | --- |
${checkRows}

## CEO Task Dispatch

| Task ID | Priority | Owner | Area | Task | Evidence |
| --- | --- | --- | --- | --- | --- |
${taskRows}

## Release Rule

- Hard fail: ${qualitySystem.releasePolicy?.hardFailRule || "Any fail blocks release."}
- Warning: ${qualitySystem.releasePolicy?.warningRule || "Warnings become CEO tasks."}
`;
  fs.writeFileSync(mdOut, md, "utf8");

  console.table([
    { decision: result.decision, pass: result.score.pass, warn: result.score.warn, fail: result.score.fail, tasks: result.ceoTasks.length }
  ]);
  console.log(`CEO quality review saved: ${path.relative(root, mdOut)}`);
  if (result.score.fail) process.exit(1);
}

collectHomeUx();
collectCalendarUx();
collectDetailUx();
collectGuideLocalization();
collectInteractionQuality();
collectContentPlanning();
collectSourceAudit();
collectBenchmarkWatch();
collectPublishing();
writeReports();
