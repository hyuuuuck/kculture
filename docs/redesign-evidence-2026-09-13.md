# Whole-site replacement: evidence and implementation contract

Recorded September 13, 2026. This is an implementation brief, not a completed redesign, deployment record or AdSense approval assessment.

## What is actually known

The latest stored authenticated account audit is September 11, 2026, 05:14:59 UTC. It records attention required / low-value content, with the account's last update at August 30, 22:41 KST. No authenticated account refresh was performed for this design task. Google has not disclosed a page-level explanation that proves which design or sentence caused the rejection. The user's report of repeated rejection is not evidence that changing a particular color caused it.

Direct HTTP observations at September 13, 2026, 03:59:44 UTC:

| Evidence | Production /en/ | Local preview /en/ |
| --- | --- | --- |
| HTTP response | 200 | 200 |
| Main heading | Decide what is worth the trip. | Make a culture day in Seoul. |
| Spotlight carousel markup | Present | Present |
| Link to seoul-culture-first-visit | Absent | Present |
| Literal Fresh · checked today text | Five occurrences | None |

These are observations of two different versions. The local September 10 article changes cannot be described as already reflected in the currently observed production homepage. Production's relative freshness claim also needs correction; this design task did not deploy a fix.

## Diagnosis: evidence versus interpretation

| Priority | Observed condition | Visitor consequence / interpretation | Required change |
| --- | --- | --- | --- |
| P0 | Production and local improvements differ | The version we inspect locally is not the version a visitor currently receives | Keep local and production evidence separate; deploy only with authorization and verify the actual artifact afterward |
| P0 | Production contains a relative today claim on September 13 while displaying September 10 source checks | Readers can mistake an old automated check for current verification | Preserve absolute dates; do not advance editorial dates or imply same-day checking |
| P1 | renderHome retains a carousel and equal gallery-card layout | The main experience is browsing inventory, with understanding and selection deferred | Replace the homepage composition with an editorial cultural starting point, then purposeful choices and supporting guides |
| P1 | renderGuides emits every guide both in a grid and a scope ledger | The second listing repeats discovery rather than resolving a new task | One guide index organized around real reader questions, with distinct context once per article |
| P1 | renderGuide opens with summary, quick answer, audience, byline and method before the article | The page explains its process at length before the visitor learns the subject | Lead with the reader's answer and substantive article; retain concise attribution and a reachable evidence area |
| P1 | First-culture guide has a useful comparison but primarily describes a method for choosing | It is not yet a complete, tested cultural day; its limits are correctly disclosed | Bring the existing comparison forward; link exact real experiences; add only source-supported cultural explanations and logistics, not invented walking times |
| P1 | OCEAN explicitly lacks confirmed English captions and overseas checkout; Andong lacks program-specific interpretation and booking details | Important foreign-visitor participation questions remain open despite lengthy prose | Resolve these through actual venue/program evidence where available; otherwise qualify suitability at the decision point, not only at the bottom |
| P1 | Jinju article identifies mixed 2025/2026 operator material | A current date does not make old program tiles current | Maintain edition-specific uncertainty; do not fabricate a complete itinerary or promote unverified programs |
| P2 | Global labels Now and Planner are generic; only English is publicly available but a language control remains | Navigation describes internal features more than reader tasks | Use clear destination/reading/saved-place navigation; do not offer a language choice with no real alternate content |

The consequences above are editorial and UX judgments grounded in the implementation. They are not claims of access to Google's internal review reasoning.

## What the replacement must deliver

1. **Home:** a recognizable English-language Korean culture publication, one meaningful opening story/experience and a clear path to choosing an activity. No automatic carousel as the main explanation, no headline counters as proof of quality.
2. **Guides:** one non-duplicated index. An article begins with the question and answer, then a readable narrative, useful comparisons, Korean names where they help, and dated evidence. No repeated research-method panels presented as additional substance.
3. **Events:** compare the kind of experience and participation constraints. An event article connects cultural context, who it suits, actual supported entry/language information, selected-day caveats and official action links. Keep the six real subjects distinct rather than stretching a generic template.
4. **Calendar and saved places:** clear optional planning tools, preserved storage and calendar exports, truthful empty states. Saving is never represented as booking.
5. **About and policies:** the same visual system, accurate ownership/editorial/AI disclosure, accessible corrections/contact routes and policies matching ads-off behavior.
6. **Desktop first:** strong reading proportions and clear navigation. Narrow-screen protections are included only to avoid broken access; no separate mobile feature project.

## Visual decision status

The earlier question server ended without a recorded answer. Reused the existing seed 5b81c184 and the same direction payload; did not reroll or invent user approval. The replacement question is 85d37114 at http://127.0.0.1:61690/.

