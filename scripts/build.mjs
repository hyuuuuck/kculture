import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { todayString } from "./lib/date.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");
const today = todayString();
const siteName = "K-Spot Now";
const siteTagline = "Live Korea events, pop-ups, and deals for visitors.";
const siteDomain = "kspotnow.com";
const siteUrl = process.env.SITE_URL || `https://${siteDomain}`;
const contactEmail = process.env.CONTACT_EMAIL || `contact@${siteDomain}`;
const adsensePublisherId = normalizePublisherId(process.env.GOOGLE_ADSENSE_PUBLISHER_ID || process.env.ADSENSE_PUBLISHER_ID || "");
const adsenseClientId = normalizeAdSenseClientId(process.env.GOOGLE_ADSENSE_CLIENT || process.env.ADSENSE_CLIENT || adsensePublisherId);
const adsenseSlotId = normalizeAdSenseSlotId(process.env.GOOGLE_ADSENSE_SLOT || process.env.ADSENSE_SLOT || "");
const googleSiteVerification = normalizeGoogleSiteVerification(process.env.GOOGLE_SITE_VERIFICATION || "");
const assetVersion = encodeURIComponent(process.env.SITE_ASSET_VERSION || await sourceAssetVersion());

const events = JSON.parse(await fs.readFile(path.join(root, "data", "events.json"), "utf8"));
const sources = JSON.parse(await fs.readFile(path.join(root, "data", "sources.json"), "utf8"));
const curationQueue = JSON.parse(await fs.readFile(path.join(root, "data", "curation-queue.json"), "utf8"));
const guides = JSON.parse(await fs.readFile(path.join(root, "data", "guides.json"), "utf8"));
const weather = JSON.parse(await fs.readFile(path.join(root, "data", "weather-baselines.json"), "utf8"));
const currentWeather = await fs.readFile(path.join(root, "data", "kma-forecast.json"), "utf8").then(JSON.parse).catch(() => null);
const routes = JSON.parse(await fs.readFile(path.join(root, "data", "travel-routes.json"), "utf8"));
const sourceRefreshSummary = await latestFeedJson(/^source-refresh-summary-\d{4}-\d{2}-\d{2}\.json$/);

function normalizePublisherId(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  if (/^ca-pub-\d{16}$/.test(trimmed)) return trimmed.replace("ca-", "");
  if (/^pub-\d{16}$/.test(trimmed)) return trimmed;
  return trimmed;
}

async function sourceAssetVersion() {
  const hash = createHash("sha256");
  const [css, js] = await Promise.all([
    fs.readFile(path.join(root, "styles.css")),
    fs.readFile(path.join(root, "app.js"))
  ]);
  hash.update(css);
  hash.update(js);
  return hash.digest("hex").slice(0, 12);
}

function normalizeAdSenseClientId(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  if (/^pub-\d{16}$/.test(trimmed)) return `ca-${trimmed}`;
  return trimmed;
}

function normalizeAdSenseSlotId(value) {
  return String(value || "").trim();
}

