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
const sourceRefreshSummary = await latestSourceRefreshSummary();

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

async function latestSourceRefreshSummary() {
  const snapshotFile = path.join(root, "data", "source-refresh-summary.json");
  const data = await fs.readFile(snapshotFile, "utf8").then(JSON.parse).catch(() => null);
  if (data) return { fileName: "source-refresh-summary.json", data };

  return latestFeedJson(/^source-refresh-summary-\d{4}-\d{2}-\d{2}\.json$/);
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
    campaignChecksTitle: "Campaign and booking checks",
    campaignNoFixedVenue: "No fixed event venue",
    campaignMapSub: "Confirm the eligible region, then search the Korean name of your booked lodging.",
    campaignMapNote: "Nationwide benefits can depend on coupon inventory, partner OTA rules, and the actual lodging region. Use the official campaign page first, then search the lodging's Korean place name.",
    officialCampaign: "Official campaign",
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
    verification: "Verification",
    dateBasis: "Date basis",
    verificationOfficial: "Official source",
    verificationOfficialArchive: "Official archive",
    verificationOfficialListing: "Official listing",
    verificationOfficialPrefix: "Official",
    collectionOfficialPageReview: "Official page review",
    collectionOfficialPageMonitor: "Official page monitor",
    collectionOfficialApi: "Official API",
    collectionOfficialPage: "Official page",
    editorialTitle: "Editorial Policy",
    editorialText: "How K-Spot Now collects, reviews, translates, and publishes event information.",
    advertisingTitle: "Advertising Policy",
    advertisingText: "How K-Spot Now keeps ads, sponsorship, source selection, and visitor guidance separated.",
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
    campaignChecksTitle: "Campaign and booking checks",
    campaignNoFixedVenue: "No fixed event venue",
    campaignMapSub: "Confirm the eligible region, then search the Korean name of your booked lodging.",
    campaignMapNote: "Nationwide benefits can depend on coupon inventory, partner OTA rules, and the actual lodging region. Use the official campaign page first, then search the lodging's Korean place name.",
    officialCampaign: "Official campaign",
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
    verification: "Verification",
    dateBasis: "Date basis",
    verificationOfficial: "Official source",
    verificationOfficialArchive: "Official archive",
    verificationOfficialListing: "Official listing",
    verificationOfficialPrefix: "Official",
    collectionOfficialPageReview: "Official page review",
    collectionOfficialPageMonitor: "Official page monitor",
    collectionOfficialApi: "Official API",
    collectionOfficialPage: "Official page",
    editorialTitle: "Editorial Policy",
    editorialText: "How K-Spot Now collects, reviews, translates, and publishes event information.",
    advertisingTitle: "Advertising Policy",
    advertisingText: "How K-Spot Now keeps ads, sponsorship, source selection, and visitor guidance separated.",
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
    sourceRefreshTitle: "Última revisión de fuentes",
    sourceRefreshText: "Resumen público de la última revisión de fuentes oficiales.",
    sourceRefreshNoData: "Todavía no se ha generado un resumen de revisión de fuentes.",
    sourceRefreshJson: "Abrir JSON público",
    sourceRefreshAttention: "Fuentes que requieren atención",
    sourceRefreshCandidates: "Páginas candidatas destacadas",
    sourceRefreshDraftSources: "Principales fuentes candidatas",
    sourceRefreshRule: "Las candidatas no se publican directamente. Cada elemento necesita revisión de fecha oficial, lugar, elegibilidad, inventario y resumen original.",
    navWatchlist: "Monitor",
    watchlistTitle: "Monitor oficial de fuentes",
    watchlistText: "Fuentes oficiales, páginas de listados, ticketing y colas de curación revisadas antes de publicar nuevas páginas.",
    freshnessTitle: "Registro de actualización",
    freshnessText: "Cada ficha muestra cuándo se revisó y qué fuente oficial se usó.",
    editorialTitle: "Política editorial",
    editorialText: "Cómo K-Spot Now recopila, revisa, traduce y publica información de eventos.",
    advertisingTitle: "Politica de publicidad",
    advertisingText: "Como K-Spot Now separa anuncios, patrocinios, seleccion de fuentes y guia para visitantes.",
    correctionsTitle: "Correcciones y actualizaciones",
    correctionsText: "Cómo revisamos y corregimos detalles oficiales que cambian rápido.",
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
    sourceWarning: "Los detalles oficiales pueden cambiar. Confirma siempre reglas, ubicación, elegibilidad e inventario.",
    mapLinksTitle: "Mapa y transporte",
    campaignChecksTitle: "Campaña y reserva",
    campaignNoFixedVenue: "Sin lugar fijo",
    campaignMapSub: "Confirma la región elegible y busca el nombre coreano del alojamiento.",
    campaignMapNote: "Los beneficios nacionales pueden depender de cupones, reglas de socios y región real del alojamiento. Usa primero la página oficial.",
    officialCampaign: "Campaña oficial",
    googleMap: "Google Maps",
    naverMap: "Naver Map",
    kakaoMap: "Kakao Map",
    mapNote: "Usa el nombre coreano del lugar para obtener mejores resultados.",
    calendarWeather: "Clima",
    packHint: "Llevar",
    forecastStripTitle: "Pronóstico diario KMA",
    forecastMorning: "AM",
    forecastAfternoon: "PM",
    forecastLowHigh: "Mín / Máx",
    forecastRainChance: "Lluvia",
    forecastNoData: "Sin datos del periodo",
    todayLabel: "Hoy",
    tomorrowLabel: "Mañana",
    relatedEventsTitle: "Eventos cercanos y similares",
    savedPlannerTitle: "Plan guardado de Corea",
    savedPlannerEmpty: "Guarda eventos para comparar fechas, ciudades y enlaces oficiales.",
    savedPlannerCountOne: "1 evento guardado",
    savedPlannerCount: "{count} eventos guardados",
    openPlanner: "Abrir planificador",
    clearSaved: "Borrar guardados",
    removeSaved: "Quitar",
    openSavedEvent: "Abrir",
    plannerTitle: "Planificador de eventos guardados",
    plannerText: "Compara eventos guardados en este dispositivo y abre fuentes oficiales antes de reservar o cambiar planes.",
    plannerEmptyTitle: "Aún no hay eventos guardados",
    plannerEmptyText: "Guarda eventos desde la galería o las páginas de detalle para crear una lista corta.",
    downloadSavedCalendar: "Descargar calendario guardado",
    officialLabel: "Oficial",
    verification: "Verificación",
    dateBasis: "Base de fecha",
    verificationOfficial: "Fuente oficial",
    verificationOfficialArchive: "Archivo oficial",
    verificationOfficialListing: "Listado oficial",
    verificationOfficialPrefix: "Oficial",
    collectionOfficialPageReview: "Revisión de página oficial",
    collectionOfficialPageMonitor: "Monitor de página oficial",
    collectionOfficialApi: "API oficial",
    collectionOfficialPage: "Página oficial"
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
    sourceRefreshTitle: "最新来源复查",
    sourceRefreshText: "来自最新官方来源监控运行的公开运营摘要。",
    sourceRefreshNoData: "尚未生成来源复查摘要。",
    sourceRefreshJson: "打开公开 JSON",
    sourceRefreshAttention: "需要关注的来源",
    sourceRefreshCandidates: "高信号候选页面",
    sourceRefreshDraftSources: "主要候选来源",
    sourceRefreshRule: "候选内容不会直接发布。每一项仍需确认官方日期、地点、资格、库存和原创摘要。",
    navWatchlist: "监控清单",
    watchlistTitle: "官方来源监控清单",
    watchlistText: "发布新页面前会检查的官方来源、列表页、票务入口和审核队列。",
    freshnessTitle: "更新记录",
    freshnessText: "每个条目都会显示最后检查时间和使用的官方来源。",
    editorialTitle: "编辑政策",
    editorialText: "K-Spot Now如何收集、审核、翻译并发布活动信息。",
    correctionsTitle: "更正与更新",
    correctionsText: "我们如何复核并修正变化较快的官方信息。",
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
    sourceWarning: "官方信息可能变化。请务必确认最新规则、地点、资格和库存。",
    mapLinksTitle: "地图与交通确认",
    campaignChecksTitle: "活动与预订确认",
    campaignNoFixedVenue: "无固定活动地点",
    campaignMapSub: "确认适用地区后，搜索住宿的韩文名称。",
    campaignMapNote: "全国优惠可能受优惠券库存、合作平台规则和实际住宿地区影响。请先查看官方活动页面。",
    officialCampaign: "官方活动",
    googleMap: "Google Maps",
    naverMap: "Naver 地图",
    kakaoMap: "Kakao 地图",
    mapNote: "使用韩文地点名称通常能得到最准确的地图结果。",
    calendarWeather: "天气规划",
    packHint: "携带",
    forecastStripTitle: "KMA 每日天气预报",
    forecastMorning: "上午",
    forecastAfternoon: "下午",
    forecastLowHigh: "最低 / 最高",
    forecastRainChance: "降雨",
    forecastNoData: "无期间数据",
    todayLabel: "今天",
    tomorrowLabel: "明天",
    relatedEventsTitle: "附近和相似活动",
    savedPlannerTitle: "已保存的韩国计划",
    savedPlannerEmpty: "保存活动以比较日期、城市和官方链接。",
    savedPlannerCountOne: "已保存 1 个活动",
    savedPlannerCount: "已保存 {count} 个活动",
    openPlanner: "打开计划器",
    clearSaved: "清除保存",
    removeSaved: "移除",
    openSavedEvent: "打开",
    plannerTitle: "已保存活动计划器",
    plannerText: "比较此设备上保存的韩国活动，并在预订或更改行程前打开官方来源。",
    plannerEmptyTitle: "尚未保存活动",
    plannerEmptyText: "从活动列表或详情页保存活动，建立韩国行程候选清单。",
    downloadSavedCalendar: "下载已保存日历",
    officialLabel: "官方",
    verification: "验证",
    dateBasis: "日期依据",
    verificationOfficial: "官方来源",
    verificationOfficialArchive: "官方归档",
    verificationOfficialListing: "官方列表",
    verificationOfficialPrefix: "官方",
    collectionOfficialPageReview: "官方页面复核",
    collectionOfficialPageMonitor: "官方页面监控",
    collectionOfficialApi: "官方 API",
    collectionOfficialPage: "官方页面"
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
    sourceRefreshTitle: "Última revisão de fontes",
    sourceRefreshText: "Resumo público da última rodada de monitoramento de fontes oficiais.",
    sourceRefreshNoData: "Ainda não há resumo de revisão de fontes.",
    sourceRefreshJson: "Abrir JSON público",
    sourceRefreshAttention: "Fontes que precisam de atenção",
    sourceRefreshCandidates: "Páginas candidatas fortes",
    sourceRefreshDraftSources: "Principais fontes candidatas",
    sourceRefreshRule: "Candidatos não são publicados diretamente. Cada item ainda precisa de data oficial, local, elegibilidade, estoque e resumo original revisados.",
    navWatchlist: "Monitor",
    watchlistTitle: "Monitor oficial de fontes",
    watchlistText: "Fontes oficiais, páginas de listagem, ticketing e filas de curadoria revisadas antes de publicar novas páginas.",
    freshnessTitle: "Registro de atualização",
    freshnessText: "Cada item mostra quando foi checado e qual fonte oficial foi usada.",
    editorialTitle: "Política editorial",
    editorialText: "Como o K-Spot Now coleta, revisa, traduz e publica informações de eventos.",
    advertisingTitle: "Politica de publicidade",
    advertisingText: "Como o K-Spot Now separa anuncios, patrocinios, selecao de fontes e orientacao ao visitante.",
    correctionsTitle: "Correções e atualizações",
    correctionsText: "Como revisamos e corrigimos detalhes oficiais que mudam rapidamente.",
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
    sourceWarning: "Detalhes oficiais podem mudar. Confirme sempre regras, local, elegibilidade e estoque.",
    mapLinksTitle: "Mapa e transporte",
    campaignChecksTitle: "Campanha e reserva",
    campaignNoFixedVenue: "Sem local fixo",
    campaignMapSub: "Confirme a região elegível e busque o nome coreano da hospedagem.",
    campaignMapNote: "Benefícios nacionais podem depender de cupons, regras de parceiros e região real da hospedagem. Use primeiro a página oficial.",
    officialCampaign: "Campanha oficial",
    googleMap: "Google Maps",
    naverMap: "Naver Map",
    kakaoMap: "Kakao Map",
    mapNote: "Use o nome coreano do local para obter o resultado mais preciso.",
    calendarWeather: "Clima",
    packHint: "Levar",
    forecastStripTitle: "Previsão diária KMA",
    forecastMorning: "AM",
    forecastAfternoon: "PM",
    forecastLowHigh: "Mín / Máx",
    forecastRainChance: "Chuva",
    forecastNoData: "Sem dados do período",
    todayLabel: "Hoje",
    tomorrowLabel: "Amanhã",
    relatedEventsTitle: "Eventos próximos e similares",
    savedPlannerTitle: "Plano salvo da Coreia",
    savedPlannerEmpty: "Salve eventos para comparar datas, cidades e links oficiais.",
    savedPlannerCountOne: "1 evento salvo",
    savedPlannerCount: "{count} eventos salvos",
    openPlanner: "Abrir planejador",
    clearSaved: "Limpar salvos",
    removeSaved: "Remover",
    openSavedEvent: "Abrir",
    plannerTitle: "Planejador de eventos salvos",
    plannerText: "Compare eventos salvos neste dispositivo e abra fontes oficiais antes de reservar ou mudar planos.",
    plannerEmptyTitle: "Nenhum evento salvo ainda",
    plannerEmptyText: "Salve eventos da galeria ou das páginas de detalhe para montar uma lista curta.",
    downloadSavedCalendar: "Baixar calendário salvo",
    officialLabel: "Oficial",
    verification: "Verificação",
    dateBasis: "Base da data",
    verificationOfficial: "Fonte oficial",
    verificationOfficialArchive: "Arquivo oficial",
    verificationOfficialListing: "Listagem oficial",
    verificationOfficialPrefix: "Oficial",
    collectionOfficialPageReview: "Revisão de página oficial",
    collectionOfficialPageMonitor: "Monitor de página oficial",
    collectionOfficialApi: "API oficial",
    collectionOfficialPage: "Página oficial"
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
    sourceRefreshTitle: "Последняя проверка источников",
    sourceRefreshText: "Публичный операционный срез последнего мониторинга официальных источников.",
    sourceRefreshNoData: "Сводка проверки источников еще не создана.",
    sourceRefreshJson: "Открыть публичный JSON",
    sourceRefreshAttention: "Источники, требующие внимания",
    sourceRefreshCandidates: "Сильные страницы-кандидаты",
    sourceRefreshDraftSources: "Главные источники кандидатов",
    sourceRefreshRule: "Кандидаты не публикуются напрямую. Для каждого пункта нужны проверка официальной даты, места, условий, наличия и оригинального краткого описания.",
    navWatchlist: "Мониторинг",
    watchlistTitle: "Мониторинг официальных источников",
    watchlistText: "Официальные источники, страницы списков, ticketing и очереди проверки перед публикацией новых страниц.",
    freshnessTitle: "Журнал обновлений",
    freshnessText: "Каждая карточка показывает дату проверки и официальный источник.",
    editorialTitle: "Редакционная политика",
    editorialText: "Как K-Spot Now собирает, проверяет, переводит и публикует информацию о событиях.",
    correctionsTitle: "Исправления и обновления",
    correctionsText: "Как мы проверяем и исправляем официальные детали, которые быстро меняются.",
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
    sourceWarning: "Официальные детали могут измениться. Всегда проверяйте правила, место, доступность и наличие.",
    mapLinksTitle: "Карта и транспорт",
    campaignChecksTitle: "Кампания и бронирование",
    campaignNoFixedVenue: "Без фиксированного места",
    campaignMapSub: "Проверьте подходящий регион и ищите корейское название жилья.",
    campaignMapNote: "Национальные выгоды зависят от купонов, правил партнеров и реального региона жилья. Сначала используйте официальную страницу.",
    officialCampaign: "Официальная кампания",
    googleMap: "Google Maps",
    naverMap: "Naver Map",
    kakaoMap: "Kakao Map",
    mapNote: "Используйте корейское название места для самого точного результата.",
    calendarWeather: "Погода",
    packHint: "Взять",
    forecastStripTitle: "Прогноз KMA по дням",
    forecastMorning: "Утро",
    forecastAfternoon: "День",
    forecastLowHigh: "Мин / Макс",
    forecastRainChance: "Дождь",
    forecastNoData: "Нет данных за период",
    todayLabel: "Сегодня",
    tomorrowLabel: "Завтра",
    relatedEventsTitle: "Похожие события рядом",
    savedPlannerTitle: "Сохраненный план по Корее",
    savedPlannerEmpty: "Сохраняйте события, чтобы сравнить даты, города и официальные ссылки.",
    savedPlannerCountOne: "1 сохраненное событие",
    savedPlannerCount: "{count} сохраненных событий",
    openPlanner: "Открыть план",
    clearSaved: "Очистить",
    removeSaved: "Удалить",
    openSavedEvent: "Открыть",
    plannerTitle: "План сохраненных событий",
    plannerText: "Сравните сохраненные события на этом устройстве и откройте официальные источники перед бронированием или изменением планов.",
    plannerEmptyTitle: "Пока нет сохраненных событий",
    plannerEmptyText: "Сохраняйте события из галереи или страниц деталей, чтобы собрать короткий список.",
    downloadSavedCalendar: "Скачать сохраненный календарь",
    officialLabel: "Официально",
    verification: "Проверка",
    dateBasis: "Основа даты",
    verificationOfficial: "Официальный источник",
    verificationOfficialArchive: "Официальный архив",
    verificationOfficialListing: "Официальный список",
    verificationOfficialPrefix: "Официально",
    collectionOfficialPageReview: "Проверка официальной страницы",
    collectionOfficialPageMonitor: "Монитор официальной страницы",
    collectionOfficialApi: "Официальный API",
    collectionOfficialPage: "Официальная страница"
  }
};

languages.ja = { name: "日本語", locale: "ja-JP" };
languages.fr = { name: "Francais", locale: "fr-FR" };
languages.de = { name: "Deutsch", locale: "de-DE" };

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
  verification: "確認",
  dateBasis: "日付の根拠",
  verificationOfficial: "公式情報源",
  verificationOfficialArchive: "公式アーカイブ",
  verificationOfficialListing: "公式リスト",
  verificationOfficialPrefix: "公式",
  collectionOfficialPageReview: "公式ページ確認",
  collectionOfficialPageMonitor: "公式ページ監視",
  collectionOfficialApi: "公式API",
  collectionOfficialPage: "公式ページ",
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

dict.fr = {
  ...dict.en,
  navEvents: "Evenements",
  navNow: "Maintenant",
  navCalendar: "Calendrier",
  navGuides: "Guides",
  navPlanner: "Planificateur",
  navSources: "Sources",
  navAbout: "A propos",
  navWatchlist: "Veille",
  heroEyebrow: "Evenements, pop-ups et offres en Coree pour les visiteurs",
  heroTitle: siteName,
  heroText: "Verifications de sources officielles pour festivals, pop-ups K-pop, offres beaute, duty-free, grands magasins, meteo et notes de carte utiles aux visiteurs.",
  ctaEvents: "Voir les evenements",
  ctaCalendar: "Ouvrir le calendrier",
  liveNow: "En cours",
  upcoming: "A venir",
  archive: "Archive",
  official: "Source officielle",
  lastChecked: "Derniere verification",
  collectionMode: "Collecte",
  period: "Periode",
  location: "Lieu",
  venue: "Adresse",
  mapLinksTitle: "Cartes et transports",
  campaignChecksTitle: "Verification de campagne et reservation",
  campaignNoFixedVenue: "Pas de lieu fixe",
  campaignMapSub: "Confirmez la zone eligible, puis cherchez le nom coreen de votre hebergement.",
  campaignMapNote: "Les avantages nationaux dependent des coupons, des regles OTA partenaires et de la region de l'hebergement. Verifiez d'abord la page officielle.",
  officialCampaign: "Campagne officielle",
  mapNote: "Utilisez le nom coreen du lieu pour obtenir le meilleur resultat de carte.",
  weatherPlan: "Plan meteo",
  travelIdeas: "Idees de visite",
  routeIdeas: "Itineraires proches",
  routePages: "Itineraires",
  categoryPages: "Par theme",
  cityPages: "Par ville",
  browseDirectory: "Parcourir themes et lieux",
  browseTypeTitle: "Types d'evenements",
  browseTypeText: "Commencez par festivals, pop-ups K-pop, beaute, duty-free, shopping ou avantages visiteurs.",
  browsePlaceTitle: "Lieux",
  browsePlaceText: "Les pages ville et national sont separees des themes pour parcourir par destination.",
  verifyBefore: "Verifiez la source officielle avant de vous deplacer.",
  relatedEventsTitle: "Evenements proches et similaires",
  relatedGuides: "Guides associes",
  category: "Categorie",
  allCities: "Toutes les villes",
  all: "Tous",
  festival: "Festivals",
  kpop: "Pop-ups K-pop",
  beauty: "Offres beaute",
  dutyfree: "Duty free",
  department: "Grands magasins",
  shopping: "Shopping",
  benefits: "Avantages voyage",
  calendarTitle: "Calendrier des evenements",
  calendarText: "Les dates sont affichees comme plages de planification. Les offres peuvent fermer tot; chaque page renvoie vers la source officielle.",
  downloadCalendar: "Telecharger le fichier calendrier",
  calendarWeather: "Plan meteo",
  packHint: "A emporter",
  forecastStripTitle: "Previsions KMA par jour",
  forecastMorning: "Matin",
  forecastAfternoon: "Apres-midi",
  forecastLowHigh: "Min / Max",
  forecastRainChance: "Pluie",
  forecastNoData: "Aucune donnee",
  todayLabel: "Aujourd'hui",
  tomorrowLabel: "Demain",
  sourcesTitle: "Systeme de sources",
  sourcesText: "Le site separe API officielles, veille de pages officielles et files de curation K-pop pour proteger la fraicheur, les voyageurs et AdSense.",
  sourceRefreshTitle: "Derniere actualisation des sources",
  sourceRefreshText: "Instantane public du dernier controle des sources officielles.",
  sourceRefreshNoData: "Aucun resume de sources n'a encore ete genere.",
  sourceRefreshJson: "Ouvrir le JSON public",
  sourceRefreshAttention: "Sources a surveiller",
  sourceRefreshCandidates: "Pages candidates fortes",
  sourceRefreshDraftSources: "Principales sources candidates",
  sourceRefreshRule: "Les candidats ne sont pas publies directement. Chaque element demande encore verification officielle des dates, lieu, eligibilite, stock et resume original.",
  watchlistTitle: "Liste de veille officielle",
  watchlistText: "Sources officielles, pages de listes, racines de billetterie et files de curation verifiees avant publication.",
  freshnessTitle: "Journal de fraicheur",
  freshnessText: "Chaque fiche indique la derniere verification et la source officielle utilisee.",
  freshness: "Fraicheur",
  freshnessFresh: "Frais",
  freshnessCurrent: "Verifie recemment",
  freshnessSoon: "A reverifier bientot",
  freshnessStale: "Verification officielle requise",
  freshnessArchive: "Verification archive",
  checkedToday: "verifie aujourd'hui",
  checkedYesterday: "verifie hier",
  daysAgo: "jours",
  nowTitle: "A verifier maintenant",
  nowText: "Evenements en cours, bientot termines, recemment verifies et de cette semaine en Coree.",
  nowDashboard: "Instantane",
  monitoredSources: "Sources suivies",
  activeQueue: "File de revue active",
  fastMovingTopics: "Sujets rapides",
  latestCheckedGallery: "Dernieres verifications",
  latestCheckedText: "Derniers controles officiels sur evenements, shopping, duty-free et pop-ups.",
  rssFeedLabel: "Flux RSS",
  jsonFeedLabel: "Flux JSON",
  freshnessLogLabel: "Journal de fraicheur",
  recheckQueueTitle: "File de reverification officielle",
  recheckQueueText: "Pages en cours ou a venir qui doivent etre rouvertes bientot sur la source officielle.",
  recheckDueNow: "a reverifier",
  recheckDueToday: "aujourd'hui",
  recheckDueTomorrow: "demain",
  recheckDueInDays: "dans {count} jours",
  sourceLink: "Source",
  livePanel: "En cours",
  endingSoon: "Bientot termine",
  newlyChecked: "Recemment verifie",
  thisWeek: "Cette semaine",
  daysLeft: "jours restants",
  startsIn: "commence dans",
  noItemsYet: "Aucun element correspondant. Consultez le calendrier ou la veille des sources.",
  searchEvents: "Recherche",
  searchPlaceholder: "Titre, ville, lieu, source",
  statusFilter: "Statut",
  allStatuses: "Tous les statuts",
  clearFilters: "Reinitialiser",
  resultCountOneTemplate: "1 evenement affiche",
  resultCountTemplate: "{count} evenements affiches",
  saveEvent: "Enregistrer",
  savedEvent: "Enregistre",
  savedPlannerTitle: "Plan Coree enregistre",
  savedPlannerEmpty: "Enregistrez des evenements pour comparer dates, villes et liens officiels.",
  savedPlannerCountOne: "1 evenement enregistre",
  savedPlannerCount: "{count} evenements enregistres",
  openPlanner: "Ouvrir le plan",
  clearSaved: "Effacer",
  removeSaved: "Retirer",
  openSavedEvent: "Ouvrir",
  plannerTitle: "Planificateur d'evenements",
  plannerText: "Comparez les evenements enregistres sur cet appareil, puis ouvrez les sources officielles avant toute reservation ou changement de plan.",
  plannerEmptyTitle: "Aucun evenement enregistre",
  plannerEmptyText: "Enregistrez des evenements depuis la galerie ou les pages detail pour creer une courte selection de voyage.",
  downloadSavedCalendar: "Telecharger le calendrier enregistre",
  officialLabel: "Officiel",
  editorialTitle: "Politique editoriale",
  editorialText: "Comment K-Spot Now collecte, verifie, traduit et publie les informations d'evenements.",
  advertisingTitle: "Politique publicitaire",
  advertisingText: "Comment K-Spot Now separe publicites, partenariats, selection des sources et conseils visiteurs.",
  correctionsTitle: "Corrections et mises a jour",
  correctionsText: "Comment signaler des informations anciennes ou incorrectes.",
  guidesTitle: "Guides visiteurs",
  aboutTitle: "A propos de K-Spot Now",
  contactTitle: "Contact",
  privacyTitle: "Politique de confidentialite",
  cookieTitle: "Politique cookies",
  termsTitle: "Conditions",
  statusLive: "En cours",
  statusUpcoming: "A venir",
  statusEnded: "Termine",
  readDetails: "Details",
  officialVisitorInfo: "Infos visiteurs officielles",
  venueScheduleTitle: "Horaires du lieu",
  officialHighlightsTitle: "Points forts officiels",
  eventWebsite: "Site de l'evenement",
  eventTheme: "Theme",
  hoursOfOperation: "Horaires",
  programHours: "Horaires du programme",
  websiteLanguages: "Langues du site",
  address: "Adresse",
  transportation: "Transport",
  parking: "Parking",
  smartGuide: "Guide pratique",
  verification: "Verification",
  dateBasis: "Base de date",
  verificationOfficial: "Source officielle",
  verificationOfficialArchive: "Archive officielle",
  verificationOfficialListing: "Liste officielle",
  verificationOfficialPrefix: "Officiel",
  collectionOfficialPageReview: "Revue de page officielle",
  collectionOfficialPageMonitor: "Veille de page officielle",
  collectionOfficialApi: "API officielle",
  collectionOfficialPage: "Page officielle",
  sourceWarning: "Les details officiels peuvent changer. Confirmez toujours les regles, le lieu, l'eligibilite et le stock."
};

