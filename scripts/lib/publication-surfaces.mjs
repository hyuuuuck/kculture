// Structural publication checks, not editorial quality or approval scores.
function articles(html) {
  return [...String(html).matchAll(/<article\b([^>]*)>([\s\S]*?)<\/article>/g)]
    .map(([, attributes, body]) => ({ attributes, body }));
}
function hasClass(attributes, name) {
  return (attributes.match(/\bclass="([^"]*)"/)?.[1] || "").split(/\s+/).includes(name);
}
export function experienceIndexIssues(html, events) {
  const cards = articles(html).filter(card => hasClass(card.attributes, "experience-card"));
  const issues = [];
  if (cards.length !== events.length) issues.push(`Expected ${events.length} experience cards, found ${cards.length}`);
  for (const event of events) {
    const matches = cards.filter(card => card.attributes.includes(`data-visit-slug="${event.slug}"`));
    if (matches.length !== 1) { issues.push(`Missing or duplicate experience: ${event.slug}`); continue; }
    const body = matches[0].body;
    if (!body.includes(`href="/en/events/${event.slug}"`) || !/<h[23]\b/.test(body)
        || !/<p\b[^>]*>[^<]+<\/p>/.test(body) || !body.includes(`data-event-slug="${event.slug}"`)) {
      issues.push(`Missing article link, context or save action: ${event.slug}`);
    }
  }
  return issues;
}
export function guideIndexIssues(html, guides) {
  const section = String(html).match(/<section\b[^>]*class="guide-index"[^>]*>([\s\S]*?)<\/section>/)?.[1] || "";
  const cards = articles(section);
  const issues = [];
  if (!section || cards.length !== guides.length) issues.push(`Expected ${guides.length} guide articles, found ${cards.length}`);
  for (const guide of guides) {
    const matches = cards.filter(card => card.body.includes(`href="/en/guides/${guide.slug}"`));
    if (matches.length !== 1 || !/<h2\b/.test(matches[0]?.body || "") || !/<p\b[^>]*>[^<]+<\/p>/.test(matches[0]?.body || "")) {
      issues.push(`Missing or duplicate guide link and context: ${guide.slug}`);
    }
  }
  return issues;
}
