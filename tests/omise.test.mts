import assert from "node:assert/strict";
import test from "node:test";

import {
  getPromptPayQrUrl,
  mapOmisePaymentStatus,
  validateSuccessfulPromptPayCharge,
} from "../src/utils/omise.ts";

const successfulCharge = {
  id: "chrg_test_123",
  amount: 189000,
  currency: "thb",
  status: "successful",
  paid: true,
  metadata: { order_id: "order-123" },
  source: {
    type: "promptpay",
    scannable_code: {
      image: { download_uri: "https://api.omise.co/charges/chrg_test_123/documents/doc_test/downloads/qr.png" },
    },
  },
};

test("maps Omise charge statuses to local payment statuses", () => {
  assert.equal(mapOmisePaymentStatus({ status: "successful", paid: true }), "paid");
  assert.equal(mapOmisePaymentStatus({ status: "failed", paid: false }), "failed");
  assert.equal(mapOmisePaymentStatus({ status: "expired", paid: false }), "expired");
  assert.equal(mapOmisePaymentStatus({ status: "pending", paid: false }), "pending");
});

test("accepts only a paid PromptPay charge matching order, amount, and currency", () => {
  assert.equal(
    validateSuccessfulPromptPayCharge(successfulCharge, {
      id: "order-123",
      amountSatang: 189000,
      chargeId: "chrg_test_123",
    }),
    true,
  );

  assert.equal(
    validateSuccessfulPromptPayCharge(
      { ...successfulCharge, amount: 1 },
      { id: "order-123", amountSatang: 189000, chargeId: "chrg_test_123" },
    ),
    false,
  );
});

test("extracts the QR image URL from an Omise PromptPay charge", () => {
  assert.equal(
    getPromptPayQrUrl(successfulCharge),
    "https://api.omise.co/charges/chrg_test_123/documents/doc_test/downloads/qr.png",
  );
  assert.equal(getPromptPayQrUrl({ ...successfulCharge, source: null }), null);
});
