import fs from "node:fs";
import path from "node:path";

const root = path.resolve("dist");
const files = [];
const missing = [];
const attrRe = /(?:href|src)="([^"]+)"/g;

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (entry.name.endsWith(".html")) files.push(file);
  }
}

function targetFor(file, url) {
  const clean = url.split("#")[0].split("?")[0];
  if (!clean || clean === "/") return null;
  let target = clean.startsWith("/") ? path.join(root, clean) : path.resolve(path.dirname(file), clean);
  if (clean.endsWith("/")) target = path.join(target, "index.html");
  return target;
}

walk(root);

for (const file of files) {
  const html = fs.readFileSync(file, "utf8");
  for (const match of html.matchAll(attrRe)) {
    const url = match[1];
    if (/^(https?:|mailto:|tel:|#)/.test(url) || url.startsWith("//")) continue;
    const target = targetFor(file, url);
    if (target && !fs.existsSync(target)) {
      missing.push({
        file: path.relative(root, file),
        url,
        target: path.relative(root, target)
      });
    }
  }
}

if (missing.length) {
  console.error("Missing local href/src targets:");
  console.error(JSON.stringify(missing, null, 2));
  process.exit(1);
}

console.log(`Link validation passed: ${files.length} HTML files, no missing local href/src.`);
