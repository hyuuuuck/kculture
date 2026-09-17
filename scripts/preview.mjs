import { createReadStream } from "node:fs";
import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const defaultRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "dist");
const host = String(process.env.PREVIEW_HOST || "127.0.0.1").trim();
const port = Number.parseInt(process.env.PREVIEW_PORT || "8766", 10);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error(`Invalid PREVIEW_PORT: ${process.env.PREVIEW_PORT}`);
}

const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".gif", "image/gif"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".ics", "text/calendar; charset=utf-8"],
  [".jpeg", "image/jpeg"],
  [".jpg", "image/jpeg"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml; charset=utf-8"],
  [".txt", "text/plain; charset=utf-8"],
  [".ttf", "font/ttf"],
  [".woff2", "font/woff2"],
  [".webmanifest", "application/manifest+json; charset=utf-8"],
  [".webp", "image/webp"],
  [".xml", "application/xml; charset=utf-8"]
]);

function candidates(pathname, root) {
  const relative = pathname.replace(/^\/+/, "");
  const resolved = path.resolve(root, relative);
  if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) return [];

  if (pathname.endsWith("/")) {
    return [path.join(resolved, "index.html"), `${resolved}.html`];
  }
  if (!path.extname(resolved)) {
    return [`${resolved}.html`, path.join(resolved, "index.html")];
  }
  return [resolved];
}

async function firstFile(paths) {
  for (const candidate of paths) {
    try {
      const stat = await fs.stat(candidate);
      if (stat.isFile()) return { file: candidate, size: stat.size };
    } catch {
      // Try the next clean-URL candidate.
    }
  }
  return null;
}

function textResponse(response, status, body) {
  response.writeHead(status, {
    "cache-control": "no-store",
    "content-type": "text/plain; charset=utf-8"
  });
  response.end(body);
}

export function createPreviewServer(root = defaultRoot) {
  return http.createServer(async (request, response) => {
    response.setHeader("x-kspot-preview", "local");
    if (!["GET", "HEAD"].includes(request.method || "")) {
      response.writeHead(405, { allow: "GET, HEAD" });
      response.end();
      return;
    }

    let pathname;
    try {
      pathname = decodeURIComponent(new URL(request.url || "/", `http://${host}:${port}`).pathname);
    } catch {
      textResponse(response, 400, "Bad request");
      return;
    }

    if (pathname === "/") {
      response.writeHead(302, { location: "/en/" });
      response.end();
      return;
    }

    const asset = await firstFile(candidates(pathname, root));
    if (!asset) {
      if (/^\/en\/routes(?:\/|$)/.test(pathname)) {
        textResponse(response, 410, "These route pages have been retired while their source-backed visitor decisions are rewritten. Use /en/guides/ or /en/now/ for the reviewed edition.");
      } else if (/^\/(es|zh|pt|ru|ja|fr|de)(?:\/|$)/.test(pathname)) {
        textResponse(response, 410, "This translated page has been retired while it is re-edited. Use /en/ for the reviewed edition.");
      } else if (/^\/en\/(?:events|guides)\/[^/]+\/?$/.test(pathname)) {
        textResponse(response, 410, "This page has been retired from the reviewed edition. Use /en/guides/ or /en/now/ for current, source-checked information.");
      } else {
        textResponse(response, 404, "Not found");
      }
      return;
    }

    const extension = path.extname(asset.file).toLowerCase();
    response.writeHead(200, {
      "cache-control": "no-store",
      "content-length": asset.size,
      "content-type": contentTypes.get(extension) || "application/octet-stream"
    });
    if (request.method === "HEAD") {
      response.end();
      return;
    }
    const stream = createReadStream(asset.file);
    // A rebuild can replace dist after stat. Never crash the whole preview on
    // one disappearing asset; later requests must still be able to recover.
    stream.on("error", () => response.destroy());
    response.on("close", () => stream.destroy());
    stream.pipe(response);
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  createPreviewServer().listen(port, host, () => {
    console.log(`K-Spot preview: http://${host}:${port}/en/`);
  });
}
