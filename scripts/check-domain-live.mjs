const defaultSiteUrl = "https://kspotnow.com";
const siteUrl = normalizeSiteUrl(process.env.SITE_URL || defaultSiteUrl);
const contactEmail = String(process.env.CONTACT_EMAIL || "contact@kspotnow.com").trim();
const allowPlatformSubdomain = process.env.ALLOW_PLATFORM_SUBDOMAIN === "1";
const timeoutMs = Number(process.env.DOMAIN_CHECK_TIMEOUT_MS || 12000);
const checks = [];

function normalizeSiteUrl(value) {
  try {
    const parsed = new URL(String(value || "").trim());
    parsed.hash = "";
    parsed.search = "";
    parsed.pathname = "/";
    return parsed;
  } catch {
    return null;
  }
}

function add(status, item, detail, next = "") {
  checks.push({ status, item, detail, next });
}

function pass(item, detail) {
  add("pass", item, detail);
}

function fail(item, detail, next) {
  add("fail", item, detail, next);
}

function isPreviewHost(hostname) {
  return /\.(workers\.dev|pages\.dev|netlify\.app|vercel\.app|github\.io)$/i.test(hostname)
    || ["localhost", "127.0.0.1", "example.com", "your-domain.com"].includes(hostname);
}

async function fetchText(pathname) {
  const url = new URL(pathname, siteUrl);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      cache: "no-store",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent": "KSpotNowDomainCheck/1.0"
      }
    });
    const text = await response.text();
    return { url: url.href, status: response.status, ok: response.ok, text };
  } catch (error) {
    return { url: url.href, status: 0, ok: false, text: "", error: error.message };
  } finally {
    clearTimeout(timer);
  }
}

async function expectPage(pathname, label, needles = []) {
  const result = await fetchText(pathname);
  if (!result.ok || result.status !== 200) {
    fail(label, `${result.url} returned ${result.status || result.error || "fetch failed"}`, "Connect the custom domain to the Cloudflare Worker and wait for DNS/SSL propagation.");
    return;
  }
  const missing = needles.filter((needle) => !result.text.includes(needle));
  if (missing.length) {
    fail(label, `${result.url} is missing ${missing.join(", ")}`, "Rebuild with the production SITE_URL and CONTACT_EMAIL, then redeploy.");
    return;
  }
  pass(label, `${result.url} returned 200`);
}

if (!siteUrl) {
  fail("SITE_URL", String(process.env.SITE_URL || ""), "Set SITE_URL to https://kspotnow.com before checking the live domain.");
} else {
  const previewHost = isPreviewHost(siteUrl.hostname);
  if (siteUrl.protocol === "https:" && (!previewHost || allowPlatformSubdomain)) {
    pass("SITE_URL format", siteUrl.href);
  } else if (previewHost) {
    fail("SITE_URL format", siteUrl.href, "Use the real custom domain for AdSense review, not a platform preview URL.");
  } else {
    fail("SITE_URL format", siteUrl.href, "SITE_URL must use https://.");
  }
}

async function fetchRaw(urlString) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(urlString, {
      cache: "no-store",
      redirect: "manual",
      signal: controller.signal,
      headers: { "user-agent": "KSpotNowDomainCheck/1.0" }
    });
    const text = await response.text();
    return { status: response.status, headers: response.headers, text };
  } catch (error) {
    return { status: 0, headers: new Headers(), text: "", error: error.message };
  } finally {
    clearTimeout(timer);
  }
}

