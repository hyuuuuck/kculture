import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { setTimeout } from "node:timers/promises";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const host = process.env.PREVIEW_HOST || "127.0.0.1";
const port = Number(process.env.PREVIEW_PORT || 8766);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Invalid PREVIEW_PORT");
const url = `http://${host}:${port}/en/`;
async function ready() {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(1000) });
    if (response.headers.get("x-kspot-preview") !== "local") throw new Error("Port is occupied by another service; it was not stopped.");
    if (!response.ok) throw new Error("Preview is running but the built home is unavailable. Run npm run build.");
    await response.body?.cancel();
    return true;
  } catch (error) {
    if (error.message.startsWith("Port is") || error.message.startsWith("Preview is")) throw error;
    return false;
  }
}
if (await ready()) {
  console.log(`K-Spot preview already running: ${url}`);
} else {
  if (!fs.existsSync(path.join(root, "dist", "en", "index.html"))) throw new Error("Run npm run build before starting the preview.");
  const log = path.join(os.tmpdir(), `kspot-preview-${port}.log`);
  const fd = fs.openSync(log, "a");
  const child = spawn(process.execPath, [path.join(root, "scripts", "preview.mjs")], {
    cwd: root, env: process.env, detached: true, stdio: ["ignore", fd, fd]
  });
  child.unref();
  fs.closeSync(fd);
  let started = false;
  for (let attempt = 0; attempt < 15; attempt += 1) {
    await setTimeout(200);
    if (await ready()) { started = true; break; }
  }
  if (!started) throw new Error(`Preview did not start. See ${log}`);
  console.log(`K-Spot preview: ${url}\nBackground PID: ${child.pid}\nLog: ${log}`);
}
