# K-Spot Now

K-Spot Now is a static, multilingual Korea event and shopping radar for foreign visitors.

It is designed for AdSense readiness, but AdSense approval and monthly revenue are never guaranteed. The structure focuses on official sources, original summaries, clear date ranges, trust pages, calendar browsing, source freshness labels, and review-first automation.

## What It Builds

- Gallery-style event homepage with thumbnails, dates, categories, and status labels
- Event detail pages with official source links, last-checked date, schedule-month previous-year weather planning notes, and nearby travel ideas
- A `/now/` page for live, ending-soon, newly checked, and this-week events
- Event calendar page plus `/events.ics`
- A saved-event planner page where visitors can compare saved events on the same device and export a saved calendar file
- RSS and JSON Feed output at `/feed.xml`, `/latest.json`, and each language folder for recrawl signals, subscriptions, newsletters, and future automation
- A `/recheck.json` operations feed and `/now/` panel for live or upcoming listings that need official-source rechecks soon
- Guide pages for K-pop pop-ups, duty-free shopping, seasonal sales, and weather planning
- Language versions for English, Spanish, Chinese, Portuguese, Russian, Japanese, French, and German; AdSense review mode publishes English only until localized pages pass translation QA
- Static output in `dist/` for Cloudflare Pages

## Project Files

- `data/events.json`: approved public events and deals
- `data/sources.json`: official APIs, official page monitors, and K-pop curation queues
- `data/curation-queue.json`: official one-off URLs and K-pop/social/ticketing links waiting for manual review
- `data/official-thumbnail-overrides.json`: audited official-image downloads and official source identity-card overrides for pages that do not expose reusable event images
- `data/guides.json`: original evergreen guide content
- `data/weather-baselines.json`: schedule-month previous-year weather planning baselines by region
- `data/design-system.json`: shared page-system contract for hero types, review rules, representative pages, design tokens, and harness checks
- `scripts/build.mjs`: builds multilingual static HTML, sitemap, and ICS calendar
- Generated feed files: `/feed.xml`, `/latest.json`, `/{lang}/feed.xml`, and `/{lang}/latest.json`
- `scripts/validate-content.mjs`: validates required event/source/route fields before deploy
- `scripts/validate-source-coverage.mjs`: verifies required official-source buckets for tourism, government, OLIVE YOUNG, duty-free, department stores, K-pop, ticketing, shopping campaigns, and weather
- `scripts/validate-links.mjs`: checks generated HTML for missing local links and images
- `scripts/validate-images.mjs`: checks event thumbnails, generated image assets, image signatures, minimum dimensions, and non-decorative image alt text
- `scripts/validate-calendar.mjs`: checks that all events appear in the calendar page and downloadable `events.ics` with correct date ranges
- `scripts/validate-detail-pages.mjs`: checks generated event detail pages for official source links, calendar downloads, saved-planner metadata, previous-year weather, map shortcuts, travel routes, and related guides
- `scripts/validate-original-value.mjs`: blocks thin, duplicated, unaccountable, or source-rewritten public content by requiring distinct visitor analysis, practical checks, research methods, and traceable evidence
- `data/adsense-compliance.json`: versioned manual evidence record for the selected Google-certified CMP, TCF coverage, review date, and accountable verifier
- `scripts/validate-adsense-compliance.mjs`: lets site review use `ads.txt` ownership with ads disabled, requires verified CMP evidence only for ad serving, and blocks ads from noindex or policy pages
- `scripts/validate-structured-data.mjs`: checks generated detail pages for category-appropriate JSON-LD, using `Event` for festivals and K-pop pages and `WebPage` for shopping/deal information pages
- `scripts/validate-event-audit.mjs`: checks high-risk event audit blocks against official evidence pages so concert dates, city-project dates, and shopping campaign windows do not get merged by mistake
- `scripts/validate-production.mjs`: checks production domain, contact email, and optional AdSense settings
- `scripts/adsense-readiness-report.mjs`: writes separate site-review and ad-serving readiness scorecards so pending CMP evidence does not falsely block a review-safe build
- `data/quality-system.json`: defines the CEO, planner, designer, publisher, audit institution, benchmark websites, and release policy
- `scripts/ceo-quality-review.mjs`: writes the CEO quality review and task dispatch after the audit institution checks design, planning, publishing, source trust, and benchmark parity
- `scripts/apply-official-thumbnail-overrides.mjs`: applies audited official-image or official source identity-card replacements so event thumbnails do not fall back to generic generated art
- `scripts/collect-official-pages.mjs`: collects official page candidates and same-site event/deal links for review
- `scripts/review-feed-report.mjs`: turns the latest candidate feed and discovered links into a human review report
- `scripts/draft-events-from-feed.mjs`: creates non-public event drafts from current/upcoming page-level and link-level candidates, while recording skipped stale, duplicate, failed, or mojibake candidates
- `scripts/build-review-board.mjs`: creates a private gallery-style review board from non-public drafts, including skipped-candidate reason counts
- `scripts/source-refresh-summary.mjs`: summarizes the latest source audit, official candidates, draft candidates, failed sources, and review-board artifact for quick operations triage
- `scripts/source-refresh-issue-body.mjs`: builds the Markdown body used by GitHub Actions to keep a single source-review issue updated
- `scripts/publish-reviewed-events.mjs`: validates and merges editor-reviewed events into public data
- `scripts/queue-official-url.mjs`: registers official one-off URLs into the curation queue
- `scripts/import-public-data.mjs`: runs configured KTO, KMA, and Seoul public-data collectors without auto-publishing candidate content
- `scripts/import-tourapi.mjs`: imports KTO TourAPI festival candidates into the private review feed
- `scripts/import-kto-nearby.mjs`: imports KTO places within three kilometres of verified approved-event anchors into a private review feed
- `scripts/import-kma-weather.mjs`: imports exact same-period previous-year KMA ASOS summaries for already-approved event pages
- `scripts/import-seoul-cultural-events.mjs`: imports Seoul cultural-event facts into the private review feed for source comparison
- `scripts/import-seoul-cultural-spaces.mjs`: rechecks Seoul venue anchors against the official cultural-space dataset
- `scripts/source-audit.mjs`: checks primary and fallback source URL availability and writes a private audit report
- `monetization-plan.md`: traffic and AdSense operating plan
- `launch-checklist.md`: Cloudflare/GitHub launch steps, required variables/secrets, and public email guidance

