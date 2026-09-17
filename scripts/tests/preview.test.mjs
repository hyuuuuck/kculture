import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { once } from "node:events";
import { createPreviewServer } from "../preview.mjs";

test("preview serves binary assets, does not cache broken responses, and survives missing files", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "kspot-preview-test-"));
  const server = createPreviewServer(root);
  try {
    await fs.mkdir(path.join(root, "en"));
    await fs.mkdir(path.join(root, "assets"));
    await fs.writeFile(path.join(root, "en", "index.html"), "<h1>Preview fixture</h1>");
    await fs.writeFile(path.join(root, "en", "article.html"), "<h1>Article fixture</h1>");
    const bytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0, 0xff]);
    await fs.writeFile(path.join(root, "assets", "sample.png"), bytes);
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    const base = `http://127.0.0.1:${server.address().port}`;
    const image = await fetch(`${base}/assets/sample.png`);
    assert.equal(image.status, 200);
    assert.equal(image.headers.get("content-type"), "image/png");
    assert.equal(image.headers.get("cache-control"), "no-store");
    assert.deepEqual(Buffer.from(await image.arrayBuffer()), bytes);
    const head = await fetch(`${base}/assets/sample.png`, { method: "HEAD" });
    assert.equal(head.headers.get("content-length"), String(bytes.length));
    assert.equal((await head.arrayBuffer()).byteLength, 0);
    await fs.unlink(path.join(root, "assets", "sample.png"));
    assert.equal((await fetch(`${base}/assets/sample.png`)).status, 404);
    const home = await fetch(`${base}/en/`);
    assert.equal(home.status, 200);
    assert.equal(home.headers.get("x-kspot-preview"), "local");
    assert.equal((await fetch(`${base}/en/article/`)).status, 200);
    assert.equal((await fetch(`${base}/en/events/retired-event`)).status, 410);
    assert.equal((await fetch(`${base}/en/guides/retired-guide/`)).status, 410);
    assert.equal((await fetch(`${base}/en/unrelated-missing`)).status, 404);
    assert.equal((await fetch(`${base}/en/`, { method: "POST" })).status, 405);
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
    await fs.rm(root, { recursive: true, force: true });
  }
});
