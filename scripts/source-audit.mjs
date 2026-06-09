import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { todayString } from "./lib/date.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const today = todayString();
const sources = JSON.parse(await fs.readFile(path.join(root, "data", "sources.json"), "utf8"));

const timeoutMs = Number(process.env.SOURCE_TIMEOUT_MS || 8000);
const concurrency = Math.max(1, Number(process.env.SOURCE_CONCURRENCY || 6));
const userAgent = process.env.SOURCE_USER_AGENT || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36 KoreaNowGuide/0.1";
const strict = process.env.SOURCE_AUDIT_STRICT === "1";
const feedDir = path.join(root, "data", "feeds");

function sourceUrls(source) {
  const urls = [source.url, ...(source.alternateUrls || [])]
    .map((url) => String(url || "").trim())
    .filter(Boolean);
  return [...new Set(urls)];
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

async function checkUrl(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "accept-language": "en-US,en;q=0.9,ko;q=0.8",
        "user-agent": userAgent
      }
    });
    await response.body?.cancel();
    const apiKeyRequired = response.status === 401 && /\/\/apis\.data\.go\.kr\//.test(response.url);
    return {
      requestedUrl: url,
      finalUrl: response.url,
      status: response.status,
      ok: response.ok || apiKeyRequired,
      apiKeyRequired
    };
  } catch (error) {
    return {
      requestedUrl: url,
      finalUrl: url,
      status: "ERR",
      ok: false,
      error: error.name === "AbortError" ? "timeout" : error.message
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function checkSnapshot(source) {
  if (!source.auditSnapshotPath) return null;

  const snapshotFile = path.resolve(root, source.auditSnapshotPath);
  if (!snapshotFile.startsWith(root)) {
    return {
      requestedUrl: source.auditSnapshotPath,
      finalUrl: source.auditSnapshotPath,
      status: "SNAPSHOT_ERR",
      ok: false,
      error: "auditSnapshotPath escapes project root"
    };
  }

  try {
    const snapshotText = await fs.readFile(snapshotFile, "utf8");
    const missing = (source.auditMustContain || []).filter((token) => !normalizeText(snapshotText).includes(normalizeText(token)));
    if (missing.length) {
      return {
        requestedUrl: source.auditSnapshotPath,
        finalUrl: source.auditSnapshotPath,
        status: "SNAPSHOT_ERR",
        ok: false,
        error: `snapshot missing tokens: ${missing.join(", ")}`
      };
    }

    return {
      requestedUrl: source.auditSnapshotPath,
      finalUrl: source.auditSnapshotPath,
      status: "SNAPSHOT",
      ok: true,
      snapshotUsed: true
    };
  } catch (error) {
    return {
      requestedUrl: source.auditSnapshotPath,
      finalUrl: source.auditSnapshotPath,
      status: "SNAPSHOT_ERR",
      ok: false,
      error: error.message
    };
  }
}

async function check(source) {
  const attempts = [];
  for (const url of sourceUrls(source)) {
    const attempt = await checkUrl(url);
    attempts.push(attempt);
    if (attempt.ok) break;
  }

  let successful = attempts.find((attempt) => attempt.ok) || null;
  if (!successful && source.auditSnapshotPath) {
    const snapshotAttempt = await checkSnapshot(source);
    if (snapshotAttempt) {
      attempts.push(snapshotAttempt);
      if (snapshotAttempt.ok) successful = snapshotAttempt;
    }
  }

  const primary = attempts[0] || null;
  const fallbackUsed = Boolean(successful && primary && successful.requestedUrl !== primary.requestedUrl);

  return {
    name: source.name,
    type: source.type,
    owner: source.owner,
    primaryUrl: source.url,
    activeUrl: successful?.finalUrl || primary?.finalUrl || source.url,
    status: successful?.status || primary?.status || "ERR",
    ok: Boolean(successful),
    fallbackUsed,
    apiKeyRequired: Boolean(successful?.apiKeyRequired),
    snapshotUsed: Boolean(successful?.snapshotUsed),
    attempts,
    error: successful ? "" : attempts.map((attempt) => attempt.error).filter(Boolean).at(-1) || ""
  };
}

async function mapLimit(items, limit, mapper) {
  const results = new Array(items.length);
  let nextIndex = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await mapper(items[currentIndex], currentIndex);
    }
  });
  await Promise.all(workers);
  return results;
}

