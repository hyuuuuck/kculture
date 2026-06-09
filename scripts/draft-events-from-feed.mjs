import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { todayString } from "./lib/date.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const feedDir = path.join(root, "data", "feeds");
const today = todayString();

const events = JSON.parse(await fs.readFile(path.join(root, "data", "events.json"), "utf8"));
const existingSlugs = new Set(events.map((event) => event.slug));
const categories = new Set(["festival", "kpop", "beauty", "duty-free", "department-store", "shopping", "travel-benefits"]);
const existingSourceUrls = new Set(events.map((event) => normalizeUrl(event.sourceUrl)).filter(Boolean));
const draftedSourceUrls = new Set();
const skippedDrafts = [];

async function latestFeedFile() {
  const entries = await fs.readdir(feedDir, { withFileTypes: true }).catch(() => []);
  const feeds = entries
    .filter((entry) => entry.isFile() && /^official-page-candidates-\d{4}-\d{2}-\d{2}\.json$/.test(entry.name))
    .map((entry) => entry.name)
    .sort();
  return feeds.length ? path.join(feedDir, feeds.at(-1)) : null;
}

function cleanText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim();
}

function hasMojibake(value) {
  return /[\uFFFD\u7aca\u9e1a\u85e5\u8a1d\u74e6\u8fbb\u9035\u7b60\uf908\ucc30\ucc55\ucc3e]|\?{4,}|(?:[?][\u3131-\uD79D])|(?:[\u3131-\uD79D][?])/.test(String(value || ""));
}

function mostlyNumericOrPunctuation(value) {
  const text = cleanText(value);
  if (!text) return true;
  const letters = [...text].filter((char) => /[A-Za-z\u3131-\uD79D\u3400-\u9fff]/u.test(char)).length;
  return letters < Math.max(3, Math.floor(text.length * 0.16));
}

function skipDraft(candidate, reason) {
  skippedDrafts.push({
    reason,
    sourceName: candidate.sourceName,
    leadKind: candidate.leadKind,
    url: candidate.finalUrl || candidate.url,
    pageTitle: shortLabel(candidate.pageTitle || candidate.linkText || "", 140)
  });
  return null;
}

function normalizeUrl(value) {
  try {
    const url = new URL(value);
    url.hash = "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return "";
  }
}

function slugify(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72) || "official-event-candidate";
}

function uniqueSlug(base) {
  let slug = base;
  let suffix = 2;
  while (existingSlugs.has(slug)) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
  existingSlugs.add(slug);
  return slug;
}

function hasAny(text, needles) {
  return needles.some((needle) => text.includes(needle));
}

function normalizedComparableText(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/[\u2010-\u2015\u2212\uFE58\uFE63\uFF0D~\uFF5E]+/g, "-")
    .replace(/\s+/g, " ");
}

function inferCategory(candidate) {
  if (candidate.leadKind !== "discovered-link" && categories.has(candidate.queueCategory)) return candidate.queueCategory;
  const keywordText = candidate.leadKind === "discovered-link" ? "" : (candidate.keywordHits || []).join(" ");
  const text = `${candidate.sourceName} ${keywordText} ${candidate.pageTitle || ""} ${candidate.linkText || ""}`.toLowerCase();
  if (hasAny(text, ["olive young", "beauty", "cosmetic"])) return "beauty";
  if (hasAny(text, ["duty free", "dfs", "?띸쮱"])) return "duty-free";
  if (hasAny(text, ["weverse", "k-pop", "kpop", "idol", "fan meeting", "fanmeeting", "fan concert", "fan-con", "fancon", "birthday cafe", "bts", "carat", "ateez", "seventeen", "svt", "enhypen", "nct", "boynextdoor", "tws", "day6", "meovv", "le sserafim", "lesserafim", "hyeri"])) return "kpop";
  if (hasAny(text, ["visit seoul", "busan metropolitan"]) && hasAny(text, ["events", "exhibitions", "festival", "traditional experience", "light show", "drone show"])) return "festival";
  if (hasAny(text, ["ticket", "yes24", "melon ticket", "concert", "live concert", "tour", "music", "festival", "culture", "mcst", "seoul metropolitan", "exhibition", "museum", "gallery", "musical", "theater", "theatre", "dance", "performance", "rock", "waterbomb"])) return "festival";
  if (hasAny(text, ["department store", "the hyundai", "hyundai department", "shinsegae department", "shinsegae group", "lotte department", "popup zone", "pop-up zone", "pop-up store"])) return "department-store";
  if (hasAny(text, ["benefit", "travel", "tourism", "korea grand sale"])) return "travel-benefits";
  return "shopping";
}

