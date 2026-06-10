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
    pass("Custom HTTPS domain", siteUrl.href);
  } else if (previewHost) {
    fail("Custom HTTPS domain", siteUrl.href, "Use the real custom domain for AdSense review, not a platform preview URL.");
  } else {
    fail("Custom HTTPS domain", siteUrl.href, "SITE_URL must use https://.");
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
  await expectPage("/en/events/bts-city-arirang-busan-2026.html", "Representative event detail", ["Official", "Weather planning", "Map and transit checks"]);
}

const failed = checks.filter((item) => item.status === "fail");
console.table(checks);
if (failed.length) {
  console.error(`Domain live check failed: ${failed.length} issue(s).`);
  process.exit(1);
}

console.log(`Domain live check passed for ${siteUrl.href}`);
