// Dated visit notices (data/notices.json): time-limited facts kept out of guide body text.
const isoDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value || "")) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));

// Notices still worth showing on `today` (KST date string): anything that has not ended yet, soonest to end first.
export function activeNotices(notices, today) {
  return (Array.isArray(notices) ? notices : [])
    .filter((notice) => isoDate(notice?.start) && isoDate(notice?.end) && notice.end >= today)
    .sort((a, b) => a.end.localeCompare(b.end) || a.start.localeCompare(b.start));
}

export function noticeStatus(notice, today) {
  return today < notice.start ? "upcoming" : "now";
}

export function noticesForGuide(notices, slug) {
  return notices.filter((notice) => (notice.guides || []).includes(slug));
}

export function noticeIssues(data, guideSlugs, today) {
  const errors = [];
  const warnings = [];
  const notices = data?.notices;
  if (!Array.isArray(notices)) return { errors: ["notices.json needs a notices array"], warnings };
  const ids = new Set();
  for (const notice of notices) {
    const id = notice?.id || "(missing id)";
    if (!notice?.id || ids.has(notice.id)) errors.push(`${id}: notice needs a unique id`);
    ids.add(notice?.id);
    if (!isoDate(notice?.start) || !isoDate(notice?.end) || notice.start > notice.end) errors.push(`${id}: start and end must be YYYY-MM-DD with start <= end`);
    if (String(notice?.title || "").trim().length < 10) errors.push(`${id}: notice needs a title`);
    if (String(notice?.text || "").trim().length < 60) errors.push(`${id}: notice needs a substantial text`);
    if (!/^https:\/\//.test(notice?.source?.url || "") || !String(notice?.source?.name || "").trim()) errors.push(`${id}: notice needs a named https source`);
    if (!isoDate(notice?.checkedAt) || notice.checkedAt > today) errors.push(`${id}: notice needs a non-future checkedAt date`);
    const targets = notice?.guides || [];
    if (!Array.isArray(targets) || (!targets.length && !notice?.home)) errors.push(`${id}: notice must target a guide or the home page`);
    for (const slug of Array.isArray(targets) ? targets : []) if (!guideSlugs.has(slug)) errors.push(`${id}: unknown guide ${slug}`);
    if (notice?.homeLink && !guideSlugs.has(notice.homeLink)) errors.push(`${id}: unknown homeLink ${notice.homeLink}`);
    if (isoDate(notice?.end) && notice.end < today) warnings.push(`${id}: ended ${notice.end}; no longer shown, remove it when convenient`);
  }
  return { errors, warnings };
}
