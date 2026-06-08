# Monetization Plan

## Revenue Reality

AdSense approval and USD 300/month revenue cannot be guaranteed. Revenue depends on traffic volume, country mix, page RPM, search rankings, seasonality, ad layout, and content quality.

This project is structured to increase the chance of useful traffic:

- Repeat planning behavior: event dates, reservations, weather, transport, stock, and official rule checks
- High-intent search topics: Korea shopping sale, Olive Young sale Korea, Korea duty free deal, K-pop pop-up Seoul, Korea festival calendar
- Multilingual long-tail traffic: English, Spanish, Chinese, Portuguese, and Russian visitor queries
- Seasonal archives: ended events stay useful as next-season planning pages
- Trust signals: official sources, last-checked dates, privacy/contact/about/terms pages

## Rough Traffic Needed for USD 300/month

These are planning estimates, not guarantees.

- Page RPM USD 3: about 100,000 pageviews/month
- Page RPM USD 6: about 50,000 pageviews/month
- Page RPM USD 10: about 30,000 pageviews/month

Travel, shopping, and beauty pages can vary widely by country and season.

## Pre-Approval Content Target

- 30+ verified event, deal, pop-up, guide, or archive pages
- 10+ original evergreen guide pages
- Working source, privacy, contact, terms, and about pages
- Thumbnail, date range, city, official source, and last-checked date on every event card
- Clear separation between live, upcoming, and ended events
- No copied official text beyond short factual labels

## Automation Priority

1. Korea Tourism Organization TourAPI: festival and tourism event candidates
2. VISITKOREA: official articles, travel calendar, benefits, and K-pop travel guides
3. OLIVE YOUNG Global: event and sale pages
4. Duty-free stores: Lotte, Shilla, Shinsegae, Hyundai official events
5. Department stores: Hyundai, Lotte, Shinsegae branch and event pages
6. K-pop: Weverse, official artist channels, official agency notices, and venue pages, always with manual review
7. KMA ASOS: previous-year same-period weather observations

## Freshness Operating Model

- GitHub Actions should refresh official page candidates three times per day by default.
- During major K-pop comeback, concert, Korea Grand Sale, or seasonal department-store sale periods, run the source refresh workflow manually with extra official notice URLs.
- Treat OLIVE YOUNG, duty-free, department-store, and K-pop pop-up pages as fast-changing offers. Public pages need `lastChecked`, an official source link, and a clear warning that inventory, coupon eligibility, and reservation slots can change.
- Never publish directly from scraped text. Convert the candidate into an original visitor-focused summary after checking the official page.
- Use `npm run draft:events` to create non-public event drafts from the latest official-source feed. These drafts speed up writing, but they must be verified, rewritten, and manually merged into `data/events.json` before becoming public.
- Use `npm run review:board` to inspect draft candidates as a private gallery with thumbnails, dates, official links, evidence snippets, and copyable JSON.
- Use `npm run publish:reviewed -- --file ...` as a guarded dry run before writing reviewed events into public data. This keeps unedited machine drafts out of the live site.

## Suggested Ad Layout After Approval

- Homepage: one display ad after the first event grid
- Event detail page: one in-content ad after facts, one lower-page ad after travel tips
- Guide page: one mid-article ad, one lower-page ad
- Avoid intrusive ads above the core event facts

Never use text that encourages ad clicks.

## Weekly Growth Routine

1. Add 10 to 20 verified new event candidates.
2. Convert the strongest candidates into polished detail pages.
3. Add one evergreen guide based on repeated visitor questions.
4. Archive ended offers instead of deleting them.
5. Submit updated sitemap in Search Console after major content batches.
6. Review Search Console queries and create pages that answer real search intent.

## Safety Rules

- Do not pretend to be an official brand, government site, venue, or artist channel.
- Do not publish unverified K-pop pop-up rumors.
- Do not scrape or republish full articles, images, or sale pages without rights.
- Do not show expired discounts as active.
- Do not publish pages with only machine-translated duplicate text and no added travel value.
