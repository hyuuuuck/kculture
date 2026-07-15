export const DEFAULT_ADSENSE_PUBLISHER_ID = "pub-4973303868067114";

function flag(value) {
  return /^(1|true|yes|on)$/i.test(String(value || "").trim());
}

// A build flag is not proof that the Google-certified CMP was configured.
// Require a separate human-confirmed evidence flag before serving ads.
export function configuredAdSenseCmpReady(env = process.env) {
  const declaredReady = flag(env.GOOGLE_ADSENSE_CMP_READY || env.ADSENSE_CMP_READY);
  const evidenceConfirmed = flag(env.GOOGLE_ADSENSE_CMP_EVIDENCE || env.ADSENSE_CMP_EVIDENCE);
  return declaredReady && evidenceConfirmed;
}

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
