import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const sitemapPath = path.join(root, "dist", "sitemap.xml");
const events = JSON.parse(fs.readFileSync(path.join(root, "data", "events.json"), "utf8"));
const languages = ["en", "es", "zh", "pt", "ru", "ja"];
const errors = [];

if (!fs.existsSync(sitemapPath)) {
  errors.push("dist/sitemap.xml is missing. Run npm run build first.");
} else {
  const xml = fs.readFileSync(sitemapPath, "utf8");
  if (!xml.includes('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"')) {
    errors.push("sitemap.xml is missing the sitemap namespace.");
  }
  if (!xml.includes('xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"')) {
    errors.push("sitemap.xml is missing the image sitemap namespace.");
  }

  const invalidChar = xml.match(/[^\u0009\u000a\u000d\u0020-\ud7ff\ue000-\ufffd]/u);
  if (invalidChar) errors.push(`sitemap.xml contains an invalid XML character near index ${invalidChar.index}.`);

  const stack = [];
  for (const match of xml.matchAll(/<([^>]+)>/g)) {
    const raw = match[1].trim();
    if (!raw || raw.startsWith("?") || raw.startsWith("!")) continue;
    if (raw.endsWith("/")) continue;

    if (raw.startsWith("/")) {
      const name = raw.slice(1).trim().split(/\s+/)[0];
      const open = stack.pop();
      if (open !== name) {
        errors.push(`sitemap.xml tag mismatch: expected </${open || "(none)"}> but found </${name}> near index ${match.index}.`);
        break;
      }
    } else {
      stack.push(raw.split(/\s+/)[0]);
    }
  }
  if (stack.length) errors.push(`sitemap.xml has unclosed tags: ${stack.slice(-5).join(", ")}.`);

  const imageCount = (xml.match(/<image:image>/g) || []).length;
  const expectedImages = events.length * languages.length;
  if (imageCount !== expectedImages) {
    errors.push(`sitemap.xml should contain ${expectedImages} image entries for multilingual event pages; found ${imageCount}.`);
  }
}

if (errors.length) {
  console.error("Sitemap validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Sitemap validation passed: ${events.length * languages.length} image entries.`);
