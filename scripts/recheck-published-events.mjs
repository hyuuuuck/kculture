import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { todayString } from "./lib/date.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const today = todayString();
const timeoutMs = Number(process.env.EVENT_RECHECK_TIMEOUT_MS || 12000);
const concurrency = Math.max(1, Number(process.env.EVENT_RECHECK_CONCURRENCY || 5));
const requireAll = !/^(0|false|no)$/i.test(String(process.env.EVENT_RECHECK_REQUIRE_ALL || "1"));
const eventsPath = path.join(root, "data", "events.json");
const feedDir = path.join(root, "data", "feeds");

const events = JSON.parse(await fs.readFile(eventsPath, "utf8"));
const activeEvents = events.filter((event) => String(event.endDate || "") >= today);

function truncate(value, limit = 180) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text.length > limit ? `${text.slice(0, limit - 1)}...` : text;
}

async function fetchWithTimeout(event) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = Date.now();
  try {
    const response = await fetch(event.sourceUrl, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; KSpotNowAudit/1.0; +https://kspotnow.com)",
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "accept-language": "en-US,en;q=0.9,ko;q=0.7"
      }
    });
    const body = await response.text().catch(() => "");
    const ok = response.status >= 200 && response.status < 400 && body.length > 100;
    return {
      slug: event.slug,
      title: event.title?.en || event.slug,
      sourceName: event.sourceName,
      sourceUrl: event.sourceUrl,
      finalUrl: response.url,
      status: response.status,
      ok,
      bytes: body.length,
      durationMs: Date.now() - startedAt,
      snippet: truncate(body.replace(/<[^>]+>/g, " "))
    };
  } catch (error) {
    return {
      slug: event.slug,
      title: event.title?.en || event.slug,
      sourceName: event.sourceName,
      sourceUrl: event.sourceUrl,
      status: "ERROR",
      ok: false,
      bytes: 0,
      durationMs: Date.now() - startedAt,
      error: `${error.name}: ${error.message}`
    };
  } finally {
    clearTimeout(timer);
  }
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

const results = await mapLimit(activeEvents, concurrency, fetchWithTimeout);
const okSlugs = new Set(results.filter((result) => result.ok).map((result) => result.slug));
let updated = 0;
for (const event of events) {
  if (okSlugs.has(event.slug) && event.lastChecked !== today) {
    event.lastChecked = today;
    updated += 1;
  }
}

await fs.writeFile(eventsPath, `${JSON.stringify(events, null, 2)}\n`, "utf8");
await fs.mkdir(feedDir, { recursive: true });

const summary = {
  generatedAt: new Date().toISOString(),
  date: today,
  activeEvents: activeEvents.length,
  ok: results.filter((result) => result.ok).length,
  failed: results.filter((result) => !result.ok).length,
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

const tableRows = results.map((result) => `| ${result.ok ? "OK" : "FAIL"} | ${result.slug} | ${result.status} | ${result.bytes} | ${result.durationMs} | ${result.sourceName} |`);
await fs.writeFile(mdOut, `# Published Event Recheck

Generated: ${summary.generatedAt}

Active live/upcoming events: ${summary.activeEvents}

Confirmed: ${summary.ok}

Failed: ${summary.failed}

Updated lastChecked: ${summary.updated}

| Result | Event | HTTP | Bytes | ms | Source |
| --- | --- | ---: | ---: | ---: | --- |
${tableRows.join("\n")}
`, "utf8");

console.table(results.map((result) => ({
  ok: result.ok,
  status: result.status,
  bytes: result.bytes,
  slug: result.slug
})));
console.log(`Published event recheck: ${summary.ok}/${summary.activeEvents} confirmed; ${summary.updated} lastChecked fields updated.`);
console.log(`Saved recheck evidence: ${jsonOut}`);

if (requireAll && summary.failed > 0) {
  process.exitCode = 1;
}
