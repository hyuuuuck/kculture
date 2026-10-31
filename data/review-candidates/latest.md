# Source Review Candidates

Generated: 2026-10-31T14:37:26.701Z

This PR is an operating queue, not public site content. Do not merge draft text into `data/events.json` until an editor verifies the official page, fixes titles, confirms dates and venue, writes original multilingual copy, and passes `publish:reviewed`.

## Counts

| Metric | Value |
| --- | ---: |
| Audited sources | 56 |
| Audit OK | 53 |
| Audit failed | 3 |
| Candidate checks OK | 47 |
| Candidate checks failed | 6 |
| Discovered official links | 603 |
| Draft candidates | 72 |
| Skipped leads | 584 |
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

1. Shinsegae Group Newsroom: “기다렸던 굿즈부터 한정 신상품까지 쓱!” 스타벅스, ‘대한민국 쓱데이’ 맞아 다양한 쇼핑 혜택 제공하는 프로모션 전개 스타벅스 코리아가 신세계그룹의 쇼핑 축제 ‘대한민국 쓱데이’를 맞아...
   - department-store / Nationwide / 2026-10-30 to 2026-11-08 / priority 97
   - Source: Shinsegae Group Newsroom
   - https://www.shinsegaegroupnewsroom.com/starbucks-launches-various-shopping-benefit-promotions-for-korea-ssg-day
   - Cleanup needed: no
2. NOL World Seoul Pop-ups: MEDIHEAL X Seoul City POP-UP Olive Young N Seongsu Seongsu · 10.01 – 10.31 Likes ( 10 )
   - beauty / Seoul / 2026-10-01 to 2026-10-31 / priority 96
   - Source: NOL World Seoul Pop-ups
   - https://world.nol.com/en/content/festas/01a15d3b-7015-7b2c-abbd-f0bad071c7db
   - Cleanup needed: no
3. NOL World Seoul Pop-ups: ZEROID X Nureongi POP-UP Olive Young Hongdae Town Hongik Univ. · 10.01 – 10.31 Likes ( 5 )
   - beauty / Seoul / 2026-10-01 to 2026-10-31 / priority 96
   - Source: NOL World Seoul Pop-ups
   - https://world.nol.com/en/content/festas/01a118cc-7bbd-7602-8686-4873556a4468
   - Cleanup needed: no
4. Visit Seoul: Secret K-Showindow 2026.10.26 ~ 2026.10.31 1F, SVC Seoul A pop-up store where you can discover 188...
   - beauty / Seoul / 2026-10-26 to 2026-10-31 / priority 96
   - Source: Visit Seoul
   - https://english.visitseoul.net/events/Secret-K-Showindow/ENPmeox0m
   - Cleanup needed: no
5. Melon Ticket: NCT WISH 2nd CONCERT TOUR ‘INTO THE WISH : Face Our WISH’ IN SEOUL NCT WISH 2nd CONCERT TOUR ‘INTO THE...
   - kpop / Seoul / 2027-01-15 to 2027-01-16 / priority 95
   - Source: Melon Ticket
   - https://ticket.melon.com/performance/index.htm?prodId=214071
   - Cleanup needed: no
6. NOL World Seoul Pop-ups: D&#x27;FESTA THE ORIGIN EXHIBITION K-POP, Reimagined as Art 10.23 – 11.30 Comments ( 2 ) · Likes ( 693 )
   - kpop / Seoul / 2026-10-23 to 2026-11-30 / priority 94
   - Source: NOL World Seoul Pop-ups
   - https://world.nol.com/en/content/festas/01a141d8-0bcf-7835-a75c-c333ef17b892
   - Cleanup needed: no
7. NOL World Seoul Pop-ups: DAY6 5TH FANMEETING POP-UP STORE EVERY DAY6, EVERY My Day Itaewon · 10.23 – 11.01 Likes ( 6 )
   - kpop / Seoul / 2026-10-23 to 2026-11-01 / priority 94
   - Source: NOL World Seoul Pop-ups
   - https://world.nol.com/en/content/festas/01a1568f-6c21-7e12-b8ec-0904afa899cb
   - Cleanup needed: no
8. NOL World Seoul Pop-ups: 2026 BTS DALMAJUNG POP-UP HYBE YONGSAN Itaewon · 9.29 – 11.30 Likes ( 113 )
   - kpop / Seoul / 2026-09-29 to 2026-11-30 / priority 93
   - Source: NOL World Seoul Pop-ups
   - https://world.nol.com/en/content/festas/01a0ea58-1ff4-7e20-8fc1-37a78b9bdc3d
   - Cleanup needed: no
