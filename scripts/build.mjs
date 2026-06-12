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
const siteTagline = "Korea events for visitors.";
const siteDomain = "kspotnow.com";
const siteUrl = process.env.SITE_URL || `https://${siteDomain}`;
const contactEmail = process.env.CONTACT_EMAIL || `contact@${siteDomain}`;
const adsensePublisherId = normalizePublisherId(process.env.GOOGLE_ADSENSE_PUBLISHER_ID || process.env.ADSENSE_PUBLISHER_ID || "");
const adsenseClientId = normalizeAdSenseClientId(process.env.GOOGLE_ADSENSE_CLIENT || process.env.ADSENSE_CLIENT || adsensePublisherId);
const adsenseSlotId = normalizeAdSenseSlotId(process.env.GOOGLE_ADSENSE_SLOT || process.env.ADSENSE_SLOT || "");
const googleSiteVerification = normalizeGoogleSiteVerification(process.env.GOOGLE_SITE_VERIFICATION || "");
const assetVersion = encodeURIComponent(process.env.SITE_ASSET_VERSION || await sourceAssetVersion());
const defaultTripAffiliate = {
  allianceId: "8627235",
  sid: "318693138",
  sub1: "",
  sub3: "D17791636",
  displayAdId: "DB17791825",
  displayAdUrl: "https://kr.trip.com/partners/ad/DB17791825?Allianceid=8627235&SID=318693138&trip_sub1=",
  seoulUrl: "https://www.trip.com/hotels/list?city=274&display=Seoul&optionId=274&optionType=City&optionName=Seoul&Allianceid=8627235&SID=318693138&trip_sub1=&trip_sub3=D17791636"
};
const affiliateIds = {
  agodaCid: String(process.env.AGODA_PARTNER_CID || "").trim(),
  tripAllianceId: String(process.env.TRIP_ALLIANCE_ID || defaultTripAffiliate.allianceId).trim(),
  tripSid: String(process.env.TRIP_ALLIANCE_SID || defaultTripAffiliate.sid).trim(),
  tripSub1: String(process.env.TRIP_SUB1 ?? defaultTripAffiliate.sub1).trim(),
  tripSub3: String(process.env.TRIP_SUB3 || defaultTripAffiliate.sub3).trim(),
  tripSeoulUrl: String(process.env.TRIP_SEOUL_HOTELS_URL || defaultTripAffiliate.seoulUrl).trim(),
  tripDisplayAdId: String(process.env.TRIP_DISPLAY_AD_ID || defaultTripAffiliate.displayAdId).trim(),
  tripDisplayAdUrl: String(process.env.TRIP_DISPLAY_AD_URL || defaultTripAffiliate.displayAdUrl).trim(),
  klookAid: String(process.env.KLOOK_AFFILIATE_AID || "").trim(),
  trazyId: String(process.env.TRAZY_AFFILIATE_ID || "").trim()
};
const affiliateEnabled = Boolean(affiliateIds.agodaCid || (affiliateIds.tripAllianceId && affiliateIds.tripSid) || affiliateIds.klookAid || affiliateIds.trazyId);

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
  pt: { name: "Português", locale: "pt-BR", flagRegion: "br" },
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
    heroText: "Live Korea events, pop-ups, and deals for visitors.",
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
    itemsUnit: "items",
    eventsUnit: "events",
    feedOfficialSource: "Official source",
    weatherAtGlance: "At a glance",
    weatherSummary: "Weather summary",
    weatherTemperature: "Temperature",
    weatherRain: "Rain",
    weatherHumidity: "Humidity",
    weatherRainPeak: "Rain peak",
    weatherKmaShortForecast: "KMA short-term forecast",
    weatherKmaUpdated: "KMA forecast updated",
    weatherForecastSource: "Forecast source",
    weatherPreviousBaseline: "Previous-year monthly baseline",
    weatherSeasonalBaseline: "Seasonal baseline",
    weatherBaseline: "Weather baseline",
    weatherTypicalRange: "Typical range",
    weatherPreviousPattern: "previous-year pattern",
    weatherPlanWith: "Plan with",
    weatherVisitorPacking: "visitor packing",
    weatherCheck: "Check",
    weatherLiveForecast: "Live forecast",
    weatherBeforeLeaving: "before leaving",
    weatherWalkingBasics: "walking basics",
    weatherMostHours: "most hours",
    weatherRainChanceUpTo: "rain chance up to",
    weatherMixedConditions: "mixed conditions",
    routeIndexDescription: "Practical Korea travel routes connected to official events, shopping pages, weather notes, and nearby visitor plans.",
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
    heroText: "Fechas, mapa, clima y enlaces oficiales.",
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
    heroText: "日期、地图、天气、官方链接。",
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
    heroText: "Datas, mapa, clima e links oficiais.",
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
    heroText: "Даты, карты, погода и официальные ссылки.",
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
  pt: { name: "Português", locale: "pt-BR", flagRegion: "br" },
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
    heroText: "Live Korea events, pop-ups, and deals for visitors.",
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
    heroText: "Fechas, mapa, clima y enlaces oficiales.",
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
    heroText: "日期、地图、天气、官方链接。",
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
    heroText: "Datas, mapa, clima e links oficiais.",
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
    heroText: "Даты, карты, погода и официальные ссылки.",
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
languages.fr = { name: "Français", locale: "fr-FR" };
languages.de = { name: "Deutsch", locale: "de-DE" };

const languageFlagRegions = {
  en: "us",
  es: "es",
  zh: "cn",
  pt: "br",
  ru: "ru",
  ja: "jp",
  fr: "fr",
  de: "de"
};

for (const [code, region] of Object.entries(languageFlagRegions)) {
  if (languages[code]) languages[code].flagRegion = region;
}

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
  heroText: "日程、地図、天気、公式リンク。",
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
  heroText: "Dates, cartes, meteo et liens officiels.",
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
  browseTypeText: "Commencez par festivals, pop-ups K-pop, beaute, offres hors taxes, achats ou avantages visiteurs.",
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
  dutyfree: "Hors taxes",
  department: "Grands magasins",
  shopping: "Achats",
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
  latestCheckedText: "Derniers controles officiels sur evenements, achats, offres hors taxes et pop-ups.",
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
  itemsUnit: "elements",
  eventsUnit: "evenements",
  feedOfficialSource: "Source officielle",
  weatherAtGlance: "Vue rapide",
  weatherSummary: "Resume meteo",
  weatherTemperature: "Temperature",
  weatherRain: "Pluie",
  weatherHumidity: "Humidite",
  weatherRainPeak: "Pluie max",
  weatherKmaShortForecast: "Prevision courte KMA",
  weatherKmaUpdated: "Prevision KMA mise a jour",
  weatherForecastSource: "Source de prevision",
  weatherPreviousBaseline: "Base mensuelle de l'annee precedente",
  weatherSeasonalBaseline: "Base saisonniere",
  weatherBaseline: "Base meteo",
  weatherTypicalRange: "Plage typique",
  weatherPreviousPattern: "tendance de l'annee precedente",
  weatherPlanWith: "Planifier avec",
  weatherVisitorPacking: "a emporter pour visiteurs",
  weatherCheck: "Verifier",
  weatherLiveForecast: "Prevision en direct",
  weatherBeforeLeaving: "avant de partir",
  weatherWalkingBasics: "essentiels de marche",
  weatherMostHours: "la plupart des heures",
  weatherRainChanceUpTo: "risque de pluie jusqu'a",
  weatherMixedConditions: "conditions mixtes",
  routeIndexDescription: "Itineraires pratiques en Coree relies aux evenements officiels, pages d'achats, notes meteo et plans visiteurs proches.",
  sourceWarning: "Les details officiels peuvent changer. Confirmez toujours les regles, le lieu, l'eligibilite et le stock."
};

