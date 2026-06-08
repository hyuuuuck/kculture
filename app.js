const filterRoot = document.querySelector("[data-filters]");
const cards = [...document.querySelectorAll("[data-card]")];

if (filterRoot && cards.length) {
  filterRoot.addEventListener("click", (event) => {
    const button = event.target.closest("[data-filter]");
    if (!button) return;
    const selected = button.dataset.filter;

    for (const item of filterRoot.querySelectorAll("[data-filter]")) {
      item.setAttribute("aria-pressed", String(item === button));
    }

    for (const card of cards) {
      const visible = selected === "all" || card.dataset.category === selected;
      card.classList.toggle("is-hidden", !visible);
    }
  });
}