function normalizeGoogleSiteVerification(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  const contentMatch = trimmed.match(/content=["']([^"']+)["']/i);
  return contentMatch ? contentMatch[1].trim() : trimmed.replace(/^["']|["']$/g, "");
}

async function latestFeedJson(pattern) {
  const feedDir = path.join(root, "data", "feeds");
  const entries = await fs.readdir(feedDir, { withFileTypes: true }).catch(() => []);
  const fileName = entries
    .filter((entry) => entry.isFile() && pattern.test(entry.name))
    .map((entry) => entry.name)
    .sort()
    .at(-1);
  if (!fileName) return null;
  const data = await fs.readFile(path.join(feedDir, fileName), "utf8").then(JSON.parse).catch(() => null);
  return data ? { fileName, data } : null;
}

let languages = {
  en: { name: "English", locale: "en-US" },
  es: { name: "Español", locale: "es-ES" },
  zh: { name: "中文", locale: "zh-CN" },
  pt: { name: "Português", locale: "pt-BR" },
  ru: { name: "Русский", locale: "ru-RU" }
};

let dict = {
  en: {
    navEvents: "Events",
    navNow: "Now",
    navCalendar: "Calendar",
    navGuides: "Guides",
    navPlanner: "Planner",
    navSources: "Sources",
    navAbout: "About",
    heroEyebrow: siteTagline,
    heroTitle: siteName,
    heroText: "Live official-source checks for Korea festivals, K-pop pop-ups, beauty deals, duty-free offers, department-store events, weather planning, and map-ready visitor notes.",
    ctaEvents: "Browse events",
    ctaCalendar: "Open calendar",
    liveNow: "Live now",
    upcoming: "Upcoming",
    archive: "Archive",
    official: "Official source",
    lastChecked: "Last checked",
    collectionMode: "Collection",
    period: "Period",
    location: "Location",
    venue: "Venue",
    mapLinksTitle: "Map and transit checks",
    googleMap: "Google Maps",
    naverMap: "Naver Map",
    kakaoMap: "Kakao Map",
    mapNote: "Use the Korean place name for the most accurate map result.",
    weatherPlan: "Weather planning",
    travelIdeas: "Travel ideas",
    routeIdeas: "Nearby route ideas",
    routePages: "Travel routes",
    categoryPages: "Browse by topic",
    verifyBefore: "Verify on the official source before visiting.",
    relatedEventsTitle: "Nearby and similar events",
    relatedGuides: "Related guides",
    category: "Category",
    allCities: "All cities",
    all: "All",
    festival: "Festivals",
    kpop: "K-pop pop-ups",
    beauty: "Beauty deals",
    dutyfree: "Duty free",
    department: "Department stores",
    shopping: "Shopping",
    benefits: "Travel benefits",
    calendarTitle: "Event Calendar",
    calendarText: "Dates are shown as planning ranges. Offers may end early, so every detail page links back to the official source.",
    downloadCalendar: "Download calendar file",
    calendarWeather: "Weather planning",
    packHint: "Pack",
    forecastStripTitle: "KMA day-by-day forecast",
    forecastMorning: "AM",
    forecastAfternoon: "PM",
    forecastLowHigh: "Low / High",
    forecastRainChance: "Rain",
    forecastNoData: "No period data",
    todayLabel: "Today",
    tomorrowLabel: "Tomorrow",
    sourcesTitle: "Source System",
    sourcesText: "The site separates official APIs, official page monitoring, and K-pop curation queues so fresh content stays safer for AdSense and travelers.",
    sourceRefreshTitle: "Latest source refresh",
    sourceRefreshText: "A public operating snapshot from the latest official-source monitor run.",
    sourceRefreshNoData: "No source refresh summary has been generated yet.",
    sourceRefreshJson: "Open public JSON",
    sourceRefreshAttention: "Sources needing attention",
    sourceRefreshCandidates: "High-signal candidate pages",
    sourceRefreshDraftSources: "Top draft sources",
    sourceRefreshRule: "Candidates are not published directly. Each item still needs official date, venue, eligibility, inventory, and original-summary review.",
    navWatchlist: "Watchlist",
    watchlistTitle: "Official Monitoring Watchlist",
    watchlistText: "The official sources, listing pages, ticketing roots, and curation queues checked before new public event pages are published.",
    freshnessTitle: "Freshness Log",
    freshnessText: "Every listing shows when it was last checked and which official source was used.",
    freshness: "Freshness",
    freshnessFresh: "Fresh",
    freshnessCurrent: "Recently checked",
    freshnessSoon: "Recheck soon",
    freshnessStale: "Needs official recheck",
    freshnessArchive: "Archive check",
    checkedToday: "checked today",
    checkedYesterday: "checked yesterday",
    daysAgo: "days ago",
    nowTitle: "What to check now",
    nowText: "Live, ending-soon, newly checked, and this-week Korea events from official sources.",
    nowDashboard: "Update snapshot",
    monitoredSources: "Watched sources",
    activeQueue: "Active review queue",
    fastMovingTopics: "Fast-moving topics",
    latestCheckedGallery: "Latest checked gallery",
    latestCheckedText: "Newest official checks across events, shopping offers, duty-free campaigns, and pop-up notices.",
    rssFeedLabel: "RSS feed",
    jsonFeedLabel: "JSON feed",
    freshnessLogLabel: "Freshness log",
    recheckQueueTitle: "Official recheck queue",
    recheckQueueText: "Fast-moving live or upcoming pages that should be reopened on the official source soon.",
    recheckDueNow: "recheck now",
    recheckDueToday: "due today",
    recheckDueTomorrow: "due tomorrow",
    recheckDueInDays: "due in {count} days",
    sourceLink: "Source",
    livePanel: "Live now",
    endingSoon: "Ending soon",
    newlyChecked: "Newly checked",
    thisWeek: "This week",
    daysLeft: "days left",
    startsIn: "starts in",
    noItemsYet: "No matching items right now. Check the calendar or source watchlist.",
    searchEvents: "Search",
    searchPlaceholder: "Title, city, venue, source",
    statusFilter: "Status",
    allStatuses: "All statuses",
    clearFilters: "Reset",
    resultCountOneTemplate: "1 event shown",
    resultCountTemplate: "{count} events shown",
    saveEvent: "Save",
    savedEvent: "Saved",
    savedPlannerTitle: "Saved Korea plan",
    savedPlannerEmpty: "Save events to compare dates, cities, and official links.",
    savedPlannerCountOne: "1 saved event",
    savedPlannerCount: "{count} saved events",
    openPlanner: "Open planner",
    clearSaved: "Clear saved",
    removeSaved: "Remove",
    openSavedEvent: "Open",
    plannerTitle: "Saved event planner",
    plannerText: "Compare the Korea events you saved on this device, then open official sources before booking or changing plans.",
    plannerEmptyTitle: "No saved events yet",
    plannerEmptyText: "Save events from the gallery or detail pages to build a simple Korea trip shortlist.",
    downloadSavedCalendar: "Download saved calendar",
    officialLabel: "Official",
    editorialTitle: "Editorial Policy",
    editorialText: "How K-Spot Now collects, reviews, translates, and publishes event information.",
    correctionsTitle: "Corrections and Updates",
    correctionsText: "How visitors, official organizers, and brand teams can report outdated or incorrect event details.",
    guidesTitle: "Visitor Guides",
    aboutTitle: "About K-Spot Now",
    contactTitle: "Contact",
    privacyTitle: "Privacy Policy",
    cookieTitle: "Cookie Policy",
    termsTitle: "Terms",
    statusLive: "Live",
    statusUpcoming: "Upcoming",
    statusEnded: "Ended",
    readDetails: "Details",
    officialVisitorInfo: "Official visitor info",
    venueScheduleTitle: "Venue schedule",
    officialHighlightsTitle: "Official highlights",
    eventWebsite: "Event website",
    eventTheme: "Theme",
    hoursOfOperation: "Hours",
    programHours: "Program hours",
    websiteLanguages: "Website languages",
    address: "Address",
    transportation: "Transportation",
    parking: "Parking",
    smartGuide: "Smart guide",
    sourceWarning: "Official details can change. Always confirm the latest rules, location, eligibility, and inventory."
  },
  es: {
    navEvents: "Eventos",
    navCalendar: "Calendario",
    navGuides: "Guías",
    navSources: "Fuentes",
    navAbout: "Acerca",
    heroEyebrow: "Eventos, pop-ups, K-beauty, duty free en Corea",
    heroTitle: "Encuentra eventos en Corea antes de que desaparezcan.",
    heroText: "Radar multilingüe para visitantes: fuentes oficiales, fechas claras, miniaturas, calendario, clima y rutas cercanas.",
    ctaEvents: "Ver eventos",
    ctaCalendar: "Abrir calendario",
    liveNow: "Activos",
    upcoming: "Próximos",
    archive: "Archivo",
    official: "Fuente oficial",
    lastChecked: "Última revisión",
    collectionMode: "Colección",
    period: "Periodo",
    location: "Ubicación",
    venue: "Lugar",
    weatherPlan: "Clima",
    travelIdeas: "Ideas de viaje",
    verifyBefore: "Verifica en la fuente oficial antes de ir.",
    relatedGuides: "Guías relacionadas",
    category: "Categoría",
    all: "Todos",
    festival: "Festivales",
    kpop: "K-pop pop-ups",
    beauty: "Beauty deals",
    dutyfree: "Duty free",
    department: "Tiendas",
    shopping: "Compras",
    benefits: "Beneficios",
    calendarTitle: "Calendario de eventos",
    calendarText: "Las fechas son rangos de planificación. Algunas ofertas pueden cerrar antes.",
    downloadCalendar: "Descargar calendario",
    sourcesTitle: "Sistema de fuentes",
    sourcesText: "Separamos APIs oficiales, monitoreo de páginas oficiales y cola de curación K-pop.",
    guidesTitle: "Guías para visitantes",
    aboutTitle: "Acerca de K-Spot Now",
    contactTitle: "Contacto",
    privacyTitle: "Política de privacidad",
    termsTitle: "Términos",
    statusLive: "Activo",
    statusUpcoming: "Próximo",
    statusEnded: "Finalizado",
    readDetails: "Detalles",
    sourceWarning: "Los detalles oficiales pueden cambiar. Confirma reglas, ubicación, elegibilidad e inventario."
  },
  zh: {
    navEvents: "活动",
    navCalendar: "日历",
    navGuides: "指南",
    navSources: "来源",
    navAbout: "关于",
    heroEyebrow: "韩国活动、快闪、K-beauty、免税优惠",
    heroTitle: "在活动结束前发现韩国最新去处。",
    heroText: "面向外国游客的多语言雷达：官方来源、清晰日期、缩略图、日历、天气提示和附近旅行建议。",
    ctaEvents: "查看活动",
    ctaCalendar: "打开日历",
    liveNow: "进行中",
    upcoming: "即将开始",
    archive: "档案",
    official: "官方来源",
    lastChecked: "最后确认",
    collectionMode: "采集方式",
    period: "期间",
    location: "位置",
    venue: "场地",
    weatherPlan: "天气准备",
    travelIdeas: "旅行建议",
    verifyBefore: "出发前请在官方来源再次确认。",
    relatedGuides: "相关指南",
    category: "类别",
    all: "全部",
    festival: "节庆",
    kpop: "K-pop 快闪",
    beauty: "美妆优惠",
    dutyfree: "免税",
    department: "百货",
    shopping: "购物",
    benefits: "旅行优惠",
    calendarTitle: "活动日历",
    calendarText: "日期为规划范围，优惠可能提前结束，请查看官方链接。",
    downloadCalendar: "下载日历文件",
    sourcesTitle: "来源系统",
    sourcesText: "区分官方 API、官方页面监控和 K-pop 人工审核队列。",
    guidesTitle: "游客指南",
    aboutTitle: "关于 K-Spot Now",
    contactTitle: "联系",
    privacyTitle: "隐私政策",
    termsTitle: "条款",
    statusLive: "进行中",
    statusUpcoming: "即将",
    statusEnded: "已结束",
    readDetails: "详情",
    sourceWarning: "官方信息可能变化。请确认规则、地点、资格和库存。"
  },
  pt: {
    navEvents: "Eventos",
    navCalendar: "Calendário",
    navGuides: "Guias",
    navSources: "Fontes",
    navAbout: "Sobre",
    heroEyebrow: "Eventos, pop-ups, K-beauty e duty free na Coreia",
    heroTitle: "Encontre eventos na Coreia antes que acabem.",
    heroText: "Radar multilíngue para visitantes: fontes oficiais, datas claras, thumbnails, calendário, clima e ideias de roteiro.",
    ctaEvents: "Ver eventos",
    ctaCalendar: "Abrir calendário",
    liveNow: "Ao vivo",
    upcoming: "Próximos",
    archive: "Arquivo",
    official: "Fonte oficial",
    lastChecked: "Última checagem",
    collectionMode: "Coleta",
    period: "Período",
    location: "Localização",
    venue: "Lugar",
    weatherPlan: "Clima",
    travelIdeas: "Ideias de viagem",
    verifyBefore: "Confirme na fonte oficial antes de visitar.",
    relatedGuides: "Guias relacionados",
    category: "Categoria",
    all: "Todos",
    festival: "Festivais",
    kpop: "K-pop pop-ups",
    beauty: "Beauty deals",
    dutyfree: "Duty free",
    department: "Lojas",
    shopping: "Compras",
    benefits: "Benefícios",
    calendarTitle: "Calendário de eventos",
    calendarText: "Datas são faixas de planejamento. Ofertas podem terminar cedo.",
    downloadCalendar: "Baixar calendário",
    sourcesTitle: "Sistema de fontes",
    sourcesText: "Separamos APIs oficiais, monitoramento oficial e curadoria K-pop.",
    guidesTitle: "Guias para visitantes",
    aboutTitle: "Sobre K-Spot Now",
    contactTitle: "Contato",
    privacyTitle: "Política de privacidade",
    termsTitle: "Termos",
    statusLive: "Ativo",
    statusUpcoming: "Próximo",
    statusEnded: "Encerrado",
    readDetails: "Detalhes",
    sourceWarning: "Detalhes oficiais podem mudar. Confirme regras, local, elegibilidade e estoque."
  },
  ru: {
    navEvents: "События",
    navCalendar: "Календарь",
    navGuides: "Гайды",
    navSources: "Источники",
    navAbout: "О проекте",
    heroEyebrow: "События, pop-up, K-beauty и duty free в Корее",
    heroTitle: "Находите события в Корее до того, как они закончатся.",
    heroText: "Многоязычный радар для туристов: официальные источники, даты, миниатюры, календарь, погода и идеи маршрутов.",
    ctaEvents: "Смотреть события",
    ctaCalendar: "Календарь",
    liveNow: "Сейчас",
    upcoming: "Скоро",
    archive: "Архив",
    official: "Официальный источник",
    lastChecked: "Проверено",
    collectionMode: "Сбор",
    period: "Период",
    location: "Локация",
    venue: "Место",
    weatherPlan: "Погода",
    travelIdeas: "Маршрут",
    verifyBefore: "Проверьте официальный источник перед визитом.",
    relatedGuides: "Похожие гайды",
    category: "Категория",
    all: "Все",
    festival: "Фестивали",
    kpop: "K-pop pop-up",
    beauty: "Beauty deals",
    dutyfree: "Duty free",
    department: "Универмаги",
    shopping: "Шопинг",
    benefits: "Выгоды",
    calendarTitle: "Календарь событий",
    calendarText: "Даты указаны для планирования. Акции могут завершиться раньше.",
    downloadCalendar: "Скачать календарь",
    sourcesTitle: "Система источников",
    sourcesText: "Отделяем официальные API, мониторинг страниц и K-pop очередь проверки.",
    guidesTitle: "Гайды для туристов",
    aboutTitle: "О K-Spot Now",
    contactTitle: "Контакт",
    privacyTitle: "Политика конфиденциальности",
    termsTitle: "Условия",
    statusLive: "Идет",
    statusUpcoming: "Скоро",
    statusEnded: "Завершено",
    readDetails: "Подробнее",
    sourceWarning: "Официальные детали могут измениться. Проверьте правила, место, доступность и наличие."
  }
};

languages = {
  en: { name: "English", locale: "en-US" },
  es: { name: "Español", locale: "es-ES" },
  zh: { name: "中文", locale: "zh-CN" },
  pt: { name: "Português", locale: "pt-BR" },
  ru: { name: "Русский", locale: "ru-RU" }
};

dict = {
  en: {
    navEvents: "Events",
    navNow: "Now",
    navCalendar: "Calendar",
    navGuides: "Guides",
    navPlanner: "Planner",
    navSources: "Sources",
    navAbout: "About",
    heroEyebrow: siteTagline,
    heroTitle: siteName,
    heroText: "Live official-source checks for Korea festivals, K-pop pop-ups, beauty deals, duty-free offers, department-store events, weather planning, and map-ready visitor notes.",
    ctaEvents: "Browse events",
    ctaCalendar: "Open calendar",
    liveNow: "Live now",
    upcoming: "Upcoming",
    archive: "Archive",
    official: "Official source",
    lastChecked: "Last checked",
    collectionMode: "Collection",
    period: "Period",
    location: "Location",
    venue: "Venue",
    mapLinksTitle: "Map and transit checks",
    googleMap: "Google Maps",
    naverMap: "Naver Map",
    kakaoMap: "Kakao Map",
    mapNote: "Use the Korean place name for the most accurate map result.",
    weatherPlan: "Weather planning",
    travelIdeas: "Travel ideas",
    routeIdeas: "Nearby route ideas",
    routePages: "Travel routes",
    categoryPages: "Browse by topic",
    cityPages: "Browse by city",
    browseDirectory: "Browse event types and places",
    browseTypeTitle: "Event types",
    browseTypeText: "Start with festivals, K-pop pop-ups, beauty, duty-free, shopping, or visitor benefits.",
    browsePlaceTitle: "Places",
    browsePlaceText: "City and nationwide pages are separated from topics so visitors can scan by destination.",
    verifyBefore: "Verify on the official source before visiting.",
    relatedEventsTitle: "Nearby and similar events",
    relatedGuides: "Related guides",
    category: "Category",
    allCities: "All cities",
    all: "All",
    festival: "Festivals",
    kpop: "K-pop pop-ups",
    beauty: "Beauty deals",
    dutyfree: "Duty free",
    department: "Department stores",
    shopping: "Shopping",
    benefits: "Travel benefits",
    calendarTitle: "Event Calendar",
    calendarText: "Dates are shown as planning ranges. Offers may end early, so every detail page links back to the official source.",
    downloadCalendar: "Download calendar file",
    calendarWeather: "Weather planning",
    packHint: "Pack",
    forecastStripTitle: "KMA day-by-day forecast",
    forecastMorning: "AM",
    forecastAfternoon: "PM",
    forecastLowHigh: "Low / High",
    forecastRainChance: "Rain",
    forecastNoData: "No period data",
    todayLabel: "Today",
    tomorrowLabel: "Tomorrow",
    sourcesTitle: "Source System",
    sourcesText: "The site separates official APIs, official page monitoring, and K-pop curation queues so fresh content stays safer for AdSense and travelers.",
    sourceRefreshTitle: "Latest source refresh",
    sourceRefreshText: "A public operating snapshot from the latest official-source monitor run.",
    sourceRefreshNoData: "No source refresh summary has been generated yet.",
    sourceRefreshJson: "Open public JSON",
    sourceRefreshAttention: "Sources needing attention",
    sourceRefreshCandidates: "High-signal candidate pages",
    sourceRefreshDraftSources: "Top draft sources",
    sourceRefreshRule: "Candidates are not published directly. Each item still needs official date, venue, eligibility, inventory, and original-summary review.",
    navWatchlist: "Watchlist",
    watchlistTitle: "Official Monitoring Watchlist",
    watchlistText: "The official sources, listing pages, ticketing roots, and curation queues checked before new public event pages are published.",
    freshnessTitle: "Freshness Log",
    freshnessText: "Every listing shows when it was last checked and which official source was used.",
    freshness: "Freshness",
    freshnessFresh: "Fresh",
    freshnessCurrent: "Recently checked",
    freshnessSoon: "Recheck soon",
    freshnessStale: "Needs official recheck",
    freshnessArchive: "Archive check",
    checkedToday: "checked today",
    checkedYesterday: "checked yesterday",
    daysAgo: "days ago",
    nowTitle: "What to check now",
    nowText: "Live, ending-soon, newly checked, and this-week Korea events from official sources.",
    nowDashboard: "Update snapshot",
    monitoredSources: "Watched sources",
    activeQueue: "Active review queue",
    fastMovingTopics: "Fast-moving topics",
    latestCheckedGallery: "Latest checked gallery",
    latestCheckedText: "Newest official checks across events, shopping offers, duty-free campaigns, and pop-up notices.",
    rssFeedLabel: "RSS feed",
    jsonFeedLabel: "JSON feed",
    freshnessLogLabel: "Freshness log",
    recheckQueueTitle: "Official recheck queue",
    recheckQueueText: "Fast-moving live or upcoming pages that should be reopened on the official source soon.",
    recheckDueNow: "recheck now",
    recheckDueToday: "due today",
    recheckDueTomorrow: "due tomorrow",
    recheckDueInDays: "due in {count} days",
    sourceLink: "Source",
    livePanel: "Live now",
    endingSoon: "Ending soon",
    newlyChecked: "Newly checked",
    thisWeek: "This week",
    daysLeft: "days left",
    startsIn: "starts in",
    noItemsYet: "No matching items right now. Check the calendar or source watchlist.",
    searchEvents: "Search",
    searchPlaceholder: "Title, city, venue, source",
    statusFilter: "Status",
    allStatuses: "All statuses",
    clearFilters: "Reset",
    resultCountOneTemplate: "1 event shown",
    resultCountTemplate: "{count} events shown",
    saveEvent: "Save",
    savedEvent: "Saved",
    savedPlannerTitle: "Saved Korea plan",
    savedPlannerEmpty: "Save events to compare dates, cities, and official links.",
    savedPlannerCountOne: "1 saved event",
    savedPlannerCount: "{count} saved events",
    openPlanner: "Open planner",
    clearSaved: "Clear saved",
    removeSaved: "Remove",
    openSavedEvent: "Open",
    plannerTitle: "Saved event planner",
    plannerText: "Compare the Korea events you saved on this device, then open official sources before booking or changing plans.",
    plannerEmptyTitle: "No saved events yet",
    plannerEmptyText: "Save events from the gallery or detail pages to build a simple Korea trip shortlist.",
    downloadSavedCalendar: "Download saved calendar",
    officialLabel: "Official",
    editorialTitle: "Editorial Policy",
    editorialText: "How K-Spot Now collects, reviews, translates, and publishes event information.",
    correctionsTitle: "Corrections and Updates",
    correctionsText: "How visitors, official organizers, and brand teams can report outdated or incorrect event details.",
    guidesTitle: "Visitor Guides",
    aboutTitle: "About K-Spot Now",
    contactTitle: "Contact",
    privacyTitle: "Privacy Policy",
    cookieTitle: "Cookie Policy",
    termsTitle: "Terms",
    statusLive: "Live",
    statusUpcoming: "Upcoming",
    statusEnded: "Ended",
    readDetails: "Details",
    officialVisitorInfo: "Official visitor info",
    venueScheduleTitle: "Venue schedule",
    officialHighlightsTitle: "Official highlights",
    eventWebsite: "Event website",
    eventTheme: "Theme",
    hoursOfOperation: "Hours",
    programHours: "Program hours",
    websiteLanguages: "Website languages",
    address: "Address",
    transportation: "Transportation",
    parking: "Parking",
    smartGuide: "Smart guide",
    sourceWarning: "Official details can change. Always confirm the latest rules, location, eligibility, and inventory."
  },
  es: {
    navEvents: "Eventos",
    navCalendar: "Calendario",
    navGuides: "Guías",
    navSources: "Fuentes",
    navAbout: "Acerca de",
    heroEyebrow: "Eventos, pop-ups, K-beauty y duty free en Corea",
    heroTitle: "Encuentra eventos en Corea antes de que desaparezcan.",
    heroText: "Un radar multilingüe para visitantes: fuentes oficiales, fechas claras, miniaturas, calendario, notas de clima e ideas de ruta cercanas.",
    ctaEvents: "Ver eventos",
    ctaCalendar: "Abrir calendario",
    liveNow: "Activos",
    upcoming: "Próximos",
    archive: "Archivo",
    official: "Fuente oficial",
    lastChecked: "Última revisión",
    collectionMode: "Recopilación",
    period: "Periodo",
    location: "Ubicación",
    venue: "Lugar",
    weatherPlan: "Plan de clima",
    travelIdeas: "Ideas de viaje",
    routeIdeas: "Rutas cercanas",
    routePages: "Rutas de viaje",
    categoryPages: "Explorar por tema",
    cityPages: "Explorar por ciudad",
    verifyBefore: "Verifica la fuente oficial antes de visitar.",
    relatedGuides: "Guías relacionadas",
    category: "Categoría",
    all: "Todos",
    festival: "Festivales",
    kpop: "Pop-ups K-pop",
    beauty: "Ofertas de belleza",
    dutyfree: "Duty free",
    department: "Grandes almacenes",
    shopping: "Compras",
    benefits: "Beneficios de viaje",
    calendarTitle: "Calendario de eventos",
    calendarText: "Las fechas se muestran como rangos de planificación. Algunas ofertas pueden terminar antes.",
    downloadCalendar: "Descargar calendario",
    sourcesTitle: "Sistema de fuentes",
    sourcesText: "El sitio separa APIs oficiales, monitoreo de páginas oficiales y colas de curación K-pop.",
    freshnessTitle: "Registro de actualización",
    freshnessText: "Cada ficha muestra cuándo se revisó y qué fuente oficial se usó.",
    editorialTitle: "Política editorial",
    editorialText: "Cómo K-Spot Now recopila, revisa, traduce y publica información de eventos.",
    guidesTitle: "Guías para visitantes",
    aboutTitle: "Acerca de K-Spot Now",
    contactTitle: "Contacto",
    privacyTitle: "Política de privacidad",
    cookieTitle: "Política de cookies",
    termsTitle: "Términos",
    statusLive: "Activo",
    statusUpcoming: "Próximo",
    statusEnded: "Finalizado",
    readDetails: "Detalles",
    sourceWarning: "Los detalles oficiales pueden cambiar. Confirma siempre reglas, ubicación, elegibilidad e inventario."
  },
  zh: {
    navEvents: "活动",
    navCalendar: "日历",
    navGuides: "指南",
    navSources: "来源",
    navAbout: "关于",
    heroEyebrow: "韩国活动、快闪、K-beauty优惠、免税活动",
    heroTitle: "在韩国活动结束前找到它们。",
    heroText: "面向外国游客的多语言雷达：官方来源、清晰日期、缩略图、日历、天气规划和附近旅行建议。",
    ctaEvents: "浏览活动",
    ctaCalendar: "打开日历",
    liveNow: "进行中",
    upcoming: "即将开始",
    archive: "已归档",
    official: "官方来源",
    lastChecked: "最后检查",
    collectionMode: "收集方式",
    period: "期间",
    location: "地点",
    venue: "场地",
    weatherPlan: "天气规划",
    travelIdeas: "旅行建议",
    routeIdeas: "附近路线建议",
    routePages: "旅行路线",
    categoryPages: "按主题浏览",
    cityPages: "按城市浏览",
    verifyBefore: "出发前请在官方来源确认。",
    relatedGuides: "相关指南",
    category: "类别",
    all: "全部",
    festival: "节庆",
    kpop: "K-pop快闪",
    beauty: "美妆优惠",
    dutyfree: "免税",
    department: "百货商店",
    shopping: "购物",
    benefits: "旅行优惠",
    calendarTitle: "活动日历",
    calendarText: "日期以计划范围显示。优惠可能提前结束，请在详情页确认官方来源。",
    downloadCalendar: "下载日历文件",
    sourcesTitle: "来源系统",
    sourcesText: "本站区分官方API、官方页面监控和K-pop人工审核队列。",
    freshnessTitle: "更新记录",
    freshnessText: "每个条目都会显示最后检查时间和使用的官方来源。",
    editorialTitle: "编辑政策",
    editorialText: "K-Spot Now如何收集、审核、翻译并发布活动信息。",
    guidesTitle: "游客指南",
    aboutTitle: "关于K-Spot Now",
    contactTitle: "联系",
    privacyTitle: "隐私政策",
    cookieTitle: "Cookie 政策",
    termsTitle: "条款",
    statusLive: "进行中",
    statusUpcoming: "即将开始",
    statusEnded: "已结束",
    readDetails: "详情",
    sourceWarning: "官方信息可能变化。请务必确认最新规则、地点、资格和库存。"
  },
  pt: {
    navEvents: "Eventos",
    navCalendar: "Calendário",
    navGuides: "Guias",
    navSources: "Fontes",
    navAbout: "Sobre",
    heroEyebrow: "Eventos, pop-ups, K-beauty e duty free na Coreia",
    heroTitle: "Encontre eventos na Coreia antes que acabem.",
    heroText: "Radar multilíngue para visitantes: fontes oficiais, datas claras, miniaturas, calendário, clima e ideias de roteiro.",
    ctaEvents: "Ver eventos",
    ctaCalendar: "Abrir calendário",
    liveNow: "Ativos",
    upcoming: "Próximos",
    archive: "Arquivo",
    official: "Fonte oficial",
    lastChecked: "Última checagem",
    collectionMode: "Coleta",
    period: "Período",
    location: "Localização",
    venue: "Local",
    weatherPlan: "Planejamento de clima",
    travelIdeas: "Ideias de viagem",
    routeIdeas: "Roteiros próximos",
    routePages: "Roteiros de viagem",
    categoryPages: "Explorar por tema",
    cityPages: "Explorar por cidade",
    verifyBefore: "Confirme na fonte oficial antes de visitar.",
    relatedGuides: "Guias relacionados",
    category: "Categoria",
    all: "Todos",
    festival: "Festivais",
    kpop: "Pop-ups K-pop",
    beauty: "Ofertas de beleza",
    dutyfree: "Duty free",
    department: "Lojas de departamento",
    shopping: "Compras",
    benefits: "Benefícios de viagem",
    calendarTitle: "Calendário de eventos",
    calendarText: "As datas são faixas de planejamento. Ofertas podem terminar antes.",
    downloadCalendar: "Baixar calendário",
    sourcesTitle: "Sistema de fontes",
    sourcesText: "Separamos APIs oficiais, monitoramento oficial e curadoria K-pop.",
    freshnessTitle: "Registro de atualização",
    freshnessText: "Cada item mostra quando foi checado e qual fonte oficial foi usada.",
    editorialTitle: "Política editorial",
    editorialText: "Como o K-Spot Now coleta, revisa, traduz e publica informações de eventos.",
    guidesTitle: "Guias para visitantes",
    aboutTitle: "Sobre K-Spot Now",
    contactTitle: "Contato",
    privacyTitle: "Política de privacidade",
    cookieTitle: "Política de cookies",
    termsTitle: "Termos",
    statusLive: "Ativo",
    statusUpcoming: "Próximo",
    statusEnded: "Encerrado",
    readDetails: "Detalhes",
    sourceWarning: "Detalhes oficiais podem mudar. Confirme sempre regras, local, elegibilidade e estoque."
  },
  ru: {
    navEvents: "События",
    navCalendar: "Календарь",
    navGuides: "Гиды",
    navSources: "Источники",
    navAbout: "О проекте",
    heroEyebrow: "События в Корее, pop-up, K-beauty и duty free",
    heroTitle: "Найдите события в Корее до их завершения.",
    heroText: "Многоязычный радар для туристов: официальные источники, понятные даты, миниатюры, календарь, погода и идеи маршрутов.",
    ctaEvents: "Смотреть события",
    ctaCalendar: "Открыть календарь",
    liveNow: "Сейчас",
    upcoming: "Скоро",
    archive: "Архив",
    official: "Официальный источник",
    lastChecked: "Последняя проверка",
    collectionMode: "Сбор",
    period: "Период",
    location: "Локация",
    venue: "Место",
    weatherPlan: "План по погоде",
    travelIdeas: "Идеи для поездки",
    routeIdeas: "Маршруты рядом",
    routePages: "Маршруты",
    categoryPages: "По темам",
    cityPages: "По городам",
    verifyBefore: "Перед визитом проверьте официальный источник.",
    relatedGuides: "Похожие гиды",
    category: "Категория",
    all: "Все",
    festival: "Фестивали",
    kpop: "K-pop pop-up",
    beauty: "Beauty deals",
    dutyfree: "Duty free",
    department: "Универмаги",
    shopping: "Шопинг",
    benefits: "Выгоды для туристов",
    calendarTitle: "Календарь событий",
    calendarText: "Даты указаны для планирования. Предложения могут закончиться раньше.",
    downloadCalendar: "Скачать календарь",
    sourcesTitle: "Система источников",
    sourcesText: "Мы разделяем официальные API, мониторинг официальных страниц и K-pop очередь проверки.",
    freshnessTitle: "Журнал обновлений",
    freshnessText: "Каждая карточка показывает дату проверки и официальный источник.",
    editorialTitle: "Редакционная политика",
    editorialText: "Как K-Spot Now собирает, проверяет, переводит и публикует информацию о событиях.",
    guidesTitle: "Гиды для посетителей",
    aboutTitle: "О K-Spot Now",
    contactTitle: "Контакты",
    privacyTitle: "Политика конфиденциальности",
    cookieTitle: "Политика cookie",
    termsTitle: "Условия",
    statusLive: "Идет",
    statusUpcoming: "Скоро",
    statusEnded: "Завершено",
    readDetails: "Детали",
    sourceWarning: "Официальные детали могут измениться. Всегда проверяйте правила, место, доступность и наличие."
  }
};

languages.ja = { name: "日本語", locale: "ja-JP" };

dict.ja = {
  ...dict.en,
  navEvents: "イベント",
  navNow: "今見る",
  navCalendar: "カレンダー",
  navGuides: "ガイド",
  navPlanner: "保存リスト",
  navSources: "情報源",
  navAbout: "概要",
  navWatchlist: "監視リスト",
  heroEyebrow: "韓国イベント、K-popポップアップ、ビューティー、免税店セール",
  heroTitle: "韓国のイベントを見逃す前にチェック。",
  heroText: "公式情報、日程、サムネイル、カレンダー、過去の天気目安、周辺旅行情報をまとめた訪韓者向け多言語ガイド。",
  ctaEvents: "イベントを見る",
  ctaCalendar: "カレンダーを開く",
  liveNow: "開催中",
  upcoming: "近日開催",
  archive: "終了",
  official: "公式情報",
  lastChecked: "最終確認",
  collectionMode: "収集方法",
  period: "期間",
  location: "場所",
  venue: "会場",
  mapLinksTitle: "地図・交通確認",
  mapNote: "地図リンクは検索用ショートカットです。訪問前に公式情報で入口、予約場所、運営ルールを確認してください。",
  weatherPlan: "天気の目安",
  travelIdeas: "旅行メモ",
  routeIdeas: "近くのモデルルート",
  routePages: "旅行ルート",
  categoryPages: "テーマ別に見る",
  cityPages: "都市別に見る",
  verifyBefore: "訪問前に必ず公式情報を確認してください。",
  relatedEventsTitle: "近く・関連イベント",
  relatedGuides: "関連ガイド",
  category: "カテゴリ",
  allCities: "すべての都市",
  all: "すべて",
  festival: "祭り・文化イベント",
  kpop: "K-popポップアップ",
  beauty: "ビューティーセール",
  dutyfree: "免税店",
  department: "百貨店",
  shopping: "ショッピング",
  benefits: "旅行特典",
  calendarTitle: "イベントカレンダー",
  calendarText: "日付は旅行計画用の範囲です。セールやイベントは早期終了する場合があるため、詳細ページの公式リンクを確認してください。",
  downloadCalendar: "カレンダーをダウンロード",
  calendarWeather: "天気の目安",
  packHint: "持ち物",
  forecastStripTitle: "気象庁の日別予報",
  forecastMorning: "午前",
  forecastAfternoon: "午後",
  forecastLowHigh: "最低 / 最高",
  forecastRainChance: "降水",
  forecastNoData: "時間帯データなし",
  todayLabel: "今日",
  tomorrowLabel: "明日",
  sourcesTitle: "公式情報システム",
  sourcesText: "公式API、公式ページ監視、K-popキュレーション待ちを分けて、旅行者とAdSense向けに安全な更新体制を保ちます。",
  sourceRefreshTitle: "最新の情報源チェック",
  sourceRefreshText: "公式情報モニターの最新運用スナップショットです。",
  sourceRefreshNoData: "まだ情報源チェックの要約がありません。",
  sourceRefreshJson: "公開JSONを開く",
  sourceRefreshAttention: "確認が必要な情報源",
  sourceRefreshCandidates: "有力な候補ページ",
  sourceRefreshDraftSources: "下書き候補の主な情報源",
  sourceRefreshRule: "候補は自動公開されません。日程、会場、対象条件、在庫、独自要約の確認が必要です。",
  watchlistTitle: "公式監視リスト",
  watchlistText: "新しい公開ページを作る前に確認する公式情報、一覧ページ、チケットサイト、キュレーション待ちです。",
  freshnessTitle: "更新ログ",
  freshnessText: "各掲載情報には最終確認日と使用した公式情報源を表示します。",
  freshness: "更新状態",
  freshnessFresh: "新しい",
  freshnessCurrent: "最近確認",
  freshnessSoon: "再確認予定",
  freshnessStale: "公式再確認が必要",
  freshnessArchive: "終了後チェック",
  checkedToday: "本日確認",
  checkedYesterday: "昨日確認",
  daysAgo: "日前",
  nowTitle: "今チェックする情報",
  nowText: "開催中、終了間近、新規確認、今週の韓国イベントを公式情報からまとめます。",
  nowDashboard: "更新スナップショット",
  monitoredSources: "監視中の情報源",
  activeQueue: "確認待ちキュー",
  fastMovingTopics: "変化が早いテーマ",
  latestCheckedGallery: "最新確認ギャラリー",
  latestCheckedText: "イベント、ショッピング、免税、ポップアップ告知の最新公式チェックです。",
  rssFeedLabel: "RSSフィード",
  jsonFeedLabel: "JSONフィード",
  freshnessLogLabel: "更新ログ",
  recheckQueueTitle: "公式再確認キュー",
  recheckQueueText: "近日中に公式ページを再確認すべき開催中・開催予定の情報です。",
  recheckDueNow: "今すぐ再確認",
  recheckDueToday: "本日中",
  recheckDueTomorrow: "明日まで",
  recheckDueInDays: "{count}日後",
  sourceLink: "情報源",
  livePanel: "開催中",
  endingSoon: "終了間近",
  newlyChecked: "新規確認",
  thisWeek: "今週",
  daysLeft: "日残り",
  startsIn: "開始まで",
  noItemsYet: "該当する項目がありません。カレンダーまたは情報源リストを確認してください。",
  searchEvents: "検索",
  searchPlaceholder: "タイトル、都市、会場、情報源",
  statusFilter: "ステータス",
  allStatuses: "すべてのステータス",
  clearFilters: "リセット",
  resultCountOneTemplate: "1件表示",
  resultCountTemplate: "{count}件表示",
  saveEvent: "保存",
  savedEvent: "保存済み",
  savedPlannerTitle: "韓国旅行の保存リスト",
  savedPlannerEmpty: "イベントを保存して日程、都市、公式リンクを比較できます。",
  savedPlannerCountOne: "保存済み1件",
  savedPlannerCount: "保存済み{count}件",
  openPlanner: "保存リストを開く",
  clearSaved: "保存を消去",
  removeSaved: "削除",
  openSavedEvent: "開く",
  plannerTitle: "保存したイベント",
  plannerText: "この端末に保存した韓国イベントを比較し、予約や移動前に公式情報を確認できます。",
  plannerEmptyTitle: "まだ保存されたイベントはありません",
  plannerEmptyText: "ギャラリーや詳細ページからイベントを保存して、旅行候補リストを作れます。",
  downloadSavedCalendar: "保存カレンダーをダウンロード",
  officialLabel: "公式",
  editorialTitle: "編集方針",
  editorialText: "K-Spot Nowがイベント情報を収集、確認、翻訳、公開する方法です。",
  correctionsTitle: "訂正と更新",
  correctionsText: "古い情報や誤りを報告する方法です。",
  guidesTitle: "訪問者ガイド",
  aboutTitle: "K-Spot Nowについて",
  contactTitle: "お問い合わせ",
  privacyTitle: "プライバシーポリシー",
  cookieTitle: "Cookieポリシー",
  termsTitle: "利用規約",
  statusLive: "開催中",
  statusUpcoming: "近日開催",
  statusEnded: "終了",
  readDetails: "詳細",
  sourceWarning: "公式情報は変更される場合があります。訪問前に最新の規則、場所、対象条件、在庫を必ず確認してください。"
};

const categoryLabels = {
  festival: "festival",
  kpop: "kpop",
  beauty: "beauty",
  "duty-free": "dutyfree",
  "department-store": "department",
  shopping: "shopping",
  "travel-benefits": "benefits"
};

const fastMovingCategories = new Set(["kpop", "beauty", "duty-free", "department-store"]);
const dayMs = 24 * 60 * 60 * 1000;

const categoryDefinitions = {
  festival: {
    title: "Korea festivals and cultural events",
    description: "Officially checked Korea festivals, river events, concerts, performances, and cultural calendars for foreign visitors."
  },
  kpop: {
    title: "K-pop pop-ups, merch stores, and fan events",
    description: "Official K-pop pop-up, merch, reservation, and fan commerce notices with travel planning notes."
  },
  beauty: {
    title: "K-beauty deals and OLIVE YOUNG promotions",
    description: "Official K-beauty sale pages, coupon windows, tax-refund notes, and shopping routes for Korea travelers."
  },
  "duty-free": {
    title: "Korea duty-free events and airport pickup deals",
    description: "Monitored Shilla, Lotte, Shinsegae, and official duty-free offers with eligibility reminders."
  },
  "department-store": {
    title: "Korea department store sales and pop-ups",
    description: "Department-store sales, cultural exhibitions, pop-up stores, and branch-specific events for foreign shoppers."
  },
  shopping: {
    title: "Korea shopping festivals and seasonal sale archives",
    description: "Seasonal shopping campaigns, Korea Grand Sale archives, and official sale planning pages."
  },
  "travel-benefits": {
    title: "Korea travel benefits and visitor coupons",
    description: "Official visitor benefits, partner offers, attraction deals, and recurring travel coupon hubs."
  }
};

const cityDefinitions = {
  Seoul: {
    slug: "seoul",
    title: "Seoul events, pop-ups, shopping, and river festivals",
    description: "Officially checked Seoul events with date ranges, weather planning, shopping notes, and nearby travel routes.",
    weatherRegion: "Seoul"
  },
  Busan: {
    slug: "busan",
    title: "Busan K-pop and city event planner",
    description: "Busan concert, fan project, pop-up, and city event pages for visitors planning transport, lodging, and coastal routes.",
    weatherRegion: "Busan"
  },
  Seongnam: {
    slug: "seongnam",
    title: "Seongnam and Pangyo shopping events",
    description: "Pangyo department-store events, exhibitions, and culture-shopping routes near Seoul.",
    weatherRegion: "Seoul"
  },
  Gwacheon: {
    slug: "gwacheon",
    title: "Gwacheon park and flower festival planner",
    description: "Seoul Grand Park and Gwacheon-area seasonal events with weather and family-friendly route notes.",
    weatherRegion: "Seoul"
  },
  Nationwide: {
    slug: "nationwide",
    title: "Nationwide Korea travel benefits and shopping campaigns",
    description: "Official Korea-wide visitor benefits, seasonal shopping campaigns, and travel discount hubs.",
    weatherRegion: "Nationwide"
  }
};

const watchlistGroups = [
  {
    slug: "tourism-festivals",
    title: "Tourism and festival calendars",
    focus: "Official Korea tourism, Seoul city, culture, exhibition, venue, and festival calendars that can become visitor planning pages.",
    matches: ["tourism", "festival", "visitkorea", "visit seoul", "seoul", "culture", "mcst", "grand park", "coex", "ddp", "showala"]
  },
  {
    slug: "shopping-beauty-dutyfree",
    title: "Shopping, K-beauty, duty-free, and department-store offers",
    focus: "OLIVE YOUNG, duty-free boards, department-store news, sales, coupons, pop-up stores, tax refund, and foreign visitor benefit pages.",
    matches: ["olive young", "beauty", "duty free", "department", "shopping", "sale", "coupon", "benefit", "lotte", "shilla", "shinsegae", "hyundai"]
  },
  {
    slug: "kpop-popups-ticketing",
    title: "K-pop pop-ups, merch, fan meetings, and ticketing roots",
    focus: "Official K-pop commerce, ticketing, artist, agency, venue, and global reservation roots that require manual review before publishing.",
    matches: ["k-pop", "kpop", "weverse", "artist", "ticket", "fan", "merch", "concert", "melon", "yes24", "ticketlink", "nol"]
  },
  {
    slug: "weather-routes",
    title: "Weather and travel-route planning",
    focus: "Previous-year weather baselines, public data APIs, and route data used to make event pages useful beyond dates and titles.",
    matches: ["weather", "kma", "route", "attractions", "accommodation", "travel"]
  }
];

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function xmlEsc(value) {
  return esc(String(value ?? "").replace(/[^\u0009\u000a\u000d\u0020-\ud7ff\ue000-\ufffd]/g, ""));
}

function tr(lang, key) {
  const value = dict[lang]?.[key] || dict.en[key] || key;
  return hasMojibake(value) ? (dict.en[key] || key) : value;
}

function hasMojibake(value) {
  return /[\uFFFD\u7aca\u9e1a\u85e5\u8a1d\u74e6\u8fbb\u9035\u7b60\uf908\ucc30\ucc55\ucc3e]|\?{4,}|[A-Za-zÀ-ÿ]\?[A-Za-zÀ-ÿ]/.test(String(value ?? ""));
}

function local(value, lang) {
  if (!value) return "";
  if (typeof value === "string") return hasMojibake(value) ? "" : value;
  const localized = value[lang];
  if (localized && !hasMojibake(localized)) return localized;
  const english = value.en;
  if (english && !hasMojibake(english)) return english;
  return Object.values(value).find((item) => item && !hasMojibake(item)) || "";
}

function localList(value, lang) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter((item) => item && !hasMojibake(item));
  const localized = value[lang];
  if (Array.isArray(localized) && localized.length && !localized.some(hasMojibake)) return localized;
  const english = value.en;
  if (Array.isArray(english) && english.length && !english.some(hasMojibake)) return english;
  return Object.values(value).find((items) => Array.isArray(items) && items.length && !items.some(hasMojibake)) || [];
}

function trimHeading(value, maxLength = 64) {
  if (value.length <= maxLength) return value;
  const clipped = value.slice(0, maxLength);
  const lastSpace = clipped.lastIndexOf(" ");
  if (lastSpace > maxLength * 0.55) return clipped.slice(0, lastSpace);
  const punctuation = Math.max(
    clipped.lastIndexOf("。"),
    clipped.lastIndexOf("，"),
    clipped.lastIndexOf("、"),
    clipped.lastIndexOf("."),
    clipped.lastIndexOf(",")
  );
  if (punctuation > maxLength * 0.45) return clipped.slice(0, punctuation + 1);
  return clipped;
}

function guideSectionHeading(section, index) {
  const compact = String(section || "").replace(/\s+/g, " ").trim();
  const firstSentence = compact.match(/^.+?[.!?。！？]/u)?.[0] || compact;
  const hasCjk = /[\u3400-\u9fff]/u.test(firstSentence);
  const words = firstSentence.split(" ").filter(Boolean);
  const title = hasCjk || words.length < 5 ? trimHeading(firstSentence) : words.slice(0, 5).join(" ");
  return `${index + 1}. ${title}`;
}

function statusOf(event) {
  if (event.endDate < today) return "ended";
  if (event.startDate > today) return "upcoming";
  return "live";
}

function statusLabel(lang, status) {
  return status === "live" ? tr(lang, "statusLive") : status === "upcoming" ? tr(lang, "statusUpcoming") : tr(lang, "statusEnded");
}

function daysSince(iso) {
  return Math.floor((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${iso}T00:00:00Z`)) / dayMs);
}

function freshnessLimitDays(event) {
  const status = statusOf(event);
  if (status === "ended") return 45;
  if (status === "live") return fastMovingCategories.has(event.category) ? 2 : 3;
  return fastMovingCategories.has(event.category) ? 3 : 7;
}

function freshnessAgeText(lang, days) {
  if (days <= 0) return tr(lang, "checkedToday");
  if (days === 1) return tr(lang, "checkedYesterday");
  return `${days} ${tr(lang, "daysAgo")}`;
}

function freshnessInfo(event, lang) {
  const ageDays = daysSince(event.lastChecked);
  const limitDays = freshnessLimitDays(event);
  const status = statusOf(event);
  let tone = "fresh";
  let label = tr(lang, "freshnessFresh");

  if (Number.isNaN(ageDays) || ageDays < 0) {
    tone = "stale";
    label = tr(lang, "freshnessStale");
  } else if (status === "ended" && ageDays > limitDays) {
    tone = "archive";
    label = tr(lang, "freshnessArchive");
  } else if (ageDays > limitDays + 3) {
    tone = "stale";
    label = tr(lang, "freshnessStale");
  } else if (ageDays > limitDays) {
    tone = "soon";
    label = tr(lang, "freshnessSoon");
  } else if (ageDays > 1) {
    tone = "current";
    label = tr(lang, "freshnessCurrent");
  }

  return {
    ageDays,
    limitDays,
    label,
    tone,
    text: Number.isNaN(ageDays) ? label : `${label} · ${freshnessAgeText(lang, ageDays)}`
  };
}

function recheckQueueItems(limit = 8) {
  return events
    .map((event) => {
      const ageDays = daysSince(event.lastChecked);
      const limitDays = freshnessLimitDays(event);
      return {
        event,
        ageDays,
        limitDays,
        daysUntilDue: limitDays - ageDays,
        status: statusOf(event)
      };
    })
    .filter((item) => item.status !== "ended" && Number.isFinite(item.daysUntilDue) && item.daysUntilDue <= 1)
    .sort((a, b) => a.daysUntilDue - b.daysUntilDue || b.event.priority - a.event.priority || a.event.startDate.localeCompare(b.event.startDate))
    .slice(0, limit);
}

function recheckDueText(lang, daysUntilDue) {
  if (daysUntilDue < 0) return tr(lang, "recheckDueNow");
  if (daysUntilDue === 0) return tr(lang, "recheckDueToday");
  if (daysUntilDue === 1) return tr(lang, "recheckDueTomorrow");
  return tr(lang, "recheckDueInDays").replace("{count}", String(daysUntilDue));
}

function daysFromToday(iso) {
  return Math.floor((Date.parse(`${iso}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / dayMs);
}

function statusSort(a, b) {
  const statusWeight = { live: 0, upcoming: 1, ended: 2 };
  return statusWeight[statusOf(a)] - statusWeight[statusOf(b)] || a.startDate.localeCompare(b.startDate) || b.priority - a.priority;
}

function nowGroups() {
  const live = events
    .filter((event) => statusOf(event) === "live")
    .sort((a, b) => a.endDate.localeCompare(b.endDate) || b.priority - a.priority)
    .slice(0, 6);
  const endingSoon = events
    .filter((event) => statusOf(event) === "live" && daysFromToday(event.endDate) <= 7)
    .sort((a, b) => a.endDate.localeCompare(b.endDate) || b.priority - a.priority)
    .slice(0, 6);
  const newlyChecked = events
    .filter((event) => event.lastChecked === today)
    .sort(statusSort)
    .slice(0, 6);
  const thisWeek = events
    .filter((event) => statusOf(event) === "upcoming" && daysFromToday(event.startDate) <= 7)
    .sort((a, b) => a.startDate.localeCompare(b.startDate) || b.priority - a.priority)
    .slice(0, 6);

  return { live, endingSoon, newlyChecked, thisWeek };
}

function nowDashboard(lang) {
  const liveCount = events.filter((event) => statusOf(event) === "live").length;
  const endingSoonCount = events.filter((event) => statusOf(event) === "live" && daysFromToday(event.endDate) <= 7).length;
  const checkedTodayCount = events.filter((event) => event.lastChecked === today).length;
  const thisWeekCount = events.filter((event) => statusOf(event) === "upcoming" && daysFromToday(event.startDate) <= 7).length;
  const fastMovingCount = events.filter((event) => fastMovingCategories.has(event.category) && statusOf(event) !== "ended").length;
  const activeQueueCount = curationQueue.filter((item) => item.status === "active").length;
  const checkedLabel = `${tr(lang, "newlyChecked")} / ${dateText(lang, today)}`;

  const stats = [
    { value: liveCount, label: tr(lang, "liveNow"), detail: `${endingSoonCount} ${tr(lang, "endingSoon").toLowerCase()}` },
    { value: thisWeekCount, label: tr(lang, "thisWeek"), detail: tr(lang, "statusUpcoming") },
    { value: checkedTodayCount, label: checkedLabel, detail: tr(lang, "freshnessTitle") },
    { value: fastMovingCount, label: tr(lang, "fastMovingTopics"), detail: "K-pop, beauty, duty-free, department stores" },
    { value: sources.length, label: tr(lang, "monitoredSources"), detail: tr(lang, "sourcesTitle") },
    { value: activeQueueCount, label: tr(lang, "activeQueue"), detail: tr(lang, "watchlistTitle") }
  ];

  return `
      <section class="now-dashboard" aria-label="${esc(tr(lang, "nowDashboard"))}">
        ${stats.map((stat) => `
          <div>
            <strong>${esc(stat.value)}</strong>
            <span>${esc(stat.label)}</span>
            <em>${esc(stat.detail)}</em>
          </div>`).join("")}
      </section>`;
}

function nowFeedLinks(lang) {
  return `
      <section class="now-feed-links" aria-label="${esc(tr(lang, "sourcesTitle"))}">
        <a href="/${lang}/freshness/">${tr(lang, "freshnessLogLabel")}</a>
        <a href="/recheck.json">${tr(lang, "recheckQueueTitle")}</a>
        <a href="/${lang}/feed.xml">${tr(lang, "rssFeedLabel")}</a>
        <a href="/${lang}/latest.json">${tr(lang, "jsonFeedLabel")}</a>
        <a href="/${lang}/watchlist/">${tr(lang, "watchlistTitle")}</a>
      </section>`;
}

function categoryLabel(lang, category) {
  return tr(lang, categoryLabels[category] || category);
}

function eventKindLabel(event, lang = "en") {
  const labels = {
    "city-project": {
      en: "City project",
      es: "City project",
      zh: "City project",
      pt: "City project",
      ru: "City project",
      ja: "City project"
    },
    concert: {
      en: "Concert",
      es: "Concert",
      zh: "Concert",
      pt: "Concert",
      ru: "Concert",
      ja: "Concert"
    }
  };
  return labels[event.eventKind]?.[lang] || labels[event.eventKind]?.en || "";
}

function thumbnailBrand(event) {
  const text = `${event.sourceName || ""} ${local(event.title, "en") || ""}`.toLowerCase();
  if (text.includes("olive young")) return "OLIVE YOUNG";
  if (text.includes("duty free") || text.includes("shilla") || text.includes("lotte duty")) return "DUTY FREE";
  if (text.includes("shinsegae")) return "SHINSEGAE";
  if (text.includes("hyundai")) return "HYUNDAI";
  if (text.includes("lotte")) return "LOTTE";
  if (text.includes("weverse") || text.includes("bts") || text.includes("k-pop") || event.category === "kpop") return "K-POP";
  if (text.includes("visitkorea") || text.includes("korea tourism")) return "VISITKOREA";
  if (text.includes("seoul")) return "SEOUL";
  if (text.includes("busan")) return "BUSAN";
  if (event.category === "festival") return "FESTIVAL";
  return categoryLabel("en", event.category).toUpperCase();
}

function thumbnailContext(event, lang) {
  const date = event.dateLabel || `${dateText(lang, event.startDate)} - ${dateText(lang, event.endDate)}`;
  return `${event.city} · ${date}`;
}

function maxIso(values, fallback = today) {
  const dates = values.filter((value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value || "")));
  return dates.length ? dates.sort().at(-1) : fallback;
}

function feedEvents(limit = 30) {
  return [...events]
    .sort((a, b) => {
      const checked = b.lastChecked.localeCompare(a.lastChecked);
      if (checked) return checked;
      return statusSort(a, b) || b.priority - a.priority;
    })
    .slice(0, limit);
}

function kstDateTime(iso) {
  return `${iso}T00:00:00+09:00`;
}

function rfc2822Date(iso) {
  return new Date(kstDateTime(iso)).toUTCString();
}

function eventPublicUrl(event, lang) {
  return absoluteUrl(`/${lang}/events/${event.slug}.html`);
}

function eventFeedSummary(event, lang) {
  const status = statusLabel(lang, statusOf(event));
  const category = categoryLabel(lang, event.category);
  return `${local(event.summary, lang)} ${status}. ${category}. ${event.dateLabel || `${event.startDate} - ${event.endDate}`}. Official source: ${event.sourceUrl}`;
}

function rssFeed(lang, feedPath = `/${lang}/feed.xml`) {
  const items = feedEvents();
  const feedUrl = absoluteUrl(feedPath);
  const homeUrl = absoluteUrl(`/${lang}/`);
  const lastBuildDate = rfc2822Date(maxIso(items.map((event) => event.lastChecked)));
  return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n  <channel>\n    <title>${xmlEsc(`${siteName} - ${languages[lang].name}`)}</title>\n    <link>${xmlEsc(homeUrl)}</link>\n    <description>${xmlEsc(tr(lang, "nowText"))}</description>\n    <language>${xmlEsc(languages[lang].locale)}</language>\n    <lastBuildDate>${xmlEsc(lastBuildDate)}</lastBuildDate>\n    <atom:link href="${xmlEsc(feedUrl)}" rel="self" type="application/rss+xml"/>\n${items.map((event) => {
    const url = eventPublicUrl(event, lang);
    return `    <item>\n      <title>${xmlEsc(local(event.title, lang))}</title>\n      <link>${xmlEsc(url)}</link>\n      <guid isPermaLink="true">${xmlEsc(url)}</guid>\n      <pubDate>${xmlEsc(rfc2822Date(event.lastChecked))}</pubDate>\n      <category>${xmlEsc(categoryLabel(lang, event.category))}</category>\n      <description>${xmlEsc(eventFeedSummary(event, lang))}</description>\n      <source url="${xmlEsc(event.sourceUrl)}">${xmlEsc(event.sourceName)}</source>\n    </item>`;
  }).join("\n")}\n  </channel>\n</rss>\n`;
}

function jsonFeed(lang, feedPath = `/${lang}/latest.json`) {
  const items = feedEvents();
  return JSON.stringify({
    version: "https://jsonfeed.org/version/1.1",
    title: `${siteName} - ${languages[lang].name}`,
    home_page_url: absoluteUrl(`/${lang}/`),
    feed_url: absoluteUrl(feedPath),
    language: languages[lang].locale,
    description: tr(lang, "nowText"),
    authors: [{ name: siteName }],
    items: items.map((event) => ({
      id: eventPublicUrl(event, lang),
      url: eventPublicUrl(event, lang),
      external_url: event.sourceUrl,
      title: local(event.title, lang),
      summary: local(event.summary, lang),
      content_text: eventFeedSummary(event, lang),
      image: absoluteUrl(`/${event.thumbnail}`),
      date_published: kstDateTime(event.lastChecked),
      date_modified: kstDateTime(event.lastChecked),
      tags: [categoryLabel(lang, event.category), event.city, statusLabel(lang, statusOf(event))],
      _korea_now_guide: {
        category: event.category,
        status: statusOf(event),
        city: event.city,
        venue: event.venue,
        startDate: event.startDate,
        endDate: event.endDate,
        dateLabel: event.dateLabel || "",
        lastChecked: event.lastChecked,
        sourceName: event.sourceName,
        sourceUrl: event.sourceUrl,
        freshness: freshnessInfo(event, lang)
      }
    }))
  }, null, 2);
}

function recheckJson() {
  return JSON.stringify({
    generatedAt: `${today}T00:00:00+09:00`,
    today,
    rule: "Live and upcoming listings enter this queue when the official recheck window is due now or within one day.",
    items: recheckQueueItems(50).map(({ event, ageDays, limitDays, daysUntilDue, status }) => ({
      slug: event.slug,
      title: local(event.title, "en"),
      category: event.category,
      status,
      city: event.city,
      venue: event.venue,
      startDate: event.startDate,
      endDate: event.endDate,
      lastChecked: event.lastChecked,
      ageDays,
      freshnessLimitDays: limitDays,
      daysUntilDue,
      sourceName: event.sourceName,
      sourceUrl: event.sourceUrl,
      publicUrl: absoluteUrl(`/en/events/${event.slug}.html`)
    }))
  }, null, 2);
}

function categoryHref(lang, category) {
  return `/${lang}/categories/${category}/`;
}

function categoryLinkStrip(lang) {
  return Object.keys(categoryDefinitions).map((category) => {
    const count = events.filter((event) => event.category === category).length;
    return `
      <a class="category-pill category-${esc(category)}" href="${categoryHref(lang, category)}">
        <span class="pill-marker" aria-hidden="true">${esc(categoryLabel(lang, category).slice(0, 1).toUpperCase())}</span>
        <span class="pill-copy">
          <strong>${categoryLabel(lang, category)}</strong>
          <span>${count} items</span>
        </span>
      </a>`;
  }).join("");
}

function cityCounts() {
  const counts = new Map();
  for (const event of events) {
    if (!event.city) continue;
    counts.set(event.city, (counts.get(event.city) || 0) + 1);
  }
  return counts;
}

function citiesWithEvents() {
  const counts = cityCounts();
  return [...counts.keys()]
    .sort((a, b) => counts.get(b) - counts.get(a) || a.localeCompare(b));
}

function shortHash(value) {
  let hash = 0;
  for (const char of String(value || "")) {
    hash = ((hash << 5) - hash + char.charCodeAt(0)) | 0;
  }
  return Math.abs(hash).toString(36).slice(0, 6) || "0";
}

function citySlug(city) {
  if (cityDefinitions[city]?.slug) return cityDefinitions[city].slug;
  const slug = city.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return slug || `city-${shortHash(city)}`;
}

function cityHref(lang, city) {
  return `/${lang}/cities/${citySlug(city)}/`;
}

function routeHref(lang, route) {
  return `/${lang}/routes/${route.slug}.html`;
}

function cityLinkStrip(lang) {
  const counts = cityCounts();
  return citiesWithEvents().map((city) => {
    const count = counts.get(city) || 0;
    return `
      <a class="city-pill" href="${cityHref(lang, city)}">
        <span class="pill-marker" aria-hidden="true">${esc(city.slice(0, 1).toUpperCase())}</span>
        <span class="pill-copy">
          <strong>${esc(city)}</strong>
          <span>${count} events</span>
        </span>
      </a>`;
  }).join("");
}

function routesForEvent(event) {
  const regionKeys = new Set([event.city, event.weatherRegion, "Nationwide"].filter(Boolean));
  const matches = routes.filter((route) => {
    const regionMatch = route.regions?.some((region) => regionKeys.has(region));
    const categoryMatch = route.categories?.includes(event.category);
    return regionMatch && categoryMatch;
  });

  const fallback = routes.filter((route) => route.regions?.some((region) => regionKeys.has(region)));
  return (matches.length ? matches : fallback).slice(0, 3);
}

function eventDateDistanceDays(a, b) {
  const aTime = Date.parse(`${a.startDate}T00:00:00Z`);
  const bTime = Date.parse(`${b.startDate}T00:00:00Z`);
  if (Number.isNaN(aTime) || Number.isNaN(bTime)) return 365;
  return Math.abs(aTime - bTime) / dayMs;
}

function relatedEventsForEvent(event) {
  return events
    .filter((candidate) => candidate.slug !== event.slug)
    .map((candidate) => {
      const score =
        (candidate.city === event.city ? 50 : 0) +
        (candidate.category === event.category ? 35 : 0) +
        (candidate.weatherRegion === event.weatherRegion ? 15 : 0) +
        (statusOf(candidate) !== "ended" ? 10 : 0) +
        Number(candidate.priority || 0) / 100 -
        Math.min(eventDateDistanceDays(event, candidate), 120) / 4;
      return { event: candidate, score };
    })
    .sort((a, b) => b.score - a.score || statusSort(a.event, b.event))
    .map((item) => item.event)
    .slice(0, 6);
}

function eventsForRoute(route) {
  const regionSet = new Set(route.regions || []);
  const categorySet = new Set(route.categories || []);
  return events
    .filter((event) => (regionSet.has(event.city) || regionSet.has(event.weatherRegion) || regionSet.has("Nationwide")) && categorySet.has(event.category))
    .sort((a, b) => {
      const statusWeight = { live: 0, upcoming: 1, ended: 2 };
      return statusWeight[statusOf(a)] - statusWeight[statusOf(b)] || a.startDate.localeCompare(b.startDate) || b.priority - a.priority;
    });
}

function routesForCity(city) {
  const weatherRegion = cityDefinitions[city]?.weatherRegion || city;
  return routes
    .filter((route) => route.regions?.some((region) => region === city || region === weatherRegion || region === "Nationwide"))
    .slice(0, 3);
}

function routeCard(route) {
  return `
    <article class="route-card">
      <span>${esc(route.bestFor)}</span>
      <h3>${esc(route.title)}</h3>
      <ol>${route.stops.map((stop) => `<li>${esc(stop)}</li>`).join("")}</ol>
      <ul>${route.tips.slice(0, 2).map((tip) => `<li>${esc(tip)}</li>`).join("")}</ul>
    </article>`;
}

function routeLinkCard(route, lang) {
  return `
    <a class="route-card" href="${routeHref(lang, route)}">
      <span>${esc(route.bestFor)}</span>
      <h3>${esc(route.title)}</h3>
      <ol>${route.stops.map((stop) => `<li>${esc(stop)}</li>`).join("")}</ol>
      <ul>${route.tips.slice(0, 2).map((tip) => `<li>${esc(tip)}</li>`).join("")}</ul>
    </a>`;
}

function eventPlaceQuery(event) {
  return String(event.mapQueryKo || event.venue || event.city || "").trim();
}

function mapLinks(event, lang) {
  const query = eventPlaceQuery(event);
  const encoded = encodeURIComponent(query);
  return [
    {
      label: tr(lang, "googleMap"),
      href: `https://www.google.com/maps/search/?api=1&query=${encoded}`
    },
    {
      label: tr(lang, "naverMap"),
      href: `https://map.naver.com/p/search/${encoded}`
    },
    {
      label: tr(lang, "kakaoMap"),
      href: `https://map.kakao.com/?q=${encoded}`
    }
  ];
}

