const visitCatalog = JSON.parse(document.getElementById("visit-catalog")?.textContent || "[]");
const galleryScopes = [...document.querySelectorAll("[data-gallery-scope]")];

const mobileEventListQuery = window.matchMedia("(max-width: 680px)");
const mobileEventBatchSize = 18;
const mobileMoreLabels = {
  en: "Show more events",
  es: "Ver mas eventos",
  zh: "查看更多活动",
  pt: "Ver mais eventos",
  ru: "Показать еще",
  ja: "イベントをもっと見る",
  fr: "Voir plus d'evenements",
  de: "Mehr Events anzeigen",
  ko: "이벤트 더 보기"
};

function currentLanguageKey() {
  return (document.documentElement.lang || "en").split("-")[0] || "en";
}

function mobileMoreText(hiddenCount) {
  const label = mobileMoreLabels[currentLanguageKey()] || mobileMoreLabels.en;
  return `${label} (${hiddenCount})`;
}

for (const scope of galleryScopes) {
  const cards = [...scope.querySelectorAll("[data-card]")];
  if (!cards.length) continue;

  const filterRoot = scope.querySelector("[data-filters]");
  const searchInput = scope.querySelector("[data-gallery-search]");
  const statusSelect = scope.querySelector("[data-status-filter]");
  const citySelect = scope.querySelector("[data-city-filter]");
  const visitInput = scope.querySelector("[data-visit-filter]");
  const interestSelect = scope.querySelector("[data-interest-filter]");
  const visitStatus = scope.querySelector("[data-visit-filter-status]");
  if (visitInput) visitInput.min = KSpotPlanning.koreaToday();
  const clearButton = scope.querySelector("[data-clear-filters]");
  const resultCount = scope.querySelector("[data-result-count]");
  const noResults = scope.querySelector("[data-no-results]");
  const controls = scope.querySelector("[data-gallery-controls]");
  const groups = [...scope.querySelectorAll("[data-filter-group]")];
  const countTemplate = controls?.dataset.countTemplate || "{count} events shown";
  const countOneTemplate = controls?.dataset.countOneTemplate || "1 event shown";
  const topicPills = [...scope.querySelectorAll("[data-browse-category]")];
  const cityPills = [...scope.querySelectorAll("[data-browse-city]")];
  const eventCards = cards.filter((card) => card.classList.contains("event-card"));
  const eventGrid = scope.querySelector(".gallery-grid");
  const desktopInitialLimit = Number(scope.dataset.galleryLimit || 0);
  const mobileInitialLimit = Number(scope.dataset.galleryMobileLimit || 0);
  const galleryStep = Number(scope.dataset.galleryStep || 0);
  const hasGalleryLimit = desktopInitialLimit > 0 || mobileInitialLimit > 0;
  const initialLimit = () => {
    if (hasGalleryLimit) {
      return mobileEventListQuery.matches && mobileInitialLimit > 0 ? mobileInitialLimit : desktopInitialLimit;
    }
    return mobileEventBatchSize;
  };
  const stepLimit = () => galleryStep > 0 ? galleryStep : initialLimit();
  const moreButton = eventCards.length > initialLimit() && eventGrid
    ? document.createElement("button")
    : null;

  let selectedCategory = filterRoot?.querySelector("[data-filter][aria-pressed='true']")?.dataset.filter || "all";
  let visibleLimit = initialLimit();

  if (moreButton) {
    moreButton.type = "button";
    moreButton.className = "gallery-load-more";
    moreButton.hidden = true;
    eventGrid.after(moreButton);
    moreButton.addEventListener("click", () => {
      visibleLimit += stepLimit();
      applyFilters();
    });
    mobileEventListQuery.addEventListener("change", () => {
      visibleLimit = initialLimit();
      applyFilters();
    });
  }

  function syncBrowsePills(categoryHits, cityHits, filtersActive) {
    for (const pill of topicPills) {
      const key = pill.dataset.browseCategory;
      const hits = categoryHits.get(key) || 0;
      const selected = selectedCategory === key;
      pill.classList.toggle("is-selected", selected);
      pill.classList.toggle("is-muted", filtersActive && !selected && hits === 0);
      if (selected) pill.setAttribute("aria-current", "true");
      else pill.removeAttribute("aria-current");
      const count = pill.querySelector("[data-pill-count]");
      if (count) count.textContent = String(hits);
    }

    for (const pill of cityPills) {
      const hits = cityHits.get(pill.dataset.browseCity) || 0;
      pill.classList.toggle("is-muted", filtersActive && hits === 0);
      const count = pill.querySelector("[data-pill-count]");
      if (count) count.textContent = String(hits);
    }
  }

  function applyFilters() {
    const query = (searchInput?.value || "").trim().toLowerCase();
    const selectedStatus = statusSelect?.value || "all";
    const selectedCity = citySelect?.value || "all";
    const visitDate = visitInput?.value || "";
    const interest = interestSelect?.value || "all";
    const filtersActive = selectedCategory !== "all" || selectedStatus !== "all" || selectedCity !== "all" || Boolean(query) || Boolean(visitDate) || interest !== "all";
    const categoryHits = new Map();
    const cityHits = new Map();
    let visibleCount = 0;
    let displayedCount = 0;
    let hiddenCount = 0;
    const canLimit = Boolean(moreButton) && !filtersActive && (hasGalleryLimit || mobileEventListQuery.matches);

    for (const card of cards) {
      const categoryMatch = selectedCategory === "all" || card.dataset.category === selectedCategory;
      const statusMatch = selectedStatus === "all" || card.dataset.status === selectedStatus;
      const cityMatch = selectedCity === "all" || card.dataset.city === selectedCity;
      const searchText = (card.dataset.search || card.textContent || "").toLowerCase();
      const queryMatch = !query || searchText.includes(query);
      const item = visitCatalog.find(item => item.slug === card.dataset.visitSlug);
      const decision = item && visitDate ? KSpotPlanning.visitDecision(item, visitDate) : null;
      const dateMatch = !visitDate || decision?.state === "candidate";
      const interestMatch = interest === "all" || item?.schedule?.interests?.includes(interest);
      const visible = categoryMatch && statusMatch && cityMatch && queryMatch && dateMatch && interestMatch;
      let visitNote = card.querySelector("[data-card-visit-note]");
      if (visitInput && !visitNote) {
        visitNote = document.createElement("p");
        visitNote.dataset.cardVisitNote = "";
        visitNote.className = "visit-date-note";
        card.querySelector(".experience-bottom")?.before(visitNote);
      }
      if (visitNote) { visitNote.hidden = !visitDate; visitNote.textContent = decision?.message || ""; }
      card.classList.toggle("is-hidden", !visible);
      card.classList.remove("is-gallery-limited");
      if (visible) visibleCount += 1;

      if (visible && card.classList.contains("event-card")) {
        displayedCount += 1;
        const limited = canLimit && displayedCount > visibleLimit;
        card.classList.toggle("is-gallery-limited", limited);
        if (limited) hiddenCount += 1;
      }

      // Facet tallies ignore their own dimension so each pill shows what
      // selecting it would yield under the other active filters.
      if (statusMatch && cityMatch && queryMatch && dateMatch && interestMatch) {
        categoryHits.set(card.dataset.category, (categoryHits.get(card.dataset.category) || 0) + 1);
      }
      if (categoryMatch && statusMatch && queryMatch && dateMatch && interestMatch) {
        cityHits.set(card.dataset.city, (cityHits.get(card.dataset.city) || 0) + 1);
      }
    }

    for (const group of groups) {
      const hasVisibleCard = [...group.querySelectorAll("[data-card]")].some((card) => !card.classList.contains("is-hidden"));
      group.classList.toggle("is-hidden", !hasVisibleCard);
    }

    syncBrowsePills(categoryHits, cityHits, filtersActive);

    if (resultCount) {
      const shownCount = Math.max(0, displayedCount - hiddenCount);
      resultCount.textContent = canLimit && hiddenCount > 0
        ? `${shownCount} / ${visibleCount}`
        : visibleCount === 1
          ? countOneTemplate
          : countTemplate.replace("{count}", String(visibleCount));
    }
    if (noResults) noResults.hidden = visibleCount !== 0;
    if (visitStatus) {
      visitStatus.hidden = !visitDate;
      visitStatus.textContent = visitDate && visitDate < KSpotPlanning.koreaToday()
        ? "That date has passed. Choose today or a future date."
        : `${visitDate}: ${visibleCount} possible ${visibleCount === 1 ? "experience" : "experiences"}. Check each notice before committing. Saving carries this date into your plan.`;
    }
    if (moreButton) {
      moreButton.hidden = !canLimit || hiddenCount === 0;
      moreButton.textContent = mobileMoreText(hiddenCount);
    }
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
  visitInput?.addEventListener("change", applyFilters);
  interestSelect?.addEventListener("change", applyFilters);
  clearButton?.addEventListener("click", () => {
    selectedCategory = "all";
    if (searchInput) searchInput.value = "";
    if (statusSelect) statusSelect.value = "all";
    if (citySelect) citySelect.value = "all";
    if (visitInput) visitInput.value = "";
    if (interestSelect) interestSelect.value = "all";
    visibleLimit = initialLimit();
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
let volatileSavedEvents = null;
let storageUnavailable = false;
let undoSaved = null;
const planSummary = document.querySelector("[data-plan-summary]");
const planFeedback = document.querySelector("[data-plan-feedback]");
const undoSavedButton = document.querySelector("[data-undo-saved]");
const printPlanButton = document.querySelector("[data-print-plan]");
let savedSummaryDismissed = true;
document.querySelector("[data-dismiss-saved]")?.addEventListener("click", () => {
  savedSummaryDismissed = true;
  if (planner) planner.hidden = true;
});

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
    sourceName: String(item?.sourceName || ""),
    mapQuery: String(item?.mapQuery || ""),
    venue: String(item?.venue || ""),
    visitDate: KSpotPlanning.validDate(item?.visitDate) ? item.visitDate : ""
  };
}

function readSavedEvents() {
  if (volatileSavedEvents !== null) return KSpotPlanning.reconcileSaved(volatileSavedEvents, visitCatalog);
  try {
    const parsed = JSON.parse(localStorage.getItem(savedKey) || "[]");
    return KSpotPlanning.reconcileSaved(parsed, visitCatalog);
  } catch {
    storageUnavailable = true;
    return [];
  }
}

function writeSavedEvents(items) {
  volatileSavedEvents = items.map(normalizeSavedEvent).filter((item) => item.slug && item.title).slice(0, 24);
  try {
    localStorage.setItem(savedKey, JSON.stringify(volatileSavedEvents));
    storageUnavailable = false;
    volatileSavedEvents = null;
  } catch {
    storageUnavailable = true;
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
    sourceName: button.dataset.eventSourceName,
    mapQuery: button.dataset.eventMapQuery,
    venue: button.dataset.eventVenue
  };
}

function setButtonState(button, saved) {
  button.setAttribute("aria-pressed", String(saved));
  const label = saved ? button.dataset.savedLabel || "Saved" : button.dataset.saveLabel || "Save";
  const labelNode = button.querySelector("[data-save-event-label]");
  if (labelNode) labelNode.textContent = label;
  else button.textContent = label;
}

function renderSavedPlanner() {
  const saved = readSavedEvents();
  const savedSlugs = new Set(saved.map((item) => item.slug));

  for (const button of saveButtons) {
    setButtonState(button, savedSlugs.has(button.dataset.eventSlug));
  }

  for (const button of clearSavedButtons) {
    button.disabled = saved.length === 0;
  }
  const exportable = saved.filter(item => KSpotPlanning.visitDecision(item, item.visitDate).exportable);
  for (const button of downloadSavedButtons) button.disabled = exportable.length === 0;
  if (printPlanButton) printPlanButton.disabled = saved.length === 0;
  if (planSummary) planSummary.textContent = `${exportable.length} of ${saved.length} saved places have a usable visit date. Downloads include only these chosen days as tentative, all-day reminders—not confirmed sessions. Undated or blocked visits stay in your list.`;
  const storageWarning = document.querySelector("[data-storage-warning]");
  if (storageWarning) {
    storageWarning.hidden = !storageUnavailable;
    storageWarning.textContent = "Browser storage is unavailable or unreadable. Changes work on this page only and may be lost when you leave. Print or download your dated plan before leaving.";
  }

  if (planner && savedCount && savedList) {
    planner.hidden = saved.length === 0 || savedSummaryDismissed;
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
  const mapLabel = plannerPage.dataset.mapLabel || "Map search";
  const googleLabel = plannerPage.dataset.googleLabel || "Google Maps";
  const naverLabel = plannerPage.dataset.naverLabel || "Naver Map";
  const kakaoLabel = plannerPage.dataset.kakaoLabel || "Kakao Map";
  const sorted = [...saved].sort((a, b) => (a.visitDate || "9999").localeCompare(b.visitDate || "9999") || a.title.localeCompare(b.title));

  plannerEmpty.hidden = sorted.length > 0;
  plannerGrid.replaceChildren(...sorted.map((item) => {
    const card = document.createElement("article");
    card.className = "planner-card";

    const meta = document.createElement("div");
    meta.className = "planner-card-meta";
    meta.textContent = [item.category, item.city].filter(Boolean).join(" - ");

    const title = document.createElement("h2");
    title.textContent = item.title;

    const date = document.createElement("span");
    date.textContent = item.date || [item.start, item.end].filter(Boolean).join(" - ");

    const visit = document.createElement("label");
    visit.className = "planner-visit-field";
    const visitLabel = document.createElement("span");
    visitLabel.textContent = "Your visit date (Korea)";
    const visitInput = document.createElement("input");
    visitInput.type = "date";
    visitInput.dataset.savedVisitDate = item.slug;
    visitInput.value = item.visitDate || "";
    visitInput.min = KSpotPlanning.koreaToday() > item.start ? KSpotPlanning.koreaToday() : item.start;
    if (item.end) visitInput.max = item.end;
    visitInput.disabled = item.retired;
    visitInput.setAttribute("aria-describedby", `visit-note-${item.slug}`);
    visit.append(visitLabel, visitInput);
    const note = document.createElement("p");
    note.id = `visit-note-${item.slug}`;
    note.className = "visit-date-note";
    note.setAttribute("role", "status");
    note.textContent = item.retired ? "This place is no longer in the current selection. Check its organizer; calendar export is unavailable." : KSpotPlanning.visitDecision(item, item.visitDate).message;
    const check = document.createElement("p");
    check.className = "planner-source-note";
    check.textContent = item.schedule?.checkedAt ? `Schedule checked ${item.schedule.checkedAt}. Cancellations and sold-out sessions are not live-tracked.` : "No current schedule check is available.";

    const mapQuery = item.mapQuery || item.venue || item.city;
    const mapBlock = document.createElement("div");
    mapBlock.className = "planner-card-map";

    const mapText = document.createElement("span");
    mapText.textContent = mapQuery ? `${mapLabel}: ${mapQuery}` : "";
    mapBlock.append(mapText);

    if (mapQuery) {
      const encoded = encodeURIComponent(mapQuery);
      const mapLinks = document.createElement("div");
      mapLinks.className = "planner-card-map-links";

      for (const [label, href] of [
        [googleLabel, `https://www.google.com/maps/search/?api=1&query=${encoded}`],
        [naverLabel, `https://map.naver.com/p/search/${encoded}`],
        [kakaoLabel, `https://map.kakao.com/?q=${encoded}`]
      ]) {
        const link = document.createElement("a");
        link.href = href;
        link.rel = "nofollow noopener";
        link.target = "_blank";
        link.textContent = label;
        mapLinks.append(link);
      }

      mapBlock.append(mapLinks);
      const copy = document.createElement("button");
      copy.type = "button"; copy.className = "copy-map-name";
      copy.dataset.copyMap = mapQuery; copy.textContent = "Copy map name";
      mapBlock.append(copy);
    }

    const actions = document.createElement("div");
    actions.className = "planner-card-actions";

    const open = document.createElement("a");
    open.href = item.url;
    open.textContent = openLabel;
    if (KSpotPlanning.safeLink(item.url, { local: true })) actions.append(open);

    const operatingNotice = KSpotPlanning.operatingNotice(item);
    if (operatingNotice) {
      const official = document.createElement("a");
      official.href = operatingNotice;
      official.rel = "nofollow noopener";
      official.target = "_blank";
      official.textContent = "Check operating notice";
      actions.append(official);
    }

    const remove = document.createElement("button");
    remove.type = "button";
    remove.dataset.removeSaved = item.slug;
    remove.textContent = removeLabel;
    actions.append(remove);

    card.append(title, meta, date, visit, note, check, mapBlock, actions);
    return card;
  }));
}

function downloadSavedCalendar() {
  const text = KSpotPlanning.calendarText(readSavedEvents());
  if (!text) return;
  const blob = new Blob([text], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "kspotnow-planned-visits.ics";
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

for (const button of saveButtons) {
  button.addEventListener("click", () => {
    savedSummaryDismissed = false;
    const event = savedEventFromButton(button);
    if (!event.slug) return;
    const selectedDate = button.closest("[data-gallery-scope]")?.querySelector("[data-visit-filter]")?.value;
    const current = visitCatalog.find(item => item.slug === event.slug);
    if (current && KSpotPlanning.visitDecision(current, selectedDate).exportable) event.visitDate = selectedDate;
    const saved = readSavedEvents();
    const exists = saved.some((item) => item.slug === event.slug);
    writeSavedEvents(exists ? saved.filter((item) => item.slug !== event.slug) : [event, ...saved.filter((item) => item.slug !== event.slug)]);
    renderSavedPlanner();
  });
}

for (const button of clearSavedButtons) {
  button.addEventListener("click", () => {
    undoSaved = readSavedEvents();
    writeSavedEvents([]);
    renderSavedPlanner();
    if (undoSavedButton) undoSavedButton.hidden = false;
    if (planFeedback) planFeedback.textContent = "Saved list cleared. You can undo this while this page stays open.";
  });
}

for (const button of downloadSavedButtons) {
  button.addEventListener("click", downloadSavedCalendar);
}

plannerGrid?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-remove-saved]");
  if (!button) return;
  const slug = button.dataset.removeSaved;
  undoSaved = readSavedEvents();
  writeSavedEvents(readSavedEvents().filter((item) => item.slug !== slug));
  renderSavedPlanner();
  if (undoSavedButton) { undoSavedButton.hidden = false; undoSavedButton.focus(); }
  if (planFeedback) planFeedback.textContent = "Place removed. Undo restores the list before this removal.";
});

undoSavedButton?.addEventListener("click", () => {
  if (!undoSaved) return;
  writeSavedEvents(undoSaved); undoSaved = null;
  undoSavedButton.hidden = true; renderSavedPlanner();
  if (planFeedback) planFeedback.textContent = "Saved list restored.";
  plannerGrid?.querySelector("input")?.focus();
});
plannerGrid?.addEventListener("change", (event) => {
  const input = event.target.closest("[data-saved-visit-date]");
  if (!input) return;
  const slug = input.dataset.savedVisitDate;
  const saved = readSavedEvents().map(item => item.slug === slug ? { ...item, visitDate: input.value } : item);
  writeSavedEvents(saved);
  renderSavedPlanner();
  const restored = [...plannerGrid.querySelectorAll("[data-saved-visit-date]")].find(node => node.dataset.savedVisitDate === slug);
  restored?.focus();
});
plannerGrid?.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-copy-map]");
  if (!button) return;
  try {
    await navigator.clipboard.writeText(button.dataset.copyMap);
    if (planFeedback) planFeedback.textContent = `Copied map name: ${button.dataset.copyMap}`;
  } catch {
    if (planFeedback) planFeedback.textContent = "Clipboard access is unavailable. Select and copy the map name displayed in the saved place.";
  }
});
printPlanButton?.addEventListener("click", () => window.print());
window.addEventListener("storage", event => {
  if (event.key !== savedKey && event.key !== null) return;
  volatileSavedEvents = null;
  renderSavedPlanner();
});

renderSavedPlanner();
