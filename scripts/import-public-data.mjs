import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { todayString } from "./lib/date.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const today = todayString();
const strict = process.env.PUBLIC_DATA_STRICT === "1";

const tasks = [
  {
    id: "kto-tourapi",
    configured: Boolean(process.env.KTO_SERVICE_KEY || process.env.DATA_GO_KR_SERVICE_KEY),
    module: "./import-tourapi.mjs"
  },
  {
    id: "kma-asos",
    configured: Boolean(process.env.KMA_SERVICE_KEY || process.env.DATA_GO_KR_SERVICE_KEY),
    module: "./import-kma-weather.mjs"
  },
  {
    id: "seoul-cultural-events",
    configured: Boolean(process.env.SEOUL_OPEN_DATA_KEY),
    module: "./import-seoul-cultural-events.mjs"
  }
];

const results = [];
for (const task of tasks) {
  if (!task.configured) {
    results.push({ id: task.id, status: "skipped", reason: "credential-not-configured" });
    continue;
  }
  try {
    await import(task.module);
    results.push({ id: task.id, status: "passed" });
  } catch (error) {
    results.push({ id: task.id, status: "failed", error: String(error.message || error) });
  }
}

const summary = {
  generatedAt: new Date().toISOString(),
  publicationPolicy: "Public-data imports are review inputs. Only the KMA numeric observation snapshot is build-readable, and every public page still requires an approved editorial record.",
  passed: results.filter((result) => result.status === "passed").length,
  failed: results.filter((result) => result.status === "failed").length,
  skipped: results.filter((result) => result.status === "skipped").length,
  results
};

const feedDir = path.join(root, "data", "feeds");
await fs.mkdir(feedDir, { recursive: true });
const out = path.join(feedDir, `public-data-import-${today}.json`);
await fs.writeFile(out, `${JSON.stringify(summary, null, 2)}\n`, "utf8");

console.table(results.map(({ id, status, reason, error }) => ({ id, status, detail: reason || error || "" })));
console.log(`Saved public-data import summary: ${out}`);

if (strict && summary.failed) process.exit(1);
