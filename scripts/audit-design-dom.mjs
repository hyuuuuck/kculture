import fs from "node:fs/promises";
import fsSync from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { todayString } from "./lib/date.mjs";

const root = path.resolve(".");
const dist = path.join(root, "dist");
const feedDir = path.join(root, "data", "feeds");
const harnessDir = path.join(dist, "__design-harness");
const today = todayString();

const viewports = [
  { id: "desktop", label: "Desktop 1280", width: 1280, height: 900, mobile: false },
  { id: "mobile", label: "Mobile 390", width: 390, height: 844, mobile: true }
];

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

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function resolveBrowser() {
  const candidates = [
    process.env.DESIGN_BASELINE_BROWSER,
    process.env.DESIGN_AUDIT_BROWSER,
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "msedge",
    "chrome",
    "google-chrome",
    "chromium"
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (path.isAbsolute(candidate)) {
      if (await exists(candidate)) return candidate;
    } else {
      return candidate;
    }
  }

  return null;
}

function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".html") return "text/html; charset=utf-8";
  if (ext === ".css") return "text/css; charset=utf-8";
  if (ext === ".js") return "text/javascript; charset=utf-8";
  if (ext === ".json") return "application/json; charset=utf-8";
  if (ext === ".svg") return "image/svg+xml";
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  if (ext === ".ico") return "image/x-icon";
  return "application/octet-stream";
}

function staticServer() {
  const server = http.createServer(async (request, response) => {
    try {
      const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
      let relativePath = decodeURIComponent(requestUrl.pathname).replace(/^\/+/, "");
      if (!relativePath || relativePath.endsWith("/")) relativePath = path.join(relativePath, "index.html");

      const filePath = path.resolve(dist, relativePath);
      if (!filePath.startsWith(dist)) {
        response.writeHead(403);
        response.end("Forbidden");
        return;
      }

      const body = await fs.readFile(filePath);
      response.writeHead(200, { "Content-Type": contentType(filePath) });
      response.end(body);
    } catch {
      response.writeHead(404);
      response.end("Not found");
    }
  });

  return new Promise((resolve, reject) => {
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      resolve({ server, port: address.port });
    });
  });
}

function connectWebSocket(url) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    ws.onopen = () => {
      let id = 0;
      const pending = new Map();

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (!message.id || !pending.has(message.id)) return;
        const { resolve: resolvePending, reject: rejectPending } = pending.get(message.id);
        pending.delete(message.id);
        if (message.error) rejectPending(new Error(JSON.stringify(message.error)));
        else resolvePending(message.result);
      };

      function send(method, params = {}, sessionId = null) {
        return new Promise((resolvePending, rejectPending) => {
          const callId = ++id;
          pending.set(callId, { resolve: resolvePending, reject: rejectPending });
          const message = sessionId ? { id: callId, sessionId, method, params } : { id: callId, method, params };
          ws.send(JSON.stringify(message));
        });
      }

      resolve({ ws, send });
    };
    ws.onerror = reject;
  });
}

async function waitForDebugUrl(port) {
  for (let index = 0; index < 80; index += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/version`);
      const version = await response.json();
      if (version.webSocketDebuggerUrl) return version.webSocketDebuggerUrl;
    } catch {
      // Browser is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("Browser debug endpoint did not become available.");
}

async function launchBrowser(browser) {
  const debugPort = 9400 + Math.floor(Math.random() * 800);
  const profileDir = await fs.mkdtemp(path.join(os.tmpdir(), "kspot-design-dom-"));
  const child = spawn(browser, [
    "--headless=new",
    "--disable-gpu",
    "--disable-extensions",
    "--hide-scrollbars",
    "--no-first-run",
    "--no-default-browser-check",
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${profileDir}`,
    "--window-size=1280,900",
    "about:blank"
  ], { stdio: ["ignore", "ignore", "ignore"] });

  const debugUrl = await waitForDebugUrl(debugPort);
  return { child, profileDir, debugUrl };
}

