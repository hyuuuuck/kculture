/* Shared, deterministic date decisions for browsing and saved visits.
   Documentary schedules are not reservations or live operating guarantees. */
const KSpotPlanning = (() => {
  function validDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return false;
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
  }
  function koreaToday(now = new Date()) {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
    const value = type => parts.find(part => part.type === type).value;
    return `${value("year")}-${value("month")}-${value("day")}`;
  }
  function visitDecision(item, date, today = koreaToday()) {
    if (!date) return { state: "unselected", message: "Choose a visit date to check known schedule limits.", exportable: false };
    if (!validDate(date)) return { state: "invalid", message: "Enter a real date in year-month-day format.", exportable: false };
    if (item.retired) return { state: "blocked", message: "This article is no longer in the current selection. Recheck the organizer; calendar export is unavailable.", exportable: false };
    if (!validDate(item.start) || !validDate(item.end)) return { state: "unknown", message: "The date range is not verified. Check the organizer before planning.", exportable: false };
    if (date < today) return { state: "blocked", message: "This visit date has passed. Choose a future date.", exportable: false };
    if (date < item.start || date > item.end) return { state: "blocked", message: `Outside the listed period (${item.start} to ${item.end}).`, exportable: false };
    const schedule = item.schedule || {};
    const day = new Date(`${date}T00:00:00Z`).getUTCDay();
    if (schedule.closedDates?.includes(date)) return { state: "blocked", message: "The checked notice lists a closure on this date. Choose another day.", exportable: false };
    if (schedule.closedWeekdays?.includes(day)) return { state: "blocked", message: "The regular schedule is closed on this weekday. Choose another day.", exportable: false };
    if (schedule.weekdays?.length && !schedule.weekdays.includes(day)) return { state: "blocked", message: "No regular session is listed on this weekday. Check for a special announcement or choose a scheduled day.", exportable: false };
    const age = validDate(schedule.checkedAt) ? (Date.parse(today) - Date.parse(schedule.checkedAt)) / 86400000 : Infinity;
    let note = schedule.dateNotes?.[date] || schedule.note || "Daily sessions and admission still need checking with the organizer.";
    if (schedule.dateTimes?.[date]) {
      note = `${schedule.dateTimes[date]} ${note}`;
    } else if (schedule.seasonalTimes) {
      const month = Number(date.slice(5, 7));
      note = `${month >= 3 && month <= 9 ? schedule.seasonalTimes.summer : schedule.seasonalTimes.winter} ${note}`;
    }
    return { state: "candidate", exportable: true, message: `Within the listed dates—not a confirmed session. ${note}${age > 14 ? " This schedule check is over 14 days old or undated; recheck the official notice." : ""}` };
  }
  function safeLink(value, { local = false } = {}) {
    const text = String(value || "");
    if (local) return /^\/en\/(?:events|guides)\/[a-z0-9-]+\/?$/.test(text) ? text : "";
    try { const url = new URL(text); return url.protocol === "https:" && !url.username && !url.password ? url.href : ""; } catch { return ""; }
  }
  function operatingNotice(item) {
    return safeLink(item.schedule?.dateSources?.[item.visitDate] || item.schedule?.sourceUrl || item.sourceUrl);
  }
  function reconcileSaved(raw, catalog) {
    if (!Array.isArray(raw)) return [];
    const seen = new Set();
    return raw.slice(0, 100).flatMap(old => {
      const slug = typeof old?.slug === "string" ? old.slug : "";
      if (!/^[a-z0-9-]{1,160}$/.test(slug) || seen.has(slug)) return [];
      seen.add(slug);
      const live = catalog.find(item => item.slug === slug);
      const visitDate = validDate(old.visitDate) ? old.visitDate : "";
      if (live) return [{ ...live, visitDate, retired: false }];
      return [{ slug, title: String(old.title || "Previously saved place").slice(0, 240), city: String(old.city || "").slice(0, 80), start: "", end: "", date: "No longer in the current selection", url: "", sourceUrl: safeLink(old.sourceUrl), mapQuery: "", visitDate, retired: true }];
    }).slice(0, 24);
  }
  function icsEscape(value) {
    return String(value || "").replaceAll("\\", "\\\\").replace(/\r\n|\r|\n/g, "\\n").replaceAll(",", "\\,").replaceAll(";", "\\;");
  }
  function foldLine(line) {
    const encoder = new TextEncoder();
    const chunks = [];
    let chunk = "", bytes = 0;
    for (const char of line) {
      const size = encoder.encode(char).length;
      if (bytes + size > 75) { chunks.push(chunk); chunk = " "; bytes = 1; }
      chunk += char; bytes += size;
    }
    chunks.push(chunk);
    return chunks.join("\r\n");
  }
  function calendarText(items, today = koreaToday(), now = new Date()) {
    const planned = items.filter(item => visitDecision(item, item.visitDate, today).exportable);
    if (!planned.length) return "";
    const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//K-Spot Now//Tentative Visits//EN", "CALSCALE:GREGORIAN", "X-WR-CALNAME:K-Spot Now Planned Visits"];
    for (const item of planned) {
      const officialUrl = operatingNotice(item);
      const next = new Date(`${item.visitDate}T00:00:00Z`); next.setUTCDate(next.getUTCDate() + 1);
      const decision = visitDecision(item, item.visitDate, today);
      lines.push("BEGIN:VEVENT", `UID:${item.slug}-visit@kspotnow.com`, `DTSTAMP:${now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}`, `SUMMARY:${icsEscape(`Planned visit: ${item.title}`)}`, `DTSTART;VALUE=DATE:${item.visitDate.replaceAll("-", "")}`, `DTEND;VALUE=DATE:${next.toISOString().slice(0, 10).replaceAll("-", "")}`, "STATUS:TENTATIVE", "TRANSP:TRANSPARENT", `LOCATION:${icsEscape([item.venue || item.mapQuery, item.city].filter(Boolean).join(", "))}`, `DESCRIPTION:${icsEscape(`Personal day reminder, not a ticket or timed session. ${decision.message} Official notice: ${officialUrl}`)}`, ...(officialUrl ? [`URL:${officialUrl}`] : []), "END:VEVENT");
    }
    lines.push("END:VCALENDAR");
    return lines.map(foldLine).join("\r\n") + "\r\n";
  }
  return { validDate, koreaToday, visitDecision, reconcileSaved, safeLink, operatingNotice, calendarText, icsEscape };
})();
