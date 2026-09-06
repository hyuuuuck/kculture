# Source Review Candidates

Generated: 2026-09-06T04:51:03.544Z

This PR is an operating queue, not public site content. Do not merge draft text into `data/events.json` until an editor verifies the official page, fixes titles, confirms dates and venue, writes original multilingual copy, and passes `publish:reviewed`.

## Counts

| Metric | Value |
| --- | ---: |
| Audited sources | 56 |
| Audit OK | 54 |
| Audit failed | 2 |
| Candidate checks OK | 46 |
| Candidate checks failed | 7 |
| Discovered official links | 637 |
| Draft candidates | 81 |
| Skipped leads | 609 |
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

1. NOL World Seoul Pop-ups: SINCHON K-POP FESTIVAL Hyundai Department Store Sinchon Branch 7.09 – 9.06 Likes ( 55 )
   - kpop / Seoul / 2026-07-09 to 2026-09-06 / priority 96
   - Source: NOL World Seoul Pop-ups
   - https://world.nol.com/en/content/festas/019f693e-9368-7eec-aea5-757d9423eec4
   - Cleanup needed: no
2. Visit Seoul: BANKSY: Still Here 2026.07.22 ~ 2026.11.03 ALT.1, The Hyundai Seoul A symbol stronger than identity,...
   - department-store / Seoul / 2026-07-22 to 2026-11-03 / priority 95
   - Source: Visit Seoul
   - https://english.visitseoul.net/exhibition/BANKSY-still-here/ENPx0x7wx
   - Cleanup needed: no
3. Visit Seoul: LALARECIPE × MeME : Happiness Recipe for Every Skin 2026.08.01 ~ 2026.09.30 B the B, B2, DDP Market, DDP,...
   - beauty / Seoul / 2026-08-01 to 2026-09-30 / priority 95
   - Source: Visit Seoul
   - https://english.visitseoul.net/exhibition/LALARECIPE-%C3%97-MeME--Happiness-Recipe-for-Every-Skin/ENPqkbvqx
   - Cleanup needed: no
4. Melon Ticket: 뮤지컬 〈엘리자벳〉 9/8 ~ 9/13 커튼콜 데이 뮤지컬 〈엘리자벳〉 2026.08.16 - 2026.11.15
   - festival / Goyang / 2026-08-16 to 2026-11-15 / priority 94
   - Source: Melon Ticket
   - https://ticket.melon.com/performance/bridge.htm?brgId=100512
   - Cleanup needed: no
5. Weverse Shop BTS Notices: BTS official merch and pop-up notice list
   - kpop / Nationwide / 2026-09-03 to 2026-09-20 / priority 94
   - Source: Weverse Shop BTS Notices
   - https://shop.weverse.io/en/shop/USD/artists/2/notices
   - Cleanup needed: no
6. Weverse Shop BTS Notices: BTS Pre-order GQ KOREA (September 2026)
   - kpop / Nationwide / 2026-09-20 to 2026-09-20 / priority 94
   - Source: Weverse Shop BTS Notices
   - https://shop.weverse.io/en/shop/USD/artists/2/notices/14020
   - Cleanup needed: no
7. Hyundai Department Store: 전시 사진 세계 2026.07.21 ~ 2026.11.01
   - department-store / Nationwide / 2026-07-21 to 2026-11-01 / priority 93
   - Source: Hyundai Department Store
   - https://www.ehyundai.com/newCulture/EH/EH000001_V.do?seq=2092864&bbsCd=210&sitemapId=01020100000000
   - Cleanup needed: no
8. Melon Ticket: ENHYPEN House of Vampire 몰입형 영상 전시 ENHYPEN House of Vampire 2026.08.13 - 2026.09.27
   - kpop / Goyang / 2026-08-13 to 2026-09-27 / priority 93
   - Source: Melon Ticket
   - https://ticket.melon.com/performance/index.htm?prodId=213683
   - Cleanup needed: no
9. Melon Ticket: 울트라백화점 부산 : 텍스트 쇼핑 클럽 2026.07.17 - 2026.11.01 P.ARK 2-3F
   - festival / Goyang / 2026-07-17 to 2026-11-01 / priority 92
   - Source: Melon Ticket
   - https://ticket.melon.com/performance/index.htm?prodId=213503
   - Cleanup needed: no
