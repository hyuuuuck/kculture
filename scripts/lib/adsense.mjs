export const DEFAULT_ADSENSE_PUBLISHER_ID = "pub-4973303868067114";

export function normalizeAdSensePublisherId(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  if (/^ca-pub-\d{16}$/.test(trimmed)) return trimmed.replace("ca-", "");
  if (/^pub-\d{16}$/.test(trimmed)) return trimmed;
  return trimmed;
}

export function normalizeAdSenseClientId(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  if (/^pub-\d{16}$/.test(trimmed)) return `ca-${trimmed}`;
  return trimmed;
}

export function configuredAdSensePublisherId(env = process.env) {
  return normalizeAdSensePublisherId(
    env.GOOGLE_ADSENSE_PUBLISHER_ID
      || env.ADSENSE_PUBLISHER_ID
      || DEFAULT_ADSENSE_PUBLISHER_ID
  );
}

export function configuredAdSenseClientId(env = process.env) {
  return normalizeAdSenseClientId(
    env.GOOGLE_ADSENSE_CLIENT
      || env.ADSENSE_CLIENT
      || configuredAdSensePublisherId(env)
  );
}
