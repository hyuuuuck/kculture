import fs from "node:fs";
import path from "node:path";
import { publicLanguageCodes } from "./lib/public-languages.mjs";
import { todayString } from "./lib/date.mjs";

const root = path.resolve(".");
const dist = path.join(root, "dist");
const events = JSON.parse(fs.readFileSync(path.join(root, "data", "events.json"), "utf8"));
const editorialProgram = JSON.parse(fs.readFileSync(path.join(root, "data", "editorial-program.json"), "utf8"));
const languages = publicLanguageCodes();
const errors = [];
const today = todayString();
const approvedSlugs = new Set(editorialProgram.indexableEvents || []);
const currentEvents = events.filter((event) => approvedSlugs.has(event.slug) && event.endDate >= today);

function push(id, message) {
  errors.push({ id, message });
}

function icsDate(value, addDay = false) {
  const date = new Date(`${value}T00:00:00Z`);
  if (addDay) date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10).replaceAll("-", "");
}

function unfoldIcs(text) {
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = [];
  for (const line of normalized.split("\n")) {
    if (/^[ \t]/.test(line) && lines.length) {
      lines[lines.length - 1] += line.slice(1);
    } else if (line) {
      lines.push(line);
    }
  }
  return lines;
}

function parseEventBlocks(lines) {
  const blocks = [];
  let current = null;
  for (const line of lines) {
    if (line === "BEGIN:VEVENT") {
      current = [];
      continue;
    }
    if (line === "END:VEVENT") {
      if (current) blocks.push(current);
      current = null;
      continue;
    }
    if (current) current.push(line);
  }
  return blocks;
}

function prop(block, name) {
  const prefix = `${name}`;
  const line = block.find((item) => item === prefix || item.startsWith(`${prefix}:`) || item.startsWith(`${prefix};`));
  if (!line) return "";
  const index = line.indexOf(":");
  return index === -1 ? "" : line.slice(index + 1);
}

function validateIcs() {
  const icsPath = path.join(dist, "events.ics");
  if (!fs.existsSync(icsPath)) {
    push("events.ics", "dist/events.ics is missing; run npm.cmd run build first.");
    return;
  }

  const text = fs.readFileSync(icsPath, "utf8");
  if (!text.includes("BEGIN:VCALENDAR") || !text.includes("END:VCALENDAR")) {
    push("events.ics", "calendar file is missing VCALENDAR boundaries.");
  }
  if (!text.includes("METHOD:PUBLISH")) {
    push("events.ics", "calendar file should be a publishable event calendar.");
  }

  const blocks = parseEventBlocks(unfoldIcs(text));
  if (blocks.length !== currentEvents.length) {
    push("events.ics", `expected ${currentEvents.length} approved VEVENT blocks, found ${blocks.length}.`);
  }

  const byUid = new Map();
  for (const block of blocks) {
    const uid = prop(block, "UID");
    if (!uid) {
      push("events.ics", "VEVENT is missing UID.");
      continue;
    }
    if (byUid.has(uid)) push(uid, "duplicate VEVENT UID.");
    byUid.set(uid, block);
  }

  for (const event of currentEvents) {
    const uid = `${event.slug}@kspotnow`;
    const block = byUid.get(uid);
    if (!block) {
      push(event.slug, "missing VEVENT in events.ics.");
      continue;
    }

    const start = prop(block, "DTSTART");
    const end = prop(block, "DTEND");
    const summary = prop(block, "SUMMARY");
    const description = prop(block, "DESCRIPTION");
    const url = prop(block, "URL");
    const location = prop(block, "LOCATION");

    if (start !== icsDate(event.startDate)) push(event.slug, `DTSTART should be ${icsDate(event.startDate)}, found ${start || "(missing)"}.`);
    if (end !== icsDate(event.endDate, true)) push(event.slug, `DTEND should be exclusive end ${icsDate(event.endDate, true)}, found ${end || "(missing)"}.`);
    if (!summary) push(event.slug, "SUMMARY is required in events.ics.");
    if (!description.includes(event.sourceUrl)) push(event.slug, "DESCRIPTION should include the official source URL.");
    if (url !== event.sourceUrl) push(event.slug, "URL should match sourceUrl.");
    if (!location.includes(event.city)) push(event.slug, "LOCATION should include event city.");
  }
}

function validateCalendarHtml() {
  for (const lang of languages) {
    const file = path.join(dist, lang, "calendar", "index.html");
    if (!fs.existsSync(file)) {
      push(`${lang}/calendar`, "calendar page is missing.");
      continue;
    }

    const html = fs.readFileSync(file, "utf8");
    if (!html.includes('href="/events.ics"')) push(`${lang}/calendar`, "calendar page should link to /events.ics.");
    if (!html.includes("data-gallery-scope")) push(`${lang}/calendar`, "calendar page should keep filterable gallery controls.");
    if (!html.includes("calendar-weather")) push(`${lang}/calendar`, "calendar page should show weather planning notes.");

    for (const event of currentEvents) {
      const href = `/${lang}/events/${event.slug}.html`;
      const count = html.split(`href="${href}"`).length - 1;
      if (count !== 1) {
        push(`${lang}/calendar:${event.slug}`, `expected exactly one calendar link to ${href}, found ${count}.`);
      }
    }
  }
}

validateIcs();
validateCalendarHtml();

if (errors.length) {
  console.error("Calendar validation failed:");
  console.error(JSON.stringify(errors, null, 2));
  process.exit(1);
}

console.log(`Calendar validation passed: ${currentEvents.length} approved events in events.ics and ${currentEvents.length} current events in ${languages.length} calendar pages.`);