10. Melon Ticket: 뮤지컬 〈헬스키친〉 (Musical Hell’s Kitchen) 비지정석 40% 할인 뮤지컬 〈헬스키친〉 (Musical Hell’s Kitchen) 2026.07.24 - 2026.11.08
   - festival / Goyang / 2026-07-24 to 2026-11-08 / priority 92
   - Source: Melon Ticket
   - https://ticket.melon.com/performance/index.htm?prodId=213624
   - Cleanup needed: no
11. Melon Ticket: 표기식 사진전 2026.09.23 - 2027.03.01 그라운드시소 센트럴
   - festival / Goyang / 2026-09-23 to 2027-03-01 / priority 92
   - Source: Melon Ticket
   - https://ticket.melon.com/performance/index.htm?prodId=213780
   - Cleanup needed: no
12. NOL World Ticket: 2026 ATA Festival (Asia Top Artist Festival) Sep 19, 2026 - Sep 20, 2026 Nanji Hangang Park
   - festival / Seoul / 2026-09-19 to 2026-09-20 / priority 91
   - Source: NOL World Ticket
   - https://world.nol.com/en/ticket/places/26000671/products/26009383
   - Cleanup needed: no
13. Melon Ticket: 그라운드시소 전시 모음 브래드 월스전, 표기식 사진전, 성률 기획전 그라운드시소 전시 2026.04.30 - 2027.03.01
   - festival / Goyang / 2026-04-30 to 2027-03-01 / priority 90
   - Source: Melon Ticket
   - https://ticket.melon.com/performance/bridge.htm?brgId=100525
   - Cleanup needed: no
14. Visit Seoul: Kwon Byungjun: I Embrace You 2026.06.11 ~ 2027.05.16 Exhibition Halls 5 and 6, B1 Floor, Seoul Museum of...
   - festival / Seoul / 2026-06-11 to 2027-05-16 / priority 90
   - Source: Visit Seoul
   - https://english.visitseoul.net/exhibition/IEmbraceYou/ENPm8j6gm
   - Cleanup needed: no
15. Visit Seoul: You, As You Are - SimLee Da Eun 2026.06.25 ~ 2027.04.11 Lounge 2, 3 (Idle Space), 2nd Floor, Buk-Seoul...
   - festival / Seoul / 2026-06-25 to 2027-04-11 / priority 90
   - Source: Visit Seoul
   - https://english.visitseoul.net/exhibition/You-As-You-Are/ENPlhr9s8
   - Cleanup needed: no
16. Visit Seoul: Seoul Museum of Photography 《Martin Parr : We Are Martin Parr》 2026.07.16 ~ 2026.10.18 Seoul Museum of...
   - festival / Seoul / 2026-07-16 to 2026-10-18 / priority 90
   - Source: Visit Seoul
   - https://english.visitseoul.net/exhibition/We-Are-Martin-Parr/ENPgeb6on
   - Cleanup needed: no
17. Visit Seoul: Sook Jin Jo : That's How the Light Gets In 2026.07.29 ~ 2026.11.15 2nd Floor and Outdoor Garden, SeMA...
   - festival / Seoul / 2026-07-29 to 2026-11-15 / priority 90
   - Source: Visit Seoul
   - https://english.visitseoul.net/exhibition/ThatsHowtheLightGetsIn/ENPo2o028
   - Cleanup needed: no
18. Melon Ticket: 2026 청년문화예술패스 06~07년생 덕질지원금 2026 청년문화예술패스 2026-08-10 - 2026-12-31
   - festival / Goyang / 2026-08-10 to 2026-12-31 / priority 90
   - Source: Melon Ticket
   - https://ticket.melon.com/plan/index.htm?planId=100101
   - Cleanup needed: no
19. Melon Ticket: 명탐정 코난전 -TV 애니메이션 방송 30주년 기념- 명탐정 코난전 -TV 애니메이션 방송 30주년 기념- 2026.08.12 - 2026.11.29
   - festival / Goyang / 2026-08-12 to 2026-11-29 / priority 90
   - Source: Melon Ticket
   - https://ticket.melon.com/performance/index.htm?prodId=213593
   - Cleanup needed: no
