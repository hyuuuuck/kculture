# Source Review Candidates

Generated: 2026-11-07T06:15:24.585Z

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
| Draft candidates | 71 |
| Skipped leads | 585 |
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

1. NOL World Seoul Pop-ups: D&#x27;FESTA THE ORIGIN EXHIBITION K-POP, Reimagined as Art 10.23 – 11.30 Comments ( 3 ) · Likes ( 828 )
   - kpop / Seoul / 2026-10-23 to 2026-11-30 / priority 94
   - Source: NOL World Seoul Pop-ups
   - https://world.nol.com/en/content/festas/01a141d8-0bcf-7835-a75c-c333ef17b892
   - Cleanup needed: no
2. Melon Ticket: 2026 aespa FAN MEETING MY 보고싶다 ae가 2026 aespa FAN MEETING “MY 보고싶다 ae가” 2026.11.28 - 2026.11.29
   - kpop / Goyang / 2026-11-28 to 2026-11-29 / priority 94
   - Source: Melon Ticket
   - https://ticket.melon.com/performance/index.htm?prodId=214159
   - Cleanup needed: no
3. NOL World Seoul Pop-ups: 2026 BTS DALMAJUNG POP-UP HYBE YONGSAN Itaewon · 9.29 – 11.30 Likes ( 125 )
   - kpop / Seoul / 2026-09-29 to 2026-11-30 / priority 93
   - Source: NOL World Seoul Pop-ups
   - https://world.nol.com/en/content/festas/01a0ea58-1ff4-7e20-8fc1-37a78b9bdc3d
   - Cleanup needed: no
4. NOL World Ticket: NMIXX 1ST WORLD TOUR FINALE IN INCHEON EPISODE 1: ZERO FRONTIER Incheon 11.27 – 11.29
   - festival / Incheon / 2026-11-27 to 2026-11-29 / priority 93
   - Source: NOL World Ticket
   - https://world.nol.com/en/content/festas/01a0320c-febb-7711-aad0-d39586c2da5f
   - Cleanup needed: no
5. NOL World Seoul Pop-ups: TWS 2nd Single Album ‘TO US’ POP-UP HYBE YONGSAN 11.02 – 11.07 Likes ( 10 )
   - kpop / Seoul / 2026-11-02 to 2026-11-07 / priority 92
   - Source: NOL World Seoul Pop-ups
   - https://world.nol.com/en/content/festas/01a17ad4-4715-7ebf-945b-7783eb7d762f
   - Cleanup needed: no
6. Shinsegae Group Newsroom: “겨울 e-프리퀀시 스티커가 두배로!” 스타벅스, 겨울 e-프리퀀시 스티커 더블 적립 진행 스타벅스 코리아가 11월 6일부터 12일까지 일주일간 제조 음료 구매 시, e-프리퀀시 스티커를...
   - department-store / Nationwide / 2026-11-06 to 2026-11-12 / priority 92
   - Source: Shinsegae Group Newsroom
   - https://www.shinsegaegroupnewsroom.com/the-winter-e-frequency-stickers-are-doubled
   - Cleanup needed: no
7. NOL World Seoul Pop-ups: 𝟮𝟬𝟮𝟲 𝗦𝗛𝗜𝗡𝗦𝗘𝗚𝗔𝗘 𝗛𝗢𝗟𝗜𝗗𝗔𝗬 𝗠𝗔𝗥𝗞𝗘𝗧 🎅🏻 Shinsegae Department Store Gangnam Branch...
   - department-store / Seoul / 2026-10-30 to 2026-12-28 / priority 91
   - Source: NOL World Seoul Pop-ups
   - https://world.nol.com/en/content/festas/01a18a16-ce57-7468-a987-17cbb2aca2c0
   - Cleanup needed: no
8. NOL World Seoul Pop-ups: Christmas in Myeongdong Lotte Department Store Main Branch Myeongdong · 10.30 – 12.31 Likes ( 42 )
   - department-store / Seoul / 2026-10-30 to 2026-12-31 / priority 91
   - Source: NOL World Seoul Pop-ups
   - https://world.nol.com/en/content/festas/01a18a05-fa78-7256-8413-c30226033bf4
   - Cleanup needed: no
