// Scheduled publication for guides that were written, fact-checked and approved in advance.
// A queued guide is released on its publishOn date (KST) with that date as its real
// publication date; nothing in the queue is public before then.

export function dueQueueItems(queue, today) {
  return (queue.items || []).filter((item) => item.publishOn && item.publishOn <= today);
}

export function queueIssues(queue, guides, today, noticeIds = null) {
  const issues = [];
  const existing = new Set(guides.map((guide) => guide.slug));
  const seen = new Set();
  for (const item of queue.items || []) {
    const slug = item.guide?.slug;
    if (!slug) { issues.push("queued guide is missing a slug"); continue; }
    if (seen.has(slug)) issues.push(`${slug}: queued twice`);
    seen.add(slug);
    if (existing.has(slug)) issues.push(`${slug}: already published but still queued`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(item.publishOn || "")) issues.push(`${slug}: publishOn must be YYYY-MM-DD`);
    if (!item.guide.title?.en || !item.guide.summary?.en || !item.guide.sections?.en?.length) issues.push(`${slug}: incomplete guide body`);
    if (!item.guide.image?.src || !item.guide.image?.alt || !item.guide.image?.license) issues.push(`${slug}: hero image needs src, alt and license`);
    if (!item.seo?.seoTitle || !item.seo?.seoDescription) issues.push(`${slug}: missing search title or description`);
    for (const id of item.attachNotices || []) {
      if (noticeIds && !noticeIds.has(id)) issues.push(`${slug}: attachNotices names an unknown notice ${id}`);
    }
    for (const source of item.guide.sources || []) {
      if (!source.checkedAt || source.checkedAt > today) issues.push(`${slug}: source checkedAt must not be in the future`);
    }
  }
  return issues;
}

export function releaseDueGuides({ queue, guides, program, seo, inlineImages, notices = null, today }) {
  const due = dueQueueItems(queue, today);
  if (!due.length) return { published: [], queue, guides, program, seo, inlineImages, notices };
  const published = [];
  const nextGuides = [...guides];
  const nextProgram = { ...program, indexableGuides: [...program.indexableGuides] };
  const nextSeo = { ...seo };
  const nextInline = { ...inlineImages };
  const nextNotices = notices ? { ...notices, notices: (notices.notices || []).map((notice) => ({ ...notice, guides: [...(notice.guides || [])] })) } : notices;
  for (const item of due) {
    const guide = { ...item.guide, publishedAt: today, updatedAt: today };
    nextGuides.push(guide);
    if (!nextProgram.indexableGuides.includes(guide.slug)) nextProgram.indexableGuides.push(guide.slug);
    nextSeo[guide.slug] = item.seo;
    if (item.inlineImages?.length) nextInline[guide.slug] = item.inlineImages;
    // Dated notices that already exist can name a queued guide; it joins them on release.
    for (const notice of nextNotices?.notices || []) {
      if ((item.attachNotices || []).includes(notice.id) && !notice.guides.includes(guide.slug)) notice.guides.push(guide.slug);
    }
    published.push(guide.slug);
  }
  nextProgram.staticUpdatedAt = { ...(program.staticUpdatedAt || {}), "/en/guides/": today };
  const remaining = (queue.items || []).filter((item) => !published.includes(item.guide.slug));
  return { published, queue: { ...queue, items: remaining }, guides: nextGuides, program: nextProgram, seo: nextSeo, inlineImages: nextInline, notices: nextNotices };
}