9. NOL World Ticket: NMIXX 1ST WORLD TOUR FINALE IN INCHEON EPISODE 1: ZERO FRONTIER Incheon 11.27 – 11.29
   - festival / Incheon / 2026-11-27 to 2026-11-29 / priority 93
   - Source: NOL World Ticket
   - https://world.nol.com/en/content/festas/01a0320c-febb-7711-aad0-d39586c2da5f
   - Cleanup needed: no
10. Melon Ticket: 브래드 월스 사진전 2026.09.11 - 2027.03.01 그라운드시소 용산
   - festival / Seoul / 2026-09-11 to 2027-03-01 / priority 92
   - Source: Melon Ticket
   - https://ticket.melon.com/performance/index.htm?prodId=213656
   - Cleanup needed: no
11. Melon Ticket: 1 1 단계 상승 2026 aespa FAN MEETING “MY 보고싶다 ae가” 2026.11.28 - 2026.11.29 고려대학교 화정체육관
   - kpop / Seoul / 2026-11-28 to 2026-11-29 / priority 92
   - Source: Melon Ticket
   - https://ticket.melon.com/performance/index.htm?prodId=214159
   - Cleanup needed: no
12. Melon Ticket: 2 1 단계 하락 2026 AND2BLE FAN-CON 〈W!nter inside〉 In Seoul 2026.12.04 - 2026.12.06 고려대학교 화정체육관
   - kpop / Seoul / 2026-12-04 to 2026-12-06 / priority 92
   - Source: Melon Ticket
   - https://ticket.melon.com/performance/index.htm?prodId=214098
   - Cleanup needed: no
13. Visit Seoul: Full of Colors : Regions Shaping K 2026.06.04 ~ 2026.12.31 1st Floor Exhibition Room and Lobby,...
   - festival / Seoul / 2026-06-04 to 2026-12-31 / priority 91
   - Source: Visit Seoul
   - https://english.visitseoul.net/exhibition/Full-of-Colors/ENPij99b4
   - Cleanup needed: no
14. Visit Seoul: Kwon Byungjun: I Embrace You 2026.06.11 ~ 2027.05.16 Exhibition Halls 5 and 6, B1 Floor, Seoul Museum of...
   - festival / Seoul / 2026-06-11 to 2027-05-16 / priority 91
   - Source: Visit Seoul
   - https://english.visitseoul.net/exhibition/IEmbraceYou/ENPm8j6gm
   - Cleanup needed: no
15. Melon Ticket: 울트라백화점 부산 : 텍스트 쇼핑 클럽 2026.07.17 - 2026.11.01 P.ARK 2-3F
   - festival / Seoul / 2026-07-17 to 2026-11-01 / priority 91
   - Source: Melon Ticket
   - https://ticket.melon.com/performance/index.htm?prodId=213503
   - Cleanup needed: no
16. Visit Seoul: K-Hanbok Parade Series 2026.09.12 ~ 2026.11.01 1F, The Hyundai Seoul A special performance that...
   - festival / Seoul / 2026-09-12 to 2026-11-01 / priority 91
   - Source: Visit Seoul
   - https://english.visitseoul.net/exhibition/K-HanbokParadeSeries/ENP61tdfp
   - Cleanup needed: no