function mapLinkSection(event, lang) {
  return `
        <section class="detail-section map-links-section">
          <div>
            <h2>${tr(lang, "mapLinksTitle")}</h2>
            <p class="map-place"><strong>${esc(eventPlaceQuery(event))}</strong><span>${esc(event.district)}, ${esc(event.city)}</span></p>
            <p class="meta-note">${tr(lang, "mapNote")}</p>
          </div>
          <div class="map-link-list">
            ${mapLinks(event, lang).map((link) => `
              <a href="${esc(link.href)}" rel="nofollow noopener" target="_blank">
                <strong>${esc(link.label)}</strong>
                <span>${esc(eventPlaceQuery(event))}</span>
              </a>`).join("")}
          </div>
        </section>`;
}

const visitorInfoLabels = {
  theme: "eventTheme",
  hours: "hoursOfOperation",
  programHours: "programHours",
  websiteLanguages: "websiteLanguages",
  address: "address",
  transportation: "transportation",
  parking: "parking",
  smartGuide: "smartGuide"
};

function visitorInfoValue(value) {
  if (Array.isArray(value)) return value.join(", ");
  return String(value || "").trim();
}

function visitorInfoSection(event, lang) {
  const info = event.visitorInfo || {};
  const infoItems = Object.entries(visitorInfoLabels)
    .map(([key, labelKey]) => ({ label: tr(lang, labelKey), value: visitorInfoValue(info[key]) }))
    .filter((item) => item.value);
  if (event.officialWebsiteUrl) {
    infoItems.push({
      label: tr(lang, "eventWebsite"),
      value: `<a href="${esc(event.officialWebsiteUrl)}" rel="nofollow noopener" target="_blank">${esc(event.officialWebsiteName || event.officialWebsiteUrl)}</a>`,
      html: true
    });
  }

  const schedules = event.venueSchedule || [];
  const highlights = event.officialHighlights || [];
  if (!infoItems.length && !schedules.length && !highlights.length) return "";

  return `
        <section class="detail-section visitor-info-section">
          <div class="detail-section-head">
            <div>
              <p class="eyebrow">${esc(event.sourceName)}</p>
              <h2>${tr(lang, "officialVisitorInfo")}</h2>
            </div>
            <p>${tr(lang, "verifyBefore")}</p>
          </div>
          ${infoItems.length ? `
            <div class="visitor-info-grid">
              ${infoItems.map((item) => `
                <div class="visitor-info-item">
                  <span>${esc(item.label)}</span>
                  <strong>${item.html ? item.value : esc(item.value)}</strong>
                </div>`).join("")}
            </div>` : ""}
          ${schedules.length ? `
            <div class="venue-schedule">
              <h3>${tr(lang, "venueScheduleTitle")}</h3>
              <div class="venue-schedule-list">
                ${schedules.map((item) => `
                  <article>
                    <span>${esc(dateText(lang, item.startDate))} - ${esc(dateText(lang, item.endDate))}</span>
                    <strong>${esc(item.venue)}</strong>
                    <p>${[item.status, item.theme].filter(Boolean).map(esc).join(" / ")}</p>
                    ${item.note ? `<p>${esc(item.note)}</p>` : ""}
                  </article>`).join("")}
              </div>
            </div>` : ""}
          ${highlights.length ? `
            <div class="official-highlights">
              <h3>${tr(lang, "officialHighlightsTitle")}</h3>
              <ul>${highlights.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>
            </div>` : ""}
        </section>`;
}

function dateText(lang, iso) {
  const date = new Date(`${iso}T00:00:00Z`);
  return new Intl.DateTimeFormat(languages[lang].locale, { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(date);
}

function monthKey(iso) {
  return iso.slice(0, 7);
}

function monthText(lang, key) {
  const date = new Date(`${key}-01T00:00:00Z`);
  return new Intl.DateTimeFormat(languages[lang].locale, { month: "long", year: "numeric", timeZone: "UTC" }).format(date);
}

function monthNameFromIso(iso) {
  const date = new Date(`${String(iso || today).slice(0, 7)}-01T00:00:00Z`);
  return new Intl.DateTimeFormat("en-US", { month: "long", timeZone: "UTC" }).format(date);
}

function weatherBaseline(regionName, iso) {
  const regionKey = weather.regions[regionName] ? regionName : "Nationwide";
  const monthName = monthNameFromIso(iso);
  const regionData = weather.regions[regionKey] || weather.regions.Nationwide;
  const nationalData = weather.regions.Nationwide || {};
  const baseline = regionData[monthName] || nationalData[monthName] || regionData.June || nationalData.June;
  return {
    regionKey,
    monthName,
    baseline
  };
}

function mode(values) {
  const counts = new Map();
  for (const value of values.filter(Boolean)) {
    counts.set(value, (counts.get(value) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] || "";
}

function minValue(values) {
  const usable = values.filter((value) => Number.isFinite(value));
  return usable.length ? Math.min(...usable) : null;
}

function maxValue(values) {
  const usable = values.filter((value) => Number.isFinite(value));
  return usable.length ? Math.max(...usable) : null;
}

function forecastRegionKey(city, weatherRegion) {
  if (!currentWeather?.regions) return null;
  const key = currentWeather.cityMap?.[city] || currentWeather.weatherRegionMap?.[weatherRegion] || weatherRegion || "Nationwide";
  if (currentWeather.regions[key]?.summary?.days?.length) return key;
  return currentWeather.regions.Nationwide?.summary?.days?.length ? "Nationwide" : null;
}

function combineForecastDays(region, days) {
  if (!region || !days.length) return null;
  const minTempC = minValue(days.map((day) => day.minTempC));
  const maxTempC = maxValue(days.map((day) => day.maxTempC));
  const maxPopPct = maxValue(days.map((day) => day.maxPopPct));
  const minHumidityPct = minValue(days.map((day) => day.minHumidityPct));
  const maxHumidityPct = maxValue(days.map((day) => day.maxHumidityPct));
  const firstHumidity = days[0]?.avgHumidityPct;
  const lastHumidity = days.at(-1)?.avgHumidityPct;
  const humidityTrend = Number.isFinite(firstHumidity) && Number.isFinite(lastHumidity) ? Number((lastHumidity - firstHumidity).toFixed(1)) : null;
  const rainLikely = days.some((day) => day.rainLikely) || (maxPopPct || 0) >= 50;
  return {
    source: currentWeather.source,
    locationLabel: region.label,
    sourceUrl: region.sourceUrl,
    baseTime: region.baseTime,
    generatedAt: currentWeather.generatedAt,
    startDate: days[0].date,
    endDate: days.at(-1).date,
    dayCount: days.length,
    weather: mode(days.map((day) => day.weatherEn)) || mode(days.map((day) => day.weatherKo)) || "mixed conditions",
    minTempC,
    maxTempC,
    maxPopPct,
    minHumidityPct,
    maxHumidityPct,
    humidityTrend,
    rainLikely,
    days
  };
}

function currentForecastForEvent(event) {
  if (statusOf(event) === "ended") return null;
  const key = forecastRegionKey(event.city, event.weatherRegion);
  const region = key ? currentWeather.regions[key] : null;
  const days = region?.summary?.days || [];
  const startDate = statusOf(event) === "live" ? today : event.startDate;
  const endDate = event.endDate || event.startDate || startDate;
  const selected = days.filter((day) => day.date >= startDate && day.date <= endDate);
  return combineForecastDays(region, selected);
}

function currentForecastForCity(city, weatherRegion) {
  const key = forecastRegionKey(city, weatherRegion);
  const region = key ? currentWeather.regions[key] : null;
  const days = (region?.summary?.days || []).filter((day) => day.date >= today).slice(0, 4);
  return combineForecastDays(region, days);
}

function celsiusRange(minTempC, maxTempC) {
  if (!Number.isFinite(minTempC) || !Number.isFinite(maxTempC)) return "";
  return `${Math.round(minTempC)}-${Math.round(maxTempC)}C`;
}

function percentRange(minPct, maxPct) {
  if (!Number.isFinite(minPct) || !Number.isFinite(maxPct)) return "";
  if (Math.round(minPct) === Math.round(maxPct)) return `${Math.round(maxPct)}%`;
  return `${Math.round(minPct)}-${Math.round(maxPct)}%`;
}

function kmaBaseTimeText(baseTime) {
  const value = String(baseTime || "");
  if (!/^\d{12}$/.test(value)) return "latest KMA RSS";
  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)} ${value.slice(8, 10)}:${value.slice(10, 12)} KST`;
}

function forecastRangeText(lang, forecast) {
  if (forecast.startDate === forecast.endDate) return dateText(lang, forecast.startDate);
  return `${dateText(lang, forecast.startDate)} - ${dateText(lang, forecast.endDate)}`;
}

function forecastShortDate(iso) {
  const match = String(iso || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const month = match?.[2];
  const day = match?.[3];
  if (!month || !day) return iso;
  return `${Number(month)}.${Number(day)}.`;
}

function forecastDayName(lang, iso) {
  const offset = daysFromToday(iso);
  if (offset === 0) return tr(lang, "todayLabel");
  if (offset === 1) return tr(lang, "tomorrowLabel");
  return new Intl.DateTimeFormat(languages[lang]?.locale || "en-US", { weekday: "short", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));
}

function weatherKind(weatherText, rainLikely = false) {
  const text = String(weatherText || "").toLowerCase();
  if (rainLikely || /rain|shower|비|소나기/.test(text)) return "rain";
  if (/snow|눈/.test(text)) return "snow";
  if (/cloud|overcast|흐림|구름/.test(text)) return "cloud";
  return "sun";
}

function weatherSymbol(kind, label) {
  return `<span class="weather-symbol ${esc(kind)}" title="${esc(label || kind)}" aria-label="${esc(label || kind)}"></span>`;
}

function visitorWeatherLabel(weatherText, rainLikely = false, rainPeak = null) {
  const peak = Number.isFinite(rainPeak) ? rainPeak : 0;
  if (peak >= 50) return "PM rain risk";
  if (rainLikely) return "Rain possible";
  return weatherText || "Forecast";
}

function periodForecastBlock(period, label, lang) {
  if (!period) {
    return `
              <div class="forecast-period missing">
                <span>${esc(label)}</span>
                <strong>-</strong>
              </div>`;
  }
  const rain = Number.isFinite(period.maxPopPct) ? `${Math.round(period.maxPopPct)}%` : "-";
  return `
              <div class="forecast-period">
                <span>${esc(label)}</span>
                <strong>${esc(rain)}</strong>
              </div>`;
}

function forecastDayCard(day, lang) {
  const low = Number.isFinite(day.minTempC) ? Math.round(day.minTempC) : "-";
  const high = Number.isFinite(day.maxTempC) ? Math.round(day.maxTempC) : "-";
  const weatherText = day.weatherEn || day.weatherKo || "Forecast";
  const rainRisk = day.rainLikely || (day.maxPopPct || 0) >= 50;
  const kind = weatherKind(weatherText, rainRisk);
  const rain = Number.isFinite(day.maxPopPct) ? `${Math.round(day.maxPopPct)}%` : rainMood(day);
  const visitorLabel = visitorWeatherLabel(weatherText, rainRisk, day.maxPopPct);
  return `
            <article class="forecast-card ${kind}">
              <div class="forecast-card-head">
                <div>
                  <strong>${esc(forecastDayName(lang, day.date))}</strong>
                  <span>${esc(forecastShortDate(day.date))}</span>
                </div>
                <p><span>${tr(lang, "forecastLowHigh")}</span><b><em class="low">${esc(low)}</em>&deg; / <em class="high">${esc(high)}</em>&deg;</b></p>
              </div>
              <div class="forecast-condition">
                ${weatherSymbol(kind, visitorLabel)}
                <div>
                  <strong>${esc(visitorLabel)}</strong>
                  <span>Rain peak ${esc(rain)}</span>
                </div>
              </div>
              <div class="forecast-periods">
                ${periodForecastBlock(day.periods?.am, tr(lang, "forecastMorning"), lang)}
                ${periodForecastBlock(day.periods?.pm, tr(lang, "forecastAfternoon"), lang)}
              </div>
            </article>`;
}

function forecastStrip(forecast, lang) {
  const days = (forecast.days || []).filter((day) => day.date >= today).slice(0, 7);
  if (!days.length) return "";
  return `
          <div class="forecast-strip" aria-label="${esc(tr(lang, "forecastStripTitle"))}">
            ${days.map((day) => forecastDayCard(day, lang)).join("")}
          </div>`;
}

function temperatureMood(maxTempC) {
  if (!Number.isFinite(maxTempC)) return "variable temperatures";
  if (maxTempC >= 32) return "hot";
  if (maxTempC >= 28) return "very warm";
  if (maxTempC >= 24) return "warm";
  if (maxTempC >= 18) return "mild";
  if (maxTempC >= 10) return "cool";
  return "cold";
}

function rainMood(forecast) {
  if ((forecast.maxPopPct || 0) >= 70) return "high rain chance";
  if (forecast.rainLikely) return "rain possible";
  if ((forecast.maxPopPct || 0) >= 30) return "some shower risk";
  return "low rain chance";
}

function humidityMood(forecast) {
  if ((forecast.humidityTrend || 0) >= 8 && (forecast.maxHumidityPct || 0) >= 70) return "humidity increasing";
  if ((forecast.maxHumidityPct || 0) >= 85 && (forecast.minHumidityPct || 100) <= 55) return "increasingly humid at times";
  if ((forecast.maxHumidityPct || 0) >= 85) return "very humid at times";
  if ((forecast.maxHumidityPct || 0) >= 70) return "humid at times";
  if ((forecast.maxHumidityPct || 0) <= 45) return "fairly dry";
  return "moderate humidity";
}

function forecastSummaryText(forecast) {
  const temp = celsiusRange(forecast.minTempC, forecast.maxTempC);
  const pop = Number.isFinite(forecast.maxPopPct) ? `rain chance up to ${Math.round(forecast.maxPopPct)}%` : rainMood(forecast);
  const humidity = percentRange(forecast.minHumidityPct, forecast.maxHumidityPct);
  const humidityText = humidity ? `${humidityMood(forecast)} (${humidity})` : humidityMood(forecast);
  return `${temperatureMood(forecast.maxTempC)}${temp ? `, ${temp}` : ""}; ${pop}; ${humidityText}; most hours: ${forecast.weather}.`;
}

function degreeRangeHtml(minTempC, maxTempC) {
  if (!Number.isFinite(minTempC) || !Number.isFinite(maxTempC)) return "-";
  return `${Math.round(minTempC)}-${Math.round(maxTempC)}&deg;C`;
}

function rainPeakText(forecast) {
  if (Number.isFinite(forecast.maxPopPct)) return `${Math.round(forecast.maxPopPct)}% peak`;
  return rainMood(forecast);
}

function humidityRangeText(forecast) {
  const humidity = percentRange(forecast.minHumidityPct, forecast.maxHumidityPct);
  return humidity || humidityMood(forecast);
}

function weatherTakeaway(forecast) {
  const rainPeak = Number.isFinite(forecast.maxPopPct) ? forecast.maxPopPct : 0;
  const warm = (forecast.maxTempC || 0) >= 24;
  const hot = (forecast.maxTempC || 0) >= 28;
  const humid = (forecast.maxHumidityPct || 0) >= 75;
  if (rainPeak >= 50 && humid) return "Umbrella window, humid walk";
  if (rainPeak >= 50) return "Rain backup recommended";
  if (hot && humid) return "Hot, humid afternoon";
  if (warm && humid) return "Warm and humid";
  if (warm) return "Warm walking weather";
  return "Good walking window";
}

function weatherMetric(label, value, note) {
  return `
            <div class="weather-metric">
              <span>${esc(label)}</span>
              <strong>${value}</strong>
              <em>${esc(note)}</em>
            </div>`;
}

function weatherTags(items) {
  return `<div class="weather-tags">${items.map((item) => `<span>${esc(item)}</span>`).join("")}</div>`;
}

function forecastOverview(forecast) {
  return `
          <div class="weather-overview">
            <div class="weather-takeaway">
              <span>At a glance</span>
              <strong>${esc(weatherTakeaway(forecast))}</strong>
              <p>${esc(forecastAdvice(forecast))}</p>
            </div>
            <div class="weather-metrics" aria-label="Weather summary">
              ${weatherMetric("Temperature", degreeRangeHtml(forecast.minTempC, forecast.maxTempC), temperatureMood(forecast.maxTempC))}
              ${weatherMetric("Rain", esc(rainPeakText(forecast)), rainMood(forecast))}
              ${weatherMetric("Humidity", esc(humidityRangeText(forecast)), humidityMood(forecast))}
            </div>
          </div>`;
}

function forecastPacking(forecast) {
  const items = [];
  if ((forecast.maxTempC || 0) >= 24) items.push("water bottle");
  if ((forecast.maxTempC || 0) >= 24) items.push("UV protection");
  if (forecast.rainLikely || (forecast.maxPopPct || 0) >= 30) items.push("portable umbrella");
  if ((forecast.maxHumidityPct || 0) >= 70) items.push("breathable clothes");
  if ((forecast.minTempC || 99) <= 18) items.push("light layer");
  items.push("comfortable walking shoes");
  return [...new Set(items)].slice(0, 5);
}

function forecastAdvice(forecast) {
  const warm = (forecast.maxTempC || 0) >= 24;
  const humid = (forecast.maxHumidityPct || 0) >= 70;
  if (forecast.rainLikely || (forecast.maxPopPct || 0) >= 50) {
    return "Keep an indoor backup and check official outdoor notices before leaving, especially for parks, riverside routes, and queues.";
  }
  if (warm && humid) {
    return "Use lighter clothing, hydrate, and plan indoor cooling breaks between outdoor photos, queues, and transit transfers.";
  }
  if (warm) {
    return "Plan sun protection and water for afternoon walking, especially around plazas, parks, and department-store approaches.";
  }
  return "Good for walking plans, but check the latest KMA update again on the day of travel.";
}

function weatherPlanInner(lang, forecast, weatherInfo) {
  const region = weatherInfo.baseline;
  if (forecast) {
    const items = forecastPacking(forecast);
    return `
          <h2>${tr(lang, "weatherPlan")}</h2>
          ${forecastOverview(forecast)}
          ${forecastStrip(forecast, lang)}
          <p class="weather-source-line"><strong>KMA short-term forecast</strong><span>${esc(forecast.locationLabel)} / ${esc(forecastRangeText(lang, forecast))}: ${esc(forecastSummaryText(forecast))}</span></p>
          ${weatherTags(items)}
          <p class="meta-note">KMA forecast updated ${esc(kmaBaseTimeText(forecast.baseTime))}<span class="sr-only"> Forecast source: ${esc(forecast.source?.name || "KMA forecast RSS")}. Previous-year monthly baseline: ${esc(weather.source.name)}.</span></p>`;
  }
  return `
          <h2>${tr(lang, "weatherPlan")}</h2>
          <div class="weather-overview">
            <div class="weather-takeaway">
              <span>Seasonal baseline</span>
              <strong>${esc(weatherInfo.regionKey)} / ${esc(weatherInfo.monthName)}</strong>
              <p>${esc(region.outdoorAdvice)}</p>
            </div>
            <div class="weather-metrics" aria-label="Weather baseline">
              ${weatherMetric("Typical range", esc(region.range), "previous-year pattern")}
              ${weatherMetric("Plan with", esc((region.packing || []).slice(0, 2).join(", ") || "walking basics"), "visitor packing")}
              ${weatherMetric("Check", "Live forecast", "before leaving")}
            </div>
          </div>
          ${weatherTags(region.packing)}
          <p class="meta-note">Weather baseline: ${esc(weather.source.name)}<span class="sr-only"> Previous-year monthly baseline.</span></p>`;
}

function calendarWeatherText(event, lang) {
  const forecast = currentForecastForEvent(event);
  if (forecast) {
    return `${tr(lang, "calendarWeather")}: KMA ${forecast.locationLabel} / ${forecastRangeText(lang, forecast)} - ${forecastSummaryText(forecast)}`;
  }
  const weatherInfo = weatherBaseline(event.weatherRegion, weatherIsoForEvent(event));
  const baseline = weatherInfo.baseline;
  const pack = (baseline.packing || []).slice(0, 2).join(", ");
  return `${tr(lang, "calendarWeather")}: ${weatherInfo.regionKey} / ${weatherInfo.monthName} - ${baseline.range}${pack ? ` · ${tr(lang, "packHint")}: ${pack}` : ""}`;
}

function weatherIsoForEvent(event) {
  const status = statusOf(event);
  if (status === "live") return today;
  if (status === "ended") return event.endDate || event.startDate || today;
  return event.startDate || event.endDate || today;
}

function representativeWeatherIso(items) {
  return items[0] ? weatherIsoForEvent(items[0]) : today;
}

function pagePath(lang, page = "") {
  return `/${lang}/${page}`;
}

function langSwitcher(lang, currentPathBuilder) {
  return Object.keys(languages).map((code) => {
    const href = currentPathBuilder ? currentPathBuilder(code) : `/${code}/`;
    const active = code === lang ? " aria-current=\"true\"" : "";
    return `<a${active} href="${href}">${languages[code].name}</a>`;
  }).join("");
}

function nav(lang) {
  return `
    <nav class="top-nav" aria-label="Primary">
      <a href="/${lang}/#events">${tr(lang, "navEvents")}</a>
      <a href="/${lang}/now/">${tr(lang, "navNow")}</a>
      <a href="/${lang}/calendar/">${tr(lang, "navCalendar")}</a>
      <a href="/${lang}/planner/">${tr(lang, "navPlanner")}</a>
      <a href="/${lang}/guides/">${tr(lang, "navGuides")}</a>
      <a href="/${lang}/routes/">${tr(lang, "routePages")}</a>
      <a href="/${lang}/sources/">${tr(lang, "navSources")}</a>
      <a href="/${lang}/watchlist/">${tr(lang, "navWatchlist")}</a>
      <a href="/${lang}/about/">${tr(lang, "navAbout")}</a>
    </nav>`;
}

function absoluteUrl(urlPath) {
  return `${siteUrl}${urlPath}`;
}

function alternateLinks(currentPathBuilder, canonicalPath) {
  const builder = currentPathBuilder || ((code) => `/${code}/`);
  const links = Object.keys(languages).map((code) => {
    const href = builder(code);
    return `<link rel="alternate" hreflang="${code}" href="${absoluteUrl(href)}">`;
  });
  links.push(`<link rel="alternate" hreflang="x-default" href="${absoluteUrl(builder("en") || canonicalPath)}">`);
  return links.join("\n  ");
}

function structuredDataScript(data) {
  const graph = Array.isArray(data) ? data : [data];
  const cleanedGraph = graph.map((node) => {
    const { "@context": _context, ...rest } = node;
    return rest;
  });
  return `<script type="application/ld+json">${JSON.stringify(graph.length === 1 ? graph[0] : { "@context": "https://schema.org", "@graph": cleanedGraph })}</script>`;
}

function breadcrumbSchema(lang, items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.url)
    }))
  };
}

function itemListSchema(lang, title, itemEvents, pageUrl) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: title,
    inLanguage: lang,
    url: absoluteUrl(pageUrl),
    numberOfItems: itemEvents.length,
    itemListElement: itemEvents.map((event, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: absoluteUrl(`/${lang}/events/${event.slug}.html`),
      name: local(event.title, lang)
    }))
  };
}

const eventRichResultCategories = new Set(["festival", "kpop"]);

function shouldUseEventSchema(event) {
  return eventRichResultCategories.has(event.category);
}

function detailPageSchema(event, lang) {
  const pageUrl = absoluteUrl(`/${lang}/events/${event.slug}.html`);
  const imageUrl = absoluteUrl(`/${event.thumbnail}`);
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${pageUrl}#webpage`,
    name: local(event.title, lang),
    description: local(event.summary, lang),
    url: pageUrl,
    inLanguage: lang,
    dateModified: event.lastChecked,
    primaryImageOfPage: {
      "@type": "ImageObject",
      url: imageUrl
    },
    about: {
      "@type": "Thing",
      name: categoryLabel(lang, event.category)
    },
    isPartOf: {
      "@type": "WebSite",
      name: "K-Spot Now",
      url: siteUrl
    },
    sameAs: event.sourceUrl
  };
}

function eventSchema(event, lang) {
  const eventUrl = absoluteUrl(`/${lang}/events/${event.slug}.html`);
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    "@id": `${eventUrl}#event`,
    name: local(event.title, lang),
    description: local(event.summary, lang),
    startDate: event.startDate,
    endDate: event.endDate,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    inLanguage: lang,
    image: absoluteUrl(`/${event.thumbnail}`),
    url: eventUrl,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": eventUrl
    },
    sameAs: event.sourceUrl,
    location: {
      "@type": "Place",
      name: event.venue,
      address: {
        "@type": "PostalAddress",
        addressCountry: "KR",
        addressLocality: event.city,
        streetAddress: event.visitorInfo?.address || event.district
      }
    },
    organizer: {
      "@type": "Organization",
      name: event.sourceName,
      url: event.officialWebsiteUrl || event.sourceUrl
    }
  };
}

