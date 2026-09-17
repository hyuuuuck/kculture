const text = value => typeof value === "string" && value.trim().length > 0;
const date = value => /^\d{4}-\d{2}-\d{2}$/.test(value || "") && !Number.isNaN(Date.parse(value));
const firsthand = /\b(?:i|we)\s+(?:visited|attended|bought|tested|tried|stayed|experienced)\b/i;
function sources(items, errors) {
  if (!Array.isArray(items) || !items.length) { errors.push("missing source record"); return; }
  for (const item of items) {
    try { if (new URL(item.url).protocol !== "https:") throw Error(); }
    catch { errors.push("invalid source URL"); }
    if (!text(item.supports || item.note)) errors.push("source claim scope is missing");
  }
}
function narrative(sections, errors) {
  if (!Array.isArray(sections) || !sections.length) { errors.push("missing narrative"); return; }
  for (const section of sections) {
    if (!text(section.heading) || !Array.isArray(section.paragraphs) || !section.paragraphs.length
        || !section.paragraphs.every(text)) errors.push("empty narrative section");
  }
  const paragraphs = sections.flatMap(s => s.paragraphs || []);
  if (new Set(paragraphs).size !== paragraphs.length) errors.push("exact duplicate paragraph");
  if (firsthand.test(paragraphs.join(" "))) errors.push("unverified firsthand claim");
}
// These are data-integrity checks, NOT an originality or AdSense approval score.
export function briefIssues(brief, today) {
  const errors = [];
  if (!brief) return ["missing visitor article"];
  if (!text(brief.question) || !text(brief.answer)) errors.push("missing visitor question or answer");
  if (!date(brief.updatedAt) || brief.updatedAt > today) errors.push("invalid editorial revision date");
  narrative(brief.sections, errors);
  if (!Array.isArray(brief.participation) || !brief.participation.length
      || brief.participation.some(p => !text(p.label) || !text(p.value))) errors.push("missing participation explanation");
  if (!Array.isArray(brief.unresolved) || !brief.unresolved.length || !brief.unresolved.every(text)) errors.push("verification limits are missing");
  sources(brief.sources, errors);
  const registeredSources = new Set((brief.sources || []).map(source => source.url));
  for (const section of brief.sections || []) {
    if (section.sourceUrls !== undefined && (!Array.isArray(section.sourceUrls)
      || section.sourceUrls.some(url => !registeredSources.has(url)))) {
      errors.push("section cites an unregistered source");
    }
  }
  for (const source of brief.sources || []) {
    if (!date(source.checkedAt) || source.checkedAt > today) errors.push("invalid source date");
  }
  if (firsthand.test([brief.answer, ...(brief.unresolved || [])].join(" "))) errors.push("unverified firsthand claim");
  return errors;
}
export function guideIssues(guide, today) {
  const errors = [];
  if (!guide) return ["missing guide"];
  if (!text(guide.quickAnswer) || !text(guide.audience) || !text(guide.method) || !text(guide.reviewedBy)) errors.push("missing answer, audience or method disclosure");
  narrative(guide.sections?.en, errors);
  if (!date(guide.publishedAt) || !date(guide.updatedAt) || guide.publishedAt > guide.updatedAt || guide.updatedAt > today) errors.push("invalid publication history");
  sources(guide.sources, errors);
  const evidence = guide.originalEvidence || {};
  if (!text(evidence.kind) || !text(evidence.method) || !text(evidence.limitations)) errors.push("missing evidence scope or limitations");
  if (!date(evidence.checkedAt) || evidence.checkedAt > today) errors.push("invalid evidence date");
  if (!Array.isArray(evidence.headers) || !evidence.headers.length || !evidence.headers.every(text)
      || !Array.isArray(evidence.rows) || !evidence.rows.length
      || evidence.rows.some(row => !Array.isArray(row) || row.length !== evidence.headers.length || !row.every(text))) errors.push("misaligned or empty evidence table");
  return errors;
}
