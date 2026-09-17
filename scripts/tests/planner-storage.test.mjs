import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import vm from "node:vm";
import { loadPlanning } from "./helpers/planning.mjs";

const app = fs.readFileSync(new URL("../../app.js", import.meta.url), "utf8");
const start = app.indexOf("function normalizeSavedEvent(");
const end = app.indexOf("function savedEventFromButton(", start);
assert.ok(start >= 0 && end > start);
const live = { slug: "current", title: "Current title", url: "/en/events/current", start: "2026-01-01", end: "2026-12-31" };
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
