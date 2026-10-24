import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { activeNotices, noticeStatus, noticesForGuide, noticeIssues } from "../lib/notices.mjs";

const sample = [
  { id: "late", start: "2026-11-10", end: "2026-11-15", guides: ["a"] },
  { id: "early", start: "2026-09-02", end: "2026-10-31", guides: ["a", "b"] },
  { id: "gone", start: "2026-09-01", end: "2026-10-20", guides: ["b"] }
];

test("notices disappear the day after they end and stay visible on the end date", () => {
  assert.deepEqual(activeNotices(sample, "2026-10-21").map((n) => n.id), ["early", "late"]);
  assert.deepEqual(activeNotices(sample, "2026-10-20").map((n) => n.id), ["gone", "early", "late"]);
  assert.deepEqual(activeNotices(sample, "2026-11-16"), []);
});

test("notice label switches from coming up to now on the start date", () => {
  const notice = sample[0];
  assert.equal(noticeStatus(notice, "2026-11-09"), "upcoming");
  assert.equal(noticeStatus(notice, "2026-11-10"), "now");
  assert.deepEqual(noticesForGuide(activeNotices(sample, "2026-10-21"), "b").map((n) => n.id), ["early"]);
});

test("published notices target real guides and cite a dated source", () => {
  const guides = JSON.parse(fs.readFileSync(new URL("../../data/guides.json", import.meta.url), "utf8"));
  const data = JSON.parse(fs.readFileSync(new URL("../../data/notices.json", import.meta.url), "utf8"));
  const { errors } = noticeIssues(data, new Set(guides.map((guide) => guide.slug)), "2026-10-21");
  assert.deepEqual(errors, []);
  const broken = noticeIssues({ notices: [{ id: "x", start: "2026-11-15", end: "2026-11-01", title: "Short", text: "", guides: ["missing"], source: {} }] }, new Set(), "2026-10-21");
  assert.ok(broken.errors.length >= 5);
});
