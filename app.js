const galleryScopes = [...document.querySelectorAll("[data-gallery-scope]")];

for (const scope of galleryScopes) {
  const cards = [...scope.querySelectorAll("[data-card]")];
  if (!cards.length) continue;

  const filterRoot = scope.querySelector("[data-filters]");
  const searchInput = scope.querySelector("[data-gallery-search]");
  const statusSelect = scope.querySelector("[data-status-filter]");
  const citySelect = scope.querySelector("[data-city-filter]");
  const clearButton = scope.querySelector("[data-clear-filters]");
  const resultCount = scope.querySelector("[data-result-count]");
  const noResults = scope.querySelector("[data-no-results]");
  const controls = scope.querySelector("[data-gallery-controls]");
  const groups = [...scope.querySelectorAll("[data-filter-group]")];
  const countTemplate = controls?.dataset.countTemplate || "{count} events shown";
  const countOneTemplate = controls?.dataset.countOneTemplate || "1 event shown";

  let selectedCategory = filterRoot?.querySelector("[data-filter][aria-pressed='true']")?.dataset.filter || "all";

  function applyFilters() {
    const query = (searchInput?.value || "").trim().toLowerCase();
    const selectedStatus = statusSelect?.value || "all";
    const selectedCity = citySelect?.value || "all";
    let visibleCount = 0;

    for (const card of cards) {
      const categoryMatch = selectedCategory === "all" || card.dataset.category === selectedCategory;
      const statusMatch = selectedStatus === "all" || card.dataset.status === selectedStatus;
      const cityMatch = selectedCity === "all" || card.dataset.city === selectedCity;
      const searchText = (card.dataset.search || card.textContent || "").toLowerCase();
      const queryMatch = !query || searchText.includes(query);
      const visible = categoryMatch && statusMatch && cityMatch && queryMatch;
      card.classList.toggle("is-hidden", !visible);
      if (visible) visibleCount += 1;
    }

    for (const group of groups) {
      const hasVisibleCard = [...group.querySelectorAll("[data-card]")].some((card) => !card.classList.contains("is-hidden"));
      group.classList.toggle("is-hidden", !hasVisibleCard);
    }

    if (resultCount) {
      resultCount.textContent = visibleCount === 1
        ? countOneTemplate
        : countTemplate.replace("{count}", String(visibleCount));
    }
    if (noResults) noResults.hidden = visibleCount !== 0;
  }

  filterRoot?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-filter]");
    if (!button) return;
    selectedCategory = button.dataset.filter || "all";

    for (const item of filterRoot.querySelectorAll("[data-filter]")) {
      item.setAttribute("aria-pressed", String(item === button));
    }

    applyFilters();
  });

  searchInput?.addEventListener("input", applyFilters);
  statusSelect?.addEventListener("change", applyFilters);
  citySelect?.addEventListener("change", applyFilters);
  clearButton?.addEventListener("click", () => {
    selectedCategory = "all";
    if (searchInput) searchInput.value = "";
    if (statusSelect) statusSelect.value = "all";
    if (citySelect) citySelect.value = "all";
    for (const item of filterRoot?.querySelectorAll("[data-filter]") || []) {
      item.setAttribute("aria-pressed", String(item.dataset.filter === "all"));
    }
    applyFilters();
    searchInput?.focus();
  });

  applyFilters();
}

const savedKey = "koreaNowGuide.savedEvents.v1";
const saveButtons = [...document.querySelectorAll("[data-save-event]")];
const planner = document.querySelector("[data-saved-planner]");
const savedCount = planner?.querySelector("[data-saved-count]");
const savedList = planner?.querySelector("[data-saved-list]");
const plannerPage = document.querySelector("[data-planner-page]");
const plannerGrid = plannerPage?.querySelector("[data-planner-grid]");
const plannerEmpty = plannerPage?.querySelector("[data-planner-empty]");
const clearSavedButtons = [...document.querySelectorAll("[data-clear-saved]")];
const downloadSavedButtons = [...document.querySelectorAll("[data-download-saved-calendar]")];
let volatileSavedEvents = [];

function normalizeSavedEvent(item) {
  return {
    slug: String(item?.slug || ""),
    title: String(item?.title || ""),
    date: String(item?.date || ""),
    start: String(item?.start || ""),
    end: String(item?.end || ""),
    city: String(item?.city || ""),
    category: String(item?.category || ""),
    url: String(item?.url || ""),
    sourceUrl: String(item?.sourceUrl || ""),
    sourceName: String(item?.sourceName || "")
  };
}

function readSavedEvents() {
  try {
    const parsed = JSON.parse(localStorage.getItem(savedKey) || "[]");
    return Array.isArray(parsed)
      ? parsed.map(normalizeSavedEvent).filter((item) => item.slug && item.title && item.url)
      : [];
  } catch {
    return volatileSavedEvents;
  }
}

function writeSavedEvents(items) {
  volatileSavedEvents = items.map(normalizeSavedEvent).filter((item) => item.slug && item.title && item.url).slice(0, 24);
  try {
    localStorage.setItem(savedKey, JSON.stringify(volatileSavedEvents));
  } catch {
    // Keep the in-memory planner working when storage is unavailable.
  }
}

function savedEventFromButton(button) {
  return {
    slug: button.dataset.eventSlug,
    title: button.dataset.eventTitle,
    date: button.dataset.eventDate,
    start: button.dataset.eventStart,
    end: button.dataset.eventEnd,
    city: button.dataset.eventCity,
    category: button.dataset.eventCategory,
    url: button.dataset.eventUrl,
    sourceUrl: button.dataset.eventSourceUrl,
    sourceName: button.dataset.eventSourceName
  };
}