function markdownReport(results) {
  const failed = results.filter((item) => !item.ok);
  const fallback = results.filter((item) => item.fallbackUsed);
  const apiKeyRequired = results.filter((item) => item.apiKeyRequired);
  const snapshot = results.filter((item) => item.snapshotUsed);
  const ok = results.filter((item) => item.ok);
  const lines = [
    "# Source Audit Report",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "## Summary",
    "",
    `- OK: ${ok.length}`,
    `- OK through fallback URL: ${fallback.length}`,
    `- OK through audited snapshot: ${snapshot.length}`,
    `- API endpoints requiring keys but reachable: ${apiKeyRequired.length}`,
    `- Needs review: ${failed.length}`,
    "",
    "## Needs Review",
    ""
  ];

  if (!failed.length) {
    lines.push("No source checks failed in this run.", "");
  } else {
    for (const item of failed) {
      lines.push(`### ${item.name}`, "");
      lines.push(`- Type: ${item.type}`);
      lines.push(`- Primary URL: ${item.primaryUrl}`);
      lines.push(`- Last status: ${item.status}${item.error ? ` (${item.error})` : ""}`);
      lines.push("- Attempts:");
      for (const attempt of item.attempts) {
        lines.push(`  - ${attempt.status} ${attempt.requestedUrl}${attempt.error ? ` - ${attempt.error}` : ""}`);
      }
      lines.push("");
    }
  }

  lines.push("## Fallbacks Used", "");
  if (!fallback.length) {
    lines.push("No fallback URL was needed in this run.", "");
  } else {
    for (const item of fallback) {
      const label = item.snapshotUsed ? "audited snapshot" : item.activeUrl;
      lines.push(`- ${item.name}: ${item.primaryUrl} -> ${label}`);
    }
    lines.push("");
  }

  lines.push("## Full Results", "");
  for (const item of results) {
    lines.push(`- ${item.ok ? "OK" : "CHECK"} ${item.name} (${item.status}) ${item.fallbackUsed ? "[fallback]" : ""}${item.snapshotUsed ? " [audited-snapshot]" : ""}${item.apiKeyRequired ? " [api-key-required]" : ""}`);
    lines.push(`  - Active URL: ${item.activeUrl}`);
  }

  return `${lines.join("\n")}\n`;
}

const results = await mapLimit(sources, concurrency, check);

await fs.mkdir(feedDir, { recursive: true });
const jsonOut = path.join(feedDir, `source-audit-${today}.json`);
const mdOut = path.join(feedDir, `source-audit-${today}.md`);
await fs.writeFile(jsonOut, `${JSON.stringify({ generatedAt: new Date().toISOString(), count: results.length, results }, null, 2)}\n`, "utf8");
await fs.writeFile(mdOut, markdownReport(results), "utf8");

console.table(results.map((item) => ({
  ok: item.ok,
  fallback: item.fallbackUsed,
  snapshot: item.snapshotUsed,
  apiKey: item.apiKeyRequired,
  status: item.status,
  type: item.type,
  name: item.name,
  activeUrl: item.activeUrl,
  attempts: item.attempts.length,
  error: item.error || ""
})));

const failed = results.filter((item) => !item.ok);
if (failed.length) {
  console.warn(`${failed.length} source checks need review.`);
  console.warn(`Saved source audit: ${jsonOut}`);
  console.warn(`Saved source audit report: ${mdOut}`);
  if (strict) process.exitCode = 1;
} else {
  console.log(`Source audit passed. Saved report: ${mdOut}`);
}
