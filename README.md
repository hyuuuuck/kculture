# Korea Now Guide

Korea Now Guide is a static, multilingual Korea event and shopping radar for foreign visitors.

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
- Language versions for English, Spanish, Chinese, Portuguese, and Russian
- Static output in `dist/` for Cloudflare Pages

## Project Files

- `data/events.json`: approved public events and deals
- `data/sources.json`: official APIs, official page monitors, and K-pop curation queues
- `data/curation-queue.json`: official one-off URLs and K-pop/social/ticketing links waiting for manual review
- `data/guides.json`: original evergreen guide content
- `data/weather-baselines.json`: schedule-month previous-year weather planning baselines by region
- `scripts/build.mjs`: builds multilingual static HTML, sitemap, and ICS calendar
- Generated feed files: `/feed.xml`, `/latest.json`, `/{lang}/feed.xml`, and `/{lang}/latest.json`
- `scripts/validate-content.mjs`: validates required event/source/route fields before deploy
- `scripts/validate-source-coverage.mjs`: verifies required official-source buckets for tourism, government, OLIVE YOUNG, duty-free, department stores, K-pop, ticketing, shopping campaigns, and weather
- `scripts/validate-links.mjs`: checks generated HTML for missing local links and images
- `scripts/validate-images.mjs`: checks event thumbnails, generated image assets, image signatures, minimum dimensions, and non-decorative image alt text
- `scripts/validate-structured-data.mjs`: checks generated detail pages for category-appropriate JSON-LD, using `Event` for festivals and K-pop pages and `WebPage` for shopping/deal information pages
- `scripts/validate-production.mjs`: checks production domain, contact email, and optional AdSense settings
- `scripts/adsense-readiness-report.mjs`: writes a private AdSense readiness scorecard with content, trust, freshness, feed, and ad setup checks
- `scripts/collect-official-pages.mjs`: collects official page candidates and same-site event/deal links for review
- `scripts/review-feed-report.mjs`: turns the latest candidate feed and discovered links into a human review report
- `scripts/draft-events-from-feed.mjs`: creates non-public event drafts from current/upcoming page-level and link-level candidates, while recording skipped stale, duplicate, failed, or mojibake candidates
- `scripts/build-review-board.mjs`: creates a private gallery-style review board from non-public drafts, including skipped-candidate reason counts
- `scripts/source-refresh-summary.mjs`: summarizes the latest source audit, official candidates, draft candidates, failed sources, and review-board artifact for quick operations triage
- `scripts/source-refresh-issue-body.mjs`: builds the Markdown body used by GitHub Actions to keep a single source-review issue updated
- `scripts/publish-reviewed-events.mjs`: validates and merges editor-reviewed events into public data
- `scripts/queue-official-url.mjs`: registers official one-off URLs into the curation queue
- `scripts/import-tourapi.mjs`: imports KTO TourAPI festival candidates
- `scripts/import-kma-weather.mjs`: imports exact same-period previous-year KMA ASOS weather observations when an API key is available
- `scripts/source-audit.mjs`: checks primary and fallback source URL availability and writes a private audit report
- `monetization-plan.md`: traffic and AdSense operating plan

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

The source coverage check keeps the monetization premise from drifting: it fails if the registry loses required official coverage for tourism/festivals, government and culture confirmation, OLIVE YOUNG, duty-free, department-store, sale/shopping campaigns, K-pop pop-ups, ticketing, or weather data.

The build also writes latest-event RSS and JSON feeds. Submit `/sitemap.xml` to Search Console, and keep `/feed.xml` available for users, feed readers, newsletters, or social-post automation.

Before an AdSense application or a production content push, run the freshness gate in strict mode so live and upcoming listings cannot stay stale:

```powershell
$env:CONTENT_FRESHNESS_STRICT="1"
npm.cmd run validate:content
```

Preview:

```powershell
python -m http.server 8766 -d dist
```

Then open:

```text
http://127.0.0.1:8766/
```

## Cloudflare Pages

Use GitHub plus Cloudflare Pages.

- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: this project root
- Pages project name: `korea-now-guide` by default, or set `CLOUDFLARE_PAGES_PROJECT_NAME`
- Use the Cloudflare `pages.dev` URL only for preview. For AdSense review, connect a custom domain and set `SITE_URL` to that custom `https://` domain.

Before production build, set:

```powershell
$env:SITE_URL="https://your-domain.com"
$env:CONTACT_EMAIL="hello@your-domain.com"
$env:GOOGLE_SITE_VERIFICATION="search-console-meta-content"
npm.cmd run build
```

`wrangler.toml` already sets `pages_build_output_dir = "dist"`.
The build also writes Cloudflare Pages `_headers` for basic security headers and asset caching.

Production preflight:

