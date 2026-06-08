import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { todayString } from "./lib/date.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const today = todayString();
const sources = JSON.parse(await fs.readFile(path.join(root, "data", "sources.json"), "utf8"));

const timeoutMs = Number(process.env.SOURCE_TIMEOUT_MS || 8000);
const userAgent = process.env.SOURCE_USER_AGENT || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36 KoreaNowGuide/0.1";
const strict = process.env.SOURCE_AUDIT_STRICT === "1";
const feedDir = path.join(root, "data", "feeds");

function sourceUrls(source) {
  const urls = [source.url, ...(source.alternateUrls || [])]
    .map((url) => String(url || "").trim())
    .filter(Boolean);
  return [...new Set(urls)];
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
    return {
      requestedUrl: url,
      finalUrl: response.url,
      status: response.status,
      ok: response.ok
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

async function check(source) {
  const attempts = [];
  for (const url of sourceUrls(source)) {
    const attempt = await checkUrl(url);
    attempts.push(attempt);
    if (attempt.ok) break;
  }

  const successful = attempts.find((attempt) => attempt.ok) || null;
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
    attempts,
    error: successful ? "" : attempts.map((attempt) => attempt.error).filter(Boolean).at(-1) || ""
  };
}

function markdownReport(results) {
  const failed = results.filter((item) => !item.ok);
  const fallback = results.filter((item) => item.fallbackUsed);
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
      lines.push(`- ${item.name}: ${item.primaryUrl} -> ${item.activeUrl}`);
    }
    lines.push("");
  }

  lines.push("## Full Results", "");
  for (const item of results) {
    lines.push(`- ${item.ok ? "OK" : "CHECK"} ${item.name} (${item.status}) ${item.fallbackUsed ? "[fallback]" : ""}`);
    lines.push(`  - Active URL: ${item.activeUrl}`);
  }

  return `${lines.join("\n")}\n`;
}

const results = [];
for (const source of sources) {
  results.push(await check(source));
}

await fs.mkdir(feedDir, { recursive: true });
const jsonOut = path.join(feedDir, `source-audit-${today}.json`);
const mdOut = path.join(feedDir, `source-audit-${today}.md`);
await fs.writeFile(jsonOut, `${JSON.stringify({ generatedAt: new Date().toISOString(), count: results.length, results }, null, 2)}\n`, "utf8");
await fs.writeFile(mdOut, markdownReport(results), "utf8");

console.table(results.map((item) => ({
  ok: item.ok,
  fallback: item.fallbackUsed,
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