Generated review artifacts under `data/feeds/` are ignored by Git. Review them and merge only verified items into `data/events.json`.
Source review artifact filenames use the Asia/Seoul date by default. Set `SITE_TODAY=YYYY-MM-DD` to reproduce a specific run.

## Local Build

On this Windows machine, use `npm.cmd` because PowerShell script execution is restricted.

```powershell
npm.cmd run build
```

Validate content before deploying:

```powershell
npm.cmd run validate:content
```

Run build, content checks, official-source coverage checks, generated HTML link checks, and structured-data checks:

```powershell
npm.cmd run verify
```

Build the local design QA harness:

```powershell
npm.cmd run harness:design
```

Then open `http://127.0.0.1:4173/__design-harness/` while the local preview server is running. This harness reads `data/design-system.json`, compares page systems, hero scale, status flags, ads, buttons, and mobile framing before pushing design changes, and links to the latest local design council report. Use it as the working room: inspect the page frames, open the council report, check DOM audit issues, then rerun after each design change.

Run the role-based design council loop:

```powershell
npm.cmd run design:council
```

This runs the design harness, DOM visual audit, and council report. It publishes `data/feeds/design-quality-cycle-YYYY-MM-DD.md` and a local `http://127.0.0.1:4173/__design-harness/council.html` report. The report is the operating loop: 책임총괄 collects issues and priorities, 디자이너 answers visual intent, 개발자 answers implementation risk, 자문단 checks visitor usefulness, 감사 verifies evidence and defects, and 유저평가단 judges whether the result feels obvious and polished. The council also verifies each representative page against its named hero type, so homepage, planner, city, detail, and trust pages do not drift into the same generic layout.

Run the DOM visual audit by itself:

```powershell
npm.cmd run design:dom-audit
```

This checks the representative desktop/mobile pages for page-wide overflow, elements crossing the viewport edge, clipped text, and undersized non-navigation controls. It writes ignored local artifacts under `data/feeds/design-dom-audit-YYYY-MM-DD.*` and a local `http://127.0.0.1:4173/__design-harness/dom-audit.html` report.

Capture desktop and mobile screenshot baselines for the representative pages:

```powershell
npm.cmd run design:baselines
```

