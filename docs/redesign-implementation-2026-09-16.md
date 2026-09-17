# Programme redesign — local implementation

Date: 2026-09-16. Scope: the user selected composition A (`programme-cover`) and authorized the full local website implementation with “가자”. No production deployment, account change, advertising activation, commit, push or AdSense submission was performed.

## What changed

- Replaced the accumulated stylesheet with one programme-publication system: violet and amber cover, self-hosted Roboto Condensed/Public Sans, white reading surfaces and consistent native controls.
- Replaced the carousel home with an explanatory cover, a cultural-choice spread, practical links, destination-separated experiences and supporting reading.
- Experiences appear once in the searchable/filterable index. The duplicated decision-board inventory was removed.
- Guide index has one lead and distinct supporting articles. Guide narratives, evidence tables, dates, sources and limitations remain intact; the article has a readable TOC and measure.
- Event articles lead with the actual experience and retain participation conditions, practical planning, source limits and a separate essentials column. Images/posters retain their proportions.
- Saved places, calendar, About, contact and all policy pages use the same visual system. Saved-browser key, maps, date export, privacy text, source links and ads-off state are preserved.
- Retired carousel JavaScript was removed. The empty saved state disables download/clear controls and supplies a no-JavaScript alternative.

## Evidence and limits

| Check | Result | Evidence |
| --- | --- | --- |
| Local build | PASS | 6 published experience articles and 4 guides. Counts describe the build; they are not quality or approval thresholds. |
| Editorial and planner unit tests | PASS | 12 tests, including preserved dates, escaped text, empty calendar behavior and exclusive ICS end dates. |
| Internal links and images | PASS | 24 generated HTML files; image signatures and thumbnail audit. |
| Article preservation | PASS | All current event narratives, participation facts and guide sections retained. Structural integrity is not a certificate of originality or usefulness. |
| Calendar, sitemap, JSON-LD, publication/UX structure | PASS | 6 event calendar entries; 14 sitemap URLs; the selected shell and article semantics. |
| Desktop browser | PASS | 1280px views for home, experiences, guide index/article, event, saved places, calendar, policy and About; no horizontal overflow or failed loaded image. Captures: `.impeccable/screenshots/programme/`. |
| Narrow-screen safety | PASS | 390px home, guide, event, planner, calendar and privacy views: no document overflow. This is not a separate mobile redesign. |
| Filter and save interactions | PASS | Seoul = 3; Seoul + upcoming = 0 with useful recovery; Andong search = 1; save persists into planner; test item removed, pre-existing saved item preserved. |
| Empty planner | PASS | Separate local origin showed empty explanation and disabled download/clear controls. |
| Saved ICS file delivery | PASS in Safari | Safari completed `kspotnow-saved-events.ics` (605 bytes) from the saved Deoksugung item. Only the test save was removed afterward. The in-app browser's download-event observer timed out; Safari provides the native delivery evidence. Calendar bytes and click dispatch also pass unit tests. |
| UI detector | PASS | One detector run over changed UI returned `[]`. |
| Remote event audit | FAIL | Jinju operator URL returned HTTP 200 but no longer matched four recorded tokens: `10월 03일`, `10월 18일`, `18:00`, `Jinju Fortress`. Audit output: `data/feeds/event-audit-2026-09-16.json`. Do not silently weaken assertions or renew evidence dates. |
| Editorial release | NOT READY | Current revision differs from saved release fingerprint; human editorial review and real reader task check remain pending; production verification is not deployed. |

`npm run verify` reaches the final remote event-audit stage and fails there. It is not an all-green release.

## Images and honesty

The cover uses a real Seoul Metropolitan Government 2020 archive photo, with an adjacent date/source credit and documented reuse permission. It does not pretend to document a 2026 field visit. Existing garden imagery is labeled as a 2025 reference image; the Andong visual is labeled as a venue illustration, not a performance photograph. Two researched replacement photos have unconfirmed reuse rights and are not referenced by the templates. See `.impeccable/assets-manifest-2026-09-16.md`.

## Outstanding before any release recommendation

1. Reconcile the Jinju operator source and date/time/location claims with current official evidence. Review current-event freshness warnings rather than relabeling them as checked today.
2. Have a responsible human review claim accuracy, English clarity and cultural interpretation; record an actual target-reader task and resulting changes.
3. Only after explicit deployment authorization, verify the same revision on the production domain and separately check AdSense ownership, public ads.txt and privacy/CMP behavior. This redesign is not evidence of approval eligibility.

## Independent finish review

The first independent review returned **FIX**, with three material changes. All three were implemented as one bounded batch. The same independent reviewer then returned **SHIP** for local design finish, with no material regressions visible in the supplied recaptures.

| Review finding | Resolution | Evidence |
| --- | --- | --- |
| Opening too tall | Resolved: reduced masthead, cover and spread spacing without reducing body type. | `home-1536-review1.png` contains the cover, complete decision spread and utility strip. `home-1280-review1.png` exposes meaningful supporting content. |
| Metadata above titles | Resolved: event, shared experience cards, saved items and starter links place metadata after the title. | `event-review1.png`, `planner-review1.png` and the shared template. |
| Navigation hit areas | Resolved: primary and policy links use 44px minimum height and reflow. | `policy-mobile-review1.png`, `home-mobile-review1.png`; every measured navigation target is 44px and document width remains 390px. |

The verdict covers local visual finish, not production or AdSense readiness. Root `DESIGN.md` and `.impeccable/design.json` describe the actual implemented system; editorial-release blockers above remain in force.
