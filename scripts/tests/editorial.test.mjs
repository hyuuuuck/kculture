import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { publicationDates, nearbyAlternatives, searchObservation, sourceCheckDate } from "../lib/editorial.mjs";
import { renderVisitorBrief } from "../lib/visitor-render.mjs";
import { briefIssues, guideIssues } from "../lib/article-integrity.mjs";
import { releaseIssues } from "../lib/editorial-release.mjs";
import { todayString } from "../lib/date.mjs";
const read = name => JSON.parse(fs.readFileSync(new URL("../../data/" + name + ".json", import.meta.url), "utf8"));
const briefs = read("visitor-briefs"), guides = read("guides"), program = read("editorial-program");
const esc = value => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;");

test("source monitoring cannot change article dates or original publication", () => {
  const review = { publishedAt: "2026-08-06", reviewedAt: "2026-09-03" };
  const a = publicationDates({lastChecked: "2026-09-03"}, review, {updatedAt: "2026-09-10"});
  const b = publicationDates({lastChecked: "2026-09-20", sourceCheckedAt: "2026-09-21"}, review, {updatedAt: "2026-09-10"});
  assert.deepEqual(a, b);
  assert.deepEqual(a, {publishedAt: "2026-08-06", updatedAt: "2026-09-10"});
  assert.equal(sourceCheckDate({lastChecked: "2026-09-03", sourceCheckedAt: "2026-09-21"}), "2026-09-21");
});
test("a newer substantive revision changes only modified date", () => {
  assert.deepEqual(publicationDates({}, {publishedAt: "2026-08-06"}, {updatedAt: "2026-09-10"}),
    {publishedAt: "2026-08-06", updatedAt: "2026-09-10"});
});
test("a cancelled Busan event never suggests Seoul as a nearby fallback", () => {
  const current = {slug: "beach", city: "Busan"};
  assert.deepEqual(nearbyAlternatives(current, [current, {slug:"palace",city:"Seoul"}]), []);
  assert.equal(nearbyAlternatives(current, [{slug:"gallery",city:"Busan"}]).length, 1);
});
test("Search report chronology is factual, not inferred from hold status", () => {
  const audit = {status: "hold", cleanup: {deployedAt:"2026-09-03T00:00:00Z"}, coverage:{reportUpdatedAt:"2026-09-04"}};
  assert.match(searchObservation(audit), /on or after/);
  audit.coverage.reportUpdatedAt = "2026-08-20";
  assert.match(searchObservation(audit), /before the recorded/);
});
test("all revised articles have traceable data, without a word-count quota", () => {
  for (const brief of Object.values(briefs.events)) assert.deepEqual(briefIssues(brief,todayString()), []);
  for (const guide of guides.filter(g=>program.indexableGuides.includes(g.slug))) assert.deepEqual(guideIssues(guide,todayString()), []);
});
test("corrected admission scope and opening-night timing remain explicit", () => {
  const popup = guides.find(g => g.slug === "how-to-verify-korea-popups");
  const popupText = JSON.stringify(popup.sections.en);
  assert.match(popupText, /B1 merchandise shop/);
  assert.match(popupText, /B2 showroom/);
  assert.match(popupText, /without a reservation/);
  const jinju = JSON.stringify(briefs.events["jinju-namgang-yudeung-festival-2026"]);
  assert.match(jinju, /October 3 at 19:30/);
  assert.match(jinju, /18:00/);
  assert.match(jinju, /automated monitoring verifies dates\/venue, not the rendered timetable/);
});
test("future editorial dates are still rejected independently of the live-data test", () => {
  const brief = {...Object.values(briefs.events)[0], updatedAt:"2099-01-01"};
  assert.ok(briefIssues(brief, "2026-09-17").includes("invalid editorial revision date"));
});
test("empty narratives and unverified firsthand claims fail integrity checks", () => {
  const original = Object.values(briefs.events)[0];
  assert.ok(briefIssues({...original, sections:[]}, todayString()).includes("missing narrative"));
  assert.ok(briefIssues({...original, answer:"We attended this event."}, todayString()).includes("unverified firsthand claim"));
});
test("article text is escaped and source uncertainty remains visible", () => {
  const brief = {...Object.values(briefs.events)[0], question:'<script>alert("x")</script>'};
  const html = renderVisitorBrief(brief, {esc, publishedAt:"2026-08-06", method:"No field visit."});
  assert.ok(!html.includes("<script>"));
  assert.match(html,/&lt;script>/);
  assert.match(html,/What is still unconfirmed/);
  assert.match(html,/AI assistance/);
});
test("section citations resolve to dated source records and escape labels", () => {
  const original = briefs.events["seoul-international-garden-show-2026"];
  const firstUrl = original.sections[0].sourceUrls[0];
  const brief = {...original, sources: original.sources.map(source => source.url === firstUrl
    ? {...source, sourceName:'Garden <evidence> "record"'} : source)};
  const html = renderVisitorBrief(brief, {esc, publishedAt:"2026-08-06", method:"Documentary comparison."});
  assert.match(html, /Source notes:/);
  assert.match(html, /Garden &lt;evidence> &quot;record&quot;/);
  assert.ok(html.includes('href="' + esc(firstUrl) + '"'));
  const invalid = {...original, sections:[{...original.sections[0], sourceUrls:["https://example.com/unrecorded"]}]};
  assert.ok(briefIssues(invalid, todayString()).includes("section cites an unregistered source"));
  assert.throws(() => renderVisitorBrief(invalid, {esc,publishedAt:"2026-08-06",method:""}), /Unregistered article source/);
});
test("named garden comparisons retain project-specific evidence and separate venues", () => {
  const brief = briefs.events["seoul-international-garden-show-2026"];
  const text = JSON.stringify(brief.sections);
  for (const marker of ["Fluid Woodland Understory Garden", "Garden of Waiting", "Horizon of 30.5 Meters", "October 1–27", "organizer estimates"]) assert.ok(text.includes(marker), marker);
  for (const section of brief.sections.slice(0, 3)) {
    assert.equal(section.sourceUrls.length, 1);
    assert.ok(brief.sources.some(source => source.url === section.sourceUrls[0] && source.checkedAt));
  }
});
test("English palace services stay distinct from ceremony narration and confirmed booking", () => {
  const brief = briefs.events["deoksugung-royal-guard-changing-ceremony-2026"];
  const text = JSON.stringify(brief);
  for (const marker of ["10:45", "13:30", "11:50", "14:50", "first-come", "passport", "not a reserved place", "outdoor guard ceremony itself remains unconfirmed"]) assert.ok(text.includes(marker), marker);
});
test("mask-drama recommendations distinguish non-verbal plot from spoken satire", () => {
  const text = JSON.stringify(briefs.events["andong-maskdance-festival-2026"]);
  for (const marker of ["Gangneung Gwanno", "October 3 at 13:00", "without spoken dialogue", "Bongsan", "October 1 at 15:30", "staged suicide attempt", "full synopsis is context"]) assert.ok(text.includes(marker), marker);
});
test("missing, stale or unsupported release evidence cannot pass", () => {
  const record = read("editorial-release");
  assert.ok(releaseIssues(record, "current", "2026-09-10", () => true).length >= 3);
  const entry = {status:"passed",by:"actual reviewer",date:"2026-09-10",evidencePath:"record.md"};
  const complete = {revisionDate:"2026-09-10",revisionFingerprint:"current",humanEditorialReview:entry,readerTaskCheck:entry,productionVerification:entry};
  assert.deepEqual(releaseIssues(complete, "current", "2026-09-10", () => true), []);
  assert.ok(releaseIssues(complete, "changed", "2026-09-10", () => true).length);
  assert.equal(releaseIssues(complete, "current", "2026-09-10", () => false).length, 3);
});
test("curated edition excludes retired topics without destroying their research", () => {
  assert.ok(!program.indexableEvents.includes("national-geographic-ocean-seoul-2026"));
  assert.ok(!program.indexableGuides.includes("tax-refund-payments-korea-shopping"));
  assert.ok(briefs.events["national-geographic-ocean-seoul-2026"]);
  assert.ok(guides.some(g => g.slug === "tax-refund-payments-korea-shopping"));
  const current = guides.filter(g => program.indexableGuides.includes(g.slug));
  for (const guide of current) assert.doesNotMatch(JSON.stringify(guide), /OCEAN|Toy Story|31\.8 mm|132\.2 mm|106\.2 mm/);
});
test("Seoul comparison names open ceramic galleries and distinguishes materials", () => {
  const guide = guides.find(g => g.slug === "seoul-culture-first-visit");
  const text = JSON.stringify(guide);
  for (const marker of ["Room 303", "Room 304", "white slip", "grey body", "Ichon", "January 28, 2027", "last admission"]) assert.ok(text.includes(marker), marker);
  assert.ok(guide.sources.some(s => s.url.includes("arcId=23711") && s.checkedAt === "2026-09-18"));
});
test("pre-deploy checks do not require a deployment that has not happened yet", () => {
  const entry = {status:"passed",by:"actual reviewer",date:"2026-09-10",evidencePath:"record.md"};
  const record = {revisionDate:"2026-09-10",revisionFingerprint:"current",humanEditorialReview:entry,readerTaskCheck:entry,productionVerification:{status:"not-deployed"}};
  assert.deepEqual(releaseIssues(record, "current", "2026-09-10", () => true, {productionRequired:false}), []);
  assert.ok(releaseIssues(record, "current", "2026-09-10", () => true).length);
});
