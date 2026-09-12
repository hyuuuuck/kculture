# Source Review Candidates

Generated: 2026-09-12T12:16:12.204Z

This PR is an operating queue, not public site content. Do not merge draft text into `data/events.json` until an editor verifies the official page, fixes titles, confirms dates and venue, writes original multilingual copy, and passes `publish:reviewed`.

## Counts

| Metric | Value |
| --- | ---: |
| Audited sources | 56 |
| Audit OK | 47 |
| Audit failed | 9 |
| Candidate checks OK | 46 |
| Candidate checks failed | 7 |
| Discovered official links | 555 |
| Draft candidates | 55 |
| Skipped leads | 553 |
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

1. Visit Seoul: BANKSY: Still Here 2026.07.22 ~ 2026.11.03 ALT.1, The Hyundai Seoul A symbol stronger than identity,...
   - department-store / Seoul / 2026-07-22 to 2026-11-03 / priority 95
   - Source: Visit Seoul
   - https://english.visitseoul.net/exhibition/BANKSY-still-here/ENPx0x7wx
   - Cleanup needed: no
2. Visit Seoul: LALARECIPE × MeME : Happiness Recipe for Every Skin 2026.08.01 ~ 2026.09.30 B the B, B2, DDP Market, DDP,...
   - beauty / Seoul / 2026-08-01 to 2026-09-30 / priority 95
   - Source: Visit Seoul
   - https://english.visitseoul.net/exhibition/LALARECIPE-%C3%97-MeME--Happiness-Recipe-for-Every-Skin/ENPqkbvqx
   - Cleanup needed: no
3. NOL World Seoul Pop-ups: Olive Young X Sanrio POP-UP 25 stores nationwide Myeongdong · 9.06 – 9.30 Likes ( 12 )
   - beauty / Seoul / 2026-09-06 to 2026-09-30 / priority 95
   - Source: NOL World Seoul Pop-ups
   - https://world.nol.com/en/content/festas/01a08356-1840-7c46-924e-ad05a11c03b2
   - Cleanup needed: no
4. Weverse Shop BTS Notices: BTS official merch and pop-up notice list
   - kpop / Nationwide / 2026-09-03 to 2026-09-20 / priority 94
   - Source: Weverse Shop BTS Notices
   - https://shop.weverse.io/en/shop/USD/artists/2/notices
   - Cleanup needed: no
5. Weverse Shop BTS Notices: BTS Pre-order GQ KOREA (September 2026)
   - kpop / Nationwide / 2026-09-20 to 2026-09-20 / priority 94
   - Source: Weverse Shop BTS Notices
   - https://shop.weverse.io/en/shop/USD/artists/2/notices/14020
   - Cleanup needed: no
6. Hyundai Department Store: 전시 사진 세계 2026.07.21 ~ 2026.11.01
   - department-store / Nationwide / 2026-07-21 to 2026-11-01 / priority 93
   - Source: Hyundai Department Store
   - https://www.ehyundai.com/newCulture/EH/EH000001_V.do?seq=2092864&bbsCd=210&sitemapId=01020100000000
   - Cleanup needed: no
7. NOL World Ticket: NCT 10TH ANNIVERSARY EVERYTHING, ALL AT ONCE, NEO 9.01 – 10.18
   - kpop / Seoul / 2026-09-01 to 2026-10-18 / priority 92
   - Source: NOL World Ticket
   - https://world.nol.com/en/content/festas/01a05a2f-17ae-78df-9f43-a460dc8fb2d5
   - Cleanup needed: no
8. NOL World Ticket: 2026 ATA Festival (Asia Top Artist Festival) Sep 19, 2026 - Sep 20, 2026 Nanji Hangang Park
   - festival / Seoul / 2026-09-19 to 2026-09-20 / priority 91
   - Source: NOL World Ticket
   - https://world.nol.com/en/ticket/places/26000671/products/26009383
   - Cleanup needed: no
9. Visit Seoul: Kwon Byungjun: I Embrace You 2026.06.11 ~ 2027.05.16 Exhibition Halls 5 and 6, B1 Floor, Seoul Museum of...
   - festival / Seoul / 2026-06-11 to 2027-05-16 / priority 90
   - Source: Visit Seoul
   - https://english.visitseoul.net/exhibition/IEmbraceYou/ENPm8j6gm
   - Cleanup needed: no