function setButtonState(button, saved) {
  button.setAttribute("aria-pressed", String(saved));
  button.textContent = saved ? button.dataset.savedLabel || "Saved" : button.dataset.saveLabel || "Save";
}

function renderSavedPlanner() {
  const saved = readSavedEvents();
  const savedSlugs = new Set(saved.map((item) => item.slug));

  for (const button of saveButtons) {
    setButtonState(button, savedSlugs.has(button.dataset.eventSlug));
  }

  for (const button of downloadSavedButtons) {
    button.disabled = saved.length === 0;
  }

  if (planner && savedCount && savedList) {
    planner.hidden = saved.length === 0;
    const oneTemplate = savedCount.dataset.countOneTemplate || "1 saved event";
    const countTemplate = savedCount.dataset.countTemplate || "{count} saved events";
    savedCount.textContent = saved.length === 1 ? oneTemplate : countTemplate.replace("{count}", String(saved.length));
    savedList.replaceChildren(...saved.slice(0, 4).map((item) => {
      const link = document.createElement("a");
      link.href = item.url;
      link.className = "saved-planner-item";

      const title = document.createElement("strong");
      title.textContent = item.title;
      const meta = document.createElement("span");
      meta.textContent = [item.city, item.date].filter(Boolean).join(" - ");

      link.append(title, meta);
      return link;
    }));
  }

  renderPlannerPage(saved);
}

function renderPlannerPage(saved = readSavedEvents()) {
  if (!plannerPage || !plannerGrid || !plannerEmpty) return;
  const openLabel = plannerPage.dataset.openLabel || "Open";
  const officialLabel = plannerPage.dataset.officialLabel || "Official";
  const removeLabel = plannerPage.dataset.removeLabel || "Remove";
  const sorted = [...saved].sort((a, b) => (a.start || a.date || a.title).localeCompare(b.start || b.date || b.title));

  plannerEmpty.hidden = sorted.length > 0;
  plannerGrid.replaceChildren(...sorted.map((item) => {
    const card = document.createElement("article");
    card.className = "planner-card";

    const meta = document.createElement("div");
    meta.className = "planner-card-meta";
    meta.textContent = [item.category, item.city].filter(Boolean).join(" - ");

    const title = document.createElement("strong");
    title.textContent = item.title;

    const date = document.createElement("span");
    date.textContent = item.date || [item.start, item.end].filter(Boolean).join(" - ");

    const actions = document.createElement("div");
    actions.className = "planner-card-actions";

    const open = document.createElement("a");
    open.href = item.url;
    open.textContent = openLabel;
    actions.append(open);

    if (item.sourceUrl) {
      const official = document.createElement("a");
      official.href = item.sourceUrl;
      official.rel = "nofollow noopener";
      official.target = "_blank";
      official.textContent = item.sourceName || officialLabel;
      actions.append(official);
    }

    const remove = document.createElement("button");
    remove.type = "button";
    remove.dataset.removeSaved = item.slug;
    remove.textContent = removeLabel;
    actions.append(remove);

    card.append(meta, title, date, actions);
    return card;
  }));
}

function icsEscape(value) {
  return String(value || "")
    .replaceAll("\\", "\\\\")
    .replaceAll("\n", "\\n")
    .replaceAll(",", "\\,")
    .replaceAll(";", "\\;");
}

function icsDate(value, addDay = false) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return "";
  const date = new Date(`${value}T00:00:00Z`);
  if (addDay) date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10).replaceAll("-", "");
}

function downloadSavedCalendar() {
  const saved = readSavedEvents().filter((item) => item.start);
  if (!saved.length) return;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//K-Spot Now//Saved Planner//EN",
    "CALSCALE:GREGORIAN",
    "X-WR-CALNAME:K-Spot Now Saved Events"
  ];

  for (const item of saved) {
    const start = icsDate(item.start);
    const end = icsDate(item.end || item.start, true);
    if (!start || !end) continue;
    lines.push(
      "BEGIN:VEVENT",
      `UID:${icsEscape(item.slug)}@kspotnow`,
      `SUMMARY:${icsEscape(item.title)}`,
      `DTSTART;VALUE=DATE:${start}`,
      `DTEND;VALUE=DATE:${end}`,
      `LOCATION:${icsEscape(item.city)}`,
      `DESCRIPTION:${icsEscape([item.date, item.sourceUrl].filter(Boolean).join(" Official source: "))}`,
      `URL:${icsEscape(item.sourceUrl || item.url)}`,
      "END:VEVENT"
    );
  }
  lines.push("END:VCALENDAR");

  const blob = new Blob([`${lines.join("\r\n")}\r\n`], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "kspotnow-saved-events.ics";
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

for (const button of saveButtons) {
  button.addEventListener("click", () => {
    const event = savedEventFromButton(button);
    if (!event.slug) return;
    const saved = readSavedEvents();
    const exists = saved.some((item) => item.slug === event.slug);
    writeSavedEvents(exists ? saved.filter((item) => item.slug !== event.slug) : [event, ...saved.filter((item) => item.slug !== event.slug)]);
    renderSavedPlanner();
  });
}

for (const button of clearSavedButtons) {
  button.addEventListener("click", () => {
    writeSavedEvents([]);
    renderSavedPlanner();
  });
}

for (const button of downloadSavedButtons) {
  button.addEventListener("click", downloadSavedCalendar);
}

plannerGrid?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-remove-saved]");
  if (!button) return;
  const slug = button.dataset.removeSaved;
  writeSavedEvents(readSavedEvents().filter((item) => item.slug !== slug));
  renderSavedPlanner();
});

renderSavedPlanner();
