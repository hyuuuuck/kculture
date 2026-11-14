# Source Review Candidates

Generated: 2026-11-14T15:13:08.140Z

This PR is an operating queue, not public site content. Do not merge draft text into `data/events.json` until an editor verifies the official page, fixes titles, confirms dates and venue, writes original multilingual copy, and passes `publish:reviewed`.

## Counts

| Metric | Value |
| --- | ---: |
| Audited sources | 56 |
| Audit OK | 53 |
| Audit failed | 3 |
| Candidate checks OK | 47 |
| Candidate checks failed | 6 |
| Discovered official links | 611 |
| Draft candidates | 74 |
| Skipped leads | 590 |
| Public-data imports passed | 0 |
| Public-data imports failed | 0 |
| KTO TourAPI review rows | 0 |
| KMA approved-event observations | 0 |
| Seoul review rows | 0 |
| Seoul potential matches | 0 |

## Review Gate

KTO and Seoul API rows are discovery evidence only. They must never be copied or published automatically. The KMA count refers only to numeric same-period observations already bound to approved events.

1. Open the official source URL.
2. Confirm event identity, date range, time zone, venue, visitor eligibility, ticket/reservation rules, and whether the offer can close early.
3. Fix mojibake or generic titles.
4. Rewrite title, summary, why-go, and travel tips in original visitor-focused words.
5. Translate required public fields before publishing.
6. Save approved items to `data/feeds/reviewed-events.json`, then run:

```powershell
npm.cmd run publish:reviewed -- --file data/feeds/reviewed-events.json
npm.cmd run publish:reviewed -- --file data/feeds/reviewed-events.json --write
npm.cmd run preflight:launch
```

## Title Cleanup Required

No top candidates need title cleanup.

## Top Draft Candidates

1. NOL World Ticket: NEXZ 2ND FAN MEETING MERRY MERRY NEX2Y! 12.19 – 12.20
   - kpop / Seoul / 2026-12-19 to 2026-12-20 / priority 98
   - Source: NOL World Ticket
   - https://world.nol.com/en/content/festas/01a1d236-8540-761c-98a7-3036e8f3f312
   - Cleanup needed: no
2. NOL World Seoul Pop-ups: LONGTAKE POP-UP STORE OLIVE YOUNG BEAUTY MANSION Seongsu · 10.01 – 12.31 Likes ( 16 )
   - beauty / Seoul / 2026-10-01 to 2026-12-31 / priority 97
   - Source: NOL World Seoul Pop-ups
   - https://world.nol.com/en/content/festas/01a1a97d-d09c-7dd6-9d35-a8adb9d0e3f4
   - Cleanup needed: no
3. NOL World Seoul Pop-ups: D&#x27;FESTA THE ORIGIN EXHIBITION K-POP, Reimagined as Art 10.23 – 11.30 Comments ( 3 ) · Likes ( 931 )
   - kpop / Seoul / 2026-10-23 to 2026-11-30 / priority 95
   - Source: NOL World Seoul Pop-ups
   - https://world.nol.com/en/content/festas/01a141d8-0bcf-7835-a75c-c333ef17b892
   - Cleanup needed: no
4. Melon Ticket: Billlie 5th Anniversary Fan Concert 〈The Heist Squad〉 2026.11.15 - 2026.11.15 서강대학교 메리홀 대극장
   - kpop / Goyang / 2026-11-15 to 2026-11-15 / priority 95
   - Source: Melon Ticket
   - https://ticket.melon.com/performance/index.htm?prodId=214117
   - Cleanup needed: no
5. NOL World Seoul Pop-ups: 2026 BTS DALMAJUNG POP-UP HYBE YONGSAN Itaewon · 9.29 – 11.30 Likes ( 139 )
   - kpop / Seoul / 2026-09-29 to 2026-11-30 / priority 94
   - Source: NOL World Seoul Pop-ups
   - https://world.nol.com/en/content/festas/01a0ea58-1ff4-7e20-8fc1-37a78b9bdc3d
   - Cleanup needed: no
6. Weverse Shop BTS Notices: BTS official merch and pop-up notice list
   - kpop / Nationwide / 2026-10-22 to 2026-12-20 / priority 94
   - Source: Weverse Shop BTS Notices
   - https://shop.weverse.io/en/shop/USD/artists/2/notices
   - Cleanup needed: no
7. Weverse Shop BTS Notices: BTS Pre-order Harper&#x27;s BAZAAR (December 2026) N
   - kpop / Nationwide / 2026-12-20 to 2026-12-20 / priority 94
   - Source: Weverse Shop BTS Notices
   - https://shop.weverse.io/en/shop/USD/artists/2/notices/14898
   - Cleanup needed: no