10. Visit Seoul: Seoul Museum of Photography 《Martin Parr : We Are Martin Parr》 2026.07.16 ~ 2026.10.18 Seoul Museum of...
   - festival / Seoul / 2026-07-16 to 2026-10-18 / priority 90
   - Source: Visit Seoul
   - https://english.visitseoul.net/exhibition/We-Are-Martin-Parr/ENPgeb6on
   - Cleanup needed: no
11. Visit Seoul: Sook Jin Jo : That's How the Light Gets In 2026.07.29 ~ 2026.11.15 2nd Floor and Outdoor Garden, SeMA...
   - festival / Seoul / 2026-07-29 to 2026-11-15 / priority 90
   - Source: Visit Seoul
   - https://english.visitseoul.net/exhibition/ThatsHowtheLightGetsIn/ENPo2o028
   - Cleanup needed: no
12. Visit Seoul: The Color of Memory 2026.08.27 ~ 2026.09.19 K.O.N.G. GALLERY Redefining painting as an 'artistic memory...
   - festival / Seoul / 2026-08-27 to 2026-09-19 / priority 90
   - Source: Visit Seoul
   - https://english.visitseoul.net/exhibition/The-Color-of-Memory/ENPh6s7u3
   - Cleanup needed: no
13. Visit Seoul: Photographer Kang Jae-gu Solo Exhibition 2026.08.29 ~ 2026.09.13 KT&G Sangsangmadang Hongdae, Hongdae...
   - festival / Seoul / 2026-08-29 to 2026-09-13 / priority 90
   - Source: Visit Seoul
   - https://english.visitseoul.net/exhibition/Soldier/ENP7hbgp3
   - Cleanup needed: no
14. Visit Seoul: K-LOCAL BREW JOURNEY 2026: Moving Brewery by Tongyeong-ae Onna 2026.09.05 ~ 2026.09.13 Outdoor Yard, HiKR...
   - festival / Seoul / 2026-09-05 to 2026-09-13 / priority 90
   - Source: Visit Seoul
   - https://english.visitseoul.net/events/K-LOCAL-BREW-JOURNEY-2026/ENPnkdu41
   - Cleanup needed: no
15. NOL World Ticket: EXO PLANET #6 - EXhOrizon KSPO DOME Gangnam 11.06 – 11.08
   - festival / Seoul / 2026-11-06 to 2026-11-08 / priority 90
   - Source: NOL World Ticket
   - https://world.nol.com/en/content/festas/01a045bd-3643-73d0-a853-9e483c05655f
   - Cleanup needed: no
16. NOL World Ticket: 2026 Royal Guard Sumunjang Patrol Ceremony 9.05 – 11.29
   - festival / Seoul / 2026-09-05 to 2026-11-29 / priority 89
   - Source: NOL World Ticket
   - https://world.nol.com/en/content/festas/01a0125e-6a77-718c-99d8-bbe2d44631cb
   - Cleanup needed: no
17. NOL World Ticket: 2026 PLAVE World Tour ［KEEP IT MANIC］ in Incheon Sep 12, 2026 - Sep 13, 2026 Incheon Munhak Main Stadium
   - festival / Incheon / 2026-09-12 to 2026-09-13 / priority 89
   - Source: NOL World Ticket
   - https://world.nol.com/en/ticket/places/26000643/products/26008189
   - Cleanup needed: no
18. NOL World Ticket: Hyundai Card Super Concert 28 The Weeknd Oct 07, 2026 - Oct 08, 2026 GOYANG STADIUM
   - festival / Goyang / 2026-10-07 to 2026-10-08 / priority 89
   - Source: NOL World Ticket
   - https://world.nol.com/en/ticket/places/26000511/products/26006903
   - Cleanup needed: no
19. Visit Seoul: Hanyang Adventure Begins! 2026.03.27 ~ 2026.12.31 Children's Museum, 1st Floor, Seoul Museum of History An...
   - festival / Seoul / 2026-03-27 to 2026-12-31 / priority 88
   - Source: Visit Seoul
   - https://english.visitseoul.net/exhibition/hanyang-adventure-begins/ENP1udvdv
   - Cleanup needed: no
