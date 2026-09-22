# Source Review Candidates

Generated: 2026-09-22T23:03:37.138Z

This PR is an operating queue, not public site content. Do not merge draft text into `data/events.json` until an editor verifies the official page, fixes titles, confirms dates and venue, writes original multilingual copy, and passes `publish:reviewed`.

## Counts

| Metric | Value |
| --- | ---: |
| Audited sources | 56 |
| Audit OK | 49 |
| Audit failed | 7 |
| Candidate checks OK | 47 |
| Candidate checks failed | 6 |
| Discovered official links | 620 |
| Draft candidates | 43 |
| Skipped leads | 630 |
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

1. NOL World Seoul Pop-ups: Olive Young X Sanrio POP-UP 25 stores nationwide Myeongdong · 9.06 – 9.30 Likes ( 19 )
   - beauty / Seoul / 2026-09-06 to 2026-09-30 / priority 95
   - Source: NOL World Seoul Pop-ups
   - https://world.nol.com/en/content/festas/01a08356-1840-7c46-924e-ad05a11c03b2
   - Cleanup needed: no
2. Hyundai Department Store: 전시 사진 세계 2026.07.21 ~ 2026.11.01
   - department-store / Nationwide / 2026-07-21 to 2026-11-01 / priority 93
   - Source: Hyundai Department Store
   - https://www.ehyundai.com/newCulture/EH/EH000001_V.do?seq=2092864&bbsCd=210&sitemapId=01020100000000
   - Cleanup needed: no
3. NOL World Seoul Pop-ups: MIGHTEEZ Rock The Stage POP-UP 🎸 ATEEZ Hongik Univ. · 9.18 – 9.27 Likes ( 6 )
   - kpop / Seoul / 2026-09-18 to 2026-09-27 / priority 91
   - Source: NOL World Seoul Pop-ups
   - https://world.nol.com/en/content/festas/01a08dbf-fc3d-7a47-a017-2578f24bf756
   - Cleanup needed: no
4. Visit Seoul: Kwon Byungjun: I Embrace You 2026.06.11 ~ 2027.05.16 Exhibition Halls 5 and 6, B1 Floor, Seoul Museum of...
   - festival / Seoul / 2026-06-11 to 2027-05-16 / priority 90
   - Source: Visit Seoul
   - https://english.visitseoul.net/exhibition/IEmbraceYou/ENPm8j6gm
   - Cleanup needed: no
5. Visit Seoul: Seoul Museum of Photography 《Martin Parr : We Are Martin Parr》 2026.07.16 ~ 2026.10.18 Seoul Museum of...
   - festival / Seoul / 2026-07-16 to 2026-10-18 / priority 90
   - Source: Visit Seoul
   - https://english.visitseoul.net/exhibition/We-Are-Martin-Parr/ENPgeb6on
   - Cleanup needed: no
6. Visit Seoul: Sook Jin Jo : That's How the Light Gets In 2026.07.29 ~ 2026.11.15 2nd Floor and Outdoor Garden, SeMA...
   - festival / Seoul / 2026-07-29 to 2026-11-15 / priority 90
   - Source: Visit Seoul
   - https://english.visitseoul.net/exhibition/ThatsHowtheLightGetsIn/ENPo2o028
   - Cleanup needed: no
7. NOL World Ticket: 2026 Royal Guard Sumunjang Patrol Ceremony 9.05 – 11.29
   - festival / Seoul / 2026-09-05 to 2026-11-29 / priority 90
   - Source: NOL World Ticket
   - https://world.nol.com/en/content/festas/01a0125e-6a77-718c-99d8-bbe2d44631cb
   - Cleanup needed: no
8. NOL World Ticket: Hyundai Card Super Concert 28 The Weeknd Oct 07, 2026 - Oct 08, 2026 GOYANG STADIUM
   - festival / Goyang / 2026-10-07 to 2026-10-08 / priority 90
   - Source: NOL World Ticket
   - https://world.nol.com/en/ticket/places/26000511/products/26006903
   - Cleanup needed: no
9. NOL World Ticket: JX 2026 TOUR CONCERT in INCHEON CORE Incheon 10.09 – 10.11
   - festival / Incheon / 2026-10-09 to 2026-10-11 / priority 90
   - Source: NOL World Ticket
   - https://world.nol.com/en/content/festas/01a041ba-d6e9-769d-958b-20fc3f131f15
   - Cleanup needed: no
