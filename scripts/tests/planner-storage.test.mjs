import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import vm from "node:vm";
import { loadPlanning } from "./helpers/planning.mjs";

const app = fs.readFileSync(new URL("../../app.js", import.meta.url), "utf8");
const start = app.indexOf("function normalizeSavedEvent(");
const end = app.indexOf("function savedEventFromButton(", start);
assert.ok(start >= 0 && end > start);
const live = { slug: "current", title: "Current title", url: "/en/events/current", start: "2026-01-01", end: "2026-12-31", publicationFacts: { price: "Free" }, editorialUpdatedAt: "2026-09-29" };
function harness(storage) {
  const context = vm.createContext({ KSpotPlanning: loadPlanning(), localStorage: storage, visitCatalog: [live], savedKey: "test" });
  vm.runInContext("let volatileSavedEvents = null; let storageUnavailable = false;\n" + app.slice(start, end), context);
  return code => vm.runInContext(code, context);
}
test("storage denied keeps new choices usable on this page and exposes warning state", () => {
  const run = harness({ getItem() { throw new Error("denied"); }, setItem() { throw new Error("denied"); } });
  assert.equal(run("readSavedEvents().length"), 0);
  run('writeSavedEvents([{slug:"current",title:"Old",visitDate:"2026-09-26"}])');
  assert.equal(run("readSavedEvents()[0].visitDate"), "2026-09-26");
  assert.equal(run("readSavedEvents()[0].title"), "Current title");
  assert.equal(run("storageUnavailable"), true);
});
test("quota failures do not silently revert to the old persistent saved list", () => {
  const run = harness({ getItem() { return "[]"; }, setItem() { throw new Error("quota"); } });
  run('writeSavedEvents([{slug:"current",title:"Current title",visitDate:"2026-09-26"}])');
  assert.equal(run("readSavedEvents().length"), 1);
  assert.equal(run("storageUnavailable"), true);
});
test("corrupt storage fails safely, while successful writes preserve visit dates", () => {
  let value = "{bad json";
  const run = harness({ getItem() { return value; }, setItem(key, next) { value = next; } });
  assert.equal(run("readSavedEvents().length"), 0);
  run('writeSavedEvents([{slug:"current",title:"Current title",visitDate:"2026-09-26"}])');
  assert.equal(run("storageUnavailable"), false);
  assert.equal(run("readSavedEvents()[0].visitDate"), "2026-09-26");
});
test("saved publication baseline survives storage, reconciliation and a visit-date edit", () => {
  let value = "[]";
  const run = harness({ getItem() { return value; }, setItem(key, next) { value = next; } });
  run('writeSavedEvents([{slug:"current",title:"Current title",savedSnapshot:KSpotPlanning.snapshotFor(visitCatalog[0])}])');
  assert.equal(run('readSavedEvents()[0].savedSnapshot.price'), "Free");
  run('writeSavedEvents(readSavedEvents().map(item => ({...item,visitDate:"2026-10-03"})))');
  assert.equal(run('readSavedEvents()[0].savedSnapshot.price'), "Free");
  assert.equal(run('KSpotPlanning.publicationChanges(readSavedEvents()[0]).state'), "unchanged");
  run('visitCatalog[0].publicationFacts.price = "Ticket required"');
  assert.equal(run('KSpotPlanning.publicationChanges(readSavedEvents()[0]).state'), "changed");
});
