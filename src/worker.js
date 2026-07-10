const canonicalHost = "kspotnow.com";

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

    const response = await env.ASSETS.fetch(request);
    const retiredLanguagePath = /^\/(es|zh|pt|ru|ja|fr|de)(?:\/|$)/.test(url.pathname);
    if (response.status === 404 && retiredLanguagePath) {
      return new Response("This translated page has been retired while it is re-edited. Use /en/ for the reviewed edition.", {
        status: 410,
        headers: {
          "content-type": "text/plain; charset=utf-8",
          "cache-control": "public, max-age=3600"
        }
      });
    }
    const headers = new Headers(response.headers);
    const contentType = headers.get("content-type") || "";

    if (contentType.toLowerCase().startsWith("text/html") || url.pathname.endsWith(".html")) {
      headers.set("content-type", "text/html; charset=utf-8");
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  }
};
