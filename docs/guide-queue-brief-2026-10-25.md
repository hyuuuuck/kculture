# Scheduled guide brief (2026-10-25)

These guides are written now and published automatically on their `publishOn` date (KST) by the source-refresh bot. Every fact must still be true on that date, so date-sensitive facts (festival dates, seasonal hours, foliage timing) must be checked against official sources today and written to stay correct for the publish date.

Follow every rule in `docs/guide-writing-brief-2026-10-19.md` (reader, meaning/judgment/execution, hard rules, banned phrases, no first-person visits, no hedging boilerplate, Hangul + romanization, length 1,800–2,600 words, 6–10 sections, at most 2 tables/checklists). Read `data/guides.json` first: do not contradict published guides, reuse their verified facts and sources where relevant, and cross-link 3–4 existing published slugs in `relatedGuideSlugs` (only slugs listed in `data/editorial-program.json` `indexableGuides`).

Output one JSON file per guide at `data/guide-drafts/<slug>.json` using the brief's schema plus these extra keys:

```json
{
  "seo": { "seoTitle": "45–62 chars, exact search phrase first, no site name", "seoDescription": "140–158 chars, starts with the most useful fact" },
  "imageCandidates": [ { "commonsFile": "File:...", "why": "...", "license": "..." } ],
  "inlineImageCandidates": [
    { "commonsFile": "File:...", "afterSectionHeading": "exact heading from sections.en", "caption": "8–20 words, factual", "license": "...", "artist": "..." }
  ]
}
```

- `imageCandidates`: 2 hero options; `inlineImageCandidates`: 2 photos placed after two different sections (about one third and two thirds through). Wikimedia Commons only, CC0 / public domain / CC BY / CC BY-SA, photographs ≥1200 px wide, landscape. Check each with the Commons API from Bash (`curl` with header `User-Agent: kspotnow-editorial/1.0 (https://kspotnow.com)`, `sleep 2` between calls): `https://commons.wikimedia.org/w/api.php?action=query&prop=imageinfo&iiprop=size|extmetadata&format=json&titles=File:<name>`; search with `list=search&srnamespace=6&srsearch=<terms>`. Do not reuse any file listed in `data/guide-images.json` or `data/guide-inline-images.json`.
- Set `publishedAt` and `updatedAt` to the publish date given in your task; source `checkedAt` = today (2026-10-25).
- Validate each file with `python3 -c "import json,sys; json.load(open(sys.argv[1]))" <file>`.
- Do not edit any other file.
