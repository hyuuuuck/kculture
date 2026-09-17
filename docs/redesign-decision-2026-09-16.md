# Whole-site redesign — September 16 decision package

Status: user approved composition A (`programme-cover`) with “가자”; the full local implementation is recorded in `redesign-implementation-2026-09-16.md`. This is not a deployment, editorial approval or AdSense readiness declaration.

## Evidence and diagnosis

The saved authenticated AdSense observation at 2026-09-16T04:16:41Z records attention required / low-value content, an account update of August 30, and ads.txt not found. It does not identify an offending article or prove that typography caused rejection. This design task did not submit a review or change account settings.

Fresh browser inspection of production on September 16 showed:

- Home heading: `Decide what is worth the trip.`
- The primary promise concerns comparing sources and checking rules, followed by a carousel and inventory counts. Cultural understanding is not the primary visible proposition.
- Five event cards display `Sep 13, 2026` beside `Fresh · checked today`. On September 16, that relative freshness statement is inaccurate.
- Three supporting guides concern verification, weather and shopping. The local first-culture guide is not in the live home.

The existing local preview initially refused the connection. It was restarted without rebuilding or replacing application files. An HTTP check at 2026-09-16T07:47:18Z confirmed the existing local heading `Make a culture day in Seoul.`, the first-culture guide link, no literal `Fresh · checked today`, and the retained carousel. This is evidence of different versions, not a newly implemented redesign.

Source inspection confirms that `renderGuides` lists each guide in both a card grid and a scope ledger. `renderGuide` puts summary, quick answer, audience, byline and method before article sections. The design makes the process and repetition conspicuous without necessarily supplying more useful explanation.

The local visitor briefs already contain some substantive comparisons: gate ceremony versus palace admission, independent garden QR interpretation versus a hosted program, and an exhibition price calculation. Preserve those improvements. Their existence in local files is not proof that production contains them or that a target reader can complete a visit plan.

### What this means — judgment, not Google's disclosed reasoning

1. The product needs to earn a distinct reason to read it beyond official listings: explain a cultural experience, compare a real choice, then give supported participation information.
2. More cards, badges, words or indexed URLs cannot establish that value. Technical integrity and reader value require separate evidence.
3. Source transparency is necessary but should support the article, not become the article's repeated subject. Keep honest limitations close to the decision they affect.
4. Public-data records can substantiate facts but cannot prove onsite English support, overseas checkout success, a field visit or a human review.
5. The account's ads.txt/ownership discrepancy is a separate technical problem; correcting it would not prove the low-value-content issue solved.

Google's official AdSense guidance was reread for this task: [eligibility](https://support.google.com/adsense/answer/9724?hl=en) and [prepare your pages](https://support.google.com/adsense/answer/7299563?hl=en). It asks for original relevant content and usable navigation; it does not prescribe our page count or Search Console thresholds. The exact page-level rejection cause remains unconfirmed.

## Direction and three actual compositions

Continue the existing direction seed `5b81c184`, assigned index 4: independent cultural programme publication. No reroll and no invented prior approval. Deep violet, amber, white and pale lavender; documentary images; strong readable grotesk type; precise programme navigation. Desktop is primary, with basic narrow-screen access retained.

Built-in image generation produced all three 1536×1024 desktop comps. Each prompt is preserved in the image metadata and adjacent JSON sidecar. The selected `programme-cover.json` now records the user's approval; the other two remain unapproved alternatives.

| Probe | File | Structure | Trade-off |
| --- | --- | --- | --- |
| A — programme cover, recommended | `.impeccable/mocks/programme-cover.png` | Large Seoul starting question and CTA beside a broad cultural image; meaningful choices below | Clear first action and a reusable reading hierarchy; the real lead must be more specific than generic travel marketing |
| B — programme spread | `.impeccable/mocks/programme-spread.png` | Topic rail, large central reading feature, secondary culture choices | More information visible, but rail items must not become thin new category pages |
| C — question-led programme | `.impeccable/mocks/programme-question.png` | Compare two real experience types immediately, then read their context | Strong comparison; less explicit single starting action and less room for the lead explanation |

The recommendation is an editorial/UX judgment, not a forecast of AdSense approval. The user selected A and authorized whole-site local implementation with “가자”. The selected sidecar and implementation record preserve that decision.

### Do not literalize the generated comps

- Photos are synthetic concept imagery, not evidence, fieldwork or licensed production photographs. Use documented real project assets or separately verified rights.
- Generated paragraphs are not approved copy. Preserve source-supported article facts and their dates. Do not publish generated historical interpretations without verification.
- A's lower heading mentions lanterns while the generated text discusses Busan drones: replace with the appropriate real subject rather than copying this inconsistency.
- Do not add the comps' decorative search icon unless functional search is actually in scope and built. No dead control.
- B's invented extra topic links cannot create unsupported categories or nonexistent articles.
- Do not infer booking, narration, access, opening times or personal experience from any comp.
- Navigation and body copy remain semantic HTML, not rasterized UI.

## Whole-site implementation contract after selection

| Template family | Required change | Evidence of completion |
| --- | --- | --- |
| Shared shell | Programme masthead, clear Experiences / Culture guides / Calendar / Saved places / About navigation; remove single-language chooser | Every public template uses the same system; links and keyboard focus work |
| Home | One cultural starting point, concrete comparison, supporting reading; no principal automatic carousel or quality counters | A reader identifies what to read and what choice it resolves without opening a research ledger |
| Experience index | Distinguish experience type, destination and participation constraints | Useful comparison without duplicate inventory blocks or unsupported live availability |
| Event article | Lead with cultural subject and suitability; accessible entry, language, Korean place name, date exceptions; evidence at the end | Claims match records; uncertainty appears at the relevant decision; article is readable rather than stacked verification panels |
| Guide index | One primary listing per guide, grouped by real reader question | No grid/ledger duplication; supporting weather and shopping do not displace cultural purpose |
| Guide article | Answer and narrative first; restrained attribution; reachable evidence and sources | Preserve substantive sections and working anchors without repetitive prefatory panels |
| Calendar and saved places | Supporting planning tools within the same grammar | Existing saves, clear/hide actions, dates and calendar exports continue to work; saving never implies booking |
| About, contact and policies | Legible editorial layout; accurate ownership, AI assistance, corrections and ads-off disclosure | Real contact links and policy behavior agree; no invented staff or human review |

Rebuild the presentation coherently rather than append another override stack. Preserve routes, sourced data, semantic structure, ads-off behavior, privacy boundaries and the dirty worktree. Current and closed events must not be conflated. Keep absolute evidence dates separate from automated monitoring dates.

## Verification and release boundaries

- Build and integrity checks test links, dates, images, sitemap, structured data and behavior. They are not an editorial approval certificate.
- Inspect the built representative home, index, event, guide, saved-state and policy pages at desktop size; include one basic narrow-screen protection pass. No separate mobile feature project.
- Record an actual responsible editorial review and target-reader task outcome honestly. Existing pending records must not be marked passed by the model's own assertion.
- Production deployment, review submission, ownership selection and advertising changes require separate explicit authorization. They have not occurred here.
- Impeccable's composition checkpoint was satisfied by the user's selection of A before application-code replacement. The local redesign is implemented; independent finish review and DESIGN.md record the built world, while editorial and production-release checks remain separate.
