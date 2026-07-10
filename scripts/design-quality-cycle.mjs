import fs from "node:fs/promises";
import path from "node:path";
import { todayString } from "./lib/date.mjs";

const root = path.resolve(".");
const dist = path.join(root, "dist");
const feedDir = path.join(root, "data", "feeds");
const harnessDir = path.join(dist, "__design-harness");
const today = todayString();

const fallbackPageContracts = [
  { id: "home", page: "Home", path: "en/index.html", owner: "designer", contract: "Visitor understands the product immediately." },
  { id: "now", page: "Now", path: "en/now/index.html", owner: "designer", contract: "Urgency reads as status flags, not text headings." },
  { id: "calendar", page: "Calendar", path: "en/calendar/index.html", owner: "designer", contract: "Date navigation is calm, consistent, and utility-first." },
  { id: "planner", page: "Planner", path: "en/planner/index.html", owner: "designer", contract: "Saved-board tool feels distinct without becoming a homepage clone." },
  { id: "routes", page: "Routes", path: "en/routes/index.html", owner: "publisher", contract: "Route cards lead; ads stay peripheral." },
  { id: "city", page: "City", path: "en/cities/seoul/index.html", owner: "designer", contract: "City identity appears before generic event lists." },
  { id: "detail", page: "Detail", path: "en/events/red-velvet-day-in-red-velvet-seoul-2026.html", owner: "planner", contract: "Facts, weather, and source handoff beat explanatory prose." },
  { id: "about", page: "About", path: "en/about/index.html", owner: "designer", contract: "Service identity feels intentional and branded." }
];

async function readJson(relativePath, fallback) {
  try {
    const raw = await fs.readFile(path.join(root, relativePath), "utf8");
    return JSON.parse(raw.replace(/^\uFEFF/, ""));
  } catch {
    return fallback;
  }
}

const designSystem = await readJson("data/design-system.json", {});
const baselineReport = await readJson(`data/feeds/design-baselines-${today}.json`, null);
const domAuditReport = await readJson(`data/feeds/design-dom-audit-${today}.json`, null);
const heroTypes = Array.isArray(designSystem.heroTypes) ? designSystem.heroTypes : [];
const pageContracts = Array.isArray(designSystem.pages) && designSystem.pages.length
  ? designSystem.pages.map((page) => ({
      id: page.id,
      page: page.title || page.id,
      path: page.distPath || page.path?.replace(/^\//, "").replace(/\/$/, "/index.html"),
      owner: page.owner || "designer",
      contract: page.contract || "",
      heroType: page.heroType,
      requiredSelectors: Array.isArray(page.requiredSelectors) ? page.requiredSelectors : [],
      forbiddenVisibleText: Array.isArray(page.forbiddenVisibleText) ? page.forbiddenVisibleText : []
    }))
  : fallbackPageContracts;

const defaultGovernanceLoop = {
  purpose: "Turn design criticism into repeatable work: find defects, debate intent and feasibility, review before execution, implement, then evaluate again.",
  roles: [
    { id: "executive-lead", label: "책임총괄", scope: "Collects findings, ranks priority, decides block/schedule/approve, and keeps the loop moving." },
    { id: "designer", label: "디자이너", scope: "Owns visual intent, hierarchy, typography, interaction feel, and whether the page looks desirable to use." },
    { id: "developer", label: "개발자", scope: "Owns implementation, responsive behavior, accessibility targets, build health, and regression checks." },
    { id: "advisory-board", label: "자문단", scope: "Challenges visitor usefulness, monetization fit, copy clarity, and whether a feature belongs on the page." },
    { id: "audit-board", label: "감사", scope: "Finds visual defects, clipped text, overflow, awkward spacing, broken controls, and missing verification evidence." },
    { id: "user-panel", label: "유저평가단", scope: "Reads the result like a first-time visitor and reports whether the UI feels obvious, polished, and worth using." }
  ],
  stages: [
    "책임총괄이 발견된 문제와 해야 할 일을 한 줄 작업으로 정리한다.",
    "디자이너와 개발자가 의도, 구현 난이도, 위험, 대안을 서로 답한다.",
    "자문단과 감사가 실행 전에 고객 가치와 품질 리스크를 검토한다.",
    "개발자는 승인된 항목만 구현하고 빌드, 검증, 스크린샷을 남긴다.",
    "유저평가단은 결과 화면을 다시 보고 직관성, 매력, 완성도를 평가한다.",
    "책임총괄은 다음 반복에서 고칠 항목과 보류할 항목을 결정한다."
  ]
};

const governanceLoop = designSystem.governanceLoop?.roles?.length
  ? {
      purpose: designSystem.governanceLoop.purpose || defaultGovernanceLoop.purpose,
      roles: designSystem.governanceLoop.roles,
      stages: Array.isArray(designSystem.governanceLoop.stages) && designSystem.governanceLoop.stages.length
        ? designSystem.governanceLoop.stages
        : defaultGovernanceLoop.stages
    }
  : defaultGovernanceLoop;

const legacyRoleMap = {
  ceo: "executive-lead",
  planner: "advisory-board",
  publisher: "developer",
  "audit-institution": "audit-board"
};

const legacyRoleAliases = {
  "executive-lead": ["ceo"],
  developer: ["publisher"],
  "advisory-board": ["planner"],
  "audit-board": ["audit-institution"]
};

const findings = [];
const signoffs = [];

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function read(relativePath) {
  try {
    return await fs.readFile(path.join(root, relativePath), "utf8");
  } catch {
    return "";
  }
}

function htmlText(value) {
  return String(value || "")
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<style[\s\S]*?<\/style>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function addFinding({ severity = "P2", owner = "designer", page = "System", symptom, evidence, proposal, designerResponse, developerResponse, ceoReport }) {
  const id = `DQ-${today}-${String(findings.length + 1).padStart(2, "0")}`;
  findings.push({
    id,
    severity,
    owner,
    page,
    symptom,
    evidence,
    proposal,
    designerResponse: designerResponse || "Designer should review the harness frame, decide visual intent, and mark approve/rework.",
    developerResponse: developerResponse || "Developer should implement the approved change, rebuild, and rerun design:council.",
    ceoReport: ceoReport || "CEO should confirm whether this blocks push or enters the next design sprint.",
    status: "issued"
  });
}

function signoff(owner, area, detail) {
  signoffs.push({ owner, area, detail });
}

function assertIssue(condition, issue, pass) {
  if (condition) signoff(pass.owner, pass.area, pass.detail);
  else addFinding(issue);
}

function hasBlock(text, selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`${escaped}\\s*\\{[\\s\\S]*?\\}`).test(text);
}

function heroTypeById(id) {
  return heroTypes.find((type) => type.id === id);
}

function classSelectorPresent(html, selector) {
  const classes = selector.split(".").filter(Boolean);
  if (!classes.length) return false;
  return [...html.matchAll(/class="([^"]+)"/g)].some((match) => {
    const classList = match[1].split(/\s+/);
    return classes.every((className) => classList.includes(className));
  });
}

