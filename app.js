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