This writes ignored local artifacts under `data/feeds/design-baselines/` and a local `http://127.0.0.1:4173/__design-harness/baselines.html` gallery. It uses the local Edge or Chrome executable; set `DESIGN_BASELINE_BROWSER` if the browser is installed somewhere unusual.

Run the CEO quality review after building and generating the AdSense scorecard:

```powershell
$env:SITE_URL="https://kspotnow.com"
$env:CONTACT_EMAIL="contact@kspotnow.com"
npm.cmd run build
npm.cmd run report:adsense
npm.cmd run quality:ceo
```

The CEO quality review creates `data/feeds/ceo-quality-review-YYYY-MM-DD.md` and `.json`. It separates the planner, designer, publisher, and audit institution sign-offs, then turns warnings and failures into CEO task dispatch items. Any hard failure exits non-zero and blocks release.

The source coverage check keeps the monetization premise from drifting: it fails if the registry loses required official coverage for tourism/festivals, government and culture confirmation, OLIVE YOUNG, duty-free, department-store, sale/shopping campaigns, K-pop pop-ups, ticketing, or weather data.

The event audit check is a stricter guard for high-risk items. For example, BTS World Tour Busan is audited as a June 12-13 concert, while BTS THE CITY ARIRANG BUSAN is audited separately as a June 5-21 city project. If those date ranges are accidentally swapped or merged, `npm.cmd run verify` fails before deployment.

Official thumbnails are collected first from official pages. When a trusted source does not expose a reusable image, use an audited source identity card instead of generic category art:

```powershell
npm.cmd run collect:thumbnails
npm.cmd run apply:official-thumbnails
npm.cmd run validate:thumbnail-audit
```

Every override must stay in `data/official-thumbnail-overrides.json` with the official source page, method, context, and score so the audit institution can trace why it was accepted.

The build also writes latest-event RSS and JSON feeds. Submit `/sitemap.xml` to Search Console, and keep `/feed.xml` available for users, feed readers, newsletters, or social-post automation.

Before an AdSense application or a production content push, run the freshness gate in strict mode so live and upcoming listings cannot stay stale:

```powershell
$env:CONTENT_FRESHNESS_STRICT="1"
npm.cmd run validate:content
```

Preview:

```text
npm run preview
```

Then open:

```text
http://127.0.0.1:8766/en/
```

The preview server resolves the same clean internal URLs used by the site, so
event, guide, route, and policy links work in Safari without adding `.html`.
Use `npm run preview:worker` only when the Cloudflare Worker runtime itself
needs local testing.

## Cloudflare Workers/Pages

Use GitHub plus Cloudflare Workers Builds or Cloudflare Pages. The currently connected Cloudflare project is the Workers project `kculture`, so `wrangler.toml` is configured to deploy the generated `dist/` folder as static assets through `wrangler deploy`.

- Build command: `npm run build`
- Deploy command for Workers Builds: `npx wrangler deploy --assets=./dist`
- Static assets directory in `wrangler.toml`: `dist`
- Root directory: this project root
- Worker project name: `kculture`
- Use the Cloudflare preview URL only for testing. For AdSense review, connect a custom domain and set `SITE_URL` to that custom `https://` domain.

Before production build, set:

```powershell
$env:SITE_URL="https://kspotnow.com"
$env:CONTACT_EMAIL="contact@kspotnow.com"
$env:GOOGLE_SITE_VERIFICATION="search-console-meta-content"
npm.cmd run build
```

`wrangler.toml` already sets `[assets] directory = "./dist"`.
The build also writes Cloudflare Pages `_headers` for basic security headers and asset caching.

Production preflight:

```powershell
$env:SITE_URL="https://kspotnow.com"
$env:CONTACT_EMAIL="contact@kspotnow.com"
npm.cmd run build
npm.cmd run validate:production
npm.cmd run report:adsense
```

Full launch preflight:

```powershell
$env:SITE_URL="https://kspotnow.com"
$env:CONTACT_EMAIL="contact@kspotnow.com"
npm.cmd run preflight:launch
```

After `kspotnow.com` is connected to the Worker, verify the live domain before Search Console or AdSense submission:

```powershell
$env:SITE_URL="https://kspotnow.com"
$env:CONTACT_EMAIL="contact@kspotnow.com"
npm.cmd run check:domain
```

