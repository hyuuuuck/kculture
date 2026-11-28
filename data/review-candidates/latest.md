# Source Review Candidates

Generated: 2026-11-28T17:00:39.923Z

This PR is an operating queue, not public site content. Do not merge draft text into `data/events.json` until an editor verifies the official page, fixes titles, confirms dates and venue, writes original multilingual copy, and passes `publish:reviewed`.

## Counts

| Metric | Value |
| --- | ---: |
| Audited sources | 56 |
| Audit OK | 53 |
| Audit failed | 3 |
| Candidate checks OK | 47 |
| Candidate checks failed | 6 |
| Discovered official links | 584 |
| Draft candidates | 73 |
| Skipped leads | 564 |
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

1. NOL World Seoul Pop-ups: LONGTAKE POP-UP STORE OLIVE YOUNG BEAUTY MANSION Seongsu · 10.01 – 12.31 Likes ( 34 )
   - beauty / Seoul / 2026-10-01 to 2026-12-31 / priority 97
   - Source: NOL World Seoul Pop-ups
   - https://world.nol.com/en/content/festas/01a1a97d-d09c-7dd6-9d35-a8adb9d0e3f4
   - Cleanup needed: no
2. Shinsegae Group Newsroom: 미리 크리스마스! 이마트 트리∙장식용품 최대 30% 할인 본격적인 연말 시즌을 앞두고 이마트가 고객들의 크리스마스 준비 부담을 덜어줄 대규모 할인 행사에 나선다. 이마트는 11월 26일부터...
   - department-store / Nationwide / 2026-11-26 to 2026-12-02 / priority 97
   - Source: Shinsegae Group Newsroom
   - https://www.shinsegaegroupnewsroom.com/e-mart-sale-on-trees-and-decorations
   - Cleanup needed: no
3. Shinsegae Group Newsroom: “미리 메리 크리스마스!” 이마트, 트리∙장식용품 최대 30% 할인 본격적인 연말 시즌을 앞두고 이마트가 고객들의 크리스마스 준비 부담을 덜어줄 대규모 할인 행사에 나선다. 이마트는 11월...
   - department-store / Nationwide / 2026-11-26 to 2026-12-02 / priority 97
   - Source: Shinsegae Group Newsroom
   - https://www.shinsegaegroupnewsroom.com/e-mart-offers-discounts-on-trees-and-decorations
   - Cleanup needed: no
4. NOL World Seoul Pop-ups: D&#x27;FESTA THE ORIGIN EXHIBITION K-POP, Reimagined as Art 10.23 – 11.30 Comments ( 3 ) · Likes ( 977 )
   - kpop / Seoul / 2026-10-23 to 2026-11-30 / priority 95
   - Source: NOL World Seoul Pop-ups
   - https://world.nol.com/en/content/festas/01a141d8-0bcf-7835-a75c-c333ef17b892
   - Cleanup needed: no
5. Melon Ticket: CLASSy FANMEETING 〈CLICK! CLIKEy〉 2026.12.26 - 2026.12.26 대원 콘텐츠 라이브
   - kpop / Goyang / 2026-12-26 to 2026-12-26 / priority 95
   - Source: Melon Ticket
   - https://ticket.melon.com/performance/index.htm?prodId=214400
   - Cleanup needed: no
6. NOL World Seoul Pop-ups: 2026 BTS DALMAJUNG POP-UP HYBE YONGSAN Itaewon · 9.29 – 11.30 Likes ( 153 )
   - kpop / Seoul / 2026-09-29 to 2026-11-30 / priority 94
   - Source: NOL World Seoul Pop-ups
   - https://world.nol.com/en/content/festas/01a0ea58-1ff4-7e20-8fc1-37a78b9bdc3d
   - Cleanup needed: no
7. Weverse Shop BTS Notices: BTS official merch and pop-up notice list
   - kpop / Nationwide / 2026-12-20 to 2026-12-20 / priority 94
   - Source: Weverse Shop BTS Notices
   - https://shop.weverse.io/en/shop/USD/artists/2/notices
   - Cleanup needed: no
8. Weverse Shop BTS Notices: BTS Pre-order VOGUE KOREA (December 2026)
   - kpop / Nationwide / 2026-12-20 to 2026-12-20 / priority 94
   - Source: Weverse Shop BTS Notices
   - https://shop.weverse.io/en/shop/USD/artists/2/notices/14934
   - Cleanup needed: no
9. NOL World Seoul Pop-ups: ENHYPEN &#x27;THE SIN : PARALLEL WORLD&#x27; POP-UP STORE HYBE YONGSAN 11.24 – 11.29 Likes ( 6 )
   - kpop / Seoul / 2026-11-24 to 2026-11-29 / priority 93
   - Source: NOL World Seoul Pop-ups
   - https://world.nol.com/en/content/festas/01a1ed58-ec2b-78c2-a201-9b7c7e8cb57f
   - Cleanup needed: no
10. Shinsegae Group Newsroom: 신세계사이먼 프리미엄 아울렛, ‘사이먼 블랙프라이데이’ 개최 신세계사이먼(대표 김영섭)이 11월 27일부터 12월 13일까지 여주·파주·부산·시흥·제주 프리미엄 아울렛에서 ‘사이먼...
   - department-store / Nationwide / 2026-11-27 to 2026-12-13 / priority 93
   - Source: Shinsegae Group Newsroom
   - https://www.shinsegaegroupnewsroom.com/simon-black-friday
   - Cleanup needed: no
11. NOL World Ticket: 2026 BOYFRIEND FAN-CONCERT IN SEOUL ENCORE Dec 31, 2026 Cube Convention Center
   - kpop / Seoul / 2026-12-31 to 2026-12-31 / priority 93
   - Source: NOL World Ticket
   - https://world.nol.com/en/ticket/products/26016723
   - Cleanup needed: no