Assigned direction: independent cultural programme book, deep violet and amber, broad documentary photography and clear editorial navigation. Alternative cards and the familiar travel-magazine option remain available. Selection is pending. Impeccable requires a visual choice and compositional approval before replacing application templates; this brief does not claim that step is complete.

## Completion and release are separate

- Implementation: all template families replaced, existing functions preserved, approved composition reflected in the actual browser, design review and DESIGN.md complete.
- Integrity: build, links, images, dates, sitemap, schemas and relevant behavior tests pass. These tests do not judge cultural expertise or guarantee original visitor value.
- Editorial evidence: an accountable person reviews the actual article claims and English; a real target reader's task outcome is recorded honestly. These are internal quality controls, not invented Google traffic, word-count or article-count requirements.
- Release: explicit production authorization, then live verification of the same version. A redesign is not automatic authority to deploy, submit another AdSense request or activate ads.

## Official basis checked for this task

- [AdSense eligibility](https://support.google.com/adsense/answer/9724?hl=en): original, high-quality content relevant to an audience.
- [Prepare pages for AdSense](https://support.google.com/adsense/answer/7299563): distinctive useful content, readable layout and clear working navigation. This supports redesigning the experience; it does not say visual polish substitutes for content value.
- [Google Search people-first content guidance](https://developers.google.com/search/docs/fundamentals/creating-helpful-content): substantive value beyond summarization, clear purpose and honest creation methods. This is Search guidance, not a separate AdSense approval checklist.

No approval date, approval guarantee or automatic resubmission is implied.

## September 15 continuation: fresh observations, not a completed redesign

The user's renewed request is a whole-site design replacement and a challenge to the effectiveness of the earlier changes. Do not resume the monitoring heartbeat instead of this task. Do not treat another successful integrity check as proof of solved content value.

Fresh direct HTTP observations, 2026-09-15 01:31:50–01:33:22 UTC:

- Production home: HTTP 200, heading `Decide what is worth the trip.`, carousel present, first-culture guide absent, five literal `Fresh · checked today` strings. The production sitemap returns HTTP 200 with 13 URLs. These counts are observations, not approval thresholds.
- Local port 8766 initially refused the connection. Restarted the existing preview server without rebuilding or changing application code. Local home then returned HTTP 200, heading `Make a culture day in Seoul.`, first-culture guide present, no literal `Fresh · checked today` string. This is the existing local revision, not a newly completed design.
- Production Deoksugung article: HTTP 200; headings foreground `What matters before you go`, `Place, timing, weather`, `What we checked` and `How the official records combine`. A literal `Fresh · checked today` remains. This supports changing the hierarchy; headings alone do not prove that every paragraph lacks cultural substance.
- Production weather guide: HTTP 200; still titled `Korea event weather: what four KMA observation windows actually change`, with four sample-window and verification-sequence sections. Useful supporting material is not the same as a cultural starting article.
- The account JSON's last successful authenticated observation remains September 13: attention required / low-value content. No authenticated account refresh happened in this design task. Google's exact page-level rejection reasoning remains unknown.

### Implementation success conditions

These are our product acceptance criteria, not purported Google requirements:

1. Home gives the actual English-speaking visitor one concrete cultural starting point and its meaningful trade-off before exposing planning tools. No automatic carousel as the principal explanation or article-count badge as proof of quality.
2. Each event article leads with its subject and suitability; admission, language, Korean destination name and time-sensitive uncertainty are reachable without reading a research ledger. Keep authoritative evidence and its true dates available, not deleted.
3. The guide index lists an article once per primary discovery group. Distinct links can recur only for a distinct task. Article narrative is not preceded by stacked summaries of the same promise.
4. The navigation distinguishes experiences, reading and saved places; calendar remains available as a supporting planning tool. Preserve existing URLs, filters, save keys, clear-saved behavior and calendar exports.
5. All public template families share the replacement system, including empty saved states, about, contact and policy pages. Desktop is primary; narrow screens must remain readable and navigable, without a separate mobile feature project.
6. Verify the actual built artifact, not only CSS/source inspection. Record integrity tests and browser checks separately from editorial review and actual target-reader evidence. No fake reviews, tested visits or freshness dates.
7. Deployment, account settings, ad activation and AdSense submission remain outside this design action.

### Visual choice handoff

The previous question server `85d37114` was gone without an answer. Restarted the same payload and seed (no reroll) as `4a15e3f6` at `http://127.0.0.1:61147/`. Codex reported the opening as queued; Safari was opened as a fallback. The question then returned `PAGE CLOSED` with no answer. This is not approval.

Re-presented the same directions using the native asynchronous question panel. Its leading option explicitly offers delegation of the cultural-programme direction and full local implementation, excluding deployment and resubmission. At the time of this note, no answer is recorded. If delegated, generate and inspect the three required composition probes and record the delegated selection honestly before application code. Otherwise follow the chosen direction and its composition approval. Do not claim a new site has been built merely because the existing preview is running.
