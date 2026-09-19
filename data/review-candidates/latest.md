# Source Review Candidates

Generated: 2026-09-19T12:36:16.447Z

This PR is an operating queue, not public site content. Do not merge draft text into `data/events.json` until an editor verifies the official page, fixes titles, confirms dates and venue, writes original multilingual copy, and passes `publish:reviewed`.

## Counts

| Metric | Value |
| --- | ---: |
| Audited sources | 56 |
| Audit OK | 45 |
| Audit failed | 11 |
| Candidate checks OK | 47 |
| Candidate checks failed | 6 |
| Discovered official links | 592 |
| Draft candidates | 74 |
| Skipped leads | 571 |
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
   - kpop / Goyang / 2026-10-03 to 2026-10-04 / priority 97
   - Source: Melon Ticket
   - https://ticket.melon.com/performance/index.htm?prodId=213766
   - Cleanup needed: no
2. Visit Seoul: LALARECIPE × MeME : Happiness Recipe for Every Skin 2026.08.01 ~ 2026.09.30 B the B, B2, DDP Market, DDP,...
   - beauty / Seoul / 2026-08-01 to 2026-09-30 / priority 95
   - Source: Visit Seoul
   - https://english.visitseoul.net/exhibition/LALARECIPE-%C3%97-MeME--Happiness-Recipe-for-Every-Skin/ENPqkbvqx
   - Cleanup needed: no
3. NOL World Seoul Pop-ups: Olive Young X Sanrio POP-UP 25 stores nationwide Myeongdong · 9.06 – 9.30 Likes ( 18 )
   - beauty / Seoul / 2026-09-06 to 2026-09-30 / priority 95
   - Source: NOL World Seoul Pop-ups
   - https://world.nol.com/en/content/festas/01a08356-1840-7c46-924e-ad05a11c03b2
   - Cleanup needed: no
4. Melon Ticket: EXHIBITION NEO DIMENSION NCT 10TH ANNIVERSARY EXHIBITION : NEO DIMENSION 2026.09.18 - 2026.10.18
   - kpop / Seoul / 2026-09-18 to 2026-10-18 / priority 95
   - Source: Melon Ticket
   - https://ticket.melon.com/performance/index.htm?prodId=213828
   - Cleanup needed: no
5. NOL World Ticket: DAY6 5TH FANMEETING EVERY DAY6, EVERY My Day Incheon 10.23 – 10.25
   - kpop / Incheon / 2026-10-23 to 2026-10-25 / priority 95
   - Source: NOL World Ticket
   - https://world.nol.com/en/content/festas/01a08367-99ab-7455-b0df-43dfe7e7d6e0
   - Cleanup needed: no
6. Hyundai Department Store: 전시 사진 세계 2026.07.21 ~ 2026.11.01
   - department-store / Nationwide / 2026-07-21 to 2026-11-01 / priority 93
   - Source: Hyundai Department Store
   - https://www.ehyundai.com/newCulture/EH/EH000001_V.do?seq=2092864&bbsCd=210&sitemapId=01020100000000
   - Cleanup needed: no
7. Melon Ticket: 울트라백화점 부산 : 텍스트 쇼핑 클럽 2026.07.17 - 2026.11.01 P.ARK 2-3F
   - festival / Goyang / 2026-07-17 to 2026-11-01 / priority 92
   - Source: Melon Ticket
   - https://ticket.melon.com/performance/index.htm?prodId=213503
   - Cleanup needed: no
8. Melon Ticket: 표기식 사진전 2026.09.23 - 2027.03.01 그라운드시소 센트럴
   - festival / Goyang / 2026-09-23 to 2027-03-01 / priority 92
   - Source: Melon Ticket
   - https://ticket.melon.com/performance/index.htm?prodId=213780
   - Cleanup needed: no
9. Visit Seoul: Kwon Byungjun: I Embrace You 2026.06.11 ~ 2027.05.16 Exhibition Halls 5 and 6, B1 Floor, Seoul Museum of...
   - festival / Seoul / 2026-06-11 to 2027-05-16 / priority 90
   - Source: Visit Seoul
   - https://english.visitseoul.net/exhibition/IEmbraceYou/ENPm8j6gm
   - Cleanup needed: no
10. Melon Ticket: 진격의 거인展 FINAL 2026.06.22 - 2026.11.01 덕스(DUEX) 홍대 1관
   - festival / Goyang / 2026-06-22 to 2026-11-01 / priority 90
   - Source: Melon Ticket
   - https://ticket.melon.com/performance/index.htm?prodId=213335
   - Cleanup needed: no
