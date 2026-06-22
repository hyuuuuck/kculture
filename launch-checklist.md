# Cloudflare/GitHub Launch Checklist

Use this checklist when moving K-Spot Now from local build to a real AdSense review candidate.

## 1. Domain and Email

- Buy a custom domain and connect it to Cloudflare DNS.
- Create a public contact address on the same domain: `contact@kspotnow.com`.
- A separate paid mailbox is not required for launch if you only need to receive mail. A domain email alias that forwards to your existing inbox is enough.
- Do not expose a personal Gmail address on the site. Use a domain alias for `CONTACT_EMAIL`.
- If you need to send replies from the domain address, use a real mailbox provider or configure authenticated sending for that domain.

## 2. GitHub Repository

Create a GitHub repository, then push this project:

```powershell
git remote add origin https://github.com/hyuuuuck/kculture.git
git branch -M main
git push -u origin main
```

After the push, confirm that these workflows are visible under GitHub Actions:

- `Verify site`
- `Refresh official source candidates`
- `Deploy Cloudflare Pages`

## 3. GitHub Variables

Set these in GitHub repository settings under `Secrets and variables` -> `Actions` -> `Variables`:

- `SITE_URL`: `https://kspotnow.com`
- `CONTACT_EMAIL`: `contact@kspotnow.com`
- `CLOUDFLARE_WORKER_NAME`: `kculture`
- `GOOGLE_SITE_VERIFICATION`: optional Search Console meta token
- `GOOGLE_ADSENSE_PUBLISHER_ID`: add after AdSense gives the publisher ID
- `GOOGLE_ADSENSE_CLIENT`: add after AdSense gives the client ID
- `GOOGLE_ADSENSE_SLOT`: add after creating a manual ad unit
- `GOOGLE_ADSENSE_CMP_READY`: set to `1` only after a Google-certified consent management platform is configured for EEA, UK, and Switzerland visitors
- `AGODA_PARTNER_CID`: add after Agoda Partners approval to enable hotel affiliate links on event pages
- `TRIP_ALLIANCE_ID` / `TRIP_ALLIANCE_SID`: add after Trip.com Affiliates approval
- `KLOOK_AFFILIATE_AID`: add after Klook affiliate approval
- `TRAZY_AFFILIATE_ID`: add after Trazy affiliate approval

Affiliate blocks stay hidden until at least one affiliate variable is set. While Workers Builds is still the active deploy path, set the same affiliate variables in the Cloudflare dashboard build settings too, or they will not reach the build.

## 4. GitHub Secrets

