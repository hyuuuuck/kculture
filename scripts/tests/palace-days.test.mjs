import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
await import("../../palace-days.js");
const data = JSON.parse(fs.readFileSync(new URL("../../data/palace-days.json", import.meta.url), "utf8"));
const open = (iso) => Object.fromEntries(globalThis.PalaceDays.dayFor(data, iso).sites.map((site) => [site.id, site.open]));

test("weekly closing days split the palaces into a Monday and a Tuesday group", () => {
  const monday = open("2026-10-26");
  assert.deepEqual([monday.gyeongbokgung, monday.jongmyo, monday.changdeokgung, monday.deoksugung, monday.gyeonghuigung], [true, true, false, false, false]);
  const tuesday = open("2026-10-27");
  assert.deepEqual([tuesday.gyeongbokgung, tuesday.jongmyo, tuesday.changdeokgung, tuesday.changgyeonggung], [false, false, true, true]);
});

test("a closing day on a public holiday opens and moves to the next non-holiday", () => {
  assert.equal(open("2027-02-08").changdeokgung, true);
  assert.equal(open("2027-02-09").gyeongbokgung, true);
  const after = open("2027-02-10");
  assert.deepEqual([after.gyeongbokgung, after.changdeokgung, after.jongmyo, after.gyeonghuigung], [false, false, false, true]);
  assert.equal(open("2027-09-17").gyeongbokgung, false);
  assert.equal(open("2027-09-17").changdeokgung, true);
  assert.equal(open("2027-03-01").gyeonghuigung, false, "Gyeonghuigung keeps its plain Monday closure");
});

test("free days and dated exceptions change entry and hours", () => {
  const wednesday = globalThis.PalaceDays.dayFor(data, "2026-10-28").sites;
  assert.match(wednesday.find((s) => s.id === "deoksugung").entry, /Culture Day/);
  assert.match(wednesday.find((s) => s.id === "gyeongbokgung").entry, /3,000 won/);
  const festival = globalThis.PalaceDays.dayFor(data, "2026-11-12").sites;
  assert.match(festival.find((s) => s.id === "gyeongbokgung").entry, /Free for everyone/);
  assert.equal(festival.find((s) => s.id === "changgyeonggung").hours, "09:00–17:30");
  assert.equal(festival.find((s) => s.id === "jongmyo").mode, "Self-guided visit.");
  assert.match(globalThis.PalaceDays.dayFor(data, "2026-12-03").sites.find((s) => s.id === "jongmyo").mode, /Timed guided tours/);
});
