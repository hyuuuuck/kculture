import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { todayString } from "./lib/date.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const today = todayString();
const timeoutMs = Number(process.env.EVENT_RECHECK_TIMEOUT_MS || 15000);
const concurrency = Math.max(1, Number(process.env.EVENT_RECHECK_CONCURRENCY || 4));
const requireAll = !/^(0|false|no)$/i.test(String(process.env.EVENT_RECHECK_REQUIRE_ALL || "1"));
const eventsPath = path.join(root, "data", "events.json");
const programPath = path.join(root, "data", "editorial-program.json");
const feedDir = path.join(root, "data", "feeds");

const events = JSON.parse(await fs.readFile(eventsPath, "utf8"));
const program = JSON.parse(await fs.readFile(programPath, "utf8"));
const approvedSlugs = new Set(program.indexableEvents || []);
const activeEvents = events.filter((event) => approvedSlugs.has(event.slug) && String(event.endDate || "") >= today);

function decodeEntities(value) {
  return String(value || "")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number.parseInt(dec, 10)))
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function htmlToText(html) {
  return decodeEntities(String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " "));
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFKC")
    .replace(/[\u2010-\u2015]/g, "-")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function compactText(value) {
  return normalizeText(value).replace(/[^\p{L}\p{N}]+/gu, "");
}

function missingTokens(text, tokens) {
  const normalized = normalizeText(text);
  const compact = compactText(text);
  return (tokens || []).filter((token) => {
    const normalizedToken = normalizeText(token);
    const compactToken = compactText(token);
    return !normalized.includes(normalizedToken) && (!compactToken || !compact.includes(compactToken));
  });
}

function evidenceFor(event) {
  const inherited = Array.isArray(event.audit?.sourceEvidence) ? event.audit.sourceEvidence : [];
  const reviewed = Array.isArray(program.eventReviews?.[event.slug]?.sourceEvidence) ? program.eventReviews[event.slug].sourceEvidence : [];
  const seen = new Set();
  return [...inherited, ...reviewed].filter((item) => {
    const key = `${item.url || ""}|${(item.mustContain || []).join("|")}`;
    if (!item.url || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const fetchCache = new Map();

async function fetchSource(url) {
  if (fetchCache.has(url)) return fetchCache.get(url);
  const promise = (async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const startedAt = Date.now();
    try {
      const response = await fetch(url, {
        redirect: "follow",
        signal: controller.signal,
        headers: {
          "user-agent": "Mozilla/5.0 (compatible; KSpotNowEditorialAudit/2.0; +https://kspotnow.com/editorial-policy/)",
          accept: "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
          "accept-language": "en-US,en;q=0.9,ko;q=0.8"
        }
      });
      const body = await response.text().catch(() => "");
      return {
        status: response.status,
        finalUrl: response.url,
        body,
        text: htmlToText(body),
        bytes: body.length,
        durationMs: Date.now() - startedAt,
        transportOk: response.status >= 200 && response.status < 400 && body.length > 100
      };
    } catch (error) {
      return {
        status: "ERROR",
        body: "",
        text: "",
        bytes: 0,
        durationMs: Date.now() - startedAt,
        transportOk: false,
        error: `${error.name}: ${error.message}`
      };
    } finally {
      clearTimeout(timer);
    }
  })();
  fetchCache.set(url, promise);
  return promise;
}

async function readSnapshot(evidence) {
  if (!evidence.snapshotPath) return null;
  const snapshotFile = path.resolve(root, evidence.snapshotPath);
  if (!snapshotFile.startsWith(root)) throw new Error(`Snapshot escapes project root: ${evidence.snapshotPath}`);
  const text = await fs.readFile(snapshotFile, "utf8");
  return {
    path: evidence.snapshotPath,
    bytes: text.length,
    missingTokens: missingTokens(text, evidence.mustContain || [])
  };
}

async function checkEvidence(evidence) {
  const source = await fetchSource(evidence.url);
  const liveMissingTokens = source.transportOk ? missingTokens(source.text, evidence.mustContain || []) : [...(evidence.mustContain || [])];
  if (source.transportOk && !liveMissingTokens.length) {
    return {
      sourceName: evidence.sourceName || "Official source",
      url: evidence.url,
      finalUrl: source.finalUrl,
      status: source.status,
      bytes: source.bytes,
      durationMs: source.durationMs,
      mode: "live",
      matchedTokens: evidence.mustContain || [],
      missingTokens: [],
      ok: true
    };
  }

  let snapshot = null;
  let snapshotError = "";
  try {
    snapshot = await readSnapshot(evidence);
  } catch (error) {
    snapshotError = error.message;
  }
  if (snapshot && !snapshot.missingTokens.length) {
    return {
      sourceName: evidence.sourceName || "Official source",
      url: evidence.url,
      finalUrl: source.finalUrl,
      status: source.status,
      bytes: source.bytes,
      durationMs: source.durationMs,
      mode: "audited-snapshot",
      snapshotPath: snapshot.path,
      matchedTokens: evidence.mustContain || [],
      missingTokens: [],
      liveMissingTokens,
      ok: true
    };
  }

  return {
    sourceName: evidence.sourceName || "Official source",
    url: evidence.url,
    finalUrl: source.finalUrl,
    status: source.status,
    bytes: source.bytes,
    durationMs: source.durationMs,
    mode: "failed",
    matchedTokens: (evidence.mustContain || []).filter((token) => !liveMissingTokens.includes(token)),
    missingTokens: snapshot?.missingTokens || liveMissingTokens,
    snapshotPath: snapshot?.path,
    snapshotError,
    error: source.error,
    ok: false
  };
}

async function checkEvent(event) {
  const evidence = evidenceFor(event);
  if (!evidence.length) {
    return {
      slug: event.slug,
      title: event.title?.en || event.slug,
      ok: false,
      checks: [],
      error: "No structured source evidence configured."
    };
  }
  const checks = [];
  for (const item of evidence) checks.push(await checkEvidence(item));
  return {
    slug: event.slug,
    title: event.title?.en || event.slug,
    sourceName: event.sourceName,
    ok: checks.every((check) => check.ok),
    liveVerified: checks.length > 0 && checks.every((check) => check.ok && check.mode === "live"),
    checks
  };
}

async function mapLimit(items, limit, worker) {
  const results = new Array(items.length);
  let nextIndex = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await worker(items[index], index);
    }
  });
  await Promise.all(workers);
  return results;
}

