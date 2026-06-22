import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const feedDir = path.join(root, "data", "feeds");
const outDir = path.join(root, "data", "review-candidates");
const jsonOut = path.join(outDir, "latest.json");
const mdOut = path.join(outDir, "latest.md");
const maxDrafts = Number.parseInt(process.env.REVIEW_CANDIDATE_LIMIT || "25", 10);

async function latestFile(pattern) {
  const entries = await fs.readdir(feedDir, { withFileTypes: true }).catch(() => []);
  const matches = entries
    .filter((entry) => entry.isFile() && pattern.test(entry.name))
    .map((entry) => entry.name)
    .sort();
  return matches.length ? path.join(feedDir, matches.at(-1)) : null;
}

async function readJson(file, fallback = {}) {
  if (!file) return fallback;
  try {
    return JSON.parse(await fs.readFile(file, "utf8"));
  } catch {
    return fallback;
  }
}

function basename(file) {
  return file ? path.basename(file) : "";
}

function escapeMd(value) {
  return String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/\|/g, "\\|")
    .replace(/\n/g, " ")
    .trim();
}

function localEn(value) {
  if (typeof value === "string") return value.trim();
  return String(value?.en || "").trim();
}

function compact(value, limit = 140) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text.length > limit ? `${text.slice(0, limit - 3)}...` : text;
}

function titleNeedsCleanup(draft) {
  const title = localEn(draft.title);
  const questionMarks = (title.match(/\?/g) || []).length;
  const mojibake = /[�留吏泥쒖꾩뒪뱀]/.test(title);
  return questionMarks >= 2 || mojibake;
}

function cleanDraft(draft) {
  return {
    slug: draft.slug,
    category: draft.category,
    priority: draft.priority,
    startDate: draft.startDate,
    endDate: draft.endDate,
    city: draft.city,
    venue: draft.venue,
    sourceName: draft.sourceName,
    sourceUrl: draft.sourceUrl,
    title: draft.title,
    summary: draft.summary,
    whyGo: draft.whyGo,
    travelTips: draft.travelTips,
    reviewChecklist: draft.reviewChecklist,
    evidence: draft.evidence,
    titleNeedsCleanup: titleNeedsCleanup(draft)
  };
}

const [summaryFile, draftFile, issueFile] = await Promise.all([
  latestFile(/^source-refresh-summary-\d{4}-\d{2}-\d{2}\.json$/),
  latestFile(/^draft-events-\d{4}-\d{2}-\d{2}\.json$/),
  latestFile(/^source-refresh-issue\.md$/)
]);

const summary = await readJson(summaryFile, {});
const draftPayload = await readJson(draftFile, {});
const drafts = Array.isArray(draftPayload.drafts) ? draftPayload.drafts : [];
const topDrafts = drafts.slice(0, Number.isFinite(maxDrafts) && maxDrafts > 0 ? maxDrafts : 25).map(cleanDraft);
const cleanupDrafts = topDrafts.filter((draft) => draft.titleNeedsCleanup);

const payload = {
  generatedAt: new Date().toISOString(),
  policy: "Review candidates are not public content. Open the official source, verify facts, rewrite in original words, then publish through publish:reviewed.",
  files: {
    summary: basename(summaryFile),
    drafts: basename(draftFile),
    issue: basename(issueFile)
  },
  counts: summary.counts || {},
  failedSources: summary.failedSources || [],
  highSignalCandidates: summary.highSignalCandidates || [],
  topDraftSources: summary.topDraftSources || [],
  topDraftCategories: summary.topDraftCategories || [],
  topSkippedReasons: summary.topSkippedReasons || [],
  drafts: topDrafts
};

const md = `# Source Review Candidates

Generated: ${payload.generatedAt}

This PR is an operating queue, not public site content. Do not merge draft text into \`data/events.json\` until an editor verifies the official page, fixes titles, confirms dates and venue, writes original multilingual copy, and passes \`publish:reviewed\`.

## Counts

| Metric | Value |
| --- | ---: |
| Audited sources | ${payload.counts.auditedSources || 0} |
| Audit OK | ${payload.counts.auditOk || 0} |
| Audit failed | ${payload.counts.auditFailed || 0} |
| Candidate checks OK | ${payload.counts.candidateOk || 0} |
| Candidate checks failed | ${payload.counts.candidateFailed || 0} |
| Discovered official links | ${payload.counts.discoveredLinks || 0} |
| Draft candidates | ${payload.counts.draftCandidates || 0} |
| Skipped leads | ${payload.counts.skippedCandidates || 0} |

## Review Gate

1. Open the official source URL.
2. Confirm event identity, date range, time zone, venue, visitor eligibility, ticket/reservation rules, and whether the offer can close early.
3. Fix mojibake or generic titles.
4. Rewrite title, summary, why-go, and travel tips in original visitor-focused words.
5. Translate required public fields before publishing.
6. Save approved items to \`data/feeds/reviewed-events.json\`, then run:

\`\`\`powershell
npm.cmd run publish:reviewed -- --file data/feeds/reviewed-events.json
npm.cmd run publish:reviewed -- --file data/feeds/reviewed-events.json --write
npm.cmd run preflight:launch
\`\`\`

## Title Cleanup Required

${cleanupDrafts.length ? cleanupDrafts.map((draft, index) => `${index + 1}. ${escapeMd(compact(localEn(draft.title), 170))}
   - ${escapeMd(draft.category)} / ${escapeMd(draft.city)} / ${escapeMd(draft.startDate)} to ${escapeMd(draft.endDate)}
   - ${draft.sourceUrl}`).join("\n") : "No top candidates need title cleanup."}

## Top Draft Candidates

${topDrafts.length ? topDrafts.map((draft, index) => `${index + 1}. ${escapeMd(compact(localEn(draft.title), 170))}
   - ${escapeMd(draft.category)} / ${escapeMd(draft.city)} / ${escapeMd(draft.startDate)} to ${escapeMd(draft.endDate)} / priority ${escapeMd(draft.priority)}
   - Source: ${escapeMd(draft.sourceName)}
   - ${draft.sourceUrl}
   - Cleanup needed: ${draft.titleNeedsCleanup ? "yes" : "no"}`).join("\n") : "No draft candidates were generated."}

## Failed Or Blocked Sources

${payload.failedSources.length ? payload.failedSources.map((item) => `- ${escapeMd(item.sourceName)}: ${escapeMd(item.status)}${item.error ? ` (${escapeMd(item.error)})` : ""}`).join("\n") : "- No failed sources."}

## High-Signal Source Pages

${payload.highSignalCandidates.length ? payload.highSignalCandidates.slice(0, 12).map((item, index) => `${index + 1}. ${escapeMd(item.sourceName)} - ${item.links} links, ${item.dates} date signals, ${item.keywords} keywords
   - ${item.url}`).join("\n") : "No high-signal source pages in this run."}
`;

await fs.mkdir(outDir, { recursive: true });
await fs.writeFile(jsonOut, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
await fs.writeFile(mdOut, md, "utf8");

console.table({
  generatedAt: payload.generatedAt,
  stagedDrafts: topDrafts.length,
  cleanupDrafts: cleanupDrafts.length,
  json: path.relative(root, jsonOut),
  md: path.relative(root, mdOut)
});