function auditExpression() {
  return `(() => {
    const allowedOverflowSelector = [
      ".spotlight-tabs",
      ".spotlight-track",
      ".spotlight-card",
      "[data-spotlight-slide]"
    ].join(",");
    const controlSelector = [
      "button",
      "summary",
      "input",
      "select",
      ".button",
      ".save-event",
      ".spotlight-dot",
      ".quick-plan-card",
      ".map-link-list a",
      ".planner-card-actions a",
      ".planner-card-actions button"
    ].join(",");

    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = window.innerHeight;
    const all = [...document.querySelectorAll("*")];

    function textOf(element) {
      return (element.textContent || "").trim().replace(/\\s+/g, " ").slice(0, 120);
    }

    function selectorOf(element) {
      const id = element.id ? "#" + element.id : "";
      const classes = String(element.className || "")
        .split(/\\s+/)
        .filter(Boolean)
        .slice(0, 4)
        .map((className) => "." + className)
        .join("");
      return (element.tagName || "").toLowerCase() + id + classes;
    }

    function isVisible(element, rect, styles) {
      return rect.width > 0 &&
        rect.height > 0 &&
        rect.bottom >= 0 &&
        rect.top <= Math.max(viewportHeight, 900) &&
        styles.display !== "none" &&
        styles.visibility !== "hidden" &&
        Number(styles.opacity || 1) !== 0;
    }

    function isInsideAllowedOverflow(element) {
      return Boolean(element.closest(allowedOverflowSelector));
    }

    const edgeOverflows = [];
    const clippedTexts = [];
    const smallControls = [];
    const crampedDetailMedia = [];
    const clippedRecheckTexts = [];
    const wideElements = [];

    for (const element of all) {
      const rect = element.getBoundingClientRect();
      const styles = getComputedStyle(element);
      if (!isVisible(element, rect, styles)) continue;

      const item = {
        selector: selectorOf(element),
        text: textOf(element),
        left: Math.round(rect.left),
        right: Math.round(rect.right),
        top: Math.round(rect.top),
        width: Math.round(rect.width),
        height: Math.round(rect.height)
      };

      if (!isInsideAllowedOverflow(element) && (rect.right > viewportWidth + 2 || rect.left < -2)) {
        edgeOverflows.push(item);
      }

      if (
        !["HTML", "BODY"].includes(element.tagName) &&
        !isInsideAllowedOverflow(element) &&
        (element.scrollWidth > viewportWidth + 2 || rect.width > viewportWidth + 2)
      ) {
        wideElements.push({
          ...item,
          scrollWidth: element.scrollWidth,
          clientWidth: element.clientWidth,
          overflowX: styles.overflowX
        });
      }

      const hasReadableText = item.text.length >= 3 && !["HTML", "BODY", "SCRIPT", "STYLE", "SVG", "PATH"].includes(element.tagName);
      const intentionallyEllipsized = styles.textOverflow === "ellipsis" || styles.webkitLineClamp !== "none";
      if (
        hasReadableText &&
        !isInsideAllowedOverflow(element) &&
        !intentionallyEllipsized &&
        element.scrollWidth > element.clientWidth + 2
      ) {
        clippedTexts.push({
          ...item,
          scrollWidth: element.scrollWidth,
          clientWidth: element.clientWidth,
          whiteSpace: styles.whiteSpace,
          overflowX: styles.overflowX
        });
      }

      if (element.matches(controlSelector) && rect.height < 38 && rect.width >= 28 && !element.closest(".top-nav")) {
        smallControls.push(item);
      }

      if (
        viewportWidth <= 420 &&
        element.matches(".recheck-title, .recheck-title a, .recheck-meta, .recheck-checked, .recheck-source strong") &&
        (
          rect.right > viewportWidth + 2 ||
          element.scrollWidth > element.clientWidth + 2 ||
          (element.scrollHeight > element.clientHeight + 2 && styles.overflowY !== "visible")
        )
      ) {
        clippedRecheckTexts.push({
          ...item,
          scrollWidth: element.scrollWidth,
          clientWidth: element.clientWidth,
          scrollHeight: element.scrollHeight,
          clientHeight: element.clientHeight,
          whiteSpace: styles.whiteSpace,
          overflowX: styles.overflowX,
          overflowY: styles.overflowY,
          webkitLineClamp: styles.webkitLineClamp
        });
      }
    }

    const detailHeroImage = document.querySelector(".detail-hero img");
    if (viewportWidth <= 420 && detailHeroImage) {
      const rect = detailHeroImage.getBoundingClientRect();
      const styles = getComputedStyle(detailHeroImage);
      if (isVisible(detailHeroImage, rect, styles)) {
        const leftInset = Math.round(rect.left);
        const rightInset = Math.round(viewportWidth - rect.right);
        if (leftInset < 12 || rightInset < 12) {
          crampedDetailMedia.push({
            selector: selectorOf(detailHeroImage),
            text: textOf(detailHeroImage),
            left: leftInset,
            right: Math.round(rect.right),
            rightInset,
            width: Math.round(rect.width),
            height: Math.round(rect.height)
          });
        }
      }
    }

    return {
      title: document.title,
      viewportWidth,
      viewportHeight,
      documentScrollWidth: document.documentElement.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
      edgeOverflows: edgeOverflows.slice(0, 12),
      clippedTexts: clippedTexts.slice(0, 12),
      wideElements: wideElements
        .sort((a, b) => Math.max(b.scrollWidth, b.width) - Math.max(a.scrollWidth, a.width))
        .slice(0, 8),
      smallControls: smallControls.slice(0, 12),
      crampedDetailMedia: crampedDetailMedia.slice(0, 4),
      clippedRecheckTexts: clippedRecheckTexts.slice(0, 8)
    };
  })()`;
}

