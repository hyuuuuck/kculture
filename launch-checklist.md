# Cloudflare/GitHub Launch Checklist

Use this checklist when moving K-Spot Now from local build to a real AdSense review candidate.

## 1. Domain and Email

- Buy a custom domain and connect it to Cloudflare DNS.
- Create a public contact address on the same domain, for example `contact@your-domain.com` or `hello@your-domain.com`.
- A separate paid mailbox is not required for launch if you only need to receive mail. A domain email alias that forwards to your existing inbox is enough.
- Do not expose a personal Gmail address on the site. Use a domain alias for `CONTACT_EMAIL`.
- If you need to send replies from the domain address, use a real mailbox provider or configure authenticated sending for that domain.

## 2. GitHub Repository

Create a GitHub repository, then push this project:

```powershell
git remote add origin https://github.com/YOUR_ACCOUNT/kspotnow.git
git branch -M main
git push -u origin main
```

After the push, confirm that these workflows are visible under GitHub Actions:

- `Verify site`
- `Refresh official source candidates`
- `Deploy Cloudflare Pages`

## 3. GitHub Variables

Set these in GitHub repository settings under `Secrets and variables` -> `Actions` -> `Variables`:

- `SITE_URL`: real production URL, for example `https://your-domain.com`
- `CONTACT_EMAIL`: public domain email, for example `contact@your-domain.com`
- `CLOUDFLARE_WORKER_NAME`: `kculture`
- `GOOGLE_SITE_VERIFICATION`: optional Search Console meta token
- `GOOGLE_ADSENSE_PUBLISHER_ID`: add after AdSense gives the publisher ID
- `GOOGLE_ADSENSE_CLIENT`: add after AdSense gives the client ID
- `GOOGLE_ADSENSE_SLOT`: add after creating a manual ad unit

## 4. GitHub Secrets

Set these in GitHub repository settings under `Secrets and variables` -> `Actions` -> `Secrets`:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`

The token should be created in Cloudflare for Pages deployment access to this account/project.

## 5. Cloudflare Pages

Two deployment paths are supported.

Path A, GitHub Actions deploy:

- Create or use a Cloudflare Workers project named `kculture`.
- Set the Cloudflare GitHub Action secrets in GitHub.
- Run `.github/workflows/deploy-cloudflare-pages.yml` manually when you want Wrangler to deploy `dist/`.

Path B, Cloudflare dashboard Git integration:

- Connect the GitHub repository from Cloudflare Pages.
- Build command: `npm run build`
- Deploy command for Workers Builds: `npx wrangler deploy`
- Root directory: project root
- Set the same production environment variables in the Cloudflare Pages project settings.
- This is the recommended first launch path because Cloudflare handles the GitHub webhook and deployment.

For AdSense review, connect the custom domain and use that domain as `SITE_URL`. The `pages.dev` URL is only for preview.

## 6. Local Launch Preflight

Publishing uses four quality gates before a public launch:

- Source audit: official URLs, last-checked dates, fast-moving recheck windows, and K-pop ticketing/pop-up queues.
- Editorial audit: original summaries, visitor-useful travel notes, map-ready Korean place names, and correction-policy pages.
- Translation audit: English, Spanish, Chinese, Portuguese, Russian, and Japanese pages must build without missing public pages.
- UX audit: carousel navigation, calendar month headings, detail fact strips, weather blocks, map cards, and responsive page structure.
- CEO quality review: the planner, designer, publisher, and audit institution are scored separately; hard failures block release and warnings become CEO task dispatch items.

Run this before pushing a production launch build:

```powershell
$env:SITE_URL="https://your-domain.com"
$env:CONTACT_EMAIL="contact@your-domain.com"
$env:GOOGLE_SITE_VERIFICATION="search-console-meta-content"
npm.cmd run preflight:launch
```

The CEO report is written under `data/feeds/ceo-quality-review-YYYY-MM-DD.md`. Read it before a launch decision. A release can proceed only when the decision is `APPROVED_FOR_PUBLISH` or `APPROVED_WITH_CEO_TASKS`; `REWORK_REQUIRED` means the audit institution blocked release.

After AdSense gives a publisher ID and ad unit slot, run:

```powershell
$env:GOOGLE_ADSENSE_PUBLISHER_ID="pub-0000000000000000"
$env:GOOGLE_ADSENSE_CLIENT="ca-pub-0000000000000000"
$env:GOOGLE_ADSENSE_SLOT="0000000000"
npm.cmd run preflight:adsense
```

## 7. Search and AdSense

- Verify the domain in Google Search Console by DNS or meta tag.
- Submit `https://your-domain.com/sitemap.xml`.
- Wait until important pages are indexed before applying to AdSense.
- Apply with the real custom domain, not the Cloudflare preview URL.
- After approval, add the real AdSense IDs and rebuild so `/ads.txt` and ad placements are generated.

Approval and revenue are not guaranteed. The safest operating model is still official-source monitoring, reviewed publishing, original multilingual summaries, clear correction policy, and frequent freshness checks.