function adsenseHeadScript() {
  if (!/^ca-pub-\d{16}$/.test(adsenseClientId)) return "";
  return `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${esc(adsenseClientId)}" crossorigin="anonymous"></script>`;
}

function manualAdsEnabled() {
  return /^ca-pub-\d{16}$/.test(adsenseClientId) && /^\d{8,20}$/.test(adsenseSlotId);
}

function adUnit(placement = "inline") {
  if (!manualAdsEnabled()) return "";
  return `
        <aside class="ad-band ${esc(placement)}" aria-label="Advertisement">
          <span>Advertisement</span>
          <ins class="adsbygoogle"
               style="display:block"
               data-ad-client="${esc(adsenseClientId)}"
               data-ad-slot="${esc(adsenseSlotId)}"
               data-ad-format="auto"
               data-full-width-responsive="true"></ins>
          <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
        </aside>`;
}

function googleVerificationMeta() {
  if (!googleSiteVerification) return "";
  return `<meta name="google-site-verification" content="${esc(googleSiteVerification)}">`;
}

function layout({ lang, title, description, body, currentPathBuilder, canonicalPath = `/${lang}/`, schemaData = null, imagePath = "/assets/hero.jpg", pageType = "website" }) {
  const structuredData = schemaData || schema(lang, title, description, canonicalPath);
  const metaImage = /^https?:\/\//.test(imagePath) ? imagePath : absoluteUrl(imagePath);
  const pageUrl = absoluteUrl(canonicalPath);
  const pageBody = body.replace("<main", '<main id="main-content" tabindex="-1"');
  return `<!doctype html>
<html lang="${lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <link rel="canonical" href="${siteUrl}${canonicalPath}">
  ${alternateLinks(currentPathBuilder, canonicalPath)}
  <link rel="alternate" type="application/rss+xml" title="${siteName} RSS" href="${absoluteUrl(`/${lang}/feed.xml`)}">
  <link rel="alternate" type="application/feed+json" title="${siteName} JSON Feed" href="${absoluteUrl(`/${lang}/latest.json`)}">
  <meta property="og:type" content="${esc(pageType)}">
  <meta property="og:url" content="${esc(pageUrl)}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:image" content="${esc(metaImage)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image" content="${esc(metaImage)}">
  <meta name="theme-color" content="#246beb">
  ${googleVerificationMeta()}
  <link rel="stylesheet" href="/styles.css?v=${assetVersion}">
  ${adsenseHeadScript()}
  ${structuredDataScript(structuredData)}
</head>
<body>
  <a class="skip-link" href="#main-content">Skip to main content</a>
  <header class="site-header">
    <a class="brand" href="/${lang}/" aria-label="${siteName} home">
      <span class="brand-mark">KS</span>
      <span>${siteName}</span>
    </a>
    ${nav(lang)}
    <div class="lang-switcher" aria-label="Language">${langSwitcher(lang, currentPathBuilder)}</div>
  </header>
  ${pageBody}
  <footer class="site-footer">
    <div>
      <strong>${siteName}</strong>
      <p>${esc(tr(lang, "sourceWarning"))}</p>
    </div>
    <div class="footer-links">
      <a href="/${lang}/now/">${tr(lang, "navNow")}</a>
      <a href="/${lang}/planner/">${tr(lang, "navPlanner")}</a>
      <a href="/${lang}/privacy/">${tr(lang, "privacyTitle")}</a>
      <a href="/${lang}/cookie-policy/">${tr(lang, "cookieTitle")}</a>
      <a href="/${lang}/terms/">${tr(lang, "termsTitle")}</a>
      <a href="/${lang}/contact/">${tr(lang, "contactTitle")}</a>
      <a href="/${lang}/corrections/">${tr(lang, "correctionsTitle")}</a>
      <a href="/${lang}/sources/">${tr(lang, "navSources")}</a>
      <a href="/${lang}/watchlist/">${tr(lang, "navWatchlist")}</a>
      <a href="/${lang}/freshness/">${tr(lang, "freshnessTitle")}</a>
      <a href="/${lang}/editorial-policy/">${tr(lang, "editorialTitle")}</a>
    </div>
  </footer>
  <aside class="saved-planner" data-saved-planner hidden aria-live="polite">
    <div>
      <strong>${tr(lang, "savedPlannerTitle")}</strong>
      <span data-saved-count data-count-one-template="${esc(tr(lang, "savedPlannerCountOne"))}" data-count-template="${esc(tr(lang, "savedPlannerCount"))}">${tr(lang, "savedPlannerEmpty")}</span>
    </div>
    <div class="saved-planner-list" data-saved-list></div>
    <div class="saved-planner-actions">
      <a class="saved-open" href="/${lang}/planner/">${tr(lang, "openPlanner")}</a>
      <button type="button" class="saved-clear" data-clear-saved>${tr(lang, "clearSaved")}</button>
    </div>
  </aside>
  <script src="/app.js?v=${assetVersion}" defer></script>
</body>
</html>`;
}