const results = await mapLimit(activeEvents, concurrency, checkEvent);
const liveVerifiedSlugs = new Set(results.filter((result) => result.liveVerified).map((result) => result.slug));
let updated = 0;
for (const event of events) {
  if (liveVerifiedSlugs.has(event.slug) && event.lastChecked !== today) {
    event.lastChecked = today;
    updated += 1;
  }
}

await fs.writeFile(eventsPath, `${JSON.stringify(events, null, 2)}\n`, "utf8");
await fs.mkdir(feedDir, { recursive: true });

const summary = {
  generatedAt: new Date().toISOString(),
  date: today,
  approvedActiveEvents: activeEvents.length,
  passed: results.filter((result) => result.liveVerified).length,
  failed: results.filter((result) => !result.liveVerified).length,
  sourceFailures: results.filter((result) => !result.ok).length,
  manualReviewRequired: results.filter((result) => result.ok && !result.liveVerified).length,
  liveChecks: results.flatMap((result) => result.checks).filter((check) => check.mode === "live").length,
  snapshotChecks: results.flatMap((result) => result.checks).filter((check) => check.mode === "audited-snapshot").length,
  updated,
  timeoutMs,
  concurrency,
  results
};

const jsonOut = path.join(feedDir, `published-event-recheck-${today}.json`);
const mdOut = path.join(feedDir, `published-event-recheck-${today}.md`);
const snapshotOut = path.join(root, "data", "published-event-recheck.json");
await fs.writeFile(jsonOut, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
await fs.writeFile(snapshotOut, `${JSON.stringify(summary, null, 2)}\n`, "utf8");

const tableRows = results.map((result) => {
  const modes = result.checks.map((check) => check.mode).join(", ") || "none";
  const missing = result.checks.flatMap((check) => check.missingTokens || []).join("; ") || "-";
  const status = result.liveVerified ? "PASS" : result.ok ? "MANUAL" : "FAIL";
  return `| ${status} | ${result.slug} | ${modes} | ${missing.replaceAll("|", "\\|")} |`;
});
await fs.writeFile(mdOut, `# Published Event Evidence Recheck

Generated: ${summary.generatedAt}

Approved live/upcoming events: ${summary.approvedActiveEvents}

Passed: ${summary.passed}

Failed: ${summary.failed}

Manual review required: ${summary.manualReviewRequired}

Live evidence checks: ${summary.liveChecks}

Audited snapshot fallbacks: ${summary.snapshotChecks}

Updated lastChecked: ${summary.updated}

| Result | Event | Evidence mode | Missing official tokens |
| --- | --- | --- | --- |
${tableRows.join("\n")}
`, "utf8");

console.table(results.map((result) => ({
  fresh: result.liveVerified,
  evidence: result.checks.length,
  live: result.checks.filter((check) => check.mode === "live").length,
  snapshot: result.checks.filter((check) => check.mode === "audited-snapshot").length,
  slug: result.slug
})));
console.log(`Published event evidence recheck: ${summary.passed}/${summary.approvedActiveEvents} passed; ${summary.updated} lastChecked fields updated.`);
if (summary.manualReviewRequired) console.log(`${summary.manualReviewRequired} event(s) require manual live verification because only audited snapshots matched.`);
console.log(`Saved evidence report: ${jsonOut}`);

if (requireAll && summary.failed > 0) process.exitCode = 1;
