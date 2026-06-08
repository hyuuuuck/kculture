import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { todayString } from "./lib/date.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");
const today = todayString();
const siteUrl = process.env.SITE_URL || "https://example.com";
const contactEmail = process.env.CONTACT_EMAIL || "hello@example.com";
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
const routes = JSON.parse(await fs.readFile(path.join(root, "data", "travel-routes.json"), "utf8"));

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
    navSources: "Sources",
    navAbout: "About",
    heroEyebrow: "Korea events, pop-ups, beauty deals, duty-free offers",
    heroTitle: "Find Korea events before they disappear.",
    heroText: "A multilingual radar for foreign visitors: official sources, clear dates, thumbnails, calendar view, weather planning notes, and nearby travel ideas.",
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
    mapNote: "Map links are search shortcuts. Confirm the exact entrance, reservation desk, and operating rules on the official source before visiting.",
    weatherPlan: "Weather planning",
    travelIdeas: "Travel ideas",
    routeIdeas: "Nearby route ideas",
    routePages: "Travel routes",
    categoryPages: "Browse by topic",
    verifyBefore: "Verify on the official source before visiting.",
    relatedGuides: "Related guides",
    category: "Category",
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
    sourcesTitle: "Source System",
    sourcesText: "The site separates official APIs, official page monitoring, and K-pop curation queues so fresh content stays safer for AdSense and travelers.",
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
    editorialTitle: "Editorial Policy",
    editorialText: "How Korea Now Guide collects, reviews, translates, and publishes event information.",
    guidesTitle: "Visitor Guides",
    aboutTitle: "About Korea Now Guide",
    contactTitle: "Contact",
    privacyTitle: "Privacy Policy",
    termsTitle: "Terms",
    statusLive: "Live",
    statusUpcoming: "Upcoming",
    statusEnded: "Ended",
    readDetails: "Details",
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
    aboutTitle: "Acerca de Korea Now Guide",
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
    aboutTitle: "关于 Korea Now Guide",
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
    aboutTitle: "Sobre Korea Now Guide",
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
    aboutTitle: "О Korea Now Guide",
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
    navSources: "Sources",
    navAbout: "About",
    heroEyebrow: "Korea events, pop-ups, beauty deals, duty-free offers",
    heroTitle: "Find Korea events before they disappear.",
    heroText: "A multilingual radar for foreign visitors: official sources, clear dates, thumbnails, calendar view, weather planning notes, and nearby travel ideas.",
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
    mapNote: "Map links are search shortcuts. Confirm the exact entrance, reservation desk, and operating rules on the official source before visiting.",
    weatherPlan: "Weather planning",
    travelIdeas: "Travel ideas",
    routeIdeas: "Nearby route ideas",
    routePages: "Travel routes",
    categoryPages: "Browse by topic",
    cityPages: "Browse by city",
    verifyBefore: "Verify on the official source before visiting.",
    relatedGuides: "Related guides",
    category: "Category",
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
    sourcesTitle: "Source System",
    sourcesText: "The site separates official APIs, official page monitoring, and K-pop curation queues so fresh content stays safer for AdSense and travelers.",
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
    editorialTitle: "Editorial Policy",
    editorialText: "How Korea Now Guide collects, reviews, translates, and publishes event information.",
    guidesTitle: "Visitor Guides",
    aboutTitle: "About Korea Now Guide",
    contactTitle: "Contact",
    privacyTitle: "Privacy Policy",
    termsTitle: "Terms",
    statusLive: "Live",
    statusUpcoming: "Upcoming",
    statusEnded: "Ended",
    readDetails: "Details",
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
    editorialText: "Cómo Korea Now Guide recopila, revisa, traduce y publica información de eventos.",
    guidesTitle: "Guías para visitantes",
    aboutTitle: "Acerca de Korea Now Guide",
    contactTitle: "Contacto",
    privacyTitle: "Política de privacidad",
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
    editorialText: "Korea Now Guide如何收集、审核、翻译并发布活动信息。",
    guidesTitle: "游客指南",
    aboutTitle: "关于Korea Now Guide",
    contactTitle: "联系",
    privacyTitle: "隐私政策",
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
    editorialText: "Como o Korea Now Guide coleta, revisa, traduz e publica informações de eventos.",
    guidesTitle: "Guias para visitantes",
    aboutTitle: "Sobre Korea Now Guide",
    contactTitle: "Contato",
    privacyTitle: "Política de privacidade",
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
    editorialText: "Как Korea Now Guide собирает, проверяет, переводит и публикует информацию о событиях.",
    guidesTitle: "Гиды для посетителей",
    aboutTitle: "О Korea Now Guide",
    contactTitle: "Контакты",
    privacyTitle: "Политика конфиденциальности",
    termsTitle: "Условия",
    statusLive: "Идет",
    statusUpcoming: "Скоро",
    statusEnded: "Завершено",
    readDetails: "Детали",
    sourceWarning: "Официальные детали могут измениться. Всегда проверяйте правила, место, доступность и наличие."
  }
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
  return esc(value);
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
        <a href="/${lang}/feed.xml">${tr(lang, "rssFeedLabel")}</a>
        <a href="/${lang}/latest.json">${tr(lang, "jsonFeedLabel")}</a>
        <a href="/${lang}/watchlist/">${tr(lang, "watchlistTitle")}</a>
      </section>`;
}

function categoryLabel(lang, category) {
  return tr(lang, categoryLabels[category] || category);
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
  return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n  <channel>\n    <title>${xmlEsc(`Korea Now Guide - ${languages[lang].name}`)}</title>\n    <link>${xmlEsc(homeUrl)}</link>\n    <description>${xmlEsc(tr(lang, "nowText"))}</description>\n    <language>${xmlEsc(languages[lang].locale)}</language>\n    <lastBuildDate>${xmlEsc(lastBuildDate)}</lastBuildDate>\n    <atom:link href="${xmlEsc(feedUrl)}" rel="self" type="application/rss+xml"/>\n${items.map((event) => {
    const url = eventPublicUrl(event, lang);
    return `    <item>\n      <title>${xmlEsc(local(event.title, lang))}</title>\n      <link>${xmlEsc(url)}</link>\n      <guid isPermaLink="true">${xmlEsc(url)}</guid>\n      <pubDate>${xmlEsc(rfc2822Date(event.lastChecked))}</pubDate>\n      <category>${xmlEsc(categoryLabel(lang, event.category))}</category>\n      <description>${xmlEsc(eventFeedSummary(event, lang))}</description>\n      <source url="${xmlEsc(event.sourceUrl)}">${xmlEsc(event.sourceName)}</source>\n    </item>`;
  }).join("\n")}\n  </channel>\n</rss>\n`;
}

