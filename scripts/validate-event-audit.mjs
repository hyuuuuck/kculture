import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { todayString } from "./lib/date.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const today = todayString();
const events = JSON.parse(await fs.readFile(path.join(root, "data", "events.json"), "utf8"));
const feedDir = path.join(root, "data", "feeds");
const timeoutMs = Number(process.env.EVENT_AUDIT_TIMEOUT_MS || 12000);
const offline = process.env.EVENT_AUDIT_OFFLINE === "1";
const userAgent = process.env.EVENT_AUDIT_USER_AGENT || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 KoreaNowGuide/0.1 event-audit";

const errors = [];
const warnings = [];
const sourceCache = new Map();
const sourceResults = [];

function push(list, id, message) {
  list.push({ id, message });
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

function eventAuditText(event) {
  const localizedValues = (field) => {
    const value = event[field];
    if (typeof value === "string") return [value];
    if (!value || typeof value !== "object") return [];
    return Object.values(value);
  };

  return [
    event.slug,
    event.eventKind,
    event.category,
    event.startDate,
    event.endDate,
    event.dateLabel,
    event.city,
    event.district,
    event.venue,
    event.sourceName,
    event.sourceUrl,
    ...localizedValues("title"),
    ...localizedValues("summary"),
    ...localizedValues("whyGo"),
    ...(event.travelTips || [])
  ].filter(Boolean).join(" ");
}

function assertEqual(id, field, actual, expected) {
  if (expected !== undefined && actual !== expected) {
    push(errors, id, `${field} is ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}.`);
  }
}

function assertContains(id, haystack, token, context) {
  if (!normalizeText(haystack).includes(normalizeText(token))) {
    push(errors, id, `${context} is missing required evidence token: ${token}`);
  }
}

function checkLocalAudit(event) {
  const id = event.slug;
  const audit = event.audit;
  assertEqual(id, "eventKind", event.eventKind, audit.expectedEventKind);
  assertEqual(id, "startDate", event.startDate, audit.expectedStartDate);
  assertEqual(id, "endDate", event.endDate, audit.expectedEndDate);
  assertEqual(id, "sourceName", event.sourceName, audit.expectedSourceName);
  assertEqual(id, "sourceUrl", event.sourceUrl, audit.expectedSourceUrl);

  for (const blocked of audit.forbiddenDateRanges || []) {
    if (event.startDate === blocked.startDate && event.endDate === blocked.endDate) {
      push(errors, id, `forbidden date range ${blocked.startDate} - ${blocked.endDate}: ${blocked.reason || "date range belongs to a different event type"}`);
    }
  }

  const localText = eventAuditText(event);
  for (const token of audit.localMustContain || []) {
    assertContains(id, localText, token, "local audited event data");
  }
}

async function fetchSource(url) {
  if (sourceCache.has(url)) return sourceCache.get(url);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const result = { url, ok: false, status: "ERR", text: "", error: "" };

  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "accept-language": "en-US,en;q=0.9,ko;q=0.8",
        "user-agent": userAgent
      }
    });
    result.status = response.status;
    result.finalUrl = response.url;
    result.ok = response.ok;
    result.text = htmlToText(await response.text());
  } catch (error) {
    result.error = error.name === "AbortError" ? "timeout" : error.message;
  } finally {
    clearTimeout(timer);
  }

  sourceCache.set(url, result);
  sourceResults.push({
    url,
    finalUrl: result.finalUrl || url,
    ok: result.ok,
    status: result.status,
    error: result.error
  });
  return result;
}

async function checkSourceEvidence(event) {
  const id = event.slug;
  for (const evidence of event.audit.sourceEvidence || []) {
    if (!evidence.url) {
      push(errors, id, "sourceEvidence.url is required.");
      continue;
    }

    if (offline) {
      push(warnings, id, `skipped online source evidence because EVENT_AUDIT_OFFLINE=1: ${evidence.url}`);
      continue;
    }

    const source = await fetchSource(evidence.url);
    if (!source.ok) {
      const allowedBlockedStatuses = (evidence.allowBlockedStatuses || []).map(Number);
      if (allowedBlockedStatuses.includes(Number(source.status)) && evidence.blockedReason) {
        push(warnings, id, `official evidence source returned allowed blocked status ${source.status}: ${evidence.url} (${evidence.blockedReason})`);
        continue;
      }
      if (evidence.snapshotPath) {
        const snapshotFile = path.resolve(root, evidence.snapshotPath);
        if (!snapshotFile.startsWith(root)) {
          push(errors, id, `sourceEvidence.snapshotPath escapes project root: ${evidence.snapshotPath}`);
          continue;
        }
        try {
          const snapshotText = await fs.readFile(snapshotFile, "utf8");
          for (const token of evidence.mustContain || []) {
            assertContains(id, snapshotText, token, `${evidence.sourceName || evidence.url} audited snapshot`);
          }
          push(warnings, id, `official evidence source failed live fetch; used audited snapshot ${evidence.snapshotPath}: ${evidence.url} (${source.status}${source.error ? ` ${source.error}` : ""})`);
          continue;
        } catch (error) {
          push(errors, id, `official evidence source failed and snapshot could not be read: ${evidence.url} (${evidence.snapshotPath}; ${error.message})`);
          continue;
        }
      }
      push(errors, id, `official evidence source failed: ${evidence.url} (${source.status}${source.error ? ` ${source.error}` : ""})`);
      continue;
    }

    for (const token of evidence.mustContain || []) {
      assertContains(id, source.text, token, `${evidence.sourceName || evidence.url} official source`);
    }
  }
}

const auditedEvents = events.filter((event) => event.audit);
if (!auditedEvents.length) {
  push(errors, "event-audit", "at least one high-risk event audit block is required.");
}

for (const event of auditedEvents) {
  checkLocalAudit(event);
  await checkSourceEvidence(event);
}

await fs.mkdir(feedDir, { recursive: true });
const report = {
  generatedAt: new Date().toISOString(),
  auditedEvents: auditedEvents.map((event) => event.slug),
  sourceResults,
  warnings,
  errors
};
const jsonOut = path.join(feedDir, `event-audit-${today}.json`);
await fs.writeFile(jsonOut, `${JSON.stringify(report, null, 2)}\n`, "utf8");

if (warnings.length) {
  console.warn("Event audit warnings:");
  console.table(warnings);
}

if (errors.length) {
  console.error("Event audit failed:");
  console.table(errors);
  console.error(`Saved event audit report: ${jsonOut}`);
  process.exitCode = 1;
} else {
  console.table(auditedEvents.map((event) => ({
    slug: event.slug,
    kind: event.eventKind,
    dates: `${event.startDate} - ${event.endDate}`,
    source: event.sourceName
  })));
  console.log(`Event audit passed: ${auditedEvents.length} high-risk events checked. Saved report: ${jsonOut}`);
}
