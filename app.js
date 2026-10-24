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
const planChangeSummary = document.querySelector("[data-plan-change-summary]");
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
    visitDate: KSpotPlanning.validDate(item?.visitDate) ? item.visitDate : "",
    savedSnapshot: KSpotPlanning.savedSnapshot(item?.savedSnapshot)
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
  const item = visitCatalog.find(candidate => candidate.slug === button.dataset.eventSlug);
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
    venue: button.dataset.eventVenue,
    savedSnapshot: item ? KSpotPlanning.snapshotFor(item) : null
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
  const changeStates = saved.map(item => KSpotPlanning.publicationChanges(item).state);
  const changedCount = changeStates.filter(state => state === "changed").length;
  const oldCount = changeStates.filter(state => state === "no-baseline").length;
  const withdrawnCount = changeStates.filter(state => state === "withdrawn").length;
  if (planChangeSummary) {
    planChangeSummary.hidden = saved.length === 0;
    const unresolved = [
      oldCount ? `${oldCount} older ${oldCount === 1 ? "save has" : "saves have"} no comparison baseline` : "",
      withdrawnCount ? `${withdrawnCount} ${withdrawnCount === 1 ? "place is" : "places are"} withdrawn` : ""
    ].filter(Boolean).join("; ");
    planChangeSummary.textContent = changedCount
      ? `${changedCount} saved ${changedCount === 1 ? "place has" : "places have"} published changes since you saved it. Review the affected facts below; this does not confirm live availability.`
      : oldCount || withdrawnCount
        ? `${unresolved}. Check each official notice.`
        : "No published facts changed since you saved these places. This is not a live operation or ticket check.";
  }

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
    check.textContent = item.schedule?.checkedAt
      ? `Schedule guidance reviewed ${item.schedule.checkedAt}. Automated source-text monitoring ${item.sourceMonitoredAt || "not recorded"}; it does not confirm cancellations, tickets or every schedule detail.`
      : "No current schedule review is available. Check the official notice.";

    const publication = KSpotPlanning.publicationChanges(item);
    const changeBlock = document.createElement("section");
    changeBlock.className = `planner-change-note is-${publication.state}`;
    const changeTitle = document.createElement("h3");
    changeTitle.textContent = publication.state === "changed" ? "Since you saved this" : publication.state === "unchanged" ? "Published facts unchanged" : publication.state === "withdrawn" ? "No longer published here" : "Comparison starts when you choose";
    changeBlock.append(changeTitle);
    const changeIntro = document.createElement("p");
    changeIntro.textContent = publication.state === "changed"
      ? "Our published information changed. Read the current article and operator notice before deciding; this is not a live alert from the organizer."
      : publication.state === "unchanged"
        ? "Our saved fact baseline matches this version. Conditions may still have changed outside this site."
        : publication.state === "withdrawn"
          ? "This article left the current selection. The old plan is not a confirmed event."
          : "This place was saved before change tracking existed. We cannot reconstruct what changed earlier.";
    changeBlock.append(changeIntro);
    if (publication.changes.length) {
      const list = document.createElement("ul");
      for (const detail of publication.changes) {
        const row = document.createElement("li");
        const label = document.createElement("strong");
        label.textContent = `${detail.label}: `;
        const value = document.createElement("span");
        value.textContent = detail.before && detail.after ? `${detail.before} → ${detail.after}` : detail.after || "Changed";
        row.append(label, value);
        list.append(row);
      }
      changeBlock.append(list);
    }
    if (publication.state === "changed" || publication.state === "no-baseline") {
      const acknowledge = document.createElement("button");
      acknowledge.type = "button";
      acknowledge.dataset.ackSaved = item.slug;
      acknowledge.textContent = publication.state === "changed" ? "Mark site changes seen" : "Start comparing from this version";
      changeBlock.append(acknowledge);
    }

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

    card.append(title, meta, date, changeBlock, visit, note, check, mapBlock, actions);
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
  const acknowledge = event.target.closest("[data-ack-saved]");
  if (acknowledge) {
    const slug = acknowledge.dataset.ackSaved;
    const current = visitCatalog.find(item => item.slug === slug);
    if (!current) return;
    writeSavedEvents(readSavedEvents().map(item => item.slug === slug ? { ...item, savedSnapshot: KSpotPlanning.snapshotFor(current) } : item));
    renderSavedPlanner();
    if (planFeedback) planFeedback.textContent = "Site-change baseline updated. Check the organizer again before travelling.";
    return;
  }
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

