import fs from "node:fs/promises";
import path from "node:path";
import { once } from "node:events";
import { createPreviewServer } from "./preview.mjs";

const dist = path.resolve("dist");
const references = new Map();
let pages = 0;
async function scan(dir) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) await scan(file);
    else if (entry.name.endsWith(".html")) {
      pages += 1;
      const html = await fs.readFile(file, "utf8");
      for (const tag of html.matchAll(/<img\b[^>]*>/gi)) {
        const src = tag[0].match(/\bsrc="([^"]+)"/i)?.[1];
        if (!src || !src.startsWith("/assets/")) throw new Error(`Non-local or absent image: ${file}: ${src}`);
        references.set(src, file);
      }
    }
  }
}
await scan(dist);
if (!references.size) throw new Error("No built image references found");
const server = process.env.PREVIEW_BASE_URL ? null : createPreviewServer(dist);
let base = process.env.PREVIEW_BASE_URL;
if (server) {
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  base = `http://127.0.0.1:${server.address().port}`;
}
const types = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".svg": "image/svg+xml", ".webp": "image/webp", ".gif": "image/gif" };
try {
  for (const [src, page] of references) {
    const relative = decodeURIComponent(new URL(src, base).pathname).replace(/^\/+/, "");
    const file = path.resolve(dist, relative);
    if (!file.startsWith(dist + path.sep)) throw new Error(`Image path outside dist: ${src}`);
    const response = await fetch(new URL(src, base), { signal: AbortSignal.timeout(10000) });
    const received = Buffer.from(await response.arrayBuffer());
    const expected = await fs.readFile(file);
    if (response.status !== 200 || response.headers.get("content-type")?.split(";")[0] !== types[path.extname(file)] || !received.equals(expected)) {
      throw new Error(`Image delivery mismatch: ${src} on ${path.relative(dist, page)} (HTTP ${response.status})`);
    }
  }
  console.log(`Image HTTP delivery passed: ${references.size} unique images referenced by ${pages} built pages; HTTP 200, MIME and exact binary match. Browser decoding is checked separately.`);
} finally {
  if (server) {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
}
