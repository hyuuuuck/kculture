import fs from "node:fs/promises";
import path from "node:path";

const root = path.resolve(".");
const dist = path.join(root, "dist");
const outDir = path.join(dist, "__design-harness");

const fallbackSystem = {
  name: "K-Spot Now Page Design System",
  mission: "Compare page roles, hero scale, status flags, ads, buttons, and mobile framing before pushing design changes.",
  tokens: [
    { name: "Brand coral", value: "rgb(232, 93, 63)", note: "Top page eyebrows and key brand accent." },
    { name: "Action blue", value: "rgb(36, 107, 235)", note: "Primary CTAs and map/source actions." },
    { name: "Ink", value: "rgb(29, 29, 31)", note: "Main headings and primary text." },
    { name: "Muted", value: "rgb(95, 107, 122)", note: "Secondary text, not page eyebrows." },
    { name: "Radius", value: "8px or less", note: "Cards, panels, tool surfaces." },
    { name: "Touch target", value: "44px minimum", note: "Buttons, tabs, save controls." }
  ],
  reviewRules: [
    "Page eyebrows use coral",
    "Status is shown as flags",
    "Cards do not nest",
    "Buttons keep 44px touch target",
    "Ads stay peripheral",
    "Mobile has no page-wide overflow"
  ],
  governanceLoop: {
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
      "책임총괄이 문제와 해야 할 일을 정리한다.",
      "디자이너와 개발자가 의도, 구현 난이도, 위험, 대안을 답한다.",
      "자문단과 감사가 실행 전 고객 가치와 품질 리스크를 본다.",
      "개발자는 승인된 항목만 구현하고 검증한다.",
      "유저평가단은 결과 화면을 다시 평가한다.",
      "책임총괄은 다음 반복을 결정한다."
    ]
  },
  heroTypes: [],
  pages: [
    {
      group: "Core",
      title: "Home",
      path: "/en/",
      heroType: "product-entry",
      contract: "Product entry. Must feel useful immediately, not explanatory.",
      watch: "Hero scale, gallery scan, city/category entry points."
    },
    {
      group: "Core",
      title: "Now",
      path: "/en/now/",
      heroType: "utility-page",
      contract: "Status board. Flags and urgency must read faster than prose.",
      watch: "Live/ending flags, card rhythm, no internal feed jargon."
    },
    {
      group: "Core",
      title: "Calendar",
      path: "/en/calendar/",
      heroType: "utility-page",
      contract: "Date navigation. Utility first, calm hierarchy.",
      watch: "Eyebrow color, filters, month heading scale."
    },
    {
      group: "Core",
      title: "Planner",
      path: "/en/planner/",
      heroType: "workspace-tool",
      contract: "Saved-board tool. Distinct, but not a homepage hero clone.",
      watch: "Hero size, preview panel, button quality, empty state."
    },
    {
      group: "Discovery",
      title: "Routes",
      path: "/en/routes/",
      heroType: "utility-page",
      contract: "Trip route index. Route cards should lead, ads stay peripheral.",
      watch: "Left ad rail, route card density, no square ad block."
    },
    {
      group: "Discovery",
      title: "Seoul City",
      path: "/en/cities/seoul/",
      heroType: "city-landing",
      contract: "City landing. City identity and representative event first.",
      watch: "City title scale, image crop, horizontal city chips."
    },
    {
      group: "Detail",
      title: "Event Detail",
      path: "/en/events/red-velvet-day-in-red-velvet-seoul-2026",
      heroType: "detail-decision",
      contract: "Visit decision page. Useful facts beat long explanations.",
      watch: "Fact cards, source handoff, weather module, ad placement."
    },
    {
      group: "Trust",
      title: "About",
      path: "/en/about/",
      heroType: "identity-page",
      contract: "Service identity. Brand should feel intentional, not text-only.",
      watch: "Logo lockup, K-Spot Now nowrap, principle cards."
    }
  ]
};

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function readJson(relativePath, fallback) {
  try {
    const raw = await fs.readFile(path.join(root, relativePath), "utf8");
    return JSON.parse(raw.replace(/^\uFEFF/, ""));
  } catch {
    return fallback;
  }
}

