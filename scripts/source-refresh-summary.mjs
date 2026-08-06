import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { todayString } from "./lib/date.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const feedDir = path.join(root, "data", "feeds");
const today = todayString();

async function latestFile(pattern) {
  const entries = await fs.readdir(feedDir, { withFileTypes: true }).catch(() => []);
  const matches = entries
    .filter((entry) => entry.isFile() && pattern.test(entry.name))
    .map((entry) => entry.name)
    .sort();
  return matches.length ? path.join(feedDir, matches.at(-1)) : null;
}

async function readJson(file) {
  if (!file) return null;
  return fs.readFile(file, "utf8").then(JSON.parse).catch(() => null);
}

function basename(file) {
  return file ? path.basename(file) : "missing";
}

function countBy(items, keyFn) {
  const counts = new Map();
  for (const item of items) {
    const key = keyFn(item) || "unknown";
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([key, count]) => ({ key, count }));
}

function top(items, limit = 6) {
  return items.slice(0, limit);
}

function mdTable(rows) {
  if (!rows.length) return "No rows.";
  return [
    "| Item | Count |",
    "| --- | ---: |",
    ...rows.map((row) => `| ${escapeMd(row.key)} | ${row.count} |`)
  ].join("\n");
}

function escapeMd(value) {
  return String(value ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function candidatePriority(candidate) {
  const linkCount = candidate.discoveredLinks?.length || 0;
  const dateCount = candidate.dateSignals?.length || 0;
  const keywordCount = candidate.keywordHits?.length || 0;
  const topScore = Math.max(0, ...(candidate.discoveredLinks || []).map((link) => Number(link.score) || 0));
  return linkCount * 3 + dateCount * 2 + keywordCount + topScore;
}

const auditFile = await latestFile(/^source-audit-\d{4}-\d{2}-\d{2}\.json$/);
const candidatesFile = await latestFile(/^official-page-candidates-\d{4}-\d{2}-\d{2}\.json$/);
const draftsFile = await latestFile(/^draft-events-\d{4}-\d{2}-\d{2}\.json$/);
const reviewReportFile = await latestFile(/^review-report-\d{4}-\d{2}-\d{2}\.md$/);
const reviewBoardFile = await latestFile(/^review-board-\d{4}-\d{2}-\d{2}\.html$/);
const publicDataFile = await latestFile(/^public-data-import-\d{4}-\d{2}-\d{2}\.json$/);
const tourApiFile = await latestFile(/^tourapi-\d{8}\.json$/);
const kmaObservationFile = await latestFile(/^weather-previous-year-\d{4}-\d{2}-\d{2}\.json$/);
const seoulEventsFile = await latestFile(/^seoul-cultural-events-\d{4}-\d{2}-\d{2}\.json$/);

const [audit, candidateFeed, draftFeed, publicData, tourApi, kmaObservations, seoulEvents] = await Promise.all([
  readJson(auditFile),
  readJson(candidatesFile),
  readJson(draftsFile),
  readJson(publicDataFile),
  readJson(tourApiFile),
  readJson(kmaObservationFile),
  readJson(seoulEventsFile)
]);

const auditResults = audit?.results || [];
const candidates = candidateFeed?.candidates || [];
const drafts = draftFeed?.drafts || [];
const skipped = draftFeed?.skipped || [];
const failedSources = [
  ...(candidateFeed?.summary?.failedSources || []),
  ...auditResults.filter((item) => !item.ok).map((item) => ({
    sourceName: item.name,
    status: item.status,
    error: item.error
  }))
];
const uniqueFailedSources = [...new Map(failedSources.map((item) => [item.sourceName, item])).values()];
const fallbackSources = auditResults.filter((item) => item.fallbackUsed);
const highSignalCandidates = candidates
  .filter((candidate) => candidate.ok)
  .map((candidate) => ({
    sourceName: candidate.sourceName,
    url: candidate.finalUrl || candidate.url,
    links: candidate.discoveredLinks?.length || 0,
    dates: candidate.dateSignals?.length || 0,
    keywords: candidate.keywordHits?.length || 0,
    score: candidatePriority(candidate)
  }))
  .sort((a, b) => b.score - a.score || b.links - a.links || a.sourceName.localeCompare(b.sourceName));

const summary = {
  generatedAt: new Date().toISOString(),
  files: {
    audit: basename(auditFile),
    candidates: basename(candidatesFile),
    drafts: basename(draftsFile),
    reviewReport: basename(reviewReportFile),
    reviewBoard: basename(reviewBoardFile),
    publicData: basename(publicDataFile),
    tourApi: basename(tourApiFile),
    kmaObservations: basename(kmaObservationFile),
    seoulEvents: basename(seoulEventsFile)
  },
  counts: {
    auditedSources: audit?.count || auditResults.length,
    auditOk: auditResults.filter((item) => item.ok).length,
    auditFailed: auditResults.filter((item) => !item.ok).length,
    fallbackSources: fallbackSources.length,
    monitorSources: candidateFeed?.summary?.monitorSourceCount || candidates.length,
    candidateOk: candidateFeed?.summary?.okCount || candidates.filter((item) => item.ok).length,
    candidateFailed: candidateFeed?.summary?.failedCount || candidates.filter((item) => !item.ok).length,
    discoveredLinks: candidateFeed?.summary?.totalDiscoveredLinks || candidates.reduce((sum, item) => sum + (item.discoveredLinks?.length || 0), 0),
    dateSignals: candidateFeed?.summary?.totalDateSignals || candidates.reduce((sum, item) => sum + (item.dateSignals?.length || 0), 0),
    draftCandidates: draftFeed?.count || drafts.length,
    skippedCandidates: draftFeed?.skippedCount || skipped.length,
    publicDataPassed: publicData?.passed || 0,
    publicDataFailed: publicData?.failed || 0,
    publicDataSkipped: publicData?.skipped || 0,
    tourApiRows: Array.isArray(tourApi) ? tourApi.length : 0,
    kmaObservationRecords: kmaObservations?.items?.filter((item) => item.ok)?.length || 0,
    seoulEventRows: seoulEvents?.count || 0,
    seoulPotentialMatches: seoulEvents?.matchedCount || 0
  },
  failedSources: uniqueFailedSources,
  topDraftSources: top(countBy(drafts, (draft) => draft.sourceName)),
  topDraftCategories: top(countBy(drafts, (draft) => draft.category)),
  topSkippedReasons: top(countBy(skipped, (item) => item.reason)),
  highSignalCandidates: top(highSignalCandidates, 8)
};

const markdown = `# Source Refresh Operating Summary

Generated: ${summary.generatedAt}

## Files

- Source audit: \`${summary.files.audit}\`
- Official candidates: \`${summary.files.candidates}\`
- Draft candidates: \`${summary.files.drafts}\`
- Review report: \`${summary.files.reviewReport}\`
- Private review board: \`${summary.files.reviewBoard}\`
- Public-data run: \`${summary.files.publicData}\`
- KTO review feed: \`${summary.files.tourApi}\`
- KMA observation feed: \`${summary.files.kmaObservations}\`
- Seoul review feed: \`${summary.files.seoulEvents}\`

## Counts

| Metric | Value |
| --- | ---: |
| Audited sources | ${summary.counts.auditedSources} |
| Audit OK | ${summary.counts.auditOk} |
| Audit failed | ${summary.counts.auditFailed} |
| Sources using fallback URL | ${summary.counts.fallbackSources} |
| Monitor source checks | ${summary.counts.monitorSources} |
| Candidate checks OK | ${summary.counts.candidateOk} |
| Candidate checks failed | ${summary.counts.candidateFailed} |
| Discovered official links | ${summary.counts.discoveredLinks} |
| Date signals | ${summary.counts.dateSignals} |
| Draft candidates for review | ${summary.counts.draftCandidates} |
| Skipped candidate leads | ${summary.counts.skippedCandidates} |
| Public-data imports passed | ${summary.counts.publicDataPassed} |
| Public-data imports failed | ${summary.counts.publicDataFailed} |
| Public-data imports skipped | ${summary.counts.publicDataSkipped} |
| KTO TourAPI review rows | ${summary.counts.tourApiRows} |
| KMA approved-event observations | ${summary.counts.kmaObservationRecords} |
| Seoul review rows | ${summary.counts.seoulEventRows} |
| Seoul potential matches | ${summary.counts.seoulPotentialMatches} |

## Attention

${summary.failedSources.length ? summary.failedSources.map((item) => `- ${escapeMd(item.sourceName)}: ${escapeMd(item.status)}${item.error ? ` (${escapeMd(item.error)})` : ""}`).join("\n") : "- No failed sources in the latest run."}

## Top Draft Sources

${mdTable(summary.topDraftSources)}

## Top Draft Categories

${mdTable(summary.topDraftCategories)}

## Top Skipped Reasons

${mdTable(summary.topSkippedReasons)}

## High-Signal Candidate Pages

${summary.highSignalCandidates.length ? summary.highSignalCandidates.map((item, index) => `${index + 1}. ${escapeMd(item.sourceName)} - ${item.links} links, ${item.dates} date signals, ${item.keywords} keywords\n   - ${item.url}`).join("\n") : "No high-signal candidate pages in the latest run."}

## Publishing Rule

Do not publish directly from this summary. Open the official source, confirm date range, venue, visitor eligibility, inventory or reservation rules, then publish an original visitor-focused summary.
`;

await fs.mkdir(feedDir, { recursive: true });
const jsonOut = path.join(feedDir, `source-refresh-summary-${today}.json`);
const mdOut = path.join(feedDir, `source-refresh-summary-${today}.md`);
const snapshotOut = path.join(root, "data", "source-refresh-summary.json");
await fs.writeFile(jsonOut, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
await fs.writeFile(mdOut, markdown, "utf8");
await fs.writeFile(snapshotOut, `${JSON.stringify(summary, null, 2)}\n`, "utf8");

if (process.env.GITHUB_STEP_SUMMARY) {
  await fs.appendFile(process.env.GITHUB_STEP_SUMMARY, `\n${markdown}\n`, "utf8");
}

console.table(summary.counts);
console.log(`Saved source refresh summary: ${mdOut}`);
console.log(`Saved deployable source refresh snapshot: ${snapshotOut}`);