11. Visit Seoul: Seoul Museum of Photography 《Martin Parr : We Are Martin Parr》 2026.07.16 ~ 2026.10.18 Seoul Museum of...
   - festival / Seoul / 2026-07-16 to 2026-10-18 / priority 90
   - Source: Visit Seoul
   - https://english.visitseoul.net/exhibition/We-Are-Martin-Parr/ENPgeb6on
   - Cleanup needed: no
12. Visit Seoul: Sook Jin Jo : That's How the Light Gets In 2026.07.29 ~ 2026.11.15 2nd Floor and Outdoor Garden, SeMA...
   - festival / Seoul / 2026-07-29 to 2026-11-15 / priority 90
   - Source: Visit Seoul
   - https://english.visitseoul.net/exhibition/ThatsHowtheLightGetsIn/ENPo2o028
   - Cleanup needed: no
13. Melon Ticket: 뮤지컬 〈엘리자벳〉 죽음마저 사랑에 빠지게 한 아름다운 황후 뮤지컬 〈엘리자벳〉 2026.08.16 - 2026.11.15
   - festival / Goyang / 2026-08-16 to 2026-11-15 / priority 90
   - Source: Melon Ticket
   - https://ticket.melon.com/performance/bridge.htm?brgId=100512
   - Cleanup needed: no
14. Busan Metropolitan City Events and English News: Events 2026 Busan Dwaeji Gukbap Grand Fair 2026-08-26 - 2026-10-18 2026 Busan Dwaeji Gukbap Grand Fair ○...
   - festival / Busan / 2026-08-26 to 2026-10-18 / priority 90
   - Source: Busan Metropolitan City Events and English News
   - https://www.busan.go.kr/eng/bsevents/1751134?&curPage=&srchYear=&srchMonth=&srchStartDt=&srchEndDt=&srchKey=&srchText=&check=
   - Cleanup needed: no
15. Melon Ticket: 2026 영탁 단독 콘서트 “TAK SHOW5” 2026.10.03 - 2026.10.05 고려대학교 화정체육관
   - festival / Goyang / 2026-10-03 to 2026-10-05 / priority 90
   - Source: Melon Ticket
   - https://ticket.melon.com/performance/index.htm?prodId=213729
   - Cleanup needed: no
16. Melon Ticket: 2026 GHOST 페스티벌 2026.10.09 - 2026.10.11 임진각평화누리
   - festival / Seoul / 2026-10-09 to 2026-10-11 / priority 90
   - Source: Melon Ticket
   - https://ticket.melon.com/performance/index.htm?prodId=213569
   - Cleanup needed: no
17. Melon Ticket: HEARTBEAT BY DUDUDO 2026 당신의 심장을 뛰게 하는 비트 HEARTBEAT BY DUDUDO 2026 2026.10.17 - 2026.10.18
   - festival / Goyang / 2026-10-17 to 2026-10-18 / priority 90
   - Source: Melon Ticket
   - https://ticket.melon.com/performance/index.htm?prodId=213848
   - Cleanup needed: no
18. Melon Ticket: 김결 단독콘서트 〈술래잡기〉 2026.10.17 - 2026.10.18 롤링홀
   - festival / Goyang / 2026-10-17 to 2026-10-18 / priority 90
   - Source: Melon Ticket
   - https://ticket.melon.com/performance/index.htm?prodId=213849
   - Cleanup needed: no
19. Melon Ticket: 뮤지컬 〈두 도시 이야기〉 카이 ・ 신성록 ・ 고은성! 뮤지컬 〈두 도시 이야기〉 2026.11.11 - 2027.02.08
   - festival / Goyang / 2026-11-11 to 2027-02-08 / priority 90
   - Source: Melon Ticket
   - https://ticket.melon.com/performance/index.htm?prodId=213865
   - Cleanup needed: no
20. Melon Ticket: SJF at the Theater 2026 킹오컨, 다이애나 크롤, 크리스토퍼! SJF at the Theater 2026 2026.11.18 - 2026.11.22
   - festival / Goyang / 2026-11-18 to 2026-11-22 / priority 90
   - Source: Melon Ticket
   - https://ticket.melon.com/performance/bridge.htm?brgId=100518
   - Cleanup needed: no