function normalizeToken(token) {
  if (Array.isArray(token)) {
    const [name, value, note] = token;
    return { name, value, note };
  }
  return {
    name: token?.name || "Token",
    value: token?.value || "",
    note: token?.note || ""
  };
}

function normalizeSystem(input) {
  const source = input && typeof input === "object" ? input : {};
  return {
    name: source.name || fallbackSystem.name,
    mission: source.mission || fallbackSystem.mission,
    tokens: Array.isArray(source.tokens) && source.tokens.length ? source.tokens.map(normalizeToken) : fallbackSystem.tokens,
    reviewRules: Array.isArray(source.reviewRules) && source.reviewRules.length ? source.reviewRules : fallbackSystem.reviewRules,
    governanceLoop: source.governanceLoop?.roles?.length ? source.governanceLoop : fallbackSystem.governanceLoop,
    heroTypes: Array.isArray(source.heroTypes) ? source.heroTypes : [],
    pages: Array.isArray(source.pages) && source.pages.length ? source.pages : fallbackSystem.pages
  };
}

function heroTypeMap(system) {
  return new Map(system.heroTypes.map((type) => [type.id, type]));
}

function frame(page, mode) {
  const isMobile = mode === "mobile";
  const width = isMobile ? 390 : 1280;
  const height = isMobile ? 844 : 720;
  return `
        <article class="frame-card ${mode}">
          <div class="frame-head">
            <span>${isMobile ? "Mobile 390" : "Desktop 1280"}</span>
            <a href="${esc(page.path)}" target="_blank" rel="noopener">Open</a>
          </div>
          <div class="frame-viewport" style="--frame-width:${width}; --frame-height:${height};">
            <iframe src="${esc(page.path)}" title="${esc(page.title)} ${mode}" loading="lazy"></iframe>
          </div>
        </article>`;
}

function pageCard(page, system) {
  const type = heroTypeMap(system).get(page.heroType);
  const heroTypeLabel = type ? type.name : "Unassigned";
  const heroTypePurpose = type ? type.purpose : "No hero type definition was found.";
  return `
      <section class="page-card" data-group="${esc(page.group)}" data-hero-type="${esc(page.heroType)}">
        <header class="page-card-head">
          <div>
            <span>${esc(page.group)} / ${esc(heroTypeLabel)}</span>
            <h2>${esc(page.title)}</h2>
          </div>
          <a href="${esc(page.path)}" target="_blank" rel="noopener">${esc(page.path)}</a>
        </header>
        <div class="contract-grid">
          <p><strong>Contract</strong>${esc(page.contract)}</p>
          <p><strong>Watch</strong>${esc(page.watch)}</p>
          <p><strong>Hero Type</strong>${esc(heroTypePurpose)}</p>
        </div>
        <div class="frame-grid">
          ${frame(page, "desktop")}
          ${frame(page, "mobile")}
        </div>
      </section>`;
}

function heroTypeCard(type) {
  const examples = Array.isArray(type.examples) ? type.examples.join(", ") : "";
  const avoid = Array.isArray(type.avoid) ? type.avoid.slice(0, 2).join(" / ") : "";
  return `
      <article class="hero-type-card">
        <span>${esc(type.titleScale || "type")}</span>
        <h3>${esc(type.name)}</h3>
        <code>${esc(type.className || type.id)}</code>
        <p>${esc(type.purpose)}</p>
        <em>${esc(examples)}</em>
        ${avoid ? `<small>Avoid: ${esc(avoid)}</small>` : ""}
      </article>`;
}

function governanceRoleCard(role) {
  return `
      <article class="governance-role">
        <span>${esc(role.label || role.id)}</span>
        <p>${esc(role.scope)}</p>
      </article>`;
}