10. Visit Seoul: Hanyang Adventure Begins! 2026.03.27 ~ 2026.12.31 Children's Museum, 1st Floor, Seoul Museum of History An...
   - festival / Seoul / 2026-03-27 to 2026-12-31 / priority 88
   - Source: Visit Seoul
   - https://english.visitseoul.net/exhibition/hanyang-adventure-begins/ENP1udvdv
   - Cleanup needed: no
11. Visit Seoul: Somatic Ground - Small Studio Semi 2026.04.02 ~ 2027.05.30 Lounge 1, 1st Floor, Seoul Museum of Art...
   - festival / Seoul / 2026-04-02 to 2027-05-30 / priority 88
   - Source: Visit Seoul
   - https://english.visitseoul.net/exhibition/Somatic-Ground/ENPgmiqls
   - Cleanup needed: no
12. Visit Seoul: 2026 Seongbuk Museum of Art Special Exhibition 《Lee, Jung yoon: Singing ornaments in the house》 2026.04.17...
   - festival / Seoul / 2026-04-17 to 2026-11-21 / priority 88
   - Source: Visit Seoul
   - https://english.visitseoul.net/exhibition/Singing-ornaments-in-the-house/ENP9kal14
   - Cleanup needed: no
13. Visit Seoul: Yoo Youngkuk : A Mountain Within Me 2026.05.19 ~ 2026.10.25 1st Floor, Seosomun Main Building, Seoul...
   - festival / Seoul / 2026-05-19 to 2026-10-25 / priority 88
   - Source: Visit Seoul
   - https://english.visitseoul.net/exhibition/YYK/ENPfv3al6
   - Cleanup needed: no
14. Visit Seoul: Goya, the Spanish Master : The Sleep of Reason Produces Monsters Exhibition 2026.06.26 ~ 2026.09.30...
   - festival / Seoul / 2026-06-26 to 2026-09-30 / priority 88
   - Source: Visit Seoul
   - https://english.visitseoul.net/exhibition/goya/ENPny8ty6
   - Cleanup needed: no
15. Visit Seoul: Joseon Yangban Hospitality Culture Experience Performance 'Onggi Concert' 2026.07.02 ~ 2026.12.10...
   - festival / Seoul / 2026-07-02 to 2026-12-10 / priority 88
   - Source: Visit Seoul
   - https://english.visitseoul.net/exhibition/OnggiConcert/ENPsj8gga
   - Cleanup needed: no
16. Visit Seoul: From One Book to the World, K-Content: K-BOOK to the WORLD 2026.07.28 ~ 2026.10.06 Exhibition Hall, 1st...
   - festival / Seoul / 2026-07-28 to 2026-10-06 / priority 88
   - Source: Visit Seoul
   - https://english.visitseoul.net/exhibition/K-BOOKtotheWORLD/ENPz20943
   - Cleanup needed: no
17. NOL World Seoul Pop-ups: NCT 10TH ANNIVERSARY EVERYTHING, ALL AT ONCE, NEO 9.01 – 10.18 Likes ( 48 )
   - kpop / Seoul / 2026-09-01 to 2026-10-18 / priority 88
   - Source: NOL World Seoul Pop-ups
   - https://world.nol.com/en/content/festas/01a05a2f-17ae-78df-9f43-a460dc8fb2d5
   - Cleanup needed: no
18. Visit Seoul: Seoul Archives Children’s Record Experience Room 2024.10.04 ~ 2026.09.27 Exhibition Room 3, 2nd floor,...
   - festival / Seoul / 2026-09-27 to 2026-09-27 / priority 88
   - Source: Visit Seoul
   - https://english.visitseoul.net/exhibition/2024-Twisting/ENPs9gkpe
   - Cleanup needed: no
19. Visit Seoul: A Stroll Through Records: Seoul’s Parks 2023.12.01 ~ 2026.09.29 2nd Exhibition Hall, 2nd Floor, Seoul...
   - festival / Seoul / 2026-09-29 to 2026-09-29 / priority 88
   - Source: Visit Seoul
   - https://english.visitseoul.net/exhibition/2024-seoulsparks/ENPmfskyu
   - Cleanup needed: no