21. Melon Ticket: 홈커밍스 내한 공연 “You are you, even if no one fill in about you.” 2026.12.13 - 2026.12.13 무신사 개러지
   - festival / Goyang / 2026-12-13 to 2026-12-13 / priority 90
   - Source: Melon Ticket
   - https://ticket.melon.com/performance/index.htm?prodId=213806
   - Cleanup needed: no
22. Melon Ticket: ROLLINGHALL 홍대 뮤직 메카, 롤링홀 롤링홀 상시 기획전 2021-07-19 - 2026-12-31
   - festival / Goyang / 2026-12-31 to 2026-12-31 / priority 90
   - Source: Melon Ticket
   - https://ticket.melon.com/plan/index.htm?planId=100058
   - Cleanup needed: no
23. Busan Metropolitan City Events and English News: Events 'Dadaepo Sunset Fountain of Dreams’ Music Show 2026-04-24 - 2026-09-30 Near Dadaepo Beach 'Dadaepo...
   - festival / Busan / 2026-04-24 to 2026-09-30 / priority 89
   - Source: Busan Metropolitan City Events and English News
   - https://www.busan.go.kr/eng/bsevents/1728763?&curPage=&srchYear=&srchMonth=&srchStartDt=&srchEndDt=&srchKey=&srchText=&check=
   - Cleanup needed: no
24. Busan Metropolitan City Events and English News: Exhibitions & Conferences Heritage of Busan as the Wartime Capital 2026-06-25 - 2026-09-27 Busan Modern...
   - festival / Busan / 2026-06-25 to 2026-09-27 / priority 89
   - Source: Busan Metropolitan City Events and English News
   - https://www.busan.go.kr/eng/bsevents/1735737?&curPage=&srchYear=&srchMonth=&srchStartDt=&srchEndDt=&srchKey=&srchText=&check=
   - Cleanup needed: no
25. Busan Metropolitan City Events and English News: Exhibitions & Conferences The Greatest Colorist Michel-Henry 2026-07-03 - 2026-10-25 Busan Cultural Center...
   - festival / Busan / 2026-07-03 to 2026-10-25 / priority 89
   - Source: Busan Metropolitan City Events and English News
   - https://www.busan.go.kr/eng/bsevents/1734245?&curPage=&srchYear=&srchMonth=&srchStartDt=&srchEndDt=&srchKey=&srchText=&check=
   - Cleanup needed: no

## Failed Or Blocked Sources

- Seoul Metropolitan Government Monthly Event Calendar: ROBOTS (blocked by robots.txt)
- Dongdaemun Design Plaza: ERR (fetch failed)
- Lotte Duty Free: ROBOTS (blocked by robots.txt)
- Lotte Duty Free Online Sale: ROBOTS (blocked by robots.txt)
- Galleria Department Store: ERR (fetch failed)
- AK Plaza Events: 400
- Ministry of Culture, Sports and Tourism: ERR (fetch failed)
- Busan Metropolitan City Events and English News: ERR (fetch failed)
- Visit Jeju Festival Calendar: ERR (fetch failed)
- Incheon Tourism Organization Festival Programs: ERR (fetch failed)
- Incheon Pentaport Music Festival: ERR (fetch failed)
- Daegu Tourist Information Festival Schedule: ERR (fetch failed)
- Daegu Chimac Festival: ERR (fetch failed)
- COEX Event Calendar: ERR (fetch failed)

## High-Signal Source Pages

1. Busan Metropolitan City Events and English News - 24 links, 18 date signals, 3 keywords
   - https://www.busan.go.kr/eng/bsevents
2. Melon Ticket - 24 links, 18 date signals, 6 keywords
   - https://ticket.melon.com/main/index.htm
3. Visit Seoul - 24 links, 18 date signals, 4 keywords
   - https://english.visitseoul.net/
4. Seoul Grand Park - 24 links, 18 date signals, 5 keywords
   - https://grandpark.seoul.go.kr/main.do
5. NOL World Seoul Pop-ups - 24 links, 18 date signals, 6 keywords
   - https://world.nol.com/en/regions/seoul/festas
6. SMTOWN andSTORE Notices - 24 links, 18 date signals, 3 keywords
   - https://www.smtownandstore.com/board/index.html
7. NOL World Ticket - 24 links, 18 date signals, 5 keywords
   - https://world.nol.com/
8. Shinsegae Group Newsroom - 24 links, 4 date signals, 7 keywords
   - https://www.shinsegaegroupnewsroom.com/category/press/