function html(system) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>K-Spot Now Design Harness</title>
  <style>
    :root {
      --ink: #1d1d1f;
      --muted: #5f6b7a;
      --line: #d8dee8;
      --paper: #f7f8fb;
      --white: #ffffff;
      --coral: #e85d3f;
      --blue: #246beb;
      --green: #008a70;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      color: var(--ink);
      background: var(--paper);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      line-height: 1.5;
    }
    a { color: inherit; text-decoration: none; }
    code {
      border: 1px solid #dbe5f2;
      border-radius: 6px;
      padding: 2px 6px;
      color: #063a74;
      background: #f6f9fd;
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: 0.78rem;
      font-weight: 760;
    }
    .shell {
      width: min(1480px, calc(100% - 32px));
      margin: 0 auto;
      padding: 32px 0 64px;
    }
    .harness-hero {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 20px;
      align-items: end;
      margin-bottom: 20px;
    }
    .eyebrow {
      margin: 0 0 10px;
      color: var(--coral);
      font-size: 0.78rem;
      font-weight: 850;
      text-transform: uppercase;
    }
    h1 {
      max-width: 14ch;
      margin: 0;
      font-size: clamp(2.5rem, 6vw, 5rem);
      line-height: 1.02;
    }
    .harness-hero p {
      max-width: 760px;
      margin: 12px 0 0;
      color: var(--muted);
      font-size: 1.05rem;
      font-weight: 650;
    }
    .open-site {
      min-height: 44px;
      display: inline-flex;
      align-items: center;
      border: 1px solid #cbd9ec;
      border-radius: 999px;
      padding: 8px 14px;
      color: #063a74;
      background: var(--white);
      font-weight: 850;
    }
    .hero-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      justify-content: end;
    }
    .open-site.primary {
      border-color: var(--blue);
      color: var(--white);
      background: var(--blue);
    }
    .council-panel {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 14px;
      align-items: center;
      margin: 0 0 18px;
      border: 1px solid #cbd9ec;
      border-radius: 8px;
      padding: 14px;
      background: #ffffff;
    }
    .council-panel span,
    .section-label {
      color: var(--coral);
      font-size: 0.72rem;
      font-weight: 850;
      text-transform: uppercase;
    }
    .council-panel strong {
      display: block;
      margin-top: 2px;
      font-size: 1.05rem;
    }
    .council-panel p {
      margin: 4px 0 0;
      color: var(--muted);
      font-size: 0.88rem;
      font-weight: 650;
    }
    .governance-board {
      display: grid;
      grid-template-columns: minmax(0, 0.86fr) minmax(0, 1.14fr);
      gap: 10px;
      margin: 0 0 18px;
    }
    .governance-card {
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 14px;
      background: var(--white);
    }
    .governance-card h2 {
      margin: 3px 0 8px;
      font-size: 1.22rem;
      line-height: 1.12;
    }
    .governance-card p {
      margin: 0;
      color: var(--muted);
      font-weight: 650;
    }
    .governance-steps {
      margin: 10px 0 0;
      padding-left: 22px;
      color: #344054;
      font-weight: 700;
    }
    .governance-roles {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 8px;
    }
    .governance-role {
      min-height: 96px;
      display: grid;
      align-content: start;
      gap: 6px;
      border: 1px solid #cbd9ec;
      border-radius: 8px;
      padding: 11px;
      background: #fbfdff;
    }
    .governance-role span {
      color: var(--coral);
      font-size: 0.78rem;
      font-weight: 900;
    }
    .governance-role p {
      margin: 0;
      color: #344054;
      font-size: 0.78rem;
      font-weight: 650;
      line-height: 1.35;
    }
    .token-board {
      display: grid;
      grid-template-columns: repeat(6, minmax(0, 1fr));
      gap: 8px;
      margin: 18px 0 22px;
    }
    .token {
      min-height: 96px;
      display: grid;
      align-content: start;
      gap: 5px;
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 12px;
      background: var(--white);
    }
    .token strong { font-size: 0.92rem; }
    .token span {
      color: var(--muted);
      font-size: 0.78rem;
      font-weight: 760;
    }
    .token em {
      color: #344054;
      font-style: normal;
      font-size: 0.75rem;
    }
    .rule-strip {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin: 0 0 22px;
    }
    .rule-strip span {
      min-height: 34px;
      display: inline-flex;
      align-items: center;
      border: 1px solid #cbd9ec;
      border-radius: 999px;
      padding: 7px 11px;
      color: #17375f;
      background: var(--white);
      font-size: 0.82rem;
      font-weight: 850;
    }
    .hero-type-section {
      margin: 0 0 22px;
    }
    .hero-type-section h2 {
      margin: 4px 0 10px;
      font-size: clamp(1.35rem, 2.4vw, 2.2rem);
      line-height: 1.12;
    }
    .hero-type-board {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 10px;
    }
    .hero-type-card {
      display: grid;
      gap: 8px;
      min-height: 220px;
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 14px;
      background: var(--white);
    }
    .hero-type-card span {
      color: var(--coral);
      font-size: 0.72rem;
      font-weight: 850;
      text-transform: uppercase;
    }
    .hero-type-card h3 {
      margin: 0;
      font-size: 1.18rem;
      line-height: 1.15;
    }
    .hero-type-card p {
      margin: 0;
      color: #344054;
      font-size: 0.86rem;
      font-weight: 650;
    }
    .hero-type-card em,
    .hero-type-card small {
      color: var(--muted);
      font-style: normal;
      font-size: 0.76rem;
      font-weight: 760;
    }
    .page-list {
      display: grid;
      gap: 18px;
    }
    .page-card {
      display: grid;
      gap: 14px;
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 16px;
      background: var(--white);
    }
    .page-card-head {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 12px;
      align-items: end;
    }
    .page-card-head span {
      color: var(--coral);
      font-size: 0.72rem;
      font-weight: 850;
      text-transform: uppercase;
    }
    .page-card-head h2 {
      margin: 2px 0 0;
      font-size: clamp(1.4rem, 2.4vw, 2.35rem);
      line-height: 1.1;
    }
    .page-card-head a {
      color: var(--muted);
      font-size: 0.82rem;
      font-weight: 780;
    }
    .contract-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 8px;
    }
    .contract-grid p {
      margin: 0;
      border: 1px solid #e5ebf3;
      border-radius: 8px;
      padding: 10px;
      color: #344054;
      background: #fbfcff;
      font-size: 0.88rem;
      font-weight: 650;
    }
    .contract-grid strong {
      display: block;
      margin-bottom: 3px;
      color: #063a74;
      font-size: 0.72rem;
      text-transform: uppercase;
    }
    .frame-grid {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 300px;
      gap: 12px;
      align-items: start;
    }
    .frame-card {
      overflow: hidden;
      border: 1px solid #dbe5f2;
      border-radius: 8px;
      background: #eef3f8;
    }
    .frame-head {
      min-height: 36px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 8px 10px;
      border-bottom: 1px solid #dbe5f2;
      background: #ffffff;
      font-size: 0.78rem;
      font-weight: 850;
    }
    .frame-head span { color: #063a74; }
    .frame-head a { color: var(--muted); }
    .frame-viewport {
      --scale: min(1, calc(100vw / var(--frame-width)));
      width: 100%;
      height: 520px;
      overflow: hidden;
      background: #f7f8fb;
    }
    .frame-card.mobile .frame-viewport {
      height: 520px;
    }
    iframe {
      width: calc(var(--frame-width) * 1px);
      height: calc(var(--frame-height) * 1px);
      border: 0;
      transform-origin: 0 0;
      background: #ffffff;
    }
    .mobile iframe {
      transform: scale(0.72);
    }
    .desktop iframe {
      transform: scale(0.8);
    }
    @media (max-width: 980px) {
      .harness-hero,
      .page-card-head,
      .contract-grid,
      .frame-grid,
      .governance-board,
      .council-panel {
        grid-template-columns: 1fr;
      }
      .hero-actions {
        justify-content: start;
      }
      .token-board,
      .governance-roles,
      .hero-type-board {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .frame-card.mobile {
        width: min(100%, 320px);
      }
    }
    @media (max-width: 640px) {
      .token-board,
      .governance-roles,
      .hero-type-board {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <main class="shell">
    <section class="harness-hero">
      <div>
        <p class="eyebrow">Design QA Harness</p>
        <h1>K-Spot Now page system</h1>
        <p>${esc(system.mission)}</p>
      </div>
      <div class="hero-actions">
        <a class="open-site primary" href="/__design-harness/council.html">Open council report</a>
        <a class="open-site" href="/__design-harness/dom-audit.html">Open DOM audit</a>
        <a class="open-site" href="/__design-harness/baselines.html">Open baselines</a>
        <a class="open-site" href="/en/" target="_blank" rel="noopener">Open site</a>
      </div>
    </section>
    <section class="council-panel">
      <div>
        <span>Review loop</span>
        <strong>책임총괄이 이슈를 정리하고, 디자이너/개발자/자문단/감사/유저평가단이 반복 검수한다.</strong>
        <p>Run <code>npm run design:council</code> to publish the latest local report into this harness.</p>
      </div>
      <div class="hero-actions">
        <a class="open-site" href="/__design-harness/council.html">Council</a>
        <a class="open-site" href="/__design-harness/dom-audit.html">DOM audit</a>
      </div>
    </section>
    <section class="governance-board" aria-label="Governance loop">
      <article class="governance-card">
        <span class="section-label">Operating loop</span>
        <h2>Find, debate, approve, build, evaluate, repeat.</h2>
        <p>${esc(system.governanceLoop.purpose)}</p>
        <ol class="governance-steps">
          ${(Array.isArray(system.governanceLoop.stages) ? system.governanceLoop.stages : []).map((stage) => `<li>${esc(stage)}</li>`).join("")}
        </ol>
      </article>
      <div class="governance-roles">
        ${(Array.isArray(system.governanceLoop.roles) ? system.governanceLoop.roles : []).map(governanceRoleCard).join("")}
      </div>
    </section>
    <section class="token-board" aria-label="Design tokens">
      ${system.tokens.map((token) => `
      <article class="token">
        <strong>${esc(token.name)}</strong>
        <span>${esc(token.value)}</span>
        <em>${esc(token.note)}</em>
      </article>`).join("")}
    </section>
    <div class="rule-strip" aria-label="Review rules">
      ${system.reviewRules.map((rule) => `<span>${esc(rule)}</span>`).join("")}
    </div>
    <section class="hero-type-section" aria-label="Hero type taxonomy">
      <span class="section-label">Hero taxonomy</span>
      <h2>Different pages need different first impressions.</h2>
      <div class="hero-type-board">
        ${system.heroTypes.map(heroTypeCard).join("")}
      </div>
    </section>
    <section class="page-list">
      ${system.pages.map((page) => pageCard(page, system)).join("")}
    </section>
  </main>
</body>
</html>`;
}

async function main() {
  try {
    await fs.access(dist);
  } catch {
    throw new Error("dist/ is missing. Run npm run build before building the design harness.");
  }

  const designSystem = normalizeSystem(await readJson("data/design-system.json", fallbackSystem));
  await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(path.join(outDir, "index.html"), html(designSystem), "utf8");
  console.log(`Built design harness at ${path.join(outDir, "index.html")}`);
  console.log(`Loaded ${designSystem.heroTypes.length} hero types and ${designSystem.pages.length} representative pages.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
