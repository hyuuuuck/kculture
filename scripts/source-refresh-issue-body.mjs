import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const feedDir = path.join(root, "data", "feeds");
const outFile = path.join(feedDir, "source-refresh-issue.md");

async function latestFile(pattern) {
  const entries = await fs.readdir(feedDir, { withFileTypes: true }).catch(() => []);
  const matches = entries
    .filter((entry) => entry.isFile() && pattern.test(entry.name))
    .map((entry) => entry.name)
    .sort();
  return matches.length ? path.join(feedDir, matches.at(-1)) : null;
}

async function readJson(file, fallback) {
  if (!file) return fallback;
  return fs.readFile(file, "utf8").then(JSON.parse).catch(() => fallback);
}

function basename(file) {
  return file ? path.basename(file) : "missing";
}

function escapeMd(value) {
  return String(value ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ").trim();
}

function short(value, max = 120) {
  const text = escapeMd(value);
  if (text.length <= max) return text;
  return `${text.slice(0, max - 3).replace(/\s+\S*$/, "").trim()}...`;
}

function hasMojibake(value) {
  return /[\uFFFD\u7aca\u9e1a\u85e5\u8a1d\u74e6\u8fbb\u9035\u7b60\uf908\ucc30\ucc55\ucc3e]|\?{2,}|(?:[?][\u3131-\uD79D])|(?:[\u3131-\uD79D][?])/.test(String(value || ""));
}

function draftTitle(draft) {
  const raw = draft.title?.en || draft.title || draft.slug || "Untitled draft";
  if (!hasMojibake(raw)) return raw;
  return `${draft.sourceName || "Official source"} lead needs manual title check${draft.slug ? ` (${draft.slug})` : ""}`;
}

function mdLink(label, url) {
  try {
    const parsed = new URL(url);
    return `[${escapeMd(label)}](${parsed.toString()})`;
  } catch {
    return escapeMd(label);
  }
}

function table(rows, columns) {
  if (!rows.length) return "No rows.";
  return [
    `| ${columns.map((column) => column.label).join(" | ")} |`,
    `| ${columns.map((column) => column.align === "right" ? "---:" : "---").join(" | ")} |`,
    ...rows.map((row) => `| ${columns.map((column) => escapeMd(column.value(row))).join(" | ")} |`)
  ].join("\n");
}

const summaryFile = await latestFile(/^source-refresh-summary-\d{4}-\d{2}-\d{2}\.json$/);
const draftsFile = await latestFile(/^draft-events-\d{4}-\d{2}-\d{2}\.json$/);
const candidatesFile = await latestFile(/^official-page-candidates-\d{4}-\d{2}-\d{2}\.json$/);
const reviewReportFile = await latestFile(/^review-report-\d{4}-\d{2}-\d{2}\.md$/);
const reviewBoardFile = await latestFile(/^review-board-\d{4}-\d{2}-\d{2}\.html$/);

const summary = await readJson(summaryFile, {});
const draftFeed = await readJson(draftsFile, {});
const candidateFeed = await readJson(candidatesFile, {});
const counts = summary.counts || {};
const drafts = (draftFeed.drafts || [])
  .slice()
  .sort((a, b) => Number(b.priority || 0) - Number(a.priority || 0))
  .slice(0, 15);
const failedSources = (summary.failedSources || []).slice(0, 12);
const highSignalCandidates = (summary.highSignalCandidates || []).slice(0, 12);

const countRows = [
  ["Audited sources", counts.auditedSources],
  ["Audit OK", counts.auditOk],
  ["Audit failed", counts.auditFailed],
  ["Monitor checks", counts.monitorSources],
  ["Discovered official links", counts.discoveredLinks],
  ["Date signals", counts.dateSignals],
  ["Draft candidates", counts.draftCandidates],
  ["Skipped candidate leads", counts.skippedCandidates]
].map(([metric, value]) => ({ metric, value: value ?? 0 }));

const body = `# Official Source Review Queue

Generated: ${escapeMd(summary.generatedAt || new Date().toISOString())}

This issue is automatically updated by the source refresh workflow. Treat it as a private operating inbox for official event, sale, duty-free, OLIVE YOUNG, department-store, and K-pop popup leads. Do not publish anything from this issue until the official page has been opened and rewritten into an original visitor-focused summary.

## Latest Artifacts

- Source summary: \`${basename(summaryFile)}\`
- Candidate feed: \`${basename(candidatesFile)}\`
- Draft feed: \`${basename(draftsFile)}\`
- Review report: \`${basename(reviewReportFile)}\`
- Private review board: \`${basename(reviewBoardFile)}\`

## Counts

${table(countRows, [
  { label: "Metric", value: (row) => row.metric },
  { label: "Value", align: "right", value: (row) => row.value }
])}

## Review Next

1. Download the latest \`official-source-review-...\` artifact from this workflow run.
2. Open the source summary first, then the private review board.
3. For each usable lead, confirm dates, venue, visitor eligibility, reservation rules, and the official source URL.
4. Rewrite the page in original words before adding it to \`data/events.json\`.
5. Run \`npm.cmd run verify\` before deployment.

## Top Draft Candidates

${drafts.length ? drafts.map((draft, index) => `${index + 1}. ${short(draftTitle(draft))}
   - Category: ${escapeMd(draft.category)} / City: ${escapeMd(draft.city)} / Dates: ${escapeMd(draft.startDate)} to ${escapeMd(draft.endDate)} / Priority: ${escapeMd(draft.priority)}
   - Source: ${mdLink(short(draft.sourceName || draft.sourceUrl || "Official source", 90), draft.sourceUrl)}`).join("\n") : "No draft candidates were generated in the latest run."}

## High-Signal Official Pages

${highSignalCandidates.length ? highSignalCandidates.map((item, index) => `${index + 1}. ${escapeMd(item.sourceName)} - ${escapeMd(item.links)} links, ${escapeMd(item.dates)} date signals, ${escapeMd(item.keywords)} keywords
   - ${mdLink(short(item.url, 120), item.url)}`).join("\n") : "No high-signal official pages were found in the latest run."}

## Failed Or Blocked Sources

${failedSources.length ? failedSources.map((item) => `- ${escapeMd(item.sourceName)}: ${escapeMd(item.status)}${item.error ? ` (${escapeMd(item.error)})` : ""}`).join("\n") : "- No failed sources in the latest run."}

## One-Off Monitoring

Use the workflow input \`monitor_urls\` for a same-day official notice, or keep it in the recurring queue:

\`\`\`powershell
npm.cmd run queue:source -- --url "https://official.example/notice" --source "Official artist/company channel" --category kpop --label "Popup notice" --priority 90 --topics "pop-up,merch,reservation"
\`\`\`
`;

await fs.mkdir(feedDir, { recursive: true });
await fs.writeFile(outFile, body, "utf8");
console.log(`Saved source refresh issue body: ${outFile}`);
console.table({
  "draft candidates": drafts.length,
  "high-signal pages": highSignalCandidates.length,
  "failed sources": failedSources.length,
  "candidate feed": candidateFeed?.candidates?.length || 0
});
