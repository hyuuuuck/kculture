import test from "node:test";
import assert from "node:assert/strict";
import { experienceIndexIssues, guideIndexIssues } from "../lib/publication-surfaces.mjs";
const event = {slug:"culture"};
const card = '<article class="experience-card event-card" data-visit-slug="culture"><h2><a href="/en/events/culture">Culture</a></h2><p>Choose an English tour or a visual ceremony.</p><button data-event-slug="culture">Save</button></article>';
test("publication cards are counted regardless of CSS class order", () => {
  assert.deepEqual(experienceIndexIssues(card,[event]),[]);
  assert.deepEqual(experienceIndexIssues(card.replace('experience-card event-card','event-card experience-card'),[event]),[]);
});
test("missing, duplicated or empty experience entries still fail", () => {
  assert.ok(experienceIndexIssues('',[event]).length);
  assert.ok(experienceIndexIssues(card+card,[event]).length);
  assert.ok(experienceIndexIssues(card.replace(/<p>.*?<\/p>/,''),[event]).length);
  assert.ok(experienceIndexIssues(card.replace('href="/en/events/culture"','href="/en/events/wrong"'),[event]).length);
});
test("guide index needs each real article link and explanatory context", () => {
  const guide='<section class="guide-index"><article><h2><a href="/en/guides/culture">Culture</a></h2><p>Compare a palace, gardens and Korean ceramics.</p></article></section>';
  assert.deepEqual(guideIndexIssues(guide,[event]),[]);
  assert.ok(guideIndexIssues(guide.replace(/<p>.*?<\/p>/,''),[event]).length);
  assert.ok(guideIndexIssues(guide,[event,{slug:"missing"}]).length);
});
