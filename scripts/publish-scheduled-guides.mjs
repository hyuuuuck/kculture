import fs from "node:fs/promises";
import path from "node:path";
import { todayString } from "./lib/date.mjs";
import { queueIssues, releaseDueGuides } from "./lib/guide-queue.mjs";

const root = process.cwd();
const file = (name) => path.join(root, "data", name);
const readJson = async (name, fallback) => fs.readFile(file(name), "utf8").then(JSON.parse).catch(() => fallback);
const writeJson = (name, value) => fs.writeFile(file(name), `${JSON.stringify(value, null, 2)}\n`, "utf8");

const today = todayString();
const queue = await readJson("guide-queue.json", { items: [] });
const guides = await readJson("guides.json", []);
const program = await readJson("editorial-program.json", {});
const seo = await readJson("seo-overrides.json", {});
const inlineImages = await readJson("guide-inline-images.json", {});
const notices = await readJson("notices.json", null);

const issues = queueIssues(queue, guides, today, notices ? new Set((notices.notices || []).map((notice) => notice.id)) : null);
if (issues.length) {
  console.error(`Guide queue is invalid:\n- ${issues.join("\n- ")}`);
  process.exit(1);
}

const result = releaseDueGuides({ queue, guides, program, seo, inlineImages, notices, today });
if (!result.published.length) {
  const next = (queue.items || []).map((item) => item.publishOn).sort()[0];
  console.log(`No scheduled guides due on ${today}. ${queue.items?.length || 0} queued${next ? `; next on ${next}` : ""}.`);
} else {
  await writeJson("guides.json", result.guides);
  await writeJson("editorial-program.json", result.program);
  await writeJson("seo-overrides.json", result.seo);
  await writeJson("guide-inline-images.json", result.inlineImages);
  await writeJson("guide-queue.json", result.queue);
  if (result.notices) await writeJson("notices.json", result.notices);
  console.log(`Published ${result.published.length} scheduled guide(s) on ${today}: ${result.published.join(", ")}`);
}
