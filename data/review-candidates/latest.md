# Source Review Candidates

Generated: 2026-10-24T12:48:22.873Z

This PR is an operating queue, not public site content. Do not merge draft text into `data/events.json` until an editor verifies the official page, fixes titles, confirms dates and venue, writes original multilingual copy, and passes `publish:reviewed`.

## Counts

| Metric | Value |
| --- | ---: |
| Audited sources | 56 |
| Audit OK | 53 |
| Audit failed | 3 |
| Candidate checks OK | 47 |
| Candidate checks failed | 6 |
| Discovered official links | 606 |
| Draft candidates | 69 |
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

1. Visit Seoul: Taste of Seoul 2026 2026.10.23 ~ 2026.10.29 DDP and venues across Seoul A global food festival that shares...
   - kpop / Seoul / 2026-10-23 to 2026-10-29 / priority 96
   - Source: Visit Seoul
   - https://english.visitseoul.net/events/TASTE-OF-SEOUL2026/ENPbdvixl
   - Cleanup needed: no
2. NOL World Seoul Pop-ups: MEDIHEAL X Seoul City POP-UP Olive Young N Seongsu Seongsu · 10.01 – 10.31 Likes ( 1 )
   - beauty / Seoul / 2026-10-01 to 2026-10-31 / priority 95
   - Source: NOL World Seoul Pop-ups
   - https://world.nol.com/en/content/festas/01a15d3b-7015-7b2c-abbd-f0bad071c7db
   - Cleanup needed: no
3. NOL World Seoul Pop-ups: ZEROID X Nureongi POP-UP Olive Young Hongdae Town Hongik Univ. · 10.01 – 10.31 Likes ( 4 )
   - beauty / Seoul / 2026-10-01 to 2026-10-31 / priority 95
   - Source: NOL World Seoul Pop-ups
   - https://world.nol.com/en/content/festas/01a118cc-7bbd-7602-8686-4873556a4468
   - Cleanup needed: no
4. Melon Ticket: NCT WISH 2nd CONCERT TOUR ‘INTO THE WISH : Face Our WISH’ IN SEOUL NCT WISH 2nd CONCERT TOUR ‘INTO THE...
   - kpop / Seoul / 2027-01-15 to 2027-01-16 / priority 95
   - Source: Melon Ticket
   - https://ticket.melon.com/performance/index.htm?prodId=214071
   - Cleanup needed: no
5. NOL World Seoul Pop-ups: D&#x27;FESTA THE ORIGIN EXHIBITION K-POP, Reimagined as Art 10.23 – 11.30 Comments ( 2 ) · Likes ( 427 )
   - kpop / Seoul / 2026-10-23 to 2026-11-30 / priority 93
   - Source: NOL World Seoul Pop-ups
   - https://world.nol.com/en/content/festas/01a141d8-0bcf-7835-a75c-c333ef17b892
   - Cleanup needed: no
6. NOL World Seoul Pop-ups: DAY6 5TH FANMEETING POP-UP STORE EVERY DAY6, EVERY My Day Itaewon · 10.23 – 11.01 Likes ( 3 )
   - kpop / Seoul / 2026-10-23 to 2026-11-01 / priority 93
   - Source: NOL World Seoul Pop-ups
   - https://world.nol.com/en/content/festas/01a1568f-6c21-7e12-b8ec-0904afa899cb
   - Cleanup needed: no
7. Melon Ticket: 브래드 월스 사진전 2026.09.11 - 2027.03.01 그라운드시소 용산
   - festival / Seoul / 2026-09-11 to 2027-03-01 / priority 92
   - Source: Melon Ticket
   - https://ticket.melon.com/performance/index.htm?prodId=213656
   - Cleanup needed: no
8. NOL World Seoul Pop-ups: 2026 BTS DALMAJUNG POP-UP HYBE YONGSAN Itaewon · 9.29 – 11.30 Likes ( 89 )
   - kpop / Seoul / 2026-09-29 to 2026-11-30 / priority 92
   - Source: NOL World Seoul Pop-ups
   - https://world.nol.com/en/content/festas/01a0ea58-1ff4-7e20-8fc1-37a78b9bdc3d
   - Cleanup needed: no
