import fs from "node:fs";
import { todayString } from "./lib/date.mjs";

const read = file => JSON.parse(fs.readFileSync(file, "utf8"));
const rules = read("data/visit-planning.json");
const program = read("data/editorial-program.json");
const events = read("data/events.json").filter(event => program.indexableEvents.includes(event.slug) && event.endDate >= todayString());
const errors = [];
const check = (condition, message) => { if (!condition) errors.push(message); };
const interests = new Set(["history", "performance", "design", "photography", "outdoors"]);
for (const event of events) {
  const rule = rules[event.slug];
  check(Boolean(rule), `No documented visit rule for ${event.slug}`);
  if (!rule) continue;
  check(/^\d{4}-\d{2}-\d{2}$/.test(rule.checkedAt) && rule.checkedAt <= todayString(), `Invalid evidence date: ${event.slug}`);
  check(typeof rule.note === "string" && rule.note.length > 20, `Missing participation limit: ${event.slug}`);
  check(/^https:\/\//.test(rule.sourceUrl), `Missing official schedule link: ${event.slug}`);
  check(Array.isArray(rule.interests) && rule.interests.length && rule.interests.every(value => interests.has(value)), `Invalid interests: ${event.slug}`);
  for (const field of ["weekdays", "closedWeekdays"]) if (rule[field]) check(Array.isArray(rule[field]) && rule[field].every(day => Number.isInteger(day) && day >= 0 && day <= 6), `Invalid ${field}: ${event.slug}`);
  for (const date of [...(rule.closedDates || []), ...Object.keys(rule.dateNotes || {}), ...Object.keys(rule.dateTimes || {})]) check(/^\d{4}-\d{2}-\d{2}$/.test(date) && date >= event.startDate && date <= event.endDate, `Exception outside edition: ${event.slug} ${date}`);
  for (const [date, time] of Object.entries(rule.dateTimes || {})) {
    check(typeof time === "string" && time.length > 10, `Missing special-day time: ${event.slug} ${date}`);
    check(/^https:\/\//.test(rule.dateSources?.[date] || ""), `Missing special-day evidence: ${event.slug} ${date}`);
  }
}
for (const file of ["dist/en/now/index.html", "dist/en/planner/index.html"]) {
  const html = fs.readFileSync(file, "utf8");
  const match = html.match(/<script type="application\/json" id="visit-catalog">([\s\S]*?)<\/script>/);
  check(Boolean(match), `${file}: catalog missing`);
  if (match) {
    const catalog = JSON.parse(match[1]);
    check(JSON.stringify(catalog.map(item => item.slug).sort()) === JSON.stringify(events.map(event => event.slug).sort()), `${file}: catalog contains a missing or unpublished article`);
    for (const item of catalog) check(JSON.stringify(item.schedule) === JSON.stringify(rules[item.slug]), `${file}: stale schedule for ${item.slug}`);
  }
  check(html.indexOf('src="/planning.js?') >= 0 && html.indexOf('src="/planning.js?') < html.indexOf('src="/app.js?'), `${file}: planning library must load before app`);
}
if (errors.length) { console.error(errors.join("\n")); process.exitCode = 1; }
else console.log(`Visit planning integrity passed: ${events.length} current articles, dated rules, publication-scoped catalogs and ordered scripts. This does not verify live admission or ticket inventory.`);
