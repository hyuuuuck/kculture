export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);
    const headers = new Headers(response.headers);
    const url = new URL(request.url);
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
