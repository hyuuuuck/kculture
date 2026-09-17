import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import test from "node:test";
import { loadPlanning } from "./helpers/planning.mjs";

// Exercise the actual browser implementation without changing a visitor's storage.
const app = fs.readFileSync(new URL("../../app.js", import.meta.url), "utf8");
const start = app.indexOf("function downloadSavedCalendar(");
const end = app.indexOf("for (const button of saveButtons)", start);
assert.ok(start >= 0 && end > start, "Planner calendar functions must remain testable");
const source = app.slice(start, end);

function harness(saved) {
  let blob, clicked = false, removed = false, filename;
  const link = { click() { clicked = true; filename = this.download; }, remove() { removed = true; } };
  const context = vm.createContext({
    Blob,
    KSpotPlanning: { calendarText: items => loadPlanning().calendarText(items, "2026-09-17") },
    setTimeout: callback => callback(),
    readSavedEvents: () => saved,
    document: { createElement: () => link, body: { append() {} } },
    URL: { createObjectURL(value) { blob = value; return "blob:unit-test"; }, revokeObjectURL() {} }
  });
  vm.runInContext(source, context);
  return { context, run() { vm.runInContext("downloadSavedCalendar()", context); }, result() { return { blob, clicked, removed, filename }; } };
}

test("saved calendar downloads chosen visits rather than the entire event duration", async () => {
  const instance = harness([{ slug: "test-culture", title: "Culture, gardens; Seoul", city: "Seoul", start: "2026-01-01", end: "2026-12-31", visitDate: "2026-12-31", sourceUrl: "https://example.test/official" }]);
  instance.run();
  const { blob, clicked, removed, filename } = instance.result();
  assert.equal(filename, "kspotnow-planned-visits.ics");
  assert.equal(clicked, true);
  assert.equal(removed, true);
  assert.equal(blob.type, "text/calendar;charset=utf-8");
  const text = await blob.text();
  assert.ok(text.startsWith("BEGIN:VCALENDAR\r\n"));
  assert.ok(text.includes("DTSTART;VALUE=DATE:20261231\r\n"));
  assert.ok(text.includes("DTEND;VALUE=DATE:20270101\r\n"));
  assert.ok(text.includes("SUMMARY:Planned visit: Culture\\, gardens\\; Seoul\r\n"));
  assert.ok(text.includes("URL:https://example.test/official\r\n"));
  assert.ok(text.endsWith("END:VCALENDAR\r\n"));
});

test("empty saved lists do not create a misleading calendar download", () => {
  const instance = harness([]);
  instance.run();
  assert.equal(instance.result().blob, undefined);
  assert.equal(instance.result().clicked, false);
});

test("saved places without selected visit days do not export a year-long block", () => {
  const instance = harness([{ slug: "test", title: "Test", start: "2026-01-01", end: "2026-12-31" }]);
  instance.run();
  assert.equal(instance.result().blob, undefined);
});