// Primary-nav guide menu: close on outside click or Escape.
document.addEventListener("click", (event) => {
  document.querySelectorAll("details.nav-menu[open]").forEach((menu) => {
    if (!menu.contains(event.target)) menu.removeAttribute("open");
  });
});
document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  document.querySelectorAll("details.nav-menu[open]").forEach((menu) => {
    menu.removeAttribute("open");
    menu.querySelector("summary")?.focus();
  });
});

// Reader tools on guide pages: share, Korean copy/listen, reading progress and quizzes.
function flashButton(button, text) {
  const original = button.dataset.label || button.textContent;
  button.dataset.label = original;
  button.textContent = text;
  window.setTimeout(() => { button.textContent = original; }, 1600);
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.append(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  }
}

for (const bar of document.querySelectorAll("[data-share]")) {
  const url = bar.dataset.shareUrl;
  const title = bar.dataset.shareTitle;
  const nativeButton = bar.querySelector("[data-share-native]");
  if (nativeButton && navigator.share) {
    nativeButton.hidden = false;
    nativeButton.addEventListener("click", () => navigator.share({ title, url }).catch(() => {}));
  }
  bar.querySelector("[data-share-copy]")?.addEventListener("click", async (event) => {
    flashButton(event.currentTarget, (await copyText(url)) ? "Link copied" : "Copy failed");
  });
}

let koreanVoice = null;
function speakKorean(text) {
  if (!koreanVoice) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ko-KR";
  utterance.voice = koreanVoice;
  utterance.rate = 0.85;
  window.speechSynthesis.speak(utterance);
}

function addTableListenButtons() {
  for (const cell of document.querySelectorAll(".guide-table td, .guide-table th[scope='row']")) {
    const text = cell.textContent.trim();
    const match = text.match(/[가-힣][가-힣\d ?.,!~]*/);
    if (!match || match[0].length > 40 || cell.querySelector("[data-ko-listen]")) continue;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "ko-cell-listen";
    button.dataset.koListen = "";
    button.dataset.ko = match[0].trim();
    button.setAttribute("aria-label", `Listen to ${match[0].trim()}`);
    button.textContent = "▶";
    cell.append(" ", button);
  }
}

function enableKoreanListening() {
  if (!("speechSynthesis" in window)) return;
  const pick = () => {
    const voices = window.speechSynthesis.getVoices().filter((voice) => /^ko/i.test(voice.lang));
    // Prefer standard narration voices over novelty voices some systems list first.
    koreanVoice = voices.find((voice) => /yuna|sora|google|microsoft|heami|sunhi|injoon|samantha/i.test(voice.name))
      || voices.find((voice) => !/grandma|grandpa|rocko|eddy|flo|reed|sandy|shelley/i.test(voice.name))
      || voices[0] || null;
    if (!koreanVoice) return;
    addTableListenButtons();
    document.querySelectorAll("[data-ko-listen]").forEach((button) => { button.hidden = false; });
  };
  pick();
  window.speechSynthesis.addEventListener?.("voiceschanged", pick);
}