12. NOL World Seoul Pop-ups: 𝟮𝟬𝟮𝟲 𝗦𝗛𝗜𝗡𝗦𝗘𝗚𝗔𝗘 𝗛𝗢𝗟𝗜𝗗𝗔𝗬 𝗠𝗔𝗥𝗞𝗘𝗧 🎅🏻 Shinsegae Department Store Gangnam Branch...
   - department-store / Seoul / 2026-10-30 to 2026-12-28 / priority 92
   - Source: NOL World Seoul Pop-ups
   - https://world.nol.com/en/content/festas/01a18a16-ce57-7468-a987-17cbb2aca2c0
   - Cleanup needed: no
13. NOL World Seoul Pop-ups: Christmas in Myeongdong Lotte Department Store Main Branch Myeongdong · 10.30 – 12.31 Likes ( 79 )
   - department-store / Seoul / 2026-10-30 to 2026-12-31 / priority 92
   - Source: NOL World Seoul Pop-ups
   - https://world.nol.com/en/content/festas/01a18a05-fa78-7256-8413-c30226033bf4
   - Cleanup needed: no
14. Melon Ticket: 블랙프라이데이 타임세일 전석 20% 할인 뮤지컬 〈두 도시 이야기〉 2026.11.11 - 2027.02.08
   - festival / Goyang / 2026-11-11 to 2027-02-08 / priority 92
   - Source: Melon Ticket
   - https://ticket.melon.com/performance/index.htm?prodId=213865
   - Cleanup needed: no
15. Melon Ticket: AGF 2026 레드 스테이지 오픈! Anime X Game Festival 2026 2026.12.04 - 2026.12.06
   - festival / Goyang / 2026-12-04 to 2026-12-06 / priority 92
   - Source: Melon Ticket
   - https://ticket.melon.com/performance/bridge.htm?brgId=100534
   - Cleanup needed: no
16. Melon Ticket: 2 1 단계 상승 EXO-KASE Fancon Tour - SILENT CITY in SEOUL 2027.01.08 - 2027.01.10 고려대학교 화정체육관
   - kpop / Seoul / 2027-01-08 to 2027-01-10 / priority 92
   - Source: Melon Ticket
   - https://ticket.melon.com/performance/index.htm?prodId=214310
   - Cleanup needed: no
17. NOL World Ticket: 2026 DAY6 Special Concert The Present 12.18 – 12.20
   - kpop / Seoul / 2026-12-18 to 2026-12-20 / priority 91
   - Source: NOL World Ticket
   - https://world.nol.com/en/content/festas/01a1d207-1d4c-7c98-9bdc-56fefdf89f9a
   - Cleanup needed: no
18. NOL World Ticket: 2026 Romantic Hangang Christmas Market 🎄 12.24 – 12.27
   - festival / Seoul / 2026-12-24 to 2026-12-27 / priority 91
   - Source: NOL World Ticket
   - https://world.nol.com/en/content/festas/01a1a913-f375-7d54-b3e4-8667dd0645d2
   - Cleanup needed: no
19. Melon Ticket: 2026 청년문화예술패스 06~07년생 덕질지원금 2026 청년문화예술패스 2026-08-10 - 2026-12-31
   - festival / Goyang / 2026-08-10 to 2026-12-31 / priority 90
   - Source: Melon Ticket
   - https://ticket.melon.com/plan/index.htm?planId=100101
   - Cleanup needed: no
20. Melon Ticket: 브래드 월스 사진전 2026.09.11 - 2027.03.01 그라운드시소 용산
   - festival / Goyang / 2026-09-11 to 2027-03-01 / priority 90
   - Source: Melon Ticket
   - https://ticket.melon.com/performance/index.htm?prodId=213656
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
25. Visit Seoul: Most of Beauty: Enduring Time, What Remains 2026.11.05 ~ 2026.12.12 Samseyoung Gallery A solo exhibition...
   - beauty / Seoul / 2026-11-05 to 2026-12-12 / priority 90
   - Source: Visit Seoul
   - https://english.visitseoul.net/exhibition/Most-of-Beauty/ENPlixex1
   - Cleanup needed: no

## Failed Or Blocked Sources

- Seoul Metropolitan Government Monthly Event Calendar: ROBOTS (blocked by robots.txt)
- Dongdaemun Design Plaza: ERR (fetch failed)
- Lotte Duty Free: ROBOTS (blocked by robots.txt)
- Lotte Duty Free Online Sale: ROBOTS (blocked by robots.txt)
- Galleria Department Store: ERR (fetch failed)
- AK Plaza Events: 400

## High-Signal Source Pages

1. Melon Ticket - 24 links, 18 date signals, 6 keywords
   - https://ticket.melon.com/main/index.htm
2. NOL World Seoul Pop-ups - 24 links, 18 date signals, 8 keywords
   - https://world.nol.com/en/regions/seoul/festas
3. NOL World Ticket - 24 links, 18 date signals, 7 keywords
   - https://world.nol.com/
4. Visit Seoul - 24 links, 18 date signals, 4 keywords
   - https://english.visitseoul.net/
5. Seoul Grand Park - 24 links, 18 date signals, 4 keywords
   - https://grandpark.seoul.go.kr/main.do
6. COEX Event Calendar - 24 links, 18 date signals, 3 keywords
   - https://www.coex.co.kr/en/
7. YES24 Ticket English - 24 links, 18 date signals, 1 keywords
   - https://ticket.yes24.com/english
8. Shinsegae Group Newsroom - 23 links, 5 date signals, 7 keywords
   - https://www.shinsegaegroupnewsroom.com/category/press/
