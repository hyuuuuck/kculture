import fs from "node:fs/promises";
import fsSync from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { todayString } from "./lib/date.mjs";
import { configuredAdSenseClientId, configuredAdSensePublisherId } from "./lib/adsense.mjs";

const root = path.resolve(".");
const today = todayString();
const siteUrl = normalizeSiteUrl(process.env.SITE_URL || "https://kspotnow.com");
const timeoutMs = Number(process.env.LIVE_AUDIT_TIMEOUT_MS || 12000);
const reviewMode = process.env.ADSENSE_REVIEW_MODE !== "0";
const publisherId = configuredAdSensePublisherId();
const clientId = configuredAdSenseClientId();
const checks = [];
const layoutResults = [];

const requiredPages = [
  { path: "/", label: "Root home", needles: ["K-Spot Now", "Live Korea events, pop-ups, and deals for visitors."] },
  { path: "/en/", label: "English home", needles: ["K-Spot Now", "spotlight-carousel"] },
  { path: "/en/now/", label: "Reviewed event feed", needles: ["data-gallery-limit=\"6\"", "latest-checked-section"] },
  { path: "/en/events/red-velvet-day-in-red-velvet-seoul-2026", label: "Representative event", needles: ["Open Ticketing source", "Place, timing, weather", "What we checked"] },
  { path: "/en/routes/", label: "Travel routes", needles: ["Travel routes", "routes-with-ad no-ad"] },
  { path: "/en/calendar/", label: "Calendar", needles: ["Calendar", "month-block"] },
  { path: "/en/guides/", label: "Guides", needles: ["Guides"] },
  { path: "/en/privacy/", label: "Privacy", needles: ["Privacy"] },
  { path: "/en/contact/", label: "Contact", needles: ["contact@kspotnow.com"] }
];

const hiddenLanguageRoots = ["/de/", "/fr/", "/ja/", "/es/", "/zh/", "/pt/", "/ru/"];
const layoutPages = [
  { path: "/en/", label: "Home" },
  { path: "/en/routes/", label: "Routes", routeCheck: true },
  { path: "/en/events/red-velvet-day-in-red-velvet-seoul-2026", label: "Event detail" },
  { path: "/en/calendar/", label: "Calendar" }
];
const viewports = [
  { id: "desktop", width: 1365, height: 900 },
  { id: "mobile", width: 390, height: 844 }
];

function normalizeSiteUrl(value) {
  const parsed = new URL(String(value || "").trim());
  parsed.hash = "";
  parsed.search = "";
  parsed.pathname = "/";
  return parsed;
}

function add(status, area, item, detail, next = "") {
  checks.push({ status, area, item, detail, next });
}

function pass(area, item, detail) {
  add("pass", area, item, detail);
}

function fail(area, item, detail, next) {
  add("fail", area, item, detail, next);
}

function warn(area, item, detail, next) {
  add("warn", area, item, detail, next);
}

async function fetchLive(pathname, redirect = "follow") {
  const url = new URL(pathname, siteUrl);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      cache: "no-store",
      redirect,
      signal: controller.signal,
      headers: { "user-agent": "KSpotNowAdSenseLiveAudit/1.0" }
    });
    const text = await response.text();
    return { url: url.href, status: response.status, ok: response.ok, text, headers: response.headers };
  } catch (error) {
    return { url: url.href, status: 0, ok: false, text: "", headers: new Headers(), error: error.message };
  } finally {
    clearTimeout(timer);
  }
}

async function auditRequiredPages() {
  for (const page of requiredPages) {
    const result = await fetchLive(page.path);
    if (!result.ok || result.status !== 200) {
      fail("Live", page.label, `${result.url} returned ${result.status || result.error}`, "Redeploy the current Worker build and retry the live audit.");
      continue;
    }
    const missing = page.needles.filter((needle) => !result.text.includes(needle));
    if (missing.length) {
      fail("Live", page.label, `Missing ${missing.join(", ")}`, "Check the live deploy version against the local dist output.");
    } else {
      pass("Live", page.label, `${result.url} returned 200 with expected page signals.`);
    }
  }
}

