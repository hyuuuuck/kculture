# K-Spot Now — evergreen guide writing brief (2026-10-19)

## Why this exists

kspotnow.com has been rejected by AdSense for "low value content" repeatedly. The live site has only six real articles, most tied to short-lived events, and the copy repeatedly undermines itself ("not a walked itinerary", "we have not verified..."). We are building a library of **evergreen, deep, genuinely useful English guides to Korean culture for first-time independent visitors to Seoul**. Each article must be something a traveller would bookmark because it explains more, and more usefully, than the official page or a generic listicle.

## Reader

An English-speaking adult on a first or second trip to Seoul, curious about Korean culture, planning independently (no tour group). They want to understand what they are looking at, decide whether it suits them, and actually do it without embarrassment or wasted time.

## Every article must deliver

1. **Meaning** — the cultural or historical significance, explained concretely (names, dates, symbols, how it is used by Koreans today). Supported by sources; never invented.
2. **Judgment** — who it suits, who should skip it, what to prioritise, common mistakes, how it compares with alternatives. This is our original contribution. State it plainly and confidently.
3. **Practical execution** — Korean names in Hangul with romanization, how to get there (station/line/exit only if verified), hours, closing days, fees, booking rules, timing, etiquette. Only facts verified today against an official or authoritative source.
4. **A worked example** where it helps — e.g. a sample 3-hour visit with times, an ordering sequence, a phrase set.

## Hard rules (non-negotiable)

- **Verify facts now.** Use WebSearch and WebFetch. Hours, fees, closing days, booking rules, station exits, dates, rules (e.g. Bukchon visiting hours, hanbok free admission) must come from an official source (e.g. royal.khs.go.kr, english.visitkorea.or.kr, english.seoul.go.kr, museum.go.kr, gugak.go.kr, templestay.com, heritage.go.kr / khs.go.kr, korea.net, a venue's own site) fetched today. If you cannot verify a volatile fact, leave it out or tell the reader exactly where to check it — do not guess.
- **Never claim first-hand experience.** No "when I visited", "we tried", "our favourite stall". Write as a knowledgeable editor addressing "you". Do not fabricate quotes, reviews, prices or people.
- **No self-undermining boilerplate.** Do not repeat "this is not a walked itinerary", "we have not verified", "not a promise". One honest `method` line covers that.
- **No copying.** Do not reproduce sentences from sources or other sites. Synthesize and explain in your own words. No song lyrics.
- **No AI clichés.** Banned: nestled, vibrant, tapestry, bustling, hidden gem, delve, embark, a must-visit, whether you're a ... or a ..., in today's world, unlock, elevate, immerse yourself, rich history and culture, feast for the senses. Avoid em-dash overuse (max ~1 per 150 words). American English spelling.
- **Not templated.** Your articles must not share a section skeleton. Headings must be specific to the topic ("Why the throne hall faces south", not "History" / "Tips" / "Conclusion"). No "Conclusion" section.
- **Length:** 1,700–2,600 words across `sections` paragraphs (excluding FAQ, key facts, sources). Paragraphs 40–130 words. 6–10 sections. Tables/checklists only where they truly help (at most 2 per article).
- **Korean terms:** Hangul + romanization on first use, e.g. 경복궁 (Gyeongbokgung). Give the exact Korean search term readers should type into Naver Map/Kakao Map where relevant.
- **Honest limits** belong inline and briefly where they matter ("Opening hours shorten in winter; check the palace site before you go"), not as a refrain.

## Output format

Write ONE JSON file per article to `/Users/sh/Documents/딸깍kspot/data/guide-drafts/<slug>.json` (UTF-8, 2-space indent). Validate each with `python3 -c "import json,sys; json.load(open(sys.argv[1]))" <file>`. Schema:

```json
{
  "slug": "gyeongbokgung-palace-guide",
  "category": "palaces-history",
  "title": { "en": "Specific, useful title (55–75 chars ideal)" },
  "summary": { "en": "Meta description, 140–170 chars, concrete." },
  "publishedAt": "2026-10-19",
  "updatedAt": "2026-10-19",
  "reviewedBy": "K-Spot Now Editorial Desk",
  "audience": "One sentence: who this guide is for.",
  "method": "Researched from the official sources listed below, checked on October 19, 2026. Hours, fees and booking rules can change; the linked official pages are the final word.",
  "quickAnswer": "2–3 sentences that answer the reader's core question directly.",
  "keyFacts": [
    { "label": "Korean name", "value": "경복궁 (Gyeongbokgung)" },
    { "label": "Closed", "value": "Tuesdays" }
  ],
  "sections": { "en": [
    { "heading": "Specific heading", "paragraphs": ["...", "..."] },
    { "heading": "...", "paragraphs": ["..."], "table": { "headers": ["A","B","C"], "rows": [["..","..",".."]] } },
    { "heading": "...", "paragraphs": ["..."], "checklist": ["...", "..."] }
  ] },
  "faq": [ { "q": "Real question a visitor asks?", "a": "Direct answer, 30–90 words." } ],
  "relatedGuideSlugs": ["slug-from-master-list"],
  "sources": [
    { "name": "Publisher — page", "url": "https://...", "note": "What this source supports in the article.", "checkedAt": "2026-10-19" }
  ],
  "imageCandidates": [
    { "commonsFile": "File:Exact_name_on_Wikimedia_Commons.jpg", "why": "what it shows", "license": "as stated on Commons" }
  ],
  "unverified": ["Anything you wanted to say but could not verify (internal note, not published)."]
}
```

- `keyFacts`: 5–8 items, verified, short values.
- `faq`: 4–6 items, not repeating section text verbatim.
- `sources`: 4–10, official/authoritative first. Every volatile fact in the text must be supported by one of them.
- `relatedGuideSlugs`: 2–4 slugs from the master list below.
- `imageCandidates`: 2 candidates from Wikimedia Commons that are CC0, public domain, CC BY or CC BY-SA, showing the actual subject, landscape, at least 1600px wide. Check the file page for license. No people as the main subject in close-up.

## Categories

`palaces-history`, `traditions`, `food-drink`, `museums-arts`, `neighborhoods`, `practical`

## Master list of guides (for cross-linking)

Existing: `seoul-culture-first-visit` (choosing Deoksugung / Seoul Forest gardens / National Museum ceramics for a first culture day), `weather-for-korea-events`, `how-to-verify-korea-popups`. Existing event page: `deoksugung-royal-guard-changing-ceremony-2026`.

New:
- palaces-history: `gyeongbokgung-palace-guide`, `changdeokgung-huwon-secret-garden`, `seoul-five-grand-palaces-compared`, `jongmyo-shrine-guide`
- traditions: `hanbok-rental-palace-guide`, `seoul-buddhist-temples-templestay`, `jjimjilbang-etiquette-guide`, `korean-etiquette-for-visitors`
- food-drink: `korean-table-manners`, `gwangjang-market-food-guide`, `korean-bbq-ordering-guide`, `makgeolli-soju-traditional-liquor`
- museums-arts: `national-museum-of-korea-guide`, `national-folk-museum-of-korea-guide`, `korean-traditional-performances-seoul`, `korean-tea-culture-seoul`
- neighborhoods: `bukchon-hanok-village-guide`, `insadong-ikseondong-guide`, `seochon-neighborhood-walk`, `namsangol-hanok-village-namsan`
- practical: `seoul-subway-tmoney-guide`, `naver-map-kakao-map-korea`, `korean-holidays-seollal-chuseok-travel`, `korean-phrases-for-cultural-visits`