function schema(lang, title, description, canonicalPath) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteName,
    inLanguage: lang,
    url: `${siteUrl}${canonicalPath}`,
    description,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/${lang}/?q={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };
}

function eventSearchText(event, lang) {
  const visitorInfo = Object.values(event.visitorInfo || {}).flat();
  const venueSchedule = (event.venueSchedule || []).flatMap((item) => [
    item.venue,
    item.startDate,
    item.endDate,
    item.status,
    item.theme,
    item.note
  ]);
  return [
    local(event.title, lang),
    local(event.summary, lang),
    local(event.whyGo, lang),
    event.city,
    event.district,
    event.venue,
    event.sourceName,
    event.category,
    event.dateLabel,
    event.startDate,
    event.endDate,
    ...(event.travelTips || []),
    ...visitorInfo,
    ...venueSchedule,
    ...(event.officialHighlights || [])
  ].filter(Boolean).join(" ");
}

function galleryControls(lang, { categories = false, cities = false } = {}) {
  return `
        <div class="gallery-tools${cities ? " has-city-filter" : ""}" data-gallery-controls data-count-template="${esc(tr(lang, "resultCountTemplate"))}" data-count-one-template="${esc(tr(lang, "resultCountOneTemplate"))}">
          <label class="search-field">
            <span>${tr(lang, "searchEvents")}</span>
            <input type="search" data-gallery-search placeholder="${esc(tr(lang, "searchPlaceholder"))}">
          </label>
          <label class="select-field">
            <span>${tr(lang, "statusFilter")}</span>
            <select data-status-filter>
              <option value="all">${tr(lang, "allStatuses")}</option>
              <option value="live">${tr(lang, "statusLive")}</option>
              <option value="upcoming">${tr(lang, "statusUpcoming")}</option>
              <option value="ended">${tr(lang, "statusEnded")}</option>
            </select>
          </label>
          ${cities ? `
          <label class="select-field">
            <span>${tr(lang, "location")}</span>
            <select data-city-filter>
              <option value="all">${tr(lang, "allCities")}</option>
              ${citiesWithEvents().map((city) => `<option value="${esc(city)}">${esc(city)}</option>`).join("")}
            </select>
          </label>` : ""}
          ${categories ? `
          <div class="filter-bar" data-filters>
            ${filterButton(lang, "all", "all", true)}
            ${filterButton(lang, "festival", "festival")}
            ${filterButton(lang, "kpop", "kpop")}
            ${filterButton(lang, "beauty", "beauty")}
            ${filterButton(lang, "duty-free", "dutyfree")}
            ${filterButton(lang, "department-store", "department")}
            ${filterButton(lang, "shopping", "shopping")}
            ${filterButton(lang, "travel-benefits", "benefits")}
          </div>` : ""}
          <button type="button" class="clear-filters" data-clear-filters>${tr(lang, "clearFilters")}</button>
          <span class="result-count" data-result-count aria-live="polite"></span>
        </div>`;
}

function eventCard(event, lang) {
  const status = statusOf(event);
  const freshness = freshnessInfo(event, lang);
  return `
    <article class="event-card" data-card data-category="${esc(event.category)}" data-city="${esc(event.city)}" data-status="${status}" data-search="${esc(eventSearchText(event, lang))}">
      <a class="event-thumb" href="/${lang}/events/${event.slug}.html">
        <img src="/${event.thumbnail}" alt="${esc(local(event.title, lang))}" loading="lazy">
        <span class="badge ${status}">${statusLabel(lang, status)}</span>
        <span class="thumb-overlay">
          <span class="thumb-brand">${esc(thumbnailBrand(event))}</span>
          <strong>${esc(trimHeading(local(event.title, lang), 54))}</strong>
          <span>${esc(thumbnailContext(event, lang))}</span>
        </span>
      </a>
      <div class="event-body">
        <div class="event-meta">
          <span>${categoryLabel(lang, event.category)}</span>
          ${eventKindLabel(event, lang) ? `<span>${esc(eventKindLabel(event, lang))}</span>` : ""}
          <span>${esc(event.city)}</span>
        </div>
        <h3><a href="/${lang}/events/${event.slug}.html">${esc(local(event.title, lang))}</a></h3>
        <p>${esc(local(event.summary, lang))}</p>
        <dl class="compact-facts">
          <div><dt>${tr(lang, "period")}</dt><dd>${esc(event.dateLabel || `${dateText(lang, event.startDate)} - ${dateText(lang, event.endDate)}`)}</dd></div>
          <div><dt>${tr(lang, "lastChecked")}</dt><dd>${dateText(lang, event.lastChecked)}</dd></div>
          <div><dt>${tr(lang, "freshness")}</dt><dd><span class="freshness-chip ${freshness.tone}">${esc(freshness.text)}</span></dd></div>
        </dl>
        ${saveEventButton(event, lang)}
      </div>
    </article>`;
}