async function auditAdsTxt() {
  const result = await fetchLive("/ads.txt");
  if (!publisherId) {
    warn("AdSense", "ads.txt", "Publisher ID is not configured.", "Set GOOGLE_ADSENSE_PUBLISHER_ID before requesting AdSense re-review.");
    return;
  }
  const expected = `google.com, ${publisherId}, DIRECT`;
  if (result.ok && result.status === 200 && result.text.includes(expected)) {
    pass("AdSense", "ads.txt", `Live ads.txt contains ${expected}.`);
  } else {
    fail("AdSense", "ads.txt", `${result.url} returned ${result.status || result.error}; expected ${expected}`, "Rebuild and redeploy so /ads.txt is served from the custom domain root.");
  }
}

async function auditSitemapTargets() {
  const sitemap = await fetchLive("/sitemap.xml", "manual");
  if (!sitemap.ok || sitemap.status !== 200) {
    fail("Search", "Sitemap targets", `${sitemap.url} returned ${sitemap.status || sitemap.error}`, "Redeploy and verify the root sitemap before requesting AdSense review.");
    return;
  }

  const urls = [...sitemap.text.matchAll(/<loc>(https:\/\/kspotnow\.com[^<]+)<\/loc>/g)].map((match) => match[1]);
  const failures = [];
  for (const url of urls) {
    const target = await fetchLive(url, "manual");
    if (target.status !== 200) {
      failures.push(`${url} -> ${target.status || target.error}`);
      continue;
    }
    const canonical = target.text.match(/<link rel="canonical" href="([^"]+)">/)?.[1];
    if (canonical !== url) failures.push(`${url} -> canonical ${canonical || "missing"}`);
  }

  if (!urls.length) {
    fail("Search", "Sitemap targets", "No canonical URLs were found in the live sitemap.", "Rebuild sitemap.xml from the approved editorial set.");
  } else if (failures.length) {
    fail("Search", "Sitemap targets", `${failures.length}/${urls.length} sitemap URLs redirect, fail, or disagree with canonical: ${failures.slice(0, 3).join("; ")}`, "Sitemap URLs must return 200 directly and exactly match each page canonical.");
  } else {
    pass("Search", "Sitemap targets", `${urls.length} sitemap URLs return 200 directly and exactly match their canonical tags.`);
  }
}

async function auditAdSenseHead() {
  const result = await fetchLive("/en/");
  if (clientId && result.text.includes(clientId) && result.text.includes("pagead2.googlesyndication.com/pagead/js/adsbygoogle.js")) {
    pass("AdSense", "Auto ads script", `Live home includes ${clientId}.`);
  } else if (clientId) {
    fail("AdSense", "Auto ads script", `Live home is missing ${clientId}.`, "Rebuild with the configured AdSense client and redeploy.");
  } else {
    warn("AdSense", "Auto ads script", "AdSense client is not configured.", "Set GOOGLE_ADSENSE_CLIENT after the account is ready.");
  }
}

async function auditAffiliatePause() {
  if (!reviewMode) {
    warn("Monetization", "Affiliate review mode", "ADSENSE_REVIEW_MODE=0, affiliate pause was not enforced.", "Use default review mode before an AdSense low-value-content re-review.");
    return;
  }

  const samples = await Promise.all([
    fetchLive("/en/"),
    fetchLive("/en/events/red-velvet-day-in-red-velvet-seoul-2026"),
    fetchLive("/en/routes/")
  ]);
  const joined = samples.map((sample) => sample.text).join("\n");
  const blockedSignals = ["Allianceid=8627235", "coupa.ng", "coupang-affiliate-widget", "trip.com/partners/ad"];
  const found = blockedSignals.filter((signal) => joined.includes(signal));
  if (found.length) {
    fail("Monetization", "Affiliate pause", `Found review-mode affiliate signals: ${found.join(", ")}`, "Disable affiliate widgets before re-requesting AdSense review.");
  } else {
    pass("Monetization", "Affiliate pause", "No Trip.com or Coupang affiliate widgets visible in sampled live review pages.");
  }
}

async function auditHiddenLanguages() {
  for (const pathname of hiddenLanguageRoots) {
    const result = await fetchLive(pathname, "manual");
    if (result.status === 404 || result.status === 410) {
      pass("Localization", pathname, "Hidden during English-only AdSense review.");
    } else {
      fail("Localization", pathname, `Returned ${result.status}; unfinished localized pages should not be public.`, "Keep PUBLIC_LANGUAGES=en until each localized depth audit passes.");
    }
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
      if (fsSync.existsSync(candidate)) return candidate;
    } else {
      return candidate;
    }
  }
  return null;
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

