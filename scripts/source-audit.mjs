import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const sources = JSON.parse(await fs.readFile(path.join(root, "data", "sources.json"), "utf8"));

const timeoutMs = Number(process.env.SOURCE_TIMEOUT_MS || 8000);
const strict = process.env.SOURCE_AUDIT_STRICT === "1";

async function check(source) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(source.url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent": "KoreaNowGuideBot/0.1 (+source availability check)"
      }
    });
    return {
      name: source.name,
      type: source.type,
      status: response.status,
      ok: response.ok,
      url: response.url
    };
  } catch (error) {
    return {
      name: source.name,
      type: source.type,
      status: "ERR",
      ok: false,
      url: source.url,
      error: error.name === "AbortError" ? "timeout" : error.message
    };
  } finally {
    clearTimeout(timeout);
  }
}

const results = [];
for (const source of sources) {
  results.push(await check(source));
}

console.table(results.map((item) => ({
  ok: item.ok,
  status: item.status,
  type: item.type,
  name: item.name,
  url: item.url,
  error: item.error || ""
})));

const failed = results.filter((item) => !item.ok);
if (failed.length) {
  console.warn(`${failed.length} source checks need review.`);
  if (strict) process.exitCode = 1;
}
