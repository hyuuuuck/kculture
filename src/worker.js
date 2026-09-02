const canonicalHost = "kspotnow.com";

const mergedGuidePaths = new Map([
  ["/en/guides/korea-duty-free-before-flight", "/en/guides/tax-refund-payments-korea-shopping"],
  ["/en/guides/department-store-popup-planning", "/en/guides/how-to-verify-korea-popups"],
  ["/en/guides/kpop-ticket-merch-safety", "/en/guides/how-to-verify-korea-popups"]
]);

function retiredResponse(retiredLanguagePath = false) {
  const message = retiredLanguagePath
    ? "This translated page has been retired while it is re-edited. Use /en/ for the reviewed edition."
    : "This page has been retired from the reviewed edition. Use /en/guides/ or /en/now/ for current, source-checked information.";
  return new Response(message, {
    status: 410,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600"
    }
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Canonicalize scheme and host before serving assets: plain HTTP and the
    // www subdomain both 301 to the canonical HTTPS apex.
    if (url.hostname === `www.${canonicalHost}` || (url.hostname === canonicalHost && url.protocol === "http:")) {
      url.protocol = "https:";
      url.hostname = canonicalHost;
      return Response.redirect(url.toString(), 301);
    }

    if (url.pathname === "/") {
      return Response.redirect(`${url.origin}/en/`, 301);
    }

    // Search Console still contains both legacy `.html` URLs and their
    // extensionless canonicals. Collapse every HTML variant before the asset
    // lookup so Google sees one URL rather than two copies of the same page.
    if (url.pathname.endsWith("/index.html")) {
      url.pathname = url.pathname.slice(0, -"index.html".length);
      return Response.redirect(url.toString(), 301);
    }
    if (url.pathname.endsWith(".html")) {
      url.pathname = url.pathname.slice(0, -".html".length);
      return Response.redirect(url.toString(), 301);
    }

    const normalizedPath = url.pathname.length > 1 ? url.pathname.replace(/\/$/, "") : url.pathname;
    const mergedGuideTarget = mergedGuidePaths.get(normalizedPath);
    if (mergedGuideTarget) {
      url.pathname = `${mergedGuideTarget}/`;
      return Response.redirect(url.toString(), 301);
    }

    // Entire withdrawn sections must be rejected before asset lookup. This
    // prevents a stale Cloudflare asset from keeping an old thin page at 200
    // after the reviewed edition has removed it from the current manifest.
    const retiredLanguagePath = /^\/(es|zh|pt|ru|ja|fr|de)(?:\/|$)/.test(url.pathname);
    const retiredRoutePath = /^\/en\/routes(?:\/|$)/.test(url.pathname);
    const retiredBrowsePath = /^\/en\/(?:categories|cities)(?:\/|$)/.test(url.pathname);
    const retiredOperationsPath = /^\/en\/(?:sources|watchlist|freshness)(?:\/|$)/.test(url.pathname);
    const retiredSectionPath = retiredLanguagePath || retiredRoutePath || retiredBrowsePath || retiredOperationsPath;
    if (retiredSectionPath) return retiredResponse(retiredLanguagePath);

    // The editorial HTML must come from the current asset manifest. A
    // no-store subrequest prevents an older edge copy from surviving a
    // validated content or monetization release.
    const response = await env.ASSETS.fetch(request, { cache: "no-store" });
    const retiredEditorialPath = /^\/en\/(?:events|guides)\/[^/]+\/?$/.test(url.pathname);
    if (response.status === 404 && retiredEditorialPath) return retiredResponse();
    const headers = new Headers(response.headers);
    const contentType = headers.get("content-type") || "";

    if (contentType.toLowerCase().startsWith("text/html") || url.pathname.endsWith(".html")) {
      headers.set("content-type", "text/html; charset=utf-8");
      // HTML carries editorial dates, AdSense consent state, and the current
      // approved catalog. Do not let an edge copy outlive a deployment.
      headers.set("cache-control", "no-cache, must-revalidate");
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  }
};