20. NOL World Ticket: ano LIVE in SEOUL, KOREA 2026 Oct 17, 2026 - Oct 18, 2026 BLUESQUARE WOORI WON BANKING HALL
   - festival / Seoul / 2026-10-17 to 2026-10-18 / priority 88
   - Source: NOL World Ticket
   - https://world.nol.com/en/ticket/places/26000166/products/26010474
   - Cleanup needed: no
21. NOL World Ticket: DAY6 5TH FANMEETING EVERY DAY6, EVERY My Day Incheon 10.23 – 10.25
   - kpop / Incheon / 2026-10-23 to 2026-10-25 / priority 88
   - Source: NOL World Ticket
   - https://world.nol.com/en/content/festas/01a08367-99ab-7455-b0df-43dfe7e7d6e0
   - Cleanup needed: no
22. NOL World Ticket: Benson Boone: Wanted Man Tour in Seoul Oct 26, 2026 Kintex 2 Exhibition Hall 10
   - festival / Seoul / 2026-10-26 to 2026-10-26 / priority 88
   - Source: NOL World Ticket
   - https://world.nol.com/en/ticket/places/26000813/products/26010154
   - Cleanup needed: no
23. NOL World Ticket: Khalid: It&#x27;s Always Summer Somewhere Tour in Seoul Dec 05, 2026 Kintex 2 Exhibition Hall 10
   - festival / Seoul / 2026-12-05 to 2026-12-05 / priority 88
   - Source: NOL World Ticket
   - https://world.nol.com/en/ticket/places/26000787/products/26009919
   - Cleanup needed: no
24. Visit Seoul: KAWS: FRIENDS AND NEIGHBORS 2026.07.23 ~ 2026.12.27 Space K Seoul The first solo museum exhibition in...
   - festival / Seoul / 2026-07-23 to 2026-12-27 / priority 87
   - Source: Visit Seoul
   - https://english.visitseoul.net/exhibition/KAWS/ENPzy336c
   - Cleanup needed: no
25. Visit Seoul: 2026 Title Match 《Oh Inhwan vs. Chang Seoyoung - Human Error》 2026.08.13 ~ 2026.10.25 Buk-Seoul Museum of...
   - festival / Seoul / 2026-08-13 to 2026-10-25 / priority 87
   - Source: Visit Seoul
   - https://english.visitseoul.net/exhibition/TitleMatch2026/ENPx8qi2o
   - Cleanup needed: no

## Failed Or Blocked Sources

- Seoul Metropolitan Government Monthly Event Calendar: ROBOTS (blocked by robots.txt)
- Dongdaemun Design Plaza: ERR (fetch failed)
- Lotte Duty Free: ROBOTS (blocked by robots.txt)
- Lotte Duty Free Online Sale: ROBOTS (blocked by robots.txt)
- AK Plaza Events: 400
- Melon Ticket: 423
- Boryeong Mud Festival: ERR (fetch failed)
- Jinju Namgang Yudeung Festival: ERR (fetch failed)
- COEX Event Calendar: ERR (fetch failed)
- SHOWALA exhibition listing: ERR (fetch failed)

## High-Signal Source Pages

1. Visit Seoul - 24 links, 18 date signals, 4 keywords
   - https://english.visitseoul.net/
2. Seoul Grand Park - 24 links, 18 date signals, 5 keywords
   - https://grandpark.seoul.go.kr/main.do
3. NOL World Seoul Pop-ups - 24 links, 18 date signals, 6 keywords
   - https://world.nol.com/en/regions/seoul/festas
4. SMTOWN andSTORE Notices - 24 links, 18 date signals, 3 keywords
   - https://www.smtownandstore.com/board/index.html
5. NOL World Ticket - 24 links, 18 date signals, 6 keywords
   - https://world.nol.com/
6. YES24 Ticket English - 24 links, 18 date signals, 1 keywords
   - https://ticket.yes24.com/english
7. Korea Sale FESTA - 24 links, 7 date signals, 8 keywords
   - https://www.motir.go.kr/search/search.do?kwd=%EC%BD%94%EB%A6%AC%EC%95%84%EC%84%B8%EC%9D%BC%ED%8E%98%EC%8A%A4%ED%83%80
8. Korea Sale FESTA - 24 links, 7 date signals, 8 keywords
   - https://www.motir.go.kr/search/search.do?kwd=%EC%BD%94%EB%A6%AC%EC%95%84%EC%84%B8%EC%9D%BC%ED%8E%98%EC%8A%A4%ED%83%80