8. Weverse Shop BTS Notices: BTS Pre-order VOGUE KOREA (December 2026) N
   - kpop / Nationwide / 2026-12-20 to 2026-12-20 / priority 94
   - Source: Weverse Shop BTS Notices
   - https://shop.weverse.io/en/shop/USD/artists/2/notices/14934
   - Cleanup needed: no
9. NOL World Seoul Pop-ups: ATEEZ POP-UP STORE GOLDEN HOUR : Part.6 Gangnam · 11.13 – 11.22 Likes ( 16 )
   - kpop / Seoul / 2026-11-13 to 2026-11-22 / priority 93
   - Source: NOL World Seoul Pop-ups
   - https://world.nol.com/en/content/festas/01a1c2a3-2e9e-7f33-b18e-e35738c3438d
   - Cleanup needed: no
10. NOL World Ticket: TOMORROW X TOGETHER POP-UP PERFECT STORM 11.17 – 11.22
   - festival / Seoul / 2026-11-17 to 2026-11-22 / priority 93
   - Source: NOL World Ticket
   - https://world.nol.com/en/content/festas/01a1c2ac-f0ff-7608-9301-2ee8de97d7c0
   - Cleanup needed: no
11. NOL World Seoul Pop-ups: 𝟮𝟬𝟮𝟲 𝗦𝗛𝗜𝗡𝗦𝗘𝗚𝗔𝗘 𝗛𝗢𝗟𝗜𝗗𝗔𝗬 𝗠𝗔𝗥𝗞𝗘𝗧 🎅🏻 Shinsegae Department Store Gangnam Branch...
   - department-store / Seoul / 2026-10-30 to 2026-12-28 / priority 92
   - Source: NOL World Seoul Pop-ups
   - https://world.nol.com/en/content/festas/01a18a16-ce57-7468-a987-17cbb2aca2c0
   - Cleanup needed: no
12. NOL World Seoul Pop-ups: Christmas in Myeongdong Lotte Department Store Main Branch Myeongdong · 10.30 – 12.31 Likes ( 64 )
   - department-store / Seoul / 2026-10-30 to 2026-12-31 / priority 92
   - Source: NOL World Seoul Pop-ups
   - https://world.nol.com/en/content/festas/01a18a05-fa78-7256-8413-c30226033bf4
   - Cleanup needed: no
13. Melon Ticket: 2026 히어로 락 페스티벌 - 인천 (일반티켓) 2026.12.18 - 2026.12.20 송도컨벤시아
   - festival / Goyang / 2026-12-18 to 2026-12-20 / priority 92
   - Source: Melon Ticket
   - https://ticket.melon.com/performance/index.htm?prodId=214275
   - Cleanup needed: no
14. NOL World Ticket: 2026 LOTTE TOWN CHRISTMAS MARKET 🎄 11.19 – 1.03
   - festival / Seoul / 2026-01-03 to 2026-11-19 / priority 91
   - Source: NOL World Ticket
   - https://world.nol.com/en/content/festas/01a1a918-fe34-7c5b-9882-736d71ad2e70
   - Cleanup needed: no
15. NOL World Ticket: 2026 DAY6 Special Concert The Present 12.18 – 12.20
   - kpop / Seoul / 2026-12-18 to 2026-12-20 / priority 91
   - Source: NOL World Ticket
   - https://world.nol.com/en/content/festas/01a1d207-1d4c-7c98-9bdc-56fefdf89f9a
   - Cleanup needed: no
16. NOL World Ticket: 2026 Romantic Hangang Christmas Market 🎄 12.24 – 12.27
   - festival / Seoul / 2026-12-24 to 2026-12-27 / priority 91
   - Source: NOL World Ticket
   - https://world.nol.com/en/content/festas/01a1a913-f375-7d54-b3e4-8667dd0645d2
   - Cleanup needed: no
17. Melon Ticket: 그라운드시소 전시 모음 브래드 월스전, 표기식 사진전, 성률 기획전, 티보 에렘 그라운드시소 전시 2026.04.30 - 2027.04.11
   - festival / Goyang / 2026-04-30 to 2027-04-11 / priority 90
   - Source: Melon Ticket
   - https://ticket.melon.com/performance/bridge.htm?brgId=100525
   - Cleanup needed: no
18. Visit Seoul: Full of Colors : Regions Shaping K 2026.06.04 ~ 2026.12.31 1st Floor Exhibition Room and Lobby,...
   - festival / Seoul / 2026-06-04 to 2026-12-31 / priority 90
   - Source: Visit Seoul
   - https://english.visitseoul.net/exhibition/Full-of-Colors/ENPij99b4
   - Cleanup needed: no