function connectWebSocket(url) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    ws.onopen = () => {
      let id = 0;
      const pending = new Map();
      const listeners = new Map();

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.id && pending.has(message.id)) {
          const { resolve: resolvePending, reject: rejectPending } = pending.get(message.id);
          pending.delete(message.id);
          if (message.error) rejectPending(new Error(JSON.stringify(message.error)));
          else resolvePending(message.result);
          return;
        }
        if (message.method && listeners.has(message.method)) {
          for (const listener of listeners.get(message.method)) listener(message);
        }
      };

      function send(method, params = {}, sessionId = null) {
        return new Promise((resolvePending, rejectPending) => {
          const callId = ++id;
          pending.set(callId, { resolve: resolvePending, reject: rejectPending });
          ws.send(JSON.stringify(sessionId ? { id: callId, sessionId, method, params } : { id: callId, method, params }));
        });
      }

      function once(method, predicate = () => true, timeout = 8000) {
        return new Promise((resolveOnce, rejectOnce) => {
          const timer = setTimeout(() => {
            cleanup();
            rejectOnce(new Error(`Timed out waiting for ${method}`));
          }, timeout);
          function listener(message) {
            if (!predicate(message)) return;
            cleanup();
            resolveOnce(message);
          }
          function cleanup() {
            clearTimeout(timer);
            const list = listeners.get(method) || [];
            listeners.set(method, list.filter((item) => item !== listener));
          }
          listeners.set(method, [...(listeners.get(method) || []), listener]);
        });
      }

      resolve({ ws, send, once });
    };
    ws.onerror = reject;
  });
}

