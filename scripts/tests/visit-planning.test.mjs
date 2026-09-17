import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { loadPlanning } from "./helpers/planning.mjs";

const P = loadPlanning();
const rules = JSON.parse(fs.readFileSync(new URL("../../data/visit-planning.json", import.meta.url)));
const events = JSON.parse(fs.readFileSync(new URL("../../data/events.json", import.meta.url)));
const catalog = Object.entries(rules).map(([slug, schedule]) => {
  const event = events.find(event => event.slug === slug);
  assert.ok(event, "Every schedule must belong to a real article");
  return { slug, start: event.startDate, end: event.endDate, title: event.title.en, url: `/en/events/${slug}`, schedule };
});
const item = fragment => catalog.find(item => item.slug.includes(fragment));
const decide = (fragment, date, today = "2026-09-17") => P.visitDecision(item(fragment), date, today);

test("strict dates and Korea day boundaries do not depend on visitor timezone", () => {
  assert.equal(P.validDate("2026-02-30"), false);
  assert.equal(P.validDate("2028-02-29"), true);
  assert.equal(P.validDate("2026-09-1"), false);
  assert.equal(P.koreaToday(new Date("2026-09-16T15:01:00Z")), "2026-09-17");
  assert.equal(P.koreaToday(new Date("2026-09-16T14:59:00Z")), "2026-09-16");
});
test("holiday and Monday closures are excluded rather than labelled available", () => {
  assert.equal(decide("ocean", "2026-09-24").state, "blocked");
  assert.equal(decide("ocean", "2026-09-25").state, "blocked");
  assert.equal(decide("ocean", "2026-09-21").state, "blocked");
  assert.equal(decide("deoksugung", "2026-09-21").state, "blocked");
  assert.equal(decide("ocean", "2026-09-26").state, "candidate");
});
test("recurring drone shows use weekdays and selected-date seasonal times", () => {
  assert.equal(decide("drone", "2026-09-18").exportable, false);
  assert.match(decide("drone", "2026-09-19").message, /20:00 and 22:00/);
  assert.match(decide("drone", "2026-10-03").message, /19:00 and 21:00/);
});
test("Jinju opening night keeps its exception beside the date", () => {
  assert.match(decide("jinju", "2026-10-03").message, /19:30/);
  assert.match(decide("jinju", "2026-10-04").message, /18:00–24:00/);
  assert.equal(decide("jinju", "2026-10-02").state, "blocked");
  assert.equal(decide("jinju", "2026-10-19").state, "blocked");
});
test("a dated special performance replaces, rather than appends to, seasonal times", () => {
  const decision = decide("drone", "2026-09-26");
  assert.match(decision.message, /20:00 only/);
  assert.doesNotMatch(decision.message, /20:00 and 22:00/);
  const text = P.calendarText([{ ...item("drone"), visitDate: "2026-09-26" }], "2026-09-18").replace(/\r\n /g, "");
  assert.match(text, /20:00 only/);
  assert.match(text, /cuseog-teugbyeolgongyeon-annae-2/);
  assert.doesNotMatch(text, /20:00 and 22:00/);
  assert.match(P.operatingNotice({ ...item("drone"), visitDate: "2026-09-26" }), /cuseog-teugbyeolgongyeon-annae-2/);
  assert.equal(P.operatingNotice({ ...item("drone"), visitDate: "2026-09-19" }), item("drone").schedule.sourceUrl);
});
test("a retired article is not revived from an old saved list", () => {
  const removed = item("ocean");
  const current = catalog.filter(x => x.slug !== removed.slug);
  const [saved] = P.reconcileSaved([{ ...removed, visitDate: "2026-09-26" }], current);
  assert.equal(saved.retired, true);
  assert.equal(P.visitDecision(saved, saved.visitDate, "2026-09-18").exportable, false);
  assert.equal(saved.url, "");
});
test("no date, invalid, past, retired and stale states stay honest", () => {
  assert.equal(decide("ocean", "").exportable, false);
  assert.equal(decide("ocean", "bad").state, "invalid");
  assert.equal(decide("ocean", "2026-09-16").state, "blocked");
  assert.equal(P.visitDecision({ ...item("ocean"), retired: true }, "2026-09-26", "2026-09-17").exportable, false);
  assert.match(decide("ocean", "2026-10-03", "2026-10-02").message, /over 14 days old/);
  assert.match(decide("andong", "2026-09-26").message, /not a confirmed session/);
});
test("saved lists refresh article facts, preserve chosen day, deduplicate and retain retired notices", () => {
  const current = item("ocean");
  const saved = P.reconcileSaved([{ slug: current.slug, title: "outdated", visitDate: "2026-09-26" }, { slug: current.slug }, { slug: "old-festival", title: "Old", url: "javascript:alert(1)", sourceUrl: "javascript:alert(1)" }], catalog);
  assert.equal(saved.length, 2);
  assert.equal(saved[0].title, current.title);
  assert.equal(saved[0].visitDate, "2026-09-26");
  assert.equal(saved[1].retired, true);
  assert.equal(saved[1].url, "");
  assert.equal(saved[1].sourceUrl, "");
  assert.equal(P.reconcileSaved(null, catalog).length, 0);
});
test("saved links reject executable, protocol-relative and credential-bearing URLs", () => {
  for (const url of ["javascript:alert(1)", "//example.com", "https://user:pass@example.com"]) assert.equal(P.safeLink(url), "");
  assert.equal(P.safeLink("/en/events/a", { local: true }), "/en/events/a");
  assert.equal(P.safeLink("//evil.test", { local: true }), "");
});
test("only dated, usable visits export as one tentative day, with UTF-8 line folding", () => {
  const visit = { ...item("ocean"), visitDate: "2026-09-26", city: "Seoul", venue: "충무아트센터".repeat(12), title: "Culture, gardens; Seoul" };
  const text = P.calendarText([visit, { ...visit, visitDate: "" }, { ...visit, visitDate: "2026-09-24" }], "2026-09-17", new Date("2026-09-17T00:00:00Z"));
  const unfolded = text.replace(/\r\n /g, "");
  assert.equal((text.match(/BEGIN:VEVENT/g) || []).length, 1);
  assert.match(text, /DTSTART;VALUE=DATE:20260926\r\nDTEND;VALUE=DATE:20260927/);
  assert.match(text, /STATUS:TENTATIVE\r\nTRANSP:TRANSPARENT/);
  assert.ok(unfolded.includes("SUMMARY:Planned visit: Culture\\, gardens\\; Seoul"));
  assert.ok(unfolded.includes("충무아트센터".repeat(12)));
  assert.ok(text.split("\r\n").every(line => Buffer.byteLength(line) <= 75));
  assert.equal(P.calendarText([{ ...visit, visitDate: "" }], "2026-09-17"), "");
});
test("calendar escapes CRLF, delimiters and rolls December 31 into next year", () => {
  assert.equal(P.icsEscape("x\r\nInjected\rline\nend\\,;"), "x\\nInjected\\nline\\nend\\\\\\,\\;");
  const text = P.calendarText([{ slug: "test", title: "Test", start: "2026-01-01", end: "2026-12-31", visitDate: "2026-12-31" }], "2026-09-17");
  assert.match(text, /DTEND;VALUE=DATE:20270101/);
});
