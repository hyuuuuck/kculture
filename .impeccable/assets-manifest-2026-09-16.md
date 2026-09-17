# Programme-cover A — real asset manifest

Audit date: 2026-09-16. Scope: the three image roles in `.impeccable/mocks/programme-cover.png` and the other six events in `data/editorial-program.json:indexableEvents`. This is an asset/provenance handoff, not editorial approval, a rights clearance certificate, deployment or AdSense readiness.

The approved mock is visual reference only. Its palace, garden and mask-dancer pixels are synthetic and must not ship as documentary photography. No image generation, invented documentary scene, retouching, upscaling or application/data edit was performed in this pass. Three separately sourced, unmodified JPEG files were added after the parent authorized official-source alternatives. Only the selected files are in `assets/editorial/`; inspected rejects remain outside the repository in `/tmp/kspot-asset-audit.24My9W/`.

## Findings and recommendation

- **Pass — traceability:** all nine incumbent files exist and match event metadata paths. `node scripts/validate-thumbnail-audit.mjs` passed for the full 71-event inventory. That check verifies metadata/path conditions, not visual subject, permission, event year or display resolution.
- **Fail — incumbent lead suitability:** the Deoksugung JPEG is only 570×420; the garden JPEG visibly bears `SIGS 2025`; the Andong PNG is a venue illustration, not a performance photograph. These cannot honestly reproduce the approved lead-photo roles without qualification or substitution.
- **Pass — better real replacements located:** the three new files below were visually inspected, dimensions measured with `sips`, and downloaded from URLs embedded in their named official pages. No search-result thumbnail or generated comp crop is being shipped.
- **Unconfirmed — rights:** the new Deoksugung photo has explicit editorial/commercial reuse language on its source page. No equivalent permission evidence was found for the new Garden/Andong photos or in the incumbent thumbnail metadata. An official host and attribution are not a reuse licence. Keep that gap visible before an authorized production release.
- **Expected benefit, not approval prediction:** correct image roles, truthful captions and adequate size reduce misleading visual claims and improve comprehension. They do not establish unique article value or predict AdSense approval.

## produce

None. No generative cleanup is warranted for real event evidence. Do not remove masks, signs, copyright marks, dates, audiences or scene objects to make a photograph resemble the comp. Do not regenerate the comp's documentary-looking images.

## direct — selected replacement assets

For these entries, `source_crop` names the approved mock's visual role, not the source of shipping pixels; `prompt_used` is not applicable. All files are unmodified downloaded JPEGs, without transparency. HTML/CSS owns the responsive crop and captions. `qa_status` includes visual-fit concerns separately from rights status.

### deoksugung-hero