async function inspectPage({ cdp, baseUrl, page, viewport }) {
  const target = await cdp.send("Target.createTarget", { url: "about:blank" });
  const attached = await cdp.send("Target.attachToTarget", { targetId: target.targetId, flatten: true });
  const sessionId = attached.sessionId;
  const send = (method, params = {}) => cdp.send(method, params, sessionId);

  try {
    await send("Page.enable");
    await send("Runtime.enable");
    await send("Emulation.setDeviceMetricsOverride", {
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: 1,
      mobile: viewport.mobile
    });
    await send("Page.navigate", { url: `${baseUrl}${page.path}` });
    await new Promise((resolve) => setTimeout(resolve, 1700));
    const result = await send("Runtime.evaluate", {
      expression: auditExpression(),
      returnByValue: true,
      awaitPromise: true
    });
    const metrics = result.result?.value || {};
    return {
      page: page.id,
      title: page.title,
      path: page.path,
      viewport: viewport.id,
      label: viewport.label,
      metrics
    };
  } finally {
    await cdp.send("Target.closeTarget", { targetId: target.targetId }).catch(() => {});
  }
}

function findingsFor(result) {
  const findings = [];
  const metrics = result.metrics || {};
  const pageLabel = `${result.title} / ${result.label}`;
  const maxScrollWidth = Math.max(metrics.bodyScrollWidth || 0, metrics.documentScrollWidth || 0);

  if (maxScrollWidth > result.metrics.viewportWidth + 1) {
    const widest = (metrics.wideElements || [])[0];
    findings.push({
      severity: "P1",
      page: result.title,
      viewport: result.viewport,
      symptom: `${pageLabel} has page-wide horizontal overflow.`,
      evidence: widest
        ? `scrollWidth ${maxScrollWidth}px exceeds viewport ${metrics.viewportWidth}px; widest ${widest.selector} scrollWidth=${widest.scrollWidth}, width=${widest.width}, text="${widest.text}".`
        : `scrollWidth ${maxScrollWidth}px exceeds viewport ${metrics.viewportWidth}px.`,
      proposal: "Find the widest element, then constrain it with minmax(0, 1fr), max-width:100%, or a deliberate scroll container."
    });
  }

  for (const item of metrics.edgeOverflows || []) {
    findings.push({
      severity: "P1",
      page: result.title,
      viewport: result.viewport,
      symptom: `${pageLabel} has an element crossing the viewport edge.`,
      evidence: `${item.selector} right=${item.right}, width=${item.width}, text="${item.text}".`,
      proposal: "Reduce the element width, allow wrapping, or move it into an intentional horizontal scroller."
    });
  }

  for (const item of metrics.clippedTexts || []) {
    findings.push({
      severity: "P2",
      page: result.title,
      viewport: result.viewport,
      symptom: `${pageLabel} has text likely clipped without an intentional ellipsis.`,
      evidence: `${item.selector} scrollWidth=${item.scrollWidth}, clientWidth=${item.clientWidth}, text="${item.text}".`,
      proposal: "Shorten the copy, allow wrapping, or add intentional ellipsis styling if truncation is part of the design."
    });
  }

  for (const item of metrics.smallControls || []) {
    findings.push({
      severity: "P2",
      page: result.title,
      viewport: result.viewport,
      symptom: `${pageLabel} has a compact control below the design touch target.`,
      evidence: `${item.selector} is ${item.width}x${item.height}, text="${item.text}".`,
      proposal: "Raise the control height toward 44px unless it is part of the compact navigation exception."
    });
  }

  for (const item of metrics.crampedDetailMedia || []) {
    findings.push({
      severity: "P2",
      page: result.title,
      viewport: result.viewport,
      symptom: `${pageLabel} has detail media pressed against the mobile viewport edge.`,
      evidence: `${item.selector} left inset=${item.left}px, right inset=${item.rightInset}px, width=${item.width}px.`,
      proposal: "Keep the detail hero image inside the card gutter so it reads intentional instead of clipped."
    });
  }

  for (const item of metrics.clippedRecheckTexts || []) {
    findings.push({
      severity: "P1",
      page: result.title,
      viewport: result.viewport,
      symptom: `${pageLabel} has a mobile recheck card line that can be read as accidental clipping.`,
      evidence: `${item.selector} scrollWidth=${item.scrollWidth}, clientWidth=${item.clientWidth}, right=${item.right}, text="${item.text}".`,
      proposal: "Let recheck titles and source labels wrap naturally on mobile; do not rely on hidden overflow for operational cards."
    });
  }

  return findings;
}

