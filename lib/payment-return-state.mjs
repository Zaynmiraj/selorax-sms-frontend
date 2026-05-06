const PENDING_TOPUP_CHARGES_KEY = "sx_pending_topup_charges";

function getBrowserStorage() {
  if (typeof window === "undefined") return null;
  return window.sessionStorage || null;
}

function readCharges(storage = getBrowserStorage()) {
  if (!storage) return [];
  try {
    const parsed = JSON.parse(storage.getItem(PENDING_TOPUP_CHARGES_KEY) || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.map(String).filter(Boolean);
  } catch {
    return [];
  }
}

function writeCharges(charges, storage = getBrowserStorage()) {
  if (!storage) return;
  const unique = [...new Set(charges.map(String).filter(Boolean))];
  storage.setItem(PENDING_TOPUP_CHARGES_KEY, JSON.stringify(unique));
}

export function normalizePaymentStatus(status) {
  const normalized = String(status || "").toLowerCase();
  if (["success", "active", "completed", "credited", "paid"].includes(normalized)) {
    return "success";
  }
  if (["fail", "failed", "declined", "expired", "error"].includes(normalized)) {
    return "failed";
  }
  if (["cancel", "cancelled", "canceled"].includes(normalized)) {
    return "cancelled";
  }
  return normalized || "";
}

export function isCreditedChargeStatus(status) {
  return ["active", "completed", "credited"].includes(String(status || "").toLowerCase());
}

export function isTerminalFailedChargeStatus(status) {
  return ["declined", "cancelled", "canceled", "expired", "failed"].includes(String(status || "").toLowerCase());
}

export function getPendingTopupCharges(storage = getBrowserStorage()) {
  return readCharges(storage);
}

export function addPendingTopupCharge(chargeId, storage = getBrowserStorage()) {
  if (!chargeId) return;
  writeCharges([...readCharges(storage), String(chargeId)], storage);
}

export function clearPendingTopupCharge(chargeId, storage = getBrowserStorage()) {
  if (!chargeId) return;
  writeCharges(readCharges(storage).filter((id) => id !== String(chargeId)), storage);
}