function saveEventButton(event, lang) {
  return `<button type="button" class="save-event" data-save-event data-event-slug="${esc(event.slug)}" data-event-title="${esc(local(event.title, lang))}" data-event-date="${esc(event.dateLabel || `${event.startDate} - ${event.endDate}`)}" data-event-start="${esc(event.startDate)}" data-event-end="${esc(event.endDate)}" data-event-city="${esc(event.city)}" data-event-category="${esc(categoryLabel(lang, event.category))}" data-event-url="/${lang}/events/${event.slug}.html" data-event-source-url="${esc(event.sourceUrl)}" data-event-source-name="${esc(event.sourceName)}" data-save-label="${esc(tr(lang, "saveEvent"))}" data-saved-label="${esc(tr(lang, "savedEvent"))}" aria-pressed="false">${tr(lang, "saveEvent")}</button>`;
}

function renderHome(lang, canonicalPath = `/${lang}/`) {
  const sorted = [...events].sort((a, b) => {
    const statusWeight = { live: 0, upcoming: 1, ended: 2 };
    return statusWeight[statusOf(a)] - statusWeight[statusOf(b)] || b.priority - a.priority;
  });
  const liveCount = events.filter((event) => statusOf(event) === "live").length;
  const upcomingCount = events.filter((event) => statusOf(event) === "upcoming").length;
  const archiveCount = events.filter((event) => statusOf(event) === "ended").length;
  const spotlight = sorted.find((event) => statusOf(event) === "live" && event.thumbnail) || sorted.find((event) => event.thumbnail) || sorted[0];
  const spotlightPeriod = spotlight.dateLabel || `${dateText(lang, spotlight.startDate)} - ${dateText(lang, spotlight.endDate)}`;
  const description = local({
    en: "Fresh multilingual Korea events, K-pop pop-ups, shopping deals, duty-free campaigns, calendars, official sources, and travel planning notes.",
    es: "Eventos de Corea, K-pop pop-ups, ofertas, duty free, calendarios, fuentes oficiales y planificación de viaje.",
    zh: "韩国活动、K-pop 快闪、购物优惠、免税活动、日历、官方来源和旅行准备。",
    pt: "Eventos da Coreia, K-pop pop-ups, ofertas, duty free, calendários, fontes oficiais e planejamento.",
    ru: "События Кореи, K-pop pop-up, shopping deals, duty free, календари, источники и планирование."
  }, lang);

  const body = `
    <main>
      <section class="service-hero" aria-labelledby="home-title">
        <div class="service-hero-inner">
          <div class="service-copy">
            <p class="eyebrow">${tr(lang, "heroEyebrow")}</p>
            <h1 id="home-title">${tr(lang, "heroTitle")}</h1>
            <p>${tr(lang, "heroText")}</p>
            <div class="service-actions">
              <a class="button primary" href="#events">${tr(lang, "ctaEvents")}</a>
              <a class="button secondary" href="/${lang}/now/">${tr(lang, "navNow")}</a>
              <a class="button light" href="/${lang}/calendar/">${tr(lang, "ctaCalendar")}</a>
            </div>
          </div>
          <div class="service-visual">
            <a class="spotlight-card" href="/${lang}/events/${spotlight.slug}.html">
              <img src="/${spotlight.thumbnail}" alt="${esc(local(spotlight.title, lang))}">
              <span class="spotlight-badge">${esc(statusLabel(lang, statusOf(spotlight)))} / ${categoryLabel(lang, spotlight.category)}</span>
              <span class="spotlight-content">
                <span>${tr(lang, "officialLabel")} highlight</span>
                <strong>${esc(local(spotlight.title, lang))}</strong>
                <em>${esc(spotlight.city)} / ${esc(spotlightPeriod)}</em>
              </span>
            </a>
            <dl class="service-summary" aria-label="Event status summary">
              <div><dt>${tr(lang, "liveNow")}</dt><dd>${liveCount}</dd></div>
              <div><dt>${tr(lang, "upcoming")}</dt><dd>${upcomingCount}</dd></div>
              <div><dt>${tr(lang, "archive")}</dt><dd>${archiveCount}</dd></div>
              <div><dt>${tr(lang, "navSources")}</dt><dd>${sources.length}</dd></div>
            </dl>
          </div>
        </div>
      </section>
      ${adUnit("home")}

      <section class="content-shell" id="events" data-gallery-scope>
        <div class="section-head">
          <div>
            <p class="eyebrow">${tr(lang, "navEvents")}</p>
            <h2>${siteTagline}</h2>
          </div>
        </div>
        ${galleryControls(lang, { categories: true })}
        <section class="browse-directory" aria-label="${tr(lang, "browseDirectory")}">
          <div class="browse-group browse-group-types">
            <div class="browse-head">
              <div>
                <p class="eyebrow">${tr(lang, "categoryPages")}</p>
                <h3>${tr(lang, "browseTypeTitle")}</h3>
              </div>
              <p>${tr(lang, "browseTypeText")}</p>
            </div>
            <div class="category-strip home-category-strip" aria-label="${tr(lang, "categoryPages")}">
              ${categoryLinkStrip(lang)}
            </div>
          </div>
          <div class="browse-group browse-group-places">
            <div class="browse-head">
              <div>
                <p class="eyebrow">${tr(lang, "location")}</p>
                <h3>${tr(lang, "browsePlaceTitle")}</h3>
              </div>
              <p>${tr(lang, "browsePlaceText")}</p>
            </div>
            <div class="city-strip home-city-strip" aria-label="${tr(lang, "cityPages")}">
              ${cityLinkStrip(lang)}
            </div>
          </div>
        </section>
        <div class="gallery-grid">
          ${sorted.map((event) => eventCard(event, lang)).join("")}
        </div>
        <p class="empty-state gallery-empty" data-no-results hidden>${tr(lang, "noItemsYet")}</p>
      </section>

      <section class="split-band">
        <div>
          <p class="eyebrow">${tr(lang, "navCalendar")}</p>
          <h2>${tr(lang, "calendarTitle")}</h2>
          <p>${tr(lang, "calendarText")}</p>
          <a class="text-link" href="/${lang}/calendar/">${tr(lang, "ctaCalendar")}</a>
        </div>
        <div>
          <p class="eyebrow">${tr(lang, "navSources")}</p>
          <h2>${tr(lang, "sourcesTitle")}</h2>
          <p>${tr(lang, "sourcesText")}</p>
          <a class="text-link" href="/${lang}/sources/">${tr(lang, "navSources")}</a>
        </div>
      </section>
    </main>`;

  return layout({
    lang,
    title: `${siteName} - Events, K-pop Pop-ups, Shopping Deals`,
    description,
    body,
    canonicalPath,
    currentPathBuilder: (code) => code === "en" && canonicalPath === "/" ? "/" : `/${code}/`,
    schemaData: [
      schema(lang, `${siteName} - Events, K-pop Pop-ups, Shopping Deals`, description, canonicalPath),
      itemListSchema(lang, `${siteName} latest events`, sorted.slice(0, 12), canonicalPath)
    ]
  });
}

function filterButton(lang, category, labelKey, active = false) {
  return `<button type="button" data-filter="${category}"${active ? " aria-pressed=\"true\"" : ""}>${tr(lang, labelKey)}</button>`;
}

function nowMetric(event, lang, mode) {
  if (mode === "starts") {
    const days = daysFromToday(event.startDate);
    const dayWord = tr(lang, "daysLeft").replace("left", "").trim() || "days";
    return days <= 0 ? statusLabel(lang, statusOf(event)) : `${tr(lang, "startsIn")} ${days} ${dayWord}`;
  }
  const days = daysFromToday(event.endDate);
  return days <= 0 ? tr(lang, "endingSoon") : `${days} ${tr(lang, "daysLeft")}`;
}

function recheckQueuePanel(lang) {
  const items = recheckQueueItems(8);
  if (!items.length) return "";

  return `
    <section class="recheck-panel" aria-label="${esc(tr(lang, "recheckQueueTitle"))}">
      <div class="section-head">
        <div>
          <p class="eyebrow">${tr(lang, "freshness")}</p>
          <h2>${tr(lang, "recheckQueueTitle")}</h2>
          <p>${tr(lang, "recheckQueueText")}</p>
        </div>
        <a class="text-link" href="/recheck.json">JSON</a>
      </div>
      <div class="recheck-grid">
        ${items.map(({ event, ageDays, limitDays, daysUntilDue }) => {
          const freshness = freshnessInfo(event, lang);
          return `
          <article class="recheck-card ${freshness.tone}">
            <span>${esc(recheckDueText(lang, daysUntilDue))}</span>
            <strong><a href="/${lang}/events/${event.slug}.html">${esc(local(event.title, lang))}</a></strong>
            <em>${esc(event.city)} - ${categoryLabel(lang, event.category)} - ${esc(statusLabel(lang, statusOf(event)))}</em>
            <small>${esc(tr(lang, "lastChecked"))}: ${esc(dateText(lang, event.lastChecked))} / ${esc(ageDays)} of ${esc(limitDays)} days</small>
            <a href="${esc(event.sourceUrl)}" rel="nofollow noopener" target="_blank">${esc(tr(lang, "sourceLink"))}: ${esc(event.sourceName)}</a>
          </article>`;
        }).join("")}
      </div>
    </section>`;
}

function nowItem(event, lang, mode = "ends") {
  const freshness = freshnessInfo(event, lang);
  return `
    <a class="now-item" href="/${lang}/events/${event.slug}.html">
      <img src="/${event.thumbnail}" alt="" aria-hidden="true">
      <span>
        <strong>${esc(local(event.title, lang))}</strong>
        <em>${esc(event.city)} · ${categoryLabel(lang, event.category)} · ${esc(nowMetric(event, lang, mode))}</em>
        <small>${esc(event.dateLabel || `${dateText(lang, event.startDate)} - ${dateText(lang, event.endDate)}`)}</small>
        <span class="freshness-chip ${freshness.tone}">${esc(freshness.text)}</span>
      </span>
    </a>`;
}

function nowPanel(title, items, lang, mode = "ends") {
  return `
    <section class="now-panel">
      <h2>${esc(title)}</h2>
      ${items.length ? items.map((event) => nowItem(event, lang, mode)).join("") : `<p class="empty-state">${esc(tr(lang, "noItemsYet"))}</p>`}
    </section>`;
}

function renderNow(lang) {
  const groups = nowGroups();
  const combined = [];
  const seen = new Set();
  for (const event of [...groups.live, ...groups.endingSoon, ...groups.newlyChecked, ...groups.thisWeek]) {
    if (!seen.has(event.slug)) {
      seen.add(event.slug);
      combined.push(event);
    }
  }
  const body = `
    <main class="page">
      <section class="page-hero compact">
        <p class="eyebrow">${tr(lang, "navNow")}</p>
        <h1>${tr(lang, "nowTitle")}</h1>
        <p>${tr(lang, "nowText")}</p>
      </section>
      ${nowDashboard(lang)}
      ${nowFeedLinks(lang)}
      ${recheckQueuePanel(lang)}
      <section class="now-grid">
        ${nowPanel(tr(lang, "livePanel"), groups.live, lang)}
        ${nowPanel(tr(lang, "endingSoon"), groups.endingSoon, lang)}
        ${nowPanel(tr(lang, "newlyChecked"), groups.newlyChecked, lang)}
        ${nowPanel(tr(lang, "thisWeek"), groups.thisWeek, lang, "starts")}
      </section>
      <section class="latest-checked-section">
        <div class="section-head">
          <div>
            <p class="eyebrow">${tr(lang, "lastChecked")}</p>
            <h2>${tr(lang, "latestCheckedGallery")}</h2>
            <p>${tr(lang, "latestCheckedText")}</p>
          </div>
          <a class="text-link" href="/${lang}/freshness/">${tr(lang, "freshnessLogLabel")}</a>
        </div>
        <div class="gallery-grid">
          ${feedEvents(9).map((event) => eventCard(event, lang)).join("")}
        </div>
      </section>
    </main>`;

  return layout({
    lang,
    title: `${tr(lang, "nowTitle")} - K-Spot Now`,
    description: tr(lang, "nowText"),
    body,
    canonicalPath: `/${lang}/now/`,
    currentPathBuilder: (code) => `/${code}/now/`,
    schemaData: [
      schema(lang, `${tr(lang, "nowTitle")} - K-Spot Now`, tr(lang, "nowText"), `/${lang}/now/`),
      itemListSchema(lang, tr(lang, "nowTitle"), combined, `/${lang}/now/`)
    ]
  });
}

function renderCategory(lang, category) {
  const meta = categoryDefinitions[category];
  const items = events
    .filter((event) => event.category === category)
    .sort((a, b) => {
      const statusWeight = { live: 0, upcoming: 1, ended: 2 };
      return statusWeight[statusOf(a)] - statusWeight[statusOf(b)] || b.priority - a.priority;
    });
  const title = meta?.title || categoryLabel(lang, category);
  const description = meta?.description || `Fresh Korea ${categoryLabel(lang, category)} listings from official sources.`;
  const body = `
    <main class="page">
      <section class="page-hero compact">
        <p class="eyebrow">${tr(lang, "category")}</p>
        <h1>${esc(title)}</h1>
        <p>${esc(description)}</p>
      </section>
      <section class="category-strip page-strip" aria-label="${tr(lang, "categoryPages")}">
        ${categoryLinkStrip(lang)}
      </section>
      <section data-gallery-scope>
        ${galleryControls(lang)}
        <div class="gallery-grid">
          ${items.map((event) => eventCard(event, lang)).join("")}
        </div>
        <p class="empty-state gallery-empty" data-no-results hidden>${tr(lang, "noItemsYet")}</p>
      </section>
    </main>`;

  return layout({
    lang,
    title: `${title} - K-Spot Now`,
    description,
    body,
    canonicalPath: categoryHref(lang, category),
    currentPathBuilder: (code) => categoryHref(code, category),
    schemaData: [
      schema(lang, `${title} - K-Spot Now`, description, categoryHref(lang, category)),
      itemListSchema(lang, title, items, categoryHref(lang, category)),
      breadcrumbSchema(lang, [
        { name: "Home", url: `/${lang}/` },
        { name: categoryLabel(lang, category), url: categoryHref(lang, category) }
      ])
    ]
  });
}

function renderCity(lang, city) {
  const meta = cityDefinitions[city] || {
    title: `${city} Korea event planner`,
    description: `Officially checked Korea events and travel planning notes for ${city}.`,
    weatherRegion: city
  };
  const items = events
    .filter((event) => event.city === city)
    .sort((a, b) => {
      const statusWeight = { live: 0, upcoming: 1, ended: 2 };
      return statusWeight[statusOf(a)] - statusWeight[statusOf(b)] || a.startDate.localeCompare(b.startDate) || b.priority - a.priority;
    });
  const weatherRegion = meta.weatherRegion || city;
  const weatherInfo = weatherBaseline(weatherRegion, representativeWeatherIso(items));
  const forecastInfo = currentForecastForCity(city, weatherRegion);
  const routeIdeas = routesForCity(city);
  const liveCount = items.filter((event) => statusOf(event) === "live").length;
  const upcomingCount = items.filter((event) => statusOf(event) === "upcoming").length;
  const endedCount = items.filter((event) => statusOf(event) === "ended").length;
  const body = `
    <main class="page">
      <section class="page-hero compact">
        <p class="eyebrow">${tr(lang, "cityPages")}</p>
        <h1>${esc(meta.title)}</h1>
        <p>${esc(meta.description)}</p>
      </section>

      <section class="city-strip page-strip" aria-label="${tr(lang, "cityPages")}">
        ${cityLinkStrip(lang)}
      </section>

      <section class="city-dashboard">
        <div class="city-stat"><strong>${items.length}</strong><span>${tr(lang, "navEvents")}</span></div>
        <div class="city-stat"><strong>${liveCount}</strong><span>${tr(lang, "liveNow")}</span></div>
        <div class="city-stat"><strong>${upcomingCount}</strong><span>${tr(lang, "upcoming")}</span></div>
        <div class="city-stat"><strong>${endedCount}</strong><span>${tr(lang, "archive")}</span></div>
      </section>

      <section class="detail-section two-col">
        <div>
          ${weatherPlanInner(lang, forecastInfo, weatherInfo)}
        </div>
        <div>
          <h2>${tr(lang, "routeIdeas")}</h2>
          <div class="route-mini-list">
            ${routeIdeas.map((route) => `
              <a href="${routeHref(lang, route)}">
                <strong>${esc(route.title)}</strong>
                <span>${esc(route.bestFor)}</span>
              </a>`).join("")}
          </div>
        </div>
      </section>

      <section id="events" class="city-gallery" data-gallery-scope>
        ${galleryControls(lang)}
        <div class="gallery-grid">
          ${items.map((event) => eventCard(event, lang)).join("")}
        </div>
        <p class="empty-state gallery-empty" data-no-results hidden>${tr(lang, "noItemsYet")}</p>
      </section>
    </main>`;

  return layout({
    lang,
    title: `${meta.title} - K-Spot Now`,
    description: meta.description,
    body,
    canonicalPath: cityHref(lang, city),
    currentPathBuilder: (code) => cityHref(code, city),
    schemaData: [
      schema(lang, `${meta.title} - K-Spot Now`, meta.description, cityHref(lang, city)),
      itemListSchema(lang, meta.title, items, cityHref(lang, city)),
      breadcrumbSchema(lang, [
        { name: "Home", url: `/${lang}/` },
        { name: city, url: cityHref(lang, city) }
      ])
    ]
  });
}

function renderRoutes(lang) {
  const description = "Practical Korea travel routes connected to official events, shopping pages, weather notes, and nearby visitor plans.";
  const body = `
    <main class="page">
      <section class="page-hero compact">
        <p class="eyebrow">${tr(lang, "routePages")}</p>
        <h1>${tr(lang, "routePages")}</h1>
        <p>${esc(description)}</p>
      </section>
      <section class="route-grid wide-route-grid">
        ${routes.map((route) => routeLinkCard(route, lang)).join("")}
      </section>
    </main>`;

  return layout({
    lang,
    title: `${tr(lang, "routePages")} - K-Spot Now`,
    description,
    body,
    canonicalPath: `/${lang}/routes/`,
    currentPathBuilder: (code) => `/${code}/routes/`,
    schemaData: [
      schema(lang, `${tr(lang, "routePages")} - K-Spot Now`, description, `/${lang}/routes/`),
      {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: tr(lang, "routePages"),
        inLanguage: lang,
        url: absoluteUrl(`/${lang}/routes/`),
        numberOfItems: routes.length,
        itemListElement: routes.map((route, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: absoluteUrl(routeHref(lang, route)),
          name: route.title
        }))
      }
    ]
  });
}

function renderRoute(route, lang) {
  const relatedEvents = eventsForRoute(route).slice(0, 9);
  const description = `${route.bestFor} Stops include ${route.stops.join(", ")}.`;
  const body = `
    <main class="page">
      <article class="detail-layout">
        <section class="page-hero compact">
          <p class="eyebrow">${tr(lang, "routePages")}</p>
          <h1>${esc(route.title)}</h1>
          <p>${esc(route.bestFor)}</p>
        </section>

        <section class="detail-section two-col">
          <div>
            <h2>${tr(lang, "travelIdeas")}</h2>
            <ol class="stop-list">${route.stops.map((stop) => `<li><strong>${esc(stop)}</strong></li>`).join("")}</ol>
          </div>
          <div>
            <h2>${tr(lang, "weatherPlan")}</h2>
            <ul>${route.tips.map((tip) => `<li>${esc(tip)}</li>`).join("")}</ul>
          </div>
        </section>

        <section class="detail-section">
          <h2>${tr(lang, "cityPages")}</h2>
          <div class="city-strip page-strip">
            ${route.regions.map((region) => cityDefinitions[region] ? `
              <a class="city-pill" href="${cityHref(lang, region)}">
                <strong>${esc(region)}</strong>
                <span>${events.filter((event) => event.city === region).length} events</span>
              </a>` : "").join("")}
          </div>
        </section>

        <section class="detail-section">
          <h2>${tr(lang, "relatedGuides")}</h2>
          <div class="gallery-grid">
            ${relatedEvents.length ? relatedEvents.map((event) => eventCard(event, lang)).join("") : guides.slice(0, 3).map((guide) => guideCard(guide, lang)).join("")}
          </div>
        </section>
      </article>
    </main>`;

  return layout({
    lang,
    title: `${route.title} - K-Spot Now`,
    description,
    body,
    canonicalPath: routeHref(lang, route),
    currentPathBuilder: (code) => routeHref(code, route),
    schemaData: [
      schema(lang, `${route.title} - K-Spot Now`, description, routeHref(lang, route)),
      itemListSchema(lang, route.title, relatedEvents, routeHref(lang, route)),
      breadcrumbSchema(lang, [
        { name: "Home", url: `/${lang}/` },
        { name: tr(lang, "routePages"), url: `/${lang}/routes/` },
        { name: route.title, url: routeHref(lang, route) }
      ])
    ]
  });
}