function thumbnailFor(category) {
  return {
    beauty: "assets/thumb-beauty.jpg",
    "duty-free": "assets/thumb-dutyfree.jpg",
    "department-store": "assets/thumb-shopping.jpg",
    kpop: "assets/thumb-kpop.jpg",
    festival: "assets/thumb-festival.jpg",
    shopping: "assets/thumb-shopping.jpg",
    "travel-benefits": "assets/thumb-travel.jpg"
  }[category] || "assets/thumb-travel.jpg";
}

function inferRegion(candidate) {
  const titleText = `${candidate.pageTitle || ""} ${candidate.linkText || ""}`.toLowerCase();
  const fullText = `${titleText} ${candidate.sourceName} ${(candidate.snippets || []).join(" ")}`.toLowerCase();
  const regionRules = [
    { city: "Busan", weatherRegion: "Busan", needles: ["busan", "haeundae", "gwangalli", "centum", "dadaepo"] },
    { city: "Seoul", weatherRegion: "Seoul", needles: ["seoul", "myeongdong", "yongsan", "gangnam", "hongdae", "hongik", "seongsu", "ddp", "coex", "jamsil"] },
    { city: "Incheon", weatherRegion: "Nationwide", needles: ["incheon", "songdo"] },
    { city: "Goyang", weatherRegion: "Nationwide", needles: ["goyang"] },
    { city: "Daegu", weatherRegion: "Nationwide", needles: ["daegu"] },
    { city: "Jeju", weatherRegion: "Nationwide", needles: ["jeju"] },
    { city: "Gwangju", weatherRegion: "Nationwide", needles: ["gwangju"] },
    { city: "Daejeon", weatherRegion: "Nationwide", needles: ["daejeon"] },
    { city: "Jeonju", weatherRegion: "Nationwide", needles: ["jeonju"] },
    { city: "Gyeongju", weatherRegion: "Nationwide", needles: ["gyeongju"] }
  ];
  for (const corpus of [titleText, fullText]) {
    for (const rule of regionRules) {
      if (hasAny(corpus, rule.needles)) return { city: rule.city, weatherRegion: rule.weatherRegion };
    }
  }
  return { city: "Nationwide", weatherRegion: "Nationwide" };
}