Set these in GitHub repository settings under `Secrets and variables` -> `Actions` -> `Secrets`:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`

The token should be created in Cloudflare for Pages deployment access to this account/project.

## 5. Cloudflare Pages

The canonical deployment path is the gated GitHub Actions deploy (decided 2026-06-10).

Path A, GitHub Actions deploy (canonical):

- Create or use a Cloudflare Workers project named `kculture`.
- Create a Cloudflare API token with Workers Scripts Edit permission for this account and save it as the `CLOUDFLARE_API_TOKEN` GitHub Actions secret.
- Every push to `main` then runs the full validation gate and deploys `dist/` with Wrangler only after all checks pass.
- Run `.github/workflows/deploy-cloudflare-pages.yml` manually with `refresh_sources` when you want a deploy that refreshes official sources first.

Path B, Cloudflare dashboard Git integration (initial launch only, superseded):

- This was the first launch path: Workers Builds with build command `npm run build` and deploy command `npx wrangler deploy --assets=./dist`.
- It deploys every push without the validation gate. Once the Actions secret works, disable it: Cloudflare dashboard -> Workers & Pages -> `kculture` -> Settings -> Build -> disconnect the Git repository or pause automatic deployments.
- Keeping both paths active double-deploys and lets unvalidated builds reach production.

For AdSense review, connect the custom domain and use that domain as `SITE_URL`. The `pages.dev` URL is only for preview.

Custom domain connection steps for `kspotnow.com`:

- Buy `kspotnow.com` and add it to Cloudflare DNS.
- In Cloudflare, open Workers & Pages -> `kculture` -> Settings -> Domains & Routes.
- Add `kspotnow.com` as a custom domain for the Worker.
- Add `www.kspotnow.com` only if you want the `www` version; redirect one version to the other so Search Console and AdSense see one canonical site.
- Wait until Cloudflare shows active SSL, then confirm the root domain, sitemap, robots file, trust pages, contact page, and one event detail page:

```powershell
$env:SITE_URL="https://kspotnow.com"
$env:CONTACT_EMAIL="contact@kspotnow.com"
npm.cmd run check:domain
```

## 6. Local Launch Preflight

Publishing uses four quality gates before a public launch:

- Source audit: official URLs, last-checked dates, fast-moving recheck windows, and K-pop ticketing/pop-up queues.
- Source refresh automation: the scheduled workflow commits only validated weather/source-summary snapshots to `main`; new event leads must arrive through the `Review official source candidates` PR and pass editor review before they become public.
- Editorial audit: original summaries, visitor-useful travel notes, map-ready Korean place names, and correction-policy pages.
- Translation audit: English, Spanish, Chinese, Portuguese, Russian, and Japanese pages must build without missing public pages.
- UX audit: carousel navigation, official or audited source-card thumbnails, calendar month headings, detail fact strips, weather blocks, map cards, and responsive page structure.
- Trust audit: privacy, cookie, advertising, terms, editorial, corrections, source, freshness, watchlist, planner, contact, and about pages must exist for every public language.
- CEO quality review: the planner, designer, publisher, and audit institution are scored separately; hard failures block release and warnings become CEO task dispatch items.

Run this before pushing a production launch build:

```powershell
$env:SITE_URL="https://kspotnow.com"
$env:CONTACT_EMAIL="contact@kspotnow.com"
$env:GOOGLE_SITE_VERIFICATION="search-console-meta-content"
npm.cmd run preflight:launch
```

The CEO report is written under `data/feeds/ceo-quality-review-YYYY-MM-DD.md`. Read it before a launch decision. A release can proceed only when the decision is `APPROVED_FOR_PUBLISH` or `APPROVED_WITH_CEO_TASKS`; `REWORK_REQUIRED` means the audit institution blocked release.

After AdSense gives a publisher ID and ad unit slot, run:

```powershell
$env:GOOGLE_ADSENSE_PUBLISHER_ID="pub-0000000000000000"
$env:GOOGLE_ADSENSE_CLIENT="ca-pub-0000000000000000"
$env:GOOGLE_ADSENSE_SLOT="0000000000"
$env:GOOGLE_ADSENSE_CMP_READY="1"
npm.cmd run preflight:adsense
```

## 7. Search and AdSense

- Verify the domain in Google Search Console by DNS or meta tag.
- Submit `https://kspotnow.com/sitemap.xml`.
- Wait until important pages are indexed before applying to AdSense.
- Apply with the real custom domain, not the Cloudflare preview URL.
- After approval, add the real AdSense IDs and rebuild so `/ads.txt` and ad placements are generated.
- Before serving ads to EEA, UK, and Switzerland visitors, configure a Google-certified CMP and set `GOOGLE_ADSENSE_CMP_READY=1`.

Approval and revenue are not guaranteed. The safest operating model is still official-source monitoring, reviewed publishing, original multilingual summaries, clear correction policy, and frequent freshness checks.

## 8. AdSense Submission Gate

Do not submit the site for AdSense review until these checks are true:

- `https://kspotnow.com/` resolves to the production Cloudflare deployment.
- `https://kspotnow.com/sitemap.xml` and `https://kspotnow.com/robots.txt` return 200.
- `npm.cmd run check:domain` passes with `SITE_URL=https://kspotnow.com` and `CONTACT_EMAIL=contact@kspotnow.com`.
- The footer trust pages return 200, including `/en/privacy/`, `/en/cookie-policy/`, `/en/advertising/`, `/en/terms/`, `/en/contact/`, `/en/editorial-policy/`, and `/en/corrections/`.
- Google Search Console is verified by DNS or `GOOGLE_SITE_VERIFICATION`, and the sitemap has been submitted.
- The latest `npm.cmd run preflight:launch` has 0 failures.
- The latest `npm.cmd run report:adsense` has 0 failures and only expected external warnings.
- A Google-certified CMP is configured before serving ads to EEA, UK, and Switzerland visitors.
- The public contact email works and is not a personal Gmail address.

After Google issues the publisher and ad unit values, set `GOOGLE_ADSENSE_PUBLISHER_ID`, `GOOGLE_ADSENSE_CLIENT`, `GOOGLE_ADSENSE_SLOT`, and `GOOGLE_ADSENSE_CMP_READY=1`, then run `npm.cmd run preflight:adsense` before enabling live ad placements.
