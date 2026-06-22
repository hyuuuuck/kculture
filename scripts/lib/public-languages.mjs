export const ALL_PUBLIC_LANGUAGES = ["en", "es", "zh", "pt", "ru", "ja", "fr", "de"];

export function envFlag(value, defaultValue = false) {
  const text = String(value ?? "").trim();
  if (!text) return defaultValue;
  if (/^(1|true|yes|on)$/i.test(text)) return true;
  if (/^(0|false|no|off)$/i.test(text)) return false;
  return defaultValue;
}

export function adsenseReviewMode(env = process.env) {
  return envFlag(env.ADSENSE_REVIEW_MODE, true);
}

export function publicLanguageCodes(env = process.env) {
  const raw = String(env.PUBLIC_LANGUAGES || (adsenseReviewMode(env) ? "en" : ALL_PUBLIC_LANGUAGES.join(",")));
  const requested = raw
    .split(",")
    .map((code) => code.trim().toLowerCase())
    .filter(Boolean);
  const unique = ["en", ...requested].filter((code, index, arr) => arr.indexOf(code) === index);
  const filtered = unique.filter((code) => ALL_PUBLIC_LANGUAGES.includes(code));
  return filtered.length ? filtered : ["en"];
}

export function affiliatePublishingEnabled(env = process.env) {
  return envFlag(env.AFFILIATE_ENABLED || env.MONETIZATION_ENABLED, false);
}