- `source_crop`: programme-cover A, top-right palace/guard image, approximately 900×450 CSS pixels.
- `output_path`: `assets/editorial/deoksugung-guards-smg-2020.jpg`
- `strategy`: direct official handout photo; replace the 570px incumbent rather than upscale it.
- `dimensions`: 1000×658; 494,358 bytes. `format`: JPEG. `transparency`: none.
- Source page: [Seoul Metropolitan Government — Deoksugung Palace in Seoul](https://english.seoul.go.kr/deoksugung-palace-in-seoul/), section “Photos of the guards guarding the entrance to Deoksugung Palace”.
- Source image: [Deoksugung-Palace-in-Seoul-1.jpg](https://english.seoul.go.kr/wp-content/uploads/2021/04/Deoksugung-Palace-in-Seoul-1.jpg).
- Rights evidence: that photo section explicitly permits editorial and commercial use without a publication fee. Preserve source credit; do not call this CC0 or invent a photographer credit. Source text identifies the handout as 2020, but contains inconsistent day labels; use the year only.
- Suggested attribution metadata: `Seoul Metropolitan Government · archive photograph, 2020` with source-page link. This is an asset credit suggestion, not approved article copy.
- Crop: for `aspect-ratio: 2 / 1`, use `object-fit: cover; object-position: 50% 65%`. A 1000×500 crop beginning near source y=103 retains the hats and nearly all full figures. Prefer 3:2/natural ratio on narrow screens. Do not crop to a single face or erase face coverings.
- `deviations`: real front-facing guards under the gate replace the comp's invented rear-view procession and panoramic gate roof. The archive scene includes face coverings. Adequate at roughly 900px wide at 1×, but **not** a 1800px/2× hero; do not advertise it as retina-sharp or upscale to create false detail.
- `qa_status`: `needs_parent_review` — real subject/permission passed, but full-width hero crop and 1× resolution need the parent's actual layout inspection.
- SHA-256: `66d9e44d1aaf6f42fb7e87702b08cb8ae12edc9a2363ea0cd159bdf8f4695c6c`.

### seoul-garden-secondary

- `source_crop`: programme-cover A, upper secondary image, approximately 260×180 CSS pixels.
- `output_path`: `assets/editorial/seoul-garden-visitseoul-reference.jpg`
- `strategy`: direct third photo from the same official Garden Show listing; avoid the incumbent photo's visible 2025 branding.
- `dimensions`: 800×571. `format`: JPEG. `transparency`: none.
- Source page: [Visit Seoul — 2026 Seoul International Garden Show](https://english.visitseoul.net/events/2026Seoul-International-Garden-Show/ENP47mbp7).
- Source image: [Garden Show detail 03, MEDIA 79324](https://english.visitseoul.net/comm/getImage?srvcId=MEDIA&parentSn=79324&fileTy=MEDIA&fileNo=1&thumbTy=L). Its image element is labeled `Seoul International Garden Show_Detail_03` on the live page.
- Subject: garden seating, stone edging, plants and trees; no photographed event-year text.
- Rights evidence: source footer says all rights reserved; no asset-specific reuse grant was observed. Source provenance is confirmed; reuse permission is **unconfirmed**.
- Suggested attribution metadata: `Reference image from Visit Seoul's Garden Show listing; photograph year not stated` with source-page link. Do not describe it as a photograph of the September 2026 conditions or an independently verified Seoul Forest location.
- Crop: `object-fit: cover; object-position: 50% 50%` at 13:9 or 3:2. The 260×180 crop is minor and retains the seating and garden. Sufficient pixels for 2× at that secondary size. Do not stretch to the main hero width.
- `deviations`: garden seating replaces the comp's invented water/skyline view. The source reuses imagery and does not state the capture year; absence of a 2025 label is not proof of a 2026 photograph.
- `qa_status`: `needs_parent_review` — visual match to garden role passed; accurate caption and rights disposition remain with the parent/user.
- SHA-256: `760746e6ea4532ac7e60917e0878d29b290744b2fcdc90c15bd120f44331246f`.

### andong-maskdance-secondary

- `source_crop`: programme-cover A, lower secondary mask-dancer image, approximately 260×180 CSS pixels.
- `output_path`: `assets/editorial/andong-hahoe-maskdance-official-reference.jpg`
- `strategy`: direct photograph from the organizer's Hahoe Byeolsingut Talnori program page; replace the incumbent venue illustration.
- `dimensions`: 1000×666; 616,497 bytes. `format`: JPEG. `transparency`: none.
- Source page: [Andong organizer — Hahoe Byeolsingut Talnori](https://en.maskdance.com/2024/sub2/sub1.asp?page=3&search=&seq=4316&yflag=2026).
- Source image: [하회별신굿01.jpg](https://en.maskdance.com/gears_pds/pfm/4316/%ED%95%98%ED%9A%8C%EB%B3%84%EC%8B%A0%EA%B5%BF01.jpg). The full-size file is linked by the program page, not an inferred image-server variant.
- Subject: a masked performer in white before seated spectators. Subject association is supported by the specific Hahoe program page, not inferred from clothing alone.
- Rights evidence: organizer page says all rights reserved; no asset-specific reuse grant was observed. Source provenance is confirmed; reuse permission is **unconfirmed**.
- Suggested attribution metadata: `Hahoe Byeolsingut Talnori · official program reference photograph; year not stated` with source-page link. The festival is upcoming at audit time; this must not imply a photograph from its 2026 performance.
- Crop: `object-fit: cover; object-position: 62% 50%` at 13:9 or 3:2. The complete performer fits at 260×180, and pixels are sufficient for 2×. Avoid a very wide 2:1 crop if it cuts the raised hand or shoes; use a natural-ratio photograph for the article lead.
- `deviations`: outdoor daytime performance with visible spectators replaces the comp's invented dark-stage close-up. Keep the genuine scene rather than masking the audience or changing the background.
- `qa_status`: `needs_parent_review` — subject/resolution passed; caption and rights disposition remain with the parent/user.
- SHA-256: `b1818e8fd4e449fb4585e3ca2fa810ae5c9141910399e4c9e6cb64f52cb3aa7a`.

## direct — nine incumbent event files

All incumbent paths below are relative to `assets/event-thumbnails/official/`. `output_path` is the existing path, not a newly generated file. `source_crop` is not applicable because these are existing event assets, and `prompt_used` is not applicable. `strategy` is preserve as a source-linked reference at an honest size unless the parent elects one of the replacements above. None of these metadata records contains an asset-specific licence or permission record. The official-assets README requires permission; collection provenance does not satisfy that requirement by itself.

| id / output filename | Measured dimensions / format / transparency | Actual visual role and crop handoff | deviations / qa_status |
| --- | --- | --- | --- |
| `deoksugung-royal-guard-changing-ceremony-2026.jpg` | 570×420 JPEG, opaque; 61,273 bytes | Real guard ceremony/gate photo. Preserve at 4:3 or natural ratio; `50% 50%`. | Too small for 900px hero; 2:1 cuts important flag/figure content. Prefer selected replacement. `needs_parent_review`. |
| `seoul-international-garden-show-2026.jpg` | 800×571 JPEG, opaque; 162,012 bytes | Real garden/sign photograph, `50% 50%`, sufficient for 260×180. | Visible `SIGS 2025` is intrinsic evidence. Never crop the date solely to pass it off as 2026; use an archive caption or selected replacement with its own uncertainty. `needs_parent_review`. |
| `andong-maskdance-festival-2026.png` | 322×245 PNG, alpha; 26,138 bytes | Isometric venue illustration, not a documentary photo. If retained, `object-fit: contain`, white or pale-lavender code-owned background, ≤260px wide. | Cannot fulfill mask-dancer-photo role; not 2× at 260px. Label official venue illustration. Prefer selected replacement. `needs_parent_review`. |
| `nct-dream-sweet-dream-hotel-incheon-2026.gif` | 750×1000 GIF, opaque; 448,467 bytes | Illustrated official concert poster with intrinsic title/date/location. `object-fit: contain; object-position: 50% 50%`; natural 3:4 portrait. | Never crop away date or repaint type; maintain closed/archive status because printed dates are August 22–23. Not a live-event photograph. `needs_parent_review`. |
| `boryeong-mud-festival-2026.png` | 391×383 PNG, alpha; 256,199 bytes | Real participant photograph with baked circular/diagonal graphic treatment. Use `contain`, ≤260×255, white or consistent neutral CSS backing. | Not a clean rectangle, low pixel count, and visible graphic treatment cannot be “removed” without reconstruction. Keep as official promotional image, not broad documentary hero. Closed event. `needs_parent_review`. |
| `gwangalli-m-drone-light-show-2026.jpg` | 960×1440 JPEG, opaque; 499,036 bytes | Real portrait drone display, bridge and crowd. Best natural 2:3; use `contain` or portrait figure. | A 260×180 cover crop cannot show full drone display, bridge and audience together. Do not use center cover in the same landscape module without acknowledging lost context. If mandatory, `50% 20%` favors the drone figure but loses the crowd. Photograph does not guarantee a future show's theme. `needs_parent_review`. |
| `national-geographic-ocean-seoul-2026.jpg` | 570×420 JPEG, opaque; 42,637 bytes | Official OCEAN poster treatment with baked dark side areas, jellyfish and title. Use natural ratio/`contain`; ≤570px wide. | Not an exhibition-installation photo; do not crop the title or treat the dark side areas as defects requiring generative cleanup. Not 2× beyond 285px CSS width. `needs_parent_review`. |
| `fernando-botero-seoul-2026.jpg` | 570×420 JPEG, opaque; 51,659 bytes | Artwork-based exhibition poster with white side areas and intrinsic name/dates. Use natural ratio/`contain`; ≤570px wide. | Printed end date August 30; must remain closed/archive, not a current programme lead. No independent reproduction licence for the artwork is recorded. `needs_parent_review`. |
| `jinju-namgang-yudeung-festival-2026.jpg` | 940×627 JPEG, opaque; 57,273 bytes | Real river lantern/firework photograph. At 13:9 or 3:2, use `cover; object-position: 50% 50%`. | Suitable secondary image at 260×180; capture year unstated. Fireworks in this reference photo do not prove a particular 2026 schedule or nightly programme. `needs_parent_review`. |

### Incumbent provenance map

These are the `sourceImageUrl` and `sourcePage` in `data/thumbnail-sources.json`, read on the audit date. Except the Garden listing (freshly fetched) and Andong organizer (freshly inspected), this pass did not re-fetch all nine source pages; it audited local pixels and recorded provenance, not current remote availability or new rights.

| id | Recorded official page | Recorded direct image |
| --- | --- | --- |
| Deoksugung | [Visit Seoul ceremony](https://english.visitseoul.net/events/TheRoyalGuardChangingCeremony/ENP81fkn2) | [MEDIA 80358](https://english.visitseoul.net/comm/getImage?srvcId=MEDIA&parentSn=80358&fileTy=MEDIA&fileNo=1) |
| Garden | [Visit Seoul Garden Show](https://english.visitseoul.net/events/2026Seoul-International-Garden-Show/ENP47mbp7) | [MEDIA 79322](https://english.visitseoul.net/comm/getImage?srvcId=MEDIA&parentSn=79322&fileTy=MEDIA&fileNo=1&thumbTy=L) |
| Andong | [Official festival homepage](https://en.maskdance.com/) | [main_stage02.png](https://en.maskdance.com/2024/images/v2/main_stage02.png) |
| NCT DREAM | [NOL World ticket page](https://world.nol.com/en/ticket/places/26000650/products/26008234) | [Official ticket poster](https://ticketimage.interpark.com/Play/image/large/26/26008234_p.gif) |
| Boryeong | [Official festival](https://www.mudfestival.or.kr/en/festival/main.html) | [Official program image](https://www.mudfestival.or.kr/template/festival/user/images/main/program_info_img1.png) |
| Gwangalli | [Official show website](https://www.gwangallimdrone.co.kr/en/home) | [Official site's hosted night photograph](https://cdn.prod.website-files.com/6669214a59db5176f76a1950/695b5ede2a4377bb3cdef8db_KakaoTalk_20260105_151835692_05.jpg) |
| OCEAN | [Visit Seoul exhibition](https://english.visitseoul.net/exhibition/OCEAN/ENP07kl3f) | [MEDIA 79581](https://english.visitseoul.net/comm/getImage?srvcId=MEDIA&parentSn=79581&fileTy=MEDIA&fileNo=1) |
| Botero | [Visit Seoul exhibition](https://english.visitseoul.net/exhibition/Botero/ENPw7lepl) | [MEDIA 79568](https://english.visitseoul.net/comm/getImage?srvcId=MEDIA&parentSn=79568&fileTy=MEDIA&fileNo=1) |
| Jinju | [VISITKOREA festival](https://english.visitkorea.or.kr/svc/contents/contentsView.do?vcontsId=96362) | [KTO CMS photograph](https://tong.visitkorea.or.kr/cms/resource/21/3380921_image2_1.jpg) |

## semantic

| id | implementation | notes | qa_status |
| --- | --- | --- | --- |
| Masthead and navigation | Real text wordmark/home link, `<nav aria-label="Main">` list of existing routes, and CSS border/divider; parent owns fonts. | Do not rasterize the mock wordmark or add its decorative search without a functioning search feature. Wrap/reflow at narrow widths; no horizontal clipping. | `accepted` — handoff matches mock role; rendered implementation still parent-owned. |
| Programme hero and photo credit | CSS grid with text/CTA on left, `<figure><img width height><figcaption>` on right; image has only photograph pixels. Use the selected Deoksugung archive image and a source-credit link outside any full-card link. | CSS owns violet panel, gap, background, 2:1 clipping and caption strip. Stack text and figure on narrow screens; do not place text over masks/faces or bake caption pixels. Keep historical year separate from article's fact-check date. | `accepted` — implementation handoff, not a browser QA result. |
| Secondary editorial choices | Two semantic `<article>` rows with linked heading, short existing copy and `<figure>`; CSS grid controls the 260×180 media column. Compose with selected Garden and Andong photos only if the parent accepts documented uncertainties. | CSS owns pale background/dividers and responsive order. Retain the distinction between Seoul and regional coverage. Credit reference/archive imagery, not 2026 fieldwork. | `accepted` — implementation handoff, not rights clearance. |
| Utility rail | Existing weather/entry/saved links in a list; inline SVG or existing icon library for cloud/map/bookmark/arrow; CSS strokes and divider rules. | No image-generation output, screenshot icon strips or dead controls. Decorative icons `aria-hidden`; link text carries meaning; preserve save behavior. | `accepted` — handoff matches mock role. |
| Article image evidence | Reusable `<figure>` with natural dimensions, per-image `cover`/`contain` variant, concise source caption and link, plus optional archive/reference label in text. | Poster dates and artwork remain intrinsic image pixels; explain their role rather than recreating them as site UI. Keep source methods available without turning the article lead into an audit table. | `accepted` — parent must verify final semantics and layout. |

## execution_order

1. Parent chooses the selected Deoksugung image and verifies the stated crop at the actual desktop and narrow-screen hero sizes. A retina target is not met; no generated upscaling is proposed.
2. Parent decides whether to use the two source-backed secondary references in the local build with honest captions, while retaining their permission gaps for release review. Do not silently mark rights approved.
3. Apply per-role `contain` versus `cover` behavior to remaining event images; preserve closed-event state and poster dates. No production content/source data was changed by the asset pass.
4. In the parent's single batched visual QA, check guard feet/hats, the complete Andong performer, garden context, full poster titles/dates, and the portrait drone composition. Run normal build/image/link checks after integration.

## blockers

- No blocker to continued **local** implementation using source-backed references and transparent limitations.
- **Production release evidence remains incomplete:** Garden/Andong replacement permission and incumbent reuse permission are not documented by this audit. Ask the actual rights holder or obtain an explicitly reusable alternative; attribution alone does not close this gap.
- The 900px hero has only a 1000px source, not the ideal 1800px 2× source. Keep layout within this limit or source a larger expressly reusable photograph before treating retina quality as passed.

## assumptions

- The parent's message confirms A approval and authorizes the three new official-source files under `assets/editorial/`; this pass does not independently infer user approval from the still-pending prose in the earlier decision document.
- “Other six” means the remaining six of the nine `indexableEvents`, including three closed events; it is not authorization to feature closed events as current.
- Existing file/licence metadata was preserved. No statement about legal permission is inferred from a `score`, `official` directory name, government source, takedown policy or the passing thumbnail validator.
- The parent owns article copy, source-credit wording, actual final crop inspection, application implementation, user-facing rights decisions and any later authorized deployment.