9. Melon Ticket: 1 - 순위유지 2026 AND2BLE FAN-CON 〈W!nter inside〉 In Seoul 2026.12.05 - 2026.12.06 고려대학교 화정체육관
   - kpop / Seoul / 2026-12-05 to 2026-12-06 / priority 92
   - Source: Melon Ticket
   - https://ticket.melon.com/performance/index.htm?prodId=214098
   - Cleanup needed: no
10. Visit Seoul: Full of Colors : Regions Shaping K 2026.06.04 ~ 2026.12.31 1st Floor Exhibition Room and Lobby,...
   - festival / Seoul / 2026-06-04 to 2026-12-31 / priority 91
   - Source: Visit Seoul
   - https://english.visitseoul.net/exhibition/Full-of-Colors/ENPij99b4
   - Cleanup needed: no
11. Visit Seoul: Kwon Byungjun: I Embrace You 2026.06.11 ~ 2027.05.16 Exhibition Halls 5 and 6, B1 Floor, Seoul Museum of...
   - festival / Seoul / 2026-06-11 to 2027-05-16 / priority 91
   - Source: Visit Seoul
   - https://english.visitseoul.net/exhibition/IEmbraceYou/ENPm8j6gm
   - Cleanup needed: no
12. Melon Ticket: 울트라백화점 부산 : 텍스트 쇼핑 클럽 2026.07.17 - 2026.11.01 P.ARK 2-3F
   - festival / Seoul / 2026-07-17 to 2026-11-01 / priority 91
   - Source: Melon Ticket
   - https://ticket.melon.com/performance/index.htm?prodId=213503
   - Cleanup needed: no
13. Visit Seoul: Kim Duck-yong & Byun Yong-kuk Duo Exhibition《Light Resting in the Grain》 2026.08.28 ~ 2026.10.31 Artcube...
   - festival / Seoul / 2026-08-28 to 2026-10-31 / priority 91
   - Source: Visit Seoul
   - https://english.visitseoul.net/exhibition/Light-Resting-in-the-Grain/ENPm986je
   - Cleanup needed: no
14. NOL World Seoul Pop-ups: NCT WISH COME BACK POP-UP I SPY Seongsu · 10.14 – 10.24 Likes ( 15 )
   - kpop / Seoul / 2026-10-14 to 2026-10-24 / priority 91
   - Source: NOL World Seoul Pop-ups
   - https://world.nol.com/en/content/festas/01a13280-d413-734f-9c7c-f9fd38e679da
   - Cleanup needed: no
15. Visit Seoul: October Foreign Language Guided Tours 2026.10.16 ~ 2026.10.24 Seoul Museum of Art (SeMA), Seosomun Main...
   - festival / Seoul / 2026-10-16 to 2026-10-24 / priority 91
   - Source: Visit Seoul
   - https://english.visitseoul.net/exhibition/October-Foreign-Language-Guided-Tours/ENPqjhy9c
   - Cleanup needed: no
16. NOL World Seoul Pop-ups: TWICE 11TH ANNIVERSARY POP-UP STORE TWICE THE THRILL Seongsu · 10.17 – 10.25 Likes ( 23 )
   - department-store / Seoul / 2026-10-17 to 2026-10-25 / priority 91
   - Source: NOL World Seoul Pop-ups
   - https://world.nol.com/en/content/festas/01a132ef-1e47-78d6-83fc-390eeb2231b2
   - Cleanup needed: no
