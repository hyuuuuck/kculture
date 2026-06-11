const galleryScopes = [...document.querySelectorAll("[data-gallery-scope]")];

const spotlightCarousels = [...document.querySelectorAll("[data-spotlight-carousel]")];
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

for (const carousel of spotlightCarousels) {
  const slides = [...carousel.querySelectorAll("[data-spotlight-slide]")];
  const track = carousel.querySelector(".spotlight-track");
  const dots = [...carousel.querySelectorAll("[data-spotlight-dot]")];
  if (slides.length <= 1) continue;

  let currentIndex = Math.max(0, slides.findIndex((slide) => slide.classList.contains("is-active")));
  let dragPointerId = null;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragDeltaX = 0;
  let dragDeltaY = 0;
  let suppressClick = false;

  function beginDrag(clientX, clientY, pointerId) {
    dragPointerId = pointerId;
    dragStartX = clientX;
    dragStartY = clientY;
    dragDeltaX = 0;
    dragDeltaY = 0;
    carousel.classList.add("is-dragging");
  }

  function updateDrag(clientX, clientY, event) {
    dragDeltaX = clientX - dragStartX;
    dragDeltaY = clientY - dragStartY;
    if (Math.abs(dragDeltaX) > 8 && Math.abs(dragDeltaX) > Math.abs(dragDeltaY) * 1.2) {
      event?.preventDefault?.();
    }
  }

  function finishDrag(clientX, clientY) {
    const deltaX = dragDeltaX || clientX - dragStartX;
    const deltaY = dragDeltaY || clientY - dragStartY;
    dragPointerId = null;
    carousel.classList.remove("is-dragging");

    if (Math.abs(deltaX) >= 45 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
      suppressClick = true;
      showSlide(deltaX < 0 ? currentIndex + 1 : currentIndex - 1);
      window.setTimeout(() => {
        suppressClick = false;
      }, 350);
    }
  }

  function showSlide(index) {
    const previousIndex = currentIndex;
    currentIndex = (index + slides.length) % slides.length;
    const direction = currentIndex === previousIndex
      ? "still"
      : (currentIndex > previousIndex || (previousIndex === slides.length - 1 && currentIndex === 0)) ? "forward" : "back";

    carousel.classList.toggle("is-moving-back", direction === "back");
    carousel.classList.toggle("is-moving-forward", direction === "forward");

    slides.forEach((slide, slideIndex) => {
      const active = slideIndex === currentIndex;
      slide.classList.toggle("is-active", active);
      slide.setAttribute("aria-hidden", String(!active));
      slide.tabIndex = active ? 0 : -1;
    });

    dots.forEach((dot, dotIndex) => {
      if (dotIndex === currentIndex) dot.setAttribute("aria-current", "true");
      else dot.removeAttribute("aria-current");
    });

  }

  dots.forEach((dot, dotIndex) => {
    dot.addEventListener("click", () => showSlide(dotIndex));
  });

  function startDrag(event) {
    if (!event.isPrimary || (event.button !== undefined && event.button !== 0)) return;
    beginDrag(event.clientX, event.clientY, event.pointerId);
    try {
      event.currentTarget.setPointerCapture?.(event.pointerId);
    } catch {
      // Pointer capture is an enhancement; dragging still works without it.
    }
  }

  function moveDrag(event) {
    if (dragPointerId !== event.pointerId) return;
    updateDrag(event.clientX, event.clientY, event);
  }

  function endDrag(event) {
    if (dragPointerId !== event.pointerId) return;
    try {
      event.currentTarget.releasePointerCapture?.(event.pointerId);
    } catch {
      // The pointer may have been released outside the track.
    }
    finishDrag(event.clientX, event.clientY);
  }

  function startMouseDrag(event) {
    if (event.button !== 0 || dragPointerId !== null) return;
    beginDrag(event.clientX, event.clientY, "mouse");
  }

  function moveMouseDrag(event) {
    if (dragPointerId !== "mouse") return;
    updateDrag(event.clientX, event.clientY, event);
  }

  function endMouseDrag(event) {
    if (dragPointerId !== "mouse") return;
    finishDrag(event.clientX, event.clientY);
  }

  function startTouchDrag(event) {
    const touch = event.changedTouches?.[0];
    if (!touch || dragPointerId !== null) return;
    beginDrag(touch.clientX, touch.clientY, "touch");
  }

  function moveTouchDrag(event) {
    const touch = event.changedTouches?.[0];
    if (!touch || dragPointerId !== "touch") return;
    updateDrag(touch.clientX, touch.clientY, event);
  }

  function endTouchDrag(event) {
    const touch = event.changedTouches?.[0];
    if (!touch || dragPointerId !== "touch") return;
    finishDrag(touch.clientX, touch.clientY);
  }

  track?.addEventListener("pointerdown", startDrag);
  track?.addEventListener("pointermove", moveDrag);
  track?.addEventListener("pointerup", endDrag);
  track?.addEventListener("pointercancel", endDrag);
  track?.addEventListener("mousedown", startMouseDrag);
  window.addEventListener("mousemove", moveMouseDrag);
  window.addEventListener("mouseup", endMouseDrag);
  track?.addEventListener("touchstart", startTouchDrag, { passive: true });
  track?.addEventListener("touchmove", moveTouchDrag, { passive: false });
  track?.addEventListener("touchend", endTouchDrag);
  track?.addEventListener("touchcancel", endTouchDrag);

  carousel.addEventListener("click", (event) => {
    if (!suppressClick) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    suppressClick = false;
  }, true);

  carousel.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      showSlide(currentIndex - 1);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      showSlide(currentIndex + 1);
    }
  });

  showSlide(currentIndex);
}

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
    const filtersActive = selectedCategory !== "all" || selectedStatus !== "all" || selectedCity !== "all" || Boolean(query);
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
      const visible = categoryMatch && statusMatch && cityMatch && queryMatch;
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
      if (statusMatch && cityMatch && queryMatch) {
        categoryHits.set(card.dataset.category, (categoryHits.get(card.dataset.category) || 0) + 1);
      }
      if (categoryMatch && statusMatch && queryMatch) {
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
  clearButton?.addEventListener("click", () => {
    selectedCategory = "all";
    if (searchInput) searchInput.value = "";
    if (statusSelect) statusSelect.value = "all";
    if (citySelect) citySelect.value = "all";
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
    sourceName: String(item?.sourceName || ""),
    mapQuery: String(item?.mapQuery || ""),
    venue: String(item?.venue || "")
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
  const mapLabel = plannerPage.dataset.mapLabel || "Map search";
  const googleLabel = plannerPage.dataset.googleLabel || "Google Maps";
  const naverLabel = plannerPage.dataset.naverLabel || "Naver Map";
  const kakaoLabel = plannerPage.dataset.kakaoLabel || "Kakao Map";
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

    const mapQuery = item.mapQuery || item.venue || item.city;
    const mapBlock = document.createElement("div");
    mapBlock.className = "planner-card-map";

    const mapText = document.createElement("span");
    mapText.textContent = `${mapLabel}: ${mapQuery}`;
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
    }

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

    card.append(meta, title, date, mapBlock, actions);
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