`validate:production` fails on common platform preview subdomains such as `pages.dev`, `netlify.app`, `vercel.app`, and `github.io` so the AdSense launch path stays focused on a real custom domain. For a non-AdSense preview deploy only, set `ALLOW_PLATFORM_SUBDOMAIN=1`.

Manual Wrangler deploy after the production preflight:

```powershell
npm.cmd run deploy:cloudflare
```

For GitHub Actions deployment through Wrangler, set these repository variables:

- `SITE_URL`: `https://kspotnow.com`
- `CONTACT_EMAIL`: public contact email shown in policy pages
- `CLOUDFLARE_WORKER_NAME`: Cloudflare Worker project name, default `kculture`
- `GOOGLE_ADSENSE_PUBLISHER_ID`: optional override; the site default is `pub-4973303868067114`
- `GOOGLE_ADSENSE_CLIENT`: optional until AdSense approval
- `GOOGLE_ADSENSE_SLOT`: optional numeric manual ad unit slot ID; enables reserved placements on the home page, event detail pages, and guide articles after approval
- `GOOGLE_ADSENSE_SERVING_ENABLED`: final release switch; keep `0` throughout site review and set to `1` only after approval and the ad-serving preflight
- `GOOGLE_ADSENSE_CMP_READY`: set to `1` only after a Google-certified CMP is configured for EEA, UK, and Switzerland visitors
- `GOOGLE_ADSENSE_CMP_EVIDENCE`: set to `1` only after a human reviewer verifies the published CMP message and accept/reject/manage flow; ads remain disabled unless the serving switch and both CMP flags are `1`
- `GOOGLE_SITE_VERIFICATION`: optional Search Console HTML tag content. You may paste either the content token or the full meta tag.
- `ADSENSE_REVIEW_MODE`: defaults to `1`. Keep this on for re-review so only quality-audited English pages are public.
- `PUBLIC_LANGUAGES`: optional comma-separated language list. Leave unset during AdSense re-review; after translation QA, set `en,es,zh,pt,ru,ja,fr,de`.
- `AFFILIATE_ENABLED`: defaults to `0`. Keep affiliate widgets off during AdSense re-review, then set `1` after approval if the sponsored blocks should return.

For the current AdSense re-review, keep the public build focused:

```text
SITE_URL=https://kspotnow.com
CONTACT_EMAIL=contact@kspotnow.com
ADSENSE_REVIEW_MODE=1
AFFILIATE_ENABLED=0
```

K-Spot Now's AdSense publisher ID is configured as `pub-4973303868067114`, so the build writes `/ads.txt` by default. Override `GOOGLE_ADSENSE_PUBLISHER_ID` only if the AdSense account changes.