9. NOL World Seoul Pop-ups: 2026 KO1KEYZ 1ST FAN MEETING IN SEOUL Blue Square Mastercard Hall Itaewon · 11.07 – 11.08 Likes ( 1.1K )
   - kpop / Seoul / 2026-11-07 to 2026-11-08 / priority 91
   - Source: NOL World Seoul Pop-ups
   - https://world.nol.com/en/content/festas/01a0183c-0938-7126-af50-805390b67b9a
   - Cleanup needed: no
10. Melon Ticket: 뮤지컬 〈레베카〉 예매자 전원 당첨 이벤트 확인 뮤지컬 2026.11.24 - 2027.03.14
   - festival / Goyang / 2026-11-24 to 2027-03-14 / priority 91
   - Source: Melon Ticket
   - https://ticket.melon.com/performance/bridge.htm?brgId=100532
   - Cleanup needed: no
11. Visit Seoul: Full of Colors : Regions Shaping K 2026.06.04 ~ 2026.12.31 1st Floor Exhibition Room and Lobby,...
   - festival / Seoul / 2026-06-04 to 2026-12-31 / priority 90
   - Source: Visit Seoul
   - https://english.visitseoul.net/exhibition/Full-of-Colors/ENPij99b4
   - Cleanup needed: no
12. Visit Seoul: SEOUL RAIM : ROBOT CITY 2026 Seoul Robot & AI Museum Media Facade Exhibition 2026.08.28 ~ 2026.12.05 Seoul...
   - festival / Seoul / 2026-08-28 to 2026-12-05 / priority 90
   - Source: Visit Seoul
   - https://english.visitseoul.net/exhibition/SEOUL-RAIM-ROBOT-CITY-2026/ENPf2rk5l
   - Cleanup needed: no
13. NOL World Ticket: Lotte World Adventure Mystery Party 9.12 – 11.15
   - festival / Seoul / 2026-09-12 to 2026-11-15 / priority 90
   - Source: NOL World Ticket
   - https://world.nol.com/en/content/festas/01a0a778-66d8-7ddd-8acc-a26b7c2a620c
   - Cleanup needed: no
14. Visit Seoul: Equinox: Autumnal Equinox_Vernal Equinox 2026.09.22 ~ 2027.03.07 Special Exhibition Gallery, 3F,...
   - festival / Seoul / 2026-09-22 to 2027-03-07 / priority 90
   - Source: Visit Seoul
   - https://english.visitseoul.net/exhibition/EQUINOX/ENPq79in8
   - Cleanup needed: no
15. Visit Seoul: Collection, Scenes of an Era 2026.10.16 ~ 2026.12.06 Galleries 1 and 2, ARKO Art Center An exhibition that...
   - festival / Seoul / 2026-10-16 to 2026-12-06 / priority 90
   - Source: Visit Seoul
   - https://english.visitseoul.net/exhibition/Collection-Scenes-of-an-Era/ENPiau197
   - Cleanup needed: no
