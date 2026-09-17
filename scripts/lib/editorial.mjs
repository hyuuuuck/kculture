// Structural integrity helpers; none of these functions certify editorial value.
export function publicationDates(event, review = {}, brief = {}) {
  const publishedAt = review.publishedAt || event.publishedAt || review.reviewedAt || event.lastChecked;
  const updatedAt = [publishedAt, review.updatedAt, event.updatedAt, review.reviewedAt, brief.updatedAt]
    .filter((value) => /^\d{4}-\d{2}-\d{2}$/.test(value || ""))
    .sort().at(-1) || publishedAt;
  return { publishedAt, updatedAt };
}

export function sourceCheckDate(event) {
  return event.sourceCheckedAt || event.lastChecked;
}

export function nearbyAlternatives(event, candidates) {
  // A different city is not a practical fallback for a cancelled visit.
  return candidates.filter((candidate) => candidate.slug !== event.slug && candidate.city === event.city);
}

export function searchObservation(audit) {
  const reportDate = audit.coverage?.reportUpdatedAt;
  const deployedDate = audit.cleanup?.deployedAt?.slice(0, 10);
  const relation = !reportDate || !deployedDate ? "date comparison unavailable"
    : reportDate < deployedDate ? "before the recorded deployment" : "on or after the recorded deployment";
  return `Coverage: ${reportDate || "unknown"} (${relation}); sitemap: ${audit.sitemap?.status || "unknown"}, ${audit.sitemap?.discoveredPages ?? "?"} URLs. Search observations do not certify AdSense content quality.`;
}