async function expectSitemapTargets() {
  const sitemap = await fetchText("/sitemap.xml");
  if (!sitemap.ok || sitemap.status !== 200) return;
  const urls = [...sitemap.text.matchAll(/<loc>(https:\/\/kspotnow\.com[^<]+)<\/loc>/g)].map((match) => match[1]);
  if (!urls.length) {
    fail("Sitemap canonical targets", "No production URLs found in sitemap.xml", "Rebuild the focused editorial sitemap and redeploy.");
    return;
  }

  const results = await Promise.all(urls.map(async (url) => {
    const response = await fetchRaw(url);
    const canonical = response.text.match(/<link rel="canonical" href="([^"]+)">/)?.[1] || "";
    return { url, status: response.status, error: response.error, canonical };
  }));
  const invalid = results.filter((result) => result.status !== 200 || result.canonical !== result.url);
  if (invalid.length) {
    fail(
      "Sitemap canonical targets",
      `${invalid.length}/${results.length} invalid: ${invalid.slice(0, 3).map((item) => `${item.url} -> ${item.status || item.error || 0}, canonical ${item.canonical || "missing"}`).join("; ")}`,
      "Every sitemap URL must return 200 without a redirect and exactly match its canonical tag."
    );
  } else {
    pass("Sitemap canonical targets", `${results.length} URLs return 200 directly and match canonical tags`);
  }
}

async function expectCanonicalRedirect(fromUrl, label) {
  const result = await fetchRaw(fromUrl);
  const location = result.headers.get("location") || "";
  if ([301, 308].includes(result.status) && location.startsWith(`https://${siteUrl.hostname}`)) {
    pass(label, `${fromUrl} -> ${result.status} ${location}`);
  } else {
    fail(label, `${fromUrl} returned ${result.status || result.error || "fetch failed"}${location ? ` -> ${location}` : ""}`, "Deploy the canonicalizing worker and enable Always Use HTTPS in Cloudflare SSL/TLS settings.");
  }
}

if (siteUrl) {
  await expectPage("/", "Home page", ["K-Spot Now", "Live Korea events, pop-ups, and deals for visitors."]);
  await expectPage("/robots.txt", "robots.txt", ["Sitemap:"]);
  await expectPage("/sitemap.xml", "sitemap.xml", ["<urlset", "/en/"]);
  await expectPage("/en/privacy/", "Privacy policy", ["Privacy"]);
  await expectPage("/en/cookie-policy/", "Cookie policy", ["Cookie"]);
  await expectPage("/en/advertising/", "Advertising policy", ["Advertising Policy", "ads cannot buy event inclusion"]);
  await expectPage("/en/contact/", "Contact page", [contactEmail]);
  await expectPage("/en/events/red-velvet-day-in-red-velvet-seoul-2026", "Representative event detail", ["Open Ticketing source", "Place, timing, weather", "What we checked"]);
  await expectPage("/.well-known/security.txt", "security.txt", ["Contact: mailto:"]);
  await expectSitemapTargets();

  if (!isPreviewHost(siteUrl.hostname)) {
    await expectCanonicalRedirect(`http://${siteUrl.hostname}/en/`, "HTTP to HTTPS redirect");
    await expectCanonicalRedirect(`https://www.${siteUrl.hostname}/en/`, "www to apex redirect");

    const secure = await fetchRaw(`${siteUrl.origin}/en/`);
    const hsts = secure.headers.get("strict-transport-security") || "";
    const csp = secure.headers.get("content-security-policy") || "";
    if (hsts) pass("HSTS header", hsts);
    else fail("HSTS header", "Strict-Transport-Security missing on live responses", "Redeploy with the hardened _headers file.");
    if (csp.includes("googlesyndication.com")) pass("CSP header", "present and AdSense-compatible");
    else if (csp) fail("CSP header", "present but missing AdSense domains", "Use the AdSense-compatible CSP from the hardened _headers file.");
    else fail("CSP header", "Content-Security-Policy missing on live responses", "Redeploy with the hardened _headers file.");
  }
}

const failed = checks.filter((item) => item.status === "fail");
console.table(checks);
if (failed.length) {
  console.error(`Domain live check failed: ${failed.length} issue(s).`);
  process.exit(1);
}

console.log(`Domain live check passed for ${siteUrl.href}`);
