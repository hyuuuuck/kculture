# 기간 한정 공지 칸 (2026-10-21)

가이드와 홈에 **기간이 정해진 공지 칸**을 넣었다. 종료일이 지나면 공지가 자동으로 사라진다. 기간 한정 문장은 가이드 본문에서 빼서 이 칸으로 옮겼다.

## 동작 방식

- **데이터**: `data/notices.json`. 공지마다 다음 항목을 둔다.
  - `start`, `end`: 시작일과 종료일 (KST, YYYY-MM-DD)
  - `title`, `text`: 제목과 본문 (영문)
  - `guides`: 공지를 보여 줄 가이드 slug
  - `home`, `homeLink`: 홈 배너 노출 여부와 홈에서 연결할 가이드
  - `source`: 공식 출처
  - `checkedAt`: 출처를 확인한 날짜
- **빌드** (`scripts/build.mjs`)
  - 빌드 날짜 기준으로 종료일이 지난 공지는 뺀다.
  - 시작 전 공지는 "Coming up", 진행 중 공지는 "Now" 라벨을 붙인다.
  - 가이드에서는 제목·공유 버튼 아래, 대표 사진 위에 하나의 상자로 보여 준다. 종료 임박 순으로 정렬한다.
  - 홈에서는 표지 바로 아래 "Dated notices for your visit"에 보여 준다.
- **브라우저** (`app.js`)
  - 다시 빌드하지 않아도 KST 기준 종료일 다음 날 공지를 숨기고, 시작일에 라벨을 "Now"로 바꾼다.
  - 남은 공지가 없으면 상자째 숨긴다.
- **검증**
  - `validate:content`가 `scripts/lib/notices.mjs`로 다음을 검사한다: id 중복, 날짜 순서, 존재하는 가이드인지, https 출처, 미래가 아닌 `checkedAt`.
  - 끝난 공지는 경고로 알려 준다. 파일에서 지울지는 편할 때 정하면 된다.
  - 테스트는 `scripts/tests/notices.test.mjs`(3개)에 있다.
- **디자인**: `DESIGN.md` 규칙을 따랐다.
  - 각진 1px 테두리에 보라색 왼쪽 선을 쓴다.
  - 상태 색(진행 중은 success, 예정은 warning)은 항상 텍스트 라벨과 함께 쓴다.

## 공지 목록 (출처는 2026-10-21에 다시 확인, 남산골 두 건만 10-20)

