import fs from "node:fs/promises";
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

      let filePath = path.resolve(dist, relativePath);
      if (!(await exists(filePath)) && !path.extname(relativePath)) {
        const htmlPath = path.resolve(dist, `${relativePath}.html`);
        const indexPath = path.resolve(dist, relativePath, "index.html");
        if (await exists(htmlPath)) filePath = htmlPath;
        else if (await exists(indexPath)) filePath = indexPath;
      }
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

function slug(value) {
  return String(value || "page")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "page";
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

async function capture({ browser, baseUrl, page, viewport, outputPath, profileDir }) {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  const shotProfileDir = await fs.mkdtemp(path.join(profileDir, "shot-"));
  const debugPort = 9200 + Math.floor(Math.random() * 700);

  const args = [
    "--headless=new",
    "--disable-gpu",
    "--disable-extensions",
    "--hide-scrollbars",
    "--no-first-run",
    "--no-default-browser-check",
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${shotProfileDir}`,
    `--window-size=${viewport.width},${viewport.height}`,
    "about:blank"
  ];

  const child = spawn(browser, args, { stdio: ["ignore", "ignore", "ignore"] });
  let cdp = null;
  let targetId = null;

  try {
    const debugUrl = await waitForDebugUrl(debugPort);
    cdp = await connectWebSocket(debugUrl);
    const target = await cdp.send("Target.createTarget", { url: "about:blank" });
    targetId = target.targetId;
    const attached = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
    const sessionId = attached.sessionId;
    const send = (method, params = {}) => cdp.send(method, params, sessionId);

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
    await send("Runtime.evaluate", {
      expression: "document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()",
      awaitPromise: true
    }).catch(() => {});

    const screenshot = await send("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: false,
      fromSurface: true
    });
    await fs.writeFile(outputPath, Buffer.from(screenshot.data, "base64"));
    const stats = await fs.stat(outputPath);
    return {
      page: page.id,
      title: page.title,
      path: page.path,
      viewport: viewport.id,
      label: viewport.label,
      width: viewport.width,
      height: viewport.height,
      bytes: stats.size,
      file: outputPath
    };
  } catch (error) {
    throw new Error(`Browser failed while capturing ${page.title} ${viewport.id}: ${error.message}`);
  } finally {
    if (cdp && targetId) await cdp.send("Target.closeTarget", { targetId }).catch(() => {});
    if (cdp) cdp.ws.close();
    child.kill();
    await fs.rm(shotProfileDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 }).catch(() => {});
  }
}

async function copyForHarness(items, sourceDir) {
  const harnessBaselineDir = path.join(harnessDir, "baselines", today);
  await fs.mkdir(harnessBaselineDir, { recursive: true });

  const copied = [];
  for (const item of items) {
    const filename = path.basename(item.file);
    const target = path.join(harnessBaselineDir, filename);
    await fs.copyFile(item.file, target);
    copied.push({
      ...item,
      sourceFile: item.file,
      file: path.relative(root, item.file).replace(/\\/g, "/"),
      harnessPath: `/__design-harness/baselines/${today}/${filename}`
    });
  }

  await fs.writeFile(path.join(harnessDir, "baselines.html"), baselinesHtml(copied, sourceDir), "utf8");
  return copied;
}

function baselinesHtml(items, sourceDir) {
  const grouped = new Map();
  for (const item of items) {
    if (!grouped.has(item.title)) grouped.set(item.title, []);
    grouped.get(item.title).push(item);
  }

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>K-Spot Now Design Baselines</title>
  <style>
    :root { --ink:#1d1d1f; --muted:#5f6b7a; --line:#d8dee8; --paper:#f7f8fb; --white:#fff; --coral:#e85d3f; --blue:#246beb; }
    * { box-sizing:border-box; }
    body { margin:0; color:var(--ink); background:var(--paper); font-family:Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height:1.5; }
    a { color:inherit; text-decoration:none; }
    .shell { width:min(1440px, calc(100% - 32px)); margin:0 auto; padding:34px 0 64px; }
    .eyebrow { margin:0 0 10px; color:var(--coral); font-size:.78rem; font-weight:850; text-transform:uppercase; }
    h1 { max-width:14ch; margin:0; font-size:clamp(2.5rem, 6vw, 4.8rem); line-height:1.02; }
    .hero { display:grid; grid-template-columns:minmax(0, 1fr) auto; gap:18px; align-items:end; margin-bottom:20px; }
    .hero p { max-width:760px; margin:12px 0 0; color:var(--muted); font-weight:650; }
    .nav { display:flex; gap:8px; flex-wrap:wrap; }
    .nav a { min-height:40px; display:inline-flex; align-items:center; border:1px solid #cbd9ec; border-radius:999px; padding:7px 12px; background:var(--white); color:#063a74; font-weight:850; }
    .page-grid { display:grid; gap:18px; }
    .baseline-card { display:grid; gap:12px; border:1px solid var(--line); border-radius:8px; padding:14px; background:var(--white); }
    .baseline-card h2 { margin:0; font-size:1.35rem; line-height:1.12; }
    .shot-grid { display:grid; grid-template-columns:minmax(0, 1fr) 320px; gap:12px; align-items:start; }
    figure { margin:0; border:1px solid #dbe5f2; border-radius:8px; overflow:hidden; background:#f5f7fb; }
    figcaption { display:flex; justify-content:space-between; gap:8px; padding:8px 10px; border-bottom:1px solid #dbe5f2; color:#063a74; font-size:.78rem; font-weight:850; }
    img { display:block; width:100%; height:auto; background:#fff; }
    .mobile-shot img { max-width:390px; margin:0 auto; }
    @media (max-width:900px) { .hero, .shot-grid { grid-template-columns:1fr; } }
  </style>
</head>
<body>
  <main class="shell">
    <section class="hero">
      <div>
        <p class="eyebrow">Screenshot Baselines / ${esc(today)}</p>
        <h1>Visual QA captures</h1>
        <p>Captured desktop and mobile baselines for representative pages. Source artifacts are under ${esc(path.relative(root, sourceDir).replace(/\\/g, "/"))}.</p>
      </div>
      <nav class="nav">
        <a href="/__design-harness/">Harness</a>
        <a href="/__design-harness/council.html">Council</a>
      </nav>
    </section>
    <section class="page-grid">
      ${[...grouped.entries()].map(([title, shots]) => `
      <article class="baseline-card">
        <h2>${esc(title)}</h2>
        <div class="shot-grid">
          ${shots.map((shot) => `
          <figure class="${shot.viewport === "mobile" ? "mobile-shot" : "desktop-shot"}">
            <figcaption><span>${esc(shot.label)}</span><span>${Math.round(shot.bytes / 1024)} KB</span></figcaption>
            <img src="${esc(shot.harnessPath)}" alt="${esc(`${title} ${shot.label} screenshot baseline`)}">
          </figure>`).join("")}
        </div>
      </article>`).join("")}
    </section>
  </main>
</body>
</html>`;
}

async function writeSkippedReport(reason) {
  const report = {
    date: today,
    status: "skipped",
    reason,
    summary: { captured: 0, expected: 0 },
    items: []
  };
  await fs.mkdir(feedDir, { recursive: true });
  await fs.writeFile(path.join(feedDir, `design-baselines-${today}.json`), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`Skipped design baselines: ${reason}`);
}

async function main() {
  if (!(await exists(dist))) {
    throw new Error("dist/ is missing. Run npm run build before capturing design baselines.");
  }

  const designSystem = await readJson("data/design-system.json", {});
  const pages = Array.isArray(designSystem.pages) ? designSystem.pages : [];
  if (!pages.length) {
    await writeSkippedReport("data/design-system.json has no representative pages.");
    return;
  }

  const browser = await resolveBrowser();
  if (!browser) {
    await writeSkippedReport("No Edge or Chrome executable was found. Set DESIGN_BASELINE_BROWSER to capture baselines.");
    return;
  }

  const { server, port } = await staticServer();
  const baseUrl = `http://127.0.0.1:${port}`;
  const sourceDir = path.join(feedDir, "design-baselines", today);
  const profileDir = await fs.mkdtemp(path.join(os.tmpdir(), "kspot-design-baseline-"));
  const captured = [];

  try {
    for (const page of pages) {
      for (const viewport of viewports) {
        const filename = `${slug(page.id || page.title)}-${viewport.id}.png`;
        const outputPath = path.join(sourceDir, filename);
        const item = await capture({ browser, baseUrl, page, viewport, outputPath, profileDir });
        captured.push(item);
        console.log(`Captured ${page.title} ${viewport.id}: ${outputPath}`);
      }
    }
  } finally {
    server.close();
    await fs.rm(profileDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 }).catch(() => {});
  }

  const harnessItems = await copyForHarness(captured, sourceDir);
  const report = {
    date: today,
    status: "captured",
    browser,
    baseUrl,
    sourceDir: path.relative(root, sourceDir).replace(/\\/g, "/"),
    harnessPage: "/__design-harness/baselines.html",
    summary: {
      captured: harnessItems.length,
      expected: pages.length * viewports.length
    },
    items: harnessItems.map(({ sourceFile, ...item }) => item)
  };

  await fs.mkdir(feedDir, { recursive: true });
  await fs.writeFile(path.join(feedDir, `design-baselines-${today}.json`), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`Saved design baselines: ${path.join(feedDir, `design-baselines-${today}.json`)}`);
  console.log(`Saved harness baseline page: ${path.join(harnessDir, "baselines.html")}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