17. Visit Seoul: Lynn Hershman Leeson: First Person Plural 2026.10.21 ~ 2027.02.21 2F-3F, Seoul Museum of Art (Seosomun...
   - festival / Seoul / 2026-10-21 to 2027-02-21 / priority 91
   - Source: Visit Seoul
   - https://english.visitseoul.net/exhibition/First-Person-Plural/ENPay5o6v
   - Cleanup needed: no
18. Visit Seoul: 2026 Namsan Night Festival 2026.10.23 ~ 2026.11.14 Namsan Park area A night of autumn atmosphere and...
   - festival / Seoul / 2026-10-23 to 2026-11-14 / priority 91
   - Source: Visit Seoul
   - https://english.visitseoul.net/events/2026Namsan-Night-Festival/ENP3rjagy
   - Cleanup needed: no
19. Visit Seoul: 2026 Eugene Seoul Open Challenger 2026.10.25 ~ 2026.11.01 Seoul Olympic Park Tennis Center The Seoul Open...
   - shopping / Seoul / 2026-10-25 to 2026-11-01 / priority 91
   - Source: Visit Seoul
   - https://english.visitseoul.net/events/2026EugeneSeoulOpenChallenger/ENPm6ixio
   - Cleanup needed: no
20. Visit Seoul: 2026 Jeongdong Culture Night 2026.10.30 ~ 2026.10.31 Around Jeongdong-gil, Jung-gu, Seoul Jeongdong...
   - festival / Seoul / 2026-10-30 to 2026-10-31 / priority 91
   - Source: Visit Seoul
   - https://english.visitseoul.net/events/2026Jeongdong-Culture-Night/ENP3kw4cn
   - Cleanup needed: no
21. Visit Seoul: Omnibus Puppet Show 〈Eumma Gaengkkaeng Puppet Theater〉 2026.10.30 ~ 2026.10.31 KT&G Sangsangmadang Daechi...
   - festival / Seoul / 2026-10-30 to 2026-10-31 / priority 91
   - Source: Visit Seoul
   - https://english.visitseoul.net/exhibition/EummaGaengkkaeng/ENPnny5pl
   - Cleanup needed: no
22. NOL World Seoul Pop-ups: 𝟮𝟬𝟮𝟲 𝗦𝗛𝗜𝗡𝗦𝗘𝗚𝗔𝗘 𝗛𝗢𝗟𝗜𝗗𝗔𝗬 𝗠𝗔𝗥𝗞𝗘𝗧 🎅🏻 Shinsegae Department Store Gangnam Branch...
   - department-store / Seoul / 2026-10-30 to 2026-12-28 / priority 91
   - Source: NOL World Seoul Pop-ups
   - https://world.nol.com/en/content/festas/01a18a16-ce57-7468-a987-17cbb2aca2c0
   - Cleanup needed: no
23. NOL World Seoul Pop-ups: Christmas in Myeongdong Lotte Department Store Main Branch Myeongdong · 10.30 – 12.31 Likes ( 10 )
   - department-store / Seoul / 2026-10-30 to 2026-12-31 / priority 91
   - Source: NOL World Seoul Pop-ups
   - https://world.nol.com/en/content/festas/01a18a05-fa78-7256-8413-c30226033bf4
   - Cleanup needed: no
24. NOL World Ticket: ASEAN-Korea Music Festival 2026 ROUND in Korea Nov 07, 2026 - Nov 08, 2026 Incheon Namdong Gymnasium
   - festival / Incheon / 2026-11-07 to 2026-11-08 / priority 91
   - Source: NOL World Ticket
   - https://world.nol.com/en/ticket/products/26013510
   - Cleanup needed: no
25. NOL World Ticket: TOMORROW X TOGETHER WORLD TOUR 〈STEAL THE WIND〉 IN SEOUL Nov 13, 2026 - Nov 15, 2026 KSPO DOME
   - festival / Seoul / 2026-11-13 to 2026-11-15 / priority 91
   - Source: NOL World Ticket
   - https://world.nol.com/en/ticket/products/26013161
   - Cleanup needed: no

## Failed Or Blocked Sources

- Seoul Metropolitan Government Monthly Event Calendar: ROBOTS (blocked by robots.txt)
- Dongdaemun Design Plaza: ERR (fetch failed)
- Lotte Duty Free: ROBOTS (blocked by robots.txt)
- Lotte Duty Free Online Sale: ROBOTS (blocked by robots.txt)
- Galleria Department Store: ERR (fetch failed)
- AK Plaza Events: 400

## High-Signal Source Pages

1. Visit Seoul - 24 links, 18 date signals, 5 keywords
   - https://english.visitseoul.net/
2. Melon Ticket - 24 links, 18 date signals, 6 keywords
   - https://ticket.melon.com/main/index.htm
3. NOL World Ticket - 24 links, 18 date signals, 7 keywords
   - https://world.nol.com/
4. NOL World Seoul Pop-ups - 24 links, 18 date signals, 7 keywords
   - https://world.nol.com/en/regions/seoul/festas
5. Seoul Grand Park - 24 links, 18 date signals, 4 keywords
   - https://grandpark.seoul.go.kr/main.do
6. COEX Event Calendar - 24 links, 18 date signals, 3 keywords
   - https://www.coex.co.kr/en/
7. SMTOWN andSTORE Notices - 24 links, 18 date signals, 3 keywords
   - https://www.smtownandstore.com/board/index.html
8. YES24 Ticket English - 24 links, 18 date signals, 1 keywords
   - https://ticket.yes24.com/english
