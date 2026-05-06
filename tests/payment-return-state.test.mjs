import assert from "node:assert/strict";
import { test } from "node:test";

import {
  addPendingTopupCharge,
  clearPendingTopupCharge,
  getPendingTopupCharges,
  isCreditedChargeStatus,
  normalizePaymentStatus,
} from "../lib/payment-return-state.mjs";

function createStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };
}

test("normalizes EPS and platform payment statuses", () => {
  assert.equal(normalizePaymentStatus("success"), "success");
  assert.equal(normalizePaymentStatus("completed"), "success");
  assert.equal(normalizePaymentStatus("active"), "success");
  assert.equal(normalizePaymentStatus("fail"), "failed");
  assert.equal(normalizePaymentStatus("declined"), "failed");
  assert.equal(normalizePaymentStatus("cancel"), "cancelled");
});

test("tracks pending top-up charges without duplicates", () => {
  const storage = createStorage();

  addPendingTopupCharge(42, storage);
  addPendingTopupCharge("42", storage);
  addPendingTopupCharge(84, storage);

  assert.deepEqual(getPendingTopupCharges(storage), ["42", "84"]);

  clearPendingTopupCharge("42", storage);
  assert.deepEqual(getPendingTopupCharges(storage), ["84"]);
});

test("detects charge statuses that should credit SMS", () => {
  assert.equal(isCreditedChargeStatus("active"), true);
  assert.equal(isCreditedChargeStatus("completed"), true);
  assert.equal(isCreditedChargeStatus("pending"), false);
});
