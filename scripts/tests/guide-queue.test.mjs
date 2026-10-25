import test from "node:test";
import assert from "node:assert/strict";
import { dueQueueItems, queueIssues, releaseDueGuides } from "../lib/guide-queue.mjs";

const guide = (slug) => ({
  slug,
  title: { en: "Title" },
  summary: { en: "Summary" },
  sections: { en: [{ heading: "H", paragraphs: ["P"] }] },
  image: { src: "/assets/guides/x.jpg", alt: "Alt", license: "CC0" },
  sources: [{ url: "https://example.org", checkedAt: "2026-10-25" }]
});
const item = (slug, publishOn) => ({ publishOn, guide: guide(slug), seo: { seoTitle: "T", seoDescription: "D" }, inlineImages: [{ src: "/a.jpg" }] });

test("queued guides stay private until their publication date", () => {
  const queue = { items: [item("a", "2026-10-28"), item("b", "2026-11-01")] };
  assert.deepEqual(dueQueueItems(queue, "2026-10-27"), []);
  assert.deepEqual(dueQueueItems(queue, "2026-10-28").map((entry) => entry.guide.slug), ["a"]);
});

test("release uses the real publication date and removes the item from the queue", () => {
  const queue = { items: [item("a", "2026-10-28"), item("b", "2026-11-01")] };
  const result = releaseDueGuides({ queue, guides: [], program: { indexableGuides: [] }, seo: {}, inlineImages: {}, today: "2026-10-29" });
  assert.deepEqual(result.published, ["a"]);
  assert.equal(result.guides[0].publishedAt, "2026-10-29");
  assert.equal(result.guides[0].updatedAt, "2026-10-29");
  assert.deepEqual(result.program.indexableGuides, ["a"]);
  assert.deepEqual(result.queue.items.map((entry) => entry.guide.slug), ["b"]);
  assert.ok(result.seo.a && result.inlineImages.a);
});

test("a released guide joins the dated notices it names", () => {
  const queue = { items: [{ ...item("a", "2026-10-28"), attachNotices: ["free"] }] };
  const notices = { notices: [{ id: "free", guides: ["x"] }, { id: "other", guides: ["y"] }] };
  const result = releaseDueGuides({ queue, guides: [], program: { indexableGuides: [] }, seo: {}, inlineImages: {}, notices, today: "2026-10-28" });
  assert.deepEqual(result.notices.notices[0].guides, ["x", "a"]);
  assert.deepEqual(result.notices.notices[1].guides, ["y"]);
  assert.deepEqual(notices.notices[0].guides, ["x"]);
  assert.ok(queueIssues({ items: [{ ...item("b", "2026-10-28"), attachNotices: ["missing"] }] }, [], "2026-10-25", new Set(["free"])).some((issue) => issue.includes("unknown notice")));
});

test("invalid or duplicate queue entries are reported", () => {
  const bad = { items: [item("a", "28-10-2026"), item("a", "2026-10-28"), { publishOn: "2026-10-28", guide: { slug: "c" } }] };
  const issues = queueIssues(bad, [guide("a")], "2026-10-25");
  assert.ok(issues.some((issue) => issue.includes("publishOn")));
  assert.ok(issues.some((issue) => issue.includes("queued twice")));
  assert.ok(issues.some((issue) => issue.includes("already published")));
  assert.ok(issues.some((issue) => issue.startsWith("c:")));
});
