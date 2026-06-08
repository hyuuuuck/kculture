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
- `scripts/collect-official-pages.mjs`: collects official page candidates for review
- `scripts/review-feed-report.mjs`: turns the latest candidate feed into a human review report
- `scripts/import-tourapi.mjs`: imports KTO TourAPI festival candidates
- `scripts/import-kma-weather.mjs`: imports previous-year KMA ASOS weather observations
- `scripts/source-audit.mjs`: checks source URL availability
- `monetization-plan.md`: traffic and AdSense operating plan

Generated feed files under `data/feeds/*.json` are ignored by Git. Review them and merge only verified items into `data/events.json`.
Generated review reports under `data/feeds/*.md` are also ignored by Git.

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
npm.cmd run build
```

`wrangler.toml` already sets `pages_build_output_dir = "dist"`.
The build also writes Cloudflare Pages `_headers` for basic security headers and asset caching.

## GitHub Verification

`.github/workflows/verify.yml` runs `npm run verify` on pushes and pull requests. After the project is pushed to GitHub, use that check as the deploy gate before connecting Cloudflare Pages.

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

4. Import Korea Tourism Organization TourAPI candidates:

```powershell
$env:KTO_SERVICE_KEY="YOUR_DATA_GO_KR_KEY"
npm.cmd run import:tourapi
```

5. Import previous-year KMA weather observations:

```powershell
$env:KMA_SERVICE_KEY="YOUR_DATA_GO_KR_KEY"
npm.cmd run import:weather
```

6. Review `data/feeds/*.json` and `data/feeds/*.md`, verify official source pages, and manually merge publishable items into `data/events.json`.

7. Validate, build, and deploy:

```powershell
npm.cmd run verify
```

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
- `/en/privacy/`, `/en/contact/`, `/en/about/`, `/en/terms/` working
- At least 30 verified event, guide, or archive pages
- No broken images or broken internal links
- Mobile layout checked
- No ad-click encouragement text
- `ads.txt` updated after AdSense publisher ID is issued

## Strict Source Audit

Some official sites block bot-like checks. By default, `check:sources` reports failures but does not fail the command. For CI:

```powershell
$env:SOURCE_AUDIT_STRICT="1"
npm.cmd run check:sources
```
