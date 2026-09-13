# Source Review Candidates

Generated: 2026-09-13T13:23:39.251Z

This PR is an operating queue, not public site content. Do not merge draft text into `data/events.json` until an editor verifies the official page, fixes titles, confirms dates and venue, writes original multilingual copy, and passes `publish:reviewed`.

## Counts

| Metric | Value |
| --- | ---: |
| Audited sources | 56 |
| Audit OK | 53 |
| Audit failed | 3 |
| Candidate checks OK | 47 |
| Candidate checks failed | 6 |
| Discovered official links | 583 |
| Draft candidates | 75 |
| Skipped leads | 561 |
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

1. Melon Ticket: XMF(Xnterstellar Music Festival) 2026 Ado, DAY6, 원오크락 등 XMF(Xnterstellar Music Festival) 2026 2026.10.03 -...
   - kpop / Seoul / 2026-10-03 to 2026-10-04 / priority 97
   - Source: Melon Ticket
   - https://ticket.melon.com/performance/index.htm?prodId=213766
   - Cleanup needed: no
2. Visit Seoul: LALARECIPE × MeME : Happiness Recipe for Every Skin 2026.08.01 ~ 2026.09.30 B the B, B2, DDP Market, DDP,...
   - beauty / Seoul / 2026-08-01 to 2026-09-30 / priority 95
   - Source: Visit Seoul
   - https://english.visitseoul.net/exhibition/LALARECIPE-%C3%97-MeME--Happiness-Recipe-for-Every-Skin/ENPqkbvqx
   - Cleanup needed: no
3. NOL World Seoul Pop-ups: Olive Young X Sanrio POP-UP 25 stores nationwide Myeongdong · 9.06 – 9.30 Likes ( 13 )
   - beauty / Seoul / 2026-09-06 to 2026-09-30 / priority 95
   - Source: NOL World Seoul Pop-ups
   - https://world.nol.com/en/content/festas/01a08356-1840-7c46-924e-ad05a11c03b2
   - Cleanup needed: no
4. NOL World Ticket: DAY6 5TH FANMEETING EVERY DAY6, EVERY My Day Incheon 10.23 – 10.25
   - kpop / Incheon / 2026-10-23 to 2026-10-25 / priority 95
   - Source: NOL World Ticket
   - https://world.nol.com/en/content/festas/01a08367-99ab-7455-b0df-43dfe7e7d6e0
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
8. Melon Ticket: 울트라백화점 부산 텍스트 쇼핑 클럽 울트라백화점 부산 : 텍스트 쇼핑 클럽 2026.07.17 - 2026.11.01
   - festival / Seoul / 2026-07-17 to 2026-11-01 / priority 92
   - Source: Melon Ticket
   - https://ticket.melon.com/performance/index.htm?prodId=213503
   - Cleanup needed: no
9. Melon Ticket: 표기식 사진전 2026.09.23 - 2027.03.01 그라운드시소 센트럴
   - festival / Seoul / 2026-09-23 to 2027-03-01 / priority 92
   - Source: Melon Ticket
   - https://ticket.melon.com/performance/index.htm?prodId=213780
   - Cleanup needed: no
10. NOL World Ticket: 2026 ATA Festival (Asia Top Artist Festival) Sep 19, 2026 - Sep 20, 2026 Nanji Hangang Park
   - festival / Seoul / 2026-09-19 to 2026-09-20 / priority 91
   - Source: NOL World Ticket
   - https://world.nol.com/en/ticket/places/26000671/products/26009383
   - Cleanup needed: no
11. Melon Ticket: 그라운드시소 전시 모음 브래드 월스전, 표기식 사진전, 성률 기획전 그라운드시소 전시 2026.04.30 - 2027.03.01
   - festival / Seoul / 2026-04-30 to 2027-03-01 / priority 90
   - Source: Melon Ticket
   - https://ticket.melon.com/performance/bridge.htm?brgId=100525
   - Cleanup needed: no
12. Visit Seoul: Kwon Byungjun: I Embrace You 2026.06.11 ~ 2027.05.16 Exhibition Halls 5 and 6, B1 Floor, Seoul Museum of...
   - festival / Seoul / 2026-06-11 to 2027-05-16 / priority 90
   - Source: Visit Seoul
   - https://english.visitseoul.net/exhibition/IEmbraceYou/ENPm8j6gm
   - Cleanup needed: no
13. Visit Seoul: Seoul Museum of Photography 《Martin Parr : We Are Martin Parr》 2026.07.16 ~ 2026.10.18 Seoul Museum of...
   - festival / Seoul / 2026-07-16 to 2026-10-18 / priority 90
   - Source: Visit Seoul
   - https://english.visitseoul.net/exhibition/We-Are-Martin-Parr/ENPgeb6on
   - Cleanup needed: no
14. Visit Seoul: Sook Jin Jo : That's How the Light Gets In 2026.07.29 ~ 2026.11.15 2nd Floor and Outdoor Garden, SeMA...
   - festival / Seoul / 2026-07-29 to 2026-11-15 / priority 90
   - Source: Visit Seoul
   - https://english.visitseoul.net/exhibition/ThatsHowtheLightGetsIn/ENPo2o028
   - Cleanup needed: no
