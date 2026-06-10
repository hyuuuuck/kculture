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

    const response = await env.ASSETS.fetch(request);
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
