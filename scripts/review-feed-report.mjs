import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const feedDir = path.join(root, "data", "feeds");
const today = process.env.SITE_TODAY || new Date().toISOString().slice(0, 10);

async function latestFeedFile() {
  const entries = await fs.readdir(feedDir, { withFileTypes: true }).catch(() => []);
  const feeds = entries
    .filter((entry) => entry.isFile() && /^official-page-candidates-\d{4}-\d{2}-\d{2}\.json$/.test(entry.name))
    .map((entry) => entry.name)
    .sort();
  return feeds.length ? path.join(feedDir, feeds.at(-1)) : null;
}

function actionFor(candidate) {
  if (!candidate.ok) return "Manual browser check";
  if (candidate.type === "curation-queue" || /weverse|artist|company social/i.test(candidate.sourceName)) return "Manual curation only";
  if ((candidate.dateSignals?.length || 0) > 0 && (candidate.keywordHits?.length || 0) > 0) return "Review and draft event";
  if ((candidate.keywordHits?.length || 0) > 0) return "Scan page for hidden dates";
  return "Watch only";
}

function priorityFor(candidate) {
  if (!candidate.ok) return "blocked";
  if (actionFor(candidate) === "Manual curation only") return "manual";
  if ((candidate.dateSignals?.length || 0) >= 3 && (candidate.keywordHits?.length || 0) >= 2) return "high";
  if ((candidate.dateSignals?.length || 0) > 0 || (candidate.keywordHits?.length || 0) > 0) return "medium";
  return "low";
}

function line(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

const feedFile = await latestFeedFile();
if (!feedFile) {
  console.error("No official-page-candidates feed found. Run npm run collect:official first.");
  process.exit(1);
}

const feed = JSON.parse(await fs.readFile(feedFile, "utf8"));
const candidates = feed.candidates || [];
const rows = candidates.map((candidate) => ({
  priority: priorityFor(candidate),
  action: actionFor(candidate),
  source: candidate.sourceName,
  status: candidate.status,
  dates: candidate.dateSignals?.length || 0,
  keywords: candidate.keywordHits?.join(", ") || "-",
  url: candidate.finalUrl || candidate.url,
  error: candidate.error || ""
}));

const counts = rows.reduce((acc, row) => {
  acc[row.priority] = (acc[row.priority] || 0) + 1;
  return acc;
}, {});

const markdown = `# Official Source Review Report

Generated: ${new Date().toISOString()}

Feed: ${path.basename(feedFile)}

## Summary

- High priority: ${counts.high || 0}
- Medium priority: ${counts.medium || 0}
- Manual curation: ${counts.manual || 0}
- Blocked/manual browser checks: ${counts.blocked || 0}
- Low/watch only: ${counts.low || 0}

## Review Queue

${rows.map((row, index) => `### ${index + 1}. ${row.source}

- Priority: ${row.priority}
- Action: ${row.action}
- Status: ${row.status}${row.error ? ` (${row.error})` : ""}
- Date signals: ${row.dates}
- Keywords: ${row.keywords}
- URL: ${row.url}
`).join("\n")}

## Useful Snippets

${candidates.map((candidate) => {
  const snippets = (candidate.snippets || []).slice(0, 3);
  if (!snippets.length) return "";
  return `### ${candidate.sourceName}\n\n${snippets.map((snippet) => `- ${line(snippet)}`).join("\n")}`;
}).filter(Boolean).join("\n\n")}

## Publishing Rule

Do not publish a candidate directly from this report. Open the official source, confirm date range, venue, eligibility, language, and inventory rules, then add an original summary to data/events.json.
`;

await fs.mkdir(feedDir, { recursive: true });
const out = path.join(feedDir, `review-report-${today}.md`);
await fs.writeFile(out, markdown, "utf8");

console.table(rows.map((row) => ({
  priority: row.priority,
  action: row.action,
  source: row.source,
  dates: row.dates,
  status: row.status,
  error: row.error
})));
console.log(`Saved review report: ${out}`);
