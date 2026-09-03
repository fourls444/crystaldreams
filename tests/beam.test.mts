import { describe, test, assert } from "vitest";
import {
  mapBeamPaymentStatus,
  getPromptPayQrUrl,
  validateSuccessfulPromptPayCharge,
} from "../src/utils/beam.ts";

const makeCharge = (overrides = {}) => ({
  id: "chrg_test_abc123",
  amount: 189000,
  currency: "THB",
  status: "completed",
  paymentMethodType: "QR_PROMPT_PAY",
  metadata: { orderId: "order-uuid-1" },
  paymentInstructions: {
    qrPromptPay: {
      qrImageUrl: "https://api.beamcheckout.com/v1/charges/chrg_test_abc123/qr.png",
    },
  },
  ...overrides,
});

test("maps Beam charge statuses to local payment statuses", () => {
  assert.equal(mapBeamPaymentStatus({ status: "completed" }), "paid");
  assert.equal(mapBeamPaymentStatus({ status: "failed" }), "failed");
  assert.equal(mapBeamPaymentStatus({ status: "expired" }), "expired");
  assert.equal(mapBeamPaymentStatus({ status: "voided" }), "failed");
  assert.equal(mapBeamPaymentStatus({ status: "pending" }), "pending");
  assert.equal(mapBeamPaymentStatus({ status: "processing" }), "pending");
  assert.equal(mapBeamPaymentStatus({}), "pending");
});

test("extracts the QR image URL from a Beam PromptPay charge", () => {
  const charge = makeCharge();
  assert.equal(
    getPromptPayQrUrl(charge),
    "https://api.beamcheckout.com/v1/charges/chrg_test_abc123/qr.png",
  );
});

test("returns null when QR URL is missing or invalid", () => {
  assert.equal(getPromptPayQrUrl({}), null);
  assert.equal(getPromptPayQrUrl({ paymentInstructions: null }), null);
  assert.equal(
    getPromptPayQrUrl({ paymentInstructions: { qrPromptPay: { qrImageUrl: "not-https" } } }),
    null,
  );
});

describe("validateSuccessfulPromptPayCharge", () => {
  const expected = { id: "order-uuid-1", amountSatang: 189000, chargeId: "chrg_test_abc123" };

  test("returns true for a valid completed charge", () => {
    assert.equal(validateSuccessfulPromptPayCharge(makeCharge(), expected), true);
  });

  test("returns false when status is not completed", () => {
    assert.equal(
      validateSuccessfulPromptPayCharge(makeCharge({ status: "pending" }), expected),
      false,
    );
  });

  test("returns false when amount does not match", () => {
    assert.equal(
      validateSuccessfulPromptPayCharge(makeCharge({ amount: 100 }), expected),
      false,
    );
  });

  test("returns false when charge ID does not match", () => {
    assert.equal(
      validateSuccessfulPromptPayCharge(makeCharge({ id: "chrg_other" }), expected),
      false,
    );
  });

  test("returns false when currency is not THB", () => {
    assert.equal(
      validateSuccessfulPromptPayCharge(makeCharge({ currency: "USD" }), expected),
      false,
    );
  });

  test("returns false when orderId metadata does not match", () => {
    assert.equal(
      validateSuccessfulPromptPayCharge(
        makeCharge({ metadata: { orderId: "wrong-uuid" } }),
        expected,
      ),
      false,
    );
  });
});