dict.de = {
  ...dict.en,
  navEvents: "Events",
  navNow: "Jetzt",
  navCalendar: "Kalender",
  navGuides: "Guides",
  navPlanner: "Planer",
  navSources: "Quellen",
  navAbout: "Uber uns",
  navWatchlist: "Quellenwatchlist",
  heroEyebrow: "Korea-Events, Pop-ups und Deals fur Besucher",
  heroTitle: siteName,
  heroText: "Live-Prufungen offizieller Quellen fur Festivals, K-pop Pop-ups, Beauty-Deals, Duty-free, Kaufhaus-Events, Wetterplanung und kartenfertige Besuchernotizen.",
  ctaEvents: "Events ansehen",
  ctaCalendar: "Kalender offnen",
  liveNow: "Jetzt live",
  upcoming: "Demnachst",
  archive: "Archiv",
  official: "Offizielle Quelle",
  lastChecked: "Zuletzt gepruft",
  collectionMode: "Sammlung",
  period: "Zeitraum",
  location: "Ort",
  venue: "Veranstaltungsort",
  mapLinksTitle: "Karten und Verkehr",
  campaignChecksTitle: "Kampagnen- und Buchungscheck",
  campaignNoFixedVenue: "Kein fester Veranstaltungsort",
  campaignMapSub: "Prufen Sie die berechtigte Region und suchen Sie dann den koreanischen Namen Ihrer Unterkunft.",
  campaignMapNote: "Landesweite Vorteile hangen von Couponbestand, OTA-Regeln und der Unterkunftsregion ab. Prufen Sie zuerst die offizielle Kampagnenseite.",
  officialCampaign: "Offizielle Kampagne",
  mapNote: "Nutzen Sie den koreanischen Ortsnamen fur genauere Kartenergebnisse.",
  weatherPlan: "Wetterplanung",
  travelIdeas: "Reiseideen",
  routeIdeas: "Routen in der Nahe",
  routePages: "Reiserouten",
  categoryPages: "Nach Thema",
  cityPages: "Nach Stadt",
  browseDirectory: "Eventarten und Orte durchsuchen",
  browseTypeTitle: "Eventarten",
  browseTypeText: "Starten Sie mit Festivals, K-pop Pop-ups, Beauty, Duty-free, Shopping oder Besucherangeboten.",
  browsePlaceTitle: "Orte",
  browsePlaceText: "Stadt- und landesweite Seiten sind von Themen getrennt, damit Besucher nach Ziel scannen konnen.",
  verifyBefore: "Vor dem Besuch auf der offiziellen Quelle prufen.",
  relatedEventsTitle: "Nahe und ahnliche Events",
  relatedGuides: "Verwandte Guides",
  category: "Kategorie",
  allCities: "Alle Stadte",
  all: "Alle",
  festival: "Festivals",
  kpop: "K-pop Pop-ups",
  beauty: "Beauty-Deals",
  dutyfree: "Duty free",
  department: "Kaufhauser",
  shopping: "Shopping",
  benefits: "Reisevorteile",
  calendarTitle: "Eventkalender",
  calendarText: "Daten werden als Planungszeitraume gezeigt. Angebote konnen fruh enden; jede Detailseite verlinkt zur offiziellen Quelle.",
  downloadCalendar: "Kalenderdatei herunterladen",
  calendarWeather: "Wetterplanung",
  packHint: "Einpacken",
  forecastStripTitle: "KMA Tagesprognose",
  forecastMorning: "Vormittag",
  forecastAfternoon: "Nachmittag",
  forecastLowHigh: "Tief / Hoch",
  forecastRainChance: "Regen",
  forecastNoData: "Keine Daten",
  todayLabel: "Heute",
  tomorrowLabel: "Morgen",
  sourcesTitle: "Quellensystem",
  sourcesText: "Die Website trennt offizielle APIs, Monitoring offizieller Seiten und K-pop-Kurationsqueues, damit Inhalte sicherer fur AdSense und Reisende bleiben.",
  sourceRefreshTitle: "Letzte Quellenaktualisierung",
  sourceRefreshText: "Offentlicher Betriebsstand aus dem letzten Monitoringlauf offizieller Quellen.",
  sourceRefreshNoData: "Noch keine Quellenzusammenfassung erzeugt.",
  sourceRefreshJson: "Offentliches JSON offnen",
  sourceRefreshAttention: "Quellen mit Prufbedarf",
  sourceRefreshCandidates: "Starke Kandidatenseiten",
  sourceRefreshDraftSources: "Top-Entwurfsquellen",
  sourceRefreshRule: "Kandidaten werden nicht direkt veroffentlicht. Jedes Element braucht noch offizielle Daten, Ort, Berechtigung, Bestand und Originalzusammenfassung.",
  watchlistTitle: "Offizielle Monitoring-Watchlist",
  watchlistText: "Offizielle Quellen, Listing-Seiten, Ticketing-Roots und Kurationsqueues, die vor neuen offentlichen Eventseiten gepruft werden.",
  freshnessTitle: "Aktualitatslog",
  freshnessText: "Jeder Eintrag zeigt, wann er zuletzt gepruft wurde und welche offizielle Quelle genutzt wurde.",
  freshness: "Aktualitat",
  freshnessFresh: "Frisch",
  freshnessCurrent: "Kurzlich gepruft",
  freshnessSoon: "Bald neu prufen",
  freshnessStale: "Offizielle Neuprufung notig",
  freshnessArchive: "Archivprufung",
  checkedToday: "heute gepruft",
  checkedYesterday: "gestern gepruft",
  daysAgo: "Tage her",
  nowTitle: "Jetzt prufen",
  nowText: "Live, bald endend, neu gepruft und diese Woche: Korea-Events aus offiziellen Quellen.",
  nowDashboard: "Update-Stand",
  monitoredSources: "Beobachtete Quellen",
  activeQueue: "Aktive Prufqueue",
  fastMovingTopics: "Schnelle Themen",
  latestCheckedGallery: "Neueste Prufungen",
  latestCheckedText: "Neueste offizielle Checks zu Events, Shopping-Angeboten, Duty-free-Kampagnen und Pop-up-Hinweisen.",
  rssFeedLabel: "RSS-Feed",
  jsonFeedLabel: "JSON-Feed",
  freshnessLogLabel: "Aktualitatslog",
  recheckQueueTitle: "Offizielle Neuprufqueue",
  recheckQueueText: "Schnell wechselnde Live- oder kommende Seiten, die bald auf der offiziellen Quelle neu geoffnet werden sollten.",
  recheckDueNow: "jetzt neu prufen",
  recheckDueToday: "heute fallig",
  recheckDueTomorrow: "morgen fallig",
  recheckDueInDays: "in {count} Tagen fallig",
  sourceLink: "Quelle",
  livePanel: "Jetzt live",
  endingSoon: "Endet bald",
  newlyChecked: "Neu gepruft",
  thisWeek: "Diese Woche",
  daysLeft: "Tage ubrig",
  startsIn: "beginnt in",
  noItemsYet: "Keine passenden Eintrage. Kalender oder Quellenwatchlist prufen.",
  searchEvents: "Suche",
  searchPlaceholder: "Titel, Stadt, Ort, Quelle",
  statusFilter: "Status",
  allStatuses: "Alle Status",
  clearFilters: "Zurucksetzen",
  resultCountOneTemplate: "1 Event angezeigt",
  resultCountTemplate: "{count} Events angezeigt",
  saveEvent: "Speichern",
  savedEvent: "Gespeichert",
  savedPlannerTitle: "Gespeicherter Korea-Plan",
  savedPlannerEmpty: "Events speichern, um Daten, Stadte und offizielle Links zu vergleichen.",
  savedPlannerCountOne: "1 gespeichertes Event",
  savedPlannerCount: "{count} gespeicherte Events",
  openPlanner: "Planer offnen",
  clearSaved: "Loschen",
  removeSaved: "Entfernen",
  openSavedEvent: "Offnen",
  plannerTitle: "Gespeicherter Eventplaner",
  plannerText: "Vergleichen Sie gespeicherte Korea-Events auf diesem Gerat und offnen Sie vor Buchungen oder Plananderungen offizielle Quellen.",
  plannerEmptyTitle: "Noch keine gespeicherten Events",
  plannerEmptyText: "Speichern Sie Events aus Galerie oder Detailseiten, um eine kurze Korea-Reiseliste zu bauen.",
  downloadSavedCalendar: "Gespeicherten Kalender herunterladen",
  officialLabel: "Offiziell",
  editorialTitle: "Redaktionsrichtlinie",
  editorialText: "Wie K-Spot Now Eventinformationen sammelt, pruft, ubersetzt und veroffentlicht.",
  advertisingTitle: "Werberichtlinie",
  advertisingText: "Wie K-Spot Now Anzeigen, Partnerschaften, Quellenauswahl und Besucherhinweise trennt.",
  correctionsTitle: "Korrekturen und Updates",
  correctionsText: "Wie Besucher, Veranstalter und Marken veraltete oder falsche Details melden konnen.",
  guidesTitle: "Besucherguides",
  aboutTitle: "Uber K-Spot Now",
  contactTitle: "Kontakt",
  privacyTitle: "Datenschutz",
  cookieTitle: "Cookie-Richtlinie",
  termsTitle: "Bedingungen",
  statusLive: "Live",
  statusUpcoming: "Demnachst",
  statusEnded: "Beendet",
  readDetails: "Details",
  officialVisitorInfo: "Offizielle Besucherinfo",
  venueScheduleTitle: "Ort und Zeitplan",
  officialHighlightsTitle: "Offizielle Highlights",
  eventWebsite: "Eventwebsite",
  eventTheme: "Thema",
  hoursOfOperation: "Offnungszeiten",
  programHours: "Programmzeiten",
  websiteLanguages: "Website-Sprachen",
  address: "Adresse",
  transportation: "Anfahrt",
  parking: "Parken",
  smartGuide: "Praktischer Guide",
  verification: "Verifizierung",
  dateBasis: "Datengrundlage",
  verificationOfficial: "Offizielle Quelle",
  verificationOfficialArchive: "Offizielles Archiv",
  verificationOfficialListing: "Offizielles Listing",
  verificationOfficialPrefix: "Offiziell",
  collectionOfficialPageReview: "Prufung offizieller Seite",
  collectionOfficialPageMonitor: "Monitoring offizieller Seite",
  collectionOfficialApi: "Offizielle API",
  collectionOfficialPage: "Offizielle Seite",
  sourceWarning: "Offizielle Details konnen sich andern. Prufen Sie immer aktuelle Regeln, Ort, Berechtigung und Bestand."
};

const visitorUiOverrides = {
  en: {
    skipToMain: "Skip to main content",
    highlightLabel: "Official highlight"
  },
  es: {
    skipToMain: "Saltar al contenido principal",
    navNow: "Ahora",
    navPlanner: "Planificador",
    saveEvent: "Guardar",
    savedEvent: "Guardado",
    freshness: "Actualizacion",
    freshnessFresh: "Actualizado",
    freshnessCurrent: "Revisado recientemente",
    checkedToday: "revisado hoy",
    checkedYesterday: "revisado ayer",
    highlightLabel: "Destacado oficial"
  },
  zh: {
    skipToMain: "跳到主要内容",
    navEvents: "活动",
    navNow: "当前",
    navCalendar: "日历",
    navPlanner: "保存计划",
    navGuides: "指南",
    navAbout: "关于",
    routePages: "旅行路线",
    ctaEvents: "浏览活动",
    ctaCalendar: "打开日历",
    saveEvent: "保存",
    savedEvent: "已保存",
    freshness: "新鲜度",
    freshnessFresh: "最新",
    freshnessCurrent: "最近检查",
    freshnessSoon: "即将复核",
    freshnessStale: "需要官方复核",
    freshnessArchive: "归档检查",
    checkedToday: "今天检查",
    checkedYesterday: "昨天检查",
    daysAgo: "天前",
    officialLabel: "官方",
    official: "官方来源",
    downloadCalendar: "下载日历文件",
    highlightLabel: "官方精选"
  },
  pt: {
    skipToMain: "Ir para o conteudo principal",
    navNow: "Agora",
    navPlanner: "Planejador",
    saveEvent: "Salvar",
    savedEvent: "Salvo",
    freshness: "Atualizacao",
    freshnessFresh: "Atualizado",
    freshnessCurrent: "Revisado recentemente",
    checkedToday: "revisado hoje",
    checkedYesterday: "revisado ontem",
    highlightLabel: "Destaque oficial"
  },
  ru: {
    skipToMain: "Перейти к основному содержанию",
    navEvents: "События",
    navNow: "Сейчас",
    navCalendar: "Календарь",
    navPlanner: "План",
    navGuides: "Гиды",
    navAbout: "О проекте",
    routePages: "Маршруты",
    ctaEvents: "Смотреть события",
    ctaCalendar: "Открыть календарь",
    saveEvent: "Сохранить",
    savedEvent: "Сохранено",
    freshness: "Актуальность",
    freshnessFresh: "Свежо",
    freshnessCurrent: "Недавно проверено",
    freshnessSoon: "Скоро перепроверить",
    freshnessStale: "Нужна официальная проверка",
    freshnessArchive: "Архивная проверка",
    checkedToday: "проверено сегодня",
    checkedYesterday: "проверено вчера",
    daysAgo: "дн. назад",
    officialLabel: "Официально",
    official: "Официальный источник",
    downloadCalendar: "Скачать календарь",
    highlightLabel: "Официальный акцент"
  },
  ja: {
    skipToMain: "本文へ移動",
    navNow: "今見る",
    navPlanner: "保存リスト",
    saveEvent: "保存",
    savedEvent: "保存済み",
    freshnessFresh: "新しい",
    freshnessCurrent: "最近確認",
    checkedToday: "本日確認",
    checkedYesterday: "昨日確認",
    highlightLabel: "公式ハイライト"
  },
  fr: {
    skipToMain: "Aller au contenu principal",
    highlightLabel: "Selection officielle"
  },
  de: {
    skipToMain: "Zum Hauptinhalt springen",
    highlightLabel: "Offizielles Highlight"
  }
};

for (const [code, overrides] of Object.entries(visitorUiOverrides)) {
  dict[code] = { ...(dict[code] || dict.en), ...overrides };
}

const plannerCardLabels = {
  en: {
    saveEvent: "Save to plan",
    savedEvent: "Saved to plan",
    cardPlanTools: "Planning tools",
    cardPlanWeather: "Weather",
    cardPlanMap: "Korean map",
    cardPlanCalendar: "Calendar"
  },
  es: {
    saveEvent: "Guardar en plan",
    savedEvent: "Guardado",
    cardPlanTools: "Herramientas de plan",
    cardPlanWeather: "Clima",
    cardPlanMap: "Mapa coreano",
    cardPlanCalendar: "Calendario"
  },
  zh: {
    saveEvent: "\u52a0\u5165\u884c\u7a0b",
    savedEvent: "\u5df2\u4fdd\u5b58",
    cardPlanTools: "\u884c\u7a0b\u5de5\u5177",
    cardPlanWeather: "\u5929\u6c14",
    cardPlanMap: "\u97e9\u6587\u5730\u56fe",
    cardPlanCalendar: "\u65e5\u5386"
  },
  pt: {
    saveEvent: "Salvar no plano",
    savedEvent: "Salvo",
    cardPlanTools: "Ferramentas de planejamento",
    cardPlanWeather: "Clima",
    cardPlanMap: "Mapa coreano",
    cardPlanCalendar: "Calendario"
  },
  ru: {
    saveEvent: "\u0412 \u043f\u043b\u0430\u043d",
    savedEvent: "\u0421\u043e\u0445\u0440\u0430\u043d\u0435\u043d\u043e",
    cardPlanTools: "\u0418\u043d\u0441\u0442\u0440\u0443\u043c\u0435\u043d\u0442\u044b \u043f\u043b\u0430\u043d\u0430",
    cardPlanWeather: "\u041f\u043e\u0433\u043e\u0434\u0430",
    cardPlanMap: "\u041a\u0430\u0440\u0442\u0430 \u043d\u0430 \u043a\u043e\u0440\u0435\u0439\u0441\u043a\u043e\u043c",
    cardPlanCalendar: "\u041a\u0430\u043b\u0435\u043d\u0434\u0430\u0440\u044c"
  },
  ja: {
    saveEvent: "\u8a08\u753b\u306b\u4fdd\u5b58",
    savedEvent: "\u4fdd\u5b58\u6e08\u307f",
    cardPlanTools: "\u8a08\u753b\u30c4\u30fc\u30eb",
    cardPlanWeather: "\u5929\u6c17",
    cardPlanMap: "\u97d3\u56fd\u8a9e\u5730\u56f3",
    cardPlanCalendar: "\u30ab\u30ec\u30f3\u30c0\u30fc"
  },
  fr: {
    saveEvent: "Ajouter au plan",
    savedEvent: "Enregistre",
    cardPlanTools: "Outils de planification",
    cardPlanWeather: "Meteo",
    cardPlanMap: "Carte coreenne",
    cardPlanCalendar: "Calendrier"
  },
  de: {
    saveEvent: "Zum Plan speichern",
    savedEvent: "Gespeichert",
    cardPlanTools: "Planungswerkzeuge",
    cardPlanWeather: "Wetter",
    cardPlanMap: "Koreanische Karte",
    cardPlanCalendar: "Kalender"
  }
};

for (const [code, labels] of Object.entries(plannerCardLabels)) {
  dict[code] = { ...(dict[code] || dict.en), ...labels };
}

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
    title: "K-pop concerts, pop-ups, merch stores, and fan events",
    description: "Official K-pop concert, ticketing, fan meeting, pop-up, merch, reservation, and fan commerce notices with travel planning notes."
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

const localizedCategoryDefinitions = {
  fr: {
    festival: {
      title: "Festivals et evenements culturels en Coree",
      description: "Festivals, concerts, spectacles, evenements de riviere et calendriers culturels verifies pour les visiteurs etrangers."
    },
    kpop: {
      title: "Concerts K-pop, pop-ups, merch et fan events",
      description: "Annonces officielles de concerts K-pop, fan meetings, pop-ups, merch, reservations et billetteries avec notes de voyage."
    },
    beauty: {
      title: "Offres K-beauty et promotions OLIVE YOUNG",
      description: "Pages de soldes K-beauty, coupons, rappels tax refund et itineraires shopping pour voyageurs en Coree."
    },
    "duty-free": {
      title: "Duty-free en Coree et offres avant l'aeroport",
      description: "Offres Shilla, Lotte, Shinsegae et duty-free verifiees avec rappels d'eligibilite et de retrait."
    },
    "department-store": {
      title: "Grands magasins en Coree, soldes et pop-ups",
      description: "Soldes, expositions culturelles, pop-ups et evenements par branche pour visiteurs qui font du shopping."
    },
    shopping: {
      title: "Festivals shopping et saisons de soldes en Coree",
      description: "Campagnes saisonnieres, archives Korea Grand Sale et pages officielles utiles pour preparer ses achats."
    },
    "travel-benefits": {
      title: "Avantages voyage et coupons visiteurs en Coree",
      description: "Avantages officiels, offres partenaires, reductions d'attractions et hubs de coupons touristiques recurrents."
    }
  },
  de: {
    festival: {
      title: "Festivals und Kultur-Events in Korea",
      description: "Geprufte Korea-Festivals, Fluss-Events, Konzerte, Auffuhrungen und Kulturkalender fur internationale Besucher."
    },
    kpop: {
      title: "K-pop Konzerte, Pop-ups, Merch und Fan-Events",
      description: "Offizielle K-pop Konzert-, Ticketing-, Fanmeeting-, Pop-up-, Merch- und Reservierungshinweise mit Reiseplanung."
    },
    beauty: {
      title: "K-beauty Deals und OLIVE YOUNG Aktionen",
      description: "Offizielle K-beauty Sales, Couponfenster, Tax-Refund-Hinweise und Shoppingrouten fur Korea-Reisende."
    },
    "duty-free": {
      title: "Duty-free Events in Korea und Airport-Pickup-Deals",
      description: "Geprufte Shilla-, Lotte-, Shinsegae- und Duty-free-Angebote mit Eligibility- und Pickup-Hinweisen."
    },
    "department-store": {
      title: "Kaufhaus-Sales und Pop-ups in Korea",
      description: "Kaufhaus-Sales, Kultur-Ausstellungen, Pop-up Stores und branchenspezifische Events fur Besucher."
    },
    shopping: {
      title: "Shopping-Festivals und Sale-Saisons in Korea",
      description: "Saisonale Shoppingkampagnen, Korea Grand Sale Archive und offizielle Planungsseiten fur Einkaufe."
    },
    "travel-benefits": {
      title: "Korea Reisevorteile und Besucher-Coupons",
      description: "Offizielle Besucherangebote, Partner-Deals, Attraktionsrabatte und wiederkehrende Travel-Coupon-Hubs."
    }
  },
  es: {
    festival: {
      title: "Festivales y eventos culturales en Corea",
      description: "Festivales, conciertos, espectáculos, eventos junto al río y calendarios culturales de Corea verificados para visitantes extranjeros."
    },
    kpop: {
      title: "Conciertos K-pop, pop-ups, merch y eventos de fans",
      description: "Avisos oficiales de conciertos K-pop, ticketing, fan meetings, pop-ups, merch y reservas con notas de planificación de viaje."
    },
    beauty: {
      title: "Ofertas K-beauty y promociones OLIVE YOUNG",
      description: "Páginas oficiales de rebajas K-beauty, ventanas de cupones, notas de tax refund y rutas de compras para viajeros en Corea."
    },
    "duty-free": {
      title: "Eventos duty-free en Corea y recogida en aeropuerto",
      description: "Ofertas verificadas de Shilla, Lotte, Shinsegae y duty-free oficiales con recordatorios de elegibilidad."
    },
    "department-store": {
      title: "Rebajas y pop-ups de grandes almacenes en Corea",
      description: "Rebajas de grandes almacenes, exposiciones culturales, tiendas pop-up y eventos por sucursal para compradores extranjeros."
    },
    shopping: {
      title: "Festivales de compras y temporadas de rebajas en Corea",
      description: "Campañas de compras estacionales, archivos del Korea Grand Sale y páginas oficiales para planificar compras."
    },
    "travel-benefits": {
      title: "Beneficios de viaje y cupones para visitantes en Corea",
      description: "Beneficios oficiales para visitantes, ofertas de socios, descuentos en atracciones y hubs recurrentes de cupones de viaje."
    }
  },
  zh: {
    festival: {
      title: "韩国节庆与文化活动",
      description: "经官方来源核实的韩国节庆、江边活动、演唱会、演出与文化日历，面向外国游客。"
    },
    kpop: {
      title: "K-pop 演唱会、快闪店、周边与粉丝活动",
      description: "K-pop 演唱会、售票、见面会、快闪店、周边与预约的官方公告，附旅行规划提示。"
    },
    beauty: {
      title: "K-beauty 优惠与 OLIVE YOUNG 促销",
      description: "官方 K-beauty 促销页面、优惠券时段、退税提示与面向韩国旅行者的购物路线。"
    },
    "duty-free": {
      title: "韩国免税店活动与机场提货优惠",
      description: "经核实的新罗、乐天、新世界及官方免税店优惠，附使用条件提醒。"
    },
    "department-store": {
      title: "韩国百货公司折扣与快闪店",
      description: "百货公司折扣、文化展览、快闪店与各分店活动，面向外国购物者。"
    },
    shopping: {
      title: "韩国购物节与季节性促销档案",
      description: "季节性购物活动、Korea Grand Sale 档案与官方促销规划页面。"
    },
    "travel-benefits": {
      title: "韩国旅行优惠与游客优惠券",
      description: "官方游客福利、合作优惠、景点折扣与定期更新的旅行优惠券入口。"
    }
  },
  pt: {
    festival: {
      title: "Festivais e eventos culturais na Coreia",
      description: "Festivais, shows, apresentações, eventos à beira-rio e calendários culturais da Coreia verificados para visitantes estrangeiros."
    },
    kpop: {
      title: "Shows de K-pop, pop-ups, merch e eventos de fãs",
      description: "Avisos oficiais de shows de K-pop, ingressos, fan meetings, pop-ups, merch e reservas com notas de planejamento de viagem."
    },
    beauty: {
      title: "Ofertas K-beauty e promoções OLIVE YOUNG",
      description: "Páginas oficiais de promoções K-beauty, janelas de cupons, notas de tax refund e rotas de compras para viajantes na Coreia."
    },
    "duty-free": {
      title: "Eventos duty-free na Coreia e retirada no aeroporto",
      description: "Ofertas verificadas da Shilla, Lotte, Shinsegae e duty-free oficiais com lembretes de elegibilidade."
    },
    "department-store": {
      title: "Liquidações e pop-ups de lojas de departamento na Coreia",
      description: "Liquidações de lojas de departamento, exposições culturais, lojas pop-up e eventos por filial para compradores estrangeiros."
    },
    shopping: {
      title: "Festivais de compras e temporadas de liquidação na Coreia",
      description: "Campanhas sazonais de compras, arquivos do Korea Grand Sale e páginas oficiais de planejamento de compras."
    },
    "travel-benefits": {
      title: "Benefícios de viagem e cupons para visitantes na Coreia",
      description: "Benefícios oficiais para visitantes, ofertas de parceiros, descontos em atrações e hubs recorrentes de cupons de viagem."
    }
  },
  ru: {
    festival: {
      title: "Фестивали и культурные события в Корее",
      description: "Проверенные по официальным источникам фестивали, концерты, представления, события у реки и культурные календари Кореи для иностранных гостей."
    },
    kpop: {
      title: "K-pop концерты, поп-апы, мерч и фан-события",
      description: "Официальные анонсы K-pop концертов, билетов, фан-митингов, поп-апов, мерча и бронирований с заметками для планирования поездки."
    },
    beauty: {
      title: "Акции K-beauty и промо OLIVE YOUNG",
      description: "Официальные страницы распродаж K-beauty, окна купонов, заметки о tax refund и шопинг-маршруты для путешественников в Корее."
    },
    "duty-free": {
      title: "Duty-free события в Корее и выдача в аэропорту",
      description: "Проверенные предложения Shilla, Lotte, Shinsegae и официальных duty-free с напоминаниями об условиях."
    },
    "department-store": {
      title: "Распродажи и поп-апы универмагов в Корее",
      description: "Распродажи универмагов, культурные выставки, поп-ап магазины и события отдельных филиалов для иностранных покупателей."
    },
    shopping: {
      title: "Шопинг-фестивали и сезонные распродажи в Корее",
      description: "Сезонные шопинг-кампании, архивы Korea Grand Sale и официальные страницы для планирования покупок."
    },
    "travel-benefits": {
      title: "Туристические бонусы и купоны для гостей Кореи",
      description: "Официальные бонусы для туристов, партнёрские предложения, скидки на достопримечательности и регулярно обновляемые купонные хабы."
    }
  },
  ja: {
    festival: {
      title: "韓国のフェスティバルと文化イベント",
      description: "公式情報で確認した韓国のフェスティバル、川辺イベント、コンサート、公演、文化カレンダーを外国人旅行者向けに紹介。"
    },
    kpop: {
      title: "K-popコンサート、ポップアップ、グッズ、ファンイベント",
      description: "K-popコンサート、チケット、ファンミーティング、ポップアップ、グッズ、予約の公式告知と旅行計画メモ。"
    },
    beauty: {
      title: "K-beautyセールとOLIVE YOUNGプロモーション",
      description: "公式K-beautyセールページ、クーポン期間、タックスリファンドの注意点、韓国旅行者向けショッピングルート。"
    },
    "duty-free": {
      title: "韓国免税店イベントと空港受け取り特典",
      description: "新羅・ロッテ・新世界など公式免税店の確認済み特典と利用条件のリマインド。"
    },
    "department-store": {
      title: "韓国百貨店のセールとポップアップ",
      description: "百貨店のセール、文化展示、ポップアップストア、店舗別イベントを外国人ショッパー向けに紹介。"
    },
    shopping: {
      title: "韓国ショッピングフェスティバルとセールシーズン",
      description: "季節のショッピングキャンペーン、Korea Grand Saleアーカイブ、公式セール計画ページ。"
    },
    "travel-benefits": {
      title: "韓国旅行特典と訪問者クーポン",
      description: "公式の訪問者特典、提携オファー、観光地割引、定期更新のクーポンハブ。"
    }
  }
};

