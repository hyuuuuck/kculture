import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { publicLanguageCodes } from "./lib/public-languages.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");
const events = JSON.parse(await fs.readFile(path.join(root, "data", "events.json"), "utf8"));
const languages = publicLanguageCodes();
const scriptRe = /<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/gi;
const dateRe = /^\d{4}-\d{2}-\d{2}$/;
const badTextRe = /[\uFFFD\u7aca\u9e1a\u85e5\u8a1d\u74e6\u8fbb\u9035\u7b60\uf908\ucc30\ucc55\ucc3e]|\?{4,}/;
const eventRichResultCategories = new Set(["festival", "kpop"]);
const errors = [];

function push(file, message) {
  errors.push({ file, message });
}

function relative(file) {
  return path.relative(root, file).replace(/\\/g, "/");
}

function assert(value, file, message) {
  if (!value) push(file, message);
}

function assertUrl(value, file, field) {
  try {
    const parsed = new URL(value);
    assert(["http:", "https:"].includes(parsed.protocol), file, `${field} must be http(s).`);
  } catch {
    push(file, `${field} must be a valid absolute URL.`);
  }
}

function assertDate(value, file, field) {
  const valid = dateRe.test(value || "") && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
  assert(valid, file, `${field} must be an ISO date.`);
}

function structuredNodes(html, file) {
  const nodes = [];
  for (const match of html.matchAll(scriptRe)) {
    try {
      const parsed = JSON.parse(match[1]);
      if (Array.isArray(parsed?.["@graph"])) nodes.push(...parsed["@graph"]);
      else nodes.push(parsed);
    } catch (error) {
      push(file, `JSON-LD script is not parseable: ${error.message}`);
    }
  }
  return nodes;
}

function nodeType(node) {
  return Array.isArray(node?.["@type"]) ? node["@type"] : [node?.["@type"]];
}

function hasType(node, type) {
  return nodeType(node).includes(type);
}

function validateTextField(value, file, field) {
  assert(typeof value === "string" && value.trim(), file, `${field} is required.`);
  if (typeof value === "string" && badTextRe.test(value)) {
    push(file, `${field} appears to contain mojibake or replacement characters.`);
  }
}

function validateEventNode(node, sourceEvent, file, lang) {
  validateTextField(node.name, file, "Event.name");
  validateTextField(node.description, file, "Event.description");
  assertDate(node.startDate, file, "Event.startDate");
  assertDate(node.endDate, file, "Event.endDate");
  if (dateRe.test(node.startDate || "") && dateRe.test(node.endDate || "")) {
    assert(node.startDate <= node.endDate, file, "Event.startDate must not be after Event.endDate.");
  }
  assert(node.startDate === sourceEvent.startDate, file, "Event.startDate must match data/events.json.");
  assert(node.endDate === sourceEvent.endDate, file, "Event.endDate must match data/events.json.");
  assert(node["@id"] === `${node.url}#event`, file, "Event.@id should identify the event on the detail page.");
  assert(node.eventAttendanceMode === "https://schema.org/OfflineEventAttendanceMode", file, "Event.eventAttendanceMode should be OfflineEventAttendanceMode.");
  assert(node.eventStatus === "https://schema.org/EventScheduled", file, "Event.eventStatus should be EventScheduled unless officially changed.");
  assert(node.inLanguage === lang, file, "Event.inLanguage must match page language.");

  if (Array.isArray(node.image)) {
    assert(node.image.length > 0, file, "Event.image must not be empty.");
    for (const image of node.image) assertUrl(image, file, "Event.image");
  } else {
    assertUrl(node.image, file, "Event.image");
  }
  assertUrl(node.url, file, "Event.url");
  assert(hasType(node.mainEntityOfPage, "WebPage"), file, "Event.mainEntityOfPage must be a WebPage.");
  assert(node.mainEntityOfPage?.["@id"] === node.url, file, "Event.mainEntityOfPage.@id must match Event.url.");
  assertUrl(node.sameAs, file, "Event.sameAs");
  assert(node.sameAs === sourceEvent.sourceUrl, file, "Event.sameAs must point to the official source URL.");

  assert(hasType(node.location, "Place"), file, "Event.location must be a Place.");
  validateTextField(node.location?.name, file, "Event.location.name");
  assert(hasType(node.location?.address, "PostalAddress"), file, "Event.location.address must be PostalAddress.");
  assert(node.location?.address?.addressCountry === "KR", file, "Event.location.address.addressCountry must be KR.");
  validateTextField(node.location?.address?.addressLocality, file, "Event.location.address.addressLocality");
  validateTextField(node.location?.address?.streetAddress, file, "Event.location.address.streetAddress");

  assert(hasType(node.organizer, "Organization"), file, "Event.organizer must be an Organization.");
  validateTextField(node.organizer?.name, file, "Event.organizer.name");
  assertUrl(node.organizer?.url, file, "Event.organizer.url");
}

