export function renderVisitorBrief(brief, { esc, publishedAt, method }) {
  const sources = new Map(brief.sources.map(source => [source.url, source]));
  return `<section class="detail-section event-review-section visitor-brief" aria-labelledby="event-review-title">
    <h2 id="event-review-title">${esc(brief.question)}</h2>
    <p class="event-decision">${esc(brief.answer)}</p>
    <div class="visitor-narrative">${brief.sections.map((section) => `<div>
      <h3>${esc(section.heading)}</h3>
      ${section.paragraphs.map((paragraph) => `<p>${esc(paragraph)}</p>`).join("")}
      ${section.sourceUrls?.length ? `<p class="review-update-note">Source notes: ${section.sourceUrls.map(url => {
        const source = sources.get(url);
        if (!source) throw new Error(`Unregistered article source: ${url}`);
        return `<a href="${esc(url)}" rel="nofollow noopener" target="_blank">${esc(source.sourceName || new URL(url).hostname)}</a>`;
      }).join(" · ")}</p>` : ""}
    </div>`).join("")}</div>
    <h3>Taking part as an international visitor</h3>
    <dl class="participation-facts">${brief.participation.map((item) => `<div><dt>${esc(item.label)}</dt><dd>${esc(item.value)}</dd></div>`).join("")}</dl>
    <div class="visitor-boundary"><h3>What is still unconfirmed</h3><ul>${brief.unresolved.map((item) => `<li>${esc(item)}</li>`).join("")}</ul></div>
    <p class="review-update-note"><strong>Revision scope</strong> Cultural context, participation conditions and a practical choice. Source checks below identify which claims were rechecked; other facts retain their earlier evidence date.</p>
    <p class="review-byline">First published ${esc(publishedAt)}. Text revised ${esc(brief.updatedAt)} with AI assistance for <a href="/en/about/">K-Spot Now Editorial Desk</a>. ${esc(method)}</p>
  </section>`;
}

export function renderVisitorEvidence(brief, evidence, { esc, dates, monitoredAt }) {
  const checks = new Map(brief.sources.map((source) => [source.url, source]));
  const sources = new Map(evidence.map((item) => [item.url, item]));
  for (const check of brief.sources) if (!sources.has(check.url)) sources.set(check.url, check);
  return `<section class="detail-section event-evidence-section" aria-labelledby="event-evidence-title">
    <h2 id="event-evidence-title">Sources and verification limits</h2>
    <p>Published ${esc(dates.publishedAt)} · Updated ${esc(dates.updatedAt)}. Automated source monitoring: ${esc(monitoredAt || "not recorded")}.</p>
    <p>Monitoring checks selected source text. It does not renew the article's editorial date, confirm ticket stock or constitute a field visit.</p>
    <details class="source-record"><summary>Read the evidence for this article</summary>
      <div class="evidence-list">${[...sources.values()].map((item) => {
        const check = checks.get(item.url);
        return `<article><a href="${esc(item.url)}" rel="nofollow noopener" target="_blank">${esc(item.sourceName || new URL(item.url).hostname)}</a>
          <p>${esc(check?.supports || item.supports || item.role || "Source record")}</p>
          <p>${check ? `Read for this revision: ${esc(check.checkedAt)}.` : "Retained source evidence; not independently rechecked in this text revision."}</p></article>`;
      }).join("")}</div>
    </details>
  </section>`;
}