function jsonFeed(lang, feedPath = `/${lang}/latest.json`) {
  const items = feedEvents();
  return JSON.stringify({
    version: "https://jsonfeed.org/version/1.1",
    title: `Korea Now Guide - ${languages[lang].name}`,
    home_page_url: absoluteUrl(`/${lang}/`),
    feed_url: absoluteUrl(feedPath),
    language: languages[lang].locale,
    description: tr(lang, "nowText"),
    authors: [{ name: "Korea Now Guide" }],
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

function categoryHref(lang, category) {
  return `/${lang}/categories/${category}/`;
}

function categoryLinkStrip(lang) {
  return Object.keys(categoryDefinitions).map((category) => {
    const count = events.filter((event) => event.category === category).length;
    return `
      <a class="category-pill" href="${categoryHref(lang, category)}">
        <strong>${categoryLabel(lang, category)}</strong>
        <span>${count} items</span>
      </a>`;
  }).join("");
}

function citiesWithEvents() {
  return [...new Set(events.map((event) => event.city))]
    .sort((a, b) => events.filter((event) => event.city === b).length - events.filter((event) => event.city === a).length || a.localeCompare(b));
}

function citySlug(city) {
  return cityDefinitions[city]?.slug || city.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function cityHref(lang, city) {
  return `/${lang}/cities/${citySlug(city)}/`;
}

function routeHref(lang, route) {
  return `/${lang}/routes/${route.slug}.html`;
}

function cityLinkStrip(lang) {
  return citiesWithEvents().map((city) => {
    const count = events.filter((event) => event.city === city).length;
    return `
      <a class="city-pill" href="${cityHref(lang, city)}">
        <strong>${esc(city)}</strong>
        <span>${count} events</span>
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
  const parts = [event.venue, event.district, event.city, "Korea"]
    .map((part) => String(part || "").trim())
    .filter(Boolean);
  return [...new Set(parts)].join(" ");
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
            <p><strong>${esc(event.venue)}</strong> · ${esc(event.district)}, ${esc(event.city)}</p>
            <p class="source-note">${tr(lang, "mapNote")}</p>
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
      name: "Korea Now Guide",
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
        streetAddress: event.district
      }
    },
    organizer: {
      "@type": "Organization",
      name: event.sourceName,
      url: event.sourceUrl
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

function layout({ lang, title, description, body, currentPathBuilder, canonicalPath = `/${lang}/`, schemaData = null }) {
  const structuredData = schemaData || schema(lang, title, description, canonicalPath);
  return `<!doctype html>
<html lang="${lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <link rel="canonical" href="${siteUrl}${canonicalPath}">
  ${alternateLinks(currentPathBuilder, canonicalPath)}
  <link rel="alternate" type="application/rss+xml" title="Korea Now Guide RSS" href="${absoluteUrl(`/${lang}/feed.xml`)}">
  <link rel="alternate" type="application/feed+json" title="Korea Now Guide JSON Feed" href="${absoluteUrl(`/${lang}/latest.json`)}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:image" content="${siteUrl}/assets/hero.jpg">
  <meta name="theme-color" content="#0d7f75">
  ${googleVerificationMeta()}
  <link rel="stylesheet" href="/styles.css?v=${assetVersion}">
  ${adsenseHeadScript()}
  ${structuredDataScript(structuredData)}
</head>
<body>
  <header class="site-header">
    <a class="brand" href="/${lang}/" aria-label="Korea Now Guide home">
      <span class="brand-mark">K</span>
      <span>Korea Now Guide</span>
    </a>
    ${nav(lang)}
    <div class="lang-switcher" aria-label="Language">${langSwitcher(lang, currentPathBuilder)}</div>
  </header>
  ${body}
  <footer class="site-footer">
    <div>
      <strong>Korea Now Guide</strong>
      <p>${esc(tr(lang, "sourceWarning"))}</p>
    </div>
    <div class="footer-links">
      <a href="/${lang}/now/">${tr(lang, "navNow")}</a>
      <a href="/${lang}/privacy/">${tr(lang, "privacyTitle")}</a>
      <a href="/${lang}/terms/">${tr(lang, "termsTitle")}</a>
      <a href="/${lang}/contact/">${tr(lang, "contactTitle")}</a>
      <a href="/${lang}/sources/">${tr(lang, "navSources")}</a>
      <a href="/${lang}/watchlist/">${tr(lang, "navWatchlist")}</a>
      <a href="/${lang}/freshness/">${tr(lang, "freshnessTitle")}</a>
      <a href="/${lang}/editorial-policy/">${tr(lang, "editorialTitle")}</a>
    </div>
  </footer>
  <script src="/app.js?v=${assetVersion}" defer></script>
</body>
</html>`;
}

function schema(lang, title, description, canonicalPath) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Korea Now Guide",
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
    ...(event.travelTips || [])
  ].filter(Boolean).join(" ");
}

function galleryControls(lang, { categories = false } = {}) {
  return `
        <div class="gallery-tools" data-gallery-controls data-count-template="${esc(tr(lang, "resultCountTemplate"))}" data-count-one-template="${esc(tr(lang, "resultCountOneTemplate"))}">
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
    <article class="event-card" data-card data-category="${esc(event.category)}" data-status="${status}" data-search="${esc(eventSearchText(event, lang))}">
      <a class="event-thumb" href="/${lang}/events/${event.slug}.html">
        <img src="/${event.thumbnail}" alt="${esc(local(event.title, lang))}" loading="lazy">
        <span class="badge ${status}">${statusLabel(lang, status)}</span>
      </a>
      <div class="event-body">
        <div class="event-meta">
          <span>${categoryLabel(lang, event.category)}</span>
          <span>${esc(event.city)}</span>
        </div>
        <h3><a href="/${lang}/events/${event.slug}.html">${esc(local(event.title, lang))}</a></h3>
        <p>${esc(local(event.summary, lang))}</p>
        <dl class="compact-facts">
          <div><dt>${tr(lang, "period")}</dt><dd>${esc(event.dateLabel || `${dateText(lang, event.startDate)} - ${dateText(lang, event.endDate)}`)}</dd></div>
          <div><dt>${tr(lang, "lastChecked")}</dt><dd>${dateText(lang, event.lastChecked)}</dd></div>
          <div><dt>${tr(lang, "freshness")}</dt><dd><span class="freshness-chip ${freshness.tone}">${esc(freshness.text)}</span></dd></div>
        </dl>
      </div>
    </article>`;
}

function renderHome(lang, canonicalPath = `/${lang}/`) {
  const sorted = [...events].sort((a, b) => {
    const statusWeight = { live: 0, upcoming: 1, ended: 2 };
    return statusWeight[statusOf(a)] - statusWeight[statusOf(b)] || b.priority - a.priority;
  });
  const liveCount = events.filter((event) => statusOf(event) === "live").length;
  const upcomingCount = events.filter((event) => statusOf(event) === "upcoming").length;
  const archiveCount = events.filter((event) => statusOf(event) === "ended").length;
  const description = local({
    en: "Fresh multilingual Korea events, K-pop pop-ups, shopping deals, duty-free campaigns, calendars, official sources, and travel planning notes.",
    es: "Eventos de Corea, K-pop pop-ups, ofertas, duty free, calendarios, fuentes oficiales y planificación de viaje.",
    zh: "韩国活动、K-pop 快闪、购物优惠、免税活动、日历、官方来源和旅行准备。",
    pt: "Eventos da Coreia, K-pop pop-ups, ofertas, duty free, calendários, fontes oficiais e planejamento.",
    ru: "События Кореи, K-pop pop-up, shopping deals, duty free, календари, источники и планирование."
  }, lang);

  const body = `
    <main>
      <section class="hero">
        <img src="/assets/hero.jpg" alt="" aria-hidden="true">
        <div class="hero-overlay">
          <p class="eyebrow">${tr(lang, "heroEyebrow")}</p>
          <h1>${tr(lang, "heroTitle")}</h1>
          <p>${tr(lang, "heroText")}</p>
          <div class="hero-actions">
            <a class="button primary" href="#events">${tr(lang, "ctaEvents")}</a>
            <a class="button secondary" href="/${lang}/now/">${tr(lang, "navNow")}</a>
            <a class="button secondary" href="/${lang}/calendar/">${tr(lang, "ctaCalendar")}</a>
          </div>
        </div>
      </section>

      <section class="stats-band" aria-label="Event status summary">
        <div><strong>${liveCount}</strong><span>${tr(lang, "liveNow")}</span></div>
        <div><strong>${upcomingCount}</strong><span>${tr(lang, "upcoming")}</span></div>
        <div><strong>${archiveCount}</strong><span>${tr(lang, "archive")}</span></div>
        <div><strong>${sources.length}</strong><span>${tr(lang, "navSources")}</span></div>
      </section>
      ${adUnit("home")}

      <section class="content-shell" id="events" data-gallery-scope>
        <div class="section-head">
          <div>
            <p class="eyebrow">${tr(lang, "navEvents")}</p>
            <h2>${tr(lang, "heroTitle")}</h2>
          </div>
        </div>
        ${galleryControls(lang, { categories: true })}
        <div class="category-strip" aria-label="${tr(lang, "categoryPages")}">
          ${categoryLinkStrip(lang)}
        </div>
        <div class="city-strip" aria-label="${tr(lang, "cityPages")}">
          ${cityLinkStrip(lang)}
        </div>
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
    title: "Korea Now Guide - Events, K-pop Pop-ups, Shopping Deals",
    description,
    body,
    canonicalPath,
    currentPathBuilder: (code) => code === "en" && canonicalPath === "/" ? "/" : `/${code}/`,
    schemaData: [
      schema(lang, "Korea Now Guide - Events, K-pop Pop-ups, Shopping Deals", description, canonicalPath),
      itemListSchema(lang, "Korea Now Guide latest events", sorted.slice(0, 12), canonicalPath)
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
    title: `${tr(lang, "nowTitle")} - Korea Now Guide`,
    description: tr(lang, "nowText"),
    body,
    canonicalPath: `/${lang}/now/`,
    currentPathBuilder: (code) => `/${code}/now/`,
    schemaData: [
      schema(lang, `${tr(lang, "nowTitle")} - Korea Now Guide`, tr(lang, "nowText"), `/${lang}/now/`),
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
    title: `${title} - Korea Now Guide`,
    description,
    body,
    canonicalPath: categoryHref(lang, category),
    currentPathBuilder: (code) => categoryHref(code, category),
    schemaData: [
      schema(lang, `${title} - Korea Now Guide`, description, categoryHref(lang, category)),
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
  const region = weatherInfo.baseline;
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
          <h2>${tr(lang, "weatherPlan")}</h2>
          <p><strong>${esc(weatherInfo.regionKey)} / ${esc(weatherInfo.monthName)}</strong>: ${esc(region.range)}</p>
          <ul>${region.packing.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>
          <p>${esc(region.outdoorAdvice)}</p>
          <p class="source-note">Previous-year monthly baseline: ${esc(weather.source.name)}</p>
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
    title: `${meta.title} - Korea Now Guide`,
    description: meta.description,
    body,
    canonicalPath: cityHref(lang, city),
    currentPathBuilder: (code) => cityHref(code, city),
    schemaData: [
      schema(lang, `${meta.title} - Korea Now Guide`, meta.description, cityHref(lang, city)),
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
    title: `${tr(lang, "routePages")} - Korea Now Guide`,
    description,
    body,
    canonicalPath: `/${lang}/routes/`,
    currentPathBuilder: (code) => `/${code}/routes/`,
    schemaData: [
      schema(lang, `${tr(lang, "routePages")} - Korea Now Guide`, description, `/${lang}/routes/`),
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
    title: `${route.title} - Korea Now Guide`,
    description,
    body,
    canonicalPath: routeHref(lang, route),
    currentPathBuilder: (code) => routeHref(code, route),
    schemaData: [
      schema(lang, `${route.title} - Korea Now Guide`, description, routeHref(lang, route)),
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
      <section class="calendar-list">
        ${[...groups.entries()].map(([key, items]) => `
          <div class="month-block">
            <h2>${monthText(lang, key)}</h2>
            <div class="month-events">
              ${items.map((event) => calendarItem(event, lang)).join("")}
            </div>
          </div>`).join("")}
      </section>
    </main>`;
  return layout({
    lang,
    title: `${tr(lang, "calendarTitle")} - Korea Now Guide`,
    description: tr(lang, "calendarText"),
    body,
    canonicalPath: `/${lang}/calendar/`,
    currentPathBuilder: (code) => `/${code}/calendar/`
  });
}

function calendarItem(event, lang) {
  const status = statusOf(event);
  return `
    <a class="calendar-item" href="/${lang}/events/${event.slug}.html">
      <span class="date-pill">${dateText(lang, event.startDate)}<small>${dateText(lang, event.endDate)}</small></span>
      <span>
        <strong>${esc(local(event.title, lang))}</strong>
        <em>${esc(event.city)} · ${categoryLabel(lang, event.category)}</em>
      </span>
      <b class="${status}">${statusLabel(lang, status)}</b>
    </a>`;
}

function renderEvent(event, lang) {
  const status = statusOf(event);
  const freshness = freshnessInfo(event, lang);
  const relatedGuides = guides.filter((guide) => guide.category === event.category).slice(0, 3);
  const routeIdeas = routesForEvent(event);
  const weatherInfo = weatherBaseline(event.weatherRegion, weatherIsoForEvent(event));
  const region = weatherInfo.baseline;
  const description = local(event.summary, lang);
  const body = `
    <main class="page">
      <article class="detail-layout">
        <header class="detail-hero">
          <img src="/${event.thumbnail}" alt="" aria-hidden="true">
          <div>
            <p class="eyebrow">${categoryLabel(lang, event.category)} · ${statusLabel(lang, status)}</p>
            <h1>${esc(local(event.title, lang))}</h1>
            <p>${esc(description)}</p>
            <a class="button primary" href="${esc(event.sourceUrl)}" rel="nofollow noopener" target="_blank">${tr(lang, "official")}</a>
          </div>
        </header>

        <section class="fact-grid" aria-label="Event facts">
          ${fact(tr(lang, "period"), event.dateLabel || `${event.startDate} - ${event.endDate}`)}
          ${fact(tr(lang, "venue"), `${event.venue}, ${event.district}`)}
          ${fact(tr(lang, "lastChecked"), dateText(lang, event.lastChecked))}
          ${fact(tr(lang, "freshness"), freshness.text)}
          ${fact(tr(lang, "collectionMode"), event.collectionMode)}
          ${fact("Verification", event.verification)}
          ${fact(tr(lang, "location"), event.city)}
        </section>

        <section class="detail-section">
          <h2>${tr(lang, "readDetails")}</h2>
          <p>${esc(local(event.whyGo, lang))}</p>
          <p class="notice">${tr(lang, "verifyBefore")}</p>
        </section>
        ${adUnit("detail")}

        <section class="detail-section two-col">
          <div>
            <h2>${tr(lang, "weatherPlan")}</h2>
            <p><strong>${esc(weatherInfo.regionKey)} / ${esc(weatherInfo.monthName)}</strong>: ${esc(region.range)}</p>
            <ul>${region.packing.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>
            <p>${esc(region.outdoorAdvice)}</p>
            <p class="source-note">Previous-year monthly baseline: ${esc(weather.source.name)}</p>
          </div>
          <div>
            <h2>${tr(lang, "travelIdeas")}</h2>
            <ul>${event.travelTips.map((tip) => `<li>${esc(tip)}</li>`).join("")}</ul>
          </div>
        </section>
        ${mapLinkSection(event, lang)}

        ${routeIdeas.length ? `
          <section class="detail-section">
            <h2>${tr(lang, "routeIdeas")}</h2>
            <div class="route-grid">
              ${routeIdeas.map((route) => routeLinkCard(route, lang)).join("")}
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
    title: `${local(event.title, lang)} - Korea Now Guide`,
    description,
    body,
    canonicalPath: `/${lang}/events/${event.slug}.html`,
    currentPathBuilder: (code) => `/${code}/events/${event.slug}.html`,
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

function fact(label, value) {
  return `<div class="fact"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`;
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
    title: `${tr(lang, "guidesTitle")} - Korea Now Guide`,
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
        ${sections.map((section, index) => `
          <section>
            <h2>${esc(guideSectionHeading(section, index))}</h2>
            <p>${esc(section)}</p>
          </section>`).join("")}
      </article>
    </main>`;
  return layout({
    lang,
    title: `${local(guide.title, lang)} - Korea Now Guide`,
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
      </section>
    </main>`;
  return layout({
    lang,
    title: `${tr(lang, "sourcesTitle")} - Korea Now Guide`,
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
    title: `${tr(lang, "watchlistTitle")} - Korea Now Guide`,
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
    title: `${tr(lang, "freshnessTitle")} - Korea Now Guide`,
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
    title: `${tr(lang, "editorialTitle")} - Korea Now Guide`,
    description: tr(lang, "editorialText"),
    body,
    canonicalPath: `/${lang}/editorial-policy/`,
    currentPathBuilder: (code) => `/${code}/editorial-policy/`
  });
}

function staticPage(lang, kind) {
  const title = tr(lang, `${kind}Title`);
  const paragraphs = {
    about: [
      "Korea Now Guide is a multilingual event and shopping radar for visitors planning Korea trips.",
      "The site prioritizes official sources, clear date ranges, practical travel notes, and honest freshness labels.",
      "K-pop pop-ups and social-only announcements are queued for curation before publication."
    ],
    contact: [
      `For corrections, source suggestions, or partnership inquiries, email ${contactEmail}.`,
      "Please include the official event URL, date range, venue, and language preference."
    ],
    privacy: [
      "This static site does not require user accounts. Basic hosting logs may be processed by the hosting provider.",
      "If Google AdSense is enabled later, Google and its partners may use cookies or similar technologies to serve and measure ads.",
      "Visitors can manage cookies in their browser settings. This policy should be updated with the real domain, publisher ID, and consent tool before monetization."
    ],
    terms: [
      "Information is provided for travel planning and may change without notice.",
      "Always verify official event pages before visiting, purchasing, reserving, or changing travel plans.",
      "Korea Now Guide is not affiliated with the listed brands, artists, venues, or government agencies unless explicitly stated."
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
    title: `${title} - Korea Now Guide`,
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
  for (const lang of Object.keys(languages)) {
    await writeHtml(`${lang}/index.html`, renderHome(lang));
    await writeText(`${lang}/feed.xml`, rssFeed(lang));
    await writeText(`${lang}/latest.json`, jsonFeed(lang));
    await writeHtml(`${lang}/now/index.html`, renderNow(lang));
    await writeHtml(`${lang}/calendar/index.html`, renderCalendar(lang));
    await writeHtml(`${lang}/guides/index.html`, renderGuides(lang));
    await writeHtml(`${lang}/routes/index.html`, renderRoutes(lang));
    await writeHtml(`${lang}/sources/index.html`, renderSources(lang));
    await writeHtml(`${lang}/watchlist/index.html`, renderWatchlist(lang));
    await writeHtml(`${lang}/freshness/index.html`, renderFreshness(lang));
    await writeHtml(`${lang}/editorial-policy/index.html`, renderEditorialPolicy(lang));
    await writeHtml(`${lang}/about/index.html`, staticPage(lang, "about"));
    await writeHtml(`${lang}/contact/index.html`, staticPage(lang, "contact"));
    await writeHtml(`${lang}/privacy/index.html`, staticPage(lang, "privacy"));
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

/latest.json
  Content-Type: application/feed+json; charset=utf-8
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
      { url: `/${lang}/guides/`, lastmod: today },
      { url: `/${lang}/routes/`, lastmod: latestEventCheck },
      { url: `/${lang}/sources/`, lastmod: today },
      { url: `/${lang}/watchlist/`, lastmod: today },
      { url: `/${lang}/freshness/`, lastmod: today },
      { url: `/${lang}/editorial-policy/`, lastmod: today },
      { url: `/${lang}/about/`, lastmod: today },
      { url: `/${lang}/contact/`, lastmod: today },
      { url: `/${lang}/privacy/`, lastmod: today },
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
    for (const event of events) entries.push({ url: `/${lang}/events/${event.slug}.html`, lastmod: event.lastChecked || latestEventCheck });
    for (const guide of guides) entries.push({ url: `/${lang}/guides/${guide.slug}.html`, lastmod: today });
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.map((entry) => `  <url><loc>${xmlEsc(`${siteUrl}${entry.url}`)}</loc><lastmod>${xmlEsc(entry.lastmod)}</lastmod></url>`).join("\n")}\n</urlset>\n`;
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

function ics() {
  const stamp = `${today.replaceAll("-", "")}T000000Z`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Korea Now Guide//Events//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Korea Now Guide Events"
  ];

  for (const event of events) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${event.slug}@korea-now-guide`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${icsDate(event.startDate)}`,
      `DTEND;VALUE=DATE:${icsDate(event.endDate, true)}`,
      `SUMMARY:${icsEscape(local(event.title, "en"))}`,
      `DESCRIPTION:${icsEscape(`${local(event.summary, "en")} Official source: ${event.sourceUrl}`)}`,
      `LOCATION:${icsEscape(`${event.venue}, ${event.city}`)}`,
      `URL:${event.sourceUrl}`,
      "END:VEVENT"
    );
  }

  lines.push("END:VCALENDAR");
  return `${lines.map(foldIcsLine).join("\r\n")}\r\n`;
}

await build();
console.log(`Built ${events.length} events, ${guides.length} guides, ${Object.keys(languages).length} languages into ${dist}`);