19. Melon Ticket: 2026 청년문화예술패스 06~07년생 덕질지원금 2026 청년문화예술패스 2026-08-10 - 2026-12-31
   - festival / Goyang / 2026-08-10 to 2026-12-31 / priority 90
   - Source: Melon Ticket
   - https://ticket.melon.com/plan/index.htm?planId=100101
   - Cleanup needed: no
20. Melon Ticket: 명탐정 코난전 -TV 애니메이션 방송 30주년 기념- 2026.08.12 - 2026.11.29 AK PLAZA HONGDAE 4F 오뮤지엄
   - festival / Seoul / 2026-08-12 to 2026-11-29 / priority 90
   - Source: Melon Ticket
   - https://ticket.melon.com/performance/index.htm?prodId=213593
   - Cleanup needed: no
21. Visit Seoul: Equinox: Autumnal Equinox_Vernal Equinox 2026.09.22 ~ 2027.03.07 Special Exhibition Gallery, 3F,...
   - festival / Seoul / 2026-09-22 to 2027-03-07 / priority 90
   - Source: Visit Seoul
   - https://english.visitseoul.net/exhibition/EQUINOX/ENPq79in8
   - Cleanup needed: no
22. Melon Ticket: 〈표기식 사진전: 빛은 어떻게 떨어졌길래 모두 다르게 반짝여서〉 2026.09.23 - 2027.03.01 그라운드시소 센트럴
   - festival / Goyang / 2026-09-23 to 2027-03-01 / priority 90
   - Source: Melon Ticket
   - https://ticket.melon.com/performance/index.htm?prodId=213780
   - Cleanup needed: no
23. Visit Seoul: BEAUTY IN LAYERS 2026.10.01 ~ 2027.02.09 B the B UPTOWN, DDP Market B2, 281, Eulji-ro, Jung-gu, Seoul...
   - beauty / Seoul / 2026-10-01 to 2027-02-09 / priority 90
   - Source: Visit Seoul
   - https://english.visitseoul.net/exhibition/BEAUTY-IN-LAYERS/ENPk8e0mk
   - Cleanup needed: no
24. Visit Seoul: Lynn Hershman Leeson: First Person Plural 2026.10.21 ~ 2027.02.21 2F-3F, Seoul Museum of Art (Seosomun...
   - festival / Seoul / 2026-10-21 to 2027-02-21 / priority 90
   - Source: Visit Seoul
   - https://english.visitseoul.net/exhibition/First-Person-Plural/ENPay5o6v
   - Cleanup needed: no
25. Visit Seoul: 2026 Royco Record Fair 2026.11.13 ~ 2026.11.15 Royco Building (112, Tojeong-ro, Mapo-gu, Seoul) A special...
   - shopping / Seoul / 2026-11-13 to 2026-11-15 / priority 90
   - Source: Visit Seoul
   - https://english.visitseoul.net/exhibition/2026RoycoRecordFair/ENPfbxxwq
   - Cleanup needed: no

## Failed Or Blocked Sources

- Seoul Metropolitan Government Monthly Event Calendar: ROBOTS (blocked by robots.txt)
- Dongdaemun Design Plaza: ERR (fetch failed)
- Lotte Duty Free: ROBOTS (blocked by robots.txt)
- Lotte Duty Free Online Sale: ROBOTS (blocked by robots.txt)
- Galleria Department Store: ERR (fetch failed)
- AK Plaza Events: 400

## High-Signal Source Pages

1. NOL World Ticket - 24 links, 18 date signals, 7 keywords
   - https://world.nol.com/
2. NOL World Seoul Pop-ups - 24 links, 18 date signals, 8 keywords
   - https://world.nol.com/en/regions/seoul/festas
3. Visit Seoul - 24 links, 18 date signals, 4 keywords
   - https://english.visitseoul.net/
4. Melon Ticket - 24 links, 18 date signals, 6 keywords
   - https://ticket.melon.com/main/index.htm
5. Seoul Grand Park - 24 links, 18 date signals, 4 keywords
   - https://grandpark.seoul.go.kr/main.do
6. COEX Event Calendar - 24 links, 18 date signals, 3 keywords
   - https://www.coex.co.kr/en/
7. SMTOWN andSTORE Notices - 24 links, 18 date signals, 3 keywords
   - https://www.smtownandstore.com/board/index.html
8. YES24 Ticket English - 24 links, 18 date signals, 1 keywords
   - https://ticket.yes24.com/english
