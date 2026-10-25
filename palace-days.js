// Palace open-days rules, shared by the build (server-rendered table) and the browser (date picker).
// No imports or exports: loading this file defines globalThis.PalaceDays in both places.
(() => {
  const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const addDays = (iso, days) => {
    const date = new Date(`${iso}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0, 10);
  };
  const weekday = (iso) => new Date(`${iso}T00:00:00Z`).getUTCDay();
  const month = (iso) => Number(iso.slice(5, 7));
  const inRange = (iso, rule) => iso >= rule.from && iso <= rule.to;
  const shortDate = (iso) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

  function holidayName(data, iso) {
    return data.holidays.find((holiday) => holiday.date === iso)?.name || "";
  }

  // Korea Heritage Service rule: a regular closing day that falls on a public or substitute
  // holiday stays open, and the first following non-holiday becomes the closing day instead.
  function closure(data, site, iso) {
    const isHoliday = (day) => Boolean(holidayName(data, day));
    if ((site.closedDates || []).includes(iso.slice(5))) return { closed: true, reason: "Closed every January 1" };
    if (!site.holidayShift) {
      return weekday(iso) === site.closedWeekday ? { closed: true, reason: `Regular ${WEEKDAYS[site.closedWeekday]} closure` } : { closed: false };
    }
    if (isHoliday(iso)) return { closed: false, holiday: weekday(iso) === site.closedWeekday };
    if (weekday(iso) === site.closedWeekday) return { closed: true, reason: `Regular ${WEEKDAYS[site.closedWeekday]} closure` };
    for (let back = 1; back < 7; back += 1) {
      const candidate = addDays(iso, -back);
      if (weekday(candidate) !== site.closedWeekday) continue;
      if (!isHoliday(candidate)) break;
      let next = addDays(candidate, 1);
      while (isHoliday(next)) next = addDays(next, 1);
      if (next === iso) return { closed: true, reason: `The ${WEEKDAYS[site.closedWeekday]} closure moved here because ${WEEKDAYS[site.closedWeekday]}, ${shortDate(candidate)}, was a public holiday` };
      break;
    }
    return { closed: false };
  }

  function dayFor(data, iso) {
    const holiday = holidayName(data, iso);
    const covered = iso >= data.coverage.from && iso <= data.coverage.to;
    const sites = data.sites.map((site) => {
      const state = closure(data, site, iso);
      const hours = site.hours.find((rule) => rule.months.includes(month(iso))) || site.hours[0];
      const exceptions = (data.exceptions || []).filter((rule) => rule.sites.includes(site.id) && inRange(iso, rule));
      const override = exceptions.find((rule) => rule.close);
      const freeAll = exceptions.find((rule) => rule.free);
      const cultureDay = site.cultureDay && weekday(iso) === 3;
      let entry = site.adultFee ? `Adults ${site.adultFee.toLocaleString("en-US")} won` : "Free";
      if (site.adultFee && freeAll) entry = `Free for everyone (${freeAll.label})`;
      else if (site.adultFee && cultureDay) entry = "Free (Wednesday Culture Day)";
      let mode = "";
      if (site.timedDays) {
        const general = freeAll?.selfGuided || holiday || !site.timedDays.includes(weekday(iso));
        mode = general ? site.selfGuidedText : site.timedText;
      }
      return {
        id: site.id,
        name: site.name,
        korean: site.korean,
        guide: site.guide,
        open: !state.closed,
        reason: state.closed ? state.reason : state.holiday ? `Open on the holiday; the ${WEEKDAYS[site.closedWeekday]} closure moves to the next day that is not a public holiday` : "",
        hours: override ? `${hours.open}–${override.close}` : `${hours.open}–${hours.close}`,
        lastEntry: override ? override.lastEntry : hours.lastEntry,
        hoursNote: override ? override.label : "",
        entry,
        mode,
        note: site.note || ""
      };
    });
    return { iso, weekday: WEEKDAYS[weekday(iso)], holiday, covered, openCount: sites.filter((site) => site.open).length, sites };
  }

  globalThis.PalaceDays = { dayFor, closure, addDays, shortDate, WEEKDAYS };
})();