function addDays(dateString, days) {
  const date = new Date(`${dateString}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function dateRange(candidate) {
  const earliest = addDays(today, -365);
  const latest = addDays(today, 365);
  const signals = candidateDateSignals(candidate);
  const dates = signals
    .map((signal) => signal.date)
    .filter(Boolean)
    .filter((date) => date >= earliest && date <= latest)
    .sort();
  if (!dates.length) return null;
  if (dates.at(-1) < today) return null;
  return {
    startDate: dates[0],
    endDate: dates.at(-1),
    dateLabel: `Current-window candidate dates detected on official page: ${[...new Set(dates)].slice(0, 6).join(", ")}`
  };
}

function candidateDateSignals(candidate) {
  const signals = candidate.dateSignals || [];
  if (candidate.leadKind !== "discovered-link") return signals;
  const exactTitleSignals = dateSignalsFromTitle(candidate);
  if (exactTitleSignals.length) return exactTitleSignals;
  const titleText = normalizedComparableText(`${candidate.pageTitle || ""} ${candidate.linkText || ""}`);
  const titleSignals = signals.filter((signal) => {
    const raw = normalizedComparableText(signal.raw || "");
    return raw && titleText.includes(raw);
  });
  return titleSignals;
}

function validDate(year, month, day) {
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (Number.isNaN(date.getTime())) return "";
  if (date.getUTCFullYear() !== Number(year) || date.getUTCMonth() !== Number(month) - 1 || date.getUTCDate() !== Number(day)) return "";
  return date.toISOString().slice(0, 10);
}

function dateSignalsFromTitle(candidate) {
  const text = cleanText(`${candidate.pageTitle || ""} ${candidate.linkText || ""}`);
  const signals = [];
  for (const match of text.matchAll(/\b(20\d{2})[-./](\d{1,2})[-./](\d{1,2})\b/g)) {
    const date = validDate(match[1], match[2], match[3]);
    if (date) signals.push({ date, raw: match[0] });
  }
  const months = {
    jan: "01", january: "01",
    feb: "02", february: "02",
    mar: "03", march: "03",
    apr: "04", april: "04",
    may: "05",
    jun: "06", june: "06",
    jul: "07", july: "07",
    aug: "08", august: "08",
    sep: "09", sept: "09", september: "09",
    oct: "10", october: "10",
    nov: "11", november: "11",
    dec: "12", december: "12"
  };
  for (const match of text.matchAll(/\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\.?\s+(\d{1,2}),?\s+(20\d{2})\b/gi)) {
    const date = validDate(match[3], months[match[1].toLowerCase().replace(/\.$/, "")], match[2]);
    if (date) signals.push({ date, raw: match[0] });
  }
  return [...new Map(signals.map((signal) => [signal.date, signal])).values()];
}

function draftPriority(candidate, category) {
  const dateScore = Math.min(candidate.dateSignals?.length || 0, 8);
  const keywordScore = Math.min(candidate.keywordHits?.length || 0, 8);
  const categoryBoost = ["kpop", "beauty", "duty-free", "department-store"].includes(category) ? 5 : 0;
  const linkBoost = Math.min(Math.floor((candidate.linkScore || 0) / 2), 12);
  const detected = 70 + dateScore + keywordScore + categoryBoost + linkBoost;
  return Number.isFinite(candidate.queuePriority) ? Math.max(detected, candidate.queuePriority) : detected;
}

function titleFor(candidate) {
  const source = cleanText(candidate.sourceName);
  if (candidate.leadKind === "discovered-link") {
    const linkTitle = shortLabel(candidate.pageTitle || candidate.linkText, 110);
    if (linkTitle) return `${source}: ${linkTitle}`;
  }
  const queueLabel = cleanText(candidate.queueLabel);
  if (queueLabel) return `${source}: ${queueLabel}`;
  const pageTitle = cleanText(candidate.pageTitle).replace(/\s*[-|]\s*K-Spot Now$/i, "");
  if (pageTitle && pageTitle.toLowerCase() !== source.toLowerCase()) return `${source}: ${pageTitle}`;
  return `${source} official event candidate`;
}

function textQuality(candidate, title) {
  const fields = [
    title,
    candidate.pageTitle,
    candidate.linkText,
    ...(candidate.snippets || []).slice(0, 2)
  ].filter(Boolean);
  if (fields.some(hasMojibake)) return "mojibake text detected";
  if (mostlyNumericOrPunctuation(title)) return "title is too generic or numeric";
  const titleText = normalizedComparableText(title);
  const plainTitleText = titleText.replace(/[^a-z0-9\u3131-\uD79D]+/gu, " ").replace(/\s+/g, " ").trim();
  const url = normalizedComparableText(candidate.finalUrl || candidate.url || "");
  const queueLabel = normalizedComparableText(candidate.queueLabel || "");
  if (hasAny(titleText, ["top picks", "all products", "ticket watch", "reservation root", "official social intake"])) {
    return "listing page is not a specific event";
  }
  if (hasAny(titleText, [
    "visitkorea imagine your korea",
    "event calendar coex",
    "coex event calendar",
    "welcome to the website of",
    "the official website of",
    "monthly event calendar november 2024",
    "culture calendar seoul metropolitan government"
  ])) {
    return "listing page is not a specific event";
  }
  if (hasAny(plainTitleText, [
    "visitkorea visitkorea imagine your korea",
    "monthly event calendar november 2024",
    "seoul metropolitan government monthly event calendar"
  ])) {
    return "listing page is not a specific event";
  }
  if (titleOnlyHasPastYears(title)) return "older-year page is not a current specific event";
  if (url.includes("/categories/all/products")) return "listing page is not a specific event";
  if (/\/regions\/[^/]+\/festas\/?$/.test(url)) return "listing page is not a specific event";
  if (hasAny(titleText, ["k-pop pop-ups festivals nol world", "k-pop - pop-ups - festivals nol world"])) {
    return "listing page is not a specific event";
  }
  if (candidate.leadKind === "source-page" && hasAny(queueLabel, ["watch", "root", "intake"])) {
    return "curation root is not a specific event";
  }
  return "";
}

function titleOnlyHasPastYears(value) {
  const currentYear = Number(today.slice(0, 4));
  const years = [...String(value || "").matchAll(/\b(20\d{2})\b/g)].map((match) => Number(match[1]));
  return years.length > 0 && years.every((year) => year < currentYear);
}

function shortLabel(value, max = 120) {
  const text = cleanText(value);
  if (text.length <= max) return text;
  return `${text.slice(0, max - 3).replace(/\s+\S*$/, "").trim()}...`;
}

function expandCandidate(candidate) {
  const base = [{ ...candidate, leadKind: "source-page" }];
  const links = (candidate.discoveredLinks || []).map((link) => ({
    ...candidate,
    leadKind: "discovered-link",
    sourcePageUrl: candidate.finalUrl || candidate.url,
    finalUrl: link.url,
    url: link.url,
    pageTitle: link.text || candidate.pageTitle,
    linkText: link.text,
    linkScore: link.score,
    linkReason: link.reason,
    keywordHits: [...new Set([...(candidate.keywordHits || []), ...(link.keywordHits || [])])],
    dateSignals: link.dateSignals || [],
    snippets: [link.context, ...(candidate.snippets || [])].filter(Boolean).slice(0, 4)
  }));
  return base.concat(links);
}

function draftFor(candidate) {
  const dates = dateRange(candidate);
  if (!candidate.ok) return skipDraft(candidate, "source fetch did not succeed");
  if (!dates) return skipDraft(candidate, "no current or upcoming date range");

  const category = inferCategory(candidate);
  const region = inferRegion(candidate);
  const title = titleFor(candidate);
  const qualityIssue = textQuality(candidate, title);
  if (qualityIssue) return skipDraft(candidate, qualityIssue);
  const slug = uniqueSlug(`${slugify(title)}-${dates.startDate.slice(0, 7)}`);
  const sourceUrl = candidate.finalUrl || candidate.url;
  const normalizedSourceUrl = normalizeUrl(sourceUrl);
  if (existingSourceUrls.has(normalizedSourceUrl)) return skipDraft(candidate, "already published source URL");
  if (draftedSourceUrls.has(normalizedSourceUrl)) return skipDraft(candidate, "duplicate draft source URL");
  draftedSourceUrls.add(normalizedSourceUrl);
  const keywordText = (candidate.keywordHits || []).slice(0, 6).join(", ") || "official listing";

  return {
    slug,
    category,
    priority: draftPriority(candidate, category),
    startDate: dates.startDate,
    endDate: dates.endDate,
    dateLabel: dates.dateLabel,
    city: region.city,
    district: "Needs editor review",
    venue: candidate.sourceName,
    sourceName: candidate.sourceName,
    sourceUrl,
    lastChecked: today,
    collectionMode: candidate.type,
    verification: "draft-needs-review",
    thumbnail: thumbnailFor(category),
    title: {
      en: title
    },
    summary: {
      en: `Official-source draft candidate detected from ${candidate.sourceName}. Review the page for exact title, venue, dates, eligibility, and visitor value before publishing.`
    },
    whyGo: {
      en: `Potential ${category.replace("-", " ")} page for foreign visitors searching current Korea information. Detected signals: ${keywordText}.`
    },
    travelTips: [
      "Open the official source and confirm that the date range is current before publishing.",
      "Check eligibility, reservation flow, stock, ticketing, branch restrictions, and tax refund rules where relevant.",
      "Rewrite the summary in original words and keep the official source link on the public page."
    ],
    weatherRegion: region.weatherRegion,
    needsReview: true,
    reviewChecklist: [
      "Confirm exact event or offer title.",
      "Confirm start date, end date, time zone, and whether the offer can end early.",
      "Confirm city, venue, branch, reservation URL, visitor eligibility, and inventory or ticket rules.",
      "Replace this draft summary with an original multilingual visitor summary before publishing.",
      "Translate title, summary, and whyGo into English, Spanish, Chinese, Portuguese, and Russian.",
      "Use only owned or generated thumbnails unless the official page explicitly permits reuse."
    ],
    evidence: {
      leadKind: candidate.leadKind,
      pageTitle: cleanText(candidate.pageTitle),
      checkedAt: candidate.checkedAt,
      keywordHits: candidate.keywordHits || [],
      dateSignals: candidate.dateSignals || [],
      snippets: (candidate.snippets || []).slice(0, 3).map(cleanText),
      discoveredFrom: candidate.sourcePageUrl,
      linkText: candidate.linkText,
      linkScore: candidate.linkScore,
      linkReason: candidate.linkReason,
      queueId: candidate.queueId,
      queueLabel: candidate.queueLabel,
      artistOrBrand: candidate.artistOrBrand,
      reviewNotes: candidate.reviewNotes
    }
  };
}

const feedFile = await latestFeedFile();
if (!feedFile) {
  console.error("No official-page-candidates feed found. Run npm run collect:official first.");
  process.exit(1);
}

const feed = JSON.parse(await fs.readFile(feedFile, "utf8"));
const drafts = (feed.candidates || [])
  .flatMap(expandCandidate)
  .map(draftFor)
  .filter(Boolean)
  .sort((a, b) => b.priority - a.priority || a.startDate.localeCompare(b.startDate));

const payload = {
  generatedAt: new Date().toISOString(),
  sourceFeed: path.basename(feedFile),
  policy: "Drafts are not public content. Review and rewrite before copying selected items into data/events.json.",
  count: drafts.length,
  skippedCount: skippedDrafts.length,
  skipped: skippedDrafts,
  drafts
};

const jsonOut = path.join(feedDir, `draft-events-${today}.json`);
const mdOut = path.join(feedDir, `draft-events-${today}.md`);
await fs.mkdir(feedDir, { recursive: true });
await fs.writeFile(jsonOut, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

const markdown = `# Draft Event Candidates

Generated: ${payload.generatedAt}

Source feed: ${payload.sourceFeed}

These drafts are not public content. Verify the official page, rewrite the summary, and then copy approved items into \`data/events.json\`.

## Skipped Candidates

Skipped: ${skippedDrafts.length}

${skippedDrafts.slice(0, 40).map((item, index) => `- ${index + 1}. ${item.reason} | ${item.sourceName} | ${item.pageTitle || item.url}`).join("\n") || "- None"}

${drafts.map((draft, index) => `## ${index + 1}. ${draft.title.en}

- Slug: ${draft.slug}
- Category: ${draft.category}
- Priority: ${draft.priority}
- Dates: ${draft.startDate} to ${draft.endDate}
- City: ${draft.city}
- Source: ${draft.sourceName}
- URL: ${draft.sourceUrl}
- Checklist: ${draft.reviewChecklist.join(" ")}
`).join("\n")}
`;

await fs.writeFile(mdOut, markdown, "utf8");

console.table(drafts.map((draft) => ({
  priority: draft.priority,
  category: draft.category,
  start: draft.startDate,
  end: draft.endDate,
  source: draft.sourceName,
  slug: draft.slug
})));
console.log(`Skipped draft candidates: ${skippedDrafts.length}`);
console.log(`Saved draft events: ${jsonOut}`);
console.log(`Saved draft report: ${mdOut}`);