function reportMarkdown(report) {
  const lines = [
    `# Design DOM Audit - ${report.date}`,
    "",
    `Status: ${report.status}`,
    `Representative checks: ${report.summary.checked}`,
    `Findings: ${report.summary.findings}`,
    ""
  ];

  if (!report.findings.length) {
    lines.push("No page-wide overflow, unintentional clipped text, or undersized non-navigation controls were found in representative desktop/mobile views.");
  } else {
    for (const finding of report.findings) {
      lines.push(`## ${finding.id} [${finding.severity}] ${finding.page} / ${finding.viewport}`);
      lines.push(`- Symptom: ${finding.symptom}`);
      lines.push(`- Evidence: ${finding.evidence}`);
      lines.push(`- Proposal: ${finding.proposal}`);
      lines.push("");
    }
  }

  return `${lines.join("\n")}\n`;
}

function reportHtml(report) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>K-Spot Now Design DOM Audit</title>
  <style>
    :root { --ink:#1d1d1f; --muted:#5f6b7a; --line:#d8dee8; --paper:#f7f8fb; --white:#fff; --coral:#e85d3f; --blue:#246beb; --green:#008a70; --warn:#9a5f00; }
    * { box-sizing:border-box; }
    body { margin:0; color:var(--ink); background:var(--paper); font-family:Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height:1.5; }
    a { color:inherit; text-decoration:none; }
    .shell { width:min(1180px, calc(100% - 32px)); margin:0 auto; padding:34px 0 64px; }
    .eyebrow { margin:0 0 10px; color:var(--coral); font-size:.78rem; font-weight:850; text-transform:uppercase; }
    h1 { max-width:14ch; margin:0; font-size:clamp(2.5rem, 6vw, 4.8rem); line-height:1.02; }
    .hero { display:grid; grid-template-columns:minmax(0, 1fr) auto; gap:18px; align-items:end; margin-bottom:18px; }
    .hero p { max-width:760px; margin:12px 0 0; color:var(--muted); font-weight:650; }
    .nav { display:flex; gap:8px; flex-wrap:wrap; }
    .nav a { min-height:40px; display:inline-flex; align-items:center; border:1px solid #cbd9ec; border-radius:999px; padding:7px 12px; background:var(--white); color:#063a74; font-weight:850; }
    .summary { display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:10px; margin:0 0 18px; }
    .summary div, .finding, .pass { border:1px solid var(--line); border-radius:8px; background:var(--white); }
    .summary div { padding:14px; }
    .summary span { display:block; color:var(--muted); font-size:.78rem; font-weight:850; text-transform:uppercase; }
    .summary strong { display:block; margin-top:4px; color:#063a74; font-size:1.8rem; line-height:1; }
    .finding-list { display:grid; gap:12px; }
    .finding { padding:14px; border-left:4px solid var(--warn); }
    .finding.p1 { border-left-color:var(--coral); }
    .finding h2 { margin:0 0 8px; font-size:1.08rem; line-height:1.2; }
    .finding p { margin:6px 0; color:var(--muted); font-weight:650; }
    .finding code { color:#063a74; font-weight:850; white-space:normal; }
    .pass { padding:18px; color:#07534d; background:#f2fbf7; font-weight:850; }
    @media (max-width:760px) { .hero, .summary { grid-template-columns:1fr; } }
  </style>
</head>
<body>
  <main class="shell">
    <section class="hero">
      <div>
        <p class="eyebrow">DOM Visual Audit / ${esc(report.date)}</p>
        <h1>${report.status === "passed" ? "No layout leaks found" : "Layout issues issued"}</h1>
        <p>Checks representative desktop/mobile pages for page-wide overflow, elements crossing the viewport edge, clipped text, and undersized non-navigation controls.</p>
      </div>
      <nav class="nav">
        <a href="/__design-harness/">Harness</a>
        <a href="/__design-harness/council.html">Council</a>
        <a href="/__design-harness/baselines.html">Baselines</a>
      </nav>
    </section>
    <section class="summary">
      <div><span>Checks</span><strong>${report.summary.checked}</strong></div>
      <div><span>Findings</span><strong>${report.summary.findings}</strong></div>
      <div><span>Status</span><strong>${esc(report.status)}</strong></div>
    </section>
    ${report.findings.length ? `
    <section class="finding-list">
      ${report.findings.map((finding) => `
      <article class="finding ${finding.severity.toLowerCase()}">
        <h2>${esc(finding.id)} [${esc(finding.severity)}] ${esc(finding.page)} / ${esc(finding.viewport)}</h2>
        <p><strong>Symptom:</strong> ${esc(finding.symptom)}</p>
        <p><strong>Evidence:</strong> <code>${esc(finding.evidence)}</code></p>
        <p><strong>Proposal:</strong> ${esc(finding.proposal)}</p>
      </article>`).join("")}
    </section>` : `<section class="pass">QA sign-off: no DOM-level visual leaks were found in the representative views.</section>`}
  </main>
</body>
</html>`;
}

async function writeSkipped(reason) {
  const report = {
    date: today,
    status: "skipped",
    reason,
    summary: { checked: 0, findings: 0 },
    results: [],
    findings: []
  };
  await fs.mkdir(feedDir, { recursive: true });
  await fs.mkdir(harnessDir, { recursive: true });
  await fs.writeFile(path.join(feedDir, `design-dom-audit-${today}.json`), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await fs.writeFile(path.join(feedDir, `design-dom-audit-${today}.md`), reportMarkdown(report), "utf8");
  await fs.writeFile(path.join(harnessDir, "dom-audit.html"), reportHtml(report), "utf8");
  console.log(`Skipped design DOM audit: ${reason}`);
}

async function main() {
  if (!(await exists(dist))) {
    throw new Error("dist/ is missing. Run npm run build before auditing design DOM.");
  }

  const designSystem = await readJson("data/design-system.json", {});
  const pages = Array.isArray(designSystem.pages) ? designSystem.pages : [];
  if (!pages.length) {
    await writeSkipped("data/design-system.json has no representative pages.");
    return;
  }

  const browser = await resolveBrowser();
  if (!browser) {
    await writeSkipped("No Edge or Chrome executable was found. Set DESIGN_AUDIT_BROWSER or DESIGN_BASELINE_BROWSER.");
    return;
  }

  const { server, port } = await staticServer();
  const baseUrl = `http://127.0.0.1:${port}`;
  const launched = await launchBrowser(browser);
  const cdp = await connectWebSocket(launched.debugUrl);
  const results = [];

  try {
    for (const page of pages) {
      for (const viewport of viewports) {
        const result = await inspectPage({ cdp, baseUrl, page, viewport });
        results.push(result);
        console.log(`Audited ${page.title} ${viewport.id}: ${result.path}`);
      }
    }
  } finally {
    cdp.ws.close();
    launched.child.kill();
    server.close();
    await fs.rm(launched.profileDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 }).catch(() => {});
  }

  const findings = results.flatMap(findingsFor).map((finding, index) => ({
    id: `DOM-${today}-${String(index + 1).padStart(2, "0")}`,
    owner: "audit-institution",
    status: "issued",
    ...finding
  }));

  const report = {
    date: today,
    status: findings.length ? "issued" : "passed",
    browser,
    baseUrl,
    summary: {
      checked: results.length,
      findings: findings.length,
      pages: pages.length,
      viewports: viewports.length
    },
    results,
    findings
  };

  await fs.mkdir(feedDir, { recursive: true });
  await fs.mkdir(harnessDir, { recursive: true });
  await fs.writeFile(path.join(feedDir, `design-dom-audit-${today}.json`), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await fs.writeFile(path.join(feedDir, `design-dom-audit-${today}.md`), reportMarkdown(report), "utf8");
  await fs.writeFile(path.join(harnessDir, "dom-audit.html"), reportHtml(report), "utf8");

  console.log(`Saved design DOM audit: ${path.join(feedDir, `design-dom-audit-${today}.json`)}`);
  console.log(`Saved design DOM audit harness page: ${path.join(harnessDir, "dom-audit.html")}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