Set these repository secrets:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`

`.github/workflows/deploy-cloudflare-pages.yml` refreshes official source candidates, builds with the real domain, runs production preflight, validates content and links, uploads the source refresh artifacts, then deploys `dist/` to the `kculture` Cloudflare Worker with `wrangler deploy`.
It also runs the CEO quality review before deploying. If the audit institution finds a hard failure, the workflow stops before Cloudflare deployment.

## GitHub Verification

`.github/workflows/verify.yml` runs `npm run verify` on pushes and pull requests. After the project is pushed to GitHub, use that check as the deploy gate before connecting Cloudflare Pages.

`.github/workflows/source-refresh.yml` runs official source collection every four hours, writes an Actions summary, updates one open GitHub issue labeled `source-review`, uploads the candidate feed, draft feed, review report, summary, and private review board as a GitHub Actions artifact, commits validated operational snapshots (`data/kma-forecast.json` and `data/source-refresh-summary.json`) back to `main`, and opens or updates a `Review official source candidates` pull request from the `automation/source-review-candidates` branch. It can also be started manually with extra official URLs.

The scheduled workflow intentionally does not publish draft events directly to `data/events.json`. Weather and source-status snapshots can update automatically because they are operational context. The review PR is an operating queue, not the publishing step: read it, comment on it, or close it after review, but publish only after an editor verifies the official source, rewrites the copy, and passes the guarded publisher.

`.github/workflows/deploy-cloudflare-pages.yml` is kept as a manual Wrangler deployment path for later API-token automation. For the first launch, use Cloudflare Pages dashboard Git integration so Cloudflare builds and deploys the GitHub repository directly.
Manual runs can require the AdSense publisher ID by enabling the `require_adsense` input.
Manual runs can also enable `strict_freshness` to fail the deploy when live or upcoming listings exceed the freshness windows.
Manual runs can disable `refresh_sources` for emergency rebuilds, or pass `monitor_urls` with extra official notice URLs that should be scanned once before the production build.

## Daily Operating Routine

1. Add newly discovered official notice URLs to the curation queue when they are not yet in `data/sources.json`:

```powershell
npm.cmd run queue:source -- --url "https://official.example/notice" --source "Official artist/company social channels" --category kpop --label "Artist pop-up notice" --priority 90 --topics "pop-up,merch,reservation"
```

Only queue official artist, agency, venue, ticketing, shop, government, or brand URLs. Do not queue fan reposts as publishable sources.

2. Check source availability:

```powershell
npm.cmd run check:sources
```

The source audit tries each source's primary `url` and any `alternateUrls`, then saves `data/feeds/source-audit-YYYY-MM-DD.json` and `.md`. If a site blocks the default request profile, set `SOURCE_USER_AGENT` before running the audit or collector.

3. Collect official page candidates and active curation queue URLs:

```powershell
npm.cmd run collect:official
```

The collector also scores official same-site links found inside listing pages. Tune the review volume when needed:

```powershell
$env:COLLECT_MAX_LINKS="24"
$env:COLLECT_MIN_LINK_SCORE="9"
npm.cmd run collect:official
```

4. Create a review report from the latest candidate feed:

```powershell
npm.cmd run review:feed
```

5. Create non-public event drafts from the latest candidate feed:

```powershell
npm.cmd run draft:events
```

Draft generation intentionally skips already published URLs, failed source fetches, expired candidate windows, and candidates with broken text encoding. The skipped reasons are saved with the draft feed so the editor can audit what was filtered out.

6. Build a private gallery-style review board:

```powershell
npm.cmd run review:board
```

7. Summarize the latest source refresh run:

```powershell
npm.cmd run source:summary
```

This writes `data/feeds/source-refresh-summary-YYYY-MM-DD.md` and `.json` with failed sources, draft counts, top categories, skipped reasons, and high-signal candidate pages.

To preview the GitHub issue digest locally:

```powershell
npm.cmd run source:issue
```

This writes `data/feeds/source-refresh-issue.md`. In GitHub Actions, the scheduled source refresh workflow uses that file to create or update the single `Official source review queue` issue. The issue includes both new official-source leads and already-published live/upcoming listings that need an official recheck soon.

Or run the local source workflow in one command:

```powershell
npm.cmd run source:refresh
```

This also writes `data/review-candidates/latest.md` and `data/review-candidates/latest.json`, the same compact package used by the scheduled source-review PR.

8. Put local credentials in the ignored `.env` file. Both data.go.kr Encoding and Decoding keys are accepted:

```dotenv
KTO_SERVICE_KEY=YOUR_DATA_GO_KR_KEY
KMA_SERVICE_KEY=YOUR_DATA_GO_KR_KEY
SEOUL_OPEN_DATA_KEY=YOUR_SEOUL_GENERAL_KEY
```

Run all configured collectors in strict mode:

```powershell
$env:PUBLIC_DATA_STRICT="1"
npm.cmd run import:public-data
```

KTO and Seoul raw rows stay under the ignored `data/feeds/` review area and are never published automatically. KMA writes a credential-free numeric summary for events already approved in `data/editorial-program.json`; raw observation rows stay in the private feed. Until a current KMA summary exists, event pages fall back to `data/weather-baselines.json`.

Nearby-place publication has a separate editorial gate. `data/public-data-anchors.json` records the official coordinate evidence or a no-guess exclusion for every approved event. `data/kto-nearby-reviewed.json` contains only the KTO records an editor selected, plus an event-specific route question, original route analysis, decision guidance, a stop rule, a Korean map query, and the reviewed distance. `import:nearby` also saves the selected records' `detailCommon2` and `detailIntro2` responses in the ignored private feed so an editor can verify that analysis against the official description and operating fields. The build never reads or publishes those raw descriptions, opening hours, prices, or availability. It hides the public module after 90 days and rejects accommodation and event-listing records. Run `npm.cmd run import:nearby` and `npm.cmd run import:seoul-spaces` to refresh the private evidence before editing the reviewed snapshot.

For the scheduled GitHub Actions refresh, add the same three names as repository Actions secrets. A local `.env` file is intentionally unavailable to GitHub and must never be committed.

9. Open the automated `Review official source candidates` PR or, locally, `data/review-candidates/latest.md`. Use it as the review inbox, then open the linked official source pages and the full artifact review board when needed.

10. Save approved items into `data/feeds/reviewed-events.json` and run the guarded publisher as a dry run:

```powershell
npm.cmd run publish:reviewed -- --file data/feeds/reviewed-events.json
```

11. If the dry run passes, write the reviewed events into public data:

```powershell
npm.cmd run publish:reviewed -- --file data/feeds/reviewed-events.json --write
```

13. Validate, build, and deploy:

```powershell
npm.cmd run verify
```

`verify` now blocks deploys if any required source bucket disappears or if a generated detail page has the wrong structured-data type. Festivals and K-pop pop-ups use event markup; OLIVE YOUNG, duty-free, department-store, and sale information pages use page markup to avoid treating ordinary promotions as events.

For production content pushes, also enable the strict freshness gate:

```powershell
$env:CONTENT_FRESHNESS_STRICT="1"
npm.cmd run validate:content
```

Then generate the private AdSense readiness scorecard:

```powershell
$env:SITE_URL="https://kspotnow.com"
$env:CONTACT_EMAIL="contact@kspotnow.com"
$env:GOOGLE_SITE_VERIFICATION="search-console-meta-content"
npm.cmd run report:adsense
```

The scorecard is saved under `data/feeds/adsense-readiness-YYYY-MM-DD.md` and `.json`. These files are ignored by Git because they are operating artifacts.

The publisher rejects draft placeholders such as `draft-needs-review`, `Needs editor review`, generic draft summaries, review-only fields, duplicate slugs, unknown sources, invalid dates, and missing visitor value.

## Latest Event Coverage

The source registry is set up to watch official sources for:

- Korea duty-free offers: Lotte, Shilla, Shinsegae, and campaign pages
- OLIVE YOUNG Global beauty sales, coupons, gifts, and country eligibility notes
- Department store shopping news: Lotte Department Store, Hyundai Department Store, The Hyundai event portal, Shinsegae event board and newsroom, Galleria, and AK Plaza
- Korea tourism and festival calendars from KTO, VISITKOREA, Seoul, Jeju, Incheon, Daegu, and culture-related public sources
- National shopping campaigns such as Korea Grand Sale and Korea Sale FESTA, with MCST and Korea Policy Briefing fallbacks for government-backed confirmations
- Seoul visitor event discovery through Visit Seoul, Seoul city notices, DDP, COEX, and Seoul Grand Park
- Busan visitor event discovery through Busan Metropolitan City event pages, English news, and Visit Busan fallbacks
- Representative regional festival sites such as Pentaport, Boryeong Mud, Daegu Chimac, Andong Maskdance, and Jinju Namgang Yudeung
- K-pop pop-ups and merch reservations through Weverse, FANS Shop, SMTOWN &STORE, YG SELECT, NOL World regional pop-up boards, and official artist/company channels
- K-pop ticketing and fan meeting discovery through NOL World, YES24 Ticket English, Ticketlink Global, Melon Ticket, Weverse, and official company/artist notices

The collector now stores discovered same-site official links in each candidate feed. This is useful for listing-heavy sources such as NOL World, YES24, DDP, OLIVE YOUNG, duty-free boards, and department-store newsrooms where the useful item is often an individual detail link inside the official page.

Some official sites change paths or block one request profile while allowing another. Keep official fallback paths in `alternateUrls`; the audit and collector will try those before marking a source blocked. Current fallback examples include Korea Grand Sale through the Visit Korea Committee page and Hyundai Department Store through the newer ehyundai portal.

Not every official site exposes a clean API. The safe operating model is to collect candidates automatically, then publish only manually verified summaries with official source links, last-checked dates, and practical visitor notes.

## Extra Official URLs

To check a one-off official notice without editing `data/sources.json`:

```powershell
$env:MONITOR_URLS="https://kspotnow.com/official-event,https://kspotnow.com/notice"
npm.cmd run collect:official
```

To keep that notice in the recurring review flow, register it in `data/curation-queue.json`:

```powershell
npm.cmd run queue:source -- --url "https://official.example/notice" --source "YES24 Ticket English" --category kpop --label "Concert ticket notice" --priority 88 --topics "concert,ticketing,identity check"
```

The curation queue is still non-public. It only helps the review board surface official URLs faster.

## Source Rules

1. Publish only official API, official page, official SNS, or manually verified official notice data.
2. Never auto-publish K-pop rumors, screenshots, fan reposts, or unverified social posts.
3. Every public event must include `sourceUrl`, `lastChecked`, `collectionMode`, and `verification`.
4. Expired events must be labeled as ended or archived.
5. Do not copy full official-page text. Write original summaries and practical travel notes.
6. Weather planning notes must match the relevant schedule month: current month for live long-running events, start month for upcoming events, and end month for archived events. Monthly baselines are planning guidance until exact KMA observations are imported.
7. Live and upcoming listings should be rechecked frequently. Fast-moving K-pop, beauty, duty-free, and department-store items have shorter freshness windows than evergreen festival archives.
8. Corrections should be checked against official URLs before public event pages are changed. Important visitor-facing corrections should update the event's `lastChecked` date.
9. Before AdSense application, update the real domain, email address, privacy policy, `ads.txt`, Search Console, and sitemap.

## AdSense Readiness Checklist

- Real custom domain connected
- `SITE_URL` set before final build
- `CONTACT_EMAIL` set before final build
- Search Console verified through DNS or `GOOGLE_SITE_VERIFICATION`
- GitHub Actions deploy variables and Cloudflare secrets configured
- `/source-refresh.json` generated from the latest official-source refresh
- `/en/watchlist/` shows the latest source refresh panel
- `/en/privacy/`, `/en/contact/`, `/en/about/`, `/en/terms/`, `/en/editorial-policy/`, `/en/corrections/`, `/en/sources/`, `/en/freshness/`, `/en/watchlist/`, and `/en/planner/` working
- A non-empty, explicitly reviewed set of current events and source-backed guides that passes the originality gate
- No broken images or broken internal links
- Mobile layout checked
- No ad-click encouragement text
- `GOOGLE_ADSENSE_PUBLISHER_ID` set after AdSense publisher ID is issued
- `GOOGLE_ADSENSE_CLIENT` or the derived `ca-pub-...` Auto ads client available before enabling ads
- `GOOGLE_ADSENSE_SLOT` set after creating a manual display ad unit, if you want reserved in-page placements
- `GOOGLE_ADSENSE_SERVING_ENABLED=1`, `GOOGLE_ADSENSE_CMP_READY=1`, and `GOOGLE_ADSENSE_CMP_EVIDENCE=1` set only after AdSense approval and after a Google-certified CMP is configured and manually verified for EEA, UK, and Switzerland visitors
- `ads.txt` generated at `/ads.txt` after publisher ID is issued
- Private `npm.cmd run report:adsense` scorecard reviewed before applying

AdSense site-review preflight after you have the publisher ID:

```powershell
$env:SITE_URL="https://kspotnow.com"
$env:CONTACT_EMAIL="contact@kspotnow.com"
$env:GOOGLE_ADSENSE_PUBLISHER_ID="pub-0000000000000000"
npm.cmd run build
npm.cmd run preflight:adsense-review
```

The site-review build verifies ownership through `/ads.txt` and keeps all ad
markup disabled while CMP evidence is pending. Before enabling ad serving,
complete `data/adsense-compliance.json`, set both CMP flags, and run:

```powershell
$env:GOOGLE_ADSENSE_CLIENT="ca-pub-0000000000000000"
$env:GOOGLE_ADSENSE_SLOT="0000000000"
$env:GOOGLE_ADSENSE_SERVING_ENABLED="1"
$env:GOOGLE_ADSENSE_CMP_READY="1"
$env:GOOGLE_ADSENSE_CMP_EVIDENCE="1"
npm.cmd run build
npm.cmd run preflight:ad-serving
```

## Strict Source Audit

Some official sites block bot-like checks. By default, `check:sources` reports failures but does not fail the command. For CI:

```powershell
$env:SOURCE_AUDIT_STRICT="1"
npm.cmd run check:sources
```

The audit closes response bodies immediately and checks sources with limited parallelism. If a source starts rate-limiting, lower concurrency or increase the timeout:

```powershell
$env:SOURCE_CONCURRENCY="3"
$env:SOURCE_TIMEOUT_MS="12000"
npm.cmd run check:sources
```

If a known official source starts returning 403/timeout while it still opens in a browser, set `SOURCE_USER_AGENT` or add a verified official `alternateUrls` entry before treating the source as unavailable.