20. Visit Seoul: 2026 Seongbuk Museum of Art Special Exhibition 《Lee, Jung yoon: Singing ornaments in the house》 2026.04.17...
   - festival / Seoul / 2026-04-17 to 2026-11-21 / priority 88
   - Source: Visit Seoul
   - https://english.visitseoul.net/exhibition/Singing-ornaments-in-the-house/ENP9kal14
   - Cleanup needed: no
21. Visit Seoul: Goya, the Spanish Master : The Sleep of Reason Produces Monsters Exhibition 2026.06.26 ~ 2026.09.30...
   - festival / Seoul / 2026-06-26 to 2026-09-30 / priority 88
   - Source: Visit Seoul
   - https://english.visitseoul.net/exhibition/goya/ENPny8ty6
   - Cleanup needed: no
22. Visit Seoul: Joseon Yangban Hospitality Culture Experience Performance 'Onggi Concert' 2026.07.02 ~ 2026.12.10...
   - festival / Seoul / 2026-07-02 to 2026-12-10 / priority 88
   - Source: Visit Seoul
   - https://english.visitseoul.net/exhibition/OnggiConcert/ENPsj8gga
   - Cleanup needed: no
23. Visit Seoul: Fiber Art Special Exhibition 《Texture of Rest》 2026.07.24 ~ 2026.10.02 Wooran 1, Wooran 2, Wooran Cultural...
   - festival / Seoul / 2026-07-24 to 2026-10-02 / priority 88
   - Source: Visit Seoul
   - https://english.visitseoul.net/exhibition/%E3%80%8A--Texture-of-Rest%E3%80%8B/ENPii0mwl
   - Cleanup needed: no
24. Visit Seoul: From One Book to the World, K-Content: K-BOOK to the WORLD 2026.07.28 ~ 2026.10.06 Exhibition Hall, 1st...
   - festival / Seoul / 2026-07-28 to 2026-10-06 / priority 88
   - Source: Visit Seoul
   - https://english.visitseoul.net/exhibition/K-BOOKtotheWORLD/ENPz20943
   - Cleanup needed: no
25. Visit Seoul: SEOUL LIGHT DDP 2026 Autumn 2026.09.03 ~ 2026.09.13 DDP The world's largest free-form media facade...
   - festival / Seoul / 2026-09-03 to 2026-09-13 / priority 88
   - Source: Visit Seoul
   - https://english.visitseoul.net/events/SeoulLightddp2026/ENP8m1ey6
   - Cleanup needed: no

## Failed Or Blocked Sources

- Seoul Metropolitan Government Monthly Event Calendar: ROBOTS (blocked by robots.txt)
- Dongdaemun Design Plaza: ERR (fetch failed)
- Lotte Duty Free: ROBOTS (blocked by robots.txt)
- Lotte Duty Free Online Sale: ROBOTS (blocked by robots.txt)
- Galleria Department Store: ERR (fetch failed)
- AK Plaza Events: 400
- Melon Ticket: 423
- Ministry of Culture, Sports and Tourism: ERR (fetch failed)
- Busan Metropolitan City Events and English News: ERR (fetch failed)
- Visit Jeju Festival Calendar: ERR (fetch failed)
- Daegu Tourist Information Festival Schedule: ERR (fetch failed)
- Daegu Chimac Festival: ERR (fetch failed)

## High-Signal Source Pages

1. NOL World Ticket - 24 links, 18 date signals, 5 keywords
   - https://world.nol.com/
2. Visit Seoul - 24 links, 18 date signals, 4 keywords
   - https://english.visitseoul.net/
3. NOL World Seoul Pop-ups - 24 links, 18 date signals, 6 keywords
   - https://world.nol.com/en/regions/seoul/festas
4. Seoul Grand Park - 24 links, 18 date signals, 4 keywords
   - https://grandpark.seoul.go.kr/main.do
5. SMTOWN andSTORE Notices - 24 links, 18 date signals, 3 keywords
   - https://www.smtownandstore.com/board/index.html
6. YES24 Ticket English - 24 links, 18 date signals, 1 keywords
   - https://ticket.yes24.com/english
7. Hyundai Department Store - 24 links, 4 date signals, 6 keywords
   - https://www.ehyundai.com/newPortal/index.do
8. Hyundai Department Store Events - 24 links, 4 date signals, 6 keywords
   - https://www.ehyundai.com/newPortal/index.do
