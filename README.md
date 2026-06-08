# Korea Now Guide

외국인 관광객을 타겟으로 한 한국 행사, K-pop 팝업, 올리브영, 면세점, 백화점, 축제, 여행 혜택 큐레이션 사이트입니다.

목표는 “공식 출처가 있는 최신 정보를 빠르게 확인해서 다국어로 보여주는 사이트”입니다. AdSense 승인을 보장할 수는 없지만, 자동 복붙성 저가치 페이지를 피하고 출처, 날짜, 개인정보/문의/약관, 정적 HTML, 가이드 콘텐츠를 갖춘 구조로 만들었습니다.

## 구조

- `data/events.json`: 게시되는 행사/딜 데이터
- `data/sources.json`: 자동 수집 후보와 모니터링 출처
- `data/guides.json`: 방문자용 원본 가이드 콘텐츠
- `data/weather-baselines.json`: 전년도 날씨 API 연결 전 임시 준비물 노트
- `scripts/build.mjs`: 다국어 정적 HTML 생성
- `scripts/import-tourapi.mjs`: 한국관광공사 TourAPI 행사 피드 가져오기
- `scripts/source-audit.mjs`: 공식 출처 URL 응답 상태 점검
- `dist/`: Cloudflare Pages 배포 결과물

## 로컬 빌드

PowerShell 실행 정책 때문에 Windows에서는 `npm.cmd`를 쓰는 편이 안전합니다.

```powershell
npm.cmd run build
```

간단히 확인:

```powershell
python -m http.server 8766 -d dist
```

## Cloudflare Pages

GitHub에 이 폴더를 올린 뒤 Cloudflare Pages에서 연결합니다.

- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: 이 프로젝트 루트

`wrangler.toml`에도 `pages_build_output_dir = "dist"`가 들어 있습니다.

## TourAPI 연결

한국관광공사 TourAPI 키를 받은 뒤:

```powershell
$env:KTO_SERVICE_KEY="YOUR_DATA_GO_KR_KEY"
npm.cmd run import:tourapi
```

결과는 `data/feeds/tourapi-YYYYMMDD.json`에 저장됩니다. 이 파일은 바로 게시하지 말고, 제목/기간/장소/공식 링크를 검토한 뒤 `data/events.json`에 선별 병합합니다.

## 운영 원칙

1. 공식 API/공식 페이지/공식 SNS만 게시 후보로 사용합니다.
2. K-pop 팝업은 루머가 많으므로 `manual-review-required`로 큐레이션합니다.
3. 행사별로 `lastChecked`, `sourceUrl`, `collectionMode`, `verification`을 비워두지 않습니다.
4. 끝난 행사는 “종료”로 표시하고 아카이브로 유지합니다.
5. 출처 문장을 그대로 길게 복사하지 않고, 방문자에게 필요한 요약과 여행 판단 정보를 직접 작성합니다.
6. AdSense 신청 전 실제 도메인, 이메일, 개인정보처리방침, `ads.txt`, Search Console, sitemap 제출을 완료합니다.

## AdSense 전 체크리스트

- 실제 도메인 연결
- `SITE_URL=https://yourdomain.com npm run build`로 sitemap canonical 교체
- `/en/privacy/`, `/en/contact/`, `/en/about/`, `/en/terms/` 확인
- 최소 30개 이상의 유효한 행사/가이드/아카이브 페이지 확보
- 이미지 깨짐 없음
- 모바일 레이아웃 확인
- 애드센스 승인 전에는 광고 클릭 유도 문구 금지

## 소스 점검

```powershell
npm.cmd run check:sources
```

일부 사이트가 봇/지역/세션 제한으로 실패할 수 있습니다. 실패는 자동 삭제가 아니라 검토 대기 신호로 처리합니다.