| 공지 | 기간 | 표시 위치 | 출처 |
|---|---|---|---|
| Free entry to the palaces, Jongmyo and royal tombs | 2026-10-29 ~ 2026-11-15 | gyeongbokgung-palace-guide, changdeokgung-huwon-secret-garden, seoul-five-grand-palaces-compared, jongmyo-shrine-guide, hanbok-rental-palace-guide, free-korean-culture-seoul, national-folk-museum-of-korea-guide, seoul-culture-itinerary-3-days + 홈 | [Royal Palaces and Tombs Center notice (September 22, 2026)](https://royal.khs.go.kr/ROYAL/contents/R403000000.do?schM=view&id=20260922161754771774&schBcid=notice01) |
| Changgyeonggung closes early November 10 to 15 | 2026-11-10 ~ 2026-11-15 | changdeokgung-huwon-secret-garden, seoul-five-grand-palaces-compared | [Royal Palaces and Tombs Center notice (September 2, 2026)](https://royal.khs.go.kr/ROYAL/contents/R403000000.do?schM=view&id=20260902131858531105&schBcid=notice01) |
| Throne-hall platform closed | 2026-09-02 ~ 2026-10-31 | gyeongbokgung-palace-guide | [Royal Palaces and Tombs Center notice (August 30, 2026)](https://royal.khs.go.kr/ROYAL/contents/R403000000.do?schM=view&id=20260830151817711582&schBcid=notice01) |
| Last sessions of the Gyeonghoeru interior tour | 2026-04-01 ~ 2026-10-30 | gyeongbokgung-palace-guide | [Royal Palaces and Tombs Center notice (March 17, 2026)](https://royal.khs.go.kr/ROYAL/contents/R403000000.do?schM=view&id=20260317095858481098&schBcid=notice01) |
| Dondeokjeon closed until November 1 | 2026-10-13 ~ 2026-11-01 | seoul-five-grand-palaces-compared | [Deoksugung notice (October 12, 2026)](https://royal.khs.go.kr/ROYAL/contents/R403000000.do?schM=view&id=20261012160106203424&schBcid=notice01) |
| Free lunchtime shows at the National Jeongdong Theater | 2026-09-29 ~ 2026-10-31 | korean-traditional-performances-seoul | [National Jeongdong Theater — 2026 정오의 한마당](https://www.jeongdong.or.kr/portal/bbs/B0000252/view.do?nttId=11878&menuNo=200002) |
| Half price in hanbok at the Saturday Gugak Concert | 2026-10-24 ~ 2026-10-24 | korean-traditional-performances-seoul | [National Gugak Center — 2026 토요명품 listing](https://www.gugak.go.kr/site/program/performance/detail?menuid=001001001&performance_id_main=37004) |
| Namsangol tea-snack class: 2026 season ends October 25 | 2026-04-03 ~ 2026-10-25 | korean-tea-culture-seoul | [Namsangol Hanok Village — 다과 만들기](https://hanokmaeul.co.kr/166) |
| Namsangol tea etiquette class: 2026 season ends October 29 | 2026-04-07 ~ 2026-10-29 | korean-tea-culture-seoul | [Namsangol Hanok Village — 다례예절교실](https://hanokmaeul.co.kr/169) |
| Folk museum Hall 1 closed for redesign | 2026-09-30 ~ 2026-12-21 | national-folk-museum-of-korea-guide, gyeongbokgung-palace-guide, free-korean-culture-seoul | [National Folk Museum of Korea — Visitor information](https://www.nfm.go.kr/english/subIndex/1.do) |
| Several National Museum galleries closed | 2026-07-06 ~ 2027-01-28 | national-museum-of-korea-guide, free-korean-culture-seoul, seoul-culture-itinerary-3-days, seoul-culture-first-visit | [National Museum of Korea — Notice of temporary gallery closures](https://www.museum.go.kr/ENG/contents/E0201010000.do) |

## 본문에서 옮기거나 고친 문장

새 사실은 넣지 않았다. 10/20에 확인한 내용을 공지로 옮겼다. 그래서 가이드의 `updatedAt`과 method 점검일은 바꾸지 않았다.

예외가 하나 있다. 차 문화 가이드가 남산골 옥인동 가옥을 "옮겨 지은 가옥(relocated)"이라고 쓴 것은 오류였다. 운영자 자료(hanokmaeul.co.kr/arch)대로 1910년대 가옥의 복제 건물로 고쳤다.

| 가이드 | 위치 | 수정 전 | 수정 후 | 이유 |
|---|---|---|---|---|
| `gyeongbokgung-palace-guide` | keyFacts.3.value | ; free for everyone Oct 29–Nov 15, 2026 | (삭제) | Moved to the Oct 29–Nov 15, 2026 free-entry notice |
| `gyeongbokgung-palace-guide` | sections.en.5.paragraphs.0 | From October 29 to November 15, 2026, admission is free for everyone during the Korea Grand Festival, though the palace still closes on Tuesdays. | (삭제) | Moved to the Oct 29–Nov 15, 2026 free-entry notice |
| `gyeongbokgung-palace-guide` | sections.en.1.paragraphs.2 | The platform is sometimes roped off at busy times; from September 2 to October 31, 2026, the palace has closed it to protect the stone railings from peak-season crowds, so until then you will be viewing the hall from the courtyard. | The palace closes the platform at busy times to protect the stone railings, as it did for the autumn 2026 peak season, so you may be viewing the hall from the courtyard. | Closure dates moved to the platform notice (to Oct 31, 2026) |
| `gyeongbokgung-palace-guide` | sections.en.3.paragraphs.1 | which in 2026 runs on Wednesdays and Fridays from April 1 to October 30 at 10:00 and 14:00, | which runs on Wednesdays and Fridays at 10:00 and 14:00 during its spring-to-autumn season (April 1 to October 30 in 2026), | Season end moved to the Gyeonghoeru tour notice; body describes the recurring program |
| `gyeongbokgung-palace-guide` | sections.en.7.paragraphs.2 | One caution for late 2026: Permanent Exhibition Hall 1 has been closed since September 30 and is scheduled to reopen after December 21. | (삭제) | Moved to the folk museum Hall 1 notice |
| `changdeokgung-huwon-secret-garden` | keyFacts.2.value | ; free for everyone Oct 29–Nov 15, 2026 | (삭제) | Moved to the Oct 29–Nov 15, 2026 free-entry notice |
| `changdeokgung-huwon-secret-garden` | sections.en.3.paragraphs.1 | From October 29 to November 15, 2026, the palace halls are free for everyone during the Korea Grand Festival, but the garden still needs its paid ticket. | (삭제) | Moved to the Oct 29–Nov 15, 2026 free-entry notice |
| `changdeokgung-huwon-secret-garden` | sections.en.7.paragraphs.1 | (except November 10 to 15, 2026, when general visits end at 17:30 while a separately booked night program runs) | (삭제) | Moved to the Changgyeonggung Nov 10–15 notice |
| `seoul-five-grand-palaces-compared` | keyFacts.4.value | ; everyone Oct 29–Nov 15, 2026 (Secret Garden excepted) | (삭제) | Moved to the Oct 29–Nov 15, 2026 free-entry notice |
| `seoul-five-grand-palaces-compared` | sections.en.1.paragraphs.1 | One exception: from November 10 to 15, 2026, Changgyeonggung closes at 17:30 (last entry 16:30) while a separately booked night program runs. | (삭제) | Moved to the Changgyeonggung Nov 10–15 notice |
| `seoul-five-grand-palaces-compared` | sections.en.5.paragraphs.2 | (it is closed until November 1, 2026) | (삭제) | Moved to the Dondeokjeon notice |
| `seoul-five-grand-palaces-compared` | sections.en.6.paragraphs.1 | From October 29 to November 15, 2026, the four palaces and Jongmyo are free for everyone during the Korea Grand Festival, the Secret Garden excepted. | (삭제) | Moved to the Oct 29–Nov 15, 2026 free-entry notice |
| `jongmyo-shrine-guide` | keyFacts.4.value | ; free for everyone Oct 29–Nov 15, 2026 | (삭제) | Moved to the Oct 29–Nov 15, 2026 free-entry notice |
| `jongmyo-shrine-guide` | sections.en.5.paragraphs.2 | From October 29 to November 15, 2026, every open day is a free-viewing day with free admission for the Korea Grand Festival. | (삭제) | Moved to the Oct 29–Nov 15, 2026 free-entry notice |
| `jongmyo-shrine-guide` | faq.0.a | free viewing, as happens from October 29 to November 15, 2026, so check | free viewing, so check | Moved to the Oct 29–Nov 15, 2026 free-entry notice |
| `hanbok-rental-palace-guide` | sections.en.2.paragraphs.3 | regardless of what they wear; from October 29 to November 15, 2026, the palaces and Jongmyo are free for everyone. | regardless of what they wear. | Moved to the Oct 29–Nov 15, 2026 free-entry notice |
| `national-folk-museum-of-korea-guide` | quickAnswer | Permanent Exhibition Hall 1 is closed for renovation until December 21, 2026, so plan on Halls 2 and 3 and the outdoor exhibits, including a recreated 1970s–80s street whose shop interiors open on weekdays only. | Halls 2 and 3 cover the yearly cycle and the life cycle, and the outdoor exhibits include a recreated 1970s–80s street whose shop interiors open on weekdays only. | Hall 1 closure moved to its notice |
| `national-folk-museum-of-korea-guide` | keyFacts (Hall 1) | Hall 1: Closed Sept 30–Dec 21, 2026; reopens Dec 22 | (삭제) | Hall 1 closure (Sept 30–Dec 21, 2026) moved to its notice |
| `national-folk-museum-of-korea-guide` | sections.en.1.heading | Hall 1 is closed until December 21: plan around Halls 2 and 3 | Halls 2 and 3, and the Hall 1 redesign | Heading no longer expires on Dec 21 |
| `national-folk-museum-of-korea-guide` | sections.en.1.paragraphs.0 | closed on September 30, 2026. The museum says it will reopen on Tuesday, December 22, 2026 under a new theme provisionally titled Faces of the World (세계인의 얼굴). Until then, the core of a visit is Hall 2 on the yearly cycle and Hall 3 on the life cycle, which are both open. | closed on September 30, 2026 for a redesign, and the museum plans to reopen it on Tuesday, December 22, 2026 under a new theme provisionally titled Faces of the World (세계인의 얼굴). Hall 2 on the yearly cycle and Hall 3 on the life cycle stay open throughout, and they are the core of a visit in any case. | Removes 'until then' wording that expires on Dec 22 |
| `national-folk-museum-of-korea-guide` | sections.en.6.paragraphs.1 | , and is free from October 29 to November 15, 2026 during the Korea Grand Festival, Tuesdays excepted. | . | Moved to the Oct 29–Nov 15, 2026 free-entry notice |
| `national-folk-museum-of-korea-guide` | faq.4.q | Why is Permanent Exhibition Hall 1 closed? | What is changing in Permanent Exhibition Hall 1? | FAQ question no longer expires |
| `national-folk-museum-of-korea-guide` | faq.4.a | It is being redesigned. The museum closed Hall 1 on September 30, 2026 and plans to reopen it on December 22, 2026 under a new theme provisionally titled Faces of the World. Halls 2 and 3 and the outdoor exhibits remain open. | A redesign. The museum closed Hall 1 on September 30, 2026 and plans to reopen it on December 22, 2026 under a new theme provisionally titled Faces of the World. Halls 2 and 3 and the outdoor exhibits stay open during the work. | FAQ answer no longer expires |
| `national-museum-of-korea-guide` | summary.en | , and which rooms stay shut until January 2027. | , and how to route around gallery closures. | Summary no longer expires on Jan 28, 2027 |
| `national-museum-of-korea-guide` | quickAnswer | The permanent galleries are free, but six galleries on the second and third floors, including Buddhist Sculpture and Metal Crafts, and the Room of Senses are closed until January 28, 2027. | The permanent galleries are free. | Gallery closures moved to the renovation notice |
| `national-museum-of-korea-guide` | keyFacts (Closed galleries) | Closed galleries: Rooms 202-3, 202-4, 203, 204, 301, 302 and Room of Senses until Jan 28, 2027 | (삭제) | Gallery closures (to Jan 28, 2027) moved to the renovation notice |
| `national-museum-of-korea-guide` | sections.en.1.heading | What is closed until January 28, 2027, and what is not | The 2026–27 gallery renovation: what is closed and what is not | Heading names the renovation instead of an end date |
| `free-korean-culture-seoul` | keyFacts.2.label | Next free-for-all window | Free-for-all windows | Moved to the Oct 29–Nov 15, 2026 free-entry notice |
| `free-korean-culture-seoul` | keyFacts.2.value | Oct 29–Nov 15, 2026: four palaces, Jongmyo and royal tombs, closing days excepted | Announced on palace notice boards; in 2026 Seollal, Chuseok and Oct 29–Nov 15 | Moved to the Oct 29–Nov 15, 2026 free-entry notice |
| `free-korean-culture-seoul` | sections.en.1.paragraphs.0 | The next window runs from October 29 to November 15, 2026, during the Korea Grand Festival: the four palaces, Jongmyo and the Joseon royal tombs are free, but regular closing days still apply, so Gyeongbokgung and Jongmyo close on Tuesdays and the others on Mondays. The Secret Garden's tours stay paid, and Jongmyo runs as a self-guided site for the whole period. | In 2026 free windows were set for Seollal and Chuseok, covering most or all of the palaces, and for the Korea Grand Festival from October 29 to November 15, covering the four palaces, Jongmyo and the Joseon royal tombs. Regular closing days still apply during these windows, so Gyeongbokgung and Jongmyo close on Tuesdays and the others on Mondays, and the Secret Garden's tours stay paid. | Moved to the Oct 29–Nov 15, 2026 free-entry notice |
| `free-korean-culture-seoul` | sections.en.2.paragraphs.0 | Read the renovation notice before you plan a route: several painting, sculpture and crafts galleries on the second and third floors, including Buddhist Sculpture and Metal Crafts, are closed until January 28, 2027, while the celadon and white porcelain rooms stay open. | Check the museum's notice board for gallery closures before you plan a route. | Gallery closures moved to the renovation notice |
| `free-korean-culture-seoul` | sections.en.2.paragraphs.2 | Permanent Exhibition Hall 1 is shut until December 21, 2026, and the outdoor buildings' interiors close to visitors on weekends and public holidays. | The outdoor buildings' interiors close to visitors on weekends and public holidays. | Moved to the folk museum Hall 1 notice |
| `free-korean-culture-seoul` | sections.en.7.table.rows.1.2 | Age or hanbok only; everyone from Oct 29 to Nov 15, 2026 | Age or hanbok, or during announced free windows | Moved to the Oct 29–Nov 15, 2026 free-entry notice |
| `free-korean-culture-seoul` | sections.en.7.table.rows.5.3 | Special exhibitions paid; several upper galleries shut until Jan 28, 2027 | Special exhibitions paid; check for gallery closures | Moved to the renovation notice |
| `free-korean-culture-seoul` | sections.en.7.table.rows.7.3 | Hall 1 shut until Dec 21, 2026 | Outdoor building interiors closed on weekends and holidays | Moved to the folk museum Hall 1 notice |
| `free-korean-culture-seoul` | faq.0.a | if you wear hanbok, or if you visit between October 29 and November 15, 2026. | if you wear hanbok, or during a free-for-all window announced on the palace notice boards. | Moved to the Oct 29–Nov 15, 2026 free-entry notice |
| `free-korean-culture-seoul` | faq.3.q | When is the next free palace period? | When are the palaces free for everyone? | Moved to the Oct 29–Nov 15, 2026 free-entry notice |
| `free-korean-culture-seoul` | faq.3.a | From October 29 to November 15, 2026, the four palaces, Jongmyo and the royal tombs are free for everyone, with regular closing days and the Secret Garden excepted. After that, watch each palace's notice board on royal.khs.go.kr; the autumn 2026 window was posted five weeks before it began. | Only during windows the heritage service announces on each palace's notice board at royal.khs.go.kr. In 2026 they were set for Seollal, Chuseok and October 29 to November 15, with regular closing days and the Secret Garden excepted, and the autumn window was posted five weeks before it began. | Moved to the Oct 29–Nov 15, 2026 free-entry notice |
| `seoul-culture-itinerary-3-days` | sections.en.4.paragraphs.1 | Check what is shut before you set out. Rooms 202-3, 202-4, 203, 204, 301 and 302 and the Room of Senses, which include the Buddhist Sculpture and Metal Crafts galleries, are closed until January 28, 2027, so older highlight routes will lead you to closed doors. | Check the museum's notice board for gallery closures before you set out, since older highlight routes can lead to closed doors. | Gallery closures moved to the renovation notice |
| `seoul-culture-first-visit` | sections.en.4.paragraphs.0 | The renovation notice specifically keeps Rooms 303 and 304 open while other galleries, including Buddhist Sculpture and Metal Crafts, are closed through January 28, 2027. Do not copy an older 'museum highlights' route through those closed rooms. | During the 2026–27 renovation the museum has kept the ceramics Rooms 303 and 304 open while closing galleries such as Buddhist Sculpture and Metal Crafts, so do not copy an older 'museum highlights' route without checking which rooms are open. | Gallery closure end date moved to the renovation notice |
| `korean-traditional-performances-seoul` | sections.en.2.paragraphs.2 | Seoul Donhwamun Gugakdang, for example, listed a free 120-minute Chunhyangga in the Manjeong style for Sunday, October 25, 2026, as a rental production with its own contact number. | Seoul Donhwamun Gugakdang, for example, has listed a free 120-minute Chunhyangga in the Manjeong style as a rental production with its own contact number. | One-off date removed from an example |
| `korean-traditional-performances-seoul` | sections.en.5.paragraphs.2 | On October 24, 2026, Hanbok Culture Week, hanbok wearers receive 50 percent off their own ticket. | (삭제) | Moved to the Oct 24 hanbok discount notice |
| `korean-traditional-performances-seoul` | sections.en.7.paragraphs.2 | and hanbok is welcome, as the Gugak Center's October 24 hanbok discount shows. | and hanbok is welcome; the Gugak Center has offered hanbok wearers half-price tickets during Hanbok Culture Week. | One-off date removed |
| `korean-traditional-performances-seoul` | sections.en.6.paragraphs.1 | Through October 31, 2026 it runs a free outdoor lunchtime program, 2026 정오의 한마당, Tuesday to Friday from 12:00 to 12:50 plus a closing show on Saturday, October 31 at 16:10, with Namsadang tightrope walking and the martial art taekkyeon among the acts. No reservation is needed, and rain cancels the show. | In autumn 2026 it has run a free outdoor lunchtime program, 정오의 한마당, Tuesday to Friday at noon, with Namsadang tightrope walking and the martial art taekkyeon among the acts; no reservation is needed, and rain cancels the show. | Run dates moved to the Jeongdong notice |
| `korean-traditional-performances-seoul` | faq.3.a | Through October 31, 2026, the National Jeongdong Theater runs a free outdoor lunchtime program, Tuesday to Friday from 12:00 to 12:50, with a closing show on Saturday, October 31 at 16:10, and no reservation is needed. It is cancelled in rain. Outside that run, check | Look at the National Jeongdong Theater first: in autumn 2026 it has run a free outdoor lunchtime program, 정오의 한마당, Tuesday to Friday at noon with no reservation, cancelled in rain. Also check | Run dates moved to the Jeongdong notice |
| `korean-tea-culture-seoul` | sections.en.5.paragraphs.0 | in one of its relocated houses, the Okin-dong house. In 2026 its tea etiquette class (다례예절교실) runs Tuesday to Thursday between 10:00 and 16:00 in six sessions of about 50 minutes for ages five and up, but only for groups, with bookings through 02-6358-5538, and the season ends on October 29. Its tea-snack making class (다과 만들기), open to individuals, runs Friday to Sunday with a dedicated reservation link for foreign visitors until October 25. | in one of its houses, the Okin-dong house, a replica of a 1910s home. In 2026 its tea etiquette class (다례예절교실) has run from April, Tuesday to Thursday, in six sessions of about 50 minutes for ages five and up, but only for groups, and its tea-snack making class (다과 만들기), open to individuals, has run Friday to Sunday with a dedicated reservation link for foreign visitors. | Season end dates moved to the two Namsangol class notices; Okin-dong house is a replica, not relocated |
| `namsangol-hanok-village-namsan` | sources.0.note | five relocated folk-heritage hanok | the five hanok | Source note no longer repeats the portal's 'five relocated' wording |

## 공지로 해결되지 않아 직접 다시 손볼 것

| 날짜 | 할 일 |
|---|---|
| 2026-12-22 | 국립민속박물관 상설전시관1 재개관. `national-folk-museum-of-korea-guide`의 "Halls 2 and 3, and the Hall 1 redesign" 절과 FAQ를 새 전시 기준으로 다시 쓴다. |
| 2026-12-26 이후 | `korean-traditional-performances-seoul` 핵심정보의 "2026 run ends December 26"를 2027 토요명품 일정으로 바꾼다. |
| 2027-01-29 | 국립중앙박물관 전시실 재개관. `national-museum-of-korea-guide`의 "The 2026–27 gallery renovation" 절, 표(2026-10-20 기준 상태), FAQ 첫 문항을 다시 쓴다. |
| 상시 | `data/notices.json`에서 끝난 공지를 정리한다. 남겨 둬도 화면에는 안 나오고, 검증기 경고만 뜬다. |

## 검증

- `npm run verify` 통과. 테스트 50/50이다.
- 기존 테스트 1개를 고쳤다. `seoul-culture-first-visit` 본문에 "January 28, 2027"이 있어야 한다는 테스트였다. 이제 그 가이드에 붙는 공지 데이터에서 확인한다.
- `SITE_TODAY=2026-11-16`으로 빌드하면 궁궐 공지와 홈 배너가 빠지고, 박물관 휴관 공지 2건만 남는다.
- 브라우저에서 종료일·시작일 데이터를 바꿔 숨김과 라벨 전환을 확인했다.
- 커밋·배포는 하지 않았다. 10/29 무료개방 시작 전에 배포해야 홈 배너가 제때 보인다.
