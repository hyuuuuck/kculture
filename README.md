# Korea Now Guide

Korea Now Guide is a static, multilingual Korea event and shopping radar for foreign visitors.

It is designed for AdSense readiness, but AdSense approval and monthly revenue are never guaranteed. The structure focuses on official sources, original summaries, clear date ranges, trust pages, calendar browsing, source freshness labels, and review-first automation.

## What It Builds

- Gallery-style event homepage with thumbnails, dates, categories, and status labels
- Event detail pages with official source links, last-checked date, weather planning notes, and nearby travel ideas
- Event calendar page plus `/events.ics`
- Guide pages for K-pop pop-ups, duty-free shopping, seasonal sales, and weather planning
- Language versions for English, Spanish, Chinese, Portuguese, and Russian
- Static output in `dist/` for Cloudflare Pages

## Project Files

- `data/events.json`: approved public events and deals
- `data/sources.json`: official APIs, official page monitors, and K-pop curation queues
- `data/guides.json`: original evergreen guide content
- `data/weather-baselines.json`: fallback weather planning notes
- `scripts/build.mjs`: builds multilingual static HTML, sitemap, and ICS calendar
- `scripts/validate-content.mjs`: validates required event/source/route fields before deploy
- `scripts/validate-links.mjs`: checks generated HTML for missing local links and images
- `scripts/validate-production.mjs`: checks production domain, contact email, and optional AdSense settings
- `scripts/collect-official-pages.mjs`: collects official page candidates for review
- `scripts/review-feed-report.mjs`: turns the latest candidate feed into a human review report
- `scripts/draft-events-from-feed.mjs`: creates non-public event drafts from the latest candidate feed
- `scripts/build-review-board.mjs`: creates a private gallery-style review board from non-public drafts
- `scripts/import-tourapi.mjs`: imports KTO TourAPI festival candidates
- `scripts/import-kma-weather.mjs`: imports previous-year KMA ASOS weather observations
- `scripts/source-audit.mjs`: checks source URL availability
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

Run build, content checks, generated HTML text checks, and internal link checks:

```powershell
npm.cmd run verify
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

Before production build, set:

```powershell
$env:SITE_URL="https://your-domain.com"
$env:CONTACT_EMAIL="hello@your-domain.com"
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
```

## GitHub Verification

`.github/workflows/verify.yml` runs `npm run verify` on pushes and pull requests. After the project is pushed to GitHub, use that check as the deploy gate before connecting Cloudflare Pages.

`.github/workflows/source-refresh.yml` runs official source collection three times per day and uploads the candidate feed plus review report as a GitHub Actions artifact. It can also be started manually with extra official URLs.

## Daily Operating Routine

1. Check source availability:

```powershell
npm.cmd run check:sources
```

2. Collect official page candidates:

```powershell
npm.cmd run collect:official
```

3. Create a review report from the latest candidate feed:

```powershell
npm.cmd run review:feed
```

4. Create non-public event drafts from the latest candidate feed:

```powershell
npm.cmd run draft:events
```

5. Build a private gallery-style review board:

```powershell
npm.cmd run review:board
```

Or run the local source workflow in one command:

```powershell
npm.cmd run source:refresh
```

6. Import Korea Tourism Organization TourAPI candidates:

```powershell
$env:KTO_SERVICE_KEY="YOUR_DATA_GO_KR_KEY"
npm.cmd run import:tourapi
```

7. Import previous-year KMA weather observations:

```powershell
$env:KMA_SERVICE_KEY="YOUR_DATA_GO_KR_KEY"
npm.cmd run import:weather
```

8. Open `data/feeds/review-board-YYYY-MM-DD.html`, verify official source pages, rewrite summaries in original words, and manually merge publishable items into `data/events.json`.

9. Validate, build, and deploy:

```powershell
npm.cmd run verify
```

## Latest Event Coverage

The source registry is set up to watch official sources for:

- Korea duty-free offers: Lotte, Shilla, Shinsegae, and campaign pages
- OLIVE YOUNG Global beauty sales, coupons, gifts, and country eligibility notes
- Department store shopping news: Lotte Department Store, Hyundai Department Store, and Shinsegae official press updates
- Korea tourism and festival calendars from KTO, VISITKOREA, Seoul, and culture-related public sources
- K-pop pop-ups and merch reservations through Weverse and official artist/company channels

Not every official site exposes a clean API. The safe operating model is to collect candidates automatically, then publish only manually verified summaries with official source links, last-checked dates, and practical visitor notes.

## Extra Official URLs

To check a one-off official notice without editing `data/sources.json`:

```powershell
$env:MONITOR_URLS="https://example.com/official-event,https://example.com/notice"
npm.cmd run collect:official
```

## Source Rules

1. Publish only official API, official page, official SNS, or manually verified official notice data.
2. Never auto-publish K-pop rumors, screenshots, fan reposts, or unverified social posts.
3. Every public event must include `sourceUrl`, `lastChecked`, `collectionMode`, and `verification`.
4. Expired events must be labeled as ended or archived.
5. Do not copy full official-page text. Write original summaries and practical travel notes.
6. Before AdSense application, update the real domain, email address, privacy policy, `ads.txt`, Search Console, and sitemap.

## AdSense Readiness Checklist

- Real custom domain connected
- `SITE_URL` set before final build
- `CONTACT_EMAIL` set before final build
- `/en/privacy/`, `/en/contact/`, `/en/about/`, `/en/terms/` working
- At least 30 verified event, guide, or archive pages
- No broken images or broken internal links
- Mobile layout checked
- No ad-click encouragement text
- `GOOGLE_ADSENSE_PUBLISHER_ID` set after AdSense publisher ID is issued
- `GOOGLE_ADSENSE_CLIENT` or the derived `ca-pub-...` Auto ads client available before enabling ads
- `ads.txt` generated at `/ads.txt` after publisher ID is issued

AdSense preflight after you have the publisher ID:

```powershell
$env:SITE_URL="https://your-domain.com"
$env:CONTACT_EMAIL="hello@your-domain.com"
$env:GOOGLE_ADSENSE_PUBLISHER_ID="pub-0000000000000000"
npm.cmd run build
npm.cmd run preflight:adsense
```

## Strict Source Audit

Some official sites block bot-like checks. By default, `check:sources` reports failures but does not fail the command. For CI:

```powershell
$env:SOURCE_AUDIT_STRICT="1"
npm.cmd run check:sources
```