15. Melon Ticket: 뮤지컬 〈엘리자벳〉 죽음마저 사랑에 빠지게 한 아름다운 황후 뮤지컬 〈엘리자벳〉 2026.08.16 - 2026.11.15
   - festival / Seoul / 2026-08-16 to 2026-11-15 / priority 90
   - Source: Melon Ticket
   - https://ticket.melon.com/performance/bridge.htm?brgId=100512
   - Cleanup needed: no
16. Visit Seoul: The Color of Memory 2026.08.27 ~ 2026.09.19 K.O.N.G. GALLERY Redefining painting as an 'artistic memory...
   - festival / Seoul / 2026-08-27 to 2026-09-19 / priority 90
   - Source: Visit Seoul
   - https://english.visitseoul.net/exhibition/The-Color-of-Memory/ENPh6s7u3
   - Cleanup needed: no
17. Visit Seoul: Photographer Kang Jae-gu Solo Exhibition 2026.08.29 ~ 2026.09.13 KT&G Sangsangmadang Hongdae, Hongdae...
   - festival / Seoul / 2026-08-29 to 2026-09-13 / priority 90
   - Source: Visit Seoul
   - https://english.visitseoul.net/exhibition/Soldier/ENP7hbgp3
   - Cleanup needed: no
18. Visit Seoul: K-LOCAL BREW JOURNEY 2026: Moving Brewery by Tongyeong-ae Onna 2026.09.05 ~ 2026.09.13 Outdoor Yard, HiKR...
   - festival / Seoul / 2026-09-05 to 2026-09-13 / priority 90
   - Source: Visit Seoul
   - https://english.visitseoul.net/events/K-LOCAL-BREW-JOURNEY-2026/ENPnkdu41
   - Cleanup needed: no
19. Melon Ticket: OST 페스티벌 FT아일랜드, 리센느 등! 2026 GHOST 페스티벌 2026.10.09 - 2026.10.11
   - festival / Seoul / 2026-10-09 to 2026-10-11 / priority 90
   - Source: Melon Ticket
   - https://ticket.melon.com/performance/index.htm?prodId=213569
   - Cleanup needed: no
20. Melon Ticket: 원더리벳 2026 더오랄시가렛, 알렉산드로스, 유즈 등! WONDERLIVET 2026 (원더리벳 2026) 2026.11.20 - 2026.11.22
   - festival / Seoul / 2026-11-20 to 2026-11-22 / priority 90
   - Source: Melon Ticket
   - https://ticket.melon.com/performance/index.htm?prodId=213793
   - Cleanup needed: no
21. Melon Ticket: 홈커밍스 내한 공연 “You are you, even if no one fill in about you.” 2026.12.13 - 2026.12.13 무신사 개러지
   - festival / Seoul / 2026-12-13 to 2026-12-13 / priority 90
   - Source: Melon Ticket
   - https://ticket.melon.com/performance/index.htm?prodId=213806
   - Cleanup needed: no
22. Melon Ticket: 2026 대구힙합페스티벌 얼리버드 티켓 한정 수량 오픈 2026 대구힙합페스티벌 2026.12.25 - 2026.12.26
   - festival / Seoul / 2026-12-25 to 2026-12-26 / priority 90
   - Source: Melon Ticket
   - https://ticket.melon.com/performance/index.htm?prodId=213665
   - Cleanup needed: no
23. Melon Ticket: ROLLINGHALL 홍대 뮤직 메카, 롤링홀 롤링홀 상시 기획전 2021-07-19 - 2026-12-31
   - festival / Seoul / 2026-12-31 to 2026-12-31 / priority 90
   - Source: Melon Ticket
   - https://ticket.melon.com/plan/index.htm?planId=100058
   - Cleanup needed: no
24. NOL World Ticket: 2026 Royal Guard Sumunjang Patrol Ceremony 9.05 – 11.29
   - festival / Seoul / 2026-09-05 to 2026-11-29 / priority 89
   - Source: NOL World Ticket
   - https://world.nol.com/en/content/festas/01a0125e-6a77-718c-99d8-bbe2d44631cb
   - Cleanup needed: no
25. NOL World Ticket: Hyundai Card Super Concert 28 The Weeknd Oct 07, 2026 - Oct 08, 2026 GOYANG STADIUM
   - festival / Goyang / 2026-10-07 to 2026-10-08 / priority 89
   - Source: NOL World Ticket
   - https://world.nol.com/en/ticket/places/26000511/products/26006903
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
2. NOL World Ticket - 24 links, 18 date signals, 5 keywords
   - https://world.nol.com/
3. Visit Seoul - 24 links, 18 date signals, 4 keywords
   - https://english.visitseoul.net/
4. NOL World Seoul Pop-ups - 24 links, 18 date signals, 6 keywords
   - https://world.nol.com/en/regions/seoul/festas
5. Seoul Grand Park - 24 links, 18 date signals, 4 keywords
   - https://grandpark.seoul.go.kr/main.do
6. SMTOWN andSTORE Notices - 24 links, 18 date signals, 3 keywords
   - https://www.smtownandstore.com/board/index.html
7. YES24 Ticket English - 24 links, 18 date signals, 1 keywords
   - https://ticket.yes24.com/english
8. YG SELECT Notices - 24 links, 9 date signals, 3 keywords
   - https://www.ygselect.com/board/index.html
