export function normalizeDataGoServiceKey(value) {
  const key = String(value || "").trim();
  if (!key) return "";
  if (!/%[0-9A-Fa-f]{2}/.test(key)) return key;
  try {
    return decodeURIComponent(key);
  } catch {
    return key;
  }
}

export async function fetchPublicJson(url, label, options = {}) {
  const timeoutMs = Number(options.timeoutMs || 15000);
  const response = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
  const text = await response.text();
  let payload;
  try {
    payload = JSON.parse(text);
  } catch {
    throw new Error(`${label} returned non-JSON data (HTTP ${response.status}).`);
  }
  if (!response.ok) throw new Error(`${label} request failed with HTTP ${response.status}.`);
  return payload;
}

export function dataGoResult(payload) {
  const header = payload?.response?.header || {};
  return {
    code: String(header.resultCode ?? ""),
    message: String(header.resultMsg ?? "")
  };
}

export function assertDataGoSuccess(payload, label) {
  const result = dataGoResult(payload);
  if (!["00", "0000"].includes(result.code)) {
    throw new Error(`${label} ${result.code || "unknown"}: ${result.message || "request was not authorized"}`);
  }
  return payload;
}

export function seoulResult(payload, serviceName) {
  const service = payload?.[serviceName];
  const result = service?.RESULT || payload?.RESULT || {};
  return {
    code: String(result.CODE || ""),
    message: String(result.MESSAGE || ""),
    service
  };
}

export function assertSeoulSuccess(payload, serviceName, label) {
  const result = seoulResult(payload, serviceName);
  if (result.code !== "INFO-000") {
    throw new Error(`${label} ${result.code || "unknown"}: ${result.message || "request was not authorized"}`);
  }
  return result.service;
}