function renderCalendar(lang) {
  const futureFirst = [...events].sort((a, b) => a.startDate.localeCompare(b.startDate));
  const groups = new Map();
  for (const event of futureFirst) {
    const key = monthKey(event.startDate);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(event);
  }

  const body = `
    <main class="page">
      <section class="page-hero compact">
        <p class="eyebrow">${tr(lang, "navCalendar")}</p>
        <h1>${tr(lang, "calendarTitle")}</h1>
        <p>${tr(lang, "calendarText")}</p>
        <a class="button primary" href="/events.ics">${tr(lang, "downloadCalendar")}</a>
      </section>
      <section class="calendar-list calendar-filterable" data-gallery-scope>
        ${galleryControls(lang, { categories: true, cities: true })}
        ${[...groups.entries()].map(([key, items]) => `
          <div class="month-block" data-filter-group>
            <h2>${monthText(lang, key)}</h2>
            <div class="month-events">
              ${items.map((event) => calendarItem(event, lang)).join("")}
            </div>
          </div>`).join("")}
        <p class="empty-state gallery-empty" data-no-results hidden>${tr(lang, "noItemsYet")}</p>
      </section>
    </main>`;
  return layout({
    lang,
    title: `${tr(lang, "calendarTitle")} - K-Spot Now`,
    description: tr(lang, "calendarText"),
    body,
    canonicalPath: `/${lang}/calendar/`,
    currentPathBuilder: (code) => `/${code}/calendar/`
  });
}

function calendarItem(event, lang) {
  const status = statusOf(event);
  return `
    <a class="calendar-item" href="/${lang}/events/${event.slug}.html" data-card data-category="${esc(event.category)}" data-city="${esc(event.city)}" data-status="${status}" data-search="${esc(eventSearchText(event, lang))}">
      <span class="date-pill">${dateText(lang, event.startDate)}<small>${dateText(lang, event.endDate)}</small></span>
      <span>
        <strong>${esc(local(event.title, lang))}</strong>
        <small class="calendar-weather">${esc(calendarWeatherText(event, lang))}</small>
        <em>${esc(event.city)} · ${categoryLabel(lang, event.category)}</em>
      </span>
      <b class="${status}">${statusLabel(lang, status)}</b>
    </a>`;
}

function renderPlanner(lang) {
  const body = `
    <main class="page" data-planner-page data-open-label="${esc(tr(lang, "openSavedEvent"))}" data-official-label="${esc(tr(lang, "officialLabel"))}" data-remove-label="${esc(tr(lang, "removeSaved"))}">
      <section class="page-hero compact">
        <p class="eyebrow">${tr(lang, "navPlanner")}</p>
        <h1>${tr(lang, "plannerTitle")}</h1>
        <p>${tr(lang, "plannerText")}</p>
        <div class="hero-actions">
          <a class="button primary" href="/${lang}/#events">${tr(lang, "ctaEvents")}</a>
          <button type="button" class="button light" data-download-saved-calendar>${tr(lang, "downloadSavedCalendar")}</button>
          <button type="button" class="button light" data-clear-saved>${tr(lang, "clearSaved")}</button>
        </div>
      </section>
      <section class="planner-board">
        <div class="planner-empty" data-planner-empty>
          <strong>${tr(lang, "plannerEmptyTitle")}</strong>
          <span>${tr(lang, "plannerEmptyText")}</span>
        </div>
        <div class="planner-grid" data-planner-grid></div>
      </section>
    </main>`;

  return layout({
    lang,
    title: `${tr(lang, "plannerTitle")} - K-Spot Now`,
    description: tr(lang, "plannerText"),
    body,
    canonicalPath: `/${lang}/planner/`,
    currentPathBuilder: (code) => `/${code}/planner/`
  });
}

function renderEvent(event, lang) {
  const status = statusOf(event);
  const freshness = freshnessInfo(event, lang);
  const relatedGuides = guides.filter((guide) => guide.category === event.category).slice(0, 3);
  const routeIdeas = routesForEvent(event);
  const relatedEvents = relatedEventsForEvent(event);
  const weatherInfo = weatherBaseline(event.weatherRegion, weatherIsoForEvent(event));
  const forecastInfo = currentForecastForEvent(event);
  const description = local(event.summary, lang);
  const periodText = event.dateLabel || `${event.startDate} - ${event.endDate}`;
  const venueText = [event.venue, event.district].filter(Boolean).join(", ");
  const body = `
    <main class="page">
      <article class="detail-layout">
        <header class="detail-hero">
          <img src="/${event.thumbnail}" alt="" aria-hidden="true">
          <div>
            <p class="eyebrow">${categoryLabel(lang, event.category)} · ${statusLabel(lang, status)}</p>
            <h1>${esc(local(event.title, lang))}</h1>
            <p>${esc(description)}</p>
            <div class="detail-actions">
              <a class="button primary" href="${esc(event.sourceUrl)}" rel="nofollow noopener" target="_blank">${tr(lang, "official")}</a>
              <a class="button light" href="/events/${event.slug}.ics">${tr(lang, "downloadCalendar")}</a>
              ${saveEventButton(event, lang)}
            </div>
          </div>
        </header>

        <section class="fact-grid" aria-label="Event facts">
          ${fact(tr(lang, "period"), periodText, "calendar")}
          ${fact(tr(lang, "venue"), venueText, "pin")}
          ${fact(tr(lang, "location"), event.city, "place")}
          ${fact(tr(lang, "lastChecked"), dateText(lang, event.lastChecked), "check")}
          ${fact(tr(lang, "freshness"), `<span class="freshness-chip ${esc(freshness.tone)}">${esc(freshness.text)}</span>`, "pulse", true)}
          ${fact("Verification", prettyVerification(event.verification), "shield")}
          ${fact(tr(lang, "collectionMode"), prettyCollectionMode(event.collectionMode), "review")}
          ${eventKindLabel(event, lang) ? fact("Date basis", eventKindLabel(event, lang), "basis") : ""}
        </section>

        ${visitorInfoSection(event, lang)}

        <section class="detail-section">
          <h2>${tr(lang, "readDetails")}</h2>
          <p>${esc(local(event.whyGo, lang))}</p>
          <p class="notice">${tr(lang, "verifyBefore")}</p>
        </section>
        ${adUnit("detail")}

        <section class="detail-section weather-detail-section">
          ${weatherPlanInner(lang, forecastInfo, weatherInfo)}
        </section>

        <section class="detail-section travel-ideas-section">
          <h2>${tr(lang, "travelIdeas")}</h2>
          <ul>${event.travelTips.map((tip) => `<li>${esc(tip)}</li>`).join("")}</ul>
        </section>
        ${mapLinkSection(event, lang)}

        ${routeIdeas.length ? `
          <section class="detail-section">
            <h2>${tr(lang, "routeIdeas")}</h2>
            <div class="route-grid">
              ${routeIdeas.map((route) => routeLinkCard(route, lang)).join("")}
            </div>
          </section>` : ""}

        ${relatedEvents.length ? `
          <section class="detail-section related-events-section">
            <h2>${tr(lang, "relatedEventsTitle")}</h2>
            <div class="gallery-grid">
              ${relatedEvents.map((item) => eventCard(item, lang)).join("")}
            </div>
          </section>` : ""}

        <section class="detail-section">
          <h2>${tr(lang, "relatedGuides")}</h2>
          <div class="guide-grid">
            ${(relatedGuides.length ? relatedGuides : guides.slice(0, 3)).map((guide) => guideCard(guide, lang)).join("")}
          </div>
        </section>
      </article>
    </main>`;

  return layout({
    lang,
    title: `${local(event.title, lang)} - K-Spot Now`,
    description,
    body,
    canonicalPath: `/${lang}/events/${event.slug}.html`,
    currentPathBuilder: (code) => `/${code}/events/${event.slug}.html`,
    imagePath: `/${event.thumbnail}`,
    pageType: "article",
    schemaData: [
      shouldUseEventSchema(event) ? eventSchema(event, lang) : detailPageSchema(event, lang),
      breadcrumbSchema(lang, [
        { name: "Home", url: `/${lang}/` },
        { name: categoryLabel(lang, event.category), url: categoryHref(lang, event.category) },
        { name: local(event.title, lang), url: `/${lang}/events/${event.slug}.html` }
      ])
    ]
  });
}

function titleCaseWords(value) {
  return String(value || "")
    .replaceAll("-", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function prettyCollectionMode(value) {
  const raw = String(value || "").trim();
  const labels = {
    "manual-reviewed-official-page": "Official page review",
    "official-page-monitor": "Official page monitor",
    "official-api": "Official API",
    "official-page": "Official page"
  };
  return labels[raw] || titleCaseWords(raw);
}

function prettyVerification(value) {
  const raw = String(value || "").trim();
  const labels = {
    official: "Official source",
    "official-ended": "Official archive",
    "official-listing": "Official listing"
  };
  if (labels[raw]) return labels[raw];
  if (raw.startsWith("official-")) return `Official ${titleCaseWords(raw.replace(/^official-/, "")).toLowerCase()}`;
  return titleCaseWords(raw);
}

function fact(label, value, icon = "dot", html = false) {
  const safeIcon = String(icon || "dot").replace(/[^a-z0-9-]/gi, "");
  return `
    <div class="fact fact-${safeIcon}">
      <span class="fact-icon" aria-hidden="true"></span>
      <span class="fact-label">${esc(label)}</span>
      <strong>${html ? value : esc(value)}</strong>
    </div>`;
}

function guideCard(guide, lang) {
  return `
    <a class="guide-card" href="/${lang}/guides/${guide.slug}.html">
      <span>${categoryLabel(lang, guide.category)}</span>
      <strong>${esc(local(guide.title, lang))}</strong>
      <p>${esc(local(guide.summary, lang))}</p>
    </a>`;
}

function renderGuides(lang) {
  const body = `
    <main class="page">
      <section class="page-hero compact">
        <p class="eyebrow">${tr(lang, "navGuides")}</p>
        <h1>${tr(lang, "guidesTitle")}</h1>
        <p>${tr(lang, "sourceWarning")}</p>
      </section>
      <section class="guide-grid wide">
        ${guides.map((guide) => guideCard(guide, lang)).join("")}
      </section>
    </main>`;
  return layout({
    lang,
    title: `${tr(lang, "guidesTitle")} - K-Spot Now`,
    description: "Original visitor guides for Korea events, K-pop pop-ups, shopping, duty-free, and weather planning.",
    body,
    canonicalPath: `/${lang}/guides/`,
    currentPathBuilder: (code) => `/${code}/guides/`
  });
}

function renderGuide(guide, lang) {
  const sections = localList(guide.sections, lang);
  const body = `
    <main class="page">
      <article class="article-page">
        <p class="eyebrow">${categoryLabel(lang, guide.category)}</p>
        <h1>${esc(local(guide.title, lang))}</h1>
        <p class="lede">${esc(local(guide.summary, lang))}</p>
        ${adUnit("article")}
        ${sections.map((section, index) => `
          <section>
            <h2>${esc(guideSectionHeading(section, index))}</h2>
            <p>${esc(section)}</p>
          </section>`).join("")}
      </article>
    </main>`;
  return layout({
    lang,
    title: `${local(guide.title, lang)} - K-Spot Now`,
    description: local(guide.summary, lang),
    body,
    canonicalPath: `/${lang}/guides/${guide.slug}.html`,
    currentPathBuilder: (code) => `/${code}/guides/${guide.slug}.html`
  });
}

function renderSources(lang) {
  const body = `
    <main class="page">
      <section class="page-hero compact">
        <p class="eyebrow">${tr(lang, "navSources")}</p>
        <h1>${tr(lang, "sourcesTitle")}</h1>
        <p>${tr(lang, "sourcesText")}</p>
      </section>
      <section class="source-table">
        ${sources.map((source) => `
          <article>
            <div>
              <strong>${esc(source.name)}</strong>
              <span>${esc(source.type)} · ${esc(source.refreshCadence)}</span>
            </div>
            <div class="source-copy">
              <p>${esc(source.notes)}</p>
              ${sourceAlternateLinks(source)}
            </div>
            <a href="${esc(source.url)}" rel="nofollow noopener" target="_blank">${tr(lang, "official")}</a>
          </article>`).join("")}
      </section>
      <section class="split-links">
        <a href="/${lang}/watchlist/">
          <strong>${tr(lang, "watchlistTitle")}</strong>
          <span>${tr(lang, "watchlistText")}</span>
        </a>
        <a href="/${lang}/freshness/">
          <strong>${tr(lang, "freshnessTitle")}</strong>
          <span>${tr(lang, "freshnessText")}</span>
        </a>
        <a href="/${lang}/editorial-policy/">
          <strong>${tr(lang, "editorialTitle")}</strong>
          <span>${tr(lang, "editorialText")}</span>
        </a>
        <a href="/${lang}/corrections/">
          <strong>${tr(lang, "correctionsTitle")}</strong>
          <span>${tr(lang, "correctionsText")}</span>
        </a>
      </section>
    </main>`;
  return layout({
    lang,
    title: `${tr(lang, "sourcesTitle")} - K-Spot Now`,
    description: tr(lang, "sourcesText"),
    body,
    canonicalPath: `/${lang}/sources/`,
    currentPathBuilder: (code) => `/${code}/sources/`
  });
}

function sourceMatchesGroup(source, group) {
  const blob = [
    source.name,
    source.type,
    source.owner,
    source.automationStatus,
    source.notes,
    ...(source.coverage || [])
  ].join(" ").toLowerCase();
  return group.matches.some((term) => blob.includes(term));
}

function sourceCoverage(source) {
  return (source.coverage || []).slice(0, 5).join(", ");
}

function watchlistStat(label, value) {
  return `<div><strong>${esc(value)}</strong><span>${esc(label)}</span></div>`;
}

function sourceAlternateLinks(source) {
  const links = source.alternateUrls || [];
  if (!links.length) return "";
  return `
    <details class="source-alternates">
      <summary>${esc(links.length)} official fallback ${links.length === 1 ? "link" : "links"}</summary>
      <ul>
        ${links.map((url) => `<li><a href="${esc(url)}" rel="nofollow noopener" target="_blank">${esc(url)}</a></li>`).join("")}
      </ul>
    </details>`;
}

function compactCount(value) {
  return Number.isFinite(Number(value)) ? Number(value).toLocaleString("en-US") : "0";
}

function sourceRefreshPublicSummary() {
  if (!sourceRefreshSummary?.data) return null;
  const summary = sourceRefreshSummary.data;
  return {
    generatedAt: summary.generatedAt,
    fileName: sourceRefreshSummary.fileName,
    counts: summary.counts || {},
    failedSources: (summary.failedSources || []).slice(0, 12).map((item) => ({
      sourceName: item.sourceName,
      status: item.status,
      error: item.error || ""
    })),
    topDraftSources: (summary.topDraftSources || []).slice(0, 8),
    topDraftCategories: (summary.topDraftCategories || []).slice(0, 8),
    highSignalCandidates: (summary.highSignalCandidates || []).slice(0, 8).map((item) => ({
      sourceName: item.sourceName,
      url: item.url,
      links: item.links,
      dates: item.dates,
      keywords: item.keywords,
      score: item.score
    })),
    publishingRule: tr("en", "sourceRefreshRule")
  };
}

function sourceRefreshPanel(lang) {
  const summary = sourceRefreshPublicSummary();
  if (!summary) {
    return `
      <section class="source-refresh-panel">
        <div>
          <p class="eyebrow">${tr(lang, "sourceRefreshTitle")}</p>
          <h2>${tr(lang, "sourceRefreshTitle")}</h2>
          <p>${tr(lang, "sourceRefreshNoData")}</p>
        </div>
      </section>`;
  }

  const counts = summary.counts || {};
  const stats = [
    ["Audited sources", counts.auditedSources],
    ["Monitor checks", counts.monitorSources],
    ["Discovered official links", counts.discoveredLinks],
    ["Date signals", counts.dateSignals],
    ["Draft candidates", counts.draftCandidates],
    ["Skipped leads", counts.skippedCandidates]
  ];
  const generated = summary.generatedAt ? new Date(summary.generatedAt) : null;
  const generatedText = generated && !Number.isNaN(generated.getTime())
    ? new Intl.DateTimeFormat(languages[lang].locale, { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(generated)
    : summary.fileName;

  return `
    <section class="source-refresh-panel" aria-label="${esc(tr(lang, "sourceRefreshTitle"))}">
      <div class="source-refresh-head">
        <div>
          <p class="eyebrow">${tr(lang, "sourceRefreshTitle")}</p>
          <h2>${tr(lang, "sourceRefreshTitle")}</h2>
          <p>${tr(lang, "sourceRefreshText")}</p>
          <small>Generated: ${esc(generatedText)} UTC</small>
        </div>
        <a class="button light" href="/source-refresh.json">${tr(lang, "sourceRefreshJson")}</a>
      </div>
      <div class="source-refresh-stats">
        ${stats.map(([label, value]) => `
          <div>
            <strong>${esc(compactCount(value))}</strong>
            <span>${esc(label)}</span>
          </div>`).join("")}
      </div>
      <div class="source-refresh-columns">
        <article>
          <h3>${tr(lang, "sourceRefreshAttention")}</h3>
          <ul>
            ${summary.failedSources.length ? summary.failedSources.map((item) => `
              <li>
                <strong>${esc(item.sourceName)}</strong>
                <span>${esc(item.status || "ERR")}${item.error ? ` - ${esc(item.error)}` : ""}</span>
              </li>`).join("") : "<li><strong>No failed sources</strong><span>Latest run did not report source failures.</span></li>"}
          </ul>
        </article>
        <article>
          <h3>${tr(lang, "sourceRefreshDraftSources")}</h3>
          <ul>
            ${summary.topDraftSources.length ? summary.topDraftSources.map((item) => `
              <li>
                <strong>${esc(item.key)}</strong>
                <span>${esc(compactCount(item.count))} draft candidates</span>
              </li>`).join("") : "<li><strong>No draft candidates</strong><span>Run the source refresh workflow after adding monitors.</span></li>"}
          </ul>
        </article>
        <article>
          <h3>${tr(lang, "sourceRefreshCandidates")}</h3>
          <ul>
            ${summary.highSignalCandidates.length ? summary.highSignalCandidates.slice(0, 5).map((item) => `
              <li>
                <a href="${esc(item.url)}" rel="nofollow noopener" target="_blank">${esc(item.sourceName)}</a>
                <span>${esc(compactCount(item.links))} links / ${esc(compactCount(item.dates))} date signals / score ${esc(compactCount(item.score))}</span>
              </li>`).join("") : "<li><strong>No high-signal pages</strong><span>Latest run did not surface candidate pages.</span></li>"}
          </ul>
        </article>
      </div>
      <p class="source-refresh-rule">${tr(lang, "sourceRefreshRule")}</p>
    </section>`;
}

function renderWatchlist(lang) {
  const activeQueue = curationQueue.filter((item) => item.status === "active");
  const officialApis = sources.filter((source) => source.type === "official-api").length;
  const monitors = sources.filter((source) => source.type === "official-page-monitor" || source.type === "official-listing-monitor").length;
  const curationRoots = sources.filter((source) => source.type === "curation-root").length;
  const pipelineSteps = [
    "Collect official pages and same-site detail links from monitored sources.",
    "Score candidate links by dates, visitor keywords, source type, and official-site context.",
    "Open the official source manually for date, venue, eligibility, inventory, ticketing, and rights checks.",
    "Rewrite summaries and travel notes in original words before publishing a public event page.",
    "Show last-checked dates, official links, previous-year weather notes, and nearby routes on every detail page."
  ];

  const body = `
    <main class="page">
      <section class="page-hero compact">
        <p class="eyebrow">${tr(lang, "navWatchlist")}</p>
        <h1>${tr(lang, "watchlistTitle")}</h1>
        <p>${tr(lang, "watchlistText")}</p>
      </section>

      <section class="watch-stats" aria-label="Monitoring stats">
        ${watchlistStat("official APIs", officialApis)}
        ${watchlistStat("page and listing monitors", monitors)}
        ${watchlistStat("curation roots", curationRoots)}
        ${watchlistStat("active manual queues", activeQueue.length)}
      </section>

      ${sourceRefreshPanel(lang)}

      <section class="watch-grid" aria-label="Official monitoring groups">
        ${watchlistGroups.map((group) => {
          const groupSources = sources.filter((source) => sourceMatchesGroup(source, group));
          return `
            <article class="watch-card">
              <span>${esc(group.slug)}</span>
              <h2>${esc(group.title)}</h2>
              <p>${esc(group.focus)}</p>
              <dl>
                <div><dt>Sources watched</dt><dd>${groupSources.length}</dd></div>
                <div><dt>Refresh model</dt><dd>${esc(groupSources.map((source) => source.refreshCadence).filter(Boolean).slice(0, 2).join(" / ") || "review queue")}</dd></div>
              </dl>
              <ul>
                ${groupSources.slice(0, 7).map((source) => `
                  <li>
                    <a href="${esc(source.url)}" rel="nofollow noopener" target="_blank">${esc(source.name)}</a>
                    <small>${esc(source.automationStatus)} - ${esc(sourceCoverage(source))}</small>
                  </li>`).join("")}
              </ul>
            </article>`;
        }).join("")}
      </section>

      <section class="watch-pipeline">
        <div>
          <h2>Review pipeline</h2>
          <ol>${pipelineSteps.map((step) => `<li>${esc(step)}</li>`).join("")}</ol>
        </div>
        <div>
          <h2>K-pop curation queue</h2>
          <p>K-pop pop-ups, fan meetings, ticket changes, birthday cafes, and merch stores are intentionally kept in a review queue until an official source is confirmed.</p>
          <div class="queue-list">
            ${activeQueue.map((item) => `
              <a href="${esc(item.sourceUrl)}" rel="nofollow noopener" target="_blank">
                <strong>${esc(item.label)}</strong>
                <span>${esc(item.artistOrBrand)} - ${esc((item.topics || []).slice(0, 4).join(", "))}</span>
                <em>${esc(item.refreshCadence)}</em>
              </a>`).join("")}
          </div>
        </div>
      </section>
    </main>`;

  return layout({
    lang,
    title: `${tr(lang, "watchlistTitle")} - K-Spot Now`,
    description: tr(lang, "watchlistText"),
    body,
    canonicalPath: `/${lang}/watchlist/`,
    currentPathBuilder: (code) => `/${code}/watchlist/`
  });
}

function renderFreshness(lang) {
  const items = [...events].sort((a, b) => b.lastChecked.localeCompare(a.lastChecked) || b.priority - a.priority);
  const body = `
    <main class="page">
      <section class="page-hero compact">
        <p class="eyebrow">${tr(lang, "lastChecked")}</p>
        <h1>${tr(lang, "freshnessTitle")}</h1>
        <p>${tr(lang, "freshnessText")}</p>
      </section>
      <section class="freshness-list">
        ${items.map((event) => {
          const freshness = freshnessInfo(event, lang);
          return `
          <article class="freshness-row ${freshness.tone}">
            <div>
              <span>${dateText(lang, event.lastChecked)}</span>
              <strong><a href="/${lang}/events/${event.slug}.html">${esc(local(event.title, lang))}</a></strong>
              <em>${esc(event.city)} · ${categoryLabel(lang, event.category)} · ${statusLabel(lang, statusOf(event))}</em>
              <span class="freshness-chip ${freshness.tone}">${esc(freshness.text)}</span>
            </div>
            <p>${esc(local(event.summary, lang))}</p>
            <a href="${esc(event.sourceUrl)}" rel="nofollow noopener" target="_blank">${esc(event.sourceName)}</a>
          </article>`;
        }).join("")}
      </section>
    </main>`;
  return layout({
    lang,
    title: `${tr(lang, "freshnessTitle")} - K-Spot Now`,
    description: tr(lang, "freshnessText"),
    body,
    canonicalPath: `/${lang}/freshness/`,
    currentPathBuilder: (code) => `/${code}/freshness/`
  });
}

function renderEditorialPolicy(lang) {
  const body = `
    <main class="page">
      <article class="article-page">
        <p class="eyebrow">${tr(lang, "editorialTitle")}</p>
        <h1>${tr(lang, "editorialTitle")}</h1>
        <p class="lede">${tr(lang, "editorialText")}</p>
        <section>
          <h2>1. Source priority</h2>
          <p>Published listings must come from official APIs, official government or tourism pages, official brand pages, official venue pages, or verified official artist/company notices. Unofficial reposts are used only as discovery hints.</p>
        </section>
        <section>
          <h2>2. Automation and review</h2>
          <p>Official monitors collect candidate dates and keywords, but candidates are not auto-published. A human review step must confirm the date range, venue, eligibility, inventory or reservation rules, and source link before an event appears publicly.</p>
        </section>
        <section>
          <h2>3. K-pop and pop-up policy</h2>
          <p>K-pop pop-ups, fan events, ticketing notices, and merch stores can change quickly. We publish only official notices and keep fan-community or social reposts in a curation queue until an official source is confirmed.</p>
        </section>
        <section>
          <h2>4. Original summaries</h2>
          <p>Summaries, travel tips, weather notes, and route ideas are written for visitor planning. We do not copy full event pages, and every listing links back to the official source for the latest rules.</p>
        </section>
        <section>
          <h2>5. Ads and affiliate integrity</h2>
          <p>Advertising must not influence event inclusion, source labels, freshness dates, or safety notes. Visitors should always verify official details before purchasing, reserving, or changing travel plans.</p>
        </section>
      </article>
    </main>`;
  return layout({
    lang,
    title: `${tr(lang, "editorialTitle")} - K-Spot Now`,
    description: tr(lang, "editorialText"),
    body,
    canonicalPath: `/${lang}/editorial-policy/`,
    currentPathBuilder: (code) => `/${code}/editorial-policy/`
  });
}

function renderCorrections(lang) {
  const body = `
    <main class="page">
      <article class="article-page">
        <p class="eyebrow">${tr(lang, "correctionsTitle")}</p>
        <h1>${tr(lang, "correctionsTitle")}</h1>
        <p class="lede">${tr(lang, "correctionsText")}</p>
        <section>
          <h2>1. What to send</h2>
          <p>Email ${esc(contactEmail)} with the official URL, event or offer name, date range, venue or branch, language, and the exact detail that looks outdated or incorrect.</p>
        </section>
        <section>
          <h2>2. Official-source checks</h2>
          <p>Corrections are checked against official APIs, government or tourism pages, brand pages, venue pages, ticketing pages, or verified artist and company notices before public pages are changed.</p>
        </section>
        <section>
          <h2>3. Fast-moving categories</h2>
          <p>Duty-free campaigns, OLIVE YOUNG promotions, department-store pop-ups, K-pop reservations, and ticketing notices receive shorter recheck windows because dates, eligibility, stock, and entry rules can change quickly.</p>
        </section>
        <section>
          <h2>4. Update labels</h2>
          <p>Public event pages show last-checked dates and freshness labels. When a correction changes visitor decisions, the page is updated with a new check date and the official source remains linked.</p>
        </section>
        <section>
          <h2>5. Editorial independence</h2>
          <p>Corrections, source suggestions, ads, sponsorships, and partnerships cannot buy placement or override source labels. We rewrite summaries in our own words and link visitors to the original source for final confirmation.</p>
        </section>
      </article>
    </main>`;
  return layout({
    lang,
    title: `${tr(lang, "correctionsTitle")} - K-Spot Now`,
    description: tr(lang, "correctionsText"),
    body,
    canonicalPath: `/${lang}/corrections/`,
    currentPathBuilder: (code) => `/${code}/corrections/`
  });
}

function staticPage(lang, kind) {
  const titleKey = kind === "cookie-policy" ? "cookieTitle" : `${kind}Title`;
  const title = tr(lang, titleKey);
  const paragraphs = {
    about: [
      "K-Spot Now is a multilingual event and shopping radar for visitors planning Korea trips.",
      "The site prioritizes official sources, clear date ranges, practical travel notes, and honest freshness labels.",
      "K-pop pop-ups and social-only announcements are queued for curation before publication."
    ],
    contact: [
      `For corrections, source suggestions, or partnership inquiries, email ${contactEmail}.`,
      "Please include the official event URL, date range, venue, and language preference."
    ],
    privacy: [
      "This static site does not require user accounts, payments, or login profiles. Basic hosting logs may be processed by the hosting provider for security, abuse prevention, and delivery.",
      "Saved event planning uses browser storage on your own device so you can keep a shortlist of events. K-Spot Now does not receive that saved list unless you email it to us.",
      "If Google AdSense is enabled, Google and its advertising partners may use cookies, local storage, or similar technologies to serve, personalize, limit, and measure ads.",
      "Third-party vendors, including Google, may use advertising cookies based on a visitor's prior visits to this site or other websites. Visitors can manage personalized advertising through Google Ads Settings and browser controls.",
      "For visitors in the EEA, the UK, and Switzerland, advertising consent should be handled through a Google-certified consent management platform when AdSense ads are served.",
      "See the Cookie Policy for more detail about advertising cookies, local browser storage, opt-out choices, and consent updates."
    ],
    "cookie-policy": [
      "K-Spot Now uses a small amount of browser-side storage to make the site useful and to prepare for advertising compliance.",
      "Saved planner storage: when you save an event, the shortlist is stored locally in your browser. It is used only to reopen your own saved event list and calendar download on this device.",
      "Operational data: the hosting and security layer may process basic technical data such as IP address, request path, user agent, and timestamps to deliver pages and prevent abuse.",
      "Advertising cookies: if Google AdSense is enabled, Google and third-party advertising vendors may use cookies or similar technologies to serve ads, personalize ads where allowed, measure ad performance, limit ad frequency, and fight fraud.",
      "Personalized advertising choices: visitors can manage Google personalized ads in Google Ads Settings, use browser cookie controls, or use industry opt-out tools where available.",
      "European consent: for users in the EEA, the UK, and Switzerland, AdSense ads should be paired with a Google-certified consent management platform so visitors can accept, reject, or manage advertising purposes.",
      `Questions or correction requests can be sent to ${contactEmail}.`
    ],
    terms: [
      "Information is provided for travel planning and may change without notice.",
      "Always verify official event pages before visiting, purchasing, reserving, or changing travel plans.",
      "K-Spot Now is not affiliated with the listed brands, artists, venues, or government agencies unless explicitly stated."
    ]
  };
  const body = `
    <main class="page">
      <article class="article-page">
        <h1>${esc(title)}</h1>
        ${paragraphs[kind].map((paragraph) => `<p>${esc(paragraph)}</p>`).join("")}
      </article>
    </main>`;
  return layout({
    lang,
    title: `${title} - K-Spot Now`,
    description: paragraphs[kind][0],
    body,
    canonicalPath: `/${lang}/${kind}/`,
    currentPathBuilder: (code) => `/${code}/${kind}/`
  });
}

async function copyDir(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) await copyDir(from, to);
    else await fs.copyFile(from, to);
  }
}

async function writeHtml(relativePath, html) {
  const file = path.join(dist, relativePath);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, html, "utf8");
}

async function writeText(relativePath, text) {
  const file = path.join(dist, relativePath);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, text, "utf8");
}