function validateWebPageNode(node, sourceEvent, file, lang) {
  validateTextField(node.name, file, "WebPage.name");
  validateTextField(node.description, file, "WebPage.description");
  assertUrl(node.url, file, "WebPage.url");
  assert(node["@id"] === `${node.url}#webpage`, file, "WebPage.@id should identify the detail page.");
  assert(node.inLanguage === lang, file, "WebPage.inLanguage must match page language.");
  assertDate(node.dateModified, file, "WebPage.dateModified");
  assert(node.dateModified === sourceEvent.lastChecked, file, "WebPage.dateModified must match event lastChecked.");
  assert(hasType(node.primaryImageOfPage, "ImageObject"), file, "WebPage.primaryImageOfPage must be an ImageObject.");
  assertUrl(node.primaryImageOfPage?.url, file, "WebPage.primaryImageOfPage.url");
  assert(hasType(node.about, "Thing"), file, "WebPage.about must be a Thing.");
  validateTextField(node.about?.name, file, "WebPage.about.name");
  assert(hasType(node.isPartOf, "WebSite"), file, "WebPage.isPartOf must be a WebSite.");
  validateTextField(node.isPartOf?.name, file, "WebPage.isPartOf.name");
  assertUrl(node.isPartOf?.url, file, "WebPage.isPartOf.url");
  assertUrl(node.sameAs, file, "WebPage.sameAs");
  assert(node.sameAs === sourceEvent.sourceUrl, file, "WebPage.sameAs must point to the official source URL.");
}

function validateBreadcrumbNode(node, file) {
  assert(Array.isArray(node.itemListElement), file, "BreadcrumbList.itemListElement must be present.");
  assert(node.itemListElement?.length >= 3, file, "BreadcrumbList should include home, section, and current page.");
  for (const [index, item] of (node.itemListElement || []).entries()) {
    assert(item.position === index + 1, file, "BreadcrumbList positions must be sequential.");
    validateTextField(item.name, file, `BreadcrumbList.itemListElement[${index}].name`);
    assertUrl(item.item, file, `BreadcrumbList.itemListElement[${index}].item`);
  }
}

for (const lang of languages) {
  for (const event of events) {
    const file = path.join(dist, lang, "events", `${event.slug}.html`);
    const id = relative(file);
    let html = "";
    try {
      html = await fs.readFile(file, "utf8");
    } catch {
      push(id, "Event detail page is missing from dist.");
      continue;
    }

    const nodes = structuredNodes(html, id);
    const shouldUseEventSchema = eventRichResultCategories.has(event.category);
    const eventNode = nodes.find((node) => hasType(node, "Event"));
    const webPageNode = nodes.find((node) => hasType(node, "WebPage"));
    const breadcrumbNode = nodes.find((node) => hasType(node, "BreadcrumbList"));
    if (shouldUseEventSchema) {
      assert(eventNode, id, "Event JSON-LD node is missing.");
      if (eventNode) validateEventNode(eventNode, event, id, lang);
    } else {
      assert(!eventNode, id, "Deal and shopping information pages should not use Event JSON-LD.");
      assert(webPageNode, id, "WebPage JSON-LD node is missing.");
      if (webPageNode) validateWebPageNode(webPageNode, event, id, lang);
    }
    assert(breadcrumbNode, id, "BreadcrumbList JSON-LD node is missing.");
    if (breadcrumbNode) validateBreadcrumbNode(breadcrumbNode, id);
  }
}

if (errors.length) {
  console.error("Structured data validation failed:");
  console.error(JSON.stringify(errors, null, 2));
  process.exit(1);
}

const eventPageCount = events.filter((event) => eventRichResultCategories.has(event.category)).length * languages.length;
const webPageCount = events.filter((event) => !eventRichResultCategories.has(event.category)).length * languages.length;
console.log(`Structured data validation passed: ${eventPageCount} event-rich pages use Event JSON-LD and ${webPageCount} shopping/info pages use WebPage JSON-LD.`);