20. Busan Metropolitan City Events and English News: Events 2026 Busan Dwaeji Gukbap Grand Fair 2026-08-26 - 2026-10-18 2026 Busan Dwaeji Gukbap Grand Fair ○...
   - festival / Busan / 2026-08-26 to 2026-10-18 / priority 90
   - Source: Busan Metropolitan City Events and English News
   - https://www.busan.go.kr/eng/bsevents/1751134?&curPage=&srchYear=&srchMonth=&srchStartDt=&srchEndDt=&srchKey=&srchText=&check=
   - Cleanup needed: no
21. Visit Seoul: The Color of Memory 2026.08.27 ~ 2026.09.19 K.O.N.G. GALLERY Redefining painting as an 'artistic memory...
   - festival / Seoul / 2026-08-27 to 2026-09-19 / priority 90
   - Source: Visit Seoul
   - https://english.visitseoul.net/exhibition/The-Color-of-Memory/ENPh6s7u3
   - Cleanup needed: no
22. Visit Seoul: Photographer Kang Jae-gu Solo Exhibition 2026.08.29 ~ 2026.09.13 KT&G Sangsangmadang Hongdae, Hongdae...
   - festival / Seoul / 2026-08-29 to 2026-09-13 / priority 90
   - Source: Visit Seoul
   - https://english.visitseoul.net/exhibition/Soldier/ENP7hbgp3
   - Cleanup needed: no
23. Visit Seoul: K-LOCAL BREW JOURNEY 2026: Moving Brewery by Tongyeong-ae Onna 2026.09.05 ~ 2026.09.13 Outdoor Yard, HiKR...
   - festival / Seoul / 2026-09-05 to 2026-09-13 / priority 90
   - Source: Visit Seoul
   - https://english.visitseoul.net/events/K-LOCAL-BREW-JOURNEY-2026/ENPnkdu41
   - Cleanup needed: no
24. Melon Ticket: ANYUJIN x JANGWONYOUNG Media Exhibition 안녕(An-Young) : ANYUJIN x JANGWONYOUNG Media Exhibition 2026.09.05...
   - festival / Goyang / 2026-09-05 to 2026-09-27 / priority 90
   - Source: Melon Ticket
   - https://ticket.melon.com/performance/index.htm?prodId=213826
   - Cleanup needed: no
25. NOL World Ticket: &TEAM KR 2nd Mini Album POP-UP Mark on Me 9.08 – 9.13
   - festival / Seoul / 2026-09-08 to 2026-09-13 / priority 90
   - Source: NOL World Ticket
   - https://world.nol.com/en/content/festas/01a05a26-74f6-79b0-a175-25da1098fe21
   - Cleanup needed: no

## Failed Or Blocked Sources

- Seoul Metropolitan Government Monthly Event Calendar: ROBOTS (blocked by robots.txt)
- Lotte Duty Free: ROBOTS (blocked by robots.txt)
- Lotte Duty Free Online Sale: ROBOTS (blocked by robots.txt)
- Shinsegae Duty Free: ERR (fetch failed)
- Shinsegae Department Store Events: ERR (fetch failed)
- Galleria Department Store: ERR (fetch failed)
- AK Plaza Events: 400

## High-Signal Source Pages

1. Busan Metropolitan City Events and English News - 24 links, 18 date signals, 3 keywords
   - https://www.busan.go.kr/eng/bsevents
2. Melon Ticket - 24 links, 18 date signals, 6 keywords
   - https://ticket.melon.com/main/index.htm
3. NOL World Seoul Pop-ups - 24 links, 18 date signals, 7 keywords
   - https://world.nol.com/en/regions/seoul/festas
4. NOL World Ticket - 24 links, 18 date signals, 5 keywords
   - https://world.nol.com/
5. Visit Seoul - 24 links, 18 date signals, 4 keywords
   - https://english.visitseoul.net/
6. Seoul Grand Park - 24 links, 18 date signals, 5 keywords
   - https://grandpark.seoul.go.kr/main.do
7. SMTOWN andSTORE Notices - 24 links, 18 date signals, 3 keywords
   - https://www.smtownandstore.com/board/index.html
8. YES24 Ticket English - 24 links, 18 date signals, 1 keywords
   - https://ticket.yes24.com/english