async function build() {
  await fs.rm(dist, { recursive: true, force: true });
  await fs.mkdir(dist, { recursive: true });
  await copyDir(path.join(root, "assets"), path.join(dist, "assets"));
  await fs.copyFile(path.join(root, "styles.css"), path.join(dist, "styles.css"));
  await fs.copyFile(path.join(root, "app.js"), path.join(dist, "app.js"));

  await writeHtml("index.html", renderHome("en", "/"));
  await writeText("feed.xml", rssFeed("en", "/feed.xml"));
  await writeText("latest.json", jsonFeed("en", "/latest.json"));
  await writeText("recheck.json", recheckJson());
  await writeText("source-refresh.json", `${JSON.stringify(sourceRefreshPublicSummary() || { generatedAt: null, counts: {}, failedSources: [], highSignalCandidates: [] }, null, 2)}\n`);
  for (const lang of Object.keys(languages)) {
    await writeHtml(`${lang}/index.html`, renderHome(lang));
    await writeText(`${lang}/feed.xml`, rssFeed(lang));
    await writeText(`${lang}/latest.json`, jsonFeed(lang));
    await writeHtml(`${lang}/now/index.html`, renderNow(lang));
    await writeHtml(`${lang}/calendar/index.html`, renderCalendar(lang));
    await writeHtml(`${lang}/planner/index.html`, renderPlanner(lang));
    await writeHtml(`${lang}/guides/index.html`, renderGuides(lang));
    await writeHtml(`${lang}/routes/index.html`, renderRoutes(lang));
    await writeHtml(`${lang}/sources/index.html`, renderSources(lang));
    await writeHtml(`${lang}/watchlist/index.html`, renderWatchlist(lang));
    await writeHtml(`${lang}/freshness/index.html`, renderFreshness(lang));
    await writeHtml(`${lang}/editorial-policy/index.html`, renderEditorialPolicy(lang));
    await writeHtml(`${lang}/corrections/index.html`, renderCorrections(lang));
    await writeHtml(`${lang}/about/index.html`, staticPage(lang, "about"));
    await writeHtml(`${lang}/contact/index.html`, staticPage(lang, "contact"));
    await writeHtml(`${lang}/privacy/index.html`, staticPage(lang, "privacy"));
    await writeHtml(`${lang}/cookie-policy/index.html`, staticPage(lang, "cookie-policy"));
    await writeHtml(`${lang}/terms/index.html`, staticPage(lang, "terms"));
    for (const category of Object.keys(categoryDefinitions)) {
      await writeHtml(`${lang}/categories/${category}/index.html`, renderCategory(lang, category));
    }
    for (const city of citiesWithEvents()) {
      await writeHtml(`${lang}/cities/${citySlug(city)}/index.html`, renderCity(lang, city));
    }
    for (const route of routes) {
      await writeHtml(`${lang}/routes/${route.slug}.html`, renderRoute(route, lang));
    }
    for (const event of events) {
      await writeHtml(`${lang}/events/${event.slug}.html`, renderEvent(event, lang));
    }
    for (const guide of guides) {
      await writeHtml(`${lang}/guides/${guide.slug}.html`, renderGuide(guide, lang));
    }
  }

  await fs.writeFile(path.join(dist, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${siteUrl}/sitemap.xml\n`, "utf8");
  await fs.writeFile(path.join(dist, "_headers"), headers(), "utf8");
  if (/^pub-\d{16}$/.test(adsensePublisherId)) {
    await fs.writeFile(path.join(dist, "ads.txt"), `google.com, ${adsensePublisherId}, DIRECT, f08c47fec0942fa0\n`, "utf8");
  } else {
    await fs.writeFile(path.join(dist, "ads.txt.example"), "google.com, pub-0000000000000000, DIRECT, f08c47fec0942fa0\n", "utf8");
  }
  await fs.writeFile(path.join(dist, "sitemap.xml"), sitemap(), "utf8");
  await fs.writeFile(path.join(dist, "events.ics"), ics(), "utf8");
  for (const event of events) {
    await writeText(`events/${event.slug}.ics`, singleEventIcs(event));
  }
}

function headers() {
  return `/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  X-Frame-Options: SAMEORIGIN
  Permissions-Policy: camera=(), microphone=(), geolocation=()

/assets/*
  Cache-Control: public, max-age=31536000, immutable

/*.css
  Cache-Control: public, max-age=3600

/*.js
  Cache-Control: public, max-age=3600

/sitemap.xml
  Content-Type: application/xml; charset=utf-8
  Cache-Control: public, max-age=3600

/feed.xml
  Content-Type: application/rss+xml; charset=utf-8
  Cache-Control: public, max-age=1800

/*/feed.xml
  Content-Type: application/rss+xml; charset=utf-8
  Cache-Control: public, max-age=1800

/*.ics
  Content-Type: text/calendar; charset=utf-8
  Cache-Control: public, max-age=1800

/events/*.ics
  Content-Type: text/calendar; charset=utf-8
  Cache-Control: public, max-age=1800

/latest.json
  Content-Type: application/feed+json; charset=utf-8
  Cache-Control: public, max-age=1800

/recheck.json
  Content-Type: application/json; charset=utf-8
  Cache-Control: public, max-age=900

/source-refresh.json
  Content-Type: application/json; charset=utf-8
  Cache-Control: public, max-age=1800

/*/latest.json
  Content-Type: application/feed+json; charset=utf-8
  Cache-Control: public, max-age=1800
`;
}

function sitemap() {
  const entries = [{ url: "/", lastmod: maxIso(events.map((event) => event.lastChecked)) }];
  for (const lang of Object.keys(languages)) {
    const latestEventCheck = maxIso(events.map((event) => event.lastChecked));
    entries.push(
      { url: `/${lang}/`, lastmod: latestEventCheck },
      { url: `/${lang}/now/`, lastmod: today },
      { url: `/${lang}/calendar/`, lastmod: today },
      { url: `/${lang}/planner/`, lastmod: today },
      { url: `/${lang}/guides/`, lastmod: today },
      { url: `/${lang}/routes/`, lastmod: latestEventCheck },
      { url: `/${lang}/sources/`, lastmod: today },
      { url: `/${lang}/watchlist/`, lastmod: today },
      { url: `/${lang}/freshness/`, lastmod: today },
      { url: `/${lang}/editorial-policy/`, lastmod: today },
      { url: `/${lang}/corrections/`, lastmod: today },
      { url: `/${lang}/about/`, lastmod: today },
      { url: `/${lang}/contact/`, lastmod: today },
      { url: `/${lang}/privacy/`, lastmod: today },
      { url: `/${lang}/cookie-policy/`, lastmod: today },
      { url: `/${lang}/terms/`, lastmod: today }
    );
    for (const category of Object.keys(categoryDefinitions)) {
      const categoryEvents = events.filter((event) => event.category === category);
      entries.push({ url: categoryHref(lang, category), lastmod: maxIso(categoryEvents.map((event) => event.lastChecked), latestEventCheck) });
    }
    for (const city of citiesWithEvents()) {
      const cityEvents = events.filter((event) => event.city === city);
      entries.push({ url: cityHref(lang, city), lastmod: maxIso(cityEvents.map((event) => event.lastChecked), latestEventCheck) });
    }
    for (const route of routes) {
      const routeEvents = eventsForRoute(route);
      entries.push({ url: routeHref(lang, route), lastmod: maxIso(routeEvents.map((event) => event.lastChecked), latestEventCheck) });
    }
    for (const event of events) {
      entries.push({
        url: `/${lang}/events/${event.slug}.html`,
        lastmod: event.lastChecked || latestEventCheck,
        image: {
          loc: absoluteUrl(`/${event.thumbnail}`),
          title: local(event.title, "en"),
          caption: local(event.summary, "en")
        }
      });
    }
    for (const guide of guides) entries.push({ url: `/${lang}/guides/${guide.slug}.html`, lastmod: today });
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${entries.map(sitemapEntryXml).join("\n")}\n</urlset>\n`;
}

function sitemapEntryXml(entry) {
  const image = entry.image ? `<image:image><image:loc>${xmlEsc(entry.image.loc)}</image:loc><image:title>${xmlEsc(entry.image.title)}</image:title><image:caption>${xmlEsc(entry.image.caption)}</image:caption></image:image>` : "";
  return `  <url><loc>${xmlEsc(`${siteUrl}${entry.url}`)}</loc><lastmod>${xmlEsc(entry.lastmod)}</lastmod>${image}</url>`;
}

function icsDate(iso, addOneDay = false) {
  const date = new Date(`${iso}T00:00:00Z`);
  if (addOneDay) date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10).replaceAll("-", "");
}

function icsEscape(value) {
  return String(value ?? "")
    .replaceAll("\\", "\\\\")
    .replaceAll(";", "\\;")
    .replaceAll(",", "\\,")
    .replace(/\r?\n/g, "\\n");
}

function foldIcsLine(line) {
  const chunks = [];
  let remaining = line;
  while (remaining.length > 72) {
    chunks.push(remaining.slice(0, 72));
    remaining = ` ${remaining.slice(72)}`;
  }
  chunks.push(remaining);
  return chunks.join("\r\n");
}

function eventIcsLines(event, stamp = `${today.replaceAll("-", "")}T000000Z`) {
  return [
    "BEGIN:VEVENT",
    `UID:${event.slug}@kspotnow`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${icsDate(event.startDate)}`,
    `DTEND;VALUE=DATE:${icsDate(event.endDate, true)}`,
    `SUMMARY:${icsEscape(local(event.title, "en"))}`,
    `DESCRIPTION:${icsEscape(`${local(event.summary, "en")} Official source: ${event.sourceUrl}`)}`,
    `LOCATION:${icsEscape(`${event.venue}, ${event.city}`)}`,
    `URL:${event.sourceUrl}`,
    "END:VEVENT"
  ];
}

function calendarIcs(calendarName, calendarEvents) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//K-Spot Now//Events//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${icsEscape(calendarName)}`
  ];

  for (const event of calendarEvents) {
    lines.push(...eventIcsLines(event));
  }

  lines.push("END:VCALENDAR");
  return `${lines.map(foldIcsLine).join("\r\n")}\r\n`;
}

function ics() {
  return calendarIcs("K-Spot Now Events", events);
}

function singleEventIcs(event) {
  return calendarIcs(`K-Spot Now - ${local(event.title, "en")}`, [event]);
}

await build();
console.log(`Built ${events.length} events, ${guides.length} guides, ${Object.keys(languages).length} languages into ${dist}`);