dict.de = {
  ...dict.en,
  navEvents: "Veranstaltungen",
  navNow: "Jetzt",
  navCalendar: "Kalender",
  navGuides: "Reisefuhrer",
  navPlanner: "Planer",
  navSources: "Quellen",
  navAbout: "Uber uns",
  navWatchlist: "Quellenwatchlist",
  heroEyebrow: "Korea-Veranstaltungen, Pop-ups und Angebote fur Besucher",
  heroTitle: siteName,
  heroText: "Daten, Karten, Wetter und offizielle Links.",
  ctaEvents: "Veranstaltungen ansehen",
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
  browseDirectory: "Veranstaltungsarten und Orte durchsuchen",
  browseTypeTitle: "Veranstaltungsarten",
  browseTypeText: "Starten Sie mit Feste & Kultur, K-Pop-Pop-ups, Beauty-Angeboten, zollfreien Aktionen, Einkaufen oder Reisevorteilen.",
  browsePlaceTitle: "Orte",
  browsePlaceText: "Stadt- und landesweite Seiten sind von Themen getrennt, damit Besucher nach Ziel scannen konnen.",
  verifyBefore: "Vor dem Besuch auf der offiziellen Quelle prufen.",
  relatedEventsTitle: "Nahe und ahnliche Veranstaltungen",
  relatedGuides: "Verwandte Reisefuhrer",
  category: "Kategorie",
  allCities: "Alle Stadte",
  all: "Alle",
  festival: "Feste & Kultur",
  kpop: "K-Pop-Pop-ups",
  beauty: "Beauty-Angebote",
  dutyfree: "Zollfrei",
  department: "Kaufhauser",
  shopping: "Einkaufen",
  benefits: "Reisevorteile",
  calendarTitle: "Veranstaltungskalender",
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
  sourcesText: "Die Website trennt offizielle APIs, Monitoring offizieller Seiten und K-Pop-Prufqueues, damit Inhalte sicherer fur AdSense und Reisende bleiben.",
  sourceRefreshTitle: "Letzte Quellenaktualisierung",
  sourceRefreshText: "Offentlicher Betriebsstand aus dem letzten Monitoringlauf offizieller Quellen.",
  sourceRefreshNoData: "Noch keine Quellenzusammenfassung erzeugt.",
  sourceRefreshJson: "Offentliches JSON offnen",
  sourceRefreshAttention: "Quellen mit Prufbedarf",
  sourceRefreshCandidates: "Starke Kandidatenseiten",
  sourceRefreshDraftSources: "Top-Entwurfsquellen",
  sourceRefreshRule: "Kandidaten werden nicht direkt veroffentlicht. Jedes Element braucht noch offizielle Daten, Ort, Berechtigung, Bestand und Originalzusammenfassung.",
  watchlistTitle: "Offizielle Monitoring-Watchlist",
  watchlistText: "Offizielle Quellen, Listing-Seiten, Ticketing-Roots und Prufqueues, die vor neuen offentlichen Veranstaltungsseiten gepruft werden.",
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
  nowText: "Aktiv, bald endend, neu gepruft und diese Woche: Korea-Veranstaltungen aus offiziellen Quellen.",
  nowDashboard: "Update-Stand",
  monitoredSources: "Beobachtete Quellen",
  activeQueue: "Aktive Prufqueue",
  fastMovingTopics: "Schnelle Themen",
  latestCheckedGallery: "Neueste Prufungen",
  latestCheckedText: "Neueste offizielle Prufungen zu Veranstaltungen, Einkaufsangeboten, zollfreien Kampagnen und Pop-up-Hinweisen.",
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
  resultCountOneTemplate: "1 Veranstaltung angezeigt",
  resultCountTemplate: "{count} Veranstaltungen angezeigt",
  saveEvent: "Speichern",
  savedEvent: "Gespeichert",
  savedPlannerTitle: "Gespeicherter Korea-Plan",
  savedPlannerEmpty: "Veranstaltungen speichern, um Daten, Stadte und offizielle Links zu vergleichen.",
  savedPlannerCountOne: "1 gespeicherte Veranstaltung",
  savedPlannerCount: "{count} gespeicherte Veranstaltungen",
  openPlanner: "Planer offnen",
  clearSaved: "Loschen",
  removeSaved: "Entfernen",
  openSavedEvent: "Offnen",
  plannerTitle: "Gespeicherter Veranstaltungsplaner",
  plannerText: "Vergleichen Sie gespeicherte Korea-Veranstaltungen auf diesem Gerat und offnen Sie vor Buchungen oder Plananderungen offizielle Quellen.",
  plannerEmptyTitle: "Noch keine gespeicherten Veranstaltungen",
  plannerEmptyText: "Speichern Sie Veranstaltungen aus Galerie oder Detailseiten, um eine kurze Korea-Reiseliste zu bauen.",
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
  statusLive: "Aktiv",
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
  itemsUnit: "Eintrage",
  eventsUnit: "Veranstaltungen",
  feedOfficialSource: "Offizielle Quelle",
  weatherAtGlance: "Kurzuberblick",
  weatherSummary: "Wetterubersicht",
  weatherTemperature: "Temperatur",
  weatherRain: "Regen",
  weatherHumidity: "Luftfeuchte",
  weatherRainPeak: "Regenmaximum",
  weatherKmaShortForecast: "KMA-Kurzfristprognose",
  weatherKmaUpdated: "KMA-Prognose aktualisiert",
  weatherForecastSource: "Prognosequelle",
  weatherPreviousBaseline: "Monatsbasis des Vorjahres",
  weatherSeasonalBaseline: "Saisonale Basis",
  weatherBaseline: "Wetterbasis",
  weatherTypicalRange: "Typischer Bereich",
  weatherPreviousPattern: "Vorjahresmuster",
  weatherPlanWith: "Planen mit",
  weatherVisitorPacking: "Besucher-Packliste",
  weatherCheck: "Prufen",
  weatherLiveForecast: "Aktuelle Prognose",
  weatherBeforeLeaving: "vor der Abfahrt",
  weatherWalkingBasics: "Basis fur Laufwege",
  weatherMostHours: "meiste Stunden",
  weatherRainChanceUpTo: "Regenchance bis",
  weatherMixedConditions: "wechselhafte Bedingungen",
  routeIndexDescription: "Praktische Korea-Reiserouten, verbunden mit offiziellen Veranstaltungen, Einkaufsseiten, Wetternotizen und nahen Besucherplanen.",
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
    freshnessSoon: "revisado pronto",
    freshnessStale: "necesita revision",
    freshnessArchive: "archivado",
    checkedToday: "revisado hoy",
    checkedYesterday: "revisado ayer",
    daysAgo: "dias atras",
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
    freshnessSoon: "revisado em breve",
    freshnessStale: "precisa de revisao",
    freshnessArchive: "arquivado",
    checkedToday: "revisado hoje",
    checkedYesterday: "revisado ontem",
    daysAgo: "dias atras",
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

const filterShortLabels = {
  en: {
    all: "All",
    festival: "Festivals",
    kpop: "K-pop",
    beauty: "Beauty",
    dutyfree: "Duty-free",
    department: "Stores",
    shopping: "Shop",
    benefits: "Travel"
  },
  es: {
    all: "Todo",
    festival: "Festivales",
    kpop: "K-pop",
    beauty: "Belleza",
    dutyfree: "Sin imp.",
    department: "Tiendas",
    shopping: "Compras",
    benefits: "Viaje"
  },
  zh: {
    all: "全部",
    festival: "节庆",
    kpop: "K-pop",
    beauty: "美妆",
    dutyfree: "免税",
    department: "百货",
    shopping: "购物",
    benefits: "旅行"
  },
  pt: {
    all: "Tudo",
    festival: "Festivais",
    kpop: "K-pop",
    beauty: "Beleza",
    dutyfree: "Sem imp.",
    department: "Lojas",
    shopping: "Compras",
    benefits: "Viagem"
  },
  ru: {
    all: "Все",
    festival: "Фестивали",
    kpop: "K-pop",
    beauty: "Бьюти",
    dutyfree: "Duty-free",
    department: "ТЦ",
    shopping: "Шопинг",
    benefits: "Поездки"
  },
  ja: {
    all: "全て",
    festival: "祭り",
    kpop: "K-pop",
    beauty: "美容",
    dutyfree: "免税",
    department: "百貨店",
    shopping: "買い物",
    benefits: "旅行"
  },
  fr: {
    all: "Tout",
    festival: "Festivals",
    kpop: "K-pop",
    beauty: "Beauté",
    dutyfree: "Détaxe",
    department: "Magasins",
    shopping: "Achats",
    benefits: "Voyage"
  },
  de: {
    all: "Alle",
    festival: "Festivals",
    kpop: "K-pop",
    beauty: "Kosmetik",
    dutyfree: "Zollfrei",
    department: "Kaufhaus",
    shopping: "Einkauf",
    benefits: "Reise"
  }
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
      description: "Pages de soldes K-beauty, coupons, rappels tax refund et itineraires d'achats pour voyageurs en Coree."
    },
    "duty-free": {
      title: "Offres hors taxes en Coree et retrait avant l'aeroport",
      description: "Offres Shilla, Lotte, Shinsegae et hors taxes verifiees avec rappels d'eligibilite et de retrait."
    },
    "department-store": {
      title: "Grands magasins en Coree, soldes et pop-ups",
      description: "Soldes, expositions culturelles, pop-ups et evenements par branche pour visiteurs qui preparent leurs achats."
    },
    shopping: {
      title: "Saisons d'achats et de soldes en Coree",
      description: "Campagnes saisonnieres, archives Korea Grand Sale et pages officielles utiles pour preparer ses achats."
    },
    "travel-benefits": {
      title: "Avantages voyage et coupons visiteurs en Coree",
      description: "Avantages officiels, offres partenaires, reductions d'attractions et hubs de coupons touristiques recurrents."
    }
  },
  de: {
    festival: {
      title: "Feste und Kulturveranstaltungen in Korea",
      description: "Geprufte Korea-Feste, Flussveranstaltungen, Konzerte, Auffuhrungen und Kulturkalender fur internationale Besucher."
    },
    kpop: {
      title: "K-Pop-Konzerte, Pop-ups, Merch und Fanveranstaltungen",
      description: "Offizielle K-Pop-Konzert-, Ticketing-, Fanmeeting-, Pop-up-, Merch- und Reservierungshinweise mit Reiseplanung."
    },
    beauty: {
      title: "K-beauty Deals und OLIVE YOUNG Aktionen",
      description: "Offizielle K-beauty Sales, Couponfenster, Tax-Refund-Hinweise und Shoppingrouten fur Korea-Reisende."
    },
    "duty-free": {
      title: "Zollfreie Aktionen in Korea und Flughafen-Abholung",
      description: "Geprufte Shilla-, Lotte-, Shinsegae- und zollfreie Angebote mit Berechtigungs- und Abholhinweisen."
    },
    "department-store": {
      title: "Kaufhaus-Sales und Pop-ups in Korea",
      description: "Kaufhaus-Sales, Kultur-Ausstellungen, Pop-up Stores und branchenspezifische Veranstaltungen fur Besucher."
    },
    shopping: {
      title: "Einkaufsfeste und Sale-Saisons in Korea",
      description: "Saisonale Einkaufskampagnen, Korea Grand Sale Archive und offizielle Planungsseiten fur Einkaufe."
    },
    "travel-benefits": {
      title: "Korea Reisevorteile und Besucher-Coupons",
      description: "Offizielle Besucherangebote, Partnerangebote, Attraktionsrabatte und wiederkehrende Reise-Coupon-Hubs."
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

const cityDisplayNames = {
  en: { Nationwide: "Nationwide" },
  es: { Nationwide: "Todo el pais" },
  zh: { Nationwide: "韩国全境" },
  pt: { Nationwide: "Nacional" },
  ru: { Nationwide: "По всей Корее" },
  ja: { Nationwide: "韓国全域" },
  fr: { Nationwide: "National" },
  de: { Nationwide: "Landesweit" }
};

function cityLabel(lang, city) {
  return cityDisplayNames[lang]?.[city] || city;
}

function cityPageCopy(lang, city) {
  const base = cityDefinitions[city] || {
    title: `${cityLabel(lang, city)} Korea event planner`,
    description: `Officially checked Korea events and travel planning notes for ${cityLabel(lang, city)}.`,
    weatherRegion: city
  };
  const label = cityLabel(lang, city);
  if (lang === "fr") {
    return {
      ...base,
      title: `${label}: evenements, pop-ups et achats en Coree`,
      description: `Evenements verifies pour ${label} avec dates, meteo, noms coreens de carte, sources officielles et idees de trajet.`
    };
  }
  if (lang === "de") {
    return {
      ...base,
      title: `${label}: Veranstaltungen, Pop-ups und Einkaufen in Korea`,
      description: `Geprufte Veranstaltungen fur ${label} mit Daten, Wetter, koreanischen Kartennamen, offiziellen Quellen und Routenideen.`
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

const requiredUiFallbacks = {
  en: {
    itemsUnit: "items",
    eventsUnit: "events",
    feedOfficialSource: "Official source",
    weatherAtGlance: "At a glance",
    weatherSummary: "Weather summary",
    weatherTemperature: "Temperature",
    weatherRain: "Rain",
    weatherHumidity: "Humidity",
    weatherRainPeak: "Rain peak",
    weatherKmaShortForecast: "KMA short-term forecast",
    weatherKmaUpdated: "KMA forecast updated",
    weatherForecastSource: "Forecast source",
    weatherPreviousBaseline: "Previous-year monthly baseline",
    weatherSeasonalBaseline: "Seasonal baseline",
    weatherBaseline: "Weather baseline",
    weatherTypicalRange: "Typical range",
    weatherPreviousPattern: "previous-year pattern",
    weatherPlanWith: "Plan with",
    weatherVisitorPacking: "visitor packing",
    weatherCheck: "Check",
    weatherLiveForecast: "Live forecast",
    weatherBeforeLeaving: "before leaving",
    weatherWalkingBasics: "walking basics",
    weatherMostHours: "most hours",
    weatherRainChanceUpTo: "rain chance up to",
    weatherMixedConditions: "mixed conditions",
    routeIndexDescription: "Practical Korea travel routes connected to official events, shopping pages, weather notes, and nearby visitor plans."
  },
  fr: {
    itemsUnit: "elements",
    eventsUnit: "evenements",
    feedOfficialSource: "Source officielle",
    weatherAtGlance: "Vue rapide",
    weatherSummary: "Resume meteo",
    weatherTemperature: "Temperature",
    weatherRain: "Pluie",
    weatherHumidity: "Humidite",
    weatherRainPeak: "Pluie max",
    weatherKmaShortForecast: "Prevision courte KMA",
    weatherKmaUpdated: "Prevision KMA mise a jour",
    weatherForecastSource: "Source de prevision",
    weatherPreviousBaseline: "Base mensuelle de l'annee precedente",
    weatherSeasonalBaseline: "Base saisonniere",
    weatherBaseline: "Base meteo",
    weatherTypicalRange: "Plage typique",
    weatherPreviousPattern: "tendance de l'annee precedente",
    weatherPlanWith: "Planifier avec",
    weatherVisitorPacking: "a emporter pour visiteurs",
    weatherCheck: "Verifier",
    weatherLiveForecast: "Prevision en direct",
    weatherBeforeLeaving: "avant de partir",
    weatherWalkingBasics: "essentiels de marche",
    weatherMostHours: "la plupart des heures",
    weatherRainChanceUpTo: "risque de pluie jusqu'a",
    weatherMixedConditions: "conditions mixtes",
    routeIndexDescription: "Itineraires pratiques en Coree relies aux evenements officiels, pages d'achats, notes meteo et plans visiteurs proches."
  },
  de: {
    itemsUnit: "Eintrage",
    eventsUnit: "Veranstaltungen",
    feedOfficialSource: "Offizielle Quelle",
    weatherAtGlance: "Kurzuberblick",
    weatherSummary: "Wetterubersicht",
    weatherTemperature: "Temperatur",
    weatherRain: "Regen",
    weatherHumidity: "Luftfeuchte",
    weatherRainPeak: "Regenmaximum",
    weatherKmaShortForecast: "KMA-Kurzfristprognose",
    weatherKmaUpdated: "KMA-Prognose aktualisiert",
    weatherForecastSource: "Prognosequelle",
    weatherPreviousBaseline: "Monatsbasis des Vorjahres",
    weatherSeasonalBaseline: "Saisonale Basis",
    weatherBaseline: "Wetterbasis",
    weatherTypicalRange: "Typischer Bereich",
    weatherPreviousPattern: "Vorjahresmuster",
    weatherPlanWith: "Planen mit",
    weatherVisitorPacking: "Besucher-Packliste",
    weatherCheck: "Prufen",
    weatherLiveForecast: "Aktuelle Prognose",
    weatherBeforeLeaving: "vor der Abfahrt",
    weatherWalkingBasics: "Basis fur Laufwege",
    weatherMostHours: "meiste Stunden",
    weatherRainChanceUpTo: "Regenchance bis",
    weatherMixedConditions: "wechselhafte Bedingungen",
    routeIndexDescription: "Praktische Korea-Reiserouten, verbunden mit offiziellen Veranstaltungen, Einkaufsseiten, Wetternotizen und nahen Besucherplanen."
  }
};

function tr(lang, key) {
  const value = dict[lang]?.[key] || requiredUiFallbacks[lang]?.[key] || requiredUiFallbacks.en[key] || dict.en[key] || key;
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
  if (lang === "en") return false;
  if (!value || typeof value === "string") return true;
  const localized = String(value[lang] || "").trim();
  const english = String(value.en || "").trim();
  return !localized || hasMojibake(localized) || (english && localized === english);
}

const generatedVisitorCopy = {
  en: {
    eventSummary: ({ title, category, city, period }) => `${title} is a ${category} planning page for ${city}, with a planning period of ${period}. K-Spot Now keeps venue, weather, maps, and the official source together before visitors buy, reserve, or go.`,
    eventWhyGo: ({ category }) => `Use this ${category} listing to confirm dates, choose the area, check transport, and open the official source for the final action.`,
    guideSummary: ({ category }) => `A practical Korea ${category} guide for checking official sources, dates, venues, maps, and nearby options before planning.`,
    guideSections: [
      "Start with the official organizer, brand, venue, ticketing, or public tourism source.",
      "Check dates, hours, entry method, purchase limits, and visitor eligibility.",
      "Copy the Korean place name and compare transport, weather, queues, and nearby options.",
      "Use K-Spot Now to plan and compare; finish purchases or reservations on the official source."
    ],
    travelTips: [
      "Recheck the official source on the same day, especially for pop-ups, tickets, and limited offers.",
      "Copy the Korean place name into Naver Map, Kakao Map, or Google Maps before leaving.",
      "Leave time for queues, weather, and stock changes; keep a nearby indoor backup.",
      "Complete purchases, reservations, and entry-rule checks only on the official or linked ticketing page."
    ],
    visitorInfo: {
      theme: ({ category, city }) => `${category} visitor planning in ${city}`,
      hours: "Hours can vary by venue or program; confirm the official source before going.",
      transportation: ({ place }) => `Search ${place} with the Korean place name in Google, Naver, or Kakao Maps.`,
      parking: "Check official parking and access notices; use public transport when parking is limited.",
      smartGuide: "If a QR guide or on-site guide is provided, check available languages at the venue."
    },
    venueStatus: "Official planning period",
    venueTheme: ({ category }) => `${category} program`,
    venueNote: "Confirm exact program, entry, and operating changes on the official source before leaving.",
    highlights: ({ sourceName, period, place, role }) => [
      `${sourceName} is the linked ${role} for final rules and updates.`,
      `Use the checked period ${period} and the place name ${place} for planning.`,
      "K-Spot Now adds weather, map, route, and calendar context before the final handoff."
    ]
  },
  es: {
    eventSummary: ({ title, category, city, period }) => `${title} es una página de planificación de ${category} en ${city}, con periodo ${period}. K-Spot Now reúne lugar, clima, mapas y fuente oficial antes de comprar, reservar o visitar.`,
    eventWhyGo: ({ category }) => `Usa este listado de ${category} para confirmar fechas, elegir zona, revisar transporte y abrir la fuente oficial para la acción final.`,
    guideSummary: ({ category }) => `Guía práctica de ${category} en Corea para revisar fuentes oficiales, fechas, lugares, mapas y opciones cercanas antes de planificar.`,
    guideSections: [
      "Empieza por la fuente oficial: organizador, marca, recinto, ticketing o turismo público.",
      "Revisa fechas, horarios, método de entrada, límites de compra y requisitos para visitantes.",
      "Copia el nombre coreano del lugar y compara transporte, clima, filas y opciones cercanas.",
      "Usa K-Spot Now para planificar y comparar; finaliza compras o reservas en la fuente oficial."
    ],
    travelTips: [
      "Vuelve a revisar la fuente oficial el mismo día, sobre todo para pop-ups, entradas y ofertas limitadas.",
      "Copia el nombre coreano del lugar en Naver Map, Kakao Map o Google Maps antes de salir.",
      "Deja margen para filas, clima y cambios de stock; ten una opción cercana bajo techo.",
      "Completa compras, reservas y reglas de entrada solo en la fuente oficial o ticketing enlazado."
    ],
    visitorInfo: {
      theme: ({ category, city }) => `Planificación para visitantes de ${category} en ${city}`,
      hours: "Los horarios pueden variar por sede o programa; confirma la fuente oficial antes de ir.",
      transportation: ({ place }) => `Busca ${place} con el nombre coreano en Google, Naver o Kakao Maps.`,
      parking: "Confirma estacionamiento y avisos de acceso en la fuente oficial; usa transporte público si el parking es limitado.",
      smartGuide: "Si hay guía QR o guía local, revisa los idiomas disponibles en el lugar."
    },
    venueStatus: "Periodo oficial de planificación",
    venueTheme: ({ category }) => `Programa de ${category}`,
    venueNote: "Confirma programa, entrada y cambios de horario en la fuente oficial antes de salir.",
    highlights: ({ sourceName, period, place, role }) => [
      `${sourceName} es la ${role} enlazada para reglas y actualizaciones finales.`,
      `Usa el periodo verificado ${period} y el nombre de lugar ${place} para planificar.`,
      "K-Spot Now añade clima, mapas, rutas y calendario antes de la visita final a la fuente."
    ]
  },
  zh: {
    eventSummary: ({ title, category, city, period }) => `${title} 是 ${city} 的${category}行程规划页，适用日期为 ${period}。K-Spot Now 汇总地点、天气、地图和官方来源，帮助游客在购买、预约或前往前比较。`,
    eventWhyGo: ({ category }) => `使用这条${category}信息确认日期、选择区域、查看交通，并前往官方来源完成最终操作。`,
    guideSummary: ({ category }) => `韩国${category}实用指南，用于在规划前核对官方来源、日期、地点、地图和周边选项。`,
    guideSections: [
      "先确认官方主办方、品牌、场馆、票务或公共旅游来源。",
      "核对日期、时间、入场方式、购买限制和游客资格。",
      "复制韩文地点名，并比较交通、天气、排队和附近选择。",
      "用 K-Spot Now 做规划和比较；购买或预约请在官方来源完成。"
    ],
    travelTips: [
      "当天再次核对官方来源，尤其是快闪、门票和限量优惠。",
      "出发前把韩文地点名复制到 Naver Map、Kakao Map 或 Google Maps。",
      "为排队、天气和库存变化预留时间，并准备附近室内备选点。",
      "购买、预约和入场规则请只在官方或已链接的票务页面确认。"
    ],
    visitorInfo: {
      theme: ({ category, city }) => `${city} ${category}游客规划`,
      hours: "营业或活动时间可能因场馆和节目而变动；出发前请确认官方来源。",
      transportation: ({ place }) => `用韩文地点名搜索 ${place}，并在 Google、Naver 或 Kakao Maps 中确认路线。`,
      parking: "请在官方来源确认停车和入场动线；停车有限时优先使用公共交通。",
      smartGuide: "如现场提供 QR 导览或指南，请在场馆确认可用语言。"
    },
    venueStatus: "官方规划时段",
    venueTheme: ({ category }) => `${category}项目`,
    venueNote: "出发前请在官方来源确认具体节目、入场和运营变更。",
    highlights: ({ sourceName, period, place, role }) => [
      `${sourceName} 是用于最终规则和更新的已链接${role}。`,
      `请使用已核对日期 ${period} 和地点名 ${place} 进行规划。`,
      "K-Spot Now 在跳转官方来源前补充天气、地图、路线和日历信息。"
    ]
  },
  pt: {
    eventSummary: ({ title, category, city, period }) => `${title} é uma página de planejamento de ${category} em ${city}, com período ${period}. O K-Spot Now reúne local, clima, mapas e fonte oficial antes de comprar, reservar ou visitar.`,
    eventWhyGo: ({ category }) => `Use esta página de ${category} para confirmar datas, escolher a região, checar transporte e abrir a fonte oficial para a ação final.`,
    guideSummary: ({ category }) => `Guia prático de ${category} na Coreia para conferir fontes oficiais, datas, locais, mapas e opções próximas antes de planejar.`,
    guideSections: [
      "Comece pela fonte oficial: organizador, marca, local, bilheteria ou turismo público.",
      "Confira datas, horários, método de entrada, limites de compra e elegibilidade de visitantes.",
      "Copie o nome coreano do local e compare transporte, clima, filas e opções próximas.",
      "Use o K-Spot Now para planejar e comparar; finalize compras ou reservas na fonte oficial."
    ],
    travelTips: [
      "Confira a fonte oficial no mesmo dia, especialmente para pop-ups, ingressos e ofertas limitadas.",
      "Copie o nome coreano do local no Naver Map, Kakao Map ou Google Maps antes de sair.",
      "Reserve tempo para filas, clima e mudanças de estoque; tenha uma alternativa interna por perto.",
      "Finalize compras, reservas e regras de entrada apenas na fonte oficial ou bilheteria ligada."
    ],
    visitorInfo: {
      theme: ({ category, city }) => `Planejamento de ${category} para visitantes em ${city}`,
      hours: "Os horários podem variar por local ou programa; confirme a fonte oficial antes de ir.",
      transportation: ({ place }) => `Pesquise ${place} com o nome coreano no Google, Naver ou Kakao Maps.`,
      parking: "Confira avisos oficiais de estacionamento e acesso; use transporte público quando houver limite de vagas.",
      smartGuide: "Se houver guia QR ou guia local, confirme no local quais idiomas estão disponíveis."
    },
    venueStatus: "Período oficial de planejamento",
    venueTheme: ({ category }) => `Programa de ${category}`,
    venueNote: "Confirme programa, entrada e mudanças de horário na fonte oficial antes de sair.",
    highlights: ({ sourceName, period, place, role }) => [
      `${sourceName} é a ${role} ligada para regras finais e atualizações.`,
      `Use o período verificado ${period} e o nome do local ${place} para planejar.`,
      "O K-Spot Now acrescenta clima, mapa, rotas e calendário antes do encaminhamento final."
    ]
  },
  ru: {
    eventSummary: ({ title, category, city, period }) => `${title} — страница планирования ${category} в ${city} на период ${period}. K-Spot Now собирает место, погоду, карты и официальный источник перед покупкой, бронью или визитом.`,
    eventWhyGo: ({ category }) => `Используйте эту страницу ${category}, чтобы проверить даты, выбрать район, оценить транспорт и открыть официальный источник для финального действия.`,
    guideSummary: ({ category }) => `Практический гид по ${category} в Корее: официальные источники, даты, места, карты и варианты рядом перед планированием.`,
    guideSections: [
      "Начните с официального источника: организатор, бренд, площадка, билетная страница или туристический портал.",
      "Проверьте даты, часы, способ входа, лимиты покупки и условия для посетителей.",
      "Скопируйте корейское название места и сравните транспорт, погоду, очереди и варианты рядом.",
      "Планируйте и сравнивайте в K-Spot Now; покупку или бронь завершайте на официальном источнике."
    ],
    travelTips: [
      "В день визита снова проверьте официальный источник, особенно для pop-up, билетов и лимитированных предложений.",
      "Перед выходом скопируйте корейское название места в Naver Map, Kakao Map или Google Maps.",
      "Оставьте запас на очереди, погоду и изменения наличия; держите рядом вариант в помещении.",
      "Покупку, бронь и правила входа подтверждайте только на официальной или связанной билетной странице."
    ],
    visitorInfo: {
      theme: ({ category, city }) => `Планирование ${category} для посетителей в ${city}`,
      hours: "Часы могут меняться по площадке или программе; проверьте официальный источник перед визитом.",
      transportation: ({ place }) => `Ищите ${place} по корейскому названию в Google, Naver или Kakao Maps.`,
      parking: "Проверьте официальные заметки о парковке и входе; при ограниченной парковке используйте общественный транспорт.",
      smartGuide: "Если есть QR-гид или гид на месте, уточните доступные языки на площадке."
    },
    venueStatus: "Официальный период планирования",
    venueTheme: ({ category }) => `Программа ${category}`,
    venueNote: "Перед выходом проверьте точную программу, вход и изменения расписания на официальном источнике.",
    highlights: ({ sourceName, period, place, role }) => [
      `${sourceName} — связанный ${role} для финальных правил и обновлений.`,
      `Используйте проверенный период ${period} и название места ${place} для планирования.`,
      "K-Spot Now добавляет погоду, карты, маршруты и календарь перед переходом к официальному источнику."
    ]
  },
  ja: {
    eventSummary: ({ title, category, city, period }) => `${title} は、${city}の${category}を計画するためのページです。対象期間は ${period}。K-Spot Now は、購入・予約・訪問前に場所、天気、地図、公式情報をまとめて比較できるようにします。`,
    eventWhyGo: ({ category }) => `この${category}情報で日程、エリア、交通を確認し、最後の手続きは公式情報で行ってください。`,
    guideSummary: ({ category }) => `韓国の${category}を計画する前に、公式情報、日程、場所、地図、周辺候補を確認するための実用ガイドです。`,
    guideSections: [
      "まず主催者、ブランド、会場、チケット、公共観光ページなど公式情報を確認します。",
      "日程、時間、入場方法、購入制限、訪問者向け条件を確認します。",
      "韓国語の場所名をコピーし、交通、天気、待ち時間、周辺候補を比較します。",
      "K-Spot Now で計画と比較を行い、購入や予約は公式情報で完了してください。"
    ],
    travelTips: [
      "ポップアップ、チケット、数量限定オファーは、当日に公式情報をもう一度確認してください。",
      "出発前に韓国語の場所名を Naver Map、Kakao Map、Google Maps にコピーしてください。",
      "行列、天気、在庫変更に備えて時間に余裕を持ち、近くの屋内候補も用意してください。",
      "購入、予約、入場ルールは公式またはリンク先のチケットページで確認してください。"
    ],
    visitorInfo: {
      theme: ({ category, city }) => `${city}の${category}訪問計画`,
      hours: "営業時間やプログラム時間は会場ごとに変わる場合があります。出発前に公式情報を確認してください。",
      transportation: ({ place }) => `${place} を韓国語の場所名で Google、Naver、Kakao Maps から検索してください。`,
      parking: "駐車場と入場動線の公式案内を確認し、駐車が限られる場合は公共交通を使ってください。",
      smartGuide: "QRガイドや現地ガイドがある場合は、会場で利用可能な言語を確認してください。"
    },
    venueStatus: "公式計画期間",
    venueTheme: ({ category }) => `${category}プログラム`,
    venueNote: "出発前に公式情報でプログラム、入場、運営変更を確認してください。",
    highlights: ({ sourceName, period, place, role }) => [
      `${sourceName} は最終ルールと更新確認のためのリンク先${role}です。`,
      `確認済み期間 ${period} と場所名 ${place} を使って計画してください。`,
      "K-Spot Now は公式情報へ進む前に、天気、地図、ルート、カレンダーを補足します。"
    ]
  },
  fr: {
    eventSummary: ({ title, category, city, period }) => `${title} est une page ${category} pour ${city}, avec une période de planification ${period}. K-Spot Now rassemble le lieu, la météo, les cartes et la source officielle avant achat, réservation ou visite.`,
    eventWhyGo: ({ category }) => `Cette fiche ${category} aide à confirmer les dates, choisir le quartier, vérifier le transport et ouvrir la source officielle pour l'action finale.`,
    guideSummary: ({ category }) => `Guide pratique ${category} en Corée pour vérifier sources officielles, dates, lieux, cartes et options proches avant de planifier.`,
    guideSections: [
      "Commencez par la source officielle: organisateur, marque, lieu, billetterie ou page touristique publique.",
      "Vérifiez les dates, horaires, méthode d'entrée, limites d'achat et conditions pour visiteurs.",
      "Copiez le nom coréen du lieu et comparez transport, météo, files possibles et options proches.",
      "Utilisez K-Spot Now pour planifier et comparer; achat ou réservation se finalise sur la source officielle."
    ],
    travelTips: [
      "Revérifiez la source officielle le jour même, surtout pour les pop-ups, tickets et offres limitées.",
      "Copiez le nom coréen du lieu dans Naver Map, Kakao Map ou Google Maps avant de partir.",
      "Gardez du temps pour files, météo et stock; prévoyez une option intérieure proche.",
      "Finalisez achat, réservation et règles d'entrée uniquement sur la source officielle ou billetterie liée."
    ],
    visitorInfo: {
      theme: ({ category, city }) => `Plan visiteur ${category} à ${city}`,
      hours: "Les horaires peuvent varier selon le lieu ou le programme; confirmez la source officielle avant de partir.",
      transportation: ({ place }) => `Recherchez ${place} avec le nom coréen dans Google, Naver ou Kakao Maps.`,
      parking: "Vérifiez les avis officiels de parking et d'accès; privilégiez les transports publics si les places sont limitées.",
      smartGuide: "Si un guide QR ou sur place est proposé, vérifiez les langues disponibles au lieu."
    },
    venueStatus: "Période officielle de planification",
    venueTheme: ({ category }) => `Programme ${category}`,
    venueNote: "Confirmez programme, entrée et changements d'horaires sur la source officielle avant de partir.",
    highlights: ({ sourceName, period, place, role }) => [
      `${sourceName} est la ${role} liée pour les règles finales et mises à jour.`,
      `Utilisez la période vérifiée ${period} et le nom du lieu ${place} pour planifier.`,
      "K-Spot Now ajoute météo, cartes, trajets et calendrier avant le renvoi final."
    ]
  },
  de: {
    eventSummary: ({ title, category, city, period }) => `${title} ist eine ${category}-Planungsseite für ${city} mit dem Zeitraum ${period}. K-Spot Now bündelt Ort, Wetter, Karten und offizielle Quelle vor Kauf, Reservierung oder Besuch.`,
    eventWhyGo: ({ category }) => `Diese ${category}-Seite hilft, Daten zu bestätigen, den Stadtteil zu wählen, Verkehr zu prüfen und die offizielle Quelle für die finale Aktion zu öffnen.`,
    guideSummary: ({ category }) => `Praktischer ${category}-Guide für Korea: offizielle Quellen, Daten, Orte, Karten und nahe Optionen vor der Planung prüfen.`,
    guideSections: [
      "Beginnen Sie mit der offiziellen Quelle: Veranstalter, Marke, Ort, Ticketing oder öffentlicher Tourismusseite.",
      "Prüfen Sie Daten, Zeiten, Eintrittsmethode, Kauflimits und Bedingungen für internationale Besucher.",
      "Kopieren Sie den koreanischen Ortsnamen und vergleichen Sie Verkehr, Wetter, Warteschlangen und nahe Optionen.",
      "Nutzen Sie K-Spot Now zum Planen und Vergleichen; Kauf oder Reservierung erfolgt auf der offiziellen Quelle."
    ],
    travelTips: [
      "Prüfen Sie die offizielle Quelle am selben Tag erneut, besonders bei Pop-ups, Tickets und limitierten Angeboten.",
      "Kopieren Sie den koreanischen Ortsnamen vor der Abfahrt in Naver Map, Kakao Map oder Google Maps.",
      "Planen Sie Zeit für Warteschlangen, Wetter und Bestandsänderungen ein; halten Sie eine nahe Innenraum-Alternative bereit.",
      "Schließen Sie Kauf, Reservierung und Einlassregeln nur auf der offiziellen Seite oder verlinkten Ticketingseite ab."
    ],
    visitorInfo: {
      theme: ({ category, city }) => `${category}-Besuchsplanung in ${city}`,
      hours: "Zeiten können je nach Ort oder Programm wechseln; prüfen Sie die offizielle Quelle vor der Abfahrt.",
      transportation: ({ place }) => `Suchen Sie ${place} mit dem koreanischen Ortsnamen in Google, Naver oder Kakao Maps.`,
      parking: "Prüfen Sie offizielle Hinweise zu Parken und Zugang; nutzen Sie öffentliche Verkehrsmittel, wenn Parkplätze begrenzt sind.",
      smartGuide: "Wenn QR- oder Vor-Ort-Guides angeboten werden, prüfen Sie die verfügbaren Sprachen am Ort."
    },
    venueStatus: "Offizieller Planungszeitraum",
    venueTheme: ({ category }) => `${category}-Programm`,
    venueNote: "Prüfen Sie Programm, Einlass und Betriebsänderungen vor der Abfahrt auf der offiziellen Quelle.",
    highlights: ({ sourceName, period, place, role }) => [
      `${sourceName} ist die verlinkte ${role} für finale Regeln und Updates.`,
      `Nutzen Sie den geprüften Zeitraum ${period} und den Ortsnamen ${place} für die Planung.`,
      "K-Spot Now ergänzt Wetter, Karten, Routen und Kalender vor dem finalen Wechsel."
    ]
  }
};

function visitorCopy(lang) {
  return generatedVisitorCopy[lang] || generatedVisitorCopy.en;
}

const localizedGuideTitles = {
  fr: {
    "how-to-verify-korea-popups": "Verifier un pop-up K-pop en Coree avant d'y aller",
    "korea-duty-free-before-flight": "Verifier les offres hors taxes en Coree avant le vol",
    "korea-shopping-sale-calendar": "Calendrier des soldes en Coree pour visiteurs etrangers",
    "weather-for-korea-events": "Planifier les evenements en Coree avec la meteo",
    "olive-young-shopping-strategy": "Planifier une journee d'achats OLIVE YOUNG en Coree",
    "department-store-popup-planning": "Utiliser les pop-ups de grands magasins pendant un voyage en Coree",
    "kpop-ticket-merch-safety": "Verifier tickets, merch et pop-ups K-pop sans risque",
    "festival-day-itinerary-korea": "Construire un itineraire d'une journee de festival en Coree",
    "korea-event-transport-lockers": "Transport, consignes et bagages pour les evenements en Coree",
    "tax-refund-payments-korea-shopping": "Tax refund et paiements pour les achats en Coree",
    "korea-shopping-sale-season-calendar": "Saisons de soldes en Coree a surveiller",
    "verify-kpop-popup-notices-korea": "Verifier les annonces de pop-ups K-pop avant de planifier un voyage"
  },
  de: {
    "how-to-verify-korea-popups": "K-Pop-Pop-ups in Korea vor dem Besuch prufen",
    "korea-duty-free-before-flight": "Zollfreie Korea-Angebote vor dem Abflug prufen",
    "korea-shopping-sale-calendar": "Korea-Sale-Kalender fur internationale Besucher",
    "weather-for-korea-events": "Korea-Veranstaltungen mit Wetterplanung vorbereiten",
    "olive-young-shopping-strategy": "Einen OLIVE YOUNG Einkaufstag in Korea planen",
    "department-store-popup-planning": "Kaufhaus-Pop-ups in Korea wahrend der Reise nutzen",
    "kpop-ticket-merch-safety": "K-Pop-Tickets, Merch und Pop-ups sicher prufen",
    "festival-day-itinerary-korea": "Eine eintagige Festroute in Korea planen",
    "korea-event-transport-lockers": "Transport, Schliessfacher und Gepack bei Korea-Veranstaltungen",
    "tax-refund-payments-korea-shopping": "Tax Refund und Zahlungen beim Einkaufen in Korea",
    "korea-shopping-sale-season-calendar": "Wichtige Korea-Einkaufssaisons fur Besucher",
    "verify-kpop-popup-notices-korea": "K-Pop-Pop-up-Hinweise vor der Korea-Reise prufen"
  }
};

function guideTitleText(guide, lang) {
  const localized = localizedGuideTitles[lang]?.[guide.slug];
  if (localized) return localized;
  return local(guide.title, lang);
}

function eventSummaryText(event, lang) {
  if (!needsGeneratedVisitorCopy(event.summary, lang)) return local(event.summary, lang);
  const title = local(event.title, lang) || local(event.title, "en") || event.slug;
  const period = eventDateLabel(event, lang);
  const category = categoryLabel(lang, event.category);
  const city = cityLabel(lang, event.city);
  return visitorCopy(lang).eventSummary({ title, period, category, city });
}

function eventWhyGoText(event, lang) {
  if (!needsGeneratedVisitorCopy(event.whyGo, lang)) return local(event.whyGo, lang);
  const category = categoryLabel(lang, event.category);
  return visitorCopy(lang).eventWhyGo({ category });
}

function eventTravelTips(event, lang) {
  if (lang === "en") return event.travelTips || [];
  if (event.travelTips && !Array.isArray(event.travelTips)) {
    const localized = localList(event.travelTips, lang);
    if (localized.length) return localized;
  }
  return visitorCopy(lang).travelTips;
}

function guideSummaryText(guide, lang) {
  if (!needsGeneratedVisitorCopy(guide.summary, lang)) return local(guide.summary, lang);
  const category = categoryLabel(lang, guide.category);
  return visitorCopy(lang).guideSummary({ category });
}

function guideSectionsForLang(guide, lang) {
  if (lang === "en") return localList(guide.sections, lang);
  const localized = Array.isArray(guide.sections?.[lang]) ? guide.sections[lang].filter(Boolean) : [];
  if (localized.length) return localized;
  return visitorCopy(lang).guideSections;
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

function calendarFocusDate(event) {
  const status = statusOf(event);
  if (status === "live") return today;
  if (status === "upcoming") return event.startDate || event.endDate || today;
  return event.endDate || event.startDate || today;
}

function calendarSort(a, b) {
  const statusWeight = { live: 0, upcoming: 1, ended: 2 };
  const statusDiff = statusWeight[statusOf(a)] - statusWeight[statusOf(b)];
  if (statusDiff) return statusDiff;
  const aFocus = calendarFocusDate(a);
  const bFocus = calendarFocusDate(b);
  if (aFocus !== bFocus) return aFocus.localeCompare(bFocus);
  if (statusOf(a) === "live" && a.endDate !== b.endDate) return a.endDate.localeCompare(b.endDate);
  return b.priority - a.priority || a.startDate.localeCompare(b.startDate);
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
  const checkedDate = dateText(lang, today);
  const fastMovingDetail = local({
    en: "K-pop, beauty, duty-free, department stores",
    fr: "K-pop, beaute, hors taxes, grands magasins",
    de: "K-Pop, Beauty, Zollfrei, Kaufhauser"
  }, lang);

  const stats = [
    { value: liveCount, label: tr(lang, "liveNow"), detail: `${endingSoonCount} ${tr(lang, "endingSoon").toLowerCase()}` },
    { value: thisWeekCount, label: tr(lang, "thisWeek"), detail: tr(lang, "statusUpcoming") },
    { value: checkedTodayCount, label: tr(lang, "newlyChecked"), detail: checkedDate },
    { value: fastMovingCount, label: tr(lang, "fastMovingTopics"), detail: fastMovingDetail }
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
        <a href="#recheck-queue">${tr(lang, "recheckQueueTitle")}</a>
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
      ja: "City project",
      fr: "Projet urbain",
      de: "Stadtprojekt"
    },
    concert: {
      en: "Concert",
      es: "Concert",
      zh: "Concert",
      pt: "Concert",
      ru: "Concert",
      ja: "Concert",
      fr: "Concert",
      de: "Konzert"
    },
    festival: {
      en: "Festival",
      es: "Festival",
      zh: "Festival",
      pt: "Festival",
      ru: "Festival",
      ja: "Festival",
      fr: "Festival",
      de: "Fest"
    },
    "pop-up": {
      en: "Pop-up",
      es: "Pop-up",
      zh: "Pop-up",
      pt: "Pop-up",
      ru: "Pop-up",
      ja: "Pop-up",
      fr: "Pop-up",
      de: "Pop-up"
    },
    benefit: {
      en: "Benefit",
      es: "Benefit",
      zh: "Benefit",
      pt: "Benefit",
      ru: "Benefit",
      ja: "Benefit",
      fr: "Avantage",
      de: "Vorteil"
    }
  };
  return labels[event.eventKind]?.[lang] || labels[event.eventKind]?.en || "";
}

function thumbnailBrand(event, lang = "en") {
  const text = `${event.sourceName || ""} ${local(event.title, "en") || ""}`.toLowerCase();
  if (text.includes("olive young")) return "OLIVE YOUNG";
  if (text.includes("shilla")) return "SHILLA";
  if (text.includes("lotte duty")) return "LOTTE";
  if (text.includes("shinsegae duty")) return "SHINSEGAE";
  if (text.includes("duty free")) return categoryLabel(lang, "duty-free").toUpperCase();
  if (text.includes("shinsegae")) return "SHINSEGAE";
  if (text.includes("hyundai")) return "HYUNDAI";
  if (text.includes("lotte")) return "LOTTE";
  if (text.includes("weverse") || text.includes("bts") || text.includes("k-pop") || event.category === "kpop") return "K-POP";
  if (text.includes("visitkorea") || text.includes("korea tourism")) return "VISITKOREA";
  if (text.includes("seoul")) return "SEOUL";
  if (text.includes("busan")) return "BUSAN";
  if (event.category === "festival") return lang === "de" ? "FESTE" : lang === "fr" ? "FESTIVAL" : "FESTIVAL";
  return categoryLabel(lang, event.category).toUpperCase();
}

function thumbnailContext(event, lang) {
  const date = eventDateLabel(event, lang);
  return `${cityLabel(lang, event.city)} · ${date}`;
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
  return `${eventSummaryText(event, lang)} ${status}. ${category}. ${eventDateLabel(event, lang, false)}. ${tr(lang, "feedOfficialSource")}: ${event.sourceUrl}`;
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
        dateLabel: eventDateLabel(event, lang, false),
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
          <span>${esc(thumbnailBrand(event, lang))}</span>
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
          <span><b data-pill-count>${count}</b> ${tr(lang, "itemsUnit")}</span>
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
    const label = cityLabel(lang, city);
    return `
      <a class="city-pill${representative ? " has-media" : ""}" href="${cityHref(lang, city)}" data-browse-city="${esc(city)}">
        ${representativeMedia(representative, lang, label)}
        <span class="pill-copy">
          <strong>${esc(label)}</strong>
          <span><b data-pill-count>${count}</b> ${tr(lang, "eventsUnit")}</span>
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

function localizedSourceType(type, lang = "en") {
  if (lang === "fr") {
    if (/api/.test(type)) return "API officielle";
    if (/campaign/.test(type)) return "veille de campagne officielle";
    if (/ticket/.test(type)) return "source de billetterie";
    return "veille de page officielle";
  }
  if (lang === "de") {
    if (/api/.test(type)) return "offizielle API";
    if (/campaign/.test(type)) return "offizielles Kampagnenmonitoring";
    if (/ticket/.test(type)) return "Ticketquelle";
    return "Monitoring offizieller Seiten";
  }
  return type;
}

function localizedSourceTerm(value, lang = "en") {
  const text = String(value || "").trim();
  if (lang !== "fr" && lang !== "de") return text;
  if (!text) return "";
  if (text.includes("/")) return text.split("/").map((part) => localizedSourceTerm(part.trim(), lang)).join(" / ");
  const lower = text.toLowerCase();
  const fr = [
    [/k-pop/, "tourisme K-pop"],
    [/festival/, "festivals"],
    [/attraction/, "sites touristiques"],
    [/accommodation|lodging|hotel/, "hebergement"],
    [/coupon/, "coupons visiteurs"],
    [/benefit/, "avantages visiteurs"],
    [/shopping|retail|sale/, "achats et soldes"],
    [/duty/, "hors taxes"],
    [/department/, "grands magasins"],
    [/beauty|cosmetic/, "beaute"],
    [/concert|performance/, "concerts et spectacles"],
    [/exhibition/, "expositions"],
    [/culture/, "culture"],
    [/tourism campaign/, "campagnes touristiques"],
    [/previous-year|weather/, "donnees meteo"],
    [/temperature/, "temperature"],
    [/humidity/, "humidite"],
    [/precipitation/, "precipitations"],
    [/short-term forecast|forecast/, "prevision courte"],
    [/rain chance|rain/, "risque de pluie"],
    [/river/, "evenements au bord du fleuve"],
    [/garden/, "evenements jardin"],
    [/family/, "activites famille"],
    [/neighborhood/, "itineraires de quartier"],
    [/english visitor/, "actualites visiteurs"],
    [/island/, "evenements insulaires"],
    [/program/, "programmes visiteurs"],
    [/lineup/, "annonces lineup"],
    [/beach/, "zone plage"],
    [/mud/, "zones experience mud"],
    [/unesco|mask dance/, "patrimoine et danse masquee"],
    [/lantern/, "installations lanternes"],
    [/night/, "routes de nuit"],
    [/trade fair/, "salons"],
    [/fan event|fan meeting|fan sign|fanclub/, "evenements fans"],
    [/fashion week/, "Fashion Week de Seoul"],
    [/market/, "marches"],
    [/public show/, "expositions publiques"],
    [/venue|date listing/, "listes lieu et date"],
    [/pop-up|popups/, "pop-ups"],
    [/brand|collaboration/, "collaborations marque"],
    [/shipping/, "livraison internationale"],
    [/global|foreign visitor/, "visiteurs internationaux"],
    [/campaign/, "campagnes"],
    [/period/, "periode"],
    [/reservation/, "reservations"],
    [/inventory|stock/, "stock"],
    [/entry|entrance/, "entree"],
    [/opening/, "ouvertures"],
    [/planning/, "planification visiteurs"],
    [/promotion|offer|gift/, "promotions visiteurs"],
    [/branch/, "pages de branche"],
    [/airport|pickup/, "retrait aeroport"],
    [/store/, "boutiques"],
    [/merch|goods|album/, "merch officiel"],
    [/commerce/, "commerce fan"],
    [/notice|schedule|restock/, "avis officiels"],
    [/artist|company social/, "canaux artistes"],
    [/travel news|announcement|release|policy/, "annonces officielles"],
    [/image/, "images officielles"],
    [/sync/, "liste synchronisee"],
    [/ticket/, "billetterie"],
    [/city events/, "evenements urbains"],
    [/regional/, "regions"]
  ];
  const de = [
    [/k-pop/, "K-Pop-Tourismus"],
    [/festival/, "Feste"],
    [/attraction/, "Sehenswurdigkeiten"],
    [/accommodation|lodging|hotel/, "Unterkunfte"],
    [/coupon/, "Besucher-Coupons"],
    [/benefit/, "Besuchervorteile"],
    [/shopping|retail|sale/, "Einkaufen und Sales"],
    [/duty/, "Zollfrei"],
    [/department/, "Kaufhauser"],
    [/beauty|cosmetic/, "Beauty"],
    [/concert|performance/, "Konzerte und Auffuhrungen"],
    [/exhibition/, "Ausstellungen"],
    [/culture/, "Kultur"],
    [/tourism campaign/, "Tourismus-Kampagnen"],
    [/previous-year|weather/, "Wetterdaten"],
    [/temperature/, "Temperatur"],
    [/humidity/, "Luftfeuchte"],
    [/precipitation/, "Niederschlag"],
    [/short-term forecast|forecast/, "Kurzfristprognose"],
    [/rain chance|rain/, "Regenchance"],
    [/river/, "Flussevents"],
    [/garden/, "Gartenevents"],
    [/family/, "Familienangebote"],
    [/neighborhood/, "Stadtteilrouten"],
    [/english visitor/, "Besuchermeldungen"],
    [/island/, "Inselveranstaltungen"],
    [/program/, "Besucherprogramme"],
    [/lineup/, "Lineup-Hinweise"],
    [/beach/, "Strandbereich"],
    [/mud/, "Mud-Erlebniszonen"],
    [/unesco|mask dance/, "Kulturerbe und Maskentanz"],
    [/lantern/, "Laterneninstallationen"],
    [/night/, "Nachtwege"],
    [/trade fair/, "Messen"],
    [/fan event|fan meeting|fan sign|fanclub/, "Fanveranstaltungen"],
    [/fashion week/, "Seoul Fashion Week"],
    [/market/, "Markte"],
    [/public show/, "Publikumsausstellungen"],
    [/venue|date listing/, "Ort- und Datumslisten"],
    [/pop-up|popups/, "Pop-ups"],
    [/brand|collaboration/, "Markenkooperationen"],
    [/shipping/, "internationaler Versand"],
    [/global|foreign visitor/, "internationale Besucher"],
    [/campaign/, "Kampagnen"],
    [/period/, "Zeitraum"],
    [/reservation/, "Reservierungen"],
    [/inventory|stock/, "Bestand"],
    [/entry|entrance/, "Einlass"],
    [/opening/, "Starttermine"],
    [/planning/, "Besucherplanung"],
    [/promotion|offer|gift/, "Besucheraktionen"],
    [/branch/, "Filialseiten"],
    [/airport|pickup/, "Flughafenabholung"],
    [/store/, "Stores"],
    [/merch|goods|album/, "offizieller Merch"],
    [/commerce/, "Fan-Commerce"],
    [/notice|schedule|restock/, "offizielle Hinweise"],
    [/artist|company social/, "Kunstlerkanale"],
    [/travel news|announcement|release|policy/, "offizielle Meldungen"],
    [/image/, "offizielle Bilder"],
    [/sync/, "Synchronliste"],
    [/ticket/, "Ticketing"],
    [/city events/, "Stadtevents"],
    [/regional/, "Regionen"]
  ];
  for (const [pattern, replacement] of (lang === "fr" ? fr : de)) {
    if (pattern.test(lower)) return replacement;
  }
  return text;
}

function localizedCoverageText(source, lang = "en", limit = 5) {
  return (source.coverage || [])
    .slice(0, limit)
    .map((item) => localizedSourceTerm(item, lang))
    .filter(Boolean)
    .join(limit <= 2 ? " / " : ", ");
}

function localizedRefreshCadence(cadence, lang = "en") {
  const text = String(cadence || "");
  if (lang === "fr") {
    if (/hourly/.test(text)) return "horaire pendant les periodes sensibles";
    if (/daily/.test(text)) return "quotidien pendant la veille active";
    if (/weekly/.test(text)) return "hebdomadaire, puis quotidien en campagne";
    if (/api key/.test(text)) return "quotidien apres validation de cle API";
    return "reverification manuelle planifiee";
  }
  if (lang === "de") {
    if (/hourly/.test(text)) return "stundlich in sensiblen Phasen";
    if (/daily/.test(text)) return "taglich wahrend aktivem Monitoring";
    if (/weekly/.test(text)) return "wochentlich, in Kampagnen taglich";
    if (/api key/.test(text)) return "taglich nach API-Key-Freigabe";
    return "geplante manuelle Neuprufung";
  }
  return text;
}

function localizedAutomationStatus(status, lang = "en") {
  const text = String(status || "");
  if (lang === "fr") {
    if (/ready/.test(text)) return "pret avec cle API";
    if (/planned/.test(text)) return "API planifiee";
    if (/monitor/.test(text)) return "veille et curation";
    return "revue manuelle";
  }
  if (lang === "de") {
    if (/ready/.test(text)) return "bereit mit API-Key";
    if (/planned/.test(text)) return "API geplant";
    if (/monitor/.test(text)) return "Monitoring und Kuratierung";
    return "manuelle Prufung";
  }
  return text;
}

function localizedSourceNote(source, lang = "en") {
  if (lang === "fr") {
    return `${source.name} sert comme ${localizedSourceType(source.type, lang)} pour verifier ${localizedCoverageText(source, lang, 3) || "les informations visiteurs"} avant publication.`;
  }
  if (lang === "de") {
    return `${source.name} dient als ${localizedSourceType(source.type, lang)} zur Prufung von ${localizedCoverageText(source, lang, 3) || "Besucherinformationen"} vor der Veroffentlichung.`;
  }
  return source.notes;
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

const localizedRouteCopy = {
  fr: {
    "hangang-evening-route": {
      title: "Soiree au Hangang",
      bestFor: "Festivals en plein air, concerts gratuits et visiteurs qui veulent une soiree simple a Seoul.",
      stops: ["Lieu de l'evenement", "Pique-nique au bord du fleuve", "Snack en convenience store", "Marche coucher de soleil ou vue de nuit"],
      tips: ["Verifiez pluie et chaleur avant de partir.", "Prenez d'abord le metro et gardez le taxi en secours.", "Arrivez tot pour les evenements gratuits car les places au bord du fleuve se remplissent vite."]
    },
    "central-seoul-shopping-route": {
      title: "Shopping a Myeongdong et promenade palais",
      bestFor: "Offres beaute, achats hors taxes et premier sejour a Seoul.",
      stops: ["Myeongdong", "Zone flagship OLIVE YOUNG", "Zone Lotte ou Shinsegae", "Cheonggyecheon ou Deoksugung"],
      tips: ["Confirmez tax refund et eligibilite hors taxes avant le paiement.", "Gardez passeport et details de depart pour les achats hors taxes.", "Evitez l'heure de pointe avec des sacs d'achats."]
    },
    "yongsan-fan-route": {
      title: "Route fan K-pop et musee a Yongsan",
      bestFor: "Merch K-pop autour de Yongsan et plans interieurs pour jour chaud ou pluvieux.",
      stops: ["Yongsan I'Park Mall", "CGV ou lieu pop-up", "Musee national de Coree", "Ichon ou marche Hangang"],
      tips: ["Verifiez QR de reservation et regles d'entree avant de partir.", "Ne comptez pas sur le stock merch du jour meme.", "Gardez les etapes interieures comme secours meteo."]
    },
    "palace-jongno-culture-route": {
      title: "Culture palais a Jongno",
      bestFor: "Spectacles traditionnels, musees et journees culturelles pres des palais.",
      stops: ["Changdeokgung ou Jongmyo", "Insadong", "Cafes d'Ikseon-dong", "Lieu de spectacle"],
      tips: ["Reservez les spectacles payants avant de construire toute la journee autour.", "Ajoutez du temps de marche dans les vieux quartiers.", "Bon secours si les evenements au bord du fleuve sont pluvieux."]
    },
    "olympic-park-history-route": {
      title: "Olympic Park et histoire Baekje",
      bestFor: "Concerts de musee, culture en famille et achats cote Jamsil.",
      stops: ["Seoul Baekje Museum", "Olympic Park", "Forteresse Mongchontoseong", "Jamsil ou lac Seokchon"],
      tips: ["Utilisez le musee pendant les heures tres chaudes.", "Verifiez les fermetures avant d'ajouter des achats a Jamsil.", "Chaussures confortables car Olympic Park est vaste."]
    },
    "busan-concert-weekend": {
      title: "Week-end concert a Busan",
      bestFor: "Concerts K-pop, projets fans dans la ville et week-ends tres demandes a Busan.",
      stops: ["Salle de concert ou pop-up", "Plage de Gwangalli", "Haeundae", "Transfert gare de Busan ou aeroport"],
      tips: ["Reservez KTX et logement tot.", "Gardez un plan transport apres le show.", "Evitez de traverser toute la ville juste apres la fin du concert."]
    },
    "regional-summer-festival-rail-route": {
      title: "Route train pour festivals d'ete regionaux",
      bestFor: "Grands festivals hors Seoul ou transport, chaleur et retour comptent.",
      stops: ["Lieu du festival", "Gare ou terminal interurbain proche", "Rue food locale ou plage/parc", "Hotel ou transfert retour"],
      tips: ["Reservez trains et logement avant que les annonces ne fassent monter la demande.", "Prenez pluie et articles rafraichissants car juillet-aout peut changer vite.", "Verifiez derniere entree, bracelet et transport de nuit avant un retour le jour meme."]
    },
    "autumn-heritage-night-route": {
      title: "Patrimoine d'automne et lumieres de nuit",
      bestFor: "Festivals traditionnels, lanternes, forteresses et visiteurs dormant en region.",
      stops: ["Entree principale du festival", "Quartier historique ou route fortifiee", "Diner local", "Zone photo de nuit", "Site patrimoine le lendemain"],
      tips: ["Dormez sur place si le programme finit tard.", "Ajoutez une veste legere pour les soirees au bord de l'eau.", "Verifiez les flux officiels avant de choisir ponts, portes ou defiles."]
    },
    "pangyo-shopping-culture-route": {
      title: "Shopping et culture a Pangyo",
      bestFor: "Expositions de grands magasins, restaurants et achats hors centre de Seoul.",
      stops: ["Hyundai Department Store Pangyo", "Etage culture ou exposition", "Restaurants de Pangyo", "Cafe Street ou retour Gangnam"],
      tips: ["Verifiez les horaires retour car Pangyo est hors centre.", "Utilisez les restaurants du grand magasin pour limiter les transferts.", "Les pages de branche sont souvent plus fiables que les reposts sociaux."]
    }
  },
  de: {
    "hangang-evening-route": {
      title: "Hangang-Abendroute",
      bestFor: "Outdoor-Feste, kostenlose Konzerte und Besucher mit einfachem Seoul-Abendplan.",
      stops: ["Eventort", "Picknickplatz am Fluss", "Convenience-Store-Snack", "Sonnenuntergang oder Nachtblick-Spaziergang"],
      tips: ["Regen und Hitze vor der Abfahrt prufen.", "Zuerst U-Bahn nutzen, Taxi nur als Backup.", "Bei kostenlosen Veranstaltungen fruh kommen, weil Flussplaetze schnell voll werden."]
    },
    "central-seoul-shopping-route": {
      title: "Myeongdong-Einkaufen plus Palastweg",
      bestFor: "Beauty-Angebote, zollfreie Erledigungen und erste Seoul-Reise.",
      stops: ["Myeongdong", "OLIVE YOUNG Flagship-Zone", "Lotte- oder Shinsegae-Shoppingzone", "Cheonggyecheon oder Deoksugung"],
      tips: ["Tax Refund und zollfreie Berechtigung vor dem Bezahlen prufen.", "Pass und Abflugdaten fur zollfreie Kaufe bereithalten.", "Rushhour vermeiden, wenn Einkaufstaschen dabei sind."]
    },
    "yongsan-fan-route": {
      title: "Yongsan Fan- und Museumsroute",
      bestFor: "K-Pop-Merch rund um Yongsan und Indoor-Plane fur heisse oder regnerische Tage.",
      stops: ["Yongsan I'Park Mall", "CGV oder Pop-up-Ort", "Nationalmuseum Korea", "Ichon oder Hangang-Weg"],
      tips: ["Reservierungs-QR und Einlassregeln vorab prufen.", "Nicht auf Tagesbestand bei Merch verlassen.", "Indoor-Stopps als wetterfestes Backup nutzen."]
    },
    "palace-jongno-culture-route": {
      title: "Jongno-Palast- und Kulturrunde",
      bestFor: "Traditionelle Auffuhrungen, Museumsveranstaltungen und Kulturtage im Palastviertel.",
      stops: ["Changdeokgung oder Jongmyo", "Insadong", "Ikseon-dong-Cafes", "Auffuhrungsort"],
      tips: ["Bezahlte Auffuhrungen buchen, bevor der Tag darum geplant wird.", "In alten Vierteln mehr Gehzeit einplanen.", "Gutes Backup, wenn Flussevents verregnet sind."]
    },
    "olympic-park-history-route": {
      title: "Olympic Park und Baekje-Geschichte",
      bestFor: "Museumskonzerte, Familienkultur und Einkaufen im Jamsil-Gebiet.",
      stops: ["Seoul Baekje Museum", "Olympic Park", "Mongchontoseong-Festung", "Jamsil oder Seokchon Lake"],
      tips: ["Museumszeit fur heisse Nachmittage nutzen.", "Schliesszeiten prufen, bevor Einkaufen in Jamsil dazukommt.", "Bequeme Schuhe sind wichtig, weil Olympic Park gross ist."]
    },
    "busan-concert-weekend": {
      title: "Busan-Konzertwochenende",
      bestFor: "K-Pop-Konzerte, Fanprojekte in der Stadt und nachfragestarke Busan-Wochenenden.",
      stops: ["Konzert- oder Pop-up-Ort", "Gwangalli Beach", "Haeundae", "Transfer Busan Station oder Flughafen"],
      tips: ["KTX und Unterkunft fruh buchen.", "Backup fur den Heimweg nach der Show planen.", "Direkt nach Konzertende nicht quer durch die ganze Stadt wechseln."]
    },
    "regional-summer-festival-rail-route": {
      title: "Sommerfestival per Bahn in Regionen",
      bestFor: "Grosse Sommerfeste ausserhalb Seouls, bei denen Transport, Hitze und Ruckfahrt wichtig sind.",
      stops: ["Festivalgelande", "Nahe Bahnstation oder Expressbus-Terminal", "Lokale Food Street oder Strand/Park", "Hotel oder Rucktransfer"],
      tips: ["Intercity-Zuge und Unterkunft vor Nachfrageanstieg buchen.", "Regen- und Kuhlsachen einpacken, weil Juli und August schnell kippen konnen.", "Letzten Einlass, Armband und Nachtverkehr vor Tagesruckfahrt prufen."]
    },
    "autumn-heritage-night-route": {
      title: "Herbst-Erbe und Nachtlichter",
      bestFor: "Traditionelle Feste, Laternenrouten, Festungswege und regionale Ubernachtungen.",
      stops: ["Haupteingang Festival", "Historisches Viertel oder Festungsroute", "Lokales Abendessen", "Nacht-Fotospot", "Erbestatte am nachsten Morgen"],
      tips: ["Ubernachten, wenn das Hauptprogramm spat endet.", "Leichte Jacke fur Fluss- oder Altstadtabende mitnehmen.", "Offizielle Besucherlenkung prufen, bevor Fotospots an Brucken oder Toren geplant werden."]
    },
    "pangyo-shopping-culture-route": {
      title: "Pangyo-Einkaufen und Kulturroute",
      bestFor: "Kaufhaus-Ausstellungen, Restaurants und Einkaufen ausserhalb des Seoul-Zentrums.",
      stops: ["Hyundai Department Store Pangyo", "Kultur- oder Ausstellungsfloor", "Pangyo Dining", "Cafe Street oder Ruckweg nach Gangnam"],
      tips: ["Ruckfahrzeiten prufen, weil Pangyo ausserhalb des Zentrums liegt.", "Kaufhausrestaurants nutzen, um Wege zu sparen.", "Filialseiten sind meist genauer als Social-Media-Reposts."]
    }
  }
};

const generatedRouteTitles = {
  es: {
    "hangang-evening-route": "Ruta nocturna por Hangang",
    "central-seoul-shopping-route": "Myeongdong y paseo de palacios",
    "yongsan-fan-route": "Ruta fan en Yongsan",
    "palace-jongno-culture-route": "Palacios y cultura en Jongno",
    "olympic-park-history-route": "Olympic Park e historia Baekje",
    "busan-concert-weekend": "Fin de semana de concierto en Busan",
    "regional-summer-festival-rail-route": "Festivales regionales en tren",
    "autumn-heritage-night-route": "Patrimonio de otoño y luces nocturnas",
    "pangyo-shopping-culture-route": "Shopping y cultura en Pangyo"
  },
  zh: {
    "hangang-evening-route": "汉江夜间路线",
    "central-seoul-shopping-route": "明洞购物与宫殿散步",
    "yongsan-fan-route": "龙山粉丝与室内路线",
    "palace-jongno-culture-route": "钟路宫殿文化路线",
    "olympic-park-history-route": "奥林匹克公园与百济历史",
    "busan-concert-weekend": "釜山演唱会周末路线",
    "regional-summer-festival-rail-route": "地方夏季庆典铁路路线",
    "autumn-heritage-night-route": "秋季遗产与夜景路线",
    "pangyo-shopping-culture-route": "板桥购物与文化路线"
  },
  pt: {
    "hangang-evening-route": "Rota noturna pelo Hangang",
    "central-seoul-shopping-route": "Myeongdong e caminhada por palácios",
    "yongsan-fan-route": "Rota de fãs em Yongsan",
    "palace-jongno-culture-route": "Palácios e cultura em Jongno",
    "olympic-park-history-route": "Olympic Park e história Baekje",
    "busan-concert-weekend": "Fim de semana de show em Busan",
    "regional-summer-festival-rail-route": "Festivais regionais de trem",
    "autumn-heritage-night-route": "Patrimônio de outono e luzes noturnas",
    "pangyo-shopping-culture-route": "Compras e cultura em Pangyo"
  },
  ru: {
    "hangang-evening-route": "Вечерний маршрут у реки Хан",
    "central-seoul-shopping-route": "Мёндон, шопинг и прогулка у дворца",
    "yongsan-fan-route": "Фан-маршрут в Ёнсане",
    "palace-jongno-culture-route": "Дворцы и культура в Чонно",
    "olympic-park-history-route": "Olympic Park и история Пэкче",
    "busan-concert-weekend": "Концертные выходные в Пусане",
    "regional-summer-festival-rail-route": "Региональные летние фестивали поездом",
    "autumn-heritage-night-route": "Осеннее наследие и ночные огни",
    "pangyo-shopping-culture-route": "Шопинг и культура в Пангё"
  },
  ja: {
    "hangang-evening-route": "漢江イブニングルート",
    "central-seoul-shopping-route": "明洞ショッピングと宮殿散策",
    "yongsan-fan-route": "龍山ファンルート",
    "palace-jongno-culture-route": "鍾路の宮殿文化ルート",
    "olympic-park-history-route": "Olympic Park と百済歴史ルート",
    "busan-concert-weekend": "釜山コンサート週末ルート",
    "regional-summer-festival-rail-route": "地方夏祭り鉄道ルート",
    "autumn-heritage-night-route": "秋の文化遺産と夜景ルート",
    "pangyo-shopping-culture-route": "板橋ショッピング文化ルート"
  }
};

const generatedRouteBestFor = {
  es: {
    "hangang-evening-route": "Festivales al aire libre, conciertos gratuitos y una noche sencilla en Seúl.",
    "central-seoul-shopping-route": "Compras de belleza, duty free y primera visita a Seúl.",
    "yongsan-fan-route": "Merch K-pop, centros comerciales y planes bajo techo para calor o lluvia.",
    "palace-jongno-culture-route": "Cultura tradicional, museos y días tranquilos cerca de palacios.",
    "olympic-park-history-route": "Museos, parques amplios y compras en la zona de Jamsil.",
    "busan-concert-weekend": "Conciertos K-pop, proyectos de fans y fines de semana de alta demanda en Busan.",
    "regional-summer-festival-rail-route": "Festivales fuera de Seúl donde importan transporte, calor y regreso.",
    "autumn-heritage-night-route": "Festivales tradicionales, linternas y planes regionales con noche incluida.",
    "pangyo-shopping-culture-route": "Exposiciones de grandes almacenes, restaurantes y compras fuera del centro."
  },
  zh: {
    "hangang-evening-route": "适合户外庆典、免费演出和轻松的首尔夜间计划。",
    "central-seoul-shopping-route": "适合美妆优惠、免税购物和第一次到首尔的游客。",
    "yongsan-fan-route": "适合 K-pop 周边、商场和炎热或雨天的室内计划。",
    "palace-jongno-culture-route": "适合传统文化、博物馆和宫殿周边的一日安排。",
    "olympic-park-history-route": "适合博物馆、公园散步和蚕室一带购物。",
    "busan-concert-weekend": "适合 K-pop 演唱会、粉丝企划和釜山高需求周末。",
    "regional-summer-festival-rail-route": "适合首尔以外的大型夏季庆典，重点关注交通、炎热和返程。",
    "autumn-heritage-night-route": "适合传统庆典、灯会和需要过夜的地方行程。",
    "pangyo-shopping-culture-route": "适合百货展览、餐饮和首尔中心外购物。"
  },
  pt: {
    "hangang-evening-route": "Festivais ao ar livre, shows gratuitos e uma noite simples em Seul.",
    "central-seoul-shopping-route": "Compras de beleza, duty free e primeira visita a Seul.",
    "yongsan-fan-route": "Merch K-pop, shoppings e planos internos para calor ou chuva.",
    "palace-jongno-culture-route": "Cultura tradicional, museus e dias tranquilos perto dos palácios.",
    "olympic-park-history-route": "Museus, parques amplos e compras na região de Jamsil.",
    "busan-concert-weekend": "Shows K-pop, projetos de fãs e fins de semana concorridos em Busan.",
    "regional-summer-festival-rail-route": "Festivais fora de Seul em que transporte, calor e retorno importam.",
    "autumn-heritage-night-route": "Festivais tradicionais, lanternas e viagens regionais com pernoite.",
    "pangyo-shopping-culture-route": "Exposições em lojas de departamento, restaurantes e compras fora do centro."
  },
  ru: {
    "hangang-evening-route": "Открытые фестивали, бесплатные концерты и простой вечерний план в Сеуле.",
    "central-seoul-shopping-route": "Бьюти-покупки, duty free и первый визит в Сеул.",
    "yongsan-fan-route": "K-pop мерч, торговые центры и планы в помещении для жары или дождя.",
    "palace-jongno-culture-route": "Традиционная культура, музеи и спокойный день у дворцов.",
    "olympic-park-history-route": "Музеи, большие парки и покупки в районе Чамсиль.",
    "busan-concert-weekend": "K-pop концерты, фан-проекты и востребованные выходные в Пусане.",
    "regional-summer-festival-rail-route": "Фестивали вне Сеула, где важны транспорт, жара и возвращение.",
    "autumn-heritage-night-route": "Традиционные фестивали, фонари и региональные поездки с ночёвкой.",
    "pangyo-shopping-culture-route": "Универмаги, выставки, рестораны и покупки вне центра Сеула."
  },
  ja: {
    "hangang-evening-route": "屋外フェス、無料コンサート、気軽なソウルの夜計画向け。",
    "central-seoul-shopping-route": "ビューティー、免税、初めてのソウル買い物向け。",
    "yongsan-fan-route": "K-pop グッズ、商業施設、暑さや雨の日の屋内計画向け。",
    "palace-jongno-culture-route": "伝統文化、博物館、宮殿周辺の落ち着いた一日向け。",
    "olympic-park-history-route": "博物館、広い公園、蚕室エリアの買い物向け。",
    "busan-concert-weekend": "K-pop コンサート、ファン企画、需要が高い釜山週末向け。",
    "regional-summer-festival-rail-route": "交通、暑さ、帰路が重要なソウル外の夏祭り向け。",
    "autumn-heritage-night-route": "伝統祭り、灯り、地方での宿泊を含む計画向け。",
    "pangyo-shopping-culture-route": "百貨店展示、食事、ソウル中心部外の買い物向け。"
  }
};

const routeStopTranslations = {
  es: {
    "Event venue": "Lugar del evento",
    "Riverside picnic spot": "Zona de picnic junto al río",
    "Convenience store snack stop": "Parada de snacks",
    "Sunset or night-view walk": "Paseo de atardecer o vista nocturna",
    "OLIVE YOUNG flagship area": "Zona flagship de OLIVE YOUNG",
    "Lotte or Shinsegae shopping zone": "Zona comercial Lotte o Shinsegae",
    "CGV or pop-up venue": "CGV o sede pop-up",
    "Performance venue": "Lugar del espectáculo",
    "Concert or pop-up venue": "Lugar de concierto o pop-up",
    "Busan Station or airport transfer": "Traslado a estación de Busan o aeropuerto",
    "Festival venue": "Lugar del festival",
    "Nearest intercity rail or express bus hub": "Estación o terminal interurbana cercana",
    "Local food street or beach/park walk": "Calle gastronómica local o paseo por playa/parque",
    "Hotel or return transfer": "Hotel o traslado de regreso",
    "Main festival gate": "Entrada principal del festival",
    "Historic district or fortress route": "Barrio histórico o ruta de fortaleza",
    "Local dinner stop": "Cena local",
    "Night photo zone": "Zona de fotos nocturna",
    "Next-morning heritage site": "Sitio histórico para la mañana siguiente",
    "Culture or exhibition floor": "Planta cultural o de exposición",
    "Pangyo dining": "Restaurantes de Pangyo",
    "Cafe Street or return to Gangnam": "Calle de cafés o regreso a Gangnam"
  },
  zh: {
    "Event venue": "活动地点",
    "Riverside picnic spot": "河边野餐点",
    "Convenience store snack stop": "便利店小吃点",
    "Sunset or night-view walk": "日落或夜景散步",
    "OLIVE YOUNG flagship area": "OLIVE YOUNG 旗舰区域",
    "Lotte or Shinsegae shopping zone": "乐天或新世界购物区",
    "CGV or pop-up venue": "CGV 或快闪地点",
    "Performance venue": "演出场地",
    "Concert or pop-up venue": "演唱会或快闪地点",
    "Busan Station or airport transfer": "釜山站或机场换乘",
    "Festival venue": "庆典场地",
    "Nearest intercity rail or express bus hub": "最近的城际铁路或高速巴士枢纽",
    "Local food street or beach/park walk": "当地美食街或海滩/公园散步",
    "Hotel or return transfer": "酒店或返程换乘",
    "Main festival gate": "庆典主入口",
    "Historic district or fortress route": "历史街区或城郭路线",
    "Local dinner stop": "当地晚餐点",
    "Night photo zone": "夜景拍照区",
    "Next-morning heritage site": "次日上午文化遗产点",
    "Culture or exhibition floor": "文化或展览楼层",
    "Pangyo dining": "板桥餐饮",
    "Cafe Street or return to Gangnam": "咖啡街或返回江南"
  },
  pt: {
    "Event venue": "Local do evento",
    "Riverside picnic spot": "Ponto de piquenique à beira do rio",
    "Convenience store snack stop": "Parada para snack",
    "Sunset or night-view walk": "Caminhada ao pôr do sol ou vista noturna",
    "OLIVE YOUNG flagship area": "Área flagship da OLIVE YOUNG",
    "Lotte or Shinsegae shopping zone": "Zona de compras Lotte ou Shinsegae",
    "CGV or pop-up venue": "CGV ou local pop-up",
    "Performance venue": "Local da apresentação",
    "Concert or pop-up venue": "Local de show ou pop-up",
    "Busan Station or airport transfer": "Transfer para estação de Busan ou aeroporto",
    "Festival venue": "Local do festival",
    "Nearest intercity rail or express bus hub": "Estação intermunicipal ou terminal expresso próximo",
    "Local food street or beach/park walk": "Rua gastronômica local ou caminhada por praia/parque",
    "Hotel or return transfer": "Hotel ou transfer de retorno",
    "Main festival gate": "Entrada principal do festival",
    "Historic district or fortress route": "Bairro histórico ou rota de fortaleza",
    "Local dinner stop": "Parada para jantar local",
    "Night photo zone": "Zona de fotos noturnas",
    "Next-morning heritage site": "Patrimônio para a manhã seguinte",
    "Culture or exhibition floor": "Piso cultural ou de exposição",
    "Pangyo dining": "Restaurantes em Pangyo",
    "Cafe Street or return to Gangnam": "Cafe Street ou retorno a Gangnam"
  },
  ru: {
    "Event venue": "Место события",
    "Riverside picnic spot": "Место для пикника у реки",
    "Convenience store snack stop": "Остановка за перекусом",
    "Sunset or night-view walk": "Прогулка на закате или с ночным видом",
    "OLIVE YOUNG flagship area": "Флагманская зона OLIVE YOUNG",
    "Lotte or Shinsegae shopping zone": "Торговая зона Lotte или Shinsegae",
    "CGV or pop-up venue": "CGV или pop-up площадка",
    "Performance venue": "Площадка выступления",
    "Concert or pop-up venue": "Концертная или pop-up площадка",
    "Busan Station or airport transfer": "Трансфер к станции Busan или аэропорту",
    "Festival venue": "Площадка фестиваля",
    "Nearest intercity rail or express bus hub": "Ближайшая междугородняя станция или автобусный терминал",
    "Local food street or beach/park walk": "Местная гастрономическая улица или прогулка у пляжа/парка",
    "Hotel or return transfer": "Отель или обратный трансфер",
    "Main festival gate": "Главный вход фестиваля",
    "Historic district or fortress route": "Исторический район или крепостной маршрут",
    "Local dinner stop": "Местный ужин",
    "Night photo zone": "Ночная фотозона",
    "Next-morning heritage site": "Культурный объект на следующее утро",
    "Culture or exhibition floor": "Культурный или выставочный этаж",
    "Pangyo dining": "Рестораны Пангё",
    "Cafe Street or return to Gangnam": "Cafe Street или возвращение в Gangnam"
  },
  ja: {
    "Event venue": "イベント会場",
    "Riverside picnic spot": "川沿いのピクニック地点",
    "Convenience store snack stop": "コンビニ休憩",
    "Sunset or night-view walk": "夕日または夜景散歩",
    "OLIVE YOUNG flagship area": "OLIVE YOUNG フラッグシップ周辺",
    "Lotte or Shinsegae shopping zone": "Lotte または Shinsegae の買い物エリア",
    "CGV or pop-up venue": "CGV またはポップアップ会場",
    "Performance venue": "公演会場",
    "Concert or pop-up venue": "コンサートまたはポップアップ会場",
    "Busan Station or airport transfer": "釜山駅または空港への移動",
    "Festival venue": "フェスティバル会場",
    "Nearest intercity rail or express bus hub": "最寄りの都市間鉄道または高速バスターミナル",
    "Local food street or beach/park walk": "地元グルメ通りまたは海辺/公園散策",
    "Hotel or return transfer": "ホテルまたは帰路の移動",
    "Main festival gate": "フェスティバル正門",
    "Historic district or fortress route": "歴史地区または城郭ルート",
    "Local dinner stop": "地元夕食スポット",
    "Night photo zone": "夜景フォトスポット",
    "Next-morning heritage site": "翌朝の文化遺産スポット",
    "Culture or exhibition floor": "文化または展示フロア",
    "Pangyo dining": "板橋ダイニング",
    "Cafe Street or return to Gangnam": "カフェ通りまたは江南へ戻る"
  }
};

const generatedRouteTips = {
  es: [
    "Confirma la página oficial antes de salir.",
    "Revisa clima, transporte y hora de regreso el mismo día.",
    "Ten una opción cercana para comer, comprar o esperar bajo techo."
  ],
  zh: [
    "出发前请确认官方页面。",
    "当天再次查看天气、交通和返程时间。",
    "准备附近的用餐、购物或室内等待备选点。"
  ],
  pt: [
    "Confirme a página oficial antes de sair.",
    "Confira clima, transporte e horário de retorno no mesmo dia.",
    "Mantenha uma opção próxima para comer, comprar ou esperar em local coberto."
  ],
  ru: [
    "Перед выходом проверьте официальную страницу.",
    "В тот же день уточните погоду, транспорт и время возвращения.",
    "Держите рядом вариант для еды, покупок или ожидания в помещении."
  ],
  ja: [
    "出発前に公式ページを確認してください。",
    "当日に天気、交通、帰りの時間をもう一度見てください。",
    "近くの食事、買い物、屋内待機スポットを用意してください。"
  ]
};

function generatedRouteCopy(route, lang = "en") {
  return {
    ...route,
    title: generatedRouteTitles[lang]?.[route.slug] || route.title,
    bestFor: generatedRouteBestFor[lang]?.[route.slug] || route.bestFor,
    stops: (route.stops || []).map((stop) => routeStopTranslations[lang]?.[stop] || stop),
    tips: generatedRouteTips[lang] || route.tips || []
  };
}

function routeCopy(route, lang = "en") {
  const localized = localizedRouteCopy[lang]?.[route.slug];
  if (localized) return localized;
  if (lang === "en") return route;
  return generatedRouteCopy(route, lang);
}

function routeDescription(route, lang = "en") {
  const copy = routeCopy(route, lang);
  if (lang === "fr") return `${copy.bestFor} Etapes: ${copy.stops.join(", ")}.`;
  if (lang === "de") return `${copy.bestFor} Stopps: ${copy.stops.join(", ")}.`;
  const stopLabel = {
    es: "Paradas",
    zh: "包括站点",
    pt: "Paradas",
    ru: "Остановки",
    ja: "主な立ち寄り先"
  }[lang];
  if (stopLabel) return `${copy.bestFor} ${stopLabel}: ${copy.stops.join(", ")}.`;
  return `${copy.bestFor} Stops include ${copy.stops.join(", ")}.`;
}

function routeMetaLine(route, copy) {
  const regions = (route.regions || []).slice(0, 2).join(" / ");
  const stops = Array.isArray(copy.stops) ? copy.stops.length : 0;
  return [stops ? `${stops} stops` : "", regions].filter(Boolean).join(" / ");
}

function routeCard(route, lang = "en") {
  const copy = routeCopy(route, lang);
  return `
    <article class="route-card">
      <span class="route-card-visual" aria-hidden="true">
        <span class="route-card-icon about-icon icon-map"></span>
        <span class="route-card-path"><i></i><i></i><i></i></span>
      </span>
      <span class="route-card-kicker">${esc(copy.bestFor)}</span>
      <h3>${esc(copy.title)}</h3>
      <small class="route-card-meta">${esc(routeMetaLine(route, copy))}</small>
      <ol>${copy.stops.map((stop) => `<li>${esc(stop)}</li>`).join("")}</ol>
      <ul>${copy.tips.slice(0, 2).map((tip) => `<li>${esc(tip)}</li>`).join("")}</ul>
    </article>`;
}

function routeLinkCard(route, lang) {
  const copy = routeCopy(route, lang);
  return `
    <a class="route-card" href="${routeHref(lang, route)}">
      <span class="route-card-visual" aria-hidden="true">
        <span class="route-card-icon about-icon icon-map"></span>
        <span class="route-card-path"><i></i><i></i><i></i></span>
      </span>
      <span class="route-card-kicker">${esc(copy.bestFor)}</span>
      <h3>${esc(copy.title)}</h3>
      <small class="route-card-meta">${esc(routeMetaLine(route, copy))}</small>
      <ol>${copy.stops.map((stop) => `<li>${esc(stop)}</li>`).join("")}</ol>
      <ul>${copy.tips.slice(0, 2).map((tip) => `<li>${esc(tip)}</li>`).join("")}</ul>
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
  const placeSub = nationwideBenefit ? tr(lang, "campaignMapSub") : `${esc(event.district)}, ${esc(cityLabel(lang, event.city))}`;
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

function tripHotelUrlFor(city) {
  if (city === "Seoul" && affiliateIds.tripSeoulUrl) return affiliateIds.tripSeoulUrl;
  const params = new URLSearchParams({
    cityName: city,
    Allianceid: affiliateIds.tripAllianceId,
    SID: affiliateIds.tripSid,
    trip_sub1: affiliateIds.tripSub1,
    trip_sub3: affiliateIds.tripSub3
  });
  return `https://www.trip.com/hotels/list?${params.toString()}`;
}

function affiliateLinksFor(event) {
  const city = !event.city || event.city === "Nationwide" ? "Seoul" : event.city;
  const encodedCity = encodeURIComponent(city);
  const upcomingStay = statusOf(event) !== "ended" && event.startDate >= today;
  const links = [];

  if (affiliateIds.agodaCid) {
    const checkIn = upcomingStay ? `&checkIn=${event.startDate}` : "";
    links.push({ partner: "Agoda", type: "hotels", city, href: `https://www.agoda.com/search?cid=${encodeURIComponent(affiliateIds.agodaCid)}&textToSearch=${encodedCity}${checkIn}` });
  }
  if (affiliateIds.tripAllianceId && affiliateIds.tripSid) {
    links.push({ partner: "Trip.com", type: "hotels", city, href: tripHotelUrlFor(city) });
  }
  if (affiliateIds.klookAid) {
    links.push({ partner: "Klook", type: "tours", city, href: `https://www.klook.com/en-US/search/result/?query=${encodedCity}&aid=${encodeURIComponent(affiliateIds.klookAid)}` });
  }
  if (affiliateIds.trazyId) {
    links.push({ partner: "Trazy", type: "tours", city: "Korea", href: `https://www.trazy.com/?aff=${encodeURIComponent(affiliateIds.trazyId)}` });
  }
  return links;
}

function hotelAffiliateButton(event, lang) {
  if (!affiliateEnabled) return "";
  const hotelLink = affiliateLinksFor(event).find((link) => link.type === "hotels");
  if (!hotelLink) return "";
  const label = {
    en: "Hotels near {city}",
    es: "Hoteles cerca de {city}",
    zh: "{city}附近酒店",
    pt: "Hoteis perto de {city}",
    ru: "Отели рядом с {city}",
    ja: "{city}周辺ホテル",
    fr: "Hotels pres de {city}",
    de: "Hotels nahe {city}"
  }[lang] || "Hotels near {city}";
  return `<a class="button light affiliate-action" href="${esc(hotelLink.href)}" rel="sponsored nofollow noopener" target="_blank">${esc(label.replace("{city}", cityLabel(lang, hotelLink.city)))}</a>`;
}

function tripSkyscraperBanner(lang) {
  if (!affiliateIds.tripAllianceId || !affiliateIds.tripSid) return "";
  const copy = {
    en: {
      aria: "Sponsored Trip.com hotel link",
      label: "Ad",
      title: "Stay near the route",
      meta: "Hotels around Seoul, Busan, and event stops",
      cta: "Check stays"
    },
    es: {
      aria: "Enlace patrocinado de hoteles Trip.com",
      label: "Ad",
      title: "Duerme cerca",
      meta: "Hoteles junto a rutas y eventos",
      cta: "Ver hoteles"
    },
    zh: {
      aria: "Trip.com 酒店赞助链接",
      label: "Ad",
      title: "住在路线附近",
      meta: "首尔、釜山与活动周边酒店",
      cta: "查看住宿"
    },
    pt: {
      aria: "Link patrocinado de hoteis Trip.com",
      label: "Ad",
      title: "Fique perto",
      meta: "Hoteis perto de rotas e eventos",
      cta: "Ver hoteis"
    },
    ru: {
      aria: "Спонсорская ссылка Trip.com на отели",
      label: "Ad",
      title: "Жилье рядом",
      meta: "Отели у маршрутов и событий",
      cta: "Смотреть"
    },
    ja: {
      aria: "Trip.comホテルのスポンサーリンク",
      label: "Ad",
      title: "近くに泊まる",
      meta: "イベント周辺のホテル",
      cta: "宿を見る"
    },
    fr: {
      aria: "Lien hotel Trip.com sponsorise",
      label: "Ad",
      title: "Dormir pres du trajet",
      meta: "Hotels proches des evenements",
      cta: "Voir"
    },
    de: {
      aria: "Gesponserter Trip.com Hotellink",
      label: "Ad",
      title: "Nah an der Route",
      meta: "Hotels bei Events und Stops",
      cta: "Hotels"
    }
  }[lang] || {
    aria: "Sponsored Trip.com hotel link",
    label: "Ad",
    title: "Stay near the route",
    meta: "Hotels around Seoul, Busan, and event stops",
    cta: "Check stays"
  };
  const href = tripHotelUrlFor("Seoul");
  return `
          <aside class="routes-ad-rail" aria-label="${esc(copy.aria)}">
            <a class="trip-rail-card" href="${esc(href)}" rel="sponsored nofollow noopener" target="_blank">
              <span class="ad-disclosure">${esc(copy.label)}</span>
              <span class="trip-rail-brand">Trip.com</span>
              <span class="trip-rail-visual" aria-hidden="true">
                <span class="trip-rail-route"></span>
                <span class="trip-rail-dot dot-one"></span>
                <span class="trip-rail-dot dot-two"></span>
                <span class="trip-rail-dot dot-three"></span>
              </span>
              <strong>${esc(copy.title)}</strong>
              <small>${esc(copy.meta)}</small>
              <span class="trip-rail-cta">${esc(copy.cta)}</span>
            </a>
          </aside>`;
}

function legacyDisplayAdPlaceholder(lang) {
  return "";
  const copy = {
    en: "Sponsored hotel advertisement",
    es: "Anuncio de hotel patrocinado",
    zh: "赞助酒店广告",
    pt: "Anuncio patrocinado de hotel",
    ru: "Спонсорская реклама отеля",
    ja: "ホテルのスポンサー広告",
    fr: "Annonce hotel sponsorisee",
    de: "Gesponserte Hotelanzeige"
  }[lang] || "Sponsored hotel advertisement";
  return `
      <aside class="legacy-display-ad" aria-label="${esc(copy)}">
        <span class="ad-disclosure">Ad</span>
        <div class="legacy-display-frame">
          <iframe src="${esc(affiliateIds.tripDisplayAdUrl)}" id="${esc(affiliateIds.tripDisplayAdId)}" title="${esc(copy)}" width="1200" height="1200" loading="lazy" frameborder="0" scrolling="no" referrerpolicy="no-referrer-when-downgrade"></iframe>
        </div>
      </aside>`;
}

function affiliateSection(event, lang) {
  if (!affiliateEnabled) return "";
  const links = affiliateLinksFor(event);
  if (!links.length) return "";
  const title = local({
    en: "Stay nearby",
    es: "Alojamiento cerca",
    zh: "预订附近住宿与行程",
    pt: "Hospedagem perto",
    ru: "Забронируйте жилье и туры рядом",
    ja: "周辺の宿泊とツアーを予約",
    fr: "Hebergement proche",
    de: "Unterkunft in der Nahe"
  }, lang);
  const disclosure = local({
    en: "Sponsored hotel link. K-Spot Now may earn a commission.",
    es: "Enlace patrocinado de hotel. K-Spot Now puede recibir comision.",
    zh: "通过这些链接预订时，K-Spot Now 可能获得佣金，您无需支付额外费用。",
    pt: "Link de hotel patrocinado. K-Spot Now pode receber comissao.",
    ru: "Если вы бронируете по этим ссылкам, K-Spot Now может получить комиссию без дополнительных затрат для вас.",
    ja: "これらのリンク経由で予約すると、追加費用なしでK-Spot Nowに紹介料が入る場合があります。",
    fr: "Lien hotel sponsorise. K-Spot Now peut recevoir une commission.",
    de: "Gesponserter Hotellink. K-Spot Now kann Provision erhalten."
  }, lang);
  const hotelsTemplate = local({
    en: "Hotels in {city}",
    es: "Hoteles en {city}",
    zh: "{city}酒店",
    pt: "Hoteis em {city}",
    ru: "Отели: {city}",
    ja: "{city}のホテル",
    fr: "Hotels a {city}",
    de: "Hotels in {city}"
  }, lang);
  const toursTemplate = local({
    en: "Tours and tickets in {city}",
    es: "Tours y entradas en {city}",
    zh: "{city}玩乐与门票",
    pt: "Tours e ingressos em {city}",
    ru: "Туры и билеты: {city}",
    ja: "{city}のツアー・チケット",
    fr: "Activites et billets a {city}",
    de: "Touren und Tickets in {city}"
  }, lang);

  return `
        <section class="detail-section map-links-section affiliate-section">
          <div>
            <h2>${esc(title)}</h2>
            <p class="meta-note">${esc(disclosure)}</p>
          </div>
          <div class="map-link-list">
            ${links.map((link) => `
              <a href="${esc(link.href)}" rel="sponsored nofollow noopener" target="_blank">
                <strong>${esc((link.type === "hotels" ? hotelsTemplate : toursTemplate).replace("{city}", link.city))}</strong>
                <span>${esc(link.partner)}</span>
              </a>`).join("")}
          </div>
        </section>`;
}

function affiliatePlanningRail(event, lang) {
  const links = affiliateEnabled ? affiliateLinksFor(event) : [];
  const city = !event.city || event.city === "Nationwide" ? "Seoul" : event.city;
  const place = eventPlaceQuery(event);
  const availableMapLinks = mapLinks(event, lang);
  const mapLink = availableMapLinks[1] || availableMapLinks[0];
  const copy = {
    en: {
      eyebrow: "Before you book",
      title: "Check the visit context",
      text: "Confirm the official source, Korean map name, weather, and nearby stays before final booking.",
      official: "Official source",
      officialText: "Dates, entry rules, and notices",
      map: "Korean map search",
      sponsored: "Sponsored hotel link",
      commission: "K-Spot Now may earn a commission.",
      hotels: "Trip.com hotels in {city}",
      tours: "Tours and tickets in {city}"
    },
    es: {
      eyebrow: "Antes de reservar",
      title: "Revisa el contexto de la visita",
      text: "Confirma fuente oficial, nombre coreano del mapa, clima y alojamiento cercano antes de reservar.",
      official: "Fuente oficial",
      officialText: "Fechas, reglas de entrada y avisos",
      map: "Busqueda en mapa coreano",
      sponsored: "Enlace patrocinado de hotel",
      commission: "K-Spot Now puede recibir comision.",
      hotels: "Hoteles Trip.com en {city}",
      tours: "Tours y entradas en {city}"
    },
    zh: {
      eyebrow: "预订前",
      title: "先确认到访信息",
      text: "预订前确认官方来源、韩文地图名、天气和附近住宿。",
      official: "官方来源",
      officialText: "日期、入场规则和公告",
      map: "韩文地图搜索",
      sponsored: "酒店赞助链接",
      commission: "K-Spot Now 可能获得佣金。",
      hotels: "{city} Trip.com 酒店",
      tours: "{city} 体验和门票"
    },
    pt: {
      eyebrow: "Antes de reservar",
      title: "Confira o contexto da visita",
      text: "Confirme fonte oficial, nome coreano no mapa, clima e hospedagem perto antes de reservar.",
      official: "Fonte oficial",
      officialText: "Datas, regras de entrada e avisos",
      map: "Busca no mapa coreano",
      sponsored: "Link de hotel patrocinado",
      commission: "K-Spot Now pode receber comissao.",
      hotels: "Hoteis Trip.com em {city}",
      tours: "Tours e ingressos em {city}"
    },
    ru: {
      eyebrow: "Перед бронированием",
      title: "Проверьте контекст визита",
      text: "Перед бронью проверьте официальный источник, корейское название для карт, погоду и отели рядом.",
      official: "Официальный источник",
      officialText: "Даты, правила входа и объявления",
      map: "Поиск на корейской карте",
      sponsored: "Спонсорская ссылка на отель",
      commission: "K-Spot Now может получить комиссию.",
      hotels: "Отели Trip.com в {city}",
      tours: "Туры и билеты в {city}"
    },
    ja: {
      eyebrow: "予約前",
      title: "訪問情報を確認",
      text: "予約前に公式ソース、韓国語の地図名、天気、近くの宿泊先を確認します。",
      official: "公式ソース",
      officialText: "日程、入場ルール、告知",
      map: "韓国語マップ検索",
      sponsored: "ホテルのスポンサーリンク",
      commission: "K-Spot Nowはコミッションを受け取る場合があります。",
      hotels: "{city}のTrip.comホテル",
      tours: "{city}のツアーとチケット"
    },
    fr: {
      eyebrow: "Avant de reserver",
      title: "Verifiez le contexte de visite",
      text: "Confirmez source officielle, nom coreen de carte, meteo et hotels proches avant de reserver.",
      official: "Source officielle",
      officialText: "Dates, regles d'entree et avis",
      map: "Recherche carte coreenne",
      sponsored: "Lien hotel sponsorise",
      commission: "K-Spot Now peut recevoir une commission.",
      hotels: "Hotels Trip.com a {city}",
      tours: "Activites et billets a {city}"
    },
    de: {
      eyebrow: "Vor der Buchung",
      title: "Besuchskontext prufen",
      text: "Prufen Sie offizielle Quelle, koreanischen Kartennamen, Wetter und nahe Hotels vor der Buchung.",
      official: "Offizielle Quelle",
      officialText: "Daten, Einlassregeln und Hinweise",
      map: "Koreanische Kartensuche",
      sponsored: "Gesponserter Hotellink",
      commission: "K-Spot Now kann Provision erhalten.",
      hotels: "Trip.com Hotels in {city}",
      tours: "Touren und Tickets in {city}"
    }
  }[lang] || {
    eyebrow: "Before you book",
    title: "Check the visit context",
    text: "Confirm the official source, Korean map name, weather, and nearby stays before final booking.",
    official: "Official source",
    officialText: "Dates, entry rules, and notices",
    map: "Korean map search",
    sponsored: "Sponsored hotel link",
    commission: "K-Spot Now may earn a commission.",
    hotels: "Trip.com hotels in {city}",
    tours: "Tours and tickets in {city}"
  };
  const affiliateCards = links.map((link) => `
            <a class="quick-plan-card is-sponsored" href="${esc(link.href)}" rel="sponsored nofollow noopener" target="_blank" aria-label="${esc(copy.sponsored)}">
              <span class="quick-plan-icon icon-stay" aria-hidden="true"></span>
              <strong>${esc((link.type === "hotels" ? copy.hotels : copy.tours).replace("{city}", cityLabel(lang, link.city || city)))}</strong>
              <small>${esc(copy.sponsored)}</small>
            </a>`).join("");

  return `
        <section class="detail-quick-plan affiliate-section" aria-label="${esc(copy.title)}">
          <div class="quick-plan-copy">
            <p class="eyebrow">${esc(copy.eyebrow)}</p>
            <h2>${esc(copy.title)}</h2>
          </div>
          <div class="quick-plan-actions">
            <a class="quick-plan-card is-source" href="${esc(event.sourceUrl)}" rel="nofollow noopener" target="_blank" aria-label="${esc(copy.official)}">
              <span class="quick-plan-icon icon-source" aria-hidden="true"></span>
              <strong>${esc(sourceRoleLabel(event, lang))}</strong>
              <small>${esc(copy.official)}</small>
            </a>
            <a class="quick-plan-card is-map" href="${esc(mapLink.href)}" rel="nofollow noopener" target="_blank" aria-label="${esc(copy.map)}">
              <span class="quick-plan-icon icon-map" aria-hidden="true"></span>
              <strong>${esc(place)}</strong>
              <small>${esc(mapLink.label)}</small>
            </a>
            ${affiliateCards}
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

function containsEnglishSourceText(value) {
  const text = String(value || "").replace(/\b(KST|QR|KMA|BTS|K-POP|KPOP|VIP|UV|AM|PM)\b/g, "");
  return /\b[A-Za-z]{4,}\b/.test(text);
}

const websiteLanguageNames = {
  en: {
    KOR: "Korean",
    KR: "Korean",
    ENG: "English",
    EN: "English",
    CHN: "Chinese",
    ZH: "Chinese",
    JPN: "Japanese",
    JA: "Japanese",
    SPA: "Spanish",
    ES: "Spanish",
    FRA: "French",
    FR: "French",
    DEU: "German",
    DE: "German",
    POR: "Portuguese",
    PT: "Portuguese",
    RUS: "Russian",
    RU: "Russian"
  },
  es: {
    KOR: "coreano",
    KR: "coreano",
    ENG: "inglés",
    EN: "inglés",
    CHN: "chino",
    ZH: "chino",
    JPN: "japonés",
    JA: "japonés",
    SPA: "español",
    ES: "español",
    FRA: "francés",
    FR: "francés",
    DEU: "alemán",
    DE: "alemán",
    POR: "portugués",
    PT: "portugués",
    RUS: "ruso",
    RU: "ruso"
  },
  zh: {
    KOR: "韩语",
    KR: "韩语",
    ENG: "英语",
    EN: "英语",
    CHN: "中文",
    ZH: "中文",
    JPN: "日语",
    JA: "日语",
    SPA: "西班牙语",
    ES: "西班牙语",
    FRA: "法语",
    FR: "法语",
    DEU: "德语",
    DE: "德语",
    POR: "葡萄牙语",
    PT: "葡萄牙语",
    RUS: "俄语",
    RU: "俄语"
  },
  pt: {
    KOR: "coreano",
    KR: "coreano",
    ENG: "inglês",
    EN: "inglês",
    CHN: "chinês",
    ZH: "chinês",
    JPN: "japonês",
    JA: "japonês",
    SPA: "espanhol",
    ES: "espanhol",
    FRA: "francês",
    FR: "francês",
    DEU: "alemão",
    DE: "alemão",
    POR: "português",
    PT: "português",
    RUS: "russo",
    RU: "russo"
  },
  ru: {
    KOR: "корейский",
    KR: "корейский",
    ENG: "английский",
    EN: "английский",
    CHN: "китайский",
    ZH: "китайский",
    JPN: "японский",
    JA: "японский",
    SPA: "испанский",
    ES: "испанский",
    FRA: "французский",
    FR: "французский",
    DEU: "немецкий",
    DE: "немецкий",
    POR: "португальский",
    PT: "португальский",
    RUS: "русский",
    RU: "русский"
  },
  ja: {
    KOR: "韓国語",
    KR: "韓国語",
    ENG: "英語",
    EN: "英語",
    CHN: "中国語",
    ZH: "中国語",
    JPN: "日本語",
    JA: "日本語",
    SPA: "スペイン語",
    ES: "スペイン語",
    FRA: "フランス語",
    FR: "フランス語",
    DEU: "ドイツ語",
    DE: "ドイツ語",
    POR: "ポルトガル語",
    PT: "ポルトガル語",
    RUS: "ロシア語",
    RU: "ロシア語"
  },
  fr: {
    KOR: "coréen",
    KR: "coréen",
    ENG: "anglais",
    EN: "anglais",
    CHN: "chinois",
    ZH: "chinois",
    JPN: "japonais",
    JA: "japonais",
    SPA: "espagnol",
    ES: "espagnol",
    FRA: "français",
    FR: "français",
    DEU: "allemand",
    DE: "allemand",
    POR: "portugais",
    PT: "portugais",
    RUS: "russe",
    RU: "russe"
  },
  de: {
    KOR: "Koreanisch",
    KR: "Koreanisch",
    ENG: "Englisch",
    EN: "Englisch",
    CHN: "Chinesisch",
    ZH: "Chinesisch",
    JPN: "Japanisch",
    JA: "Japanisch",
    SPA: "Spanisch",
    ES: "Spanisch",
    FRA: "Französisch",
    FR: "Französisch",
    DEU: "Deutsch",
    DE: "Deutsch",
    POR: "Portugiesisch",
    PT: "Portugiesisch",
    RUS: "Russisch",
    RU: "Russisch"
  }
};

function localizedWebsiteLanguages(value, lang) {
  const raw = Array.isArray(value) ? value : String(value || "").split(/[,/]/);
  const names = websiteLanguageNames[lang] || websiteLanguageNames.en;
  const mapped = raw
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .map((item) => names[item.toUpperCase().replace(/[^A-Z]/g, "")] || item);
  return [...new Set(mapped)].join(", ");
}

function localizedVisitorInfoValue(event, key, value, lang) {
  const raw = visitorInfoValue(value);
  if (!raw) return "";
  if (lang === "en") return raw;
  if (key === "address") return raw;
  if (key === "websiteLanguages") return localizedWebsiteLanguages(value, lang) || raw;
  if (!containsEnglishSourceText(raw) && !["theme", "transportation", "parking", "smartGuide"].includes(key)) return raw;

  const copy = visitorCopy(lang).visitorInfo;
  const category = categoryLabel(lang, event.category);
  const city = cityLabel(lang, event.city);
  const place = eventPlaceQuery(event) || city;
  if (key === "theme") return copy.theme({ event, category, city, place });
  if (key === "hours" || key === "programHours") return copy.hours;
  if (key === "transportation") return copy.transportation({ event, category, city, place });
  if (key === "parking") return copy.parking;
  if (key === "smartGuide") return copy.smartGuide;
  return raw;
}

function localizedVisitorInfoItems(event, lang) {
  const info = event.visitorInfo || {};
  return Object.entries(visitorInfoLabels)
    .map(([key, labelKey]) => ({ label: tr(lang, labelKey), value: localizedVisitorInfoValue(event, key, info[key], lang) }))
    .filter((item) => item.value);
}

function localizedVenueScheduleItems(event, lang) {
  const category = categoryLabel(lang, event.category);
  const copy = visitorCopy(lang);
  return (event.venueSchedule || []).map((item) => {
    const rawStatus = visitorInfoValue(item.status);
    const rawTheme = visitorInfoValue(item.theme);
    const rawNote = visitorInfoValue(item.note);
    const status = lang === "en" || (rawStatus && !containsEnglishSourceText(rawStatus)) ? rawStatus : copy.venueStatus;
    const theme = lang === "en" || (rawTheme && !containsEnglishSourceText(rawTheme)) ? rawTheme : (rawTheme ? copy.venueTheme({ event, category }) : "");
    const note = lang === "en" || (rawNote && !containsEnglishSourceText(rawNote)) ? rawNote : (rawNote ? copy.venueNote : "");
    return { ...item, status, theme, note };
  });
}

function localizedOfficialHighlights(event, lang) {
  const highlights = event.officialHighlights || [];
  if (lang === "en") return highlights;
  const copy = visitorCopy(lang);
  return copy.highlights({
    event,
    sourceName: event.sourceName,
    period: eventDateLabel(event, lang),
    place: eventPlaceQuery(event) || cityLabel(lang, event.city),
    role: sourceRoleLabel(event, lang)
  });
}

function visitorInfoSection(event, lang) {
  const infoItems = localizedVisitorInfoItems(event, lang);
  if (event.officialWebsiteUrl) {
    infoItems.push({
      label: tr(lang, "eventWebsite"),
      value: `<a href="${esc(event.officialWebsiteUrl)}" rel="nofollow noopener" target="_blank">${esc(event.officialWebsiteName || event.officialWebsiteUrl)}</a>`,
      html: true
    });
  }

  const schedules = localizedVenueScheduleItems(event, lang);
  const highlights = localizedOfficialHighlights(event, lang);
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

function eventDateLabel(event, lang, useLocalizedDates = true) {
  const fallback = useLocalizedDates ? `${dateText(lang, event.startDate)} - ${dateText(lang, event.endDate)}` : `${event.startDate} - ${event.endDate}`;
  const raw = String(event.dateLabel || "").trim();
  if (!raw) return fallback;
  if (lang === "en") return raw;
  if (!containsEnglishSourceText(raw)) return raw;
  if (lang !== "fr" && lang !== "de") return fallback;

  let text = raw
    .replace(/\bFrom\s+(\d{4}-\d{2}-\d{2}),\s*until sold out\b/gi, lang === "fr" ? "Depuis $1, jusqu'a epuisement" : "Seit $1, bis ausverkauft")
    .replace(/\bEvery Saturday in 2026\b/gi, lang === "fr" ? "Chaque samedi en 2026" : "Jeden Samstag 2026")
    .replace(/\bSelected exhibitions through\b/gi, lang === "fr" ? "Expositions selectionnees jusqu'au" : "Ausgewahlte Ausstellungen bis")
    .replace(/\bMain listed date range\b/gi, lang === "fr" ? "Periode principale indiquee" : "Hauptzeitraum laut Quelle")
    .replace(/\bOverall campaign\b/gi, lang === "fr" ? "Campagne globale" : "Gesamtkampagne")
    .replace(/\bCoupon issue and stay period\b/gi, lang === "fr" ? "Emission des coupons et sejour" : "Coupon-Ausgabe und Aufenthaltszeitraum")
    .replace(/\bopen Thu-Sun during the event period\b/gi, lang === "fr" ? "ouvert jeu-dim pendant l'evenement" : "geoffnet Do-So wahrend der Veranstaltung")
    .replace(/\breservation-only entry via Weverse\b/gi, lang === "fr" ? "entree sur reservation via Weverse" : "Eintritt nur mit Reservierung via Weverse")
    .replace(/\brelay dates can differ by branch\b/gi, lang === "fr" ? "les dates varient selon la branche" : "Termine konnen je nach Filiale variieren")
    .replace(/\bdaily\b/gi, lang === "fr" ? "tous les jours" : "taglich")
    .replace(/\bthrough\b/gi, lang === "fr" ? "jusqu'au" : "bis")
    .replace(/\buntil sold out\b/gi, lang === "fr" ? "jusqu'a epuisement" : "bis ausverkauft");

  if (text === raw && /\b(date range|campaign|selected|daily|through|until|every)\b/i.test(raw)) {
    return fallback;
  }
  if (containsEnglishSourceText(text)) return fallback;
  return text;
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

function weatherConditionLabel(weatherText, lang) {
  const text = String(weatherText || "").toLowerCase();
  const labels = {
    clear: { fr: "Degage", de: "Klar" },
    mostlyCloudy: { fr: "Tres nuageux", de: "Meist bewolkt" },
    cloudy: { fr: "Nuageux", de: "Bewolkt" },
    rain: { fr: "Pluie", de: "Regen" },
    snow: { fr: "Neige", de: "Schnee" },
    mixed: { fr: "Conditions mixtes", de: "Wechselhaft" },
    forecast: { fr: "Prevision", de: "Prognose" }
  };
  if (lang !== "fr" && lang !== "de") return weatherText || "Forecast";
  if (/rain|shower/.test(text)) return labels.rain[lang];
  if (/snow/.test(text)) return labels.snow[lang];
  if (/mostly\s+cloudy/.test(text)) return labels.mostlyCloudy[lang];
  if (/cloud|overcast/.test(text)) return labels.cloudy[lang];
  if (/clear|sun/.test(text)) return labels.clear[lang];
  if (/mixed/.test(text)) return labels.mixed[lang];
  return labels.forecast[lang];
}

function visitorWeatherLabel(weatherText, lang, rainLikely = false, rainPeak = null) {
  const peak = Number.isFinite(rainPeak) ? rainPeak : 0;
  if (lang === "fr") {
    if (peak >= 50) return "Risque de pluie PM";
    if (rainLikely) return "Pluie possible";
    return weatherConditionLabel(weatherText, lang);
  }
  if (lang === "de") {
    if (peak >= 50) return "Regenrisiko PM";
    if (rainLikely) return "Regen moglich";
    return weatherConditionLabel(weatherText, lang);
  }
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
  const rain = Number.isFinite(day.maxPopPct) ? `${Math.round(day.maxPopPct)}%` : rainMood(day, lang);
  const visitorLabel = visitorWeatherLabel(weatherText, lang, rainRisk, day.maxPopPct);
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
                  <span>${tr(lang, "weatherRainPeak")} ${esc(rain)}</span>
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

function temperatureMood(maxTempC, lang = "en") {
  if (!Number.isFinite(maxTempC)) {
    if (lang === "fr") return "temperatures variables";
    if (lang === "de") return "wechselnde Temperaturen";
    return "variable temperatures";
  }
  const scale = [
    [32, { en: "hot", fr: "chaud", de: "heiss" }],
    [28, { en: "very warm", fr: "tres chaud", de: "sehr warm" }],
    [24, { en: "warm", fr: "chaud et doux", de: "warm" }],
    [18, { en: "mild", fr: "doux", de: "mild" }],
    [10, { en: "cool", fr: "frais", de: "kuhl" }],
    [-Infinity, { en: "cold", fr: "froid", de: "kalt" }]
  ];
  return scale.find(([limit]) => maxTempC >= limit)?.[1]?.[lang] || scale.find(([limit]) => maxTempC >= limit)?.[1]?.en || "";
}

function rainMood(forecast, lang = "en") {
  const peak = forecast?.maxPopPct || 0;
  const rainLikely = Boolean(forecast?.rainLikely);
  if (lang === "fr") {
    if (peak >= 70) return "fort risque de pluie";
    if (rainLikely) return "pluie possible";
    if (peak >= 30) return "risque d'averse";
    return "faible risque de pluie";
  }
  if (lang === "de") {
    if (peak >= 70) return "hohe Regenchance";
    if (rainLikely) return "Regen moglich";
    if (peak >= 30) return "Schauerrisiko";
    return "geringe Regenchance";
  }
  if (peak >= 70) return "high rain chance";
  if (rainLikely) return "rain possible";
  if (peak >= 30) return "some shower risk";
  return "low rain chance";
}

function humidityMood(forecast, lang = "en") {
  const trend = forecast?.humidityTrend || 0;
  const maxHumidity = forecast?.maxHumidityPct || 0;
  const minHumidity = forecast?.minHumidityPct || 100;
  if (lang === "fr") {
    if (trend >= 8 && maxHumidity >= 70) return "humidite en hausse";
    if (maxHumidity >= 85 && minHumidity <= 55) return "par moments de plus en plus humide";
    if (maxHumidity >= 85) return "tres humide par moments";
    if (maxHumidity >= 70) return "humide par moments";
    if (maxHumidity <= 45) return "plutot sec";
    return "humidite moderee";
  }
  if (lang === "de") {
    if (trend >= 8 && maxHumidity >= 70) return "Luftfeuchte steigt";
    if (maxHumidity >= 85 && minHumidity <= 55) return "zeitweise zunehmend feucht";
    if (maxHumidity >= 85) return "zeitweise sehr feucht";
    if (maxHumidity >= 70) return "zeitweise feucht";
    if (maxHumidity <= 45) return "eher trocken";
    return "massige Luftfeuchte";
  }
  if (trend >= 8 && maxHumidity >= 70) return "humidity increasing";
  if (maxHumidity >= 85 && minHumidity <= 55) return "increasingly humid at times";
  if (maxHumidity >= 85) return "very humid at times";
  if (maxHumidity >= 70) return "humid at times";
  if (maxHumidity <= 45) return "fairly dry";
  return "moderate humidity";
}

function forecastWeatherPhrase(forecast, lang) {
  return weatherConditionLabel(forecast.weather || tr(lang, "weatherMixedConditions"), lang).toLowerCase();
}

function forecastSummaryText(forecast, lang = "en") {
  const temp = celsiusRange(forecast.minTempC, forecast.maxTempC);
  const pop = Number.isFinite(forecast.maxPopPct)
    ? `${tr(lang, "weatherRainChanceUpTo")} ${Math.round(forecast.maxPopPct)}%`
    : rainMood(forecast, lang);
  const humidity = percentRange(forecast.minHumidityPct, forecast.maxHumidityPct);
  const humidityText = humidity ? `${humidityMood(forecast, lang)} (${humidity})` : humidityMood(forecast, lang);
  return `${temperatureMood(forecast.maxTempC, lang)}${temp ? `, ${temp}` : ""}; ${pop}; ${humidityText}; ${tr(lang, "weatherMostHours")}: ${forecastWeatherPhrase(forecast, lang)}.`;
}

function degreeRangeHtml(minTempC, maxTempC) {
  if (!Number.isFinite(minTempC) || !Number.isFinite(maxTempC)) return "-";
  return `${Math.round(minTempC)}-${Math.round(maxTempC)}&deg;C`;
}

function rainPeakText(forecast) {
  if (Number.isFinite(forecast.maxPopPct)) return `${Math.round(forecast.maxPopPct)}% peak`;
  return rainMood(forecast);
}

function rainPeakDisplay(forecast, lang = "en") {
  if (Number.isFinite(forecast.maxPopPct)) {
    const value = `${Math.round(forecast.maxPopPct)}%`;
    if (lang === "fr") return `${value} max`;
    if (lang === "de") return `${value} Spitze`;
    return `${value} peak`;
  }
  return rainMood(forecast, lang);
}

function humidityRangeText(forecast, lang = "en") {
  const humidity = percentRange(forecast.minHumidityPct, forecast.maxHumidityPct);
  return humidity || humidityMood(forecast, lang);
}

function weatherTakeaway(forecast, lang = "en") {
  const rainPeak = Number.isFinite(forecast.maxPopPct) ? forecast.maxPopPct : 0;
  const warm = (forecast.maxTempC || 0) >= 24;
  const hot = (forecast.maxTempC || 0) >= 28;
  const humid = (forecast.maxHumidityPct || 0) >= 75;
  if (lang === "fr") {
    if (rainPeak >= 50 && humid) return "Pluie possible, marche humide";
    if (rainPeak >= 50) return "Plan interieur conseille";
    if (hot && humid) return "Apres-midi chaud et humide";
    if (warm && humid) return "Chaud et humide";
    if (warm) return "Bon temps de marche chaud";
    return "Bonne fenetre de marche";
  }
  if (lang === "de") {
    if (rainPeak >= 50 && humid) return "Regenschirmfenster, feuchte Wege";
    if (rainPeak >= 50) return "Innenplan als Backup";
    if (hot && humid) return "Heisser, feuchter Nachmittag";
    if (warm && humid) return "Warm und feucht";
    if (warm) return "Warmes Laufwetter";
    return "Gutes Zeitfenster zu Fuss";
  }
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
  return `<div class="weather-tags">${items.map((item) => `<span>${packingIcon(item)}${esc(item)}</span>`).join("")}</div>`;
}

function packingIcon(item) {
  const text = String(item || "").toLowerCase();
  if (/umbrella|rain|parapluie|regenschirm/.test(text)) return `<span class="weather-tag-icon icon-rain" aria-hidden="true"></span>`;
  if (/uv|sun|solar|sonn|soleil/.test(text)) return `<span class="weather-tag-icon icon-sun" aria-hidden="true"></span>`;
  if (/water|bottle|eau|wasser/.test(text)) return `<span class="weather-tag-icon icon-water" aria-hidden="true"></span>`;
  if (/shoe|walk|chauss|schuh/.test(text)) return `<span class="weather-tag-icon icon-walk" aria-hidden="true"></span>`;
  if (/cloth|breath|layer|jacket|vetement|kleidung|jacke/.test(text)) return `<span class="weather-tag-icon icon-layer" aria-hidden="true"></span>`;
  return `<span class="weather-tag-icon icon-check" aria-hidden="true"></span>`;
}

function forecastOverview(forecast, lang = "en") {
  const kind = weatherKind(forecast.weather, forecast.rainLikely);
  const rain = Number.isFinite(forecast.maxPopPct) ? `${Math.round(forecast.maxPopPct)}%` : rainMood(forecast, lang);
  const rainNote = `${tr(lang, "weatherRainPeak")} · ${rainMood(forecast, lang)}`;
  const humidity = humidityRangeText(forecast, lang);
  return `
          <div class="weather-overview">
            <div class="weather-takeaway">
              <div class="weather-takeaway-main">
                ${weatherSymbol(kind, weatherTakeaway(forecast, lang))}
                <div>
                  <span>${esc(tr(lang, "weatherAtGlance"))}</span>
                  <strong>${esc(weatherTakeaway(forecast, lang))}</strong>
                </div>
              </div>
              <p>${esc(forecastAdvice(forecast, lang))}</p>
            </div>
            <div class="weather-metrics" aria-label="${esc(tr(lang, "weatherSummary"))}">
              ${weatherMetric(tr(lang, "weatherTemperature"), degreeRangeHtml(forecast.minTempC, forecast.maxTempC), temperatureMood(forecast.maxTempC, lang))}
              ${weatherMetric(tr(lang, "weatherRain"), esc(rain), rainNote)}
              ${weatherMetric(tr(lang, "weatherHumidity"), esc(humidity), humidityMood(forecast, lang))}
            </div>
          </div>`;
}

function forecastPacking(forecast, lang = "en") {
  const pack = {
    water: { en: "water bottle", fr: "bouteille d'eau", de: "Wasserflasche" },
    uv: { en: "UV protection", fr: "protection UV", de: "UV-Schutz" },
    umbrella: { en: "portable umbrella", fr: "parapluie compact", de: "kompakter Regenschirm" },
    breathable: { en: "breathable clothes", fr: "vetements respirants", de: "atmungsaktive Kleidung" },
    layer: { en: "light layer", fr: "veste legere", de: "leichte Jacke" },
    shoes: { en: "comfortable walking shoes", fr: "chaussures confortables", de: "bequeme Schuhe" }
  };
  const label = (key) => pack[key]?.[lang] || pack[key]?.en || key;
  const items = [];
  if ((forecast.maxTempC || 0) >= 24) items.push(label("water"));
  if ((forecast.maxTempC || 0) >= 24) items.push(label("uv"));
  if (forecast.rainLikely || (forecast.maxPopPct || 0) >= 30) items.push(label("umbrella"));
  if ((forecast.maxHumidityPct || 0) >= 70) items.push(label("breathable"));
  if ((forecast.minTempC || 99) <= 18) items.push(label("layer"));
  items.push(label("shoes"));
  return [...new Set(items)].slice(0, 5);
}

function forecastAdvice(forecast, lang = "en") {
  const warm = (forecast.maxTempC || 0) >= 24;
  const humid = (forecast.maxHumidityPct || 0) >= 70;
  if (lang === "fr") {
    if (forecast.rainLikely || (forecast.maxPopPct || 0) >= 50) {
      return "Gardez une option interieure et verifiez les avis officiels avant de partir, surtout pour parcs, bords de riviere et files.";
    }
    if (warm && humid) {
      return "Prevoyez des vetements legers, de l'eau et des pauses au frais entre photos, files et transferts.";
    }
    if (warm) {
      return "Ajoutez protection solaire et eau pour les marches de l'apres-midi autour des places, parcs et grands magasins.";
    }
    return "Bon pour les parcours a pied, mais reverifiez la derniere mise a jour KMA le jour meme.";
  }
  if (lang === "de") {
    if (forecast.rainLikely || (forecast.maxPopPct || 0) >= 50) {
      return "Halten Sie einen Innenraum-Backup bereit und prufen Sie offizielle Outdoor-Hinweise vor der Abfahrt, besonders bei Parks, Flusswegen und Warteschlangen.";
    }
    if (warm && humid) {
      return "Leichte Kleidung, Wasser und Abkuhlpausen zwischen Fotos, Warteschlangen und Transfers einplanen.";
    }
    if (warm) {
      return "Sonnenschutz und Wasser fur Nachmittagswege einplanen, besonders bei Platzen, Parks und Kaufhauszugangen.";
    }
    return "Gut fur Laufwege, aber die neueste KMA-Meldung am Reisetag erneut prufen.";
  }
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

function baselineRangeText(region, lang = "en") {
  const source = String(region?.range || "").toLowerCase();
  if (lang === "fr") {
    if (/hot|humid|monsoon|storm/.test(source)) return "chaud et humide, avec risque de pluie";
    if (/cold|freezing|winter/.test(source)) return "froid, avec matins bas et vent possible";
    if (/cool|autumn|crisp/.test(source)) return "frais et agreable pour marcher";
    if (/mild|spring|warm/.test(source)) return "doux a chaud, utile pour les festivals en plein air";
    return "conditions saisonnieres variables";
  }
  if (lang === "de") {
    if (/hot|humid|monsoon|storm/.test(source)) return "heiss und feucht, mit Regenrisiko";
    if (/cold|freezing|winter/.test(source)) return "kalt, mit niedrigen Morgenwerten und moglichem Wind";
    if (/cool|autumn|crisp/.test(source)) return "kuhl und gut fur Laufwege";
    if (/mild|spring|warm/.test(source)) return "mild bis warm, gut fur Outdoor-Festivals";
    return "wechselhafte saisonale Bedingungen";
  }
  return region?.range || "";
}

function baselinePackingItems(items = [], lang = "en") {
  if (lang !== "fr" && lang !== "de") return items;
  const fr = {
    umbrella: "parapluie compact",
    uv: "protection UV",
    sunscreen: "creme solaire",
    water: "bouteille d'eau",
    breathable: "vetements respirants",
    jacket: "veste legere",
    coat: "manteau chaud",
    gloves: "gants",
    scarf: "echarpe",
    shoes: "chaussures confortables",
    layers: "couches legeres",
    fan: "ventilateur portable",
    mask: "masque anti-poussiere"
  };
  const de = {
    umbrella: "kompakter Regenschirm",
    uv: "UV-Schutz",
    sunscreen: "Sonnenschutz",
    water: "Wasserflasche",
    breathable: "atmungsaktive Kleidung",
    jacket: "leichte Jacke",
    coat: "warmer Mantel",
    gloves: "Handschuhe",
    scarf: "Schal",
    shoes: "bequeme Schuhe",
    layers: "leichte Schichten",
    fan: "tragbarer Ventilator",
    mask: "Feinstaubmaske"
  };
  const copy = lang === "fr" ? fr : de;
  return items.map((item) => {
    const text = String(item || "").toLowerCase();
    if (/umbrella|rain/.test(text)) return copy.umbrella;
    if (/uv|sun protection/.test(text)) return copy.uv;
    if (/sunscreen/.test(text)) return copy.sunscreen;
    if (/water/.test(text)) return copy.water;
    if (/breathable|quick-dry/.test(text)) return copy.breathable;
    if (/coat|winter/.test(text)) return copy.coat;
    if (/glove/.test(text)) return copy.gloves;
    if (/scarf/.test(text)) return copy.scarf;
    if (/shoe|grip|sandals/.test(text)) return copy.shoes;
    if (/layer|tops/.test(text)) return copy.layers;
    if (/fan|cooling/.test(text)) return copy.fan;
    if (/mask|dust/.test(text)) return copy.mask;
    if (/jacket|down|wool/.test(text)) return copy.jacket;
    return item;
  });
}

function baselineOutdoorAdvice(region, lang = "en") {
  if (lang === "fr") return "Utilisez cette base comme repere saisonnier, puis confirmez la prevision du jour avant de choisir files, photos et trajets a pied.";
  if (lang === "de") return "Diese Basis dient als saisonaler Rahmen; prufen Sie danach die Tagesprognose, bevor Sie Warteschlangen, Fotos und Laufwege planen.";
  return region?.outdoorAdvice || "";
}

function weatherPlanInner(lang, forecast, weatherInfo) {
  const region = weatherInfo.baseline;
  if (forecast) {
    const items = forecastPacking(forecast, lang);
    return `
          <div class="weather-section-head">
            <div>
              <p class="eyebrow">${esc(tr(lang, "weatherLiveForecast"))}</p>
              <h2>${tr(lang, "weatherPlan")}</h2>
            </div>
            <span>${esc(forecast.locationLabel)} · ${esc(forecastRangeText(lang, forecast))}</span>
          </div>
          ${forecastOverview(forecast, lang)}
          ${forecastStrip(forecast, lang)}
          <div class="weather-bottom-row">
            ${weatherTags(items)}
            <p class="meta-note">${esc(tr(lang, "weatherKmaShortForecast"))} · ${esc(tr(lang, "weatherKmaUpdated"))} ${esc(kmaBaseTimeText(forecast.baseTime))}<span class="sr-only"> ${esc(tr(lang, "weatherForecastSource"))}: ${esc(forecast.source?.name || "KMA forecast RSS")}. ${esc(tr(lang, "weatherPreviousBaseline"))}: ${esc(weather.source.name)}. ${esc(forecastSummaryText(forecast, lang))}</span></p>
          </div>`;
  }
  return `
          <div class="weather-section-head">
            <div>
              <p class="eyebrow">${esc(tr(lang, "weatherSeasonalBaseline"))}</p>
              <h2>${tr(lang, "weatherPlan")}</h2>
            </div>
            <span>${esc(weatherInfo.regionKey)} · ${esc(weatherInfo.monthName)}</span>
          </div>
          <div class="weather-overview">
            <div class="weather-takeaway">
              <div class="weather-takeaway-main">
                ${weatherSymbol("sun", tr(lang, "weatherSeasonalBaseline"))}
                <div>
                  <span>${esc(tr(lang, "weatherSeasonalBaseline"))}</span>
                  <strong>${esc(weatherInfo.regionKey)} / ${esc(weatherInfo.monthName)}</strong>
                </div>
              </div>
              <p>${esc(baselineOutdoorAdvice(region, lang))}</p>
            </div>
            <div class="weather-metrics" aria-label="${esc(tr(lang, "weatherBaseline"))}">
              ${weatherMetric(tr(lang, "weatherTypicalRange"), esc(baselineRangeText(region, lang)), tr(lang, "weatherPreviousPattern"))}
              ${weatherMetric(tr(lang, "weatherPlanWith"), esc((baselinePackingItems(region.packing || [], lang)).slice(0, 2).join(", ") || tr(lang, "weatherWalkingBasics")), tr(lang, "weatherVisitorPacking"))}
              ${weatherMetric(tr(lang, "weatherCheck"), esc(tr(lang, "weatherLiveForecast")), tr(lang, "weatherBeforeLeaving"))}
            </div>
          </div>
          <div class="weather-bottom-row">
            ${weatherTags(baselinePackingItems(region.packing || [], lang))}
            <p class="meta-note">${esc(tr(lang, "weatherBaseline"))}: ${esc(weather.source.name)} <span class="sr-only">${esc(tr(lang, "weatherPreviousBaseline"))}.</span></p>
          </div>`;
}

function calendarWeatherText(event, lang) {
  const forecast = currentForecastForEvent(event);
  if (forecast) {
    return `${tr(lang, "calendarWeather")}: KMA ${forecast.locationLabel} / ${forecastRangeText(lang, forecast)} - ${forecastSummaryText(forecast, lang)}`;
  }
  const weatherInfo = weatherBaseline(event.weatherRegion, weatherIsoForEvent(event));
  const baseline = weatherInfo.baseline;
  const pack = baselinePackingItems(baseline.packing || [], lang).slice(0, 2).join(", ");
  return `${tr(lang, "calendarWeather")}: ${weatherInfo.regionKey} / ${weatherInfo.monthName} - ${baselineRangeText(baseline, lang)}${pack ? ` · ${tr(lang, "packHint")}: ${pack}` : ""}`;
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
    const language = languages[code];
    return `<a${active} href="${href}" lang="${esc(code)}"><span class="language-flag flag-${esc(language.flagRegion || code)}" aria-hidden="true"></span><span class="language-name">${esc(language.name)}</span></a>`;
  }).join("");
}

function languageMenu(lang, currentPathBuilder) {
  const language = languages[lang] || languages.en;
  const languageCode = lang.toUpperCase();
  return `
    <details class="language-menu">
      <summary aria-label="Language"><span class="language-flag flag-${esc(language.flagRegion || lang)}" aria-hidden="true"></span><span class="language-name">${esc(language.name)}</span><span class="language-code" aria-hidden="true">${esc(languageCode)}</span></summary>
      <div class="language-menu-panel">${langSwitcher(lang, currentPathBuilder)}</div>
    </details>`;
}

function nav(lang) {
  const routeShort = local({
    en: "Routes",
    es: "Rutas",
    zh: "路线",
    pt: "Rotas",
    ru: "Маршруты",
    ja: "ルート",
    fr: "Itineraires",
    de: "Routen"
  }, lang);
  return `
    <nav class="top-nav" aria-label="Primary">
      <a href="/${lang}/#events">${tr(lang, "navEvents")}</a>
      <a href="/${lang}/now/">${tr(lang, "navNow")}</a>
      <a href="/${lang}/calendar/">${tr(lang, "navCalendar")}</a>
      <a href="/${lang}/planner/">${tr(lang, "navPlanner")}</a>
      <a href="/${lang}/guides/">${tr(lang, "navGuides")}</a>
      <a href="/${lang}/routes/"><span class="nav-full">${tr(lang, "routePages")}</span><span class="nav-short">${esc(routeShort)}</span></a>
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
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
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
  <link rel="icon" href="/assets/brand/favicon.svg" type="image/svg+xml">
  <link rel="icon" href="/assets/brand/favicon-32.png" type="image/png" sizes="32x32">
  <link rel="icon" href="/assets/brand/favicon-192.png" type="image/png" sizes="192x192">
  <link rel="apple-touch-icon" href="/assets/brand/apple-touch-icon.png">
  ${googleVerificationMeta()}
  <link rel="stylesheet" href="/styles.css?v=${assetVersion}">
  ${adsenseHeadScript()}
  ${structuredDataScript(structuredData)}
</head>
<body>
  <a class="skip-link" href="#main-content">${tr(lang, "skipToMain")}</a>
  <header class="site-header">
    <a class="brand" href="/${lang}/" aria-label="${siteName} home">
      <span class="brand-mark" aria-hidden="true"><svg viewBox="0 0 64 64" width="34" height="34" xmlns="http://www.w3.org/2000/svg"><path d="M32 5 C19.8 5 10 14.6 10 26.4 c0 13.4 17.3 29.6 20.5 32.5 a2.2 2.2 0 0 0 3 0 C36.7 56 54 39.8 54 26.4 54 14.6 44.2 5 32 5 Z" fill="#246beb"/><path d="M25.5 16.5 V36.5 M38.5 17 L27 26.3 M30 24 L39 36" stroke="#ffffff" stroke-width="5.6" stroke-linecap="round" fill="none"/><circle cx="49.5" cy="10.5" r="7.2" fill="#e85d3f" stroke="#ffffff" stroke-width="2.6"/></svg></span>
      <span class="brand-name">K-Spot <em>Now</em></span>
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
  const visitorInfo = localizedVisitorInfoItems(event, lang).map((item) => item.value);
  const venueSchedule = localizedVenueScheduleItems(event, lang).flatMap((item) => [
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
    eventDateLabel(event, lang),
    event.startDate,
    event.endDate,
    ...eventTravelTips(event, lang),
    ...visitorInfo,
    ...venueSchedule,
    ...localizedOfficialHighlights(event, lang)
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
              ${citiesWithEvents().map((city) => `<option value="${esc(city)}">${esc(cityLabel(lang, city))}</option>`).join("")}
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
          <span class="thumb-brand">${esc(thumbnailBrand(event, lang))}</span>
          <strong>${esc(trimHeading(local(event.title, lang), 54))}</strong>
          <span>${esc(thumbnailContext(event, lang))}</span>
        </span>
      </a>
      <div class="event-body">
        <div class="event-meta">
          <span>${categoryLabel(lang, event.category)}</span>
          ${eventKindLabel(event, lang) ? `<span>${esc(eventKindLabel(event, lang))}</span>` : ""}
          <span>${esc(cityLabel(lang, event.city))}</span>
        </div>
        <div class="event-source-row">
          <span class="source-role-chip ${esc(role)}">${esc(sourceRoleLabel(event, lang))}</span>
          <span>${esc(event.sourceName)}</span>
        </div>
        <h3><a href="/${lang}/events/${event.slug}.html">${esc(local(event.title, lang))}</a></h3>
        <p>${esc(eventSummaryText(event, lang))}</p>
        <dl class="compact-facts">
          <div><dt>${tr(lang, "period")}</dt><dd>${esc(eventDateLabel(event, lang))}</dd></div>
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
  return `<button type="button" class="save-event" data-save-event data-event-slug="${esc(event.slug)}" data-event-title="${esc(local(event.title, lang))}" data-event-date="${esc(eventDateLabel(event, lang, false))}" data-event-start="${esc(event.startDate)}" data-event-end="${esc(event.endDate)}" data-event-city="${esc(event.city)}" data-event-category="${esc(categoryLabel(lang, event.category))}" data-event-url="/${lang}/events/${event.slug}.html" data-event-source-url="${esc(event.sourceUrl)}" data-event-source-name="${esc(event.sourceName)}" data-event-map-query="${esc(eventPlaceQuery(event))}" data-event-venue="${esc([event.venue, event.district].filter(Boolean).join(", "))}" data-save-label="${esc(tr(lang, "saveEvent"))}" data-saved-label="${esc(tr(lang, "savedEvent"))}" aria-pressed="false"><span class="save-event-label" data-save-event-label>${tr(lang, "saveEvent")}</span></button>`;
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
                  const active = index === 0;
                  return `
                <a class="spotlight-card${active ? " is-active" : ""}" data-spotlight-slide href="/${lang}/events/${event.slug}.html" aria-hidden="${active ? "false" : "true"}" tabindex="${active ? "0" : "-1"}" draggable="false">
                  <img src="/${event.thumbnail}" alt="${esc(local(event.title, lang))}" draggable="false">
                  <span class="spotlight-badge">${esc(statusLabel(lang, statusOf(event)))} / ${categoryLabel(lang, event.category)}</span>
                </a>`;
                }).join("")}
              </div>
              ${usableSlides.length > 1 ? `
              <div class="spotlight-controls" aria-label="Featured event controls">
                <div class="spotlight-nav-panel">
                  <div class="spotlight-tabs" aria-label="Choose featured highlight">
                    ${usableSlides.map((event, index) => `<button class="spotlight-dot" type="button" data-spotlight-dot="${index}" aria-label="Show ${esc(local(event.title, lang))}"${index === 0 ? " aria-current=\"true\"" : ""}><span class="sr-only">${esc(local(event.title, lang))}</span></button>`).join("")}
                  </div>
                </div>
              </div>` : ""}
            </div>`;
}

const planningLayerCopy = {
  en: {
    eyebrow: "Why use K-Spot Now",
    title: "Plan first. Book on official sources.",
    text: "Not a ticket shop. Compare official sources, weather, maps, routes, and hotel options before you book.",
    items: [
      ["Sources", "Official · ticketing · offer"],
      ["Trip context", "Weather · maps · routes"],
      ["Save", "Calendar · shortlist"],
      ["Book", "Final action stays official"]
    ]
  },
  es: {
    eyebrow: "Por que usar K-Spot Now",
    title: "Planifica primero. Reserva en fuentes oficiales.",
    text: "No es una tienda de tickets. Compara fuentes oficiales, clima, mapas, rutas y hoteles antes de reservar.",
    items: [
      ["Fuentes", "Oficial · tickets · oferta"],
      ["Contexto", "Clima · mapas · rutas"],
      ["Guardar", "Calendario · lista"],
      ["Reservar", "La accion final queda oficial"]
    ]
  },
  fr: {
    eyebrow: "Pourquoi utiliser K-Spot Now",
    title: "Planifiez d'abord. Reserve sur les sources officielles.",
    text: "Pas une billetterie. Comparez sources officielles, meteo, cartes, trajets et hotels avant de reserver.",
    items: [
      ["Sources", "Officiel · billetterie · offre"],
      ["Contexte", "Meteo · cartes · trajets"],
      ["Sauver", "Calendrier · liste"],
      ["Reserver", "Action finale sur source officielle"]
    ]
  },
  de: {
    eyebrow: "Warum K-Spot Now nutzen",
    title: "Erst planen. Bei offiziellen Quellen buchen.",
    text: "Kein Ticketshop. Vergleichen Sie offizielle Quellen, Wetter, Karten, Routen und Hotels vor der Buchung.",
    items: [
      ["Quellen", "Offiziell · Tickets · Angebot"],
      ["Kontext", "Wetter · Karten · Routen"],
      ["Speichern", "Kalender · Merkliste"],
      ["Buchen", "Finale Aktion bleibt offiziell"]
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
    text: "Nao e bilheteria. Compare fontes oficiais, clima, mapas, rotas e hoteis antes de reservar.",
    items: [
      ["Fontes", "Oficial · tickets · oferta"],
      ["Contexto", "Clima · mapas · rotas"],
      ["Salvar", "Calendario · lista"],
      ["Reservar", "Acao final fica oficial"]
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
      ["Find", "Live, ending soon, worth planning."],
      ["Check", "Date, venue, weather, Korean map."],
      ["Book", "Finish on the official source."]
    ]
  },
  es: {
    aria: "Como usan K-Spot Now los visitantes",
    steps: [
      ["Encuentra", "Activo, termina pronto, vale planear."],
      ["Revisa", "Fecha, lugar, clima, mapa coreano."],
      ["Reserva", "Finaliza en la fuente oficial."]
    ]
  },
  fr: {
    aria: "Comment les visiteurs utilisent K-Spot Now",
    steps: [
      ["Trouver", "En cours, bientot fini, a planifier."],
      ["Verifier", "Date, lieu, meteo, carte coreenne."],
      ["Reserver", "Finaliser sur la source officielle."]
    ]
  },
  de: {
    aria: "Wie Besucher K-Spot Now nutzen",
    steps: [
      ["Finden", "Aktiv, bald vorbei, planenswert."],
      ["Prufen", "Datum, Ort, Wetter, koreanische Karte."],
      ["Buchen", "Final auf offizieller Quelle."]
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
      ["Encontre", "Ao vivo, termina logo, vale planejar."],
      ["Confira", "Data, local, clima, mapa coreano."],
      ["Reserve", "Finalize na fonte oficial."]
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
    eyebrow: "Before you go",
    title: "Check the visit context before you book.",
    text: "Use K-Spot Now to compare dates, places, weather, routes, and source roles. Finish bookings on the source you choose.",
    listingLabel: "Official source page",
    listingTitle: "Best for final details",
    listingPoints: [
      "Tickets, reservations, coupons, or notices.",
      "Final rules, inventory, account, and payment status."
    ],
    kspotLabel: "K-Spot Now",
    kspotTitle: "Best for planning",
    kspotPoints: [
      "Korean map names, calendar, weather, route ideas, and hotels.",
      "Source-role labels so you know what each link is for."
    ],
    proofs: [
      ["Compare", "Events · offers · routes"],
      ["Check", "Date · weather · map"],
      ["Continue", "Official source"]
    ]
  },
  es: {
    eyebrow: "Antes de salir",
    title: "Revisa el contexto antes de reservar.",
    text: "Usa K-Spot Now para comparar fechas, lugares, clima, rutas y roles de fuente. Finaliza en la fuente que elijas.",
    listingLabel: "Fuente oficial",
    listingTitle: "Mejor para detalles finales",
    listingPoints: [
      "Tickets, reservas, cupones o avisos.",
      "Reglas finales, inventario, cuenta y pago."
    ],
    kspotLabel: "K-Spot Now",
    kspotTitle: "Mejor para planificar",
    kspotPoints: [
      "Mapa coreano, calendario, clima, rutas y hoteles.",
      "Etiquetas de fuente para saber para que sirve cada enlace."
    ],
    proofs: [
      ["Comparar", "Eventos · ofertas · rutas"],
      ["Revisar", "Fecha · clima · mapa"],
      ["Continuar", "Fuente oficial"]
    ]
  },
  fr: {
    eyebrow: "Avant de partir",
    title: "Verifiez le contexte avant de reserver.",
    text: "Utilisez K-Spot Now pour comparer dates, lieux, meteo, trajets et roles des sources. Finalisez sur la source choisie.",
    listingLabel: "Source officielle",
    listingTitle: "Pour les details finaux",
    listingPoints: [
      "Billets, reservations, coupons ou avis.",
      "Regles finales, stock, compte et paiement."
    ],
    kspotLabel: "K-Spot Now",
    kspotTitle: "Pour planifier",
    kspotPoints: [
      "Carte coreenne, calendrier, meteo, trajets et hotels.",
      "Labels de source pour savoir a quoi sert chaque lien."
    ],
    proofs: [
      ["Comparer", "Evenements · offres · trajets"],
      ["Verifier", "Date · meteo · carte"],
      ["Continuer", "Source officielle"]
    ]
  },
  de: {
    eyebrow: "Vor dem Besuch",
    title: "Prufen Sie den Kontext vor der Buchung.",
    text: "Mit K-Spot Now Daten, Orte, Wetter, Routen und Quellenrollen vergleichen. Buchen Sie danach bei der gewahlten Quelle.",
    listingLabel: "Offizielle Quelle",
    listingTitle: "Fur finale Details",
    listingPoints: [
      "Tickets, Reservierungen, Coupons oder Hinweise.",
      "Finale Regeln, Bestand, Konto und Zahlung."
    ],
    kspotLabel: "K-Spot Now",
    kspotTitle: "Fur die Planung",
    kspotPoints: [
      "Koreanische Karte, Kalender, Wetter, Routen und Hotels.",
      "Quellenlabels zeigen, wofur jeder Link gedacht ist."
    ],
    proofs: [
      ["Vergleichen", "Veranstaltungen · Angebote · Routen"],
      ["Prufen", "Datum · Wetter · Karte"],
      ["Fortfahren", "Offizielle Quelle"]
    ]
  },
  zh: {
    eyebrow: "出发前",
    title: "预订前先确认到访信息。",
    text: "用 K-Spot Now 对比日期、地点、天气、路线和来源角色，再到你选择的来源完成预订。",
    listingLabel: "官方来源",
    listingTitle: "确认最终信息",
    listingPoints: [
      "门票、预约、优惠券或公告。",
      "最终规则、库存、账户和付款状态。"
    ],
    kspotLabel: "K-Spot Now",
    kspotTitle: "行前规划",
    kspotPoints: [
      "韩文地图名、日历、天气、路线和酒店。",
      "来源角色标签帮助你理解每个链接的用途。"
    ],
    proofs: [
      ["比较", "活动 · 优惠 · 路线"],
      ["确认", "日期 · 天气 · 地图"],
      ["继续", "官方来源"]
    ]
  },
  ru: {
    eyebrow: "Перед выходом",
    title: "Проверьте контекст перед бронированием.",
    text: "Сравните даты, места, погоду, маршруты и роль источников в K-Spot Now. Завершайте бронь на выбранном источнике.",
    listingLabel: "Официальный источник",
    listingTitle: "Для финальных деталей",
    listingPoints: [
      "Билеты, бронирования, купоны или объявления.",
      "Финальные правила, наличие, аккаунт и оплата."
    ],
    kspotLabel: "K-Spot Now",
    kspotTitle: "Для планирования",
    kspotPoints: [
      "Корейские названия для карт, календарь, погода, маршруты и отели.",
      "Метки источников показывают назначение каждой ссылки."
    ],
    proofs: [
      ["Сравнить", "События · офферы · маршруты"],
      ["Проверить", "Дата · погода · карта"],
      ["Перейти", "Официальный источник"]
    ]
  },
  ja: {
    eyebrow: "出発前",
    title: "予約前に訪問情報を確認",
    text: "K-Spot Nowで日程、場所、天気、ルート、情報源の役割を比較し、選んだ情報源で予約を完了します。",
    listingLabel: "公式ソース",
    listingTitle: "最終確認向け",
    listingPoints: [
      "チケット、予約、クーポン、告知。",
      "最終ルール、在庫、アカウント、支払い状況。"
    ],
    kspotLabel: "K-Spot Now",
    kspotTitle: "計画向け",
    kspotPoints: [
      "韓国語の地図名、カレンダー、天気、ルート、ホテル。",
      "リンクごとの目的がわかる情報源ラベル。"
    ],
    proofs: [
      ["比較", "イベント · 特典 · ルート"],
      ["確認", "日付 · 天気 · 地図"],
      ["移動", "公式ソース"]
    ]
  },
  pt: {
    eyebrow: "Antes de sair",
    title: "Confira o contexto antes de reservar.",
    text: "Use o K-Spot Now para comparar datas, lugares, clima, rotas e papeis das fontes. Finalize na fonte escolhida.",
    listingLabel: "Fonte oficial",
    listingTitle: "Melhor para detalhes finais",
    listingPoints: [
      "Tickets, reservas, cupons ou avisos.",
      "Regras finais, estoque, conta e pagamento."
    ],
    kspotLabel: "K-Spot Now",
    kspotTitle: "Melhor para planejar",
    kspotPoints: [
      "Mapa coreano, calendario, clima, rotas e hoteis.",
      "Labels de fonte para saber para que serve cada link."
    ],
    proofs: [
      ["Comparar", "Eventos · ofertas · rotas"],
      ["Checar", "Data · clima · mapa"],
      ["Continuar", "Fonte oficial"]
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
    boundaryNol: "The linked listing or ticket source is where final details can change. K-Spot Now keeps weather, Korean map names, nearby routes, saved comparison, and source-role checks visible before you leave.",
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
    boundaryNol: "La fuente enlazada de listado o ticket es donde pueden cambiar los detalles finales. K-Spot Now mantiene clima, nombres coreanos, rutas cercanas, comparacion guardada y rol de fuente visibles antes de salir.",
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
    boundaryNol: "A fonte vinculada de listagem ou ingresso e onde os detalhes finais podem mudar. K-Spot Now mantem clima, nomes coreanos, rotas proximas, comparacao salva e papel da fonte visiveis antes de sair.",
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
    descOffer: "Marque, magasin, offre hors taxes ou campagne pour eligibilite, stock, coupons et achat.",
    boundaryTitle: "Pourquoi cette page avant la source liee",
    boundaryGeneral: ({ sourceName }) => `Utilisez ${sourceName} pour l'avis final. Utilisez K-Spot Now avant pour garder meteo, nom coreen de carte, trajets proches, planning sauvegarde et role de source dans une seule vue.`,
    boundaryNol: "La source liee de listing ou billetterie est l'endroit ou les details finaux peuvent changer. K-Spot Now garde meteo, noms coreens, trajets proches, comparaison sauvegardee et role de source visibles avant de partir.",
    boundaryTicketing: ({ sourceName }) => `${sourceName} est l'endroit ou stock, compte, retrait, remboursement ou siege peuvent changer. K-Spot Now garde le contexte de voyage avant paiement ou reservation.`
  },
  de: {
    title: "Quellentransparenz",
    text: "K-Spot Now ist die Planungsebene. Die verlinkte Quelle bestatigt Tickets, Reservierungen, Bestand, Regeln, Berechtigung und finale Hinweise.",
    kspotTitle: "K-Spot Now erganzt",
    kspotText: "Mehrsprachige Zusammenfassung, Wetter, koreanische Kartennamen, Routen, Kalender und Vergleich gespeicherter Veranstaltungen.",
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
    descOffer: "Marke, Laden, zollfreies Angebot oder Kampagne fur Berechtigung, Bestand, Coupons und Kaufregeln.",
    boundaryTitle: "Warum diese Seite vor der verlinkten Quelle",
    boundaryGeneral: ({ sourceName }) => `Nutzen Sie ${sourceName} fur den finalen Hinweis. Nutzen Sie K-Spot Now zuerst, damit Wetter, koreanische Kartennamen, nahe Routen, gespeicherte Planung und Quellenrolle in einer Besucheransicht bleiben.`,
    boundaryNol: "Die verlinkte Listing- oder Ticketquelle ist der Ort, an dem finale Details wechseln konnen. K-Spot Now halt Wetter, koreanische Kartennamen, nahe Routen, gespeicherten Vergleich und Quellenrolle vor dem Wechsel sichtbar.",
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

function handoffChips(event, lang) {
  const copy = sourceCopy(lang);
  const chips = [
    sourceRoleLabel(event, lang),
    copy.finalTitle || "Final check",
    tr(lang, "downloadCalendar")
  ];
  return `
            <div class="handoff-note" aria-label="${bookingHandoffNote(event, lang)}">
              ${chips.map((chip) => `<span class="handoff-chip">${esc(chip)}</span>`).join("")}
            </div>`;
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
          </div>
          <div class="source-transparency-grid">
            <div>
              <span class="source-step-icon icon-kspot" aria-hidden="true"></span>
              <strong>${esc(copy.kspotTitle)}</strong>
              <em>Weather / map / calendar</em>
            </div>
            <div>
              <span class="source-step-icon icon-source" aria-hidden="true"></span>
              <strong>${esc(copy.sourceTitle)}</strong>
              <em>${esc(event.sourceName)}</em>
            </div>
            <div>
              <span class="source-step-icon icon-check" aria-hidden="true"></span>
              <strong>${esc(copy.finalTitle)}</strong>
              <em>${esc(sourceRoleLabel(event, lang))}</em>
            </div>
          </div>
          ${boundaryText ? `
          <div class="source-boundary-callout" aria-label="${esc(boundaryText)}">
            <strong>${esc(copy.boundaryTitle)}</strong>
            <span>${esc(event.sourceName || sourceRoleLabel(event, lang))}</span>
          </div>` : ""}
        </section>`;
}

function localizedVisitorBriefSection(event, lang) {
  const copy = {
    fr: {
      eyebrow: "A garder",
      title: "Brief visiteur localise",
      officialTitle: "Verifier la source",
      officialText: "Confirmez billets, reservations, horaires, regles et avis finaux sur la source officielle.",
      mapTitle: "Utiliser le nom coreen",
      mapText: "Copiez ce nom dans Naver, Kakao ou Google Maps pour trouver le bon lieu local.",
      planTitle: "Reverifier avant depart",
      planText: "Gardez le calendrier flexible et revoyez meteo, horaires et source avant de partir.",
      nameLabel: "Nom officiel a copier"
    },
    de: {
      eyebrow: "Merken",
      title: "Lokales Besucherbriefing",
      officialTitle: "Quelle prufen",
      officialText: "Tickets, Reservierungen, Zeiten, Regeln und finale Hinweise in der offiziellen Quelle bestatigen.",
      mapTitle: "Koreanischen Namen nutzen",
      mapText: "Diesen Namen in Naver, Kakao oder Google Maps kopieren, um den lokalen Ort sauber zu finden.",
      planTitle: "Vor dem Start neu prufen",
      planText: "Kalender flexibel halten und Wetter, Zeiten und Quelle vor dem Losgehen erneut prufen.",
      nameLabel: "Offiziellen Namen kopieren"
    }
  }[lang];

  if (!copy) return "";

  const items = [
    ["01", copy.officialTitle, copy.officialText],
    ["02", copy.mapTitle, copy.mapText],
    ["03", copy.planTitle, copy.planText]
  ];
  const officialName = event.mapQueryKo || event.venue || event.sourceName || "";

  return `
        <section class="detail-section localized-visitor-brief" aria-labelledby="localized-visitor-brief-title">
          <div class="detail-section-head">
            <div>
              <p class="eyebrow">${esc(copy.eyebrow)}</p>
              <h2 id="localized-visitor-brief-title">${esc(copy.title)}</h2>
            </div>
          </div>
          <div class="localized-brief-grid">
            ${items.map(([number, title, text]) => `
            <article>
              <span>${esc(number)}</span>
              <strong>${esc(title)}</strong>
              <p>${esc(text)}</p>
            </article>`).join("")}
          </div>
          <p class="localized-original-name"><strong>${esc(copy.nameLabel)}</strong> ${esc(officialName)}</p>
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
            <article class="is-source">
              <span class="visitor-action-icon icon-source" aria-hidden="true"></span>
              <strong>${esc(copy.officialTitle)}</strong>
              <em>${esc(sourceName)}</em>
            </article>
            <article class="is-map">
              <span class="visitor-action-icon icon-map" aria-hidden="true"></span>
              <strong>${esc(copy.mapTitle)}</strong>
              <em>${esc(event.mapQueryKo)}</em>
            </article>
            <article class="is-calendar">
              <span class="visitor-action-icon icon-calendar" aria-hidden="true"></span>
              <strong>${esc(copy.planTitle)}</strong>
              <em>${esc(eventDateLabel(event, lang, false))}</em>
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
    fr: `${siteName} - Evenements, pop-ups K-pop et offres d'achats`,
    de: `${siteName} - Veranstaltungen, K-Pop-Pop-ups und Einkaufsangebote`
  }, lang);
  const eventsHeading = local({
    en: siteTagline,
    fr: "Evenements, pop-ups et offres en Coree pour les visiteurs.",
    de: "Korea-Veranstaltungen, Pop-ups und Angebote fur Besucher."
  }, lang);
  const description = local({
    en: "Fresh multilingual Korea events, K-pop pop-ups, shopping deals, duty-free campaigns, calendars, official sources, and travel planning notes.",
    es: "Eventos de Corea, K-pop pop-ups, ofertas, duty free, calendarios, fuentes oficiales y planificación de viaje.",
    fr: "Evenements de Coree, pop-ups K-pop, offres d'achats, offres hors taxes, calendriers, sources officielles et notes de planification.",
    de: "Korea-Veranstaltungen, K-Pop-Pop-ups, Einkaufsangebote, zollfreie Kampagnen, Kalender, offizielle Quellen und Reiseplanung.",
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
      ${adUnit("home")}

      <section class="content-shell" id="events" data-gallery-scope data-gallery-limit="8" data-gallery-mobile-limit="6" data-gallery-step="8">
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
            fr: "Associez les evenements enregistres avec achats, transport, meteo et courts itineraires avant de partir.",
            de: "Kombinieren Sie gespeicherte Veranstaltungen vor der Abfahrt mit Einkaufen, Verkehr, Wetter und kurzen Routenideen.",
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
      schema(lang, homePageTitle, description, canonicalPath),
      itemListSchema(lang, `${siteName} latest events`, sorted.slice(0, 12), canonicalPath)
    ]
  });
}

function filterButton(lang, category, labelKey, active = false) {
  const label = tr(lang, labelKey);
  const shortLabel = filterShortLabels[lang]?.[labelKey] || filterShortLabels.en[labelKey] || label;
  return `<button type="button" data-filter="${category}"${active ? " aria-pressed=\"true\"" : ""}><span class="filter-label-full">${esc(label)}</span><span class="filter-label-short" aria-hidden="true">${esc(shortLabel)}</span></button>`;
}

function nowMetric(event, lang, mode) {
  if (mode === "starts") {
    const days = daysFromToday(event.startDate);
    const dayWord = days === 1 && lang === "en" ? "day" : tr(lang, "daysLeft").replace("left", "").trim() || "days";
    return days <= 0 ? statusLabel(lang, statusOf(event)) : `${tr(lang, "startsIn")} ${days} ${dayWord}`;
  }
  const days = daysFromToday(event.endDate);
  if (days === 1 && lang === "en") return "1 day left";
  return days <= 0 ? tr(lang, "endingSoon") : `${days} ${tr(lang, "daysLeft")}`;
}

function nowMetricTone(event, mode = "ends") {
  if (mode === "starts") return "upcoming";
  const days = daysFromToday(event.endDate);
  if (days <= 1) return "ending";
  return statusOf(event) === "live" ? "live" : "upcoming";
}

function recheckQueuePanel(lang) {
  const items = recheckQueueItems(8);
  if (!items.length) return "";
  const title = local({
    en: "Recheck before you go",
    fr: "A reverifier avant de partir",
    de: "Vor dem Besuch neu prufen"
  }, lang) || tr(lang, "recheckQueueTitle");
  const text = local({
    en: "These live or upcoming pages can change fast. Open the official source before you move.",
    fr: "Ces pages en cours ou a venir peuvent changer vite. Ouvrez la source officielle avant de vous deplacer.",
    de: "Diese laufenden oder kommenden Seiten konnen sich schnell andern. Offnen Sie vor dem Besuch die offizielle Quelle."
  }, lang) || tr(lang, "recheckQueueText");

  return `
    <section class="recheck-panel" id="recheck-queue" aria-label="${esc(title)}">
      <div class="section-head">
        <div>
          <p class="eyebrow">${tr(lang, "freshness")}</p>
          <h2>${esc(title)}</h2>
          <p>${esc(text)}</p>
        </div>
      </div>
      <div class="recheck-grid">
        ${items.map(({ event, ageDays, limitDays, daysUntilDue }) => {
          const freshness = freshnessInfo(event, lang);
          return `
          <article class="recheck-card ${freshness.tone}">
            <a class="recheck-thumb" href="/${lang}/events/${event.slug}.html" aria-label="${esc(local(event.title, lang))}">
              <img src="/${event.thumbnail}" alt="${esc(local(event.title, lang))}" loading="lazy">
              <span class="recheck-badge">${esc(recheckDueText(lang, daysUntilDue))}</span>
            </a>
            <div class="recheck-card-body">
              <strong class="recheck-title"><a href="/${lang}/events/${event.slug}.html">${esc(local(event.title, lang))}</a></strong>
              <em class="recheck-meta"><span>${esc(cityLabel(lang, event.city))}</span><span>${categoryLabel(lang, event.category)}</span><span>${esc(statusLabel(lang, statusOf(event)))}</span></em>
              <small class="recheck-checked">${esc(tr(lang, "lastChecked"))}: ${esc(dateText(lang, event.lastChecked))} / ${esc(ageDays)} of ${esc(limitDays)} days</small>
              <a class="recheck-source" href="${esc(event.sourceUrl)}" rel="nofollow noopener" target="_blank"><span>${esc(tr(lang, "sourceLink"))}</span><strong>${esc(event.sourceName)}</strong></a>
            </div>
          </article>`;
        }).join("")}
      </div>
    </section>`;
}

function nowItem(event, lang, mode = "ends") {
  const freshness = freshnessInfo(event, lang);
  const metric = nowMetric(event, lang, mode);
  const tone = nowMetricTone(event, mode);
  return `
    <a class="now-item" href="/${lang}/events/${event.slug}.html">
      <img src="/${event.thumbnail}" alt="" aria-hidden="true">
      <span>
        <strong>${esc(local(event.title, lang))}</strong>
        <em>${esc(cityLabel(lang, event.city))} · ${categoryLabel(lang, event.category)}</em>
        <span class="now-status-flag is-${tone}">${esc(metric)}</span>
        <small>${esc(eventDateLabel(event, lang))}</small>
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
  const heroEvent = items.find((event) => statusOf(event) !== "ended" && event.thumbnail) || items.find((event) => event.thumbnail) || items[0];
  const cityName = cityLabel(lang, city);
  const topCategories = [...items.reduce((counts, event) => {
    if (statusOf(event) !== "ended") counts.set(event.category, (counts.get(event.category) || 0) + 1);
    return counts;
  }, new Map()).entries()]
    .sort((a, b) => b[1] - a[1] || categoryLabel(lang, a[0]).localeCompare(categoryLabel(lang, b[0])))
    .slice(0, 3)
    .map(([category]) => categoryLabel(lang, category));
  const body = `
    <main class="page city-page">
      <section class="city-hero">
        <div class="city-hero-copy">
          <p class="eyebrow">${tr(lang, "cityPages")}</p>
          <h1>${esc(cityName)}</h1>
          <p>${esc(meta.description)}</p>
          <div class="city-hero-tags" aria-label="${esc(categoryLabel(lang, "shopping"))}">
            ${topCategories.map((label) => `<span>${esc(label)}</span>`).join("")}
          </div>
        </div>
        ${heroEvent ? `
        <a class="city-hero-feature" href="/${lang}/events/${heroEvent.slug}.html">
          <img src="/${esc(heroEvent.thumbnail)}" alt="" aria-hidden="true">
          <span>${esc(statusLabel(lang, statusOf(heroEvent)))} · ${esc(eventDateLabel(heroEvent, lang))}</span>
          <strong>${esc(local(heroEvent.title, lang))}</strong>
        </a>` : ""}
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
            ${routeIdeas.map((route) => {
              const copy = routeCopy(route, lang);
              return `
              <a href="${routeHref(lang, route)}">
                <strong>${esc(copy.title)}</strong>
                <span>${esc(copy.bestFor)}</span>
              </a>`;
            }).join("")}
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
        { name: cityLabel(lang, city), url: cityHref(lang, city) }
      ])
    ]
  });
}