function selectorPresent(html, selector) {
  if (!selector) return true;
  if (selector.startsWith(".")) return classSelectorPresent(html, selector);
  if (selector.startsWith("#")) return html.includes(`id="${selector.slice(1)}"`);
  return html.includes(selector);
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function canonicalRoleId(owner) {
  return legacyRoleMap[owner] || owner;
}

function roleMeta(owner) {
  const canonicalId = canonicalRoleId(owner);
  return governanceLoop.roles.find((role) => role.id === canonicalId) || {
    id: canonicalId,
    label: canonicalId,
    scope: "Custom review owner."
  };
}

function roleLabel(owner) {
  return roleMeta(owner).label;
}

function roleOwnerIds(roleId) {
  return [roleId, ...(legacyRoleAliases[roleId] || [])];
}

async function collectChecks() {
  const styles = await read("styles.css");
  const appJs = await read("app.js");
  const packageJson = JSON.parse((await read("package.json")).replace(/^\uFEFF/, ""));
  const pages = Object.fromEntries(await Promise.all(pageContracts.map(async (page) => [page.id, await read(path.join("dist", page.path))])));

  for (const page of pageContracts) {
    assertIssue(
      Boolean(pages[page.id]),
      {
        severity: "P0",
        owner: "publisher",
        page: page.page,
        symptom: `${page.page} page is missing from dist.`,
        evidence: page.path,
        proposal: "Rebuild dist and block push until representative pages exist."
      },
      { owner: page.owner, area: `${page.page} contract`, detail: page.contract }
    );
  }

  assertIssue(
    heroTypes.length >= 6 && pageContracts.every((page) => page.heroType && heroTypeById(page.heroType)),
    {
      severity: "P1",
      owner: "designer",
      page: "Page system",
      symptom: "Representative pages do not have a complete named hero taxonomy.",
      evidence: "Expected product-entry, utility-page, workspace-tool, city-landing, detail-decision, and identity-page types in data/design-system.json.",
      proposal: "Keep page type intent in data/design-system.json so designer, developer, and QA review the same contract.",
      designerResponse: "Designer owns hero type names, page intent, title scale, and avoid-list.",
      developerResponse: "Developer keeps harness and council checks reading from the shared design-system file.",
      ceoReport: "CEO should block broad visual changes if they bypass the design-system contract."
    },
    { owner: "designer", area: "Hero taxonomy", detail: "Named page hero types are documented for every representative page." }
  );

  for (const page of pageContracts) {
    const type = heroTypeById(page.heroType);
    const requiredSelectors = unique([
      ...(Array.isArray(type?.requiredSelectors) ? type.requiredSelectors : []),
      ...(Array.isArray(page.requiredSelectors) ? page.requiredSelectors : [])
    ]);
    const missingSelectors = requiredSelectors.filter((selector) => !selectorPresent(pages[page.id], selector));

    assertIssue(
      missingSelectors.length === 0,
      {
        severity: "P1",
        owner: page.owner,
        page: page.page,
        symptom: `${page.page} no longer satisfies its ${type?.name || page.heroType || "page"} hero contract.`,
        evidence: `Missing selectors: ${missingSelectors.join(", ") || "none"}.`,
        proposal: "Restore the expected page-system hooks or update data/design-system.json only if the approved design direction changed.",
        designerResponse: "Designer checks whether the visual intent changed or the component was accidentally removed.",
        developerResponse: "Developer restores the missing markup/classes and rebuilds the harness.",
        ceoReport: "CEO treats missing representative page hooks as a pre-push design-system regression."
      },
      { owner: page.owner, area: `${page.page} hero type`, detail: `${type?.name || page.heroType} selectors are present.` }
    );

    const visibleText = htmlText(pages[page.id]);
    const forbiddenList = Array.isArray(page.forbiddenVisibleText) ? page.forbiddenVisibleText : [];
    const forbidden = forbiddenList.filter((phrase) => visibleText.includes(phrase));
    assertIssue(
      forbidden.length === 0,
      {
        severity: "P1",
        owner: page.owner,
        page: page.page,
        symptom: `${page.page} exposes internal or non-visitor language.`,
        evidence: `Visible phrases: ${forbidden.join(", ") || "none"}.`,
        proposal: "Move feed/developer wording out of public UI; keep it in files, metadata, or footer-level technical surfaces.",
        designerResponse: "Designer rewrites the visible label into visitor intent or removes it.",
        developerResponse: "Developer removes the phrase from generated visitor markup and reruns design:council.",
        ceoReport: "CEO should not approve visitor pages that read like an internal dashboard."
      },
      { owner: page.owner, area: `${page.page} language`, detail: "Forbidden internal wording is not visible." }
    );
  }

  assertIssue(
    styles.includes(".page-hero > .eyebrow") && styles.includes("color: var(--coral);"),
    {
      severity: "P1",
      owner: "designer",
      page: "Page system",
      symptom: "Top page eyebrow labels can drift between coral and muted gray.",
      evidence: "Expected `.page-hero > .eyebrow` and hero-specific eyebrow rules to enforce brand coral.",
      proposal: "Keep page-level eyebrows coral; reserve gray for form labels, card metadata, and weather metric labels.",
      designerResponse: "Designer defines which labels are page identity versus local metadata.",
      developerResponse: "Developer encodes those roles as separate selectors/tokens instead of ad hoc overrides."
    },
    { owner: "designer", area: "Brand token", detail: "Top page eyebrows are pinned to coral." }
  );

  assertIssue(
    pages.now.includes("now-status-flag") && styles.includes(".now-status-flag") && styles.includes("clip-path: polygon(0 0, calc(100% - 13px)"),
    {
      severity: "P1",
      owner: "designer",
      page: "Now",
      symptom: "Live/ending/new checks may read as PPT headings instead of status.",
      evidence: "Expected panel flag shape and per-card `now-status-flag` chips.",
      proposal: "Keep timing states as compact flags with color and dot cues.",
      designerResponse: "Designer reviews whether status colors are instantly legible.",
      developerResponse: "Developer preserves `now-status-flag` and panel flag styling in future Now-page changes."
    },
    { owner: "designer", area: "Status language", detail: "Now page uses panel flags and card timing chips." }
  );

  assertIssue(
    !htmlText(pages.now).includes("RSS feed") && !htmlText(pages.now).includes("JSON feed"),
    {
      severity: "P1",
      owner: "planner",
      page: "Now",
      symptom: "Visitor page exposes internal feed terminology.",
      evidence: "Visible text should not include RSS/JSON feed labels.",
      proposal: "Keep machine feeds available for crawlers but out of primary visitor UI."
    },
    { owner: "planner", area: "Visitor language", detail: "Now page avoids RSS/JSON visitor noise." }
  );

  const firstCalendarMonth = pages.calendar.match(/data-calendar-month="(\d{4}-\d{2})"/)?.[1] || "";
  assertIssue(
    Boolean(firstCalendarMonth) && firstCalendarMonth >= today.slice(0, 7),
    {
      severity: "P1",
      owner: "user-panel",
      page: "Calendar",
      symptom: "Calendar can open on an archive month instead of current planning context.",
      evidence: firstCalendarMonth ? `First visible month: ${firstCalendarMonth}; current month: ${today.slice(0, 7)}.` : "No data-calendar-month marker found.",
      proposal: "Group live events into the current month and keep archive months below current/upcoming planning months.",
      designerResponse: "디자이너는 첫 화면이 지금 방문자가 볼 달부터 시작하는지 확인한다.",
      developerResponse: "개발자는 calendarFocusDate 기준으로 live/upcoming/archive 정렬을 유지한다.",
      ceoReport: "책임총괄은 과거 월이 첫 화면을 차지하면 캘린더 목적이 깨진 것으로 본다."
    },
    { owner: "user-panel", area: "Calendar first month", detail: `Calendar opens on ${firstCalendarMonth}, not an archive month.` }
  );

  assertIssue(
    pages.routes.includes("routes-ad-rail") && pages.routes.includes("trip-rail-card") && pages.routes.includes("rel=\"sponsored nofollow noopener\"") && !pages.routes.includes("trip-square-ad") && !pages.routes.includes("TD17833727") && !pages.routes.includes("<iframe"),
    {
      severity: "P1",
      owner: "publisher",
      page: "Routes",
      symptom: "Ad placement can look broken when external creative fails to render.",
      evidence: "Expected a visible sponsored hotel rail card and no square or iframe ad shell.",
      proposal: "Keep monetization in a peripheral rail with a stable visual card; route cards remain the primary content."
    },
    { owner: "publisher", area: "Ad placement", detail: "Routes page uses a visible sponsored hotel rail card and no blank-prone iframe ad." }
  );

  assertIssue(
    styles.includes(".about-page h1") && styles.includes("text-wrap: nowrap;") && styles.includes("word-break: keep-all;"),
    {
      severity: "P1",
      owner: "designer",
      page: "About",
      symptom: "Brand title can split awkwardly across lines.",
      evidence: "Expected nowrap and keep-all protection for K-Spot Now.",
      proposal: "Treat K-Spot Now as a wordmark, not ordinary paragraph text."
    },
    { owner: "designer", area: "Brand identity", detail: "About page protects the K-Spot Now wordmark." }
  );

  assertIssue(
    styles.includes("overflow-x: hidden;") && styles.includes(".city-page > *") && styles.includes("min-width: 0;"),
    {
      severity: "P1",
      owner: "developer",
      page: "Mobile system",
      symptom: "Horizontal scrollers or media cards can create page-wide overflow.",
      evidence: "Expected global overflow guard and min-width rules for page children.",
      proposal: "Preserve internal horizontal scroll only inside intentional chip strips."
    },
    { owner: "developer", area: "Responsive guard", detail: "Mobile page-wide overflow has explicit guardrails." }
  );

  assertIssue(
    hasBlock(styles, ".planner-hero h1") && !/planner-hero h1\s*\{[\s\S]*?5\.\d+rem/.test(styles),
    {
      severity: "P2",
      owner: "designer",
      page: "Planner",
      symptom: "Planner can drift back into oversized landing-page hero scale.",
      evidence: "Planner h1 should stay below homepage-level hero sizing.",
      proposal: "Keep Planner as a task surface: compact title, useful preview, faster access to saved board."
    },
    { owner: "designer", area: "Hero taxonomy", detail: "Planner hero scale is bounded below homepage hero scale." }
  );

  assertIssue(
    pages.planner.includes("class=\"planner-preview\"") && pages.planner.includes("class=\"planner-utility\""),
    {
      severity: "P2",
      owner: "planner",
      page: "Planner",
      symptom: "Planner page can become a passive info page instead of a usable tool.",
      evidence: "Expected preview and utility cards before saved board.",
      proposal: "Keep planner actions and preview visible, then show saved/starter cards."
    },
    { owner: "planner", area: "Tool intent", detail: "Planner keeps preview and utility cards." }
  );

  assertIssue(
    packageJson.scripts?.["harness:design"] && packageJson.scripts?.["design:council"],
    {
      severity: "P1",
      owner: "developer",
      page: "Workflow",
      symptom: "Design harness exists but no role-based review loop can be run.",
      evidence: "Expected package scripts for harness and council cycle.",
      proposal: "Keep `harness:design` for visual comparison and `design:council` for issued reports."
    },
    { owner: "developer", area: "Workflow", detail: "Harness and design council scripts are available." }
  );

  const governanceRoleIds = new Set(governanceLoop.roles.map((role) => role.id));
  assertIssue(
    ["executive-lead", "designer", "developer", "advisory-board", "audit-board", "user-panel"].every((roleId) => governanceRoleIds.has(roleId))
      && governanceLoop.stages.length >= 6,
    {
      severity: "P1",
      owner: "executive-lead",
      page: "Workflow",
      symptom: "Role-based design loop is incomplete.",
      evidence: "Expected 책임총괄, 디자이너, 개발자, 자문단, 감사, 유저평가단 and a complete review loop.",
      proposal: "Keep governanceLoop in data/design-system.json so every design cycle has accountable roles before implementation.",
      designerResponse: "디자이너는 의도와 화면 품질 기준을 역할 루프 안에서 답한다.",
      developerResponse: "개발자는 승인된 항목만 구현하고 검증 결과를 남긴다.",
      ceoReport: "책임총괄은 미완성 루프를 배포 전 프로세스 결함으로 본다."
    },
    { owner: "executive-lead", area: "Governance loop", detail: "책임총괄, 디자이너, 개발자, 자문단, 감사, 유저평가단이 정의되어 있다." }
  );

  assertIssue(
    pages.home.includes("class=\"spotlight-dot\"")
      && !pages.home.includes("data-spotlight-count")
      && !pages.home.includes("data-spotlight-title-label")
      && !pages.home.includes("spotlight-content")
      && styles.includes(".spotlight-dot::before")
      && appJs.includes("showSlide(deltaX < 0 ? currentIndex + 1 : currentIndex - 1)")
      && appJs.includes("pointerdown")
      && appJs.includes("touchstart"),
    {
      severity: "P1",
      owner: "user-panel",
      page: "Home",
      symptom: "First-screen carousel can read like a numbered internal sequence instead of a swipeable visitor UI.",
      evidence: "Expected compact dot controls, no repeated title/count/overlay text, and touch/mouse swipe handlers.",
      proposal: "Keep the home spotlight as image-led cards with dot-only navigation and swipe movement.",
      designerResponse: "디자이너는 첫 화면에서 숫자 설명보다 카드 자체와 점 위치가 자연스럽게 읽히는지 본다.",
      developerResponse: "개발자는 dot click, touch swipe, mouse drag가 모두 같은 상태 업데이트를 쓰게 유지한다.",
      ceoReport: "책임총괄은 숫자/제목 반복이 돌아오면 첫 화면 품질 결함으로 다시 발행한다."
    },
    { owner: "user-panel", area: "First screen scan", detail: "Home spotlight is dot-only, uncluttered, and swipeable." }
  );

  assertIssue(
    pages.home.includes("data-gallery-limit=\"8\"")
      && pages.home.includes("data-gallery-mobile-limit=\"6\"")
      && appJs.includes("gallery-load-more")
      && appJs.includes("is-gallery-limited"),
    {
      severity: "P1",
      owner: "advisory-board",
      page: "Home",
      symptom: "Homepage can dump too many event cards before the visitor asks for more.",
      evidence: "Expected desktop limit 8, mobile limit 6, and an explicit more button.",
      proposal: "Start with a curated scan set; let search, filters, or Show more reveal the full list.",
      designerResponse: "디자이너는 첫 화면 아래 카드가 정보 과부하가 아니라 탐색 입구처럼 보이는지 본다.",
      developerResponse: "개발자는 검색/필터 중에는 제한을 풀고, 기본 상태에서만 progressive disclosure를 적용한다.",
      ceoReport: "책임총괄은 홈 카드 덤프를 고객 집중도 하락 리스크로 본다."
    },
    { owner: "advisory-board", area: "Home content density", detail: "Home event gallery starts short and expands only when requested." }
  );

  assertIssue(
    pages.home.includes("fonts.googleapis.com/css2?family=Geist")
      && styles.includes("font-family: Geist, Inter, \"Pretendard Variable\", Pretendard"),
    {
      severity: "P2",
      owner: "designer",
      page: "Typography",
      symptom: "Typography can drift back to a generic system-only stack.",
      evidence: "Expected Geist with Inter and Pretendard fallbacks.",
      proposal: "Keep the site on a current service UI font direction, with multilingual fallbacks for Korean and translated pages.",
      designerResponse: "디자이너는 큰 제목과 버튼에서 글꼴이 서비스답게 보이는지 확인한다.",
      developerResponse: "개발자는 font preload/link and fallback stack을 함께 유지한다.",
      ceoReport: "책임총괄은 글꼴 변경을 전체 인상에 직접 영향을 주는 디자인 결정으로 본다."
    },
    { owner: "designer", area: "Typography direction", detail: "Geist is loaded with Inter and Pretendard fallbacks." }
  );
}

function addStandingIdeas() {
  if (heroTypes.length >= 6 && pageContracts.every((page) => page.heroType && heroTypeById(page.heroType))) {
    signoff("designer", "Page-system spec", "Hero types are explicit in data/design-system.json and validated by the council.");
  } else {
    addFinding({
      severity: "P3",
      owner: "designer",
      page: "Page system",
      symptom: "Page hero types are still implicit.",
      evidence: "Home, city, planner, about, and compact pages now have different patterns, but the taxonomy is not documented as components.",
      proposal: "Designer should define named hero types: Product Entry, Utility Page, City Landing, Identity Page, Detail Decision.",
      designerResponse: "Turn the current examples into a small page-system spec.",
      developerResponse: "Developer can encode hero type classes and validate them per route.",
      ceoReport: "CEO decides whether this becomes a P2 design-system cleanup before push."
    });
  }

  const expectedBaselines = pageContracts.length * 2;
  const capturedBaselines = Number(baselineReport?.summary?.captured || 0);
  if (baselineReport?.status === "captured" && capturedBaselines >= expectedBaselines) {
    signoff("audit-institution", "Screenshot baselines", `Captured ${capturedBaselines}/${expectedBaselines} desktop/mobile baselines for representative pages.`);
  } else {
    addFinding({
      severity: "P3",
      owner: "audit-institution",
      page: "Harness",
      symptom: "Visual review is local and manual.",
      evidence: baselineReport
        ? `Latest baseline status: ${baselineReport.status}; captured ${capturedBaselines}/${expectedBaselines}.`
        : "No design-baselines report exists for today.",
      proposal: "Run `npm run design:baselines` so desktop and mobile screenshots are saved for representative pages.",
      designerResponse: "Designer reviews the baseline gallery and marks visual regressions.",
      developerResponse: "Developer captures updated baselines after approved changes and reruns design:council.",
      ceoReport: "CEO treats this as a future automation upgrade unless a visual regression is found."
    });
  }

  if (domAuditReport?.status === "passed") {
    signoff("audit-institution", "DOM visual audit", `Checked ${domAuditReport.summary?.checked || 0} representative desktop/mobile views for overflow, clipped text, and undersized controls.`);
  } else if (domAuditReport?.status === "issued" && Array.isArray(domAuditReport.findings)) {
    for (const finding of domAuditReport.findings.slice(0, 12)) {
      addFinding({
        severity: finding.severity || "P2",
        owner: "audit-institution",
        page: finding.page || "DOM audit",
        symptom: finding.symptom || "DOM visual audit issued a finding.",
        evidence: finding.evidence || "See data/feeds/design-dom-audit report.",
        proposal: finding.proposal || "Designer and developer should inspect the DOM audit report, patch the layout, and rerun design:dom-audit.",
        designerResponse: "Designer decides whether the issue is an intentional compact pattern or a visual defect.",
        developerResponse: "Developer patches layout constraints, wrapping, or touch target rules, then reruns design:dom-audit.",
        ceoReport: "CEO reviews DOM audit findings before any push that affects public page layout."
      });
    }
  } else {
    addFinding({
      severity: "P3",
      owner: "audit-institution",
      page: "Harness",
      symptom: "DOM visual audit has not been run for today.",
      evidence: domAuditReport
        ? `Latest DOM audit status: ${domAuditReport.status}.`
        : "No design-dom-audit report exists for today.",
      proposal: "Run `npm run design:dom-audit` or `npm run design:baselines` to issue layout-overflow and clipped-text checks.",
      designerResponse: "Designer uses the DOM audit report to find problems that are hard to spot in static diffs.",
      developerResponse: "Developer keeps the audit linked in the local harness and resolves reported defects.",
      ceoReport: "CEO treats missing DOM audit as a process gap, not a visual pass."
    });
  }
}

function priorityValue(severity) {
  return { P0: 0, P1: 1, P2: 2, P3: 3 }[severity] ?? 9;
}

function roleSummary() {
  return governanceLoop.roles.map((role) => {
    const ownerIds = roleOwnerIds(role.id);
    return {
      role: role.id,
      label: role.label,
      scope: role.scope,
      issued: findings.filter((item) => ownerIds.includes(item.owner)).length,
      signoffs: signoffs.filter((item) => ownerIds.includes(item.owner)).length
    };
  });
}

function decision() {
  if (findings.some((item) => item.severity === "P0")) return "BLOCK_PUSH";
  if (findings.some((item) => item.severity === "P1")) return "REVIEW_BEFORE_PUSH";
  return "DESIGN_COUNCIL_READY";
}

function reportJson() {
  const sortedFindings = [...findings].sort((a, b) => priorityValue(a.severity) - priorityValue(b.severity));
  return {
    date: today,
    decision: decision(),
    summary: {
      issued: sortedFindings.length,
      blocking: sortedFindings.filter((item) => item.severity === "P0").length,
      high: sortedFindings.filter((item) => item.severity === "P1").length,
      proposals: sortedFindings.filter((item) => item.severity === "P3").length,
      signoffs: signoffs.length
    },
    roles: roleSummary(),
    findings: sortedFindings,
    signoffs,
    governance: governanceLoop,
    meeting: governanceLoop.stages
  };
}

function md(report) {
  return `# Design Quality Council - ${report.date}

Decision: **${report.decision}**

## 책임총괄 브리프

- Issued findings: ${report.summary.issued}
- Blocking: ${report.summary.blocking}
- High priority: ${report.summary.high}
- Standing proposals: ${report.summary.proposals}
- Passed signoffs: ${report.summary.signoffs}

## Governance Loop

${report.governance.purpose}

${report.meeting.map((item, index) => `${index + 1}. ${item}`).join("\n")}

## Issued Findings

| ID | Priority | Owner | Page | Symptom | Proposal |
| --- | --- | --- | --- | --- | --- |
${report.findings.map((item) => `| ${item.id} | ${item.severity} | ${roleLabel(item.owner)} | ${item.page} | ${item.symptom} | ${item.proposal} |`).join("\n") || "| - | - | - | - | No findings issued. | - |"}

## Role Reports

| Role | Scope | Issued | Signoffs |
| --- | --- | ---: | ---: |
${report.roles.map((role) => `| ${role.label} | ${role.scope} | ${role.issued} | ${role.signoffs} |`).join("\n")}

## Pre-Execution Review

- 자문단 checks whether the proposed change helps visitors and belongs on the public page.
- 감사 checks spacing, clipping, overflow, button quality, evidence, and regression risk before implementation.
- 책임총괄 blocks execution when the issue is unclear, unverified, or likely to create a worse visitor flow.

## Designer / Developer Debate

- 디자이너 must answer each issued finding with intent, visual direction, hierarchy, and polish criteria.
- 개발자 must answer each accepted finding with implementation path, responsive risk, and verification commands.
- 감사 reruns \`npm run design:council\`, \`npm run design:dom-audit\`, or \`npm run design:baselines\` after changes.
- 책임총괄 reviews this report before push.

## User Evaluation Loop

- 유저평가단 reads the result as a first-time visitor: obvious purpose, low text burden, polished UI, and useful action.
- If the result still feels awkward, the finding stays open for the next cycle instead of being hidden as a developer note.

## Signoffs

${report.signoffs.map((item) => `- ${roleLabel(item.owner)} / ${item.area}: ${item.detail}`).join("\n") || "- No signoffs recorded."}
`;
}

function councilHtml(report) {
  const roleCards = report.roles.map((role) => `
      <article class="role-card">
        <span>${esc(role.label)}</span>
        <strong>${role.issued} issued / ${role.signoffs} signoffs</strong>
        <p>${esc(role.scope)}</p>
      </article>`).join("");

  const rows = report.findings.map((item) => `
      <article class="finding ${item.severity.toLowerCase()}">
        <div>
          <span>${esc(item.severity)} / ${esc(roleLabel(item.owner))}</span>
          <h2>${esc(item.id)} ${esc(item.page)}</h2>
        </div>
        <p><strong>Symptom</strong>${esc(item.symptom)}</p>
        <p><strong>Evidence</strong>${esc(item.evidence)}</p>
        <p><strong>Proposal</strong>${esc(item.proposal)}</p>
        <p><strong>디자이너</strong>${esc(item.designerResponse)}</p>
        <p><strong>개발자</strong>${esc(item.developerResponse)}</p>
        <p><strong>책임총괄</strong>${esc(item.ceoReport)}</p>
      </article>`).join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>K-Spot Now Design Council</title>
  <style>
    :root { --ink:#1d1d1f; --muted:#5f6b7a; --line:#d8dee8; --paper:#f7f8fb; --white:#fff; --coral:#e85d3f; --blue:#246beb; }
    * { box-sizing:border-box; }
    body { margin:0; color:var(--ink); background:var(--paper); font-family:Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height:1.5; }
    a { color:inherit; text-decoration:none; }
    .shell { width:min(1220px, calc(100% - 32px)); margin:0 auto; padding:34px 0 64px; }
    .eyebrow { margin:0 0 10px; color:var(--coral); font-size:.78rem; font-weight:850; text-transform:uppercase; }
    h1 { max-width:14ch; margin:0; font-size:clamp(2.5rem, 6vw, 4.6rem); line-height:1.02; }
    .hero { display:grid; grid-template-columns:minmax(0, 1fr) auto; gap:18px; align-items:end; margin-bottom:18px; }
    .hero p { max-width:760px; margin:12px 0 0; color:var(--muted); font-weight:650; }
    .nav { display:flex; gap:8px; flex-wrap:wrap; }
    .nav a { min-height:40px; display:inline-flex; align-items:center; border:1px solid #cbd9ec; border-radius:999px; padding:7px 12px; background:var(--white); color:#063a74; font-weight:850; }
    .metrics { display:grid; grid-template-columns:repeat(5, minmax(0, 1fr)); gap:8px; margin:18px 0; }
    .metric { border:1px solid var(--line); border-radius:8px; padding:12px; background:var(--white); }
    .metric strong { display:block; font-size:1.8rem; line-height:1; }
    .metric span { color:var(--muted); font-size:.78rem; font-weight:780; }
    .roles { display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:8px; margin:0 0 18px; }
    .role-card { display:grid; gap:6px; border:1px solid var(--line); border-radius:8px; padding:13px; background:var(--white); }
    .role-card span { color:var(--coral); font-size:.76rem; font-weight:850; }
    .role-card strong { font-size:1rem; }
    .role-card p { margin:0; color:var(--muted); font-size:.86rem; font-weight:650; }
    .loop { display:grid; gap:8px; margin:0 0 18px; border:1px solid var(--line); border-radius:8px; padding:14px; background:var(--white); }
    .loop h2 { margin:0; font-size:1.2rem; }
    .loop ol { margin:0; padding-left:22px; color:#344054; font-weight:650; }
    .findings { display:grid; gap:12px; }
    .finding { display:grid; gap:8px; border:1px solid var(--line); border-left:5px solid #cbd9ec; border-radius:8px; padding:14px; background:var(--white); }
    .finding.p0, .finding.p1 { border-left-color:var(--coral); }
    .finding.p2 { border-left-color:var(--blue); }
    .finding.p3 { border-left-color:#008a70; }
    .finding span { color:var(--coral); font-size:.72rem; font-weight:850; text-transform:uppercase; }
    .finding h2 { margin:2px 0 0; font-size:1.25rem; }
    .finding p { margin:0; color:#344054; font-weight:650; }
    .finding strong { display:block; color:#063a74; font-size:.72rem; text-transform:uppercase; }
    @media (max-width:800px) { .hero, .metrics, .roles { grid-template-columns:1fr; } }
  </style>
</head>
<body>
  <main class="shell">
    <section class="hero">
      <div>
        <p class="eyebrow">Design Quality Council</p>
        <h1>Issued review loop</h1>
        <p>책임총괄이 이슈를 정리하고, 디자이너와 개발자가 답하고, 자문단과 감사가 실행 전 검토한 뒤 유저평가단이 결과를 다시 본다.</p>
      </div>
      <nav class="nav">
        <a href="/__design-harness/">Harness</a>
        <a href="/en/" target="_blank" rel="noopener">Open site</a>
      </nav>
    </section>
    <section class="metrics">
      <div class="metric"><strong>${report.summary.issued}</strong><span>Issued</span></div>
      <div class="metric"><strong>${report.summary.blocking}</strong><span>Blocking</span></div>
      <div class="metric"><strong>${report.summary.high}</strong><span>High</span></div>
      <div class="metric"><strong>${report.summary.proposals}</strong><span>Proposals</span></div>
      <div class="metric"><strong>${report.summary.signoffs}</strong><span>Signoffs</span></div>
    </section>
    <section class="roles">
      ${roleCards}
    </section>
    <section class="loop">
      <h2>${esc(report.decision)}</h2>
      <ol>${report.meeting.map((item) => `<li>${esc(item)}</li>`).join("")}</ol>
    </section>
    <section class="findings">
      ${rows || "<p>No findings issued.</p>"}
    </section>
  </main>
</body>
</html>`;
}

async function main() {
  try {
    await fs.access(dist);
  } catch {
    throw new Error("dist/ is missing. Run npm run build before design:council.");
  }
  await collectChecks();
  addStandingIdeas();

  const report = reportJson();
  await fs.mkdir(feedDir, { recursive: true });
  await fs.mkdir(harnessDir, { recursive: true });
  const jsonOut = path.join(feedDir, `design-quality-cycle-${today}.json`);
  const mdOut = path.join(feedDir, `design-quality-cycle-${today}.md`);
  await fs.writeFile(jsonOut, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await fs.writeFile(mdOut, md(report), "utf8");
  await fs.writeFile(path.join(harnessDir, "council.html"), councilHtml(report), "utf8");

  console.log(`Saved design quality cycle: ${mdOut}`);
  console.log(`Saved design council harness page: ${path.join(harnessDir, "council.html")}`);
  if (report.summary.blocking > 0) process.exit(1);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
