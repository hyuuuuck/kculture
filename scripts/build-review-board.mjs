import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { todayString } from "./lib/date.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const feedDir = path.join(root, "data", "feeds");
const today = todayString();
const imageCache = new Map();

async function latestDraftFile() {
  const entries = await fs.readdir(feedDir, { withFileTypes: true }).catch(() => []);
  const drafts = entries
    .filter((entry) => entry.isFile() && /^draft-events-\d{4}-\d{2}-\d{2}\.json$/.test(entry.name))
    .map((entry) => entry.name)
    .sort();
  return drafts.length ? path.join(feedDir, drafts.at(-1)) : null;
}

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function compact(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function cleanMergeCandidate(draft) {
  const { needsReview, reviewChecklist, evidence, ...event } = draft;
  return {
    ...event,
    verification: "official",
    district: event.district === "Needs editor review" ? "" : event.district
  };
}

async function dataUri(assetPath) {
  if (!assetPath) return "";
  if (imageCache.has(assetPath)) return imageCache.get(assetPath);
  const file = path.join(root, assetPath);
  try {
    const bytes = await fs.readFile(file);
    const ext = path.extname(file).toLowerCase();
    const mime = ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";
    const uri = `data:${mime};base64,${bytes.toString("base64")}`;
    imageCache.set(assetPath, uri);
    return uri;
  } catch {
    return "";
  }
}

function evidenceText(draft) {
  const snippets = (draft.evidence?.snippets || []).map(compact).filter(Boolean);
  if (!snippets.length) return "<p>No snippets captured. Open the official source manually.</p>";
  return snippets.map((snippet) => `<p>${esc(snippet)}</p>`).join("");
}

function dateSignals(draft) {
  const signals = draft.evidence?.dateSignals || [];
  if (!signals.length) return "<span class=\"muted\">No date signals</span>";
  return signals.slice(0, 8).map((signal) => `<span class=\"date-chip\">${esc(signal.date)}</span>`).join("");
}

async function card(draft, index) {
  const image = await dataUri(draft.thumbnail);
  const mergeJson = JSON.stringify(cleanMergeCandidate(draft), null, 2);
  const draftJson = JSON.stringify(draft, null, 2);
  return `
    <article class="card" data-category="${esc(draft.category)}" data-text="${esc(`${draft.title?.en} ${draft.sourceName} ${draft.category} ${draft.city}`.toLowerCase())}">
      <div class="thumb">${image ? `<img src="${image}" alt="">` : `<span>No image</span>`}</div>
      <div class="card-body">
        <div class="meta">
          <span class="rank">#${index + 1}</span>
          <span>${esc(draft.category)}</span>
          <span>${esc(draft.city)}</span>
          <span>Priority ${esc(draft.priority)}</span>
        </div>
        <h2>${esc(draft.title?.en || draft.slug)}</h2>
        <p class="summary">${esc(draft.summary?.en)}</p>
        <dl>
          <div><dt>Dates</dt><dd>${esc(draft.startDate)} to ${esc(draft.endDate)}</dd></div>
          <div><dt>Source</dt><dd><a href="${esc(draft.sourceUrl)}" target="_blank" rel="noreferrer">${esc(draft.sourceName)}</a></dd></div>
          <div><dt>Slug</dt><dd><code>${esc(draft.slug)}</code></dd></div>
        </dl>
        <div class="signals">${dateSignals(draft)}</div>
        <details>
          <summary>Review checklist</summary>
          <ul>${(draft.reviewChecklist || []).map((item) => `<li>${esc(item)}</li>`).join("")}</ul>
        </details>
        <details>
          <summary>Evidence snippets</summary>
          <div class="snippets">${evidenceText(draft)}</div>
        </details>
        <div class="actions">
          <button type="button" data-copy="merge-${index}">Copy reviewed-event JSON</button>
          <button type="button" data-copy="draft-${index}">Copy full draft JSON</button>
          <a href="${esc(draft.sourceUrl)}" target="_blank" rel="noreferrer">Open official source</a>
        </div>
        <script type="application/json" id="merge-${index}">${esc(mergeJson)}</script>
        <script type="application/json" id="draft-${index}">${esc(draftJson)}</script>
      </div>
    </article>`;
}

const draftFile = await latestDraftFile();
if (!draftFile) {
  console.error("No draft-events feed found. Run npm run draft:events first.");
  process.exit(1);
}

const payload = JSON.parse(await fs.readFile(draftFile, "utf8"));
const drafts = payload.drafts || [];
const categories = [...new Set(drafts.map((draft) => draft.category))].sort();
const cards = [];
for (let index = 0; index < drafts.length; index += 1) {
  cards.push(await card(drafts[index], index));
}

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Korea Now Guide Review Board</title>
  <style>
    :root {
      --bg: #f7f4ee;
      --ink: #162127;
      --muted: #64727c;
      --line: #ded8ce;
      --panel: #fffdfa;
      --accent: #0d7f75;
      --accent-ink: #073f3a;
      --warn: #b8652b;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: var(--bg);
      color: var(--ink);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      line-height: 1.45;
    }
    header {
      padding: 28px clamp(18px, 4vw, 54px);
      border-bottom: 1px solid var(--line);
      background: #fffaf2;
      position: sticky;
      top: 0;
      z-index: 10;
    }
    h1 { margin: 0 0 8px; font-size: clamp(1.6rem, 3vw, 2.7rem); }
    header p { margin: 0; color: var(--muted); max-width: 980px; }
    .toolbar {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: center;
      margin-top: 18px;
    }
    input {
      min-width: min(100%, 320px);
      flex: 1;
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 11px 12px;
      font: inherit;
      background: white;
      color: var(--ink);
    }
    button, .filter {
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 10px 12px;
      background: white;
      color: var(--ink);
      font: inherit;
      cursor: pointer;
    }
    button:hover, .filter:hover, .filter.active {
      border-color: rgba(13, 127, 117, 0.55);
      background: #eff9f5;
      color: var(--accent-ink);
    }
    main {
      padding: 26px clamp(18px, 4vw, 54px) 48px;
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 12px;
      margin-bottom: 18px;
    }
    .stat {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 14px;
    }
    .stat strong { display: block; font-size: 1.5rem; }
    .stat span { color: var(--muted); font-size: 0.86rem; }
    .grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 18px;
    }
    .card {
      display: grid;
      grid-template-columns: 180px minmax(0, 1fr);
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 8px;
      overflow: hidden;
    }
    .thumb {
      min-height: 100%;
      background: #e8edea;
    }
    .thumb img {
      width: 100%;
      height: 100%;
      min-height: 240px;
      object-fit: cover;
      display: block;
    }
    .card-body { padding: 18px; min-width: 0; }
    .meta, .signals, .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
    }
    .meta span, .date-chip {
      border: 1px solid #dbe6e0;
      border-radius: 999px;
      padding: 4px 8px;
      color: var(--muted);
      font-size: 0.8rem;
      background: #f6fbf8;
    }
    .rank { color: var(--accent-ink) !important; font-weight: 700; }
    h2 {
      margin: 12px 0 8px;
      font-size: 1.15rem;
      line-height: 1.25;
    }
    .summary { margin: 0 0 12px; color: #42515b; }
    dl {
      display: grid;
      gap: 8px;
      margin: 12px 0;
    }
    dl div {
      display: grid;
      grid-template-columns: 84px minmax(0, 1fr);
      gap: 8px;
    }
    dt { color: var(--muted); font-size: 0.84rem; }
    dd { margin: 0; min-width: 0; overflow-wrap: anywhere; }
    a { color: var(--accent-ink); font-weight: 700; }
    code {
      background: #f0ece4;
      border-radius: 6px;
      padding: 2px 5px;
      overflow-wrap: anywhere;
    }
    details {
      margin-top: 12px;
      border-top: 1px solid var(--line);
      padding-top: 10px;
    }
    summary { cursor: pointer; font-weight: 700; }
    li { margin: 6px 0; }
    .snippets p {
      margin: 10px 0;
      color: #42515b;
      font-size: 0.9rem;
    }
    .actions { margin-top: 14px; }
    .actions a {
      display: inline-flex;
      align-items: center;
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 10px 12px;
      background: #12202a;
      color: white;
      text-decoration: none;
    }
    .muted { color: var(--muted); }
    .hidden { display: none; }
    .toast {
      position: fixed;
      right: 18px;
      bottom: 18px;
      background: #12202a;
      color: white;
      padding: 12px 14px;
      border-radius: 8px;
      box-shadow: 0 14px 34px rgba(0,0,0,0.16);
      opacity: 0;
      transform: translateY(12px);
      transition: 180ms ease;
    }
    .toast.show { opacity: 1; transform: translateY(0); }
    @media (max-width: 980px) {
      .grid, .stats { grid-template-columns: 1fr; }
      .card { grid-template-columns: 1fr; }
      .thumb img { aspect-ratio: 16 / 8; min-height: 0; }
    }
  </style>
</head>
<body>
  <header>
    <h1>Korea Now Guide Review Board</h1>
    <p>Non-public editorial board generated from official-source draft candidates. Open the official source, verify date, venue, eligibility, inventory and rights, then rewrite before publishing.</p>
    <div class="toolbar">
      <input id="search" type="search" placeholder="Search title, source, city, category">
      <button class="filter active" type="button" data-filter="all">All</button>
      ${categories.map((category) => `<button class="filter" type="button" data-filter="${esc(category)}">${esc(category)}</button>`).join("")}
    </div>
  </header>
  <main>
    <section class="stats" aria-label="Review stats">
      <div class="stat"><strong>${esc(drafts.length)}</strong><span>drafts</span></div>
      <div class="stat"><strong>${esc(categories.length)}</strong><span>categories</span></div>
      <div class="stat"><strong>${esc(payload.sourceFeed)}</strong><span>source feed</span></div>
      <div class="stat"><strong>${esc(new Date(payload.generatedAt).toISOString().slice(0, 10))}</strong><span>generated</span></div>
    </section>
    <section id="grid" class="grid">
      ${cards.join("")}
    </section>
  </main>
  <div id="toast" class="toast" role="status">Copied</div>
  <script>
    const search = document.querySelector("#search");
    const filters = [...document.querySelectorAll("[data-filter]")];
    const cards = [...document.querySelectorAll(".card")];
    const toast = document.querySelector("#toast");
    let currentFilter = "all";

    function applyFilters() {
      const query = search.value.trim().toLowerCase();
      cards.forEach((card) => {
        const categoryOk = currentFilter === "all" || card.dataset.category === currentFilter;
        const textOk = !query || card.dataset.text.includes(query);
        card.classList.toggle("hidden", !(categoryOk && textOk));
      });
    }

    filters.forEach((button) => {
      button.addEventListener("click", () => {
        currentFilter = button.dataset.filter;
        filters.forEach((item) => item.classList.toggle("active", item === button));
        applyFilters();
      });
    });

    search.addEventListener("input", applyFilters);

    document.addEventListener("click", async (event) => {
      const button = event.target.closest("[data-copy]");
      if (!button) return;
      const node = document.getElementById(button.dataset.copy);
      if (!node) return;
      await navigator.clipboard.writeText(node.textContent);
      toast.classList.add("show");
      window.setTimeout(() => toast.classList.remove("show"), 1200);
    });
  </script>
</body>
</html>
`;

const out = path.join(feedDir, `review-board-${today}.html`);
await fs.writeFile(out, html, "utf8");
console.log(`Saved review board: ${out}`);
