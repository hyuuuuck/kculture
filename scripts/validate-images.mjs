import fs from "node:fs";
import path from "node:path";

const root = path.resolve(".");
const dist = path.join(root, "dist");
const events = JSON.parse(fs.readFileSync(path.join(root, "data", "events.json"), "utf8"));
const languages = ["en", "es", "zh", "pt", "ru", "ja"];
const errors = [];
const warnings = [];
const checkedImages = new Map();
const allowedExt = new Set([".jpg", ".jpeg", ".png", ".webp"]);

function push(list, id, message) {
  list.push({ id, message });
}

function cleanLocalUrl(value) {
  const url = String(value || "").trim();
  if (!url || /^(https?:|mailto:|tel:|#|data:)/i.test(url) || url.startsWith("//")) return "";
  return url.split("#")[0].split("?")[0].replace(/^\/+/, "");
}

function imageInfo(file) {
  const cached = checkedImages.get(file);
  if (cached) return cached;

  const buffer = fs.readFileSync(file);
  const info = { type: "unknown", width: null, height: null, bytes: buffer.length };

  if (buffer.length >= 24 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    info.type = "png";
    info.width = buffer.readUInt32BE(16);
    info.height = buffer.readUInt32BE(20);
  } else if (buffer.length >= 12 && buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP") {
    info.type = "webp";
  } else if (buffer.length >= 4 && buffer[0] === 0xff && buffer[1] === 0xd8) {
    info.type = "jpg";
    let offset = 2;
    while (offset + 9 < buffer.length) {
      if (buffer[offset] !== 0xff) {
        offset += 1;
        continue;
      }
      while (buffer[offset] === 0xff) offset += 1;
      const marker = buffer[offset];
      offset += 1;
      if (marker === 0xd9 || marker === 0xda) break;
      const length = buffer.readUInt16BE(offset);
      if (length < 2 || offset + length > buffer.length) break;
      if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
        info.height = buffer.readUInt16BE(offset + 3);
        info.width = buffer.readUInt16BE(offset + 5);
        break;
      }
      offset += length;
    }
  }

  checkedImages.set(file, info);
  return info;
}

function requireImage(relativeUrl, context, { eventThumbnail = false } = {}) {
  const clean = cleanLocalUrl(relativeUrl);
  if (!clean) {
    push(errors, context, "image must use a local project asset");
    return null;
  }

  if (eventThumbnail && !clean.startsWith("assets/")) {
    push(errors, context, `event thumbnail should live under assets/: ${relativeUrl}`);
  }

  const ext = path.extname(clean).toLowerCase();
  if (!allowedExt.has(ext)) {
    push(errors, context, `unsupported image extension: ${relativeUrl}`);
  }

  const file = path.resolve(root, clean);
  if (!file.startsWith(root)) {
    push(errors, context, `image escapes project root: ${relativeUrl}`);
    return null;
  }

  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
    push(errors, context, `image file is missing: ${relativeUrl}`);
    return null;
  }

  const info = imageInfo(file);
  if (info.type === "unknown") {
    push(errors, context, `image file is not a recognized PNG/JPEG/WebP asset: ${relativeUrl}`);
  }
  if (info.bytes < 1024) {
    push(errors, context, `image file is suspiciously small: ${relativeUrl}`);
  }
  if (info.width !== null && info.height !== null && (info.width < 240 || info.height < 140)) {
    push(errors, context, `image is too small for a gallery thumbnail: ${relativeUrl} (${info.width}x${info.height})`);
  }
  if (info.width === null || info.height === null) {
    push(warnings, context, `could not read image dimensions for ${relativeUrl}; signature was ${info.type}`);
  }

  return info;
}

function walkHtml(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walkHtml(file, files);
    else if (entry.name.endsWith(".html")) files.push(file);
  }
  return files;
}

function attrsFromTag(tag) {
  const attrs = {};
  for (const match of tag.matchAll(/([:\w-]+)\s*=\s*"([^"]*)"/g)) {
    attrs[match[1].toLowerCase()] = match[2];
  }
  return attrs;
}

for (const event of events) {
  if (!event.thumbnail) {
    push(errors, event.slug || "event", "thumbnail is required");
    continue;
  }
  requireImage(event.thumbnail, `event:${event.slug}`, { eventThumbnail: true });
}

if (!fs.existsSync(dist)) {
  push(errors, "dist", "dist/ is missing; run npm.cmd run build before image validation");
} else {
  const htmlFiles = walkHtml(dist);
  for (const lang of languages) {
    const home = path.join(dist, lang, "index.html");
    if (!fs.existsSync(home)) {
      push(errors, `gallery:${lang}`, "localized gallery page is missing.");
      continue;
    }
    const homeHtml = fs.readFileSync(home, "utf8");
    const overlayCount = (homeHtml.match(/class="thumb-overlay"/g) || []).length;
    const brandCount = (homeHtml.match(/class="thumb-brand"/g) || []).length;
    if (overlayCount < events.length || brandCount < events.length) {
      push(errors, `gallery:${lang}`, `event gallery should show brand/source overlays on every thumbnail; found ${overlayCount} overlays and ${brandCount} brand labels for ${events.length} events.`);
    }
  }
  for (const file of htmlFiles) {
    const html = fs.readFileSync(file, "utf8");
    for (const match of html.matchAll(/<img\b[^>]*>/gi)) {
      const tag = match[0];
      const attrs = attrsFromTag(tag);
      const context = `html:${path.relative(dist, file)}:${match.index}`;
      if (!attrs.src) {
        push(errors, context, "img tag is missing src");
        continue;
      }
      if (cleanLocalUrl(attrs.src)) {
        requireImage(attrs.src, context);
      }
      const decorative = attrs["aria-hidden"] === "true" || attrs.role === "presentation";
      if (!decorative && !String(attrs.alt || "").trim()) {
        push(errors, context, `non-decorative image needs useful alt text: ${attrs.src}`);
      }
    }
  }
}

if (errors.length) {
  console.error("Image validation failed:");
  console.error(JSON.stringify(errors, null, 2));
  process.exit(1);
}

if (warnings.length) {
  console.warn("Image validation warnings:");
  console.warn(JSON.stringify(warnings, null, 2));
}

const uniqueImages = checkedImages.size;
console.log(`Image validation passed: ${events.length} event thumbnails, ${uniqueImages} unique local image assets.`);