17. Visit Seoul: Local Trip Autumn Picnic Pop-up 2026.10.21 ~ 2026.10.25 Rooftop of the Regional Tourism Antenna Shop (119,...
   - festival / Seoul / 2026-10-21 to 2026-10-25 / priority 91
   - Source: Visit Seoul
   - https://english.visitseoul.net/events/LocalTrip-AutumnPicnic/ENPfrksdp
   - Cleanup needed: no
18. Melon Ticket: 뮤지컬 〈헬스키친〉 (Musical Hell’s Kitchen) 2026.07.24 - 2026.11.08 GS아트센터
   - festival / Seoul / 2026-07-24 to 2026-11-08 / priority 90
   - Source: Melon Ticket
   - https://ticket.melon.com/performance/index.htm?prodId=213624
   - Cleanup needed: no
19. Melon Ticket: 2026 청년문화예술패스 06~07년생 덕질지원금 2026 청년문화예술패스 2026-08-10 - 2026-12-31
   - festival / Seoul / 2026-08-10 to 2026-12-31 / priority 90
   - Source: Melon Ticket
   - https://ticket.melon.com/plan/index.htm?planId=100101
   - Cleanup needed: no
20. Melon Ticket: 명탐정 코난전 -TV 애니메이션 방송 30주년 기념- 2026.08.12 - 2026.11.29 AK PLAZA HONGDAE 4F 오뮤지엄
   - festival / Seoul / 2026-08-12 to 2026-11-29 / priority 90
   - Source: Melon Ticket
   - https://ticket.melon.com/performance/index.htm?prodId=213593
   - Cleanup needed: no
21. Melon Ticket: 뮤지컬 〈엘리자벳〉 죽음마저 사랑에 빠지게 한 아름다운 황후 뮤지컬 〈엘리자벳〉 2026.08.16 - 2026.11.15
   - festival / Seoul / 2026-08-16 to 2026-11-15 / priority 90
   - Source: Melon Ticket
   - https://ticket.melon.com/performance/bridge.htm?brgId=100512
   - Cleanup needed: no
22. NOL World Ticket: rom&nd 10th BIRTHDAY PARTY 🩷 10.12 – 11.10
   - festival / Seoul / 2026-10-12 to 2026-11-10 / priority 90
   - Source: NOL World Ticket
   - https://world.nol.com/en/content/festas/01a1329e-48d7-7ba2-bf22-189216775a99
   - Cleanup needed: no
23. Visit Seoul: 2026 Namsan Night Festival 2026.10.23 ~ 2026.11.14 Namsan Park area A night of autumn atmosphere and...
   - festival / Seoul / 2026-10-23 to 2026-11-14 / priority 90
   - Source: Visit Seoul
   - https://english.visitseoul.net/events/2026Namsan-Night-Festival/ENP3rjagy
   - Cleanup needed: no
24. Melon Ticket: 2026 영탁 단독 콘서트 TAK SHOW5 2026 영탁 단독 콘서트 “TAK SHOW5” 2026.10.24 - 2026.12.20
   - festival / Seoul / 2026-10-24 to 2026-12-20 / priority 90
   - Source: Melon Ticket
   - https://ticket.melon.com/performance/bridge.htm?brgId=100526
   - Cleanup needed: no
25. Melon Ticket: 뮤지컬 〈두 도시 이야기〉 카이 ・ 신성록 ・ 고은성! 뮤지컬 〈두 도시 이야기〉 2026.11.11 - 2027.02.08
   - festival / Seoul / 2026-11-11 to 2027-02-08 / priority 90
   - Source: Melon Ticket
   - https://ticket.melon.com/performance/index.htm?prodId=213865
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
3. NOL World Ticket - 24 links, 18 date signals, 5 keywords
   - https://world.nol.com/
4. NOL World Seoul Pop-ups - 24 links, 18 date signals, 6 keywords
   - https://world.nol.com/en/regions/seoul/festas
5. Seoul Grand Park - 24 links, 18 date signals, 4 keywords
   - https://grandpark.seoul.go.kr/main.do
6. SMTOWN andSTORE Notices - 24 links, 18 date signals, 3 keywords
   - https://www.smtownandstore.com/board/index.html
7. COEX Event Calendar - 24 links, 18 date signals, 2 keywords
   - https://www.coex.co.kr/en/
8. YES24 Ticket English - 24 links, 18 date signals, 1 keywords
   - https://ticket.yes24.com/english