```powershell
$env:SITE_URL="https://your-domain.com"
$env:CONTACT_EMAIL="hello@your-domain.com"
npm.cmd run build
npm.cmd run validate:production
npm.cmd run report:adsense
```

`validate:production` fails on common platform preview subdomains such as `pages.dev`, `netlify.app`, `vercel.app`, and `github.io` so the AdSense launch path stays focused on a real custom domain. For a non-AdSense preview deploy only, set `ALLOW_PLATFORM_SUBDOMAIN=1`.

Manual Wrangler deploy after the production preflight:

```powershell
npm.cmd run deploy:cloudflare
```

For GitHub Actions deployment through Wrangler, set these repository variables:

- `SITE_URL`: real production URL, for example `https://your-domain.com`
- `CONTACT_EMAIL`: public contact email shown in policy pages
- `CLOUDFLARE_PAGES_PROJECT_NAME`: Cloudflare Pages project name, default `korea-now-guide`
- `GOOGLE_ADSENSE_PUBLISHER_ID`: optional until AdSense approval
- `GOOGLE_ADSENSE_CLIENT`: optional until AdSense approval
- `GOOGLE_ADSENSE_SLOT`: optional numeric manual ad unit slot ID; enables reserved placements on the home page, event detail pages, and guide articles after approval
- `GOOGLE_SITE_VERIFICATION`: optional Search Console HTML tag content. You may paste either the content token or the full meta tag.

Set these repository secrets:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`

`.github/workflows/deploy-cloudflare-pages.yml` refreshes official source candidates, builds with the real domain, runs production preflight, validates content and links, uploads the source refresh artifacts, then deploys `dist/` to Cloudflare Pages with `wrangler pages deploy`.

## GitHub Verification

`.github/workflows/verify.yml` runs `npm run verify` on pushes and pull requests. After the project is pushed to GitHub, use that check as the deploy gate before connecting Cloudflare Pages.

`.github/workflows/source-refresh.yml` runs official source collection every four hours, writes an Actions summary, updates one open GitHub issue labeled `source-review`, and uploads the candidate feed, draft feed, review report, summary, and private review board as a GitHub Actions artifact. It can also be started manually with extra official URLs.

`.github/workflows/deploy-cloudflare-pages.yml` deploys the production build on pushes to `main` and can be started manually. Manual runs can require the AdSense publisher ID by enabling the `require_adsense` input.
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

8. Import Korea Tourism Organization TourAPI candidates:

```powershell
$env:KTO_SERVICE_KEY="YOUR_DATA_GO_KR_KEY"
npm.cmd run import:tourapi
```

9. Import exact same-period previous-year KMA weather observations when an API key is available. Until then, event detail pages use the relevant schedule month from `data/weather-baselines.json`:

```powershell
$env:KMA_SERVICE_KEY="YOUR_DATA_GO_KR_KEY"
npm.cmd run import:weather
```

10. Open `data/feeds/source-refresh-summary-YYYY-MM-DD.md` first, then `data/feeds/review-board-YYYY-MM-DD.html`; verify official source pages, rewrite summaries in original words, and manually merge publishable items into `data/events.json`.

11. Or save reviewed items into a JSON file and run the guarded publisher as a dry run:

```powershell
npm.cmd run publish:reviewed -- --file data/feeds/reviewed-events.json
```

12. If the dry run passes, write the reviewed events into public data:

```powershell
npm.cmd run publish:reviewed -- --file data/feeds/reviewed-events.json --write
```

12. Validate, build, and deploy:

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
$env:SITE_URL="https://your-domain.com"
$env:CONTACT_EMAIL="hello@your-domain.com"
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
$env:MONITOR_URLS="https://example.com/official-event,https://example.com/notice"
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
- At least 30 verified event, guide, or archive pages
- No broken images or broken internal links
- Mobile layout checked
- No ad-click encouragement text
- `GOOGLE_ADSENSE_PUBLISHER_ID` set after AdSense publisher ID is issued
- `GOOGLE_ADSENSE_CLIENT` or the derived `ca-pub-...` Auto ads client available before enabling ads
- `GOOGLE_ADSENSE_SLOT` set after creating a manual display ad unit, if you want reserved in-page placements
- `ads.txt` generated at `/ads.txt` after publisher ID is issued
- Private `npm.cmd run report:adsense` scorecard reviewed before applying

AdSense preflight after you have the publisher ID:

```powershell
$env:SITE_URL="https://your-domain.com"
$env:CONTACT_EMAIL="hello@your-domain.com"
$env:GOOGLE_ADSENSE_PUBLISHER_ID="pub-0000000000000000"
$env:GOOGLE_ADSENSE_SLOT="0000000000"
npm.cmd run build
npm.cmd run preflight:adsense
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