function renderRoutes(lang) {
  const description = tr(lang, "routeIndexDescription");
  const body = `
    <main class="page">
      <section class="page-hero compact">
        <p class="eyebrow">${tr(lang, "routePages")}</p>
        <h1>${tr(lang, "routePages")}</h1>
        <p>${esc(description)}</p>
      </section>
      <div class="routes-with-ad">
        ${tripSkyscraperBanner(lang)}
        <section class="route-grid wide-route-grid routes-content">
          ${routes.map((route) => routeLinkCard(route, lang)).join("")}
        </section>
      </div>
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
          name: routeCopy(route, lang).title
        }))
      }
    ]
  });
}

function renderRoute(route, lang) {
  const copy = routeCopy(route, lang);
  const relatedEvents = eventsForRoute(route).slice(0, 9);
  const description = routeDescription(route, lang);
  const body = `
    <main class="page">
      <article class="detail-layout">
        <section class="page-hero compact">
          <p class="eyebrow">${tr(lang, "routePages")}</p>
          <h1>${esc(copy.title)}</h1>
          <p>${esc(copy.bestFor)}</p>
        </section>

        <section class="detail-section two-col">
          <div>
            <h2>${tr(lang, "travelIdeas")}</h2>
            <ol class="stop-list">${copy.stops.map((stop) => `<li><strong>${esc(stop)}</strong></li>`).join("")}</ol>
          </div>
          <div>
            <h2>${tr(lang, "weatherPlan")}</h2>
            <ul>${copy.tips.map((tip) => `<li>${esc(tip)}</li>`).join("")}</ul>
          </div>
        </section>

        <section class="detail-section">
          <h2>${tr(lang, "cityPages")}</h2>
          <div class="city-strip page-strip">
            ${route.regions.map((region) => cityDefinitions[region] ? `
              <a class="city-pill" href="${cityHref(lang, region)}">
                <strong>${esc(cityLabel(lang, region))}</strong>
                <span>${events.filter((event) => event.city === region).length} ${tr(lang, "eventsUnit")}</span>
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
    title: `${copy.title} - K-Spot Now`,
    description,
    body,
    canonicalPath: routeHref(lang, route),
    currentPathBuilder: (code) => routeHref(code, route),
    schemaData: [
      schema(lang, `${copy.title} - K-Spot Now`, description, routeHref(lang, route)),
      itemListSchema(lang, copy.title, relatedEvents, routeHref(lang, route)),
      breadcrumbSchema(lang, [
        { name: "Home", url: `/${lang}/` },
        { name: tr(lang, "routePages"), url: `/${lang}/routes/` },
        { name: copy.title, url: routeHref(lang, route) }
      ])
    ]
  });
}

function renderCalendar(lang) {
  const futureFirst = [...events].sort(calendarSort);
  const groups = new Map();
  for (const event of futureFirst) {
    const key = monthKey(calendarFocusDate(event));
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
          <div class="month-block" data-filter-group data-calendar-month="${esc(key)}">
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
        <em>${esc(cityLabel(lang, event.city))} · ${categoryLabel(lang, event.category)}</em>
      </span>
      <b class="${status}">${statusLabel(lang, status)}</b>
    </a>`;
}

function renderPlanner(lang) {
  const copy = {
    en: {
      title: "Your Korea trip board",
      text: "Save dates, maps, and official links together.",
      cta: "Browse live events",
      starter: "Start with these",
      starterText: "Pick one to start.",
      boardTitle: "Your saved board"
    },
    fr: {
      title: "Votre tableau de voyage Coree",
      text: "Gardez dates, cartes et liens officiels ensemble.",
      cta: "Voir les evenements",
      starter: "Commencer ici",
      starterText: "Choisissez un evenement.",
      boardTitle: "Votre tableau"
    },
    de: {
      title: "Dein Korea-Tripboard",
      text: "Speichere Events. Daten, Karten und offizielle Links bleiben hier.",
      cta: "Events ansehen",
      starter: "Hier starten",
      starterText: "Wahle ein Event.",
      boardTitle: "Dein Board"
    }
  }[lang] || {
    title: tr(lang, "plannerTitle"),
    text: tr(lang, "plannerText"),
    cta: tr(lang, "ctaEvents"),
    starter: tr(lang, "ctaEvents"),
    starterText: tr(lang, "plannerEmptyText"),
    boardTitle: tr(lang, "plannerTitle")
  };
  const starterEvents = events
    .filter((event) => statusOf(event) !== "ended")
    .sort((a, b) => b.priority - a.priority || a.startDate.localeCompare(b.startDate))
    .slice(0, 3);
  const body = `
    <main class="page planner-page" data-planner-page data-open-label="${esc(tr(lang, "openSavedEvent"))}" data-official-label="${esc(tr(lang, "officialLabel"))}" data-remove-label="${esc(tr(lang, "removeSaved"))}" data-map-label="${esc(tr(lang, "cardPlanMap"))}" data-google-label="${esc(tr(lang, "googleMap"))}" data-naver-label="${esc(tr(lang, "naverMap"))}" data-kakao-label="${esc(tr(lang, "kakaoMap"))}">
      <section class="page-hero compact planner-page-hero">
        <p class="eyebrow">${tr(lang, "navPlanner")}</p>
        <h1>${esc(copy.title)}</h1>
        <p>${esc(copy.text)}</p>
        <div class="hero-actions planner-page-actions">
          <a class="button primary" href="/${lang}/#events">${esc(copy.cta)}</a>
          <button type="button" class="button light" data-download-saved-calendar>${tr(lang, "downloadSavedCalendar")}</button>
          <button type="button" class="button light" data-clear-saved>${tr(lang, "clearSaved")}</button>
        </div>
      </section>
      <section class="planner-starter" aria-label="${esc(copy.starter)}">
        <div>
          <p class="eyebrow">${esc(copy.starter)}</p>
          <h2>${esc(copy.starterText)}</h2>
        </div>
        <div class="planner-starter-grid">
          ${starterEvents.map((event) => `
          <article class="planner-starter-card">
            <img src="/${esc(event.thumbnail)}" alt="" aria-hidden="true">
            <div>
              <span>${esc(cityLabel(lang, event.city))} / ${esc(statusLabel(lang, statusOf(event)))}</span>
              <strong>${esc(local(event.title, lang))}</strong>
              ${saveEventButton(event, lang)}
            </div>
          </article>`).join("")}
        </div>
      </section>
      <section class="planner-board">
        <div class="planner-board-head">
          <p class="eyebrow">${esc(copy.boardTitle)}</p>
        </div>
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
  const periodText = eventDateLabel(event, lang, false);
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
              ${hotelAffiliateButton(event, lang)}
              ${saveEventButton(event, lang)}
            </div>
            ${handoffChips(event, lang)}
          </div>
        </header>
        ${affiliatePlanningRail(event, lang)}

        <section class="fact-grid" aria-label="Event facts">
          ${fact(tr(lang, "period"), periodText, "calendar")}
          ${fact(tr(lang, "venue"), venueText, "pin")}
          ${fact(tr(lang, "location"), cityLabel(lang, event.city), "place")}
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
  const categoryClass = String(guide.category || "guide").replace(/[^a-z0-9-]/gi, "-").toLowerCase();
  const guideMedia = {
    beauty: "assets/thumb-beauty.jpg",
    "department-store": "assets/thumb-shopping.jpg",
    "duty-free": "assets/thumb-dutyfree.jpg",
    festival: "assets/thumb-festival.jpg",
    kpop: "assets/thumb-kpop.jpg",
    shopping: "assets/thumb-shopping.jpg",
    "travel-benefits": "assets/thumb-travel.jpg"
  }[guide.category] || "assets/hero.jpg";
  return `
    <a class="guide-card guide-card-${esc(categoryClass)}" href="/${lang}/guides/${guide.slug}.html">
      <span class="guide-card-media" aria-hidden="true">
        <img src="/${esc(guideMedia)}" alt="" loading="lazy" aria-hidden="true" role="presentation">
        <span class="guide-card-icon" aria-hidden="true"></span>
      </span>
      <span class="guide-card-copy">
        <span class="guide-card-kicker">${categoryLabel(lang, guide.category)}</span>
        <strong>${esc(guideTitleText(guide, lang))}</strong>
        <p>${esc(guideSummaryText(guide, lang))}</p>
        <em>${tr(lang, "openSavedEvent")}</em>
      </span>
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
    title: "Guide mit aktuellen Veranstaltungen nutzen",
    text: "Jeder Guide ist mit aktuellen Eintragen, offiziellen Quellenbeispielen und Routenideen verbunden: hier planen, final auf der offiziellen Seite handeln.",
    patternTitle: "Muster vergleichen",
    patternText: ({ category, eventCount }) => `Nutzen Sie den Guide mit ${eventCount} gepruften ${category}-Eintragen, nicht als isolierten Artikel.`,
    sourceTitle: "Offiziellen Nachweis offnen",
    sourceText: ({ sourceCount }) => `${sourceCount} passende offizielle Quellenbeispiele helfen bei Regeln, Tickets, Reservierungen oder Kaufen.`,
    routeTitle: "Lokale Bewegung planen",
    routeText: ({ routeCount }) => `${routeCount} passende Routenideen machen aus dem Guide einen realistischen Korea-Besuchsplan.`,
    relatedTitle: "Verwandte Veranstaltungen zum Vergleichen",
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
              <span>${esc(localizedCoverageText(source, lang, 2) || localizedSourceType(source.type, lang))}</span>
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
    description: local({
      en: "Original visitor guides for Korea events, K-pop pop-ups, shopping, duty-free, and weather planning.",
      fr: "Guides visiteurs originaux pour evenements en Coree, pop-ups K-pop, achats, offres hors taxes et planification meteo.",
      de: "Eigene Besucherguides fur Korea-Veranstaltungen, K-Pop-Pop-ups, Einkaufen, zollfreie Angebote und Wetterplanung."
    }, lang),
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
              <span>${esc(localizedSourceType(source.type, lang))} · ${esc(localizedRefreshCadence(source.refreshCadence, lang))}</span>
            </div>
            <div class="source-copy">
              <p>${esc(localizedSourceNote(source, lang))}</p>
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

function sourceCoverage(source, lang = "en") {
  return localizedCoverageText(source, lang, 5);
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
  fr: { title: "Achats, K-beauty, hors taxes et grands magasins", focus: "OLIVE YOUNG, offres hors taxes, grands magasins, soldes, coupons, pop-ups, tax refund et avantages visiteurs." },
  de: { title: "Einkaufen, K-Beauty, Zollfrei und Kaufhauser", focus: "OLIVE YOUNG, zollfreie Angebote, Kaufhausnews, Sales, Coupons, Pop-ups, Tax Refund und Besucherangebote." }
});
Object.assign(watchlistGroupCopy["kpop-popups-ticketing"], {
  fr: { title: "K-pop pop-ups, merch, fan meetings et billetterie", focus: "Commerce K-pop officiel, tickets, artistes, agences, lieux et reservations globales a verifier manuellement." },
  de: { title: "K-Pop-Pop-ups, Merch, Fanmeetings und Ticketing", focus: "Offizieller K-Pop-Commerce, Ticketing, Kunstler, Agenturen, Orte und globale Reservierungsquellen mit manueller Prufung." }
});
Object.assign(watchlistGroupCopy["weather-routes"], {
  fr: { title: "Meteo et planification d'itineraires", focus: "Bases meteo historiques, API publiques et donnees de routes qui rendent les pages utiles au-dela des dates et titres." },
  de: { title: "Wetter- und Routenplanung", focus: "Vorjahres-Wetterdaten, offentliche APIs und Routendaten, die Veranstaltungsseiten nutzlicher machen als reine Daten und Titel." }
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

const watchlistGroupKickers = {
  "tourism-festivals": {
    en: "Tourism / festivals",
    fr: "Tourisme / festivals",
    de: "Tourismus / Feste"
  },
  "shopping-beauty-dutyfree": {
    en: "Shopping / beauty / duty-free",
    fr: "Achats / beaute / hors taxes",
    de: "Einkaufen / Beauty / Zollfrei"
  },
  "kpop-popups-ticketing": {
    en: "K-pop / pop-ups / ticketing",
    fr: "K-pop / pop-ups / billetterie",
    de: "K-Pop / Pop-ups / Ticketing"
  },
  "weather-routes": {
    en: "Weather / routes",
    fr: "Meteo / itineraires",
    de: "Wetter / Routen"
  }
};

function watchlistGroupKicker(group, lang = "en") {
  return watchlistGroupKickers[group.slug]?.[lang] || watchlistGroupKickers[group.slug]?.en || group.title;
}

function localizedCurationQueueLabel(item, lang = "en") {
  const brand = item.artistOrBrand || item.owner || item.sourceName || item.label || "Official source";
  const label = String(item.label || brand);
  if (lang === "fr") {
    if (/ticket|reservation/i.test(label)) return `${brand} - veille billetterie`;
    if (/commerce/i.test(label)) return `${brand} - veille commerce officiel`;
    if (/campaign/i.test(label)) return `${brand} - veille campagne officielle`;
    if (/social/i.test(label)) return `${brand} - veille canaux officiels`;
    if (/notice/i.test(label)) return `${brand} - veille avis officiel`;
    if (/event|planning/i.test(label)) return `${brand} - veille evenement officielle`;
    return `${brand} - veille officielle`;
  }
  if (lang === "de") {
    if (/ticket|reservation/i.test(label)) return `${brand} - Ticketing-Beobachtung`;
    if (/commerce/i.test(label)) return `${brand} - offizielles Commerce-Monitoring`;
    if (/campaign/i.test(label)) return `${brand} - offizielles Kampagnenmonitoring`;
    if (/social/i.test(label)) return `${brand} - offizielle Kanalbeobachtung`;
    if (/notice/i.test(label)) return `${brand} - offizielles Hinweis-Monitoring`;
    if (/event|planning/i.test(label)) return `${brand} - offizielle Veranstaltungsbeobachtung`;
    return `${brand} - offizielles Monitoring`;
  }
  return label;
}

function localizedCurationQueueTopics(item, lang = "en") {
  return (item.topics || [])
    .slice(0, 4)
    .map((topic) => localizedSourceTerm(topic, lang))
    .filter(Boolean)
    .join(", ");
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
              <span>${esc(watchlistGroupKicker(group, lang))}</span>
              <h2>${esc(watchlistGroupText(group, lang, "title"))}</h2>
              <p>${esc(watchlistGroupText(group, lang, "focus"))}</p>
              <dl>
                <div><dt>${esc(opsText(lang, "sourcesWatched"))}</dt><dd>${groupSources.length}</dd></div>
                <div><dt>${esc(opsText(lang, "refreshModel"))}</dt><dd>${esc(groupSources.map((source) => localizedRefreshCadence(source.refreshCadence, lang)).filter(Boolean).slice(0, 2).join(" / ") || opsText(lang, "reviewQueue"))}</dd></div>
              </dl>
              <ul>
                ${groupSources.slice(0, 7).map((source) => `
                  <li>
                    <a href="${esc(source.url)}" rel="nofollow noopener" target="_blank">${esc(source.name)}</a>
                    <small>${esc(localizedAutomationStatus(source.automationStatus, lang))} - ${esc(sourceCoverage(source, lang))}</small>
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
                <strong>${esc(localizedCurationQueueLabel(item, lang))}</strong>
                <span>${esc(item.artistOrBrand)} - ${esc(localizedCurationQueueTopics(item, lang))}</span>
                <em>${esc(localizedRefreshCadence(item.refreshCadence, lang))}</em>
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
              <em>${esc(cityLabel(lang, event.city))} · ${categoryLabel(lang, event.category)} · ${statusLabel(lang, statusOf(event))}</em>
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
      ["Was senden", `Senden Sie ${contactEmail} die offizielle URL, den Veranstaltungs- oder Angebotsnamen, Daten, Ort oder Filiale, Sprache und das genaue falsche Detail.`],
      ["Offizielle Prufung", "Korrekturen werden vor Anderungen mit offiziellen APIs, offentlichen Seiten, Marken-, Veranstaltungsort-, Ticketingseiten oder verifizierten Hinweisen verglichen."],
      ["Schnelle Kategorien", "Zollfreie Kampagnen, OLIVE YOUNG, Kaufhaus-Pop-ups, K-Pop-Reservierungen und Ticketinghinweise erhalten kurzere Pruffenster."],
      ["Update-Labels", "Offentliche Veranstaltungsseiten zeigen letzte Prufdaten und behalten den offiziellen Link fur die finale Bestatigung."],
      ["Bild- und Takedown-Richtlinie", `Thumbnails verwenden offizielle Werbebilder in reduzierter Grosse mit Quellenlink, und K-Pop-Eintrage verwenden textbasierte Quellkarten statt Kunstlerfotos. Wenn Sie Rechteinhaber eines hier gezeigten Bildes, Kunstlers oder einer Marke sind, schreiben Sie an ${contactEmail} mit der Seiten-URL und Ihrer Anfrage: Strittige Bilder werden wahrend der Prufung offline genommen und innerhalb von zwei Werktagen entfernt oder ersetzt.`]
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
      "K-Spot Now est un radar multilingue d'evenements et d'achats pour les visiteurs qui planifient un voyage en Coree.",
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
      "Certains liens de planification vers hotels, activites ou billets sont des liens d'affiliation. Si vous reservez via ces liens, K-Spot Now peut recevoir une commission sans cout supplementaire pour vous. Les partenaires affilies ne peuvent pas influencer la selection des evenements, les labels de source ou les dates de fraicheur, et les blocs affilies sont toujours signales.",
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
      "K-Spot Now ist ein mehrsprachiger Veranstaltungs- und Einkaufsradar fur Besucher, die Korea-Reisen planen.",
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
      "Einige Planungslinks zu Hotels, Touren oder Tickets sind Affiliate-Links. Wenn Sie daruber buchen, kann K-Spot Now eine Provision erhalten, ohne Mehrkosten fur Sie. Affiliate-Partner konnen weder die Eventauswahl noch Quellenlabels oder Aktualitatsdaten beeinflussen, und Affiliate-Blocke sind immer gekennzeichnet.",
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
        "Some planning links to hotels, tours, or tickets are affiliate links. If you book through them, K-Spot Now may earn a commission at no extra cost to you. Affiliate partners cannot influence which events are listed, source labels, or freshness dates, and affiliate blocks are always labeled.",
        `Advertising, correction, or source questions: ${contactEmail}.`
      ],
      es: [
        "K-Spot Now puede mostrar anuncios despues de configurar una cuenta publicitaria aprobada, pero los anuncios no pueden comprar inclusion, posicion, fecha de frescura, etiqueta de verificacion, rol de fuente ni notas de seguridad.",
        "La seleccion de eventos y fuentes se basa en utilidad para visitantes: turismo oficial, organizadores, marcas, recintos, ticketing, compras, duty free y campanas verificadas.",
        "Los botones de fuente llevan a la pagina original para entradas, reservas, stock, compras, elegibilidad o reglas finales. K-Spot Now no procesa pagos ni reemplaza la fuente oficial.",
        "Consultas patrocinadas, anuncios y alianzas se revisan por separado de correcciones, auditorias y monitoreo de fuentes.",
        "Algunos enlaces de planificacion a hoteles, tours o entradas son enlaces de afiliado. Si reservas a traves de ellos, K-Spot Now puede recibir una comision sin coste extra para ti. Los socios afiliados no pueden influir en que eventos se listan, en las etiquetas de fuente ni en las fechas de frescura, y los bloques de afiliados siempre van etiquetados.",
        `Preguntas de publicidad, correccion o fuentes: ${contactEmail}.`
      ],
      pt: [
        "K-Spot Now pode exibir anuncios apos configurar uma conta publicitaria aprovada, mas anuncios nao podem comprar inclusao, posicao, datas de atualizacao, etiquetas de verificacao, papeis de fonte ou notas de seguranca.",
        "A selecao de eventos e fontes se baseia na utilidade para visitantes: turismo oficial, organizadores, marcas, locais, ticketing, compras, duty free e campanhas verificadas.",
        "Botoes de fonte levam visitantes a pagina original para ingressos, reservas, estoque, compras, elegibilidade ou regras finais. K-Spot Now nao processa pagamentos nem substitui a fonte oficial.",
        "Consultas patrocinadas, insercoes publicitarias e parcerias sao revisadas separadamente de correcoes, auditorias e monitoramento de fontes.",
        "Alguns links de planejamento para hoteis, tours ou ingressos sao links de afiliados. Se voce reservar por eles, K-Spot Now pode receber uma comissao sem custo extra para voce. Parceiros afiliados nao podem influenciar quais eventos sao listados, etiquetas de fonte ou datas de atualizacao, e blocos de afiliados sao sempre identificados.",
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

const aboutIdentityCopy = {
  en: {
    eyebrow: "About",
    lockup: "Events / Pop-ups / Routes",
    hero: "Find / Check / Save",
    lede: "Events, routes, official links.",
    chips: ["Events", "Pop-ups", "Routes"],
    flow: [
      ["Find", "Live and upcoming spots"],
      ["Check", "Dates, maps, weather"],
      ["Save", "Keep a short plan"]
    ],
    principles: [
      ["Korea now", "Live events and pop-ups."],
      ["Map-ready", "Korean place names."],
      ["Calendar-ready", "Dates worth saving."],
      ["Final source", "Booking stays official."]
    ],
    boundaryTitle: "How it works"
  }
};

function aboutPage(lang, title, paragraphs) {
  const copy = aboutIdentityCopy[lang] || aboutIdentityCopy.en;
  const [lede = "", ...rest] = paragraphs;
  const principleIcons = ["icon-kspot", "icon-source", "icon-map", "icon-calendar"];
  const titleHtml = esc(siteName);
  const body = `
    <main class="page about-page">
      <section class="about-identity-hero" aria-labelledby="about-title">
        <div class="about-brand-block">
          <div class="about-brand-lockup" aria-label="K-Spot Now">
            <span class="about-brand-mark" aria-hidden="true"><svg viewBox="0 0 64 64" width="82" height="82" xmlns="http://www.w3.org/2000/svg"><path d="M32 5 C19.8 5 10 14.6 10 26.4 c0 13.4 17.3 29.6 20.5 32.5 a2.2 2.2 0 0 0 3 0 C36.7 56 54 39.8 54 26.4 54 14.6 44.2 5 32 5 Z" fill="#246beb"/><path d="M25.5 16.5 V36.5 M38.5 17 L27 26.3 M30 24 L39 36" stroke="#ffffff" stroke-width="5.6" stroke-linecap="round" fill="none"/><circle cx="49.5" cy="10.5" r="7.2" fill="#e85d3f" stroke="#ffffff" stroke-width="2.6"/></svg></span>
            <span><small>${esc(copy.lockup)}</small><strong>K-Spot <em>Now</em></strong></span>
          </div>
          <p class="eyebrow">${esc(copy.eyebrow)}</p>
          <h1 id="about-title">${titleHtml}</h1>
          <p class="about-lede">${esc(copy.lede || lede)}</p>
          <div class="about-chip-row">${copy.chips.map((chip) => `<span>${esc(chip)}</span>`).join("")}</div>
        </div>
      </section>
      <section class="about-principles" aria-label="${esc(copy.lockup)}">
        ${copy.principles.map(([label, text], index) => `
        <article>
          <span class="about-icon ${principleIcons[index] || "icon-check"}" aria-hidden="true"></span>
          <strong>${esc(label)}</strong>
          <span>${esc(text)}</span>
        </article>`).join("")}
      </section>
      <section class="about-copy-section">
        <div>
          <p class="eyebrow">${esc(copy.lockup)}</p>
          <h2>${esc(copy.boundaryTitle)}</h2>
        </div>
        <div class="about-copy-text">
          ${rest.map((paragraph) => `<p>${esc(paragraph)}</p>`).join("")}
        </div>
      </section>
    </main>`;
  return body;
}

function staticPage(lang, kind) {
  const titleKey = kind === "cookie-policy" ? "cookieTitle" : `${kind}Title`;
  const title = tr(lang, titleKey);
  const paragraphs = staticPageParagraphs(lang, kind);
  const body = kind === "about" ? aboutPage(lang, title, paragraphs) : `
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
  await writeText(".well-known/security.txt", `Contact: mailto:${contactEmail}\nExpires: ${Number(today.slice(0, 4)) + 1}${today.slice(4)}T00:00:00.000Z\nPreferred-Languages: en, ko\nCanonical: ${siteUrl}/.well-known/security.txt\n`);
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
  Strict-Transport-Security: max-age=86400
  Content-Security-Policy: default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'self'; form-action 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' https://pagead2.googlesyndication.com https://*.googlesyndication.com https://googleads.g.doubleclick.net https://www.googletagservices.com; frame-src https://googleads.g.doubleclick.net https://*.googlesyndication.com https://www.google.com https://kr.trip.com https://*.trip.com; connect-src 'self' https://*.googlesyndication.com https://*.doubleclick.net https://*.google.com; upgrade-insecure-requests

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
