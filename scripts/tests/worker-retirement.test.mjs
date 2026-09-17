import test from "node:test";
import assert from "node:assert/strict";
import worker from "../../src/worker.js";

const missingAssets = { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } };

test("hidden metadata is blocked before asset lookup, including encoded paths", async () => {
  let calls = 0;
  const assets = { ASSETS: { fetch: async () => { calls++; return new Response("public asset"); } } };
  for (const route of ["/.DS_Store", "/assets/.DS_Store", "/assets/%2eDS_Store", "/.env", "/assets/._image.jpg"]) {
    const response = await worker.fetch(new Request(`https://kspotnow.com${route}`), assets);
    assert.equal(response.status, 404);
    assert.equal(response.headers.get("cache-control"), "no-store");
  }
  assert.equal(calls, 0);
  const publicFile = await worker.fetch(new Request("https://kspotnow.com/.well-known/security.txt"), assets);
  assert.equal(publicFile.status, 200);
  assert.equal(calls, 1);
});

test("retired shopping URLs do not redirect readers into another retired guide", async () => {
  for (const slug of ["korea-duty-free-before-flight", "tax-refund-payments-korea-shopping"]) {
    const response = await worker.fetch(new Request(`https://kspotnow.com/en/guides/${slug}/`), missingAssets);
    assert.equal(response.status, 410);
    assert.equal(response.headers.get("location"), null);
    assert.match(await response.text(), /current, source-checked information/);
  }
});

test("merged cultural guides still redirect to the current pop-up guide", async () => {
  const response = await worker.fetch(new Request("https://kspotnow.com/en/guides/kpop-ticket-merch-safety/"), missingAssets);
  assert.equal(response.status, 301);
  assert.equal(response.headers.get("location"), "https://kspotnow.com/en/guides/how-to-verify-korea-popups/");
});
