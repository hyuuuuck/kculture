export const DEFAULT_ADSENSE_PUBLISHER_ID = "pub-4973303868067114";

function flag(value) {
  return /^(1|true|yes|on)$/i.test(String(value || "").trim());
}

export function adSenseCmpEvidenceStatus(compliance, today = new Date().toISOString().slice(0, 10)) {
  const cmp = compliance?.cmp || {};
  const regions = new Set((cmp.regions || []).map((item) => String(item).trim().toUpperCase()));
  const requiredRegions = ["EEA", "UK", "CH"];
  const verifiedAt = String(cmp.verifiedAt || "").trim();
  const verifiedTime = /^\d{4}-\d{2}-\d{2}$/.test(verifiedAt)
    ? Date.parse(`${verifiedAt}T00:00:00Z`)
    : Number.NaN;
  const todayTime = Date.parse(`${today}T00:00:00Z`);
  const ageDays = Number.isFinite(verifiedTime) && Number.isFinite(todayTime)
    ? Math.floor((todayTime - verifiedTime) / 86400000)
    : Number.NaN;
  const missing = [];

  if (cmp.status !== "verified") missing.push("verified status");
  if (!String(cmp.provider || "").trim()) missing.push("CMP provider");
  if (!/^\d{1,6}$/.test(String(cmp.cmpId || "").trim())) missing.push("Google CMP ID");
  if (cmp.googleCertified !== true) missing.push("Google certification confirmation");
  if (cmp.tcfEnabled !== true) missing.push("IAB TCF confirmation");
  for (const region of requiredRegions) {
    if (!regions.has(region)) missing.push(`${region} coverage`);
  }
  if (!Number.isFinite(ageDays) || ageDays < 0 || ageDays > 365) missing.push("current verification date");
  if (!String(cmp.verifiedBy || "").trim()) missing.push("accountable verifier");
  if (String(cmp.evidenceNote || "").trim().length < 20) missing.push("verification evidence note");

  return {
    ready: missing.length === 0,
    missing,
    ageDays: Number.isFinite(ageDays) ? ageDays : null,
    provider: String(cmp.provider || "").trim(),
    cmpId: String(cmp.cmpId || "").trim()
  };
}

// Environment switches are release intent, not evidence. Ads are generated
// only when the versioned compliance record is also complete and current.
export function configuredAdSenseCmpReady(env = process.env, compliance = null, today) {
  const declaredReady = flag(env.GOOGLE_ADSENSE_CMP_READY || env.ADSENSE_CMP_READY);
  const evidenceConfirmed = flag(env.GOOGLE_ADSENSE_CMP_EVIDENCE || env.ADSENSE_CMP_EVIDENCE);
  return declaredReady && evidenceConfirmed && adSenseCmpEvidenceStatus(compliance, today).ready;
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
