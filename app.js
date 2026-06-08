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
const clearSaved = planner?.querySelector("[data-clear-saved]");
let volatileSavedEvents = [];

function readSavedEvents() {
  try {
    const parsed = JSON.parse(localStorage.getItem(savedKey) || "[]");
    return Array.isArray(parsed) ? parsed.filter((item) => item?.slug && item?.title && item?.url) : [];
  } catch {
    return volatileSavedEvents;
  }
}

function writeSavedEvents(items) {
  volatileSavedEvents = items.slice(0, 24);
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
    city: button.dataset.eventCity,
    url: button.dataset.eventUrl
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

  if (!planner || !savedCount || !savedList) return;
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
    meta.textContent = [item.city, item.date].filter(Boolean).join(" · ");

    link.append(title, meta);
    return link;
  }));
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

clearSaved?.addEventListener("click", () => {
  writeSavedEvents([]);
  renderSavedPlanner();
});

renderSavedPlanner();