16. Visit Seoul: Lynn Hershman Leeson: First Person Plural 2026.10.21 ~ 2027.02.21 2F-3F, Seoul Museum of Art (Seosomun...
   - festival / Seoul / 2026-10-21 to 2027-02-21 / priority 90
   - Source: Visit Seoul
   - https://english.visitseoul.net/exhibition/First-Person-Plural/ENPay5o6v
   - Cleanup needed: no
17. Visit Seoul: 2026 Namsan Night Festival 2026.10.23 ~ 2026.11.14 Namsan Park area A night of autumn atmosphere and...
   - festival / Seoul / 2026-10-23 to 2026-11-14 / priority 90
   - Source: Visit Seoul
   - https://english.visitseoul.net/events/2026Namsan-Night-Festival/ENP3rjagy
   - Cleanup needed: no
18. Visit Seoul: 14th Indian Film Festival in Korea 2026.11.03 ~ 2026.11.07 Korean Film Archive (KOFA) The 14th Indian Film...
   - festival / Seoul / 2026-11-03 to 2026-11-07 / priority 90
   - Source: Visit Seoul
   - https://english.visitseoul.net/events/2026IndianFilmFestival/ENP4a39dr
   - Cleanup needed: no
19. Melon Ticket: 그라운드시소 전시 모음 브래드 월스전, 표기식 사진전, 성률 기획전, 티보 에렘 그라운드시소 전시 2026.04.30 - 2027.04.11
   - festival / Goyang / 2026-04-30 to 2027-04-11 / priority 89
   - Source: Melon Ticket
   - https://ticket.melon.com/performance/bridge.htm?brgId=100525
   - Cleanup needed: no
20. Melon Ticket: 뮤지컬 〈헬스키친〉 (Musical Hell’s Kitchen) 2026.07.24 - 2026.11.08 GS아트센터
   - festival / Seoul / 2026-07-24 to 2026-11-08 / priority 89
   - Source: Melon Ticket
   - https://ticket.melon.com/performance/index.htm?prodId=213624
   - Cleanup needed: no
21. Melon Ticket: 2026 청년문화예술패스 06~07년생 덕질지원금 2026 청년문화예술패스 2026-08-10 - 2026-12-31
   - festival / Goyang / 2026-08-10 to 2026-12-31 / priority 89
   - Source: Melon Ticket
   - https://ticket.melon.com/plan/index.htm?planId=100101
   - Cleanup needed: no
22. Melon Ticket: 명탐정 코난전 -TV 애니메이션 방송 30주년 기념- 2026.08.12 - 2026.11.29 AK PLAZA HONGDAE 4F 오뮤지엄
   - festival / Seoul / 2026-08-12 to 2026-11-29 / priority 89
   - Source: Melon Ticket
   - https://ticket.melon.com/performance/index.htm?prodId=213593
   - Cleanup needed: no
23. Melon Ticket: 뮤지컬 〈엘리자벳〉 죽음마저 사랑에 빠지게 한 아름다운 황후 뮤지컬 〈엘리자벳〉 2026.08.16 - 2026.11.15
   - festival / Goyang / 2026-08-16 to 2026-11-15 / priority 89
   - Source: Melon Ticket
   - https://ticket.melon.com/performance/bridge.htm?brgId=100512
   - Cleanup needed: no
24. Melon Ticket: 〈표기식 사진전: 빛은 어떻게 떨어졌길래 모두 다르게 반짝여서〉 2026.09.23 - 2027.03.01 그라운드시소 센트럴
   - festival / Goyang / 2026-09-23 to 2027-03-01 / priority 89
   - Source: Melon Ticket
   - https://ticket.melon.com/performance/index.htm?prodId=213780
   - Cleanup needed: no
25. Melon Ticket: 연극 〈에너미〉 2026.10.26 - 2026.11.14 세종문화회관 M씨어터
   - festival / Goyang / 2026-10-26 to 2026-11-14 / priority 89
   - Source: Melon Ticket
   - https://ticket.melon.com/performance/index.htm?prodId=213918
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
2. Visit Seoul - 24 links, 18 date signals, 4 keywords
   - https://english.visitseoul.net/
3. Seoul Grand Park - 24 links, 18 date signals, 5 keywords
   - https://grandpark.seoul.go.kr/main.do
4. Melon Ticket - 24 links, 18 date signals, 5 keywords
   - https://ticket.melon.com/main/index.htm
5. COEX Event Calendar - 24 links, 18 date signals, 3 keywords
   - https://www.coex.co.kr/en/
6. SMTOWN andSTORE Notices - 24 links, 18 date signals, 3 keywords
   - https://www.smtownandstore.com/board/index.html
7. NOL World Seoul Pop-ups - 24 links, 18 date signals, 7 keywords
   - https://world.nol.com/en/regions/seoul/festas
8. YES24 Ticket English - 24 links, 18 date signals, 1 keywords
   - https://ticket.yes24.com/english