async function launchBrowser(browser) {
  const debugPort = 10200 + Math.floor(Math.random() * 800);
  const profileDir = await fs.mkdtemp(path.join(os.tmpdir(), "kspot-live-audit-"));
  const child = spawn(browser, [
    "--headless=new",
    "--disable-gpu",
    "--disable-extensions",
    "--hide-scrollbars",
    "--no-first-run",
    "--no-default-browser-check",
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${profileDir}`,
    "--window-size=1365,900",
    "about:blank"
  ], { stdio: ["ignore", "ignore", "ignore"] });
  const debugUrl = await waitForDebugUrl(debugPort);
  return { child, profileDir, debugUrl };
}

function layoutExpression() {
  return `(() => {
    const allowedOverflow = ".spotlight-track,.spotlight-card,.spotlight-tabs,.gallery-tools .filter-bar";
    const viewportWidth = document.documentElement.clientWidth;
    const scrollWidth = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
    const visible = (element, rect, styles) => rect.width > 0 && rect.height > 0 && styles.display !== "none" && styles.visibility !== "hidden" && Number(styles.opacity || 1) !== 0;
    const wide = [];
    for (const element of document.querySelectorAll("body *")) {
      const rect = element.getBoundingClientRect();
      const styles = getComputedStyle(element);
      if (!visible(element, rect, styles) || element.closest(allowedOverflow)) continue;
      if (rect.right > viewportWidth + 2 || rect.left < -2) {
        wide.push({
          selector: (element.tagName || "").toLowerCase() + (element.className ? "." + String(element.className).split(/\\s+/).slice(0, 3).join(".") : ""),
          text: (element.textContent || "").trim().replace(/\\s+/g, " ").slice(0, 80),
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width)
        });
      }
      if (wide.length >= 6) break;
    }
    const routeCards = [...document.querySelectorAll(".route-card")].map((card) => Math.round(card.getBoundingClientRect().width));
    const routeGrid = document.querySelector(".route-grid");
    return {
      title: document.title,
      clientWidth: viewportWidth,
      scrollWidth,
      wide,
      routeWrapClass: document.querySelector(".routes-with-ad")?.className || "",
      routeGridColumns: routeGrid ? getComputedStyle(routeGrid).gridTemplateColumns : "",
      routeCards,
      eventCards: document.querySelectorAll(".event-card").length,
      monthBlocks: document.querySelectorAll(".month-block").length
    };
  })()`;
}

async function auditLayout() {
  const browser = await resolveBrowser();
  if (!browser) {
    warn("Layout", "Browser audit", "No Chrome or Edge executable was found.", "Run this audit on a machine with Chrome or Edge before AdSense re-review.");
    return;
  }

  const launched = await launchBrowser(browser);
  let connection;
  try {
    connection = await connectWebSocket(launched.debugUrl);
    for (const page of layoutPages) {
      for (const viewport of viewports) {
        const target = await connection.send("Target.createTarget", { url: "about:blank" });
        const attached = await connection.send("Target.attachToTarget", { targetId: target.targetId, flatten: true });
        const sessionId = attached.sessionId;
        await connection.send("Page.enable", {}, sessionId);
        await connection.send("Runtime.enable", {}, sessionId);
        await connection.send("Emulation.setDeviceMetricsOverride", {
          width: viewport.width,
          height: viewport.height,
          deviceScaleFactor: 1,
          mobile: viewport.id === "mobile"
        }, sessionId);
        const loaded = connection.once("Page.loadEventFired", (message) => message.sessionId === sessionId).catch(() => null);
        await connection.send("Page.navigate", { url: new URL(page.path, siteUrl).href }, sessionId);
        await loaded;
        await new Promise((resolve) => setTimeout(resolve, 500));
        const evaluated = await connection.send("Runtime.evaluate", {
          expression: layoutExpression(),
          returnByValue: true
        }, sessionId);
        const result = {
          page: page.label,
          path: page.path,
          viewport: viewport.id,
          ...(evaluated.result?.value || {})
        };
        layoutResults.push(result);

        if (result.scrollWidth > result.clientWidth + 2) {
          fail("Layout", `${page.label} ${viewport.id}`, `Horizontal overflow: ${result.scrollWidth}/${result.clientWidth}.`, "Fix the visible element causing page-wide horizontal scroll.");
        } else if (Array.isArray(result.wide) && result.wide.length) {
          fail("Layout", `${page.label} ${viewport.id}`, `Visible wide elements: ${JSON.stringify(result.wide.slice(0, 2))}`, "Tighten responsive widths for the reported element.");
        } else if (page.routeCheck && result.routeWrapClass.includes("no-ad")) {
          const minWidth = Math.min(...(result.routeCards || [0]));
          const threshold = viewport.id === "mobile" ? 280 : 300;
          if (!result.routeCards?.length || minWidth < threshold) {
            fail("Layout", `${page.label} ${viewport.id}`, `Route cards are too narrow: ${result.routeCards?.join(", ") || "none"}.`, "Keep routes content in the full-width column when the ad rail is hidden.");
          } else {
            pass("Layout", `${page.label} ${viewport.id}`, `No overflow; route cards min width ${minWidth}px.`);
          }
        } else {
          pass("Layout", `${page.label} ${viewport.id}`, `No horizontal overflow at ${result.clientWidth}px.`);
        }
        await connection.send("Target.closeTarget", { targetId: target.targetId });
      }
    }
  } finally {
    try {
      connection?.ws?.close();
    } catch {
      // Ignore close errors.
    }
    launched.child.kill();
    await fs.rm(launched.profileDir, { recursive: true, force: true }).catch(() => {});
  }
}

async function writeReport() {
  const feedDir = path.join(root, "data", "feeds");
  await fs.mkdir(feedDir, { recursive: true });
  const result = {
    generatedAt: new Date().toISOString(),
    siteUrl: siteUrl.href,
    reviewMode,
    summary: {
      pass: checks.filter((check) => check.status === "pass").length,
      warn: checks.filter((check) => check.status === "warn").length,
      fail: checks.filter((check) => check.status === "fail").length
    },
    checks,
    layoutResults
  };
  const jsonOut = path.join(feedDir, `adsense-live-audit-${today}.json`);
  const mdOut = path.join(feedDir, `adsense-live-audit-${today}.md`);
  await fs.writeFile(jsonOut, `${JSON.stringify(result, null, 2)}\n`, "utf8");
  await fs.writeFile(mdOut, `# AdSense Live Audit - ${today}

Site: ${siteUrl.href}

Review mode: ${reviewMode ? "on" : "off"}

Score: ${result.summary.pass} pass / ${result.summary.warn} warn / ${result.summary.fail} fail

| Status | Area | Item | Detail | Next |
| --- | --- | --- | --- | --- |
${checks.map((check) => `| ${check.status} | ${check.area} | ${check.item} | ${String(check.detail).replace(/\|/g, "/")} | ${String(check.next || "").replace(/\|/g, "/")} |`).join("\n")}
`, "utf8");
  console.table(checks.map(({ status, area, item, detail }) => ({ status, area, item, detail })));
  console.log(`Saved AdSense live audit: ${path.relative(root, mdOut)}`);
  if (result.summary.fail) process.exit(1);
}

await auditRequiredPages();
await auditAdsTxt();
await auditAdSenseHead();
await auditSitemapTargets();
await auditAffiliatePause();
await auditHiddenLanguages();
await auditLayout();
await writeReport();