document.addEventListener("click", async (event) => {
  const listen = event.target.closest("[data-ko-listen]");
  if (listen) {
    speakKorean(listen.dataset.ko || listen.closest("[data-ko]")?.dataset.ko || "");
    return;
  }
  const copy = event.target.closest("[data-ko-copy]");
  if (copy) {
    const text = copy.closest("[data-ko]")?.dataset.ko || "";
    flashButton(copy, (await copyText(text)) ? "Copied" : "Copy failed");
  }
});
enableKoreanListening();

// Dated notices: the build drops expired ones, and this covers the days between builds (dates are KST).
function koreaToday() {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" })
    .formatToParts(new Date()).map((part) => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}
function refreshVisitNotices() {
  const today = koreaToday();
  for (const notice of document.querySelectorAll("[data-notice]")) {
    if (notice.dataset.noticeEnd < today) {
      notice.remove();
      continue;
    }
    const label = notice.querySelector("[data-notice-label]");
    if (label && notice.dataset.noticeStart <= today) {
      label.textContent = "Now";
      label.classList.replace("is-upcoming", "is-now");
    }
  }
  for (const group of document.querySelectorAll("[data-notices]")) {
    if (!group.querySelector("[data-notice]")) group.remove();
  }
}
refreshVisitNotices();

const progressBar = document.querySelector("[data-reading-progress]");
const articleBody = document.querySelector(".guide-article-body");
if (progressBar && articleBody) {
  const updateProgress = () => {
    const rect = articleBody.getBoundingClientRect();
    const total = rect.height - window.innerHeight * 0.6;
    const done = Math.min(1, Math.max(0, -rect.top / Math.max(total, 1)));
    progressBar.style.transform = `scaleX(${done})`;
  };
  window.addEventListener("scroll", updateProgress, { passive: true });
  window.addEventListener("resize", updateProgress);
  updateProgress();
}

for (const quiz of document.querySelectorAll("[data-quiz]")) {
  const questions = [...quiz.querySelectorAll(".quiz-question")];
  const resultBox = quiz.querySelector("[data-quiz-result]");
  let answered = 0;
  let score = 0;
  quiz.classList.add("is-interactive");
  for (const question of questions) {
    const answer = Number(question.dataset.answer);
    const buttons = [...question.querySelectorAll("[data-option]")];
    const explain = question.querySelector(".quiz-explain");
    buttons.forEach((button) => { button.disabled = false; });
    buttons.forEach((button) => button.addEventListener("click", () => {
      const chosen = Number(button.dataset.option);
      buttons.forEach((item) => {
        item.disabled = true;
        if (Number(item.dataset.option) === answer) item.classList.add("is-correct");
      });
      if (chosen !== answer) button.classList.add("is-wrong");
      else score += 1;
      question.classList.add(chosen === answer ? "answered-right" : "answered-wrong");
      if (explain) explain.open = true;
      answered += 1;
      if (answered === questions.length && resultBox) {
        const ratio = score / questions.length;
        const message = ratio >= 0.8 ? quiz.dataset.resultHigh : ratio >= 0.5 ? quiz.dataset.resultMid : quiz.dataset.resultLow;
        resultBox.innerHTML = "";
        const heading = document.createElement("p");
        heading.className = "quiz-score";
        heading.textContent = `You scored ${score} out of ${questions.length}.`;
        const note = document.createElement("p");
        note.textContent = message || "";
        const shareButton = document.createElement("button");
        shareButton.type = "button";
        shareButton.className = "button primary";
        shareButton.textContent = "Share your score";
        const shareText = `I scored ${score}/${questions.length} on "${quiz.dataset.quizTitle}" from K-Spot Now.`;
        shareButton.addEventListener("click", async () => {
          const url = location.href.split("#")[0];
          if (navigator.share) {
            navigator.share({ title: quiz.dataset.quizTitle, text: shareText, url }).catch(() => {});
          } else {
            flashButton(shareButton, (await copyText(`${shareText} ${url}`)) ? "Copied to share" : "Copy failed");
          }
        });
        resultBox.append(heading, note, shareButton);
        resultBox.hidden = false;
      }
    }));
  }
}