function categoryPageCopy(lang, category) {
  return localizedCategoryDefinitions[lang]?.[category] || categoryDefinitions[category] || {
    title: categoryLabel(lang, category),
    description: lang === "fr"
      ? `Fiches ${categoryLabel(lang, category)} verifiees avec sources officielles, cartes, meteo et notes de visite.`
      : lang === "de"
        ? `Geprufte ${categoryLabel(lang, category)}-Eintrage mit offiziellen Quellen, Karten, Wetter und Besuchsnotizen.`
        : `Fresh Korea ${categoryLabel(lang, category)} listings from official sources.`
  };
}

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
  Incheon: {
    slug: "incheon",
    title: "Incheon concerts, airport-area events, and Songdo festivals",
    description: "Incheon stadium, arena, airport-area, and Songdo event pages with weather, map, and late-return planning notes.",
    weatherRegion: "Incheon"
  },
  Goyang: {
    slug: "goyang",
    title: "Goyang KINTEX events and fan meeting planner",
    description: "KINTEX, Ilsan, and Goyang event pages with weather, map, lodging, and late-return planning notes.",
    weatherRegion: "Goyang"
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

function cityPageCopy(lang, city) {
  const base = cityDefinitions[city] || {
    title: `${city} Korea event planner`,
    description: `Officially checked Korea events and travel planning notes for ${city}.`,
    weatherRegion: city
  };
  if (lang === "fr") {
    return {
      ...base,
      title: `${city}: evenements, pop-ups et shopping en Coree`,
      description: `Evenements verifies pour ${city} avec dates, meteo, noms coreens de carte, sources officielles et idees de trajet.`
    };
  }
  if (lang === "de") {
    return {
      ...base,
      title: `${city}: Events, Pop-ups und Shopping in Korea`,
      description: `Geprufte Events fur ${city} mit Daten, Wetter, koreanischen Kartennamen, offiziellen Quellen und Routenideen.`
    };
  }
  return base;
}

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

function needsGeneratedVisitorCopy(value, lang) {
  return (lang === "fr" || lang === "de") && (!value || typeof value === "string" || !String(value[lang] || "").trim() || hasMojibake(value[lang]));
}

const localizedGuideTitles = {
  fr: {
    "how-to-verify-korea-popups": "Verifier un pop-up K-pop en Coree avant d'y aller",
    "korea-duty-free-before-flight": "Verifier les offres duty-free en Coree avant le vol",
    "korea-shopping-sale-calendar": "Calendrier des soldes en Coree pour visiteurs etrangers",
    "weather-for-korea-events": "Planifier les evenements en Coree avec la meteo",
    "olive-young-shopping-strategy": "Planifier une journee shopping OLIVE YOUNG en Coree",
    "department-store-popup-planning": "Utiliser les pop-ups de grands magasins pendant un voyage en Coree",
    "kpop-ticket-merch-safety": "Verifier tickets, merch et pop-ups K-pop sans risque",
    "festival-day-itinerary-korea": "Construire un itineraire d'une journee de festival en Coree",
    "korea-event-transport-lockers": "Transport, consignes et bagages pour les evenements en Coree",
    "tax-refund-payments-korea-shopping": "Tax refund et paiements pour le shopping en Coree",
    "korea-shopping-sale-season-calendar": "Saisons de soldes en Coree a surveiller",
    "verify-kpop-popup-notices-korea": "Verifier les annonces de pop-ups K-pop avant de planifier un voyage"
  },
  de: {
    "how-to-verify-korea-popups": "K-pop Pop-ups in Korea vor dem Besuch prufen",
    "korea-duty-free-before-flight": "Korea Duty-free Deals vor dem Abflug prufen",
    "korea-shopping-sale-calendar": "Korea-Sale-Kalender fur internationale Besucher",
    "weather-for-korea-events": "Korea-Events mit Wetterplanung vorbereiten",
    "olive-young-shopping-strategy": "Einen OLIVE YOUNG Shoppingtag in Korea planen",
    "department-store-popup-planning": "Kaufhaus-Pop-ups in Korea wahrend der Reise nutzen",
    "kpop-ticket-merch-safety": "K-pop Tickets, Merch und Pop-ups sicher prufen",
    "festival-day-itinerary-korea": "Eine eintagige Festivalroute in Korea planen",
    "korea-event-transport-lockers": "Transport, Schliessfacher und Gepack bei Korea-Events",
    "tax-refund-payments-korea-shopping": "Tax Refund und Zahlungen beim Shopping in Korea",
    "korea-shopping-sale-season-calendar": "Wichtige Korea-Shopping-Saisons fur Besucher",
    "verify-kpop-popup-notices-korea": "K-pop Pop-up Hinweise vor der Korea-Reise prufen"
  }
};

function guideTitleText(guide, lang) {
  const localized = localizedGuideTitles[lang]?.[guide.slug];
  if (localized) return localized;
  return local(guide.title, lang);
}

function eventSummaryText(event, lang) {
  if (!needsGeneratedVisitorCopy(event.summary, lang)) return local(event.summary, lang);
  const title = local(event.title, "en") || event.slug;
  const period = event.dateLabel || `${dateText(lang, event.startDate)} - ${dateText(lang, event.endDate)}`;
  const category = categoryLabel(lang, event.category);
  if (lang === "fr") {
    return `${title} est une page ${category} pour ${event.city}, avec une periode de planification ${period}. K-Spot Now rassemble le lieu, la meteo, les cartes et la source officielle afin de comparer avant d'acheter, reserver ou visiter.`;
  }
  return `${title} ist eine ${category}-Planungsseite fur ${event.city} mit dem Zeitraum ${period}. K-Spot Now bundelt Ort, Wetter, Karten und offizielle Quelle, damit Besucher vor Kauf, Reservierung oder Besuch vergleichen konnen.`;
}

function eventWhyGoText(event, lang) {
  if (!needsGeneratedVisitorCopy(event.whyGo, lang)) return local(event.whyGo, lang);
  const category = categoryLabel(lang, event.category);
  if (lang === "fr") {
    return `Cette fiche aide les visiteurs a transformer une annonce ${category} en plan concret: confirmer les dates, choisir le quartier, verifier le transport et ouvrir la source officielle pour l'action finale.`;
  }
  return `Diese Seite macht aus einem ${category}-Hinweis einen nutzbaren Plan: Daten bestatigen, Stadtteil wahlen, Verkehr prufen und die offizielle Quelle fur die finale Aktion offnen.`;
}

function eventTravelTips(event, lang) {
  if (lang !== "fr" && lang !== "de") return event.travelTips || [];
  if (lang === "fr") {
    return [
      "Reverifiez la source officielle le jour meme, surtout pour les pop-ups, tickets et offres a stock limite.",
      "Copiez le nom coreen du lieu dans Naver Map, Kakao Map ou Google Maps avant de partir.",
      "Gardez une option proche pour repas, shopping ou abri interieur si la file, la meteo ou le stock change.",
      "Finalisez achat, reservation et regles d'entree uniquement sur le site officiel ou la billetterie liee."
    ];
  }
  return [
    "Prufen Sie die offizielle Quelle am selben Tag erneut, besonders bei Pop-ups, Tickets und limitierten Angeboten.",
    "Kopieren Sie den koreanischen Ortsnamen vor der Abfahrt in Naver Map, Kakao Map oder Google Maps.",
    "Halten Sie eine nahe Alternative fur Essen, Shopping oder Innenraum bereit, falls Warteschlange, Wetter oder Bestand wechseln.",
    "Schliessen Sie Kauf, Reservierung und Einlassregeln nur auf der offiziellen Seite oder verlinkten Ticketingseite ab."
  ];
}

function guideSummaryText(guide, lang) {
  if (!needsGeneratedVisitorCopy(guide.summary, lang)) return local(guide.summary, lang);
  const category = categoryLabel(lang, guide.category);
  if (lang === "fr") return `Guide pratique pour verifier les sources officielles, dates, lieux, cartes et options proches avant de planifier une sortie ${category} en Coree.`;
  return `Praktischer Guide zum Prufen offizieller Quellen, Daten, Orte, Karten und naher Optionen vor einer ${category}-Planung in Korea.`;
}

function guideSectionsForLang(guide, lang) {
  if (lang !== "fr" && lang !== "de") return localList(guide.sections, lang);
  const localized = Array.isArray(guide.sections?.[lang]) ? guide.sections[lang].filter(Boolean) : [];
  if (localized.length) return localized;
  if (lang === "fr") {
    return [
      "Commencez par la source officielle: organisateur, marque, lieu, billetterie ou page touristique publique.",
      "Verifiez les dates, horaires, methode d'entree, limite d'achat et conditions pour visiteurs etrangers.",
      "Copiez le nom coreen du lieu et comparez transport, meteo, files possibles et options proches.",
      "Utilisez K-Spot Now pour planifier et comparer; finalisez achat ou reservation seulement sur la source officielle."
    ];
  }
  return [
    "Beginnen Sie mit der offiziellen Quelle: Veranstalter, Marke, Ort, Ticketing oder offentlicher Tourismusseite.",
    "Prufen Sie Daten, Zeiten, Eintrittsmethode, Kauflimits und Bedingungen fur internationale Besucher.",
    "Kopieren Sie den koreanischen Ortsnamen und vergleichen Sie Verkehr, Wetter, mogliche Warteschlangen und nahe Optionen.",
    "Nutzen Sie K-Spot Now zum Planen und Vergleichen; Kauf oder Reservierung erfolgen nur auf der offiziellen Quelle."
  ];
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

const guideHeadingSets = {
  kpop: {
    en: ["Official notice", "Entry rules", "Risk checks", "Backup plan"],
    es: ["Aviso oficial", "Reglas de entrada", "Riesgos clave", "Plan alternativo"],
    zh: ["官方公告", "入场规则", "风险检查", "备用计划"],
    pt: ["Aviso oficial", "Regras de entrada", "Riscos principais", "Plano alternativo"],
    ru: ["Официальное уведомление", "Правила входа", "Проверка рисков", "Запасной план"],
    ja: ["公式告知", "入場ルール", "リスク確認", "代替プラン"]
  },
  festival: {
    en: ["Official basics", "Weather decision", "Route shape", "Final recheck"],
    es: ["Datos oficiales", "Decision de clima", "Forma de ruta", "Revision final"],
    zh: ["官方要点", "天气判断", "路线安排", "最终复查"],
    pt: ["Dados oficiais", "Decisao de clima", "Formato da rota", "Rechecagem final"],
    ru: ["Официальные основы", "Решение по погоде", "Форма маршрута", "Финальная проверка"],
    ja: ["公式情報", "天気判断", "ルート設計", "最終確認"]
  },
  shopping: {
    en: ["Sale window", "Visitor eligibility", "Archive safely", "Final source check"],
    es: ["Ventana de oferta", "Elegibilidad", "Archivo claro", "Chequeo final"],
    zh: ["促销窗口", "游客资格", "安全归档", "最终核实"],
    pt: ["Janela de oferta", "Elegibilidade", "Arquivo claro", "Cheque final"],
    ru: ["Окно распродажи", "Право на участие", "Безопасный архив", "Финальная проверка"],
    ja: ["セール時期", "旅行者条件", "明確なアーカイブ", "最終ソース確認"]
  },
  beauty: {
    en: ["Official offer", "Neighborhood route", "Stock reality", "Original value"],
    es: ["Oferta oficial", "Ruta por barrio", "Stock real", "Valor propio"],
    zh: ["官方优惠", "商圈路线", "库存现实", "原创价值"],
    pt: ["Oferta oficial", "Rota por bairro", "Estoque real", "Valor proprio"],
    ru: ["Официальное предложение", "Маршрут по району", "Реальность наличия", "Собственная ценность"],
    ja: ["公式オファー", "エリア別ルート", "在庫の現実", "独自価値"]
  },
  "department-store": {
    en: ["Official lead", "Branch rules", "Low-friction route", "Archive value"],
    es: ["Pista oficial", "Reglas de sucursal", "Ruta facil", "Valor de archivo"],
    zh: ["官方线索", "门店规则", "低负担路线", "归档价值"],
    pt: ["Pista oficial", "Regras da filial", "Rota facil", "Valor de arquivo"],
    ru: ["Официальный источник", "Правила филиала", "Маршрут без лишней нагрузки", "Ценность архива"],
    ja: ["公式の手がかり", "支店ルール", "負担の少ないルート", "アーカイブ価値"]
  },
  "duty-free": {
    en: ["Departure link", "Pickup checklist", "Allowance rules", "Before payment"],
    es: ["Salida vinculada", "Checklist de recogida", "Reglas de limite", "Antes de pagar"],
    zh: ["出境绑定", "取货清单", "限额规则", "付款前"],
    pt: ["Saida vinculada", "Checklist de retirada", "Regras de limite", "Antes de pagar"],
    ru: ["Связь с вылетом", "Чеклист выдачи", "Лимиты и правила", "Перед оплатой"],
    ja: ["出国旅程との連動", "受け取り確認", "免税範囲ルール", "決済前"]
  },
  "travel-benefits": {
    en: ["Transit-first plan", "Bag strategy", "Airport buffer", "Exit plan"],
    es: ["Primero transporte", "Estrategia de equipaje", "Margen de aeropuerto", "Plan de salida"],
    zh: ["交通优先", "行李策略", "机场缓冲", "离场计划"],
    pt: ["Transporte primeiro", "Estrategia de bagagem", "Folga de aeroporto", "Plano de saida"],
    ru: ["Сначала транспорт", "Стратегия багажа", "Запас на аэропорт", "План выхода"],
    ja: ["交通優先", "荷物戦略", "空港の余裕", "退出計画"]
  }
};

function guideSectionHeading(guide, lang, index) {
  const fallback = guideHeadingSets.festival;
  const set = guideHeadingSets[guide.category] || fallback;
  const localized = set[lang] || set.en || fallback.en;
  const title = localized[index] || fallback[lang]?.[index] || fallback.en[index] || tr(lang, "details");
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
    },
    festival: {
      en: "Festival",
      es: "Festival",
      zh: "Festival",
      pt: "Festival",
      ru: "Festival",
      ja: "Festival"
    },
    "pop-up": {
      en: "Pop-up",
      es: "Pop-up",
      zh: "Pop-up",
      pt: "Pop-up",
      ru: "Pop-up",
      ja: "Pop-up"
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
  return `${eventSummaryText(event, lang)} ${status}. ${category}. ${event.dateLabel || `${event.startDate} - ${event.endDate}`}. Official source: ${event.sourceUrl}`;
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
      summary: eventSummaryText(event, lang),
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

function representativeEventFor(predicate) {
  const statusWeight = { live: 0, upcoming: 1, ended: 2 };
  return [...events]
    .filter(predicate)
    .sort((a, b) => {
      const statusDiff = statusWeight[statusOf(a)] - statusWeight[statusOf(b)];
      if (statusDiff) return statusDiff;
      const priorityDiff = (b.priority || 0) - (a.priority || 0);
      if (priorityDiff) return priorityDiff;
      return String(a.startDate || "").localeCompare(String(b.startDate || ""));
    })[0] || null;
}

function representativeMedia(event, lang, fallbackLabel, className = "pill-media") {
  if (!event?.thumbnail) {
    return `<span class="pill-marker" aria-hidden="true">${esc(String(fallbackLabel || "").slice(0, 1).toUpperCase())}</span>`;
  }
  return `
        <span class="${className}">
          <img src="/${esc(event.thumbnail)}" alt="${esc(local(event.title, lang))}" loading="lazy">
          <span>${esc(thumbnailBrand(event))}</span>
        </span>`;
}

function categoryLinkStrip(lang) {
  return Object.keys(categoryDefinitions).map((category) => {
    const count = events.filter((event) => event.category === category).length;
    const representative = representativeEventFor((event) => event.category === category);
    const exampleTitle = representative ? trimHeading(local(representative.title, lang), 48) : "";
    const label = categoryLabel(lang, category);
    return `
      <a class="category-pill category-${esc(category)}${representative ? " has-media" : ""}" href="${categoryHref(lang, category)}" data-browse-category="${esc(category)}">
        ${representativeMedia(representative, lang, label)}
        <span class="pill-copy">
          <strong>${label}</strong>
          <span><b data-pill-count>${count}</b> items</span>
          ${exampleTitle ? `<em>${esc(exampleTitle)}</em>` : ""}
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
    const representative = representativeEventFor((event) => event.city === city);
    const exampleTitle = representative ? trimHeading(local(representative.title, lang), 42) : "";
    return `
      <a class="city-pill${representative ? " has-media" : ""}" href="${cityHref(lang, city)}" data-browse-city="${esc(city)}">
        ${representativeMedia(representative, lang, city)}
        <span class="pill-copy">
          <strong>${esc(city)}</strong>
          <span><b data-pill-count>${count}</b> events</span>
          ${exampleTitle ? `<em>${esc(exampleTitle)}</em>` : ""}
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

function relatedEventsForGuide(guide) {
  const statusWeight = { live: 0, upcoming: 1, ended: 2 };
  return events
    .filter((event) => event.category === guide.category)
    .sort((a, b) => {
      const statusDiff = statusWeight[statusOf(a)] - statusWeight[statusOf(b)];
      if (statusDiff) return statusDiff;
      const priorityDiff = (b.priority || 0) - (a.priority || 0);
      if (priorityDiff) return priorityDiff;
      return String(a.startDate || "").localeCompare(String(b.startDate || ""));
    })
    .slice(0, 3);
}

function relatedRoutesForGuide(guide) {
  const matches = routes.filter((route) => route.categories?.includes(guide.category));
  return (matches.length ? matches : routes).slice(0, 3);
}

const guideSourceTokens = {
  kpop: ["k-pop", "concert", "ticket", "artist", "weverse", "yes24", "ticketlink", "melon"],
  festival: ["festival", "tourism", "visit", "seoul", "culture", "performance"],
  beauty: ["olive young", "beauty", "cosmetic"],
  "duty-free": ["duty-free", "shilla", "lotte", "shinsegae", "airport"],
  "department-store": ["department", "hyundai", "shinsegae", "lotte", "popup", "pop-up"],
  shopping: ["shopping", "sale", "grand sale", "market", "retail"],
  "travel-benefits": ["weather", "travel", "route", "transport", "airport", "visit"]
};

function guideSourceExamples(guide) {
  const tokens = guideSourceTokens[guide.category] || [guide.category];
  return sources
    .filter((source) => {
      const haystack = [
        source.name,
        source.type,
        source.owner,
        source.notes,
        ...(source.coverage || [])
      ].join(" ").toLowerCase();
      return tokens.some((token) => haystack.includes(token));
    })
    .slice(0, 4);
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

function isNationwideTravelBenefit(event) {
  return event.category === "travel-benefits" && event.city === "Nationwide";
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
  const nationwideBenefit = isNationwideTravelBenefit(event);
  const placeLabel = nationwideBenefit ? tr(lang, "campaignNoFixedVenue") : eventPlaceQuery(event);
  const placeSub = nationwideBenefit ? tr(lang, "campaignMapSub") : `${esc(event.district)}, ${esc(event.city)}`;
  const note = nationwideBenefit ? tr(lang, "campaignMapNote") : tr(lang, "mapNote");
  const campaignCard = nationwideBenefit ? `
              <a href="${esc(event.sourceUrl)}" rel="nofollow noopener" target="_blank">
                <strong>${tr(lang, "officialCampaign")}</strong>
                <span>${esc(event.sourceName)}</span>
              </a>` : "";
  return `
        <section class="detail-section map-links-section">
          <div>
            <h2>${nationwideBenefit ? tr(lang, "campaignChecksTitle") : tr(lang, "mapLinksTitle")}</h2>
            <p class="map-place"><strong>${esc(placeLabel)}</strong><span>${placeSub}</span></p>
            <p class="meta-note">${esc(note)}</p>
          </div>
          <div class="map-link-list${nationwideBenefit ? " has-campaign" : ""}">
            ${campaignCard}
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
          <p class="weather-source-line"><strong>KMA short-term forecast</strong> <span>${esc(forecast.locationLabel)} / ${esc(forecastRangeText(lang, forecast))}: ${esc(forecastSummaryText(forecast))}</span></p>
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
          <p class="meta-note">Weather baseline: ${esc(weather.source.name)} <span class="sr-only">Previous-year monthly baseline.</span></p>`;
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

function languageMenu(lang, currentPathBuilder) {
  return `
    <details class="language-menu">
      <summary aria-label="Language">${languages[lang].name}</summary>
      <div class="language-menu-panel">${langSwitcher(lang, currentPathBuilder)}</div>
    </details>`;
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
    description: eventSummaryText(event, lang),
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
    description: eventSummaryText(event, lang),
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
  <a class="skip-link" href="#main-content">${tr(lang, "skipToMain")}</a>
  <header class="site-header">
    <a class="brand" href="/${lang}/" aria-label="${siteName} home">
      <span class="brand-mark">KS</span>
      <span>${siteName}</span>
    </a>
    ${nav(lang)}
    ${languageMenu(lang, currentPathBuilder)}
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
      <a href="/${lang}/advertising/">${tr(lang, "advertisingTitle")}</a>
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
    eventSummaryText(event, lang),
    eventWhyGoText(event, lang),
    event.city,
    event.district,
    event.venue,
    event.sourceName,
    event.category,
    event.dateLabel,
    event.startDate,
    event.endDate,
    ...eventTravelTips(event, lang),
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
  const role = sourceRoleType(event);
  return `
    <article class="event-card" data-card data-category="${esc(event.category)}" data-city="${esc(event.city)}" data-status="${status}" data-source-role="${esc(role)}" data-search="${esc(eventSearchText(event, lang))}">
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
        <div class="event-source-row">
          <span class="source-role-chip ${esc(role)}">${esc(sourceRoleLabel(event, lang))}</span>
          <span>${esc(event.sourceName)}</span>
        </div>
        <h3><a href="/${lang}/events/${event.slug}.html">${esc(local(event.title, lang))}</a></h3>
        <p>${esc(eventSummaryText(event, lang))}</p>
        <dl class="compact-facts">
          <div><dt>${tr(lang, "period")}</dt><dd>${esc(event.dateLabel || `${dateText(lang, event.startDate)} - ${dateText(lang, event.endDate)}`)}</dd></div>
          <div><dt>${tr(lang, "lastChecked")}</dt><dd>${dateText(lang, event.lastChecked)}</dd></div>
          <div><dt>${tr(lang, "freshness")}</dt><dd><span class="freshness-chip ${freshness.tone}">${esc(freshness.text)}</span></dd></div>
        </dl>
        ${eventPlanTools(lang)}
        ${saveEventButton(event, lang)}
      </div>
    </article>`;
}

function eventPlanTools(lang) {
  return `
        <div class="event-plan-tools" aria-label="${esc(tr(lang, "cardPlanTools"))}">
          <span>${esc(tr(lang, "cardPlanWeather"))}</span>
          <span>${esc(tr(lang, "cardPlanMap"))}</span>
          <span>${esc(tr(lang, "cardPlanCalendar"))}</span>
        </div>`;
}

function saveEventButton(event, lang) {
  return `<button type="button" class="save-event" data-save-event data-event-slug="${esc(event.slug)}" data-event-title="${esc(local(event.title, lang))}" data-event-date="${esc(event.dateLabel || `${event.startDate} - ${event.endDate}`)}" data-event-start="${esc(event.startDate)}" data-event-end="${esc(event.endDate)}" data-event-city="${esc(event.city)}" data-event-category="${esc(categoryLabel(lang, event.category))}" data-event-url="/${lang}/events/${event.slug}.html" data-event-source-url="${esc(event.sourceUrl)}" data-event-source-name="${esc(event.sourceName)}" data-event-map-query="${esc(eventPlaceQuery(event))}" data-event-venue="${esc([event.venue, event.district].filter(Boolean).join(", "))}" data-save-label="${esc(tr(lang, "saveEvent"))}" data-saved-label="${esc(tr(lang, "savedEvent"))}" aria-pressed="false"><span class="save-event-label" data-save-event-label>${tr(lang, "saveEvent")}</span></button>`;
}

function spotlightEvents(sorted) {
  const candidates = sorted.filter((event) => event.thumbnail && statusOf(event) !== "ended");
  const fallback = sorted.filter((event) => event.thumbnail);
  const source = candidates.length >= 3 ? candidates : fallback;
  const selected = [];
  const usedSlugs = new Set();
  const usedCategories = new Set();

  for (const event of source) {
    if (usedCategories.has(event.category)) continue;
    selected.push(event);
    usedSlugs.add(event.slug);
    usedCategories.add(event.category);
    if (selected.length >= 5) return selected;
  }

  for (const event of source) {
    if (usedSlugs.has(event.slug)) continue;
    selected.push(event);
    usedSlugs.add(event.slug);
    if (selected.length >= 5) break;
  }

  return selected.slice(0, 5);
}

function spotlightCarousel(slides, lang) {
  const usableSlides = slides.slice(0, 5);
  return `
            <div class="spotlight-carousel" data-spotlight-carousel>
              <div class="spotlight-track">
                ${usableSlides.map((event, index) => {
                  const period = event.dateLabel || `${dateText(lang, event.startDate)} - ${dateText(lang, event.endDate)}`;
                  const active = index === 0;
                  return `
                <a class="spotlight-card${active ? " is-active" : ""}" data-spotlight-slide href="/${lang}/events/${event.slug}.html" aria-hidden="${active ? "false" : "true"}" tabindex="${active ? "0" : "-1"}">
                  <img src="/${event.thumbnail}" alt="${esc(local(event.title, lang))}">
                  <span class="spotlight-badge">${esc(statusLabel(lang, statusOf(event)))} / ${categoryLabel(lang, event.category)}</span>
                  <span class="spotlight-content">
                    <span>${tr(lang, "highlightLabel")}</span>
                    <strong>${esc(local(event.title, lang))}</strong>
                    <em>${esc(event.city)} / ${esc(period)}</em>
                  </span>
                </a>`;
                }).join("")}
              </div>
              ${usableSlides.length > 1 ? `
              <div class="spotlight-controls" aria-label="Featured event controls">
                <button class="spotlight-arrow" type="button" data-spotlight-prev aria-label="Previous highlight">&lt;</button>
                <div class="spotlight-nav-panel">
                  <div class="spotlight-tabs" aria-label="Choose featured highlight">
                    ${usableSlides.map((event, index) => `<button class="spotlight-tab" type="button" data-spotlight-dot="${index}" data-spotlight-title="${esc(trimHeading(local(event.title, lang), 44))}" aria-label="Show ${esc(local(event.title, lang))}" title="${esc(local(event.title, lang))}"${index === 0 ? " aria-current=\"true\"" : ""}><span>${String(index + 1).padStart(2, "0")}</span></button>`).join("")}
                  </div>
                  <span class="spotlight-current-label" data-spotlight-title-label>${esc(trimHeading(local(usableSlides[0].title, lang), 44))}</span>
                </div>
                <span class="spotlight-count" data-spotlight-count>1 / ${usableSlides.length}</span>
                <button class="spotlight-arrow" type="button" data-spotlight-next aria-label="Next highlight">&gt;</button>
              </div>` : ""}
            </div>`;
}

const planningLayerCopy = {
  en: {
    eyebrow: "Why use K-Spot Now",
    title: "Plan first. Book on official sources.",
    text: "K-Spot Now is not a ticket shop. It is a multilingual planning layer that helps visitors compare official tourism, brand, venue, duty-free, department-store, and ticketing marketplace pages before choosing where to buy, reserve, or visit.",
    items: [
      ["One visitor shortlist", "Scan fast-moving Korea events across multiple official source types instead of opening one marketplace at a time."],
      ["Context before checkout", "Weather, map-ready Korean place names, transit notes, and nearby route ideas sit next to each event."],
      ["Freshness you can audit", "Last checked dates, verification labels, and source status tell you whether a page needs a final official recheck."],
      ["Clean handoff", "Tickets, reservations, purchases, and rules stay on the original organizer, brand, venue, or ticketing site."]
    ]
  },
  es: {
    eyebrow: "Por que usar K-Spot Now",
    title: "Planifica primero. Reserva en fuentes oficiales.",
    text: "K-Spot Now no es una tienda de entradas. Es una capa multilingue de planificacion para comparar paginas oficiales de turismo, marcas, recintos, duty free, tiendas departamentales y plataformas de tickets antes de comprar, reservar o visitar.",
    items: [
      ["Una lista para visitantes", "Revisa eventos de Corea que cambian rapido en varios tipos de fuentes oficiales."],
      ["Contexto antes de comprar", "Clima, nombres coreanos listos para mapas, transporte e ideas de ruta aparecen junto a cada evento."],
      ["Frescura auditable", "La fecha de ultima revision, la verificacion y el estado de la fuente muestran si hace falta reconfirmar."],
      ["Salida limpia", "Entradas, reservas, compras y reglas quedan en el organizador, marca, recinto o sitio de tickets original."]
    ]
  },
  fr: {
    eyebrow: "Pourquoi utiliser K-Spot Now",
    title: "Planifiez d'abord. Reserve sur les sources officielles.",
    text: "K-Spot Now n'est pas une billetterie. C'est une couche de planification multilingue qui aide les visiteurs a comparer tourisme officiel, marques, lieux, duty-free, grands magasins et plateformes de tickets avant d'acheter, reserver ou visiter.",
    items: [
      ["Une selection visiteur", "Parcourez les evenements rapides en Coree depuis plusieurs types de sources officielles."],
      ["Contexte avant achat", "Meteo, noms coreens prets pour les cartes, transports et idees d'itineraires sont places pres de chaque evenement."],
      ["Fraicheur verifiable", "Dates de derniere verification, labels de validation et etat des sources indiquent quand reconfirmer."],
      ["Passage propre", "Billets, reservations, achats et regles restent sur le site de l'organisateur, de la marque, du lieu ou de la billetterie."]
    ]
  },
  de: {
    eyebrow: "Warum K-Spot Now nutzen",
    title: "Erst planen. Bei offiziellen Quellen buchen.",
    text: "K-Spot Now ist kein Ticketshop. Es ist eine mehrsprachige Planungsschicht, mit der Besucher offizielle Tourismus-, Marken-, Veranstaltungsort-, Duty-free-, Kaufhaus- und Ticketingseiten vergleichen, bevor sie kaufen, reservieren oder hingehen.",
    items: [
      ["Eine Besucherauswahl", "Scannen Sie schnelle Korea-Events uber mehrere offizielle Quellentypen hinweg."],
      ["Kontext vor dem Checkout", "Wetter, kartenfertige koreanische Ortsnamen, Verkehrshinweise und Routenideen stehen direkt neben jedem Event."],
      ["Prufbare Aktualitat", "Letzte Prufdaten, Verifizierungslabels und Quellenstatus zeigen, wann offiziell neu gepruft werden muss."],
      ["Saubere Ubergabe", "Tickets, Reservierungen, Kaufe und Regeln bleiben beim Veranstalter, der Marke, dem Ort oder der Ticketingseite."]
    ]
  },
  zh: {
    eyebrow: "为什么使用 K-Spot Now",
    title: "先规划，再到官方来源预订。",
    text: "K-Spot Now 不是售票网站，而是面向访韩游客的多语言规划层。它帮助你在购买、预约或出发前比较旅游、品牌、场馆、免税店、百货店和票务平台的官方页面。",
    items: [
      ["游客清单", "不用逐个打开不同平台，也能快速浏览变化很快的韩国活动。"],
      ["行动前的上下文", "天气、可直接用于地图的韩文地点名、交通提示和周边路线与活动放在一起。"],
      ["可检查的新鲜度", "最近检查日期、验证标签和来源状态会提示是否需要再次确认官方页面。"],
      ["干净跳转", "门票、预约、购买和规则仍在原主办方、品牌、场馆或票务网站完成。"]
    ]
  },
  pt: {
    eyebrow: "Por que usar o K-Spot Now",
    title: "Planeje primeiro. Reserve nas fontes oficiais.",
    text: "K-Spot Now nao e uma loja de ingressos. E uma camada multilingue de planejamento para comparar paginas oficiais de turismo, marcas, locais, duty free, lojas de departamento e plataformas de tickets antes de comprar, reservar ou visitar.",
    items: [
      ["Uma lista para visitantes", "Veja eventos da Coreia que mudam rapido em varios tipos de fontes oficiais."],
      ["Contexto antes da compra", "Clima, nomes coreanos prontos para mapas, transporte e ideias de rota aparecem ao lado de cada evento."],
      ["Atualizacao auditavel", "Datas de ultima checagem, etiquetas de verificacao e status da fonte mostram quando reconfirmar."],
      ["Encaminhamento limpo", "Ingressos, reservas, compras e regras ficam no organizador, marca, local ou site de tickets original."]
    ]
  },
  ru: {
    eyebrow: "Зачем использовать K-Spot Now",
    title: "Сначала спланируйте. Бронируйте в официальных источниках.",
    text: "K-Spot Now не является билетным магазином. Это многоязычный слой планирования, который помогает сравнивать официальные страницы туризма, брендов, площадок, duty free, универмагов и билетных сервисов перед покупкой, бронированием или посещением.",
    items: [
      ["Один список для туриста", "Смотрите быстро меняющиеся события в Корее по разным типам официальных источников."],
      ["Контекст до покупки", "Погода, корейские названия мест для карт, транспорт и идеи маршрутов рядом с каждым событием."],
      ["Проверяемая свежесть", "Дата последней проверки, метки верификации и статус источника показывают, когда нужно перепроверить."],
      ["Чистый переход", "Билеты, бронирования, покупки и правила остаются на сайте организатора, бренда, площадки или билетного сервиса."]
    ]
  },
  ja: {
    eyebrow: "K-Spot Nowを使う理由",
    title: "まず計画。予約は公式情報へ。",
    text: "K-Spot Nowはチケット販売サイトではありません。訪韓者が購入、予約、訪問前に、観光、ブランド、会場、免税店、百貨店、チケットサービスの公式ページを比較できる多言語の計画レイヤーです。",
    items: [
      ["訪問者向けの一覧", "変化の早い韓国イベントを複数の公式情報タイプからまとめて確認できます。"],
      ["行動前の文脈", "天気、地図で使いやすい韓国語の場所名、交通メモ、周辺ルートをイベント横に配置します。"],
      ["確認できる鮮度", "最終確認日、検証ラベル、情報源の状態で再確認が必要か判断できます。"],
      ["公式への受け渡し", "チケット、予約、購入、規則は主催者、ブランド、会場、チケットサイト側で確認します。"]
    ]
  }
};

const planningWorkflowCopy = {
  en: {
    aria: "How visitors use K-Spot Now",
    steps: [
      ["Find signal", "See what is live, ending soon, or worth planning before it disappears."],
      ["Verify visitor details", "Check dates, venue, weather, Korean map name, and nearby routes in one place."],
      ["Continue officially", "Move to the organizer, brand, venue, or ticketing page for the final action."]
    ]
  },
  es: {
    aria: "Como usan K-Spot Now los visitantes",
    steps: [
      ["Encuentra la senal", "Ve que esta activo, termina pronto o vale la pena planificar antes de que desaparezca."],
      ["Verifica detalles", "Consulta fechas, lugar, clima, nombre coreano para mapas y rutas cercanas en un solo lugar."],
      ["Continua oficialmente", "Pasa al organizador, marca, recinto o pagina de tickets para la accion final."]
    ]
  },
  fr: {
    aria: "Comment les visiteurs utilisent K-Spot Now",
    steps: [
      ["Reperez le signal", "Voyez ce qui est en cours, bientot termine ou utile a planifier avant disparition."],
      ["Verifiez les details", "Dates, lieu, meteo, nom coreen pour les cartes et itineraires proches sont regroupes."],
      ["Continuez officiellement", "Passez a l'organisateur, la marque, le lieu ou la billetterie pour l'action finale."]
    ]
  },
  de: {
    aria: "Wie Besucher K-Spot Now nutzen",
    steps: [
      ["Signal finden", "Sehen Sie, was live ist, bald endet oder rechtzeitig geplant werden sollte."],
      ["Details prufen", "Datum, Ort, Wetter, koreanischer Kartenname und nahe Routen stehen zusammen."],
      ["Offiziell fortfahren", "Gehen Sie fur die finale Aktion zum Veranstalter, zur Marke, zum Ort oder Ticketing."]
    ]
  },
  zh: {
    aria: "游客如何使用 K-Spot Now",
    steps: [
      ["发现信号", "查看正在进行、即将结束或值得提前规划的韩国活动。"],
      ["确认细节", "在同一处核对日期、场馆、天气、韩文地图名和附近路线。"],
      ["前往官方", "最后购买、预约或确认规则时，前往主办方、品牌、场馆或票务页面。"]
    ]
  },
  pt: {
    aria: "Como visitantes usam o K-Spot Now",
    steps: [
      ["Encontre o sinal", "Veja o que esta ao vivo, termina em breve ou merece planejamento antes de sumir."],
      ["Verifique detalhes", "Datas, local, clima, nome coreano para mapas e rotas proximas ficam juntos."],
      ["Continue no oficial", "Va ao organizador, marca, local ou pagina de tickets para a acao final."]
    ]
  },
  ru: {
    aria: "Как гости используют K-Spot Now",
    steps: [
      ["Найти сигнал", "Посмотрите, что идет сейчас, скоро закончится или стоит спланировать заранее."],
      ["Проверить детали", "Даты, место, погода, корейское название для карт и маршруты собраны вместе."],
      ["Перейти официально", "Для финального действия переходите к организатору, бренду, площадке или билетной странице."]
    ]
  },
  ja: {
    aria: "訪問者がK-Spot Nowを使う流れ",
    steps: [
      ["見つける", "開催中、終了間近、早めに計画したい韓国イベントを確認します。"],
      ["確認する", "日程、会場、天気、地図用の韓国語名、周辺ルートをまとめて見ます。"],
      ["公式へ進む", "購入、予約、最終ルール確認は主催者、ブランド、会場、チケットページで行います。"]
    ]
  }
};

function planningLayerSection(lang) {
  const copy = planningLayerCopy[lang] || planningLayerCopy.en;
  const flow = planningWorkflowCopy[lang] || planningWorkflowCopy.en;
  return `
      <section class="planning-layer" aria-labelledby="planning-layer-title">
        <div class="planning-layer-inner">
          <div class="planning-layer-lede">
            <p class="eyebrow">${esc(copy.eyebrow)}</p>
            <h2 id="planning-layer-title">${esc(copy.title)}</h2>
            <p>${esc(copy.text)}</p>
          </div>
          <div class="planning-layer-body">
            <div class="planning-flow" aria-label="${esc(flow.aria)}">
              ${flow.steps.map(([title, text], index) => `
                <div class="planning-flow-step">
                  <span>${String(index + 1).padStart(2, "0")}</span>
                  <strong>${esc(title)}</strong>
                  <p>${esc(text)}</p>
                </div>`).join("")}
            </div>
            <div class="planning-layer-grid">
              ${copy.items.map(([title, text], index) => `
                <div class="planning-card">
                  <span>${String(index + 1).padStart(2, "0")}</span>
                  <strong>${esc(title)}</strong>
                  <p>${esc(text)}</p>
                </div>`).join("")}
            </div>
          </div>
        </div>
      </section>`;
}

const serviceDifferenceCopy = {
  en: {
    eyebrow: "Planning desk vs listing page",
    title: "Why use this before NOL World or a ticket page?",
    text: "NOL World, ticketing, brand, tourism, and store pages are where visitors confirm or complete the final action. K-Spot Now is the planning desk before that: it compares fast-moving signals, adds trip context, and sends visitors to the right source when they are ready.",
    listingLabel: "Single-source listing",
    listingTitle: "Useful when you already know what to do",
    listingPoints: [
      "Shows one platform's inventory, listing, ticket, or campaign detail.",
      "Best for the final purchase, reservation, coupon, or organizer notice.",
      "Can be hard to compare with weather, nearby routes, and other source types."
    ],
    kspotLabel: "K-Spot Now",
    kspotTitle: "Useful before deciding where to go",
    kspotPoints: [
      "Combines tourism, brand, venue, duty-free, department-store, ticketing, and weather sources.",
      "Adds Korean map names, calendar files, weather, route ideas, and save-to-planner behavior.",
      "Labels source roles so visitors know whether the link is official, ticketing, listing, or offer information."
    ],
    proofs: [
      ["Compare", "Events, pop-ups, shopping offers, routes, and guides are grouped for visitor decisions."],
      ["Check", "Dates, last-checked labels, weather, and Korean place names stay visible before the handoff."],
      ["Continue", "The final action remains on the organizer, brand, venue, official source, or ticketing page."]
    ]
  },
  es: {
    eyebrow: "Planificador vs pagina de listado",
    title: "Por que usar esto antes de NOL World o una pagina de tickets?",
    text: "NOL World, ticketing, marcas, turismo y tiendas sirven para confirmar o completar la accion final. K-Spot Now es la mesa de planificacion previa: compara senales rapidas, agrega contexto de viaje y envia a la fuente correcta.",
    listingLabel: "Listado de una fuente",
    listingTitle: "Util cuando ya sabes que hacer",
    listingPoints: [
      "Muestra inventario, listado, ticket o campana de una plataforma.",
      "Mejor para compra, reserva, cupon o aviso final del organizador.",
      "No siempre facilita comparar clima, rutas cercanas y otros tipos de fuente."
    ],
    kspotLabel: "K-Spot Now",
    kspotTitle: "Util antes de decidir a donde ir",
    kspotPoints: [
      "Combina fuentes de turismo, marcas, recintos, duty-free, tiendas, tickets y clima.",
      "Agrega nombres coreanos para mapas, calendario, clima, rutas y plan guardado.",
      "Etiqueta el rol de cada fuente: oficial, ticketing, listado u oferta."
    ],
    proofs: [
      ["Comparar", "Eventos, pop-ups, ofertas, rutas y guias se agrupan para decidir."],
      ["Revisar", "Fechas, revision, clima y nombres coreanos quedan visibles antes del enlace final."],
      ["Continuar", "La accion final queda en organizador, marca, recinto, fuente oficial o ticketing."]
    ]
  },
  fr: {
    eyebrow: "Bureau de planification vs page de listing",
    title: "Pourquoi l'utiliser avant NOL World ou une billetterie ?",
    text: "NOL World, les billetteries, les marques, le tourisme et les magasins servent a confirmer ou finaliser l'action. K-Spot Now est le bureau de planification avant cela : comparer les signaux rapides, ajouter le contexte de voyage, puis envoyer vers la bonne source.",
    listingLabel: "Listing d'une source",
    listingTitle: "Utile quand vous savez deja quoi faire",
    listingPoints: [
      "Affiche l'inventaire, le listing, le ticket ou la campagne d'une plateforme.",
      "Ideal pour achat final, reservation, coupon ou avis d'organisateur.",
      "Moins pratique pour comparer meteo, itineraires proches et autres sources."
    ],
    kspotLabel: "K-Spot Now",
    kspotTitle: "Utile avant de decider ou aller",
    kspotPoints: [
      "Combine tourisme, marques, lieux, duty-free, grands magasins, ticketing et meteo.",
      "Ajoute noms coreens pour cartes, calendrier, meteo, itineraires et planning sauvegarde.",
      "Indique le role de la source : officielle, ticketing, listing ou offre."
    ],
    proofs: [
      ["Comparer", "Evenements, pop-ups, offres, itineraires et guides sont regroupes pour decider."],
      ["Verifier", "Dates, fraicheur, meteo et noms coreens restent visibles avant le lien final."],
      ["Continuer", "L'action finale reste chez l'organisateur, la marque, le lieu, la source officielle ou la billetterie."]
    ]
  },
  de: {
    eyebrow: "Planungsebene vs Listingseite",
    title: "Warum vor NOL World oder einer Ticketseite nutzen?",
    text: "NOL World, Ticketing-, Marken-, Tourismus- und Store-Seiten sind fur Bestatigung oder finale Aktion da. K-Spot Now ist die Planungsebene davor: schnelle Signale vergleichen, Reisekontext erganzen und Besucher zur richtigen Quelle weiterleiten.",
    listingLabel: "Einzelne Listingquelle",
    listingTitle: "Gut, wenn Sie schon wissen, was zu tun ist",
    listingPoints: [
      "Zeigt Inventar, Listing, Ticket oder Kampagne einer Plattform.",
      "Am besten fur Kauf, Reservierung, Coupon oder finale Veranstalterinfo.",
      "Vergleich mit Wetter, nahen Routen und anderen Quellentypen ist oft muhsam."
    ],
    kspotLabel: "K-Spot Now",
    kspotTitle: "Gut, bevor Sie entscheiden wohin",
    kspotPoints: [
      "Kombiniert Tourismus, Marken, Orte, Duty-free, Kaufhauser, Ticketing und Wetter.",
      "Erganzt koreanische Kartennamen, Kalender, Wetter, Routen und gespeicherte Planung.",
      "Kennzeichnet Quellenrollen: offiziell, Ticketing, Listing oder Angebot."
    ],
    proofs: [
      ["Vergleichen", "Events, Pop-ups, Angebote, Routen und Guides werden fur Entscheidungen gruppiert."],
      ["Prufen", "Daten, Aktualitat, Wetter und koreanische Ortsnamen bleiben vor dem Handoff sichtbar."],
      ["Fortfahren", "Die finale Aktion bleibt beim Veranstalter, der Marke, dem Ort, der offiziellen Quelle oder Ticketing."]
    ]
  },
  pt: {
    eyebrow: "Planejamento vs pagina de listagem",
    title: "Por que usar antes do NOL World ou de uma pagina de tickets?",
    text: "NOL World, ticketing, marcas, turismo e lojas servem para confirmar ou concluir a acao final. K-Spot Now e a mesa de planejamento anterior: compara sinais rapidos, adiciona contexto de viagem e envia para a fonte certa.",
    listingLabel: "Listagem de uma fonte",
    listingTitle: "Util quando voce ja sabe o que fazer",
    listingPoints: [
      "Mostra inventario, listagem, ticket ou campanha de uma plataforma.",
      "Melhor para compra, reserva, cupom ou aviso final do organizador.",
      "Pode dificultar comparar clima, rotas proximas e outros tipos de fonte."
    ],
    kspotLabel: "K-Spot Now",
    kspotTitle: "Util antes de decidir para onde ir",
    kspotPoints: [
      "Combina turismo, marcas, locais, duty-free, lojas, ticketing e clima.",
      "Adiciona nomes coreanos para mapas, calendario, clima, rotas e plano salvo.",
      "Rotula o papel da fonte: oficial, ticketing, listagem ou oferta."
    ],
    proofs: [
      ["Comparar", "Eventos, pop-ups, ofertas, rotas e guias ficam juntos para decidir."],
      ["Checar", "Datas, atualizacao, clima e nomes coreanos aparecem antes do link final."],
      ["Continuar", "A acao final continua no organizador, marca, local, fonte oficial ou ticketing."]
    ]
  }
};

function serviceDifferenceSection(lang) {
  const copy = serviceDifferenceCopy[lang] || serviceDifferenceCopy.en;
  const card = (label, title, points, tone) => `
              <article class="difference-card ${tone}">
                <span>${esc(label)}</span>
                <h3>${esc(title)}</h3>
                <ul>${points.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>
              </article>`;
  return `
      <section class="service-difference" aria-labelledby="service-difference-title">
        <div class="service-difference-inner">
          <div class="service-difference-head">
            <p class="eyebrow">${esc(copy.eyebrow)}</p>
            <h2 id="service-difference-title">${esc(copy.title)}</h2>
            <p>${esc(copy.text)}</p>
          </div>
          <div class="difference-grid">
            ${card(copy.listingLabel, copy.listingTitle, copy.listingPoints, "is-listing")}
            ${card(copy.kspotLabel, copy.kspotTitle, copy.kspotPoints, "is-kspot")}
          </div>
          <div class="difference-proof-grid" aria-label="K-Spot Now visitor workflow proof">
            ${copy.proofs.map(([title, text]) => `
              <div>
                <strong>${esc(title)}</strong>
                <p>${esc(text)}</p>
              </div>`).join("")}
          </div>
        </div>
      </section>`;
}

const detailHandoffText = {
  en: "Plan here, then complete tickets, reservations, purchases, and final rule checks on the official source.",
  es: "Planifica aqui y completa entradas, reservas, compras y reglas finales en la fuente oficial.",
  fr: "Planifiez ici, puis finalisez billets, reservations, achats et dernieres regles sur la source officielle.",
  de: "Planen Sie hier; Tickets, Reservierungen, Kaufe und finale Regeln erledigen Sie auf der offiziellen Quelle.",
  zh: "在这里规划，然后到官方来源完成购票、预约、购买和最终规则确认。",
  pt: "Planeje aqui e conclua ingressos, reservas, compras e regras finais na fonte oficial.",
  ru: "Планируйте здесь, а билеты, бронирование, покупки и финальные правила проверяйте в официальном источнике.",
  ja: "ここで計画し、チケット、予約、購入、最終ルール確認は公式情報で行ってください。"
};

function bookingHandoffNote(event, lang) {
  const base = detailHandoffText[lang] || detailHandoffText.en;
  if (sourceRoleType(event) === "official") return esc(base);
  return esc(`${base} ${sourceCopy(lang).finalText}`);
}

const sourceTransparencyCopy = {
  en: {
    title: "Source transparency",
    text: "K-Spot Now is the planning layer. The linked source is where visitors confirm tickets, reservations, inventory, operating rules, eligibility, and final notices.",
    kspotTitle: "K-Spot Now adds",
    kspotText: "Multilingual summary, weather, map-ready Korean place names, route ideas, calendar files, and saved-event comparison.",
    sourceTitle: "Linked source role",
    finalTitle: "Final check",
    finalText: "Use this page to decide and compare; use the linked source for the action that changes money, inventory, entry, or booking status.",
    roleOfficial: "Official source",
    roleTicketing: "Ticketing source",
    roleListing: "Listing / ticket source",
    roleOffer: "Offer source",
    descOfficial: "Organizer, brand, venue, tourism, or public-agency source used as the primary official reference.",
    descTicketing: "Ticketing or reservation source used for final entry, seat, sales, or booking rules.",
    descListing: "Listing or booking source used after manual review; K-Spot Now adds planning context and points visitors back for final action.",
    descOffer: "Brand, store, shopping, duty-free, or campaign source used for eligibility, stock, coupon, and purchase rules.",
    boundaryTitle: "Why this page before the linked source",
    boundaryGeneral: ({ sourceName }) => `Use ${sourceName} for the final notice. Use K-Spot Now first to keep weather, Korean map names, nearby routes, saved planning, and source-role checks in one visitor view.`,
    boundaryNol: "NOL World is the listing or ticket source for final details. K-Spot Now is the planning layer before that: weather, Korean map names, nearby routes, saved comparison, and source-role checks stay visible before you leave.",
    boundaryTicketing: ({ sourceName }) => `${sourceName} is where ticket inventory, account rules, pickup, refund, or seat details can change. K-Spot Now keeps the trip context visible before payment or reservation.`
  },
  es: {
    title: "Transparencia de fuente",
    text: "K-Spot Now es la capa de planificacion. La fuente enlazada confirma entradas, reservas, inventario, reglas, elegibilidad y avisos finales.",
    kspotTitle: "K-Spot Now agrega",
    kspotText: "Resumen multilingue, clima, nombre coreano para mapas, rutas, calendario y comparacion de eventos guardados.",
    sourceTitle: "Rol de la fuente",
    finalTitle: "Chequeo final",
    finalText: "Usa esta pagina para decidir y comparar; usa la fuente enlazada para pagos, stock, entrada o reservas.",
    roleOfficial: "Fuente oficial",
    roleTicketing: "Fuente de tickets",
    roleListing: "Listado / tickets",
    roleOffer: "Fuente de oferta",
    descOfficial: "Fuente de organizador, marca, venue, turismo o entidad publica usada como referencia principal.",
    descTicketing: "Fuente de tickets o reservas para reglas finales de entrada, asiento, venta o booking.",
    descListing: "Listado o booking revisado manualmente; K-Spot Now agrega contexto de planificacion.",
    descOffer: "Fuente de marca, tienda, duty-free o campana para elegibilidad, stock, cupones y compra.",
    boundaryTitle: "Por que esta pagina antes de la fuente enlazada",
    boundaryGeneral: ({ sourceName }) => `Usa ${sourceName} para el aviso final. Usa K-Spot Now antes para mantener clima, nombre coreano del mapa, rutas cercanas, plan guardado y rol de fuente en una vista.`,
    boundaryNol: "NOL World es la fuente de listado o ticket para detalles finales. K-Spot Now es la capa de planificacion anterior: clima, nombres coreanos, rutas cercanas, comparacion guardada y rol de fuente quedan visibles antes de salir.",
    boundaryTicketing: ({ sourceName }) => `${sourceName} es donde pueden cambiar inventario, cuenta, recogida, reembolso o asiento. K-Spot Now mantiene el contexto de viaje antes de pagar o reservar.`
  },
  zh: {
    title: "来源透明度",
    text: "K-Spot Now 是旅行规划层。最终门票、预约、库存、运营规则、资格和公告仍需在链接来源确认。",
    kspotTitle: "K-Spot Now 补充",
    kspotText: "多语言摘要、天气、韩文地图地点名、路线建议、日历文件和已保存活动比较。",
    sourceTitle: "链接来源角色",
    finalTitle: "最终确认",
    finalText: "在本站比较和决定；涉及付款、库存、入场或预约状态的操作请到链接来源完成。",
    roleOfficial: "官方来源",
    roleTicketing: "票务来源",
    roleListing: "列表 / 票务来源",
    roleOffer: "优惠来源",
    descOfficial: "主办方、品牌、场馆、旅游或公共机构页面，作为主要官方参考。",
    descTicketing: "票务或预约来源，用于确认最终入场、座位、销售或预约规则。",
    descListing: "经人工审核的列表或预订来源；K-Spot Now 补充旅行规划信息。",
    descOffer: "品牌、门店、免税店或活动来源，用于确认资格、库存、优惠券和购买规则。"
  },
  pt: {
    title: "Transparencia da fonte",
    text: "K-Spot Now e a camada de planejamento. A fonte linkada confirma ingressos, reservas, estoque, regras, elegibilidade e avisos finais.",
    kspotTitle: "K-Spot Now acrescenta",
    kspotText: "Resumo multilingue, clima, nome coreano para mapas, rotas, calendario e comparacao de eventos salvos.",
    sourceTitle: "Papel da fonte",
    finalTitle: "Cheque final",
    finalText: "Use esta pagina para decidir e comparar; use a fonte linkada para pagamento, estoque, entrada ou reserva.",
    roleOfficial: "Fonte oficial",
    roleTicketing: "Fonte de ingressos",
    roleListing: "Listagem / ingressos",
    roleOffer: "Fonte de oferta",
    descOfficial: "Fonte de organizador, marca, venue, turismo ou orgao publico usada como referencia principal.",
    descTicketing: "Fonte de ingressos ou reservas para regras finais de entrada, assento, venda ou booking.",
    descListing: "Listagem ou booking revisado manualmente; K-Spot Now acrescenta contexto de planejamento.",
    descOffer: "Fonte de marca, loja, duty-free ou campanha para elegibilidade, estoque, cupons e compra.",
    boundaryTitle: "Por que esta pagina antes da fonte linkada",
    boundaryGeneral: ({ sourceName }) => `Use ${sourceName} para o aviso final. Use K-Spot Now antes para manter clima, nome coreano no mapa, rotas proximas, plano salvo e papel da fonte em uma vista.`,
    boundaryNol: "NOL World e a fonte de listagem ou ingresso para detalhes finais. K-Spot Now e a camada de planejamento anterior: clima, nomes coreanos, rotas proximas, comparacao salva e papel da fonte ficam visiveis antes de sair.",
    boundaryTicketing: ({ sourceName }) => `${sourceName} e onde inventario, conta, retirada, reembolso ou assento podem mudar. K-Spot Now mantem o contexto de viagem antes de pagar ou reservar.`
  },
  ru: {
    title: "Прозрачность источника",
    text: "K-Spot Now является слоем планирования. По ссылке посетители подтверждают билеты, бронирование, наличие, правила, условия и финальные уведомления.",
    kspotTitle: "K-Spot Now добавляет",
    kspotText: "Многоязычное резюме, погоду, корейские названия для карт, маршруты, календарь и сравнение сохраненных событий.",
    sourceTitle: "Роль ссылки",
    finalTitle: "Финальная проверка",
    finalText: "Здесь удобно сравнить и решить; действия с оплатой, наличием, входом или бронированием выполняйте в источнике.",
    roleOfficial: "Официальный источник",
    roleTicketing: "Билетный источник",
    roleListing: "Листинг / билеты",
    roleOffer: "Источник оффера",
    descOfficial: "Организатор, бренд, площадка, туризм или госисточник как основная официальная ссылка.",
    descTicketing: "Билетная или резервная страница для правил входа, мест, продаж или бронирования.",
    descListing: "Листинг или booking после ручной проверки; K-Spot Now добавляет контекст планирования.",
    descOffer: "Бренд, магазин, duty-free или кампания для правил eligibility, stock, coupon и покупки."
  },
  ja: {
    title: "情報源の透明性",
    text: "K-Spot Nowは計画用レイヤーです。チケット、予約、在庫、運営ルール、対象条件、最終告知はリンク先で確認します。",
    kspotTitle: "K-Spot Nowが追加するもの",
    kspotText: "多言語要約、天気、韓国語の地図検索名、ルート案、カレンダー、保存イベント比較。",
    sourceTitle: "リンク先の役割",
    finalTitle: "最終確認",
    finalText: "このページで比較・判断し、支払い、在庫、入場、予約に関わる操作はリンク先で行います。",
    roleOfficial: "公式情報",
    roleTicketing: "チケット情報",
    roleListing: "リスティング / チケット情報",
    roleOffer: "キャンペーン情報",
    descOfficial: "主催者、ブランド、会場、観光、公的機関などの一次情報です。",
    descTicketing: "入場、座席、販売、予約ルールを確認するチケット・予約情報です。",
    descListing: "手動確認済みのリスティングまたは予約情報で、K-Spot Nowが計画情報を補います。",
    descOffer: "ブランド、店舗、免税店、キャンペーンの対象条件、在庫、クーポン、購入ルールの情報です。"
  },
  fr: {
    title: "Transparence des sources",
    text: "K-Spot Now est la couche de planification. La source liee confirme billets, reservations, stock, regles, eligibilite et avis finaux.",
    kspotTitle: "K-Spot Now ajoute",
    kspotText: "Resume multilingue, meteo, noms coreens pour cartes, trajets, calendrier et comparaison d'evenements enregistres.",
    sourceTitle: "Role de la source liee",
    finalTitle: "Verification finale",
    finalText: "Utilisez cette page pour comparer; utilisez la source liee pour paiement, stock, entree ou reservation.",
    roleOfficial: "Source officielle",
    roleTicketing: "Source billetterie",
    roleListing: "Listing / billetterie",
    roleOffer: "Source d'offre",
    descOfficial: "Organisateur, marque, lieu, tourisme ou source publique utilisee comme reference officielle principale.",
    descTicketing: "Billetterie ou reservation pour les regles finales d'entree, places, ventes ou booking.",
    descListing: "Listing ou booking revu manuellement; K-Spot Now ajoute le contexte de planification.",
    descOffer: "Marque, magasin, duty-free ou campagne pour eligibilite, stock, coupons et achat.",
    boundaryTitle: "Pourquoi cette page avant la source liee",
    boundaryGeneral: ({ sourceName }) => `Utilisez ${sourceName} pour l'avis final. Utilisez K-Spot Now avant pour garder meteo, nom coreen de carte, trajets proches, planning sauvegarde et role de source dans une seule vue.`,
    boundaryNol: "NOL World est la source de listing ou billetterie pour les details finaux. K-Spot Now est la couche de planification avant cela : meteo, noms coreens, trajets proches, comparaison sauvegardee et role de source restent visibles avant de partir.",
    boundaryTicketing: ({ sourceName }) => `${sourceName} est l'endroit ou stock, compte, retrait, remboursement ou siege peuvent changer. K-Spot Now garde le contexte de voyage avant paiement ou reservation.`
  },
  de: {
    title: "Quellentransparenz",
    text: "K-Spot Now ist die Planungsebene. Die verlinkte Quelle bestatigt Tickets, Reservierungen, Bestand, Regeln, Berechtigung und finale Hinweise.",
    kspotTitle: "K-Spot Now erganzt",
    kspotText: "Mehrsprachige Zusammenfassung, Wetter, koreanische Kartennamen, Routen, Kalender und Vergleich gespeicherter Events.",
    sourceTitle: "Rolle der verlinkten Quelle",
    finalTitle: "Finaler Check",
    finalText: "Hier vergleichen und entscheiden; Zahlung, Bestand, Eintritt oder Buchung in der verlinkten Quelle abschliessen.",
    roleOfficial: "Offizielle Quelle",
    roleTicketing: "Ticketquelle",
    roleListing: "Listing / Ticketquelle",
    roleOffer: "Angebotsquelle",
    descOfficial: "Veranstalter, Marke, Ort, Tourismus oder offentliche Stelle als wichtigste offizielle Referenz.",
    descTicketing: "Ticket- oder Reservierungsquelle fur Eintritt, Sitzplatz, Verkauf oder Buchungsregeln.",
    descListing: "Manuell gepruftes Listing oder Booking; K-Spot Now erganzt Planungskontext.",
    descOffer: "Marke, Store, Duty-free oder Kampagne fur Berechtigung, Bestand, Coupons und Kaufregeln.",
    boundaryTitle: "Warum diese Seite vor der verlinkten Quelle",
    boundaryGeneral: ({ sourceName }) => `Nutzen Sie ${sourceName} fur den finalen Hinweis. Nutzen Sie K-Spot Now zuerst, damit Wetter, koreanische Kartennamen, nahe Routen, gespeicherte Planung und Quellenrolle in einer Besucheransicht bleiben.`,
    boundaryNol: "NOL World ist die Listing- oder Ticketquelle fur finale Details. K-Spot Now ist die Planungsebene davor: Wetter, koreanische Kartennamen, nahe Routen, gespeicherter Vergleich und Quellenrolle bleiben vor dem Wechsel sichtbar.",
    boundaryTicketing: ({ sourceName }) => `${sourceName} ist die Stelle, an der Bestand, Konto, Abholung, Erstattung oder Sitzdetails wechseln konnen. K-Spot Now halt den Reisekontext vor Zahlung oder Reservierung sichtbar.`
  }
};

function sourceRoleType(event) {
  const haystack = [event.sourceName, event.sourceUrl, event.verification, event.collectionMode].join(" ").toLowerCase();
  if (haystack.includes("world.nol.com") || haystack.includes("nol world")) return "listing";
  if (/\b(ticket|ticketing|ticketlink|yes24|melon)\b/.test(haystack) || event.eventKind === "concert") return "ticketing";
  if (["beauty", "shopping", "duty-free", "department-store", "travel-benefits"].includes(event.category)) return "offer";
  return "official";
}

function sourceCopy(lang) {
  return sourceTransparencyCopy[lang] || sourceTransparencyCopy.en;
}

function sourceRoleLabel(event, lang) {
  const copy = sourceCopy(lang);
  const role = sourceRoleType(event);
  return role === "listing" ? copy.roleListing : role === "ticketing" ? copy.roleTicketing : role === "offer" ? copy.roleOffer : copy.roleOfficial;
}

function sourceRoleDescription(event, lang) {
  const copy = sourceCopy(lang);
  const role = sourceRoleType(event);
  return role === "listing" ? copy.descListing : role === "ticketing" ? copy.descTicketing : role === "offer" ? copy.descOffer : copy.descOfficial;
}

function sourceBoundaryText(event, lang) {
  const copy = sourceCopy(lang);
  if (!copy.boundaryTitle) return "";
  const role = sourceRoleType(event);
  const sourceName = event.sourceName || sourceRoleLabel(event, lang);
  if (role === "listing") return copy.boundaryNol;
  if (role === "ticketing") return copy.boundaryTicketing({ sourceName });
  return copy.boundaryGeneral({ sourceName });
}

function sourceTransparencySection(event, lang) {
  const copy = sourceCopy(lang);
  const boundaryText = sourceBoundaryText(event, lang);
  return `
        <section class="detail-section source-transparency-section" aria-labelledby="source-transparency-title">
          <div class="detail-section-head">
            <div>
              <p class="eyebrow">${esc(sourceRoleLabel(event, lang))}</p>
              <h2 id="source-transparency-title">${esc(copy.title)}</h2>
            </div>
            <p>${esc(copy.text)}</p>
          </div>
          <div class="source-transparency-grid">
            <div>
              <span>01</span>
              <strong>${esc(copy.kspotTitle)}</strong>
              <p>${esc(copy.kspotText)}</p>
            </div>
            <div>
              <span>02</span>
              <strong>${esc(copy.sourceTitle)}</strong>
              <p>${esc(sourceRoleDescription(event, lang))}</p>
              <em>${esc(event.sourceName)}</em>
            </div>
            <div>
              <span>03</span>
              <strong>${esc(copy.finalTitle)}</strong>
              <p>${esc(copy.finalText)}</p>
            </div>
          </div>
          ${boundaryText ? `
          <div class="source-boundary-callout">
            <strong>${esc(copy.boundaryTitle)}</strong>
            <p>${esc(boundaryText)}</p>
          </div>` : ""}
        </section>`;
}

const localizedBriefCopy = {
  fr: {
    eyebrow: "Francais",
    title: "Brief visiteur localise",
    intro: "Le titre officiel est conserve pour faciliter la recherche, mais le contexte de decision est explique en francais avec dates, lieu, source et action finale.",
    decisionTitle: "Pourquoi regarder cette fiche",
    planTitle: "Ce qu'il faut verifier",
    handoffTitle: "Ou finaliser",
    planText: ({ period, venue, mapQuery }) => `Periode: ${period}. Lieu: ${venue}. Recherchez le nom coreen ${mapQuery} dans les cartes locales avant de partir.`,
    handoffText: ({ sourceRole, sourceName }) => `Cette fiche prepare la decision; ${sourceRole} (${sourceName}) reste la page a ouvrir pour billets, reservation, achat, stock ou regles finales.`,
    originalName: "Nom officiel a copier"
  },
  de: {
    eyebrow: "Deutsch",
    title: "Lokales Besucherbriefing",
    intro: "Der offizielle Titel bleibt fur Suche und Karten erhalten, aber der Entscheidungskontext wird auf Deutsch mit Datum, Ort, Quelle und finaler Aktion erklaert.",
    decisionTitle: "Warum diese Seite wichtig ist",
    planTitle: "Was vor dem Start zu prufen ist",
    handoffTitle: "Wo final handeln",
    planText: ({ period, venue, mapQuery }) => `Zeitraum: ${period}. Ort: ${venue}. Suchen Sie den koreanischen Ortsnamen ${mapQuery} vor der Abfahrt in lokalen Karten.`,
    handoffText: ({ sourceRole, sourceName }) => `Diese Seite bereitet die Entscheidung vor; ${sourceRole} (${sourceName}) bleibt die Seite fur Tickets, Reservierung, Kauf, Bestand oder finale Regeln.`,
    originalName: "Offiziellen Namen kopieren"
  }
};

const localizedCategoryPurpose = {
  fr: {
    kpop: "Les evenements K-pop, pop-ups et cafes anniversaires changent vite; cette page aide a comparer entree, files, stock, reservations et source avant de vous deplacer.",
    festival: "Les festivals dependent beaucoup de la meteo, du transport et des horaires; cette page transforme l'annonce en plan de visite plus concret.",
    beauty: "Les offres beaute peuvent changer selon stock, coupon, branche et heure; cette page aide a verifier avant d'ajouter l'arret a votre trajet.",
    shopping: "Les pages shopping sont utiles quand elles relient offre, quartier, horaires et alternative proche avant l'achat final.",
    "duty-free": "Les offres duty-free dependent du passeport, depart, retrait et limites; cette page sert de checklist avant paiement.",
    "department-store": "Les evenements de grands magasins changent par branche et etage; cette page clarifie lieu, dates et suite officielle.",
    "travel-benefits": "Les avantages voyage dependent souvent d'eligibilite, quota et region; cette page aide a verifier avant de planifier autour de la reduction."
  },
  de: {
    kpop: "K-pop Events, Pop-ups und Birthday-Cafes andern sich schnell; diese Seite hilft bei Eintritt, Warteschlange, Bestand, Reservierung und Quellencheck.",
    festival: "Festivals hangen stark von Wetter, Verkehr und Programmzeiten ab; diese Seite macht aus der Meldung einen konkreteren Besuchsplan.",
    beauty: "Beauty-Angebote konnen je nach Bestand, Coupon, Filiale und Uhrzeit wechseln; diese Seite hilft beim Prufen vor dem Umweg.",
    shopping: "Shopping-Seiten sind nutzlich, wenn Angebot, Stadtteil, Zeiten und nahe Alternativen vor dem finalen Kauf zusammenkommen.",
    "duty-free": "Duty-free Angebote hangen von Pass, Abflug, Abholung und Limits ab; diese Seite dient als Checkliste vor der Zahlung.",
    "department-store": "Kaufhaus-Events wechseln nach Filiale und Etage; diese Seite ordnet Ort, Daten und offizielle Folgeseite.",
    "travel-benefits": "Reisevorteile hangen oft von Berechtigung, Kontingent und Region ab; diese Seite hilft vor der Planung um einen Rabatt."
  }
};

function localizedStatusAdvice(event, lang) {
  const status = statusOf(event);
  if (lang === "fr") {
    if (status === "live") return "La fiche est active: recontrolez la source le jour meme avant de changer votre itineraire.";
    if (status === "upcoming") return "La fiche est a venir: enregistrez-la, comparez la meteo et verifiez les regles proches de la date.";
    return "La fiche est archivee: utilisez-la comme repere saisonnier et cherchez la prochaine edition avant de planifier.";
  }
  if (status === "live") return "Die Seite ist live: Prufen Sie die Quelle am selben Tag erneut, bevor Sie Ihre Route andern.";
  if (status === "upcoming") return "Die Seite ist bevorstehend: Speichern, Wetter vergleichen und Regeln kurz vor dem Datum erneut prufen.";
  return "Die Seite ist archiviert: Nutzen Sie sie als saisonalen Vergleich und suchen Sie vor der Planung die nachste Ausgabe.";
}

function localizedVisitorBriefSection(event, lang) {
  const copy = localizedBriefCopy[lang];
  if (!copy) return "";
  const categoryPurpose = localizedCategoryPurpose[lang]?.[event.category] || localizedCategoryPurpose[lang]?.festival || "";
  const period = event.dateLabel || `${dateText(lang, event.startDate)} - ${dateText(lang, event.endDate)}`;
  const venue = [event.venue, event.district, event.city].filter(Boolean).join(", ");
  const data = {
    period,
    venue,
    mapQuery: event.mapQueryKo,
    sourceRole: sourceRoleLabel(event, lang),
    sourceName: event.sourceName
  };
  const cards = [
    [copy.decisionTitle, `${categoryPurpose} ${localizedStatusAdvice(event, lang)}`],
    [copy.planTitle, copy.planText(data)],
    [copy.handoffTitle, copy.handoffText(data)]
  ];
  return `
        <section class="detail-section localized-visitor-brief" aria-labelledby="localized-brief-title">
          <div class="detail-section-head">
            <div>
              <p class="eyebrow">${esc(copy.eyebrow)}</p>
              <h2 id="localized-brief-title">${esc(copy.title)}</h2>
            </div>
            <p>${esc(copy.intro)}</p>
          </div>
          <div class="localized-brief-grid">
            ${cards.map(([title, text], index) => `
              <article>
                <span>${String(index + 1).padStart(2, "0")}</span>
                <strong>${esc(title)}</strong>
                <p>${esc(text)}</p>
              </article>`).join("")}
          </div>
          <p class="localized-original-name"><strong>${esc(copy.originalName)}:</strong> ${esc(local(event.title, "en") || event.slug)}</p>
        </section>`;
}

const visitorActionCopy = {
  en: {
    title: "Visit-ready checklist",
    officialTitle: "Confirm on the official page",
    officialText: "Use the source below for final tickets, reservations, purchases, operating rules, and entry notices.",
    mapTitle: "Search the Korean place name",
    mapText: "Copy this place name into Google, Naver, or Kakao Maps for cleaner local results.",
    planTitle: "Keep the plan movable",
    planText: "Save the event or calendar file, then recheck weather and official notices before leaving."
  },
  es: {
    title: "Lista antes de visitar",
    officialTitle: "Confirma en la pagina oficial",
    officialText: "Usa la fuente oficial para entradas, reservas, compras, reglas de operacion y avisos de entrada.",
    mapTitle: "Busca el nombre coreano",
    mapText: "Copia este nombre en Google, Naver o Kakao Maps para mejores resultados locales.",
    planTitle: "Mantén el plan flexible",
    planText: "Guarda el evento o calendario y vuelve a revisar clima y avisos oficiales antes de salir."
  },
  fr: {
    title: "Checklist avant visite",
    officialTitle: "Confirmez sur la page officielle",
    officialText: "Utilisez la source officielle pour billets, reservations, achats, regles d'ouverture et avis d'entree.",
    mapTitle: "Cherchez le nom coreen",
    mapText: "Copiez ce nom dans Google, Naver ou Kakao Maps pour de meilleurs resultats locaux.",
    planTitle: "Gardez le plan flexible",
    planText: "Sauvegardez l'evenement ou le calendrier, puis reverifiez meteo et avis officiels avant de partir."
  },
  de: {
    title: "Besuchs-Checkliste",
    officialTitle: "Auf der offiziellen Seite bestatigen",
    officialText: "Nutzen Sie die offizielle Quelle fur Tickets, Reservierungen, Kaufe, Betriebsregeln und Eintrittshinweise.",
    mapTitle: "Koreanischen Ortsnamen suchen",
    mapText: "Kopieren Sie diesen Namen in Google, Naver oder Kakao Maps fur bessere lokale Ergebnisse.",
    planTitle: "Plan beweglich halten",
    planText: "Speichern Sie Event oder Kalenderdatei und prufen Sie Wetter und offizielle Hinweise vor dem Start erneut."
  },
  zh: {
    title: "出发前检查清单",
    officialTitle: "在官方页面确认",
    officialText: "门票、预约、购买、运营规则和入场公告请以官方来源为准。",
    mapTitle: "搜索韩文地点名",
    mapText: "把这个名称复制到 Google、Naver 或 Kakao 地图，可获得更准确的本地结果。",
    planTitle: "保持行程灵活",
    planText: "保存活动或日历文件，出发前再次确认天气和官方公告。"
  },
  pt: {
    title: "Checklist antes da visita",
    officialTitle: "Confirme na pagina oficial",
    officialText: "Use a fonte oficial para ingressos, reservas, compras, regras de operacao e avisos de entrada.",
    mapTitle: "Pesquise o nome coreano",
    mapText: "Copie este nome no Google, Naver ou Kakao Maps para resultados locais mais limpos.",
    planTitle: "Mantenha o plano flexivel",
    planText: "Salve o evento ou calendario e confira clima e avisos oficiais antes de sair."
  },
  ru: {
    title: "Чеклист перед визитом",
    officialTitle: "Проверьте официальную страницу",
    officialText: "Билеты, бронирования, покупки, правила работы и входа подтверждайте в официальном источнике.",
    mapTitle: "Ищите корейское название места",
    mapText: "Скопируйте это название в Google, Naver или Kakao Maps для более точных местных результатов.",
    planTitle: "Оставьте план гибким",
    planText: "Сохраните событие или календарь, затем перед выходом проверьте погоду и официальные уведомления."
  },
  ja: {
    title: "訪問前チェックリスト",
    officialTitle: "公式ページで確認",
    officialText: "チケット、予約、購入、運営ルール、入場案内は公式情報で最終確認します。",
    mapTitle: "韓国語の場所名で検索",
    mapText: "この名称をGoogle、Naver、Kakao Mapsにコピーすると現地検索が安定します。",
    planTitle: "予定を動かせる状態に",
    planText: "イベントやカレンダーを保存し、出発前に天気と公式案内を再確認します。"
  }
};

function visitorActionChecklist(event, lang) {
  const copy = visitorActionCopy[lang] || visitorActionCopy.en;
  const sourceName = event.sourceName || "official source";
  return `
        <section class="detail-section visitor-action-section" aria-labelledby="visitor-action-title">
          <div class="detail-section-head">
            <div>
              <p class="eyebrow">${tr(lang, "plannerTitle")}</p>
              <h2 id="visitor-action-title">${esc(copy.title)}</h2>
            </div>
          </div>
          <div class="visitor-action-grid">
            <article>
              <span>01</span>
              <strong>${esc(copy.officialTitle)}</strong>
              <p>${esc(copy.officialText)}</p>
              <em>${esc(sourceName)}</em>
            </article>
            <article>
              <span>02</span>
              <strong>${esc(copy.mapTitle)}</strong>
              <p>${esc(copy.mapText)}</p>
              <em>${esc(event.mapQueryKo)}</em>
            </article>
            <article>
              <span>03</span>
              <strong>${esc(copy.planTitle)}</strong>
              <p>${esc(copy.planText)}</p>
              <em>${esc(event.dateLabel || `${event.startDate} - ${event.endDate}`)}</em>
            </article>
          </div>
        </section>`;
}

function renderHome(lang, canonicalPath = `/${lang}/`) {
  const sorted = [...events].sort((a, b) => {
    const statusWeight = { live: 0, upcoming: 1, ended: 2 };
    return statusWeight[statusOf(a)] - statusWeight[statusOf(b)] || b.priority - a.priority;
  });
  const liveCount = events.filter((event) => statusOf(event) === "live").length;
  const upcomingCount = events.filter((event) => statusOf(event) === "upcoming").length;
  const archiveCount = events.filter((event) => statusOf(event) === "ended").length;
  const spotlights = spotlightEvents(sorted);
  const homePageTitle = local({
    en: `${siteName} - Events, K-pop Pop-ups, Shopping Deals`,
    fr: `${siteName} - Evenements, pop-ups K-pop et offres shopping`,
    de: `${siteName} - Events, K-pop Pop-ups und Shopping-Deals`
  }, lang);
  const eventsHeading = local({
    en: siteTagline,
    fr: "Evenements, pop-ups et offres en Coree pour les visiteurs.",
    de: "Korea-Events, Pop-ups und Deals fur Besucher."
  }, lang);
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
            ${spotlightCarousel(spotlights, lang)}
            <dl class="service-summary" aria-label="Event status summary">
              <div><dt>${tr(lang, "liveNow")}</dt><dd>${liveCount}</dd></div>
              <div><dt>${tr(lang, "upcoming")}</dt><dd>${upcomingCount}</dd></div>
              <div><dt>${tr(lang, "archive")}</dt><dd>${archiveCount}</dd></div>
              <div><dt>${tr(lang, "navGuides")}</dt><dd>${guides.length}</dd></div>
            </dl>
          </div>
        </div>
      </section>
      ${planningLayerSection(lang)}
      ${serviceDifferenceSection(lang)}
      ${adUnit("home")}

      <section class="content-shell" id="events" data-gallery-scope>
        <div class="section-head">
          <div>
            <p class="eyebrow">${tr(lang, "navEvents")}</p>
            <h2>${esc(eventsHeading)}</h2>
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
          <p class="eyebrow">${tr(lang, "routePages")}</p>
          <h2>${tr(lang, "routePages")}</h2>
          <p>${esc(local({
            en: "Pair saved events with nearby shopping, transit, weather, and short route ideas before leaving.",
            es: "Combina eventos guardados con compras, transporte, clima y rutas cortas antes de salir.",
            fr: "Associez les evenements enregistres avec shopping, transport, meteo et courts itineraires avant de partir.",
            de: "Kombinieren Sie gespeicherte Events vor der Abfahrt mit Shopping, Verkehr, Wetter und kurzen Routenideen.",
            zh: "出发前把保存的活动与附近购物、交通、天气和短路线一起比较。",
            pt: "Combine eventos salvos com compras, transporte, clima e roteiros curtos antes de sair.",
            ru: "Перед выходом сопоставьте сохраненные события с ближайшим шопингом, транспортом, погодой и короткими маршрутами.",
            ja: "保存したイベントを周辺の買い物、移動、天気、短いモデルルートと一緒に確認できます。"
          }, lang))}</p>
          <a class="text-link" href="/${lang}/routes/">${tr(lang, "routePages")}</a>
        </div>
      </section>
    </main>`;

  return layout({
    lang,
    title: homePageTitle,
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
  const meta = categoryPageCopy(lang, category);
  const items = events
    .filter((event) => event.category === category)
    .sort((a, b) => {
      const statusWeight = { live: 0, upcoming: 1, ended: 2 };
      return statusWeight[statusOf(a)] - statusWeight[statusOf(b)] || b.priority - a.priority;
    });
  const title = meta.title;
  const description = meta.description;
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
  const meta = cityPageCopy(lang, city);
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
            ${calendarMonthHeading(lang, key)}
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

function calendarMonthHeading(lang, key) {
  const [year] = key.split("-");
  const date = new Date(`${key}-01T00:00:00Z`);
  const monthName = new Intl.DateTimeFormat(languages[lang]?.locale || "en-US", { month: "long", timeZone: "UTC" }).format(date);
  return `<h2 class="calendar-month-heading"><span>${esc(monthName)}</span> <span>${esc(year || "")}</span></h2>`;
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
    <main class="page" data-planner-page data-open-label="${esc(tr(lang, "openSavedEvent"))}" data-official-label="${esc(tr(lang, "officialLabel"))}" data-remove-label="${esc(tr(lang, "removeSaved"))}" data-map-label="${esc(tr(lang, "cardPlanMap"))}" data-google-label="${esc(tr(lang, "googleMap"))}" data-naver-label="${esc(tr(lang, "naverMap"))}" data-kakao-label="${esc(tr(lang, "kakaoMap"))}">
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
      <section class="planner-utility" aria-label="${esc(tr(lang, "cardPlanTools"))}">
        <article>
          <span>${esc(tr(lang, "cardPlanCalendar"))}</span>
          <strong>${esc(tr(lang, "downloadSavedCalendar"))}</strong>
          <p>${esc(tr(lang, "calendarText"))}</p>
        </article>
        <article>
          <span>${esc(tr(lang, "cardPlanMap"))}</span>
          <strong>${esc(tr(lang, "mapLinksTitle"))}</strong>
          <p>${esc(tr(lang, "mapNote"))}</p>
        </article>
        <article>
          <span>${esc(tr(lang, "official"))}</span>
          <strong>${esc(tr(lang, "verifyBefore"))}</strong>
          <p>${esc(tr(lang, "sourceWarning"))}</p>
        </article>
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
  const description = eventSummaryText(event, lang);
  const periodText = event.dateLabel || `${event.startDate} - ${event.endDate}`;
  const venueText = [event.venue, event.district].filter(Boolean).join(", ");
  const body = `
    <main class="page">
      <article class="detail-layout">
        <header class="detail-hero">
          <img src="/${esc(event.thumbnail)}" alt="${esc(local(event.title, lang))}">
          <div>
            <p class="eyebrow">${categoryLabel(lang, event.category)} · ${statusLabel(lang, status)}</p>
            <h1>${esc(local(event.title, lang))}</h1>
            <p>${esc(description)}</p>
            <div class="detail-actions">
              <a class="button primary" href="${esc(event.sourceUrl)}" rel="nofollow noopener" target="_blank">${esc(sourceRoleLabel(event, lang))}</a>
              <a class="button light" href="/events/${event.slug}.ics">${tr(lang, "downloadCalendar")}</a>
              ${saveEventButton(event, lang)}
            </div>
            <p class="handoff-note">${bookingHandoffNote(event, lang)}</p>
          </div>
        </header>

        <section class="fact-grid" aria-label="Event facts">
          ${fact(tr(lang, "period"), periodText, "calendar")}
          ${fact(tr(lang, "venue"), venueText, "pin")}
          ${fact(tr(lang, "location"), event.city, "place")}
          ${fact(tr(lang, "lastChecked"), dateText(lang, event.lastChecked), "check")}
          ${fact(tr(lang, "freshness"), `<span class="freshness-chip ${esc(freshness.tone)}">${esc(freshness.text)}</span>`, "pulse", true)}
          ${fact(tr(lang, "verification"), prettyVerification(event.verification, lang), "shield")}
          ${fact(tr(lang, "collectionMode"), prettyCollectionMode(event.collectionMode, lang), "review")}
          ${eventKindLabel(event, lang) ? fact(tr(lang, "dateBasis"), eventKindLabel(event, lang), "basis") : ""}
        </section>

        ${visitorActionChecklist(event, lang)}
        ${sourceTransparencySection(event, lang)}
        ${localizedVisitorBriefSection(event, lang)}
        ${visitorInfoSection(event, lang)}

        <section class="detail-section">
          <h2>${tr(lang, "readDetails")}</h2>
          <p>${esc(eventWhyGoText(event, lang))}</p>
          <p class="notice">${tr(lang, "verifyBefore")}</p>
        </section>
        ${adUnit("detail")}

        <section class="detail-section weather-detail-section">
          ${weatherPlanInner(lang, forecastInfo, weatherInfo)}
        </section>

        <section class="detail-section travel-ideas-section">
          <h2>${tr(lang, "travelIdeas")}</h2>
          <ul>${eventTravelTips(event, lang).map((tip) => `<li>${esc(tip)}</li>`).join("")}</ul>
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

function prettyCollectionMode(value, lang = "en") {
  const raw = String(value || "").trim();
  const labels = {
    "manual-reviewed-official-page": tr(lang, "collectionOfficialPageReview"),
    "official-page-monitor": tr(lang, "collectionOfficialPageMonitor"),
    "official-api": tr(lang, "collectionOfficialApi"),
    "official-page": tr(lang, "collectionOfficialPage")
  };
  return labels[raw] || titleCaseWords(raw);
}

function prettyVerification(value, lang = "en") {
  const raw = String(value || "").trim();
  const labels = {
    official: tr(lang, "verificationOfficial"),
    "official-ended": tr(lang, "verificationOfficialArchive"),
    "official-listing": tr(lang, "verificationOfficialListing")
  };
  if (labels[raw]) return labels[raw];
  if (raw.startsWith("official-")) return `${tr(lang, "verificationOfficialPrefix")} ${titleCaseWords(raw.replace(/^official-/, "")).toLowerCase()}`;
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
      <strong>${esc(guideTitleText(guide, lang))}</strong>
      <p>${esc(guideSummaryText(guide, lang))}</p>
    </a>`;
}

const guidePlanningCopy = {
  en: {
    eyebrow: "Visitor workflow",
    title: "Use this guide with live event data",
    text: "Each guide is connected to current listings, official-source examples, and route ideas so visitors can plan here and complete final action on the official page.",
    patternTitle: "Compare the pattern",
    patternText: ({ category, eventCount }) => `Use the guide while scanning ${eventCount} checked ${category} listings, not as a standalone blog post.`,
    sourceTitle: "Open official proof",
    sourceText: ({ sourceCount }) => `${sourceCount} matching official-source examples are surfaced below as starting points for final rules, tickets, reservations, or purchases.`,
    routeTitle: "Plan the local move",
    routeText: ({ routeCount }) => `${routeCount} related route ideas help turn the guide into a realistic Seoul or Korea visitor plan.`,
    relatedTitle: "Related events to compare",
    relatedText: "Use these listings to test the guide against real dates, cities, weather, map names, and official links.",
    routesTitle: "Route ideas for this guide",
    routesText: "These are not fixed tours; they are low-friction visitor patterns to compare with the event location and weather.",
    sourcesTitle: "Official-source starting points",
    sourcesText: "K-Spot Now helps you compare and prepare. Tickets, reservations, purchases, operating rules, and eligibility still belong on the official source.",
    viewAll: "View all in this category"
  },
  es: {
    eyebrow: "Flujo del visitante",
    title: "Usa esta guia con eventos vivos",
    text: "Cada guia se conecta con listados actuales, ejemplos de fuentes oficiales e ideas de ruta para planificar aqui y finalizar en la pagina oficial.",
    patternTitle: "Compara el patron",
    patternText: ({ category, eventCount }) => `Usa la guia mientras revisas ${eventCount} listados ${category} verificados, no como un articulo aislado.`,
    sourceTitle: "Abre la prueba oficial",
    sourceText: ({ sourceCount }) => `${sourceCount} ejemplos de fuente oficial sirven como punto de partida para reglas, entradas, reservas o compras.`,
    routeTitle: "Planea el movimiento local",
    routeText: ({ routeCount }) => `${routeCount} ideas de ruta relacionadas convierten la guia en un plan realista para visitantes.`,
    relatedTitle: "Eventos relacionados para comparar",
    relatedText: "Compara fechas, ciudades, clima, nombres de mapa y enlaces oficiales con eventos reales.",
    routesTitle: "Ideas de ruta para esta guia",
    routesText: "No son tours fijos; son patrones faciles de adaptar al lugar y al clima.",
    sourcesTitle: "Puntos de partida oficiales",
    sourcesText: "K-Spot Now ayuda a comparar y preparar. Entradas, reservas, compras, reglas y elegibilidad se confirman en la fuente oficial.",
    viewAll: "Ver toda la categoria"
  },
  zh: {
    eyebrow: "访客流程",
    title: "结合实时活动使用本指南",
    text: "每篇指南都会连接当前活动、官方来源示例和路线建议，方便先规划，再到官方页面完成最终操作。",
    patternTitle: "比较活动模式",
    patternText: ({ category, eventCount }) => `请配合 ${eventCount} 个已核查的${category}条目使用，而不是只当作单篇文章。`,
    sourceTitle: "打开官方凭证",
    sourceText: ({ sourceCount }) => `下方列出 ${sourceCount} 个相关官方来源，可用于确认规则、门票、预约或购买信息。`,
    routeTitle: "规划当地移动",
    routeText: ({ routeCount }) => `${routeCount} 个相关路线想法可帮助把指南变成可执行的韩国旅行计划。`,
    relatedTitle: "可比较的相关活动",
    relatedText: "用真实日期、城市、天气、韩文地点名和官方链接来验证这篇指南。",
    routesTitle: "本指南相关路线",
    routesText: "这些不是固定行程，而是可根据地点和天气调整的低负担路线模式。",
    sourcesTitle: "官方来源起点",
    sourcesText: "K-Spot Now 用于比较和准备。门票、预约、购买、运营规则和资格仍需以官方来源为准。",
    viewAll: "查看该类别全部"
  },
  pt: {
    eyebrow: "Fluxo do visitante",
    title: "Use este guia com eventos atuais",
    text: "Cada guia se conecta a listagens atuais, exemplos de fontes oficiais e ideias de rota para planejar aqui e finalizar na pagina oficial.",
    patternTitle: "Compare o padrao",
    patternText: ({ category, eventCount }) => `Use o guia junto com ${eventCount} listagens ${category} verificadas, nao como um artigo isolado.`,
    sourceTitle: "Abra a prova oficial",
    sourceText: ({ sourceCount }) => `${sourceCount} exemplos de fonte oficial ajudam a confirmar regras, ingressos, reservas ou compras.`,
    routeTitle: "Planeje o deslocamento",
    routeText: ({ routeCount }) => `${routeCount} ideias de rota relacionadas transformam o guia em um plano realista para visitantes.`,
    relatedTitle: "Eventos relacionados para comparar",
    relatedText: "Compare datas, cidades, clima, nomes coreanos de mapa e links oficiais com eventos reais.",
    routesTitle: "Ideias de rota para este guia",
    routesText: "Nao sao tours fixos; sao padroes faceis de adaptar ao local e ao clima.",
    sourcesTitle: "Pontos de partida oficiais",
    sourcesText: "K-Spot Now ajuda a comparar e preparar. Ingressos, reservas, compras, regras e elegibilidade ficam na fonte oficial.",
    viewAll: "Ver toda a categoria"
  },
  ru: {
    eyebrow: "Путь посетителя",
    title: "Используйте гид вместе с живыми событиями",
    text: "Каждый гид связан с актуальными страницами, примерами официальных источников и маршрутами, чтобы планировать здесь, а финальное действие делать на официальной странице.",
    patternTitle: "Сравните сценарий",
    patternText: ({ category, eventCount }) => `Используйте гид вместе с ${eventCount} проверенными страницами ${category}, а не как отдельную статью.`,
    sourceTitle: "Откройте официальное подтверждение",
    sourceText: ({ sourceCount }) => `${sourceCount} подходящих официальных источника помогают проверить правила, билеты, бронирование или покупки.`,
    routeTitle: "Спланируйте перемещение",
    routeText: ({ routeCount }) => `${routeCount} идеи маршрута помогают превратить гид в реальный план поездки по Корее.`,
    relatedTitle: "Похожие события для сравнения",
    relatedText: "Сравните реальные даты, города, погоду, корейские названия мест и официальные ссылки.",
    routesTitle: "Маршруты для этого гида",
    routesText: "Это не фиксированные туры, а удобные шаблоны, которые можно адаптировать под место и погоду.",
    sourcesTitle: "Официальные источники для начала",
    sourcesText: "K-Spot Now помогает сравнить и подготовиться. Билеты, бронирования, покупки, правила и условия подтверждаются в официальном источнике.",
    viewAll: "Смотреть всю категорию"
  },
  ja: {
    eyebrow: "訪問者フロー",
    title: "最新イベントと一緒に使うガイド",
    text: "各ガイドは現在の掲載、公式情報の例、ルート案とつながっています。ここで計画し、最終確認や購入は公式ページで行います。",
    patternTitle: "傾向を比較する",
    patternText: ({ category, eventCount }) => `このガイドは単独の記事ではなく、確認済みの${category} ${eventCount}件と比べながら使います。`,
    sourceTitle: "公式根拠を開く",
    sourceText: ({ sourceCount }) => `下にある ${sourceCount} 件の公式情報例から、ルール、チケット、予約、購入条件を確認できます。`,
    routeTitle: "現地の動きを組む",
    routeText: ({ routeCount }) => `${routeCount} 件の関連ルート案で、ガイドを実際の韓国旅行計画に落とし込めます。`,
    relatedTitle: "比較できる関連イベント",
    relatedText: "実際の日程、都市、天気、韓国語の場所名、公式リンクと照らし合わせて確認できます。",
    routesTitle: "このガイド向けルート案",
    routesText: "固定ツアーではなく、場所や天気に合わせて調整しやすい訪問パターンです。",
    sourcesTitle: "公式情報の起点",
    sourcesText: "K-Spot Nowは比較と準備のためのサイトです。チケット、予約、購入、運営ルール、対象条件は公式情報で確認してください。",
    viewAll: "このカテゴリをすべて見る"
  },
  fr: {
    eyebrow: "Parcours visiteur",
    title: "Utilisez ce guide avec les evenements en cours",
    text: "Chaque guide relie fiches actuelles, exemples de sources officielles et idees de trajet pour planifier ici puis finaliser sur la page officielle.",
    patternTitle: "Comparez le modele",
    patternText: ({ category, eventCount }) => `Utilisez le guide avec ${eventCount} fiches ${category} verifiees, pas comme un article isole.`,
    sourceTitle: "Ouvrez la preuve officielle",
    sourceText: ({ sourceCount }) => `${sourceCount} exemples de sources officielles servent de depart pour regles, billets, reservations ou achats.`,
    routeTitle: "Preparez le deplacement",
    routeText: ({ routeCount }) => `${routeCount} idees de trajet aident a transformer le guide en plan realiste pour la Coree.`,
    relatedTitle: "Evenements lies a comparer",
    relatedText: "Comparez dates, villes, meteo, noms coreens de carte et liens officiels avec des fiches reelles.",
    routesTitle: "Idees de trajet pour ce guide",
    routesText: "Ce ne sont pas des tours fixes, mais des schemas simples a adapter au lieu et a la meteo.",
    sourcesTitle: "Points de depart officiels",
    sourcesText: "K-Spot Now aide a comparer et preparer. Billets, reservations, achats, regles et eligibilite restent sur la source officielle.",
    viewAll: "Voir toute la categorie"
  },
  de: {
    eyebrow: "Besucherablauf",
    title: "Guide mit aktuellen Events nutzen",
    text: "Jeder Guide ist mit aktuellen Eintragen, offiziellen Quellenbeispielen und Routenideen verbunden: hier planen, final auf der offiziellen Seite handeln.",
    patternTitle: "Muster vergleichen",
    patternText: ({ category, eventCount }) => `Nutzen Sie den Guide mit ${eventCount} gepruften ${category}-Eintragen, nicht als isolierten Artikel.`,
    sourceTitle: "Offiziellen Nachweis offnen",
    sourceText: ({ sourceCount }) => `${sourceCount} passende offizielle Quellenbeispiele helfen bei Regeln, Tickets, Reservierungen oder Kaufen.`,
    routeTitle: "Lokale Bewegung planen",
    routeText: ({ routeCount }) => `${routeCount} passende Routenideen machen aus dem Guide einen realistischen Korea-Besuchsplan.`,
    relatedTitle: "Verwandte Events zum Vergleichen",
    relatedText: "Vergleichen Sie reale Daten, Stadte, Wetter, koreanische Ortsnamen und offizielle Links.",
    routesTitle: "Routenideen fur diesen Guide",
    routesText: "Das sind keine festen Touren, sondern einfache Muster, die sich an Ort und Wetter anpassen lassen.",
    sourcesTitle: "Offizielle Startpunkte",
    sourcesText: "K-Spot Now hilft beim Vergleichen und Vorbereiten. Tickets, Reservierungen, Kaufe, Regeln und Berechtigung bleiben bei der offiziellen Quelle.",
    viewAll: "Alle in dieser Kategorie ansehen"
  }
};

function guideCopy(lang) {
  return guidePlanningCopy[lang] || guidePlanningCopy.en;
}

function guideDecisionPanel(guide, lang, relatedEvents, relatedRoutes, sourceExamples) {
  const copy = guideCopy(lang);
  const category = categoryLabel(lang, guide.category);
  const data = {
    category,
    eventCount: relatedEvents.length,
    routeCount: relatedRoutes.length,
    sourceCount: sourceExamples.length
  };
  const cards = [
    ["01", copy.patternTitle, copy.patternText(data)],
    ["02", copy.sourceTitle, copy.sourceText(data)],
    ["03", copy.routeTitle, copy.routeText(data)]
  ];
  return `
      <section class="guide-decision-panel" aria-labelledby="guide-decision-title">
        <div class="guide-decision-head">
          <p class="eyebrow">${esc(copy.eyebrow)}</p>
          <h2 id="guide-decision-title">${esc(copy.title)}</h2>
          <p>${esc(copy.text)}</p>
        </div>
        <div class="guide-decision-grid">
          ${cards.map(([number, title, text]) => `
            <article>
              <span>${esc(number)}</span>
              <strong>${esc(title)}</strong>
              <p>${esc(text)}</p>
            </article>`).join("")}
        </div>
      </section>`;
}

function guideRelatedEventsSection(guide, lang, relatedEvents) {
  if (!relatedEvents.length) return "";
  const copy = guideCopy(lang);
  return `
      <section class="guide-related-section" aria-labelledby="guide-related-events-title">
        <div class="section-head">
          <div>
            <p class="eyebrow">${esc(categoryLabel(lang, guide.category))}</p>
            <h2 id="guide-related-events-title">${esc(copy.relatedTitle)}</h2>
            <p>${esc(copy.relatedText)}</p>
          </div>
          <a class="text-link" href="${categoryHref(lang, guide.category)}">${esc(copy.viewAll)}</a>
        </div>
        <div class="gallery-grid guide-event-grid">
          ${relatedEvents.map((event) => eventCard(event, lang)).join("")}
        </div>
      </section>`;
}

function guideRoutesSection(guide, lang, relatedRoutes) {
  if (!relatedRoutes.length) return "";
  const copy = guideCopy(lang);
  return `
      <section class="guide-related-section" aria-labelledby="guide-routes-title">
        <div class="section-head">
          <div>
            <p class="eyebrow">${esc(tr(lang, "routePages"))}</p>
            <h2 id="guide-routes-title">${esc(copy.routesTitle)}</h2>
            <p>${esc(copy.routesText)}</p>
          </div>
        </div>
        <div class="route-grid">
          ${relatedRoutes.map((route) => routeLinkCard(route, lang)).join("")}
        </div>
      </section>`;
}

function guideSourceSection(guide, lang, sourceExamples) {
  if (!sourceExamples.length) return "";
  const copy = guideCopy(lang);
  return `
      <section class="guide-source-strip" aria-labelledby="guide-sources-title">
        <div>
          <p class="eyebrow">${esc(tr(lang, "official"))}</p>
          <h2 id="guide-sources-title">${esc(copy.sourcesTitle)}</h2>
          <p>${esc(copy.sourcesText)}</p>
        </div>
        <div class="guide-source-list">
          ${sourceExamples.map((source) => `
            <a href="${esc(source.url)}" rel="nofollow noopener" target="_blank">
              <strong>${esc(source.name)}</strong>
              <span>${esc(source.coverage?.slice(0, 2).join(" / ") || source.type)}</span>
            </a>`).join("")}
        </div>
      </section>`;
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
  const sections = guideSectionsForLang(guide, lang);
  const relatedEvents = relatedEventsForGuide(guide);
  const relatedRoutes = relatedRoutesForGuide(guide);
  const sourceExamples = guideSourceExamples(guide);
  const body = `
    <main class="page guide-detail-page">
      <article class="article-page">
        <p class="eyebrow">${categoryLabel(lang, guide.category)}</p>
        <h1>${esc(guideTitleText(guide, lang))}</h1>
        <p class="lede">${esc(guideSummaryText(guide, lang))}</p>
        ${adUnit("article")}
        ${sections.map((section, index) => `
          <section>
            <h2>${esc(guideSectionHeading(guide, lang, index))}</h2>
            <p>${esc(section)}</p>
          </section>`).join("")}
      </article>
      ${guideDecisionPanel(guide, lang, relatedEvents, relatedRoutes, sourceExamples)}
      ${guideRelatedEventsSection(guide, lang, relatedEvents)}
      ${guideRoutesSection(guide, lang, relatedRoutes)}
      ${guideSourceSection(guide, lang, sourceExamples)}
    </main>`;
  return layout({
    lang,
    title: `${guideTitleText(guide, lang)} - K-Spot Now`,
    description: guideSummaryText(guide, lang),
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
              ${sourceAlternateLinks(source, lang)}
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

function sourceAlternateLinks(source, lang) {
  const links = source.alternateUrls || [];
  if (!links.length) return "";
  return `
    <details class="source-alternates">
      <summary>${esc(links.length)} ${esc(opsText(lang, links.length === 1 ? "officialFallbackLink" : "officialFallbackLinks"))}</summary>
      <ul>
        ${links.map((url) => `<li><a href="${esc(url)}" rel="nofollow noopener" target="_blank">${esc(url)}</a></li>`).join("")}
      </ul>
    </details>`;
}

function compactCount(value) {
  return Number.isFinite(Number(value)) ? Number(value).toLocaleString("en-US") : "0";
}

const opsCopy = {
  en: {
    generated: "Generated",
    auditedSources: "Audited sources",
    monitorChecks: "Monitor checks",
    discoveredOfficialLinks: "Discovered official links",
    dateSignals: "Date signals",
    draftCandidates: "Draft candidates",
    skippedLeads: "Skipped leads",
    noFailedSources: "No failed sources",
    noFailedSourcesText: "Latest run did not report source failures.",
    noDraftCandidates: "No draft candidates",
    noDraftCandidatesText: "Run the source refresh workflow after adding monitors.",
    noHighSignalPages: "No high-signal pages",
    noHighSignalPagesText: "Latest run did not surface candidate pages.",
    draftCandidatesLower: "draft candidates",
    links: "links",
    score: "score",
    monitoringStats: "Monitoring stats",
    monitoringGroups: "Official monitoring groups",
    officialApis: "official APIs",
    pageMonitors: "page and listing monitors",
    curationRoots: "curation roots",
    activeManualQueues: "active manual queues",
    sourcesWatched: "Sources watched",
    refreshModel: "Refresh model",
    reviewQueue: "review queue",
    reviewPipeline: "Review pipeline",
    kpopQueue: "K-pop curation queue",
    kpopQueueText: "K-pop concerts, ticket openings, fan meetings, pop-ups, birthday cafes, and merch stores stay in a review queue until an official artist, agency, venue, ticketing, or shop source is confirmed.",
    officialFallbackLink: "official fallback link",
    officialFallbackLinks: "official fallback links",
    pipelineSteps: [
      "Collect official pages and same-site detail links from monitored sources.",
      "Score candidate links by dates, visitor keywords, source type, and official-site context.",
      "Open the official source manually for date, venue, eligibility, inventory, ticketing, and rights checks.",
      "Rewrite summaries and travel notes in original words before publishing a public event page.",
      "Show last-checked dates, official links, previous-year weather notes, and nearby routes on every detail page."
    ]
  },
  es: {
    generated: "Generado",
    auditedSources: "Fuentes auditadas",
    monitorChecks: "Revisiones del monitor",
    discoveredOfficialLinks: "Enlaces oficiales detectados",
    dateSignals: "Señales de fecha",
    draftCandidates: "Candidatas en borrador",
    skippedLeads: "Pistas omitidas",
    noFailedSources: "Sin fuentes fallidas",
    noFailedSourcesText: "La última ejecución no informó fallos de fuentes.",
    noDraftCandidates: "Sin candidatas en borrador",
    noDraftCandidatesText: "Ejecuta la revisión de fuentes después de añadir monitores.",
    noHighSignalPages: "Sin páginas candidatas fuertes",
    noHighSignalPagesText: "La última ejecución no encontró páginas candidatas.",
    draftCandidatesLower: "candidatas en borrador",
    links: "enlaces",
    score: "puntaje",
    monitoringStats: "Estadísticas de monitoreo",
    monitoringGroups: "Grupos de monitoreo oficial",
    officialApis: "APIs oficiales",
    pageMonitors: "monitores de páginas y listados",
    curationRoots: "raíces de curación",
    activeManualQueues: "colas manuales activas",
    sourcesWatched: "Fuentes vigiladas",
    refreshModel: "Modelo de revisión",
    reviewQueue: "cola de revisión",
    reviewPipeline: "Flujo de revisión",
    kpopQueue: "Cola de curación K-pop",
    kpopQueueText: "Conciertos K-pop, aperturas de entradas, fan meetings, pop-ups, cafés de cumpleaños y tiendas de merch quedan en revisión hasta confirmar una fuente oficial.",
    officialFallbackLink: "enlace oficial alternativo",
    officialFallbackLinks: "enlaces oficiales alternativos",
    pipelineSteps: [
      "Recoger páginas oficiales y enlaces internos de detalle desde las fuentes monitoreadas.",
      "Puntuar enlaces candidatos por fechas, palabras clave de visitantes, tipo de fuente y contexto oficial.",
      "Abrir la fuente oficial manualmente para revisar fecha, lugar, elegibilidad, inventario, ticketing y derechos.",
      "Reescribir resúmenes y notas de viaje con palabras originales antes de publicar.",
      "Mostrar fecha de última revisión, enlaces oficiales, clima histórico y rutas cercanas en cada detalle."
    ]
  },
  zh: {
    generated: "生成时间",
    auditedSources: "已审核来源",
    monitorChecks: "监控检查",
    discoveredOfficialLinks: "发现的官方链接",
    dateSignals: "日期信号",
    draftCandidates: "草稿候选",
    skippedLeads: "跳过线索",
    noFailedSources: "没有失败来源",
    noFailedSourcesText: "最新运行未报告来源失败。",
    noDraftCandidates: "没有草稿候选",
    noDraftCandidatesText: "添加监控后运行来源复查流程。",
    noHighSignalPages: "没有高信号页面",
    noHighSignalPagesText: "最新运行未发现候选页面。",
    draftCandidatesLower: "个草稿候选",
    links: "个链接",
    score: "评分",
    monitoringStats: "监控统计",
    monitoringGroups: "官方监控分组",
    officialApis: "官方 API",
    pageMonitors: "页面和列表监控",
    curationRoots: "审核入口",
    activeManualQueues: "人工队列",
    sourcesWatched: "监控来源",
    refreshModel: "复查模式",
    reviewQueue: "审核队列",
    reviewPipeline: "审核流程",
    kpopQueue: "K-pop 审核队列",
    kpopQueueText: "K-pop 演唱会、开票、粉丝见面会、快闪、生日咖啡馆和周边店会保留在审核队列中，直到确认官方艺人、公司、场馆、票务或商店来源。",
    officialFallbackLink: "个官方备用链接",
    officialFallbackLinks: "个官方备用链接",
    pipelineSteps: [
      "从监控来源收集官方页面和同站详情链接。",
      "按日期、访客关键词、来源类型和官方站点上下文给候选链接打分。",
      "人工打开官方来源，检查日期、地点、资格、库存、票务和权利信息。",
      "发布公开页面前，用原创文字重写摘要和旅行提示。",
      "每个详情页显示最后检查日期、官方链接、往年天气提示和附近路线。"
    ]
  },
  pt: {
    generated: "Gerado",
    auditedSources: "Fontes auditadas",
    monitorChecks: "Checagens do monitor",
    discoveredOfficialLinks: "Links oficiais descobertos",
    dateSignals: "Sinais de data",
    draftCandidates: "Candidatos em rascunho",
    skippedLeads: "Pistas ignoradas",
    noFailedSources: "Nenhuma fonte falhou",
    noFailedSourcesText: "A última execução não relatou falhas de fontes.",
    noDraftCandidates: "Sem candidatos em rascunho",
    noDraftCandidatesText: "Rode a revisão de fontes depois de adicionar monitores.",
    noHighSignalPages: "Sem páginas candidatas fortes",
    noHighSignalPagesText: "A última execução não encontrou páginas candidatas.",
    draftCandidatesLower: "candidatos em rascunho",
    links: "links",
    score: "pontuação",
    monitoringStats: "Estatísticas de monitoramento",
    monitoringGroups: "Grupos de monitoramento oficial",
    officialApis: "APIs oficiais",
    pageMonitors: "monitores de páginas e listagens",
    curationRoots: "raízes de curadoria",
    activeManualQueues: "filas manuais ativas",
    sourcesWatched: "Fontes monitoradas",
    refreshModel: "Modelo de revisão",
    reviewQueue: "fila de revisão",
    reviewPipeline: "Fluxo de revisão",
    kpopQueue: "Fila de curadoria K-pop",
    kpopQueueText: "Shows K-pop, abertura de ingressos, fan meetings, pop-ups, cafés de aniversário e lojas de merch ficam em revisão até confirmar uma fonte oficial.",
    officialFallbackLink: "link oficial alternativo",
    officialFallbackLinks: "links oficiais alternativos",
    pipelineSteps: [
      "Coletar páginas oficiais e links internos de detalhe das fontes monitoradas.",
      "Pontuar links candidatos por datas, palavras-chave de visitantes, tipo de fonte e contexto oficial.",
      "Abrir a fonte oficial manualmente para checar data, local, elegibilidade, estoque, ticketing e direitos.",
      "Reescrever resumos e notas de viagem com palavras originais antes de publicar.",
      "Mostrar última checagem, links oficiais, clima histórico e rotas próximas em cada página de detalhe."
    ]
  },
  ru: {
    generated: "Создано",
    auditedSources: "Проверенные источники",
    monitorChecks: "Проверки монитора",
    discoveredOfficialLinks: "Найденные официальные ссылки",
    dateSignals: "Сигналы дат",
    draftCandidates: "Черновые кандидаты",
    skippedLeads: "Пропущенные сигналы",
    noFailedSources: "Нет источников с ошибкой",
    noFailedSourcesText: "Последний запуск не сообщил об ошибках источников.",
    noDraftCandidates: "Нет черновых кандидатов",
    noDraftCandidatesText: "Запустите проверку источников после добавления мониторов.",
    noHighSignalPages: "Нет сильных страниц-кандидатов",
    noHighSignalPagesText: "Последний запуск не нашел страницы-кандидаты.",
    draftCandidatesLower: "черновых кандидатов",
    links: "ссылок",
    score: "оценка",
    monitoringStats: "Статистика мониторинга",
    monitoringGroups: "Группы официального мониторинга",
    officialApis: "официальные API",
    pageMonitors: "мониторы страниц и списков",
    curationRoots: "источники очереди проверки",
    activeManualQueues: "активные ручные очереди",
    sourcesWatched: "Источников под наблюдением",
    refreshModel: "Модель проверки",
    reviewQueue: "очередь проверки",
    reviewPipeline: "Процесс проверки",
    kpopQueue: "Очередь K-pop проверки",
    kpopQueueText: "K-pop концерты, открытие билетов, fan meeting, pop-up, birthday cafe и merch-магазины остаются в очереди до подтверждения официального источника.",
    officialFallbackLink: "официальная резервная ссылка",
    officialFallbackLinks: "официальные резервные ссылки",
    pipelineSteps: [
      "Собирать официальные страницы и внутренние ссылки деталей из мониторимых источников.",
      "Оценивать кандидатов по датам, ключевым словам посетителей, типу источника и официальному контексту.",
      "Вручную открыть официальный источник для проверки даты, места, условий, наличия, билетов и прав.",
      "Переписать описания и советы своими словами перед публикацией.",
      "Показывать дату проверки, официальные ссылки, погодные заметки и ближайшие маршруты на каждой странице."
    ]
  },
  ja: {
    generated: "生成",
    auditedSources: "監査済み情報源",
    monitorChecks: "監視チェック",
    discoveredOfficialLinks: "検出した公式リンク",
    dateSignals: "日付シグナル",
    draftCandidates: "下書き候補",
    skippedLeads: "スキップした候補",
    noFailedSources: "失敗した情報源はありません",
    noFailedSourcesText: "最新実行で情報源エラーは報告されていません。",
    noDraftCandidates: "下書き候補はありません",
    noDraftCandidatesText: "モニター追加後に情報源チェックを実行してください。",
    noHighSignalPages: "有力候補ページはありません",
    noHighSignalPagesText: "最新実行では候補ページが見つかりませんでした。",
    draftCandidatesLower: "件の下書き候補",
    links: "件のリンク",
    score: "スコア",
    monitoringStats: "監視統計",
    monitoringGroups: "公式監視グループ",
    officialApis: "公式API",
    pageMonitors: "ページ・一覧モニター",
    curationRoots: "キュレーション元",
    activeManualQueues: "手動確認キュー",
    sourcesWatched: "監視中の情報源",
    refreshModel: "再確認モデル",
    reviewQueue: "確認キュー",
    reviewPipeline: "確認フロー",
    kpopQueue: "K-pop確認キュー",
    kpopQueueText: "K-popコンサート、チケット発売、ファンミーティング、ポップアップ、誕生日カフェ、グッズ販売は公式情報源が確認できるまで確認キューに残します。",
    officialFallbackLink: "件の公式代替リンク",
    officialFallbackLinks: "件の公式代替リンク",
    pipelineSteps: [
      "監視中の情報源から公式ページと同一サイト内の詳細リンクを集めます。",
      "日付、訪問者キーワード、情報源タイプ、公式サイト文脈で候補リンクを採点します。",
      "公式情報源を手動で開き、日程、会場、対象条件、在庫、チケット、権利を確認します。",
      "公開前に要約と旅行メモを独自の言葉で書き直します。",
      "各詳細ページに最終確認日、公式リンク、前年天気メモ、周辺ルートを表示します。"
    ]
  }
};

const watchlistGroupCopy = {
  "tourism-festivals": {
    en: { title: "Tourism and festival calendars", focus: "Official Korea tourism, Seoul city, culture, exhibition, venue, and festival calendars that can become visitor planning pages." },
    es: { title: "Calendarios de turismo y festivales", focus: "Turismo oficial de Corea, ciudad de Seúl, cultura, exposiciones, recintos y calendarios de festivales que pueden convertirse en páginas útiles para visitantes." },
    zh: { title: "旅游与节庆日历", focus: "韩国旅游、首尔市、文化、展览、场馆和节庆官方日历，可转化为访客规划页面。" },
    pt: { title: "Calendários de turismo e festivais", focus: "Turismo oficial da Coreia, Seoul, cultura, exposições, locais e calendários de festivais que podem virar páginas úteis para visitantes." },
    ru: { title: "Туризм и фестивальные календари", focus: "Официальные туристические, городские, культурные, выставочные и фестивальные календари Кореи для страниц планирования." },
    ja: { title: "観光・フェスティバルカレンダー", focus: "韓国観光、ソウル市、文化、展示、会場、フェスティバルの公式カレンダーを訪問計画ページにします。" }
  },
  "shopping-beauty-dutyfree": {
    en: { title: "Shopping, K-beauty, duty-free, and department-store offers", focus: "OLIVE YOUNG, duty-free boards, department-store news, sales, coupons, pop-up stores, tax refund, and foreign visitor benefit pages." },
    es: { title: "Compras, K-beauty, duty-free y grandes almacenes", focus: "OLIVE YOUNG, duty-free, noticias de grandes almacenes, rebajas, cupones, pop-ups, tax refund y beneficios para visitantes." },
    zh: { title: "购物、K-beauty、免税与百货优惠", focus: "OLIVE YOUNG、免税、百货新闻、折扣、优惠券、快闪、退税和外国游客福利页面。" },
    pt: { title: "Compras, K-beauty, duty-free e department stores", focus: "OLIVE YOUNG, duty-free, notícias de lojas de departamento, saldos, cupons, pop-ups, tax refund e benefícios para visitantes." },
    ru: { title: "Шопинг, K-beauty, duty-free и универмаги", focus: "OLIVE YOUNG, duty-free, новости универмагов, распродажи, купоны, pop-up, tax refund и выгоды для иностранных посетителей." },
    ja: { title: "ショッピング、K-beauty、免税、百貨店特典", focus: "OLIVE YOUNG、免税、百貨店ニュース、セール、クーポン、ポップアップ、免税還付、外国人向け特典ページを確認します。" }
  },
  "kpop-popups-ticketing": {
    en: { title: "K-pop pop-ups, merch, fan meetings, and ticketing roots", focus: "Official K-pop commerce, ticketing, artist, agency, venue, and global reservation roots that require manual review before publishing." },
    es: { title: "K-pop pop-ups, merch, fan meetings y ticketing", focus: "Comercio K-pop oficial, ticketing, artistas, agencias, recintos y reservas globales que requieren revisión manual antes de publicar." },
    zh: { title: "K-pop 快闪、周边、粉丝见面会与票务入口", focus: "官方 K-pop 商城、票务、艺人、公司、场馆和全球预约入口，发布前需要人工复核。" },
    pt: { title: "K-pop pop-ups, merch, fan meetings e ticketing", focus: "Comércio K-pop oficial, ticketing, artistas, agências, locais e reservas globais que exigem revisão manual antes de publicar." },
    ru: { title: "K-pop pop-up, merch, fan meeting и билеты", focus: "Официальные K-pop магазины, ticketing, артисты, агентства, площадки и глобальные бронирования, требующие ручной проверки." },
    ja: { title: "K-popポップアップ、グッズ、ファンミ、チケット", focus: "公式K-popコマース、チケット、アーティスト、事務所、会場、グローバル予約元を公開前に手動確認します。" }
  },
  "weather-routes": {
    en: { title: "Weather and travel-route planning", focus: "Previous-year weather baselines, public data APIs, and route data used to make event pages useful beyond dates and titles." },
    es: { title: "Clima y rutas de viaje", focus: "Clima histórico, APIs públicas y datos de rutas que hacen que las páginas sean útiles más allá de fechas y títulos." },
    zh: { title: "天气与旅行路线规划", focus: "往年天气基线、公共数据 API 和路线数据，让活动页面不只提供日期和标题。" },
    pt: { title: "Clima e rotas de viagem", focus: "Clima histórico, APIs públicas e dados de rotas para tornar páginas úteis além de datas e títulos." },
    ru: { title: "Погода и маршруты", focus: "Погодные базовые данные прошлых лет, публичные API и маршруты, чтобы страницы были полезнее дат и заголовков." },
    ja: { title: "天気と旅行ルート計画", focus: "前年天気、公共データAPI、ルート情報を使い、日程とタイトル以上に役立つページにします。" }
  }
};

opsCopy.fr = {
  generated: "Genere",
  auditedSources: "Sources auditees",
  monitorChecks: "Controles de veille",
  discoveredOfficialLinks: "Liens officiels detectes",
  dateSignals: "Signaux de date",
  draftCandidates: "Candidats brouillon",
  skippedLeads: "Pistes ignorees",
  noFailedSources: "Aucune source en erreur",
  noFailedSourcesText: "Le dernier passage n'a signale aucune erreur de source.",
  noDraftCandidates: "Aucun candidat brouillon",
  noDraftCandidatesText: "Lancez le workflow de sources apres ajout de moniteurs.",
  noHighSignalPages: "Aucune page candidate forte",
  noHighSignalPagesText: "Le dernier passage n'a pas trouve de page candidate.",
  draftCandidatesLower: "candidats brouillon",
  links: "liens",
  score: "score",
  monitoringStats: "Statistiques de veille",
  monitoringGroups: "Groupes de veille officielle",
  officialApis: "API officielles",
  pageMonitors: "moniteurs de pages et listes",
  curationRoots: "racines de curation",
  activeManualQueues: "files manuelles actives",
  sourcesWatched: "Sources suivies",
  refreshModel: "Modele de mise a jour",
  reviewQueue: "file de revue",
  reviewPipeline: "Pipeline de revue",
  kpopQueue: "File de curation K-pop",
  kpopQueueText: "Concerts K-pop, ouvertures de billets, fan meetings, pop-ups, cafes d'anniversaire et merch restent en revue jusqu'a confirmation d'une source officielle.",
  officialFallbackLink: "lien officiel alternatif",
  officialFallbackLinks: "liens officiels alternatifs",
  pipelineSteps: [
    "Collecter pages officielles et liens de detail internes depuis les sources suivies.",
    "Noter les liens candidats par dates, mots cles visiteurs, type de source et contexte officiel.",
    "Ouvrir manuellement la source officielle pour dates, lieu, eligibilite, stock, tickets et droits.",
    "Reecrire resumes et notes de voyage avec des mots originaux avant publication.",
    "Afficher date de verification, liens officiels, notes meteo et itineraires proches sur chaque detail."
  ]
};

opsCopy.de = {
  generated: "Erzeugt",
  auditedSources: "Geprufte Quellen",
  monitorChecks: "Monitoring-Prufungen",
  discoveredOfficialLinks: "Gefundene offizielle Links",
  dateSignals: "Datumssignale",
  draftCandidates: "Entwurfskandidaten",
  skippedLeads: "Ubersprungene Hinweise",
  noFailedSources: "Keine fehlerhaften Quellen",
  noFailedSourcesText: "Der letzte Lauf meldete keine Quellenfehler.",
  noDraftCandidates: "Keine Entwurfskandidaten",
  noDraftCandidatesText: "Starten Sie den Quellenworkflow nach dem Hinzufugen von Monitoren.",
  noHighSignalPages: "Keine starken Kandidatenseiten",
  noHighSignalPagesText: "Der letzte Lauf fand keine Kandidatenseiten.",
  draftCandidatesLower: "Entwurfskandidaten",
  links: "Links",
  score: "Score",
  monitoringStats: "Monitoring-Statistik",
  monitoringGroups: "Offizielle Monitoringgruppen",
  officialApis: "offizielle APIs",
  pageMonitors: "Seiten- und Listingmonitore",
  curationRoots: "Kurationswurzeln",
  activeManualQueues: "aktive manuelle Queues",
  sourcesWatched: "Beobachtete Quellen",
  refreshModel: "Aktualisierungsmodell",
  reviewQueue: "Prufqueue",
  reviewPipeline: "Prufpipeline",
  kpopQueue: "K-pop-Kurationsqueue",
  kpopQueueText: "K-pop-Konzerte, Ticketstarts, Fanmeetings, Pop-ups, Birthday Cafes und Merch-Stores bleiben in Prufung, bis eine offizielle Quelle bestatigt ist.",
  officialFallbackLink: "offizieller Alternativlink",
  officialFallbackLinks: "offizielle Alternativlinks",
  pipelineSteps: [
    "Offizielle Seiten und interne Detail-Links aus beobachteten Quellen sammeln.",
    "Kandidatenlinks nach Daten, Besucherkeywords, Quellentyp und offiziellem Kontext bewerten.",
    "Die offizielle Quelle manuell fur Datum, Ort, Berechtigung, Bestand, Ticketing und Rechte prufen.",
    "Zusammenfassungen und Reisehinweise vor der Veroffentlichung in eigenen Worten schreiben.",
    "Letzte Prufdaten, offizielle Links, Wetterhinweise und nahe Routen auf jeder Detailseite zeigen."
  ]
};

Object.assign(watchlistGroupCopy["tourism-festivals"], {
  fr: { title: "Calendriers tourisme et festivals", focus: "Tourisme officiel, villes, culture, expositions, lieux et calendriers de festivals utiles aux visiteurs." },
  de: { title: "Tourismus- und Festivalkalender", focus: "Offizielle Tourismus-, Stadt-, Kultur-, Ausstellungs-, Orts- und Festivalquellen fur Besucherplanung." }
});
Object.assign(watchlistGroupCopy["shopping-beauty-dutyfree"], {
  fr: { title: "Shopping, K-beauty, duty-free et grands magasins", focus: "OLIVE YOUNG, duty-free, grands magasins, soldes, coupons, pop-ups, tax refund et avantages visiteurs." },
  de: { title: "Shopping, K-beauty, Duty-free und Kaufhauser", focus: "OLIVE YOUNG, Duty-free, Kaufhausnews, Sales, Coupons, Pop-ups, Tax Refund und Besucherangebote." }
});
Object.assign(watchlistGroupCopy["kpop-popups-ticketing"], {
  fr: { title: "K-pop pop-ups, merch, fan meetings et billetterie", focus: "Commerce K-pop officiel, tickets, artistes, agences, lieux et reservations globales a verifier manuellement." },
  de: { title: "K-pop Pop-ups, Merch, Fanmeetings und Ticketing", focus: "Offizieller K-pop-Commerce, Ticketing, Kunstler, Agenturen, Orte und globale Reservierungsquellen mit manueller Prufung." }
});
Object.assign(watchlistGroupCopy["weather-routes"], {
  fr: { title: "Meteo et planification d'itineraires", focus: "Bases meteo historiques, API publiques et donnees de routes qui rendent les pages utiles au-dela des dates et titres." },
  de: { title: "Wetter- und Routenplanung", focus: "Vorjahres-Wetterdaten, offentliche APIs und Routendaten, die Eventseiten nutzlicher machen als reine Daten und Titel." }
});

function opsText(lang, key) {
  const value = opsCopy[lang]?.[key] || opsCopy.en[key] || key;
  return Array.isArray(value) ? value.join(" ") : value;
}

function opsList(lang, key) {
  const value = opsCopy[lang]?.[key] || opsCopy.en[key] || [];
  return Array.isArray(value) ? value : [];
}

function watchlistGroupText(group, lang, key) {
  return watchlistGroupCopy[group.slug]?.[lang]?.[key] || watchlistGroupCopy[group.slug]?.en?.[key] || group[key];
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
    [opsText(lang, "auditedSources"), counts.auditedSources],
    [opsText(lang, "monitorChecks"), counts.monitorSources],
    [opsText(lang, "discoveredOfficialLinks"), counts.discoveredLinks],
    [opsText(lang, "dateSignals"), counts.dateSignals],
    [opsText(lang, "draftCandidates"), counts.draftCandidates],
    [opsText(lang, "skippedLeads"), counts.skippedCandidates]
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
          <small>${esc(opsText(lang, "generated"))}: ${esc(generatedText)} UTC</small>
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
              </li>`).join("") : `<li><strong>${esc(opsText(lang, "noFailedSources"))}</strong><span>${esc(opsText(lang, "noFailedSourcesText"))}</span></li>`}
          </ul>
        </article>
        <article>
          <h3>${tr(lang, "sourceRefreshDraftSources")}</h3>
          <ul>
            ${summary.topDraftSources.length ? summary.topDraftSources.map((item) => `
              <li>
                <strong>${esc(item.key)}</strong>
                <span>${esc(compactCount(item.count))} ${esc(opsText(lang, "draftCandidatesLower"))}</span>
              </li>`).join("") : `<li><strong>${esc(opsText(lang, "noDraftCandidates"))}</strong><span>${esc(opsText(lang, "noDraftCandidatesText"))}</span></li>`}
          </ul>
        </article>
        <article>
          <h3>${tr(lang, "sourceRefreshCandidates")}</h3>
          <ul>
            ${summary.highSignalCandidates.length ? summary.highSignalCandidates.slice(0, 5).map((item) => `
              <li>
                <a href="${esc(item.url)}" rel="nofollow noopener" target="_blank">${esc(item.sourceName)}</a>
                <span>${esc(compactCount(item.links))} ${esc(opsText(lang, "links"))} / ${esc(compactCount(item.dates))} ${esc(opsText(lang, "dateSignals"))} / ${esc(opsText(lang, "score"))} ${esc(compactCount(item.score))}</span>
              </li>`).join("") : `<li><strong>${esc(opsText(lang, "noHighSignalPages"))}</strong><span>${esc(opsText(lang, "noHighSignalPagesText"))}</span></li>`}
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
  const pipelineSteps = opsList(lang, "pipelineSteps");

  const body = `
    <main class="page">
      <section class="page-hero compact">
        <p class="eyebrow">${tr(lang, "navWatchlist")}</p>
        <h1>${tr(lang, "watchlistTitle")}</h1>
        <p>${tr(lang, "watchlistText")}</p>
      </section>

      <section class="watch-stats" aria-label="${esc(opsText(lang, "monitoringStats"))}">
        ${watchlistStat(opsText(lang, "officialApis"), officialApis)}
        ${watchlistStat(opsText(lang, "pageMonitors"), monitors)}
        ${watchlistStat(opsText(lang, "curationRoots"), curationRoots)}
        ${watchlistStat(opsText(lang, "activeManualQueues"), activeQueue.length)}
      </section>

      ${sourceRefreshPanel(lang)}

      <section class="watch-grid" aria-label="${esc(opsText(lang, "monitoringGroups"))}">
        ${watchlistGroups.map((group) => {
          const groupSources = sources.filter((source) => sourceMatchesGroup(source, group));
          return `
            <article class="watch-card">
              <span>${esc(group.slug)}</span>
              <h2>${esc(watchlistGroupText(group, lang, "title"))}</h2>
              <p>${esc(watchlistGroupText(group, lang, "focus"))}</p>
              <dl>
                <div><dt>${esc(opsText(lang, "sourcesWatched"))}</dt><dd>${groupSources.length}</dd></div>
                <div><dt>${esc(opsText(lang, "refreshModel"))}</dt><dd>${esc(groupSources.map((source) => source.refreshCadence).filter(Boolean).slice(0, 2).join(" / ") || opsText(lang, "reviewQueue"))}</dd></div>
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
          <h2>${esc(opsText(lang, "reviewPipeline"))}</h2>
          <ol>${pipelineSteps.map((step) => `<li>${esc(step)}</li>`).join("")}</ol>
        </div>
        <div>
          <h2>${esc(opsText(lang, "kpopQueue"))}</h2>
          <p>${esc(opsText(lang, "kpopQueueText"))}</p>
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
            <p>${esc(eventSummaryText(event, lang))}</p>
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

const extendedPolicySections = {
  fr: {
    editorial: [
      ["Priorite des sources", "Les fiches publiees doivent venir d'API officielles, de pages gouvernementales ou touristiques officielles, de pages de marques, de lieux, ou d'avis officiels verifies. Les reposts non officiels servent seulement d'indices de decouverte."],
      ["Surveillance et curation", "Les moniteurs officiels collectent des dates candidates, mais rien n'est publie sans verifier la date, le lieu, l'eligibilite, le stock, les tickets et les droits de l'image ou de la marque."],
      ["Valeur visiteur", "Chaque page doit aider un visiteur a planifier: dates lisibles, nom coreen du lieu, meteo, transport, idees proches et lien vers la source officielle pour l'action finale."],
      ["Independance", "Les publicites, partenariats et suggestions de sources ne peuvent pas acheter un placement ni supprimer les labels de verification."]
    ],
    corrections: [
      ["Quoi envoyer", `Envoyez a ${contactEmail} l'URL officielle, le nom de l'evenement ou de l'offre, les dates, le lieu ou la branche, la langue et le detail incorrect.`],
      ["Verification officielle", "Les corrections sont comparees aux API officielles, pages publiques, pages de marques, lieux, billetteries ou avis verifies avant modification."],
      ["Categories rapides", "Duty-free, OLIVE YOUNG, grands magasins, pop-ups K-pop et tickets ont des fenetres de reverification plus courtes."],
      ["Labels de mise a jour", "Les pages publiques affichent la date de derniere verification et conservent le lien officiel pour confirmation finale."],
      ["Politique d'images et de retrait", `Les vignettes utilisent des images promotionnelles officielles en taille reduite avec lien source, et les fiches K-pop utilisent des cartes d'identite de source en texte au lieu de photos d'artistes. Si vous etes titulaire de droits sur une image, un artiste ou une marque montree ici, ecrivez a ${contactEmail} avec l'URL de la page et votre demande: les images contestees sont retirees pendant l'examen puis supprimees ou remplacees sous deux jours ouvres.`]
    ]
  },
  de: {
    editorial: [
      ["Quellenprioritat", "Veroffentlichte Eintrage mussen aus offiziellen APIs, Regierungs- oder Tourismusseiten, Marken-, Veranstaltungsortseiten oder verifizierten offiziellen Kunstler- und Unternehmenshinweisen stammen. Inoffizielle Reposts sind nur Entdeckungshinweise."],
      ["Monitoring und Kuration", "Offizielle Monitore sammeln Kandidatendaten, aber nichts wird ohne Prufung von Datum, Ort, Berechtigung, Bestand, Ticketing und Bild- oder Markenrechten veroffentlicht."],
      ["Besucherwert", "Jede Seite muss beim Planen helfen: klare Daten, koreanischer Ortsname, Wetter, Verkehr, nahe Ideen und Link zur offiziellen Quelle fur die finale Aktion."],
      ["Unabhangigkeit", "Anzeigen, Partnerschaften und Quellenvorschlage konnen keine Platzierung kaufen und keine Verifizierungslabels entfernen."]
    ],
    corrections: [
      ["Was senden", `Senden Sie ${contactEmail} die offizielle URL, den Event- oder Angebotsnamen, Daten, Ort oder Filiale, Sprache und das genaue falsche Detail.`],
      ["Offizielle Prufung", "Korrekturen werden vor Anderungen mit offiziellen APIs, offentlichen Seiten, Marken-, Veranstaltungsort-, Ticketingseiten oder verifizierten Hinweisen verglichen."],
      ["Schnelle Kategorien", "Duty-free, OLIVE YOUNG, Kaufhaus-Pop-ups, K-pop-Reservierungen und Ticketinghinweise erhalten kurzere Pruffenster."],
      ["Update-Labels", "Offentliche Eventseiten zeigen letzte Prufdaten und behalten den offiziellen Link fur die finale Bestatigung."],
      ["Bild- und Takedown-Richtlinie", `Thumbnails verwenden offizielle Werbebilder in reduzierter Grosse mit Quellenlink, und K-pop Eintrage verwenden textbasierte Quellkarten statt Kunstlerfotos. Wenn Sie Rechteinhaber eines hier gezeigten Bildes, Kunstlers oder einer Marke sind, schreiben Sie an ${contactEmail} mit der Seiten-URL und Ihrer Anfrage: Strittige Bilder werden wahrend der Prufung offline genommen und innerhalb von zwei Werktagen entfernt oder ersetzt.`]
    ]
  }
};

function policySections(lang, kind) {
  if (extendedPolicySections[lang]?.[kind]) return extendedPolicySections[lang][kind];
  const copy = {
    editorial: {
      en: [
        ["Source priority", "Published listings must come from official APIs, official government or tourism pages, official brand pages, official venue pages, or verified official artist/company notices. Unofficial reposts are used only as discovery hints."],
        ["Automation and review", "Official monitors collect candidate dates and keywords, but candidates are not auto-published. A human review step must confirm the date range, venue, eligibility, inventory or reservation rules, and source link before an event appears publicly."],
        ["K-pop and pop-up policy", "K-pop pop-ups, fan events, ticketing notices, and merch stores can change quickly. We publish only official notices and keep fan-community or social reposts in a curation queue until an official source is confirmed."],
        ["Original summaries", "Summaries, travel tips, weather notes, and route ideas are written for visitor planning. We do not copy full event pages, and every listing links back to the official source for the latest rules."],
        ["Ads and affiliate integrity", "Advertising must not influence event inclusion, source labels, freshness dates, or safety notes. Visitors should always verify official details before purchasing, reserving, or changing travel plans."]
      ],
      es: [
        ["Prioridad de fuentes", "Las fichas publicadas deben venir de APIs oficiales, paginas gubernamentales o turisticas oficiales, paginas de marca, paginas de recintos o avisos oficiales verificados de artistas y empresas. Los reposts no oficiales solo sirven como pistas de descubrimiento."],
        ["Automatizacion y revision", "Los monitores oficiales recogen fechas y palabras clave candidatas, pero no se publican automaticamente. Una revision humana confirma fechas, lugar, elegibilidad, inventario o reglas de reserva y enlace de fuente antes de que el evento sea publico."],
        ["Politica K-pop y pop-ups", "Los pop-ups de K-pop, eventos de fans, avisos de entradas y tiendas de merch pueden cambiar rapido. Publicamos solo avisos oficiales y mantenemos reposts sociales o de comunidades en una cola hasta confirmar una fuente oficial."],
        ["Resumenes originales", "Los resumenes, consejos de viaje, notas meteorologicas y rutas se escriben para planificar la visita. No copiamos paginas completas y cada ficha enlaza a la fuente oficial para las reglas mas recientes."],
        ["Integridad publicitaria", "La publicidad no debe influir en la inclusion de eventos, etiquetas de fuente, fechas de actualizacion ni notas de seguridad. Los visitantes siempre deben verificar los detalles oficiales antes de comprar, reservar o cambiar planes."]
      ],
      zh: [
        ["来源优先级", "公开条目必须来自官方 API、政府或旅游官方页面、品牌官方页面、场馆官方页面，或经确认的艺人和公司官方公告。非官方转载只作为发现线索。"],
        ["自动化与人工审核", "官方监控会收集候选日期和关键词，但候选内容不会自动发布。公开前必须由人工确认日期范围、地点、资格、库存或预约规则以及来源链接。"],
        ["K-pop 与快闪政策", "K-pop 快闪、粉丝活动、票务公告和周边商店变化很快。我们只发布官方公告，粉丝社区或社交平台转载会先留在审核队列中，直到确认官方来源。"],
        ["原创摘要", "摘要、旅行提示、天气说明和路线建议都面向访客规划重新撰写。我们不复制完整活动页面，每个条目都会链接到官方来源以便确认最新规则。"],
        ["广告与独立性", "广告不得影响活动收录、来源标签、更新日期或安全提示。访客在购买、预约或更改行程前，应始终确认官方详情。"]
      ],
      pt: [
        ["Prioridade de fontes", "Listagens publicadas devem vir de APIs oficiais, paginas oficiais de governo ou turismo, paginas de marcas, locais oficiais ou avisos oficiais verificados de artistas e empresas. Reposts nao oficiais servem apenas como pistas de descoberta."],
        ["Automacao e revisao", "Monitores oficiais coletam datas e palavras-chave candidatas, mas elas nao sao publicadas automaticamente. Uma revisao humana confirma periodo, local, elegibilidade, estoque ou regras de reserva e link da fonte antes da publicacao."],
        ["Politica de K-pop e pop-ups", "Pop-ups de K-pop, eventos de fas, avisos de ingressos e lojas de merch mudam rapidamente. Publicamos apenas avisos oficiais e mantemos reposts sociais ou de comunidades em uma fila ate confirmar uma fonte oficial."],
        ["Resumos originais", "Resumos, dicas de viagem, notas de clima e ideias de rotas sao escritos para planejamento do visitante. Nao copiamos paginas completas, e cada item aponta para a fonte oficial com as regras mais recentes."],
        ["Integridade de anuncios", "Publicidade nao deve influenciar inclusao de eventos, etiquetas de fonte, datas de atualizacao ou notas de seguranca. Visitantes devem verificar detalhes oficiais antes de comprar, reservar ou mudar planos."]
      ],
      ru: [
        ["Приоритет источников", "Публичные карточки должны опираться на официальные API, страницы государственных или туристических организаций, страницы брендов, площадок либо подтвержденные официальные уведомления артистов и компаний. Неофициальные репосты используются только как подсказки для поиска."],
        ["Автоматизация и проверка", "Официальные мониторы собирают даты и ключевые слова, но кандидаты не публикуются автоматически. Перед публикацией человек проверяет даты, место, условия, наличие или правила бронирования и ссылку на источник."],
        ["Политика K-pop и pop-up", "K-pop pop-up, фан-события, продажи билетов и merch-магазины могут быстро меняться. Мы публикуем только официальные уведомления, а репосты из сообществ и соцсетей держим в очереди до подтверждения официального источника."],
        ["Оригинальные описания", "Краткие описания, советы по поездке, заметки о погоде и маршруты пишутся для планирования визита. Мы не копируем полные страницы событий, а каждая карточка ведет к официальному источнику с актуальными правилами."],
        ["Реклама и независимость", "Реклама не должна влиять на включение событий, метки источников, даты свежести или заметки о безопасности. Посетители должны проверять официальные детали перед покупкой, бронированием или изменением планов."]
      ],
      ja: [
        ["情報源の優先順位", "公開する掲載情報は、公式API、政府・観光の公式ページ、ブランド公式ページ、会場公式ページ、または確認済みのアーティスト・企業公式告知に基づきます。非公式の再投稿は発見の手がかりとしてのみ使います。"],
        ["自動収集と確認", "公式モニターは候補の日程やキーワードを集めますが、自動公開はしません。公開前に人が日程、会場、対象条件、在庫や予約ルール、情報源リンクを確認します。"],
        ["K-popとポップアップ方針", "K-popポップアップ、ファンイベント、チケット告知、グッズ販売は変わりやすい情報です。公式告知のみを公開し、ファンコミュニティやSNSの再投稿は公式情報が確認できるまでキュレーション待ちに残します。"],
        ["独自の要約", "要約、旅行メモ、天気の注意点、ルート案は訪問者の計画のために独自に作成します。イベントページ全文はコピーせず、各掲載情報から最新ルールを確認できる公式情報源へリンクします。"],
        ["広告と独立性", "広告はイベント掲載、情報源ラベル、更新日、安全メモに影響してはなりません。購入、予約、予定変更の前に、訪問者は必ず公式情報を確認してください。"]
      ]
    },
    corrections: {
      en: [
        ["What to send", `Email ${contactEmail} with the official URL, event or offer name, date range, venue or branch, language, and the exact detail that looks outdated or incorrect.`],
        ["Official-source checks", "Corrections are checked against official APIs, government or tourism pages, brand pages, venue pages, ticketing pages, or verified artist and company notices before public pages are changed."],
        ["Fast-moving categories", "Duty-free campaigns, OLIVE YOUNG promotions, department-store pop-ups, K-pop reservations, and ticketing notices receive shorter recheck windows because dates, eligibility, stock, and entry rules can change quickly."],
        ["Update labels", "Public event pages show last-checked dates and freshness labels. When a correction changes visitor decisions, the page is updated with a new check date and the official source remains linked."],
        ["Editorial independence", "Corrections, source suggestions, ads, sponsorships, and partnerships cannot buy placement or override source labels. We rewrite summaries in our own words and link visitors to the original source for final confirmation."],
        ["Image and takedown policy", `Event thumbnails use official promotional images at reduced size with a source link, and K-pop listings use text-based source identity cards instead of artist photography. If you are a rights holder for an image, artist, or brand shown here, email ${contactEmail} with the page URL and your request: disputed images are taken down during review and removed or replaced within two business days.`]
      ],
      es: [
        ["Que enviar", `Escribe a ${contactEmail} con la URL oficial, nombre del evento u oferta, fechas, lugar o sucursal, idioma y el detalle exacto que parece desactualizado o incorrecto.`],
        ["Verificacion oficial", "Antes de cambiar paginas publicas, las correcciones se contrastan con APIs oficiales, paginas gubernamentales o turisticas, paginas de marca, recintos, ticketing o avisos verificados de artistas y empresas."],
        ["Categorias rapidas", "Campanas duty-free, promociones de OLIVE YOUNG, pop-ups de grandes almacenes, reservas K-pop y avisos de entradas tienen ventanas de revision mas cortas porque fechas, elegibilidad, stock y reglas de entrada cambian rapido."],
        ["Etiquetas de actualizacion", "Las paginas de eventos muestran fecha de ultima revision y etiquetas de frescura. Si una correccion cambia decisiones de viaje, la pagina se actualiza con nueva fecha de revision y mantiene la fuente oficial enlazada."],
        ["Independencia editorial", "Correcciones, sugerencias de fuentes, anuncios, patrocinios y alianzas no compran posicion ni anulan etiquetas de fuente. Reescribimos resumenes con palabras propias y enlazamos a la fuente original para la confirmacion final."],
        ["Politica de imagenes y retirada", `Las miniaturas usan imagenes promocionales oficiales en tamano reducido con enlace a la fuente, y las fichas de K-pop usan tarjetas de identidad de fuente en texto en lugar de fotografias de artistas. Si eres titular de derechos de una imagen, artista o marca mostrada aqui, escribe a ${contactEmail} con la URL de la pagina y tu solicitud: las imagenes en disputa se retiran durante la revision y se eliminan o reemplazan en dos dias habiles.`]
      ],
      zh: [
        ["需要发送的内容", `请发送邮件至 ${contactEmail}，附上官方网址、活动或优惠名称、日期范围、地点或分店、语言，以及看起来过期或错误的具体细节。`],
        ["官方来源核对", "公开页面修改前，更正内容会与官方 API、政府或旅游页面、品牌页面、场馆页面、票务页面，或经确认的艺人和公司公告进行核对。"],
        ["变化较快的类别", "免税活动、OLIVE YOUNG 优惠、百货店快闪、K-pop 预约和票务公告会使用更短的复查窗口，因为日期、资格、库存和入场规则可能快速变化。"],
        ["更新标签", "公开活动页面会显示最后检查日期和新鲜度标签。当更正会影响访客决策时，页面会更新新的检查日期，并保留官方来源链接。"],
        ["编辑独立性", "更正、来源建议、广告、赞助和合作不能购买排序位置，也不能覆盖来源标签。我们用自己的文字重写摘要，并链接到原始来源供访客最终确认。"],
        ["图片与下架政策", `活动缩略图使用缩小尺寸的官方宣传图片并附来源链接，K-pop 条目使用文字型来源识别卡，而不使用艺人照片。如果您是此处展示的图片、艺人或品牌的权利人，请将页面网址和请求发送至 ${contactEmail}：有争议的图片会在审查期间先行下架，并在两个工作日内删除或替换。`]
      ],
      pt: [
        ["O que enviar", `Envie email para ${contactEmail} com a URL oficial, nome do evento ou oferta, periodo, local ou filial, idioma e o detalhe exato que parece desatualizado ou incorreto.`],
        ["Checagem oficial", "Antes de alterar paginas publicas, correcoes sao comparadas com APIs oficiais, paginas de governo ou turismo, marcas, locais, ticketing ou avisos verificados de artistas e empresas."],
        ["Categorias de mudanca rapida", "Campanhas duty-free, promocoes OLIVE YOUNG, pop-ups de department stores, reservas K-pop e avisos de ingressos recebem janelas de rechecagem mais curtas porque datas, elegibilidade, estoque e regras de entrada mudam rapido."],
        ["Etiquetas de atualizacao", "Paginas publicas mostram data da ultima checagem e etiquetas de atualizacao. Quando uma correcao muda decisoes de visitantes, a pagina recebe nova data de checagem e mantem a fonte oficial vinculada."],
        ["Independencia editorial", "Correcoes, sugestoes de fontes, anuncios, patrocinios e parcerias nao compram destaque nem substituem etiquetas de fonte. Reescrevemos resumos com palavras proprias e ligamos a fonte original para confirmacao final."],
        ["Politica de imagens e remocao", `As miniaturas usam imagens promocionais oficiais em tamanho reduzido com link da fonte, e as fichas de K-pop usam cartoes de identidade de fonte em texto em vez de fotografias de artistas. Se voce e titular de direitos de uma imagem, artista ou marca exibida aqui, envie email para ${contactEmail} com a URL da pagina e seu pedido: imagens em disputa saem do ar durante a revisao e sao removidas ou substituidas em dois dias uteis.`]
      ],
      ru: [
        ["Что отправить", `Напишите на ${contactEmail}: официальную ссылку, название события или предложения, даты, место или филиал, язык и точную деталь, которая кажется устаревшей или неверной.`],
        ["Проверка по официальным источникам", "Перед изменением публичных страниц исправления сверяются с официальными API, государственными или туристическими страницами, страницами брендов, площадок, билетных сервисов или подтвержденными уведомлениями артистов и компаний."],
        ["Быстро меняющиеся категории", "Duty-free кампании, акции OLIVE YOUNG, pop-up в универмагах, K-pop бронирования и билетные объявления получают более короткие окна проверки, потому что даты, условия, наличие и правила входа быстро меняются."],
        ["Метки обновления", "Публичные страницы событий показывают дату последней проверки и метки свежести. Если исправление влияет на решение посетителя, страница получает новую дату проверки, а ссылка на официальный источник остается."],
        ["Редакционная независимость", "Исправления, предложения источников, реклама, спонсорство и партнерства не могут купить размещение или отменить метки источников. Мы переписываем краткие описания своими словами и ведем к оригинальному источнику для финального подтверждения."],
        ["Политика изображений и удаления", `Миниатюры событий используют официальные промо-изображения в уменьшенном размере со ссылкой на источник, а карточки K-pop используют текстовые карточки источника вместо фотографий артистов. Если вы правообладатель изображения, артиста или бренда, показанного здесь, напишите на ${contactEmail} с URL страницы и вашим запросом: спорные изображения снимаются на время проверки и удаляются или заменяются в течение двух рабочих дней.`]
      ],
      ja: [
        ["送ってほしい内容", `公式URL、イベントまたは特典名、日程、会場または店舗、言語、古いまたは誤っていると思われる具体的な内容を ${contactEmail} まで送ってください。`],
        ["公式情報での確認", "公開ページを変更する前に、訂正内容は公式API、政府・観光ページ、ブランドページ、会場ページ、チケットページ、確認済みのアーティスト・企業告知と照合します。"],
        ["変化の速いカテゴリ", "免税キャンペーン、OLIVE YOUNGプロモーション、百貨店ポップアップ、K-pop予約、チケット告知は、日程、対象条件、在庫、入場ルールが変わりやすいため短い再確認期間を使います。"],
        ["更新ラベル", "公開イベントページには最終確認日と更新状態を表示します。訂正が訪問判断に影響する場合、ページは新しい確認日で更新され、公式情報源リンクは残します。"],
        ["編集の独立性", "訂正、情報源の提案、広告、スポンサー、提携は、掲載順位を購入したり情報源ラベルを上書きしたりできません。要約は独自の言葉で書き直し、最終確認のために元の公式情報源へリンクします。"],
        ["画像と削除対応の方針", `イベントのサムネイルは公式プロモーション画像を縮小サイズで出典リンク付きで使用し、K-pop掲載はアーティスト写真の代わりにテキスト型のソースカードを使います。掲載中の画像、アーティスト、ブランドの権利者の方は、ページURLとご要望を ${contactEmail} までお送りください。係争中の画像は確認中に非公開とし、2営業日以内に削除または差し替えます。`]
      ]
    }
  };
  return copy[kind]?.[lang] || copy[kind]?.en || [];
}

function numberedSections(sections) {
  return sections.map(([heading, paragraph], index) => `
        <section>
          <h2>${index + 1}. ${esc(heading)}</h2>
          <p>${esc(paragraph)}</p>
        </section>`).join("");
}

function renderEditorialPolicy(lang) {
  const sections = policySections(lang, "editorial");
  const body = `
    <main class="page">
      <article class="article-page">
        <p class="eyebrow">${tr(lang, "editorialTitle")}</p>
        <h1>${tr(lang, "editorialTitle")}</h1>
        <p class="lede">${tr(lang, "editorialText")}</p>
${numberedSections(sections)}
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
  const sections = policySections(lang, "corrections");
  const body = `
    <main class="page">
      <article class="article-page">
        <p class="eyebrow">${tr(lang, "correctionsTitle")}</p>
        <h1>${tr(lang, "correctionsTitle")}</h1>
        <p class="lede">${tr(lang, "correctionsText")}</p>
${numberedSections(sections)}
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

const extendedStaticPages = {
  fr: {
    about: [
      "K-Spot Now est un radar multilingue d'evenements et de shopping pour les visiteurs qui planifient un voyage en Coree.",
      "K-Spot Now n'est pas une marketplace de tickets ni un service de paiement. Le site explique ce qui se passe, compare les sources officielles et envoie les visiteurs vers l'organisateur, la marque, le lieu ou la page de billetterie pour l'action finale.",
      "Le site privilegie les sources officielles, les dates claires, les notes pratiques et les labels de fraicheur honnetes.",
      "Les pop-ups K-pop et les annonces sociales passent par une curation avant publication."
    ],
    contact: [
      `Pour corrections, suggestions de sources ou partenariats, ecrivez a ${contactEmail}.`,
      "Incluez l'URL officielle, les dates, le lieu et la langue preferee."
    ],
    privacy: [
      "Ce site statique ne demande pas de compte, paiement ou profil de connexion. L'hebergeur peut traiter des journaux techniques de base pour la securite et la livraison.",
      "Les evenements enregistres sont stockes dans le navigateur de votre appareil. K-Spot Now ne recoit pas cette liste sauf si vous nous l'envoyez.",
      "Si Google AdSense est active, Google et ses partenaires peuvent utiliser cookies, stockage local ou technologies similaires pour diffuser, personnaliser, limiter et mesurer les annonces.",
      "Pour les visiteurs de l'EEE, du Royaume-Uni et de la Suisse, le consentement publicitaire doit passer par une plateforme de gestion du consentement certifiee par Google lorsque des annonces AdSense sont affichees."
    ],
    "cookie-policy": [
      "K-Spot Now utilise un petit stockage cote navigateur pour rendre le site utile et preparer la conformite publicitaire.",
      "Planificateur enregistre: quand vous enregistrez un evenement, la liste reste localement dans votre navigateur.",
      "Donnees operationnelles: l'hebergement et la securite peuvent traiter IP, chemin demande, user agent et horodatage pour livrer les pages et prevenir les abus.",
      "Cookies publicitaires: si AdSense est active, Google et des fournisseurs publicitaires tiers peuvent utiliser des cookies ou technologies similaires.",
      `Questions ou demandes de correction: ${contactEmail}.`
    ],
    advertising: [
      "K-Spot Now peut afficher des annonces apres configuration d'un compte publicitaire approuve, mais les annonces ne peuvent pas acheter une fiche, une position, une date de fraicheur ou un label de verification.",
      "Les sources sont choisies pour leur utilite visiteur: pages officielles, organisateurs, marques, lieux, tourisme, billetterie et campagnes verifiees.",
      "Les boutons de source envoient vers la page originale pour billets, reservations, stock, achat ou regles finales. K-Spot Now ne prend pas de paiement et ne remplace pas la source officielle.",
      "Toute publicite ou partenariat doit rester separe de la correction editoriale, des alertes de securite et des notes de visite.",
      `Questions publicitaires ou corrections: ${contactEmail}.`
    ],
    terms: [
      "Les informations sont fournies pour la planification de voyage et peuvent changer sans preavis.",
      "Verifiez toujours les pages officielles avant de visiter, acheter, reserver ou modifier un voyage.",
      "K-Spot Now n'est pas affilie aux marques, artistes, lieux ou agences mentionnes sauf indication explicite."
    ]
  },
  de: {
    about: [
      "K-Spot Now ist ein mehrsprachiger Event- und Shoppingradar fur Besucher, die Korea-Reisen planen.",
      "K-Spot Now ist kein Ticketmarktplatz und kein Checkout-Service. Die Website erklart, was passiert, vergleicht offizielle Quellen und leitet Besucher fur die finale Aktion zum ursprunglichen Veranstalter, zur Marke, zum Ort oder zur Ticketingseite.",
      "Die Website priorisiert offizielle Quellen, klare Daten, praktische Reisetipps und ehrliche Aktualitatslabels.",
      "K-pop Pop-ups und reine Social-Ankundigungen gehen vor der Veroffentlichung durch eine Kuration."
    ],
    contact: [
      `Fur Korrekturen, Quellenvorschlage oder Partnerschaften schreiben Sie an ${contactEmail}.`,
      "Bitte fugen Sie offizielle Event-URL, Datumsbereich, Ort und bevorzugte Sprache hinzu."
    ],
    privacy: [
      "Diese statische Website erfordert keine Konten, Zahlungen oder Loginprofile. Der Hostinganbieter kann technische Basislogs fur Sicherheit und Auslieferung verarbeiten.",
      "Gespeicherte Eventplanung nutzt Browserspeicher auf Ihrem Gerat. K-Spot Now erhalt diese Liste nicht, ausser Sie senden sie uns.",
      "Wenn Google AdSense aktiviert ist, konnen Google und Werbepartner Cookies, lokalen Speicher oder ahnliche Technologien zur Anzeige, Personalisierung, Begrenzung und Messung von Anzeigen nutzen.",
      "Fur Besucher im EWR, im Vereinigten Konigreich und in der Schweiz sollte Werbeeinwilligung uber eine von Google zertifizierte Consent-Management-Plattform erfolgen."
    ],
    "cookie-policy": [
      "K-Spot Now nutzt eine kleine Menge Browserspeicher, um die Website nutzlich zu machen und Werbecompliance vorzubereiten.",
      "Gespeicherter Planer: Wenn Sie ein Event speichern, bleibt die Liste lokal in Ihrem Browser.",
      "Betriebsdaten: Hosting und Sicherheit konnen IP-Adresse, Pfad, User Agent und Zeitstempel verarbeiten, um Seiten auszuliefern und Missbrauch zu verhindern.",
      "Werbe-Cookies: Wenn AdSense aktiviert ist, konnen Google und Drittanbieter Cookies oder ahnliche Technologien nutzen.",
      `Fragen oder Korrekturen: ${contactEmail}.`
    ],
    advertising: [
      "K-Spot Now kann Anzeigen anzeigen, nachdem ein genehmigtes Werbekonto eingerichtet wurde. Anzeigen konnen aber keinen Eintrag, keine Platzierung, kein Aktualitatsdatum und kein Verifizierungslabel kaufen.",
      "Quellen werden nach Besucherwert ausgewahlt: offizielle Seiten, Veranstalter, Marken, Orte, Tourismus, Ticketing und verifizierte Kampagnen.",
      "Quellenbuttons fuhren zur Originalseite fur Tickets, Reservierungen, Bestand, Kauf oder finale Regeln. K-Spot Now nimmt keine Zahlungen an und ersetzt keine offizielle Quelle.",
      "Werbung oder Partnerschaften mussen von redaktionellen Korrekturen, Sicherheitshinweisen und Besuchernotizen getrennt bleiben.",
      `Werbefragen oder Korrekturen: ${contactEmail}.`
    ],
    terms: [
      "Informationen dienen der Reiseplanung und konnen sich ohne Vorankundigung andern.",
      "Prufen Sie immer offizielle Seiten, bevor Sie besuchen, kaufen, reservieren oder Reiseplane andern.",
      "K-Spot Now ist nicht mit den genannten Marken, Kunstlern, Orten oder Behorden verbunden, sofern nicht ausdrucklich angegeben."
    ]
  }
};

function staticPageParagraphs(lang, kind) {
  if (extendedStaticPages[lang]?.[kind]) return extendedStaticPages[lang][kind];
  const copy = {
    about: {
      en: [
        "K-Spot Now is a multilingual event and shopping radar for visitors planning Korea trips.",
        "K-Spot Now is not a ticket marketplace or checkout service. It explains what is happening, compares official sources, and sends visitors to the original organizer, brand, venue, or ticketing page for final action.",
        "The site prioritizes official sources, clear date ranges, practical travel notes, and honest freshness labels.",
        "K-pop pop-ups and social-only announcements are queued for curation before publication."
      ],
      es: [
        "K-Spot Now es un radar multilingue de eventos y compras para visitantes que planean viajar por Corea.",
        "El sitio prioriza fuentes oficiales, fechas claras, notas practicas para visitantes y etiquetas honestas de frescura.",
        "Los pop-ups de K-pop y anuncios que aparecen solo en redes sociales pasan por una cola de curacion antes de publicarse."
      ],
      zh: [
        "K-Spot Now 是面向韩国旅行者的多语言活动与购物信息雷达。",
        "本站优先使用官方来源、清晰日期、实用旅行提示和透明的更新标签。",
        "K-pop 快闪店和只在社交平台发布的公告会先进入人工审核队列，再公开发布。"
      ],
      pt: [
        "K-Spot Now e um radar multilingue de eventos e compras para visitantes que planejam viagens pela Coreia.",
        "O site prioriza fontes oficiais, datas claras, notas praticas de viagem e etiquetas honestas de atualizacao.",
        "Pop-ups de K-pop e anuncios publicados apenas em redes sociais entram em uma fila de curadoria antes da publicacao."
      ],
      ru: [
        "K-Spot Now — многоязычный радар событий и покупок для гостей, планирующих поездку по Корее.",
        "Сайт отдает приоритет официальным источникам, четким датам, практическим заметкам для путешественников и честным меткам свежести.",
        "K-pop pop-up события и объявления только из соцсетей сначала попадают в очередь проверки, а затем публикуются."
      ],
      ja: [
        "K-Spot Nowは、韓国旅行を計画する訪問者向けの多言語イベント・ショッピング情報サイトです。",
        "公式情報源、明確な日程、実用的な旅行メモ、正直な更新ラベルを優先します。",
        "K-popポップアップやSNSのみの告知は、公開前にキュレーションと確認の対象になります。"
      ]
    },
    contact: {
      en: [
        `For corrections, source suggestions, or partnership inquiries, email ${contactEmail}.`,
        "Please include the official event URL, date range, venue, and language preference."
      ],
      es: [
        `Para correcciones, sugerencias de fuentes o consultas de colaboracion, escribe a ${contactEmail}.`,
        "Incluye la URL oficial del evento, el rango de fechas, el lugar y el idioma que prefieres."
      ],
      zh: [
        `如需更正、推荐官方来源或合作咨询，请发送邮件至 ${contactEmail}。`,
        "请附上官方活动网址、日期范围、地点以及希望使用的语言。"
      ],
      pt: [
        `Para correcoes, sugestoes de fontes ou propostas de parceria, envie email para ${contactEmail}.`,
        "Inclua a URL oficial do evento, periodo, local e idioma de preferencia."
      ],
      ru: [
        `Для исправлений, предложений источников или партнерских запросов напишите на ${contactEmail}.`,
        "Укажите официальную ссылку события, даты, место проведения и предпочтительный язык."
      ],
      ja: [
        `訂正、情報源の提案、提携に関するお問い合わせは ${contactEmail} までご連絡ください。`,
        "公式イベントURL、日程、会場、希望する言語を含めてください。"
      ]
    },
    privacy: {
      en: [
        "This static site does not require user accounts, payments, or login profiles. Basic hosting logs may be processed by the hosting provider for security, abuse prevention, and delivery.",
        "Saved event planning uses browser storage on your own device so you can keep a shortlist of events. K-Spot Now does not receive that saved list unless you email it to us.",
        "If Google AdSense is enabled, Google and its advertising partners may use cookies, local storage, or similar technologies to serve, personalize, limit, and measure ads.",
        "Third-party vendors, including Google, may use advertising cookies based on a visitor's prior visits to this site or other websites. Visitors can manage personalized advertising through Google Ads Settings and browser controls.",
        "For visitors in the EEA, the UK, and Switzerland, advertising consent should be handled through a Google-certified consent management platform when AdSense ads are served.",
        "See the Cookie Policy for more detail about advertising cookies, local browser storage, opt-out choices, and consent updates."
      ],
      es: [
        "Este sitio estatico no requiere cuentas, pagos ni perfiles de inicio de sesion. El proveedor de alojamiento puede procesar registros tecnicos basicos por seguridad, prevencion de abuso y entrega de paginas.",
        "La planificacion guardada usa almacenamiento del navegador en tu propio dispositivo para conservar una lista corta de eventos. K-Spot Now no recibe esa lista salvo que nos la envies por correo.",
        "Si Google AdSense esta habilitado, Google y sus socios publicitarios pueden usar cookies, almacenamiento local o tecnologias similares para mostrar, personalizar, limitar y medir anuncios.",
        "Proveedores externos, incluido Google, pueden usar cookies publicitarias segun visitas anteriores a este sitio u otros sitios. Puedes gestionar anuncios personalizados en Google Ads Settings y en los controles del navegador.",
        "Para visitantes del EEE, Reino Unido y Suiza, el consentimiento publicitario debe gestionarse mediante una plataforma de consentimiento certificada por Google cuando se sirvan anuncios de AdSense.",
        "Consulta la Politica de cookies para mas detalles sobre cookies publicitarias, almacenamiento local, opciones de exclusion y cambios de consentimiento."
      ],
      zh: [
        "本站为静态网站，不要求用户注册账号、付款或登录。托管服务商可能会为安全、防滥用和页面传输处理基本技术日志。",
        "保存活动计划时，清单会存储在你自己设备的浏览器中。除非你主动通过邮件发送给我们，K-Spot Now 不会收到该保存清单。",
        "如果启用 Google AdSense，Google 及其广告合作伙伴可能会使用 Cookie、本地存储或类似技术来投放、个性化、限制和衡量广告。",
        "包括 Google 在内的第三方供应商，可能会根据访问者此前访问本站或其他网站的记录使用广告 Cookie。访问者可通过 Google Ads Settings 和浏览器控制项管理个性化广告。",
        "对于欧洲经济区、英国和瑞士的访问者，投放 AdSense 广告时应通过 Google 认证的同意管理平台处理广告同意。",
        "更多关于广告 Cookie、本地浏览器存储、退出选择和同意更新的信息，请查看 Cookie 政策。"
      ],
      pt: [
        "Este site estatico nao exige contas, pagamentos ou perfis de login. O provedor de hospedagem pode processar logs tecnicos basicos para seguranca, prevencao de abuso e entrega das paginas.",
        "O planejamento salvo usa armazenamento do navegador no seu proprio dispositivo para manter uma lista curta de eventos. O K-Spot Now nao recebe essa lista salvo se voce a enviar por email.",
        "Se o Google AdSense estiver ativado, Google e parceiros de publicidade podem usar cookies, armazenamento local ou tecnologias semelhantes para veicular, personalizar, limitar e medir anuncios.",
        "Fornecedores terceiros, incluindo Google, podem usar cookies de publicidade com base em visitas anteriores a este site ou a outros sites. Visitantes podem gerenciar anuncios personalizados no Google Ads Settings e nos controles do navegador.",
        "Para visitantes do EEE, Reino Unido e Suica, o consentimento de publicidade deve ser tratado por uma plataforma de gestao de consentimento certificada pelo Google quando anuncios AdSense forem exibidos.",
        "Veja a Politica de cookies para mais detalhes sobre cookies de publicidade, armazenamento local, opcoes de opt-out e atualizacoes de consentimento."
      ],
      ru: [
        "Этот статический сайт не требует учетных записей, платежей или профилей входа. Провайдер хостинга может обрабатывать базовые технические журналы для безопасности, предотвращения злоупотреблений и доставки страниц.",
        "Сохранение плана событий использует хранилище браузера на вашем устройстве, чтобы держать короткий список событий. K-Spot Now не получает этот список, если вы сами не отправите его нам по электронной почте.",
        "Если включен Google AdSense, Google и его рекламные партнеры могут использовать cookie, локальное хранилище или похожие технологии для показа, персонализации, ограничения и измерения рекламы.",
        "Сторонние поставщики, включая Google, могут использовать рекламные cookie на основе предыдущих посещений этого сайта или других сайтов. Посетители могут управлять персонализированной рекламой в Google Ads Settings и настройках браузера.",
        "Для посетителей из ЕЭЗ, Великобритании и Швейцарии согласие на рекламу должно обрабатываться через сертифицированную Google платформу управления согласием, когда показывается AdSense.",
        "Подробнее о рекламных cookie, локальном хранилище браузера, вариантах отказа и обновлении согласия см. в Политике cookie."
      ],
      ja: [
        "この静的サイトでは、アカウント、支払い、ログインプロフィールは必要ありません。ホスティング事業者は、セキュリティ、不正利用防止、配信のために基本的な技術ログを処理する場合があります。",
        "保存したイベント計画は、ご自身の端末のブラウザストレージに保存されます。メールで送信しない限り、K-Spot Nowが保存リストを受け取ることはありません。",
        "Google AdSenseを有効にした場合、Googleおよび広告パートナーは、広告の配信、パーソナライズ、頻度制限、測定のためにCookie、ローカルストレージ、類似技術を使用する場合があります。",
        "Googleを含む第三者ベンダーは、このサイトまたは他のサイトへの過去の訪問に基づいて広告Cookieを使用する場合があります。訪問者はGoogle Ads Settingsやブラウザ設定でパーソナライズ広告を管理できます。",
        "EEA、英国、スイスの訪問者にAdSense広告を配信する場合は、Google認定の同意管理プラットフォームで広告同意を扱う必要があります。",
        "広告Cookie、ブラウザ内保存、オプトアウト、同意更新についてはCookieポリシーをご確認ください。"
      ]
    },
    "cookie-policy": {
      en: [
        "K-Spot Now uses a small amount of browser-side storage to make the site useful and to prepare for advertising compliance.",
        "Saved planner storage: when you save an event, the shortlist is stored locally in your browser. It is used only to reopen your own saved event list and calendar download on this device.",
        "Operational data: the hosting and security layer may process basic technical data such as IP address, request path, user agent, and timestamps to deliver pages and prevent abuse.",
        "Advertising cookies: if Google AdSense is enabled, Google and third-party advertising vendors may use cookies or similar technologies to serve ads, personalize ads where allowed, measure ad performance, limit ad frequency, and fight fraud.",
        "Personalized advertising choices: visitors can manage Google personalized ads in Google Ads Settings, use browser cookie controls, or use industry opt-out tools where available.",
        "European consent: for users in the EEA, the UK, and Switzerland, AdSense ads should be paired with a Google-certified consent management platform so visitors can accept, reject, or manage advertising purposes.",
        `Questions or correction requests can be sent to ${contactEmail}.`
      ],
      es: [
        "K-Spot Now usa una pequena cantidad de almacenamiento del navegador para hacer util el sitio y prepararlo para el cumplimiento publicitario.",
        "Almacenamiento del planificador: cuando guardas un evento, la lista corta se guarda localmente en tu navegador. Solo se usa para volver a abrir tu lista y descargar el calendario en este dispositivo.",
        "Datos operativos: la capa de alojamiento y seguridad puede procesar datos tecnicos basicos como direccion IP, ruta solicitada, agente de usuario y marcas de tiempo para entregar paginas y prevenir abuso.",
        "Cookies publicitarias: si Google AdSense esta habilitado, Google y proveedores publicitarios externos pueden usar cookies o tecnologias similares para servir anuncios, personalizarlos cuando este permitido, medir rendimiento, limitar frecuencia y combatir fraude.",
        "Opciones de publicidad personalizada: los visitantes pueden gestionar anuncios personalizados de Google en Google Ads Settings, usar controles del navegador o herramientas de opt-out disponibles.",
        "Consentimiento europeo: para usuarios del EEE, Reino Unido y Suiza, los anuncios de AdSense deben ir acompanados de una plataforma de consentimiento certificada por Google para aceptar, rechazar o gestionar fines publicitarios.",
        `Las preguntas o solicitudes de correccion pueden enviarse a ${contactEmail}.`
      ],
      zh: [
        "K-Spot Now 使用少量浏览器端存储，以便提供保存功能并为广告合规做准备。",
        "保存计划存储：当你保存活动时，短名单会保存在本机浏览器中，只用于在本设备重新打开保存列表和下载日历。",
        "运营数据：托管和安全层可能会处理 IP 地址、请求路径、用户代理和时间戳等基本技术数据，用于页面传输和防滥用。",
        "广告 Cookie：如果启用 Google AdSense，Google 和第三方广告供应商可能会使用 Cookie 或类似技术来投放广告、在允许时个性化广告、衡量效果、限制频率并防止欺诈。",
        "个性化广告选择：访问者可在 Google Ads Settings、浏览器 Cookie 控制或可用的行业退出工具中管理个性化广告。",
        "欧洲同意：对于欧洲经济区、英国和瑞士用户，AdSense 广告应配合 Google 认证的同意管理平台，以便用户接受、拒绝或管理广告用途。",
        `问题或更正请求可发送至 ${contactEmail}。`
      ],
      pt: [
        "K-Spot Now usa uma pequena quantidade de armazenamento do navegador para tornar o site util e preparar a conformidade publicitaria.",
        "Armazenamento do planejador salvo: ao salvar um evento, a lista curta fica localmente no seu navegador. Ela serve apenas para reabrir sua lista salva e baixar o calendario neste dispositivo.",
        "Dados operacionais: a camada de hospedagem e seguranca pode processar dados tecnicos basicos, como IP, caminho solicitado, user agent e horarios, para entregar paginas e prevenir abuso.",
        "Cookies de publicidade: se Google AdSense estiver ativado, Google e fornecedores terceiros podem usar cookies ou tecnologias semelhantes para veicular anuncios, personalizar quando permitido, medir desempenho, limitar frequencia e combater fraude.",
        "Escolhas de publicidade personalizada: visitantes podem gerenciar anuncios personalizados do Google em Google Ads Settings, nos controles do navegador ou em ferramentas de opt-out disponiveis.",
        "Consentimento europeu: para usuarios do EEE, Reino Unido e Suica, anuncios AdSense devem ser acompanhados por uma plataforma de consentimento certificada pelo Google para aceitar, rejeitar ou gerenciar finalidades publicitarias.",
        `Perguntas ou pedidos de correcao podem ser enviados para ${contactEmail}.`
      ],
      ru: [
        "K-Spot Now использует небольшой объем браузерного хранилища, чтобы сделать сайт полезнее и подготовить рекламное соответствие.",
        "Хранилище сохраненного планера: когда вы сохраняете событие, короткий список хранится локально в вашем браузере. Он используется только для повторного открытия списка и скачивания календаря на этом устройстве.",
        "Операционные данные: хостинг и слой безопасности могут обрабатывать базовые технические данные, такие как IP-адрес, путь запроса, user agent и время, для доставки страниц и предотвращения злоупотреблений.",
        "Рекламные cookie: если включен Google AdSense, Google и сторонние рекламные поставщики могут использовать cookie или похожие технологии для показа рекламы, персонализации там, где это разрешено, измерения эффективности, ограничения частоты и борьбы с мошенничеством.",
        "Выбор персонализированной рекламы: посетители могут управлять персонализированной рекламой Google в Google Ads Settings, настройках браузера или доступных инструментах отказа.",
        "Европейское согласие: для пользователей из ЕЭЗ, Великобритании и Швейцарии реклама AdSense должна работать вместе с сертифицированной Google платформой согласия, чтобы посетители могли принять, отклонить или управлять рекламными целями.",
        `Вопросы или запросы на исправление можно отправить на ${contactEmail}.`
      ],
      ja: [
        "K-Spot Nowは、サイトを便利にし広告コンプライアンスに備えるため、少量のブラウザ側ストレージを使用します。",
        "保存プランナーの保存: イベントを保存すると、候補リストはご自身のブラウザにローカル保存されます。この端末で保存リストを開き直し、カレンダーをダウンロードする目的だけに使われます。",
        "運用データ: ホスティングとセキュリティ層は、ページ配信と不正利用防止のため、IPアドレス、リクエストパス、ユーザーエージェント、時刻などの基本的な技術データを処理する場合があります。",
        "広告Cookie: Google AdSenseを有効にした場合、Googleおよび第三者広告ベンダーは、広告配信、許可された範囲でのパーソナライズ、効果測定、頻度制限、不正対策のためにCookieや類似技術を使用する場合があります。",
        "パーソナライズ広告の選択: 訪問者はGoogle Ads Settings、ブラウザのCookie設定、利用可能な業界オプトアウトツールでパーソナライズ広告を管理できます。",
        "欧州の同意: EEA、英国、スイスのユーザーにAdSense広告を配信する場合、Google認定の同意管理プラットフォームを組み合わせ、広告目的の承認、拒否、管理を可能にする必要があります。",
        `質問や訂正依頼は ${contactEmail} までお送りください。`
      ]
    },
    advertising: {
      en: [
        "K-Spot Now may display advertising after an approved ad account is configured, but ads cannot buy event inclusion, card placement, freshness dates, verification labels, source roles, or safety notes.",
        "Event and source selection is based on visitor utility: official tourism, organizer, brand, venue, ticketing, shopping, duty-free, and verified campaign sources.",
        "Source buttons send visitors to the original page for tickets, reservations, stock, purchases, eligibility, or final rules. K-Spot Now does not process payments and does not replace the official source.",
        "Sponsored inquiries, ad placements, and partnerships are reviewed separately from corrections, audits, and source monitoring.",
        `Advertising, correction, or source questions: ${contactEmail}.`
      ],
      es: [
        "K-Spot Now puede mostrar anuncios despues de configurar una cuenta publicitaria aprobada, pero los anuncios no pueden comprar inclusion, posicion, fecha de frescura, etiqueta de verificacion, rol de fuente ni notas de seguridad.",
        "La seleccion de eventos y fuentes se basa en utilidad para visitantes: turismo oficial, organizadores, marcas, recintos, ticketing, compras, duty free y campanas verificadas.",
        "Los botones de fuente llevan a la pagina original para entradas, reservas, stock, compras, elegibilidad o reglas finales. K-Spot Now no procesa pagos ni reemplaza la fuente oficial.",
        "Consultas patrocinadas, anuncios y alianzas se revisan por separado de correcciones, auditorias y monitoreo de fuentes.",
        `Preguntas de publicidad, correccion o fuentes: ${contactEmail}.`
      ],
      pt: [
        "K-Spot Now pode exibir anuncios apos configurar uma conta publicitaria aprovada, mas anuncios nao podem comprar inclusao, posicao, datas de atualizacao, etiquetas de verificacao, papeis de fonte ou notas de seguranca.",
        "A selecao de eventos e fontes se baseia na utilidade para visitantes: turismo oficial, organizadores, marcas, locais, ticketing, compras, duty free e campanhas verificadas.",
        "Botoes de fonte levam visitantes a pagina original para ingressos, reservas, estoque, compras, elegibilidade ou regras finais. K-Spot Now nao processa pagamentos nem substitui a fonte oficial.",
        "Consultas patrocinadas, insercoes publicitarias e parcerias sao revisadas separadamente de correcoes, auditorias e monitoramento de fontes.",
        `Perguntas sobre publicidade, correcao ou fontes: ${contactEmail}.`
      ]
    },
    terms: {
      en: [
        "Information is provided for travel planning and may change without notice.",
        "Always verify official event pages before visiting, purchasing, reserving, or changing travel plans.",
        "K-Spot Now is not affiliated with the listed brands, artists, venues, or government agencies unless explicitly stated."
      ],
      es: [
        "La informacion se ofrece para planificar viajes y puede cambiar sin aviso.",
        "Verifica siempre las paginas oficiales antes de visitar, comprar, reservar o modificar planes de viaje.",
        "K-Spot Now no esta afiliado a las marcas, artistas, recintos o agencias gubernamentales listadas salvo que se indique expresamente."
      ],
      zh: [
        "本站信息用于旅行计划，可能会在未另行通知的情况下变更。",
        "访问、购买、预约或更改行程前，请始终以官方活动页面为准。",
        "除非明确说明，K-Spot Now 与所列品牌、艺人、场馆或政府机构没有隶属关系。"
      ],
      pt: [
        "As informacoes sao fornecidas para planejamento de viagem e podem mudar sem aviso.",
        "Sempre verifique as paginas oficiais antes de visitar, comprar, reservar ou alterar planos de viagem.",
        "K-Spot Now nao e afiliado as marcas, artistas, locais ou agencias governamentais listadas, salvo quando declarado explicitamente."
      ],
      ru: [
        "Информация предоставляется для планирования поездки и может измениться без уведомления.",
        "Всегда проверяйте официальные страницы событий перед посещением, покупкой, бронированием или изменением планов поездки.",
        "K-Spot Now не связан с указанными брендами, артистами, площадками или государственными организациями, если это явно не указано."
      ],
      ja: [
        "情報は旅行計画のために提供されており、予告なく変更される場合があります。",
        "訪問、購入、予約、旅行計画の変更前には、必ず公式イベントページを確認してください。",
        "明記されていない限り、K-Spot Nowは掲載されたブランド、アーティスト、会場、政府機関とは提携していません。"
      ]
    }
  };
  return copy[kind]?.[lang] || copy[kind]?.en || [];
}

function staticPage(lang, kind) {
  const titleKey = kind === "cookie-policy" ? "cookieTitle" : `${kind}Title`;
  const title = tr(lang, titleKey);
  const paragraphs = staticPageParagraphs(lang, kind);
  const body = `
    <main class="page">
      <article class="article-page">
        <h1>${esc(title)}</h1>
        ${paragraphs.map((paragraph) => `<p>${esc(paragraph)}</p>`).join("")}
      </article>
    </main>`;
  return layout({
    lang,
    title: `${title} - K-Spot Now`,
    description: paragraphs[0] || title,
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
    await writeHtml(`${lang}/advertising/index.html`, staticPage(lang, "advertising"));
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

/
  Content-Type: text/html; charset=utf-8

/*.html
  Content-Type: text/html; charset=utf-8

/*/*.html
  Content-Type: text/html; charset=utf-8

/*/*/*.html
  Content-Type: text/html; charset=utf-8

/*/
  Content-Type: text/html; charset=utf-8

/*/*/
  Content-Type: text/html; charset=utf-8

/*/*/*/
  Content-Type: text/html; charset=utf-8

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
      { url: `/${lang}/advertising/`, lastmod: today },
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
