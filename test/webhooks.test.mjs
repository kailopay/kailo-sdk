import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import { verifyKailoWebhook } from "../dist/index.js";

const secret = "whsec_test_secret";
const timestamp = "1700000000";
const rawBody = JSON.stringify({ event: "order.completed", message: "sukses ✓" });

function signatureFor(body, at = timestamp) {
  return `v1=${createHmac("sha256", secret).update(`${at}.${body}`, "utf8").digest("hex")}`;
}

test("accepts a valid signature for an exact multibyte raw body", () => {
  assert.equal(
    verifyKailoWebhook({
      rawBody,
      timestamp,
      signature: signatureFor(rawBody),
      secret,
      now: 1700000010,
    }),
    true,
  );
});

test("accepts a valid signature when the raw body is a byte array", () => {
  const body = new TextEncoder().encode(rawBody);
  assert.equal(
    verifyKailoWebhook({
      rawBody: body,
      timestamp,
      signature: signatureFor(rawBody),
      secret,
      now: 1700000010,
    }),
    true,
  );
});

test("rejects a signature calculated for a different body", () => {
  assert.equal(
    verifyKailoWebhook({
      rawBody: `${rawBody} `,
      timestamp,
      signature: signatureFor(rawBody),
      secret,
      now: 1700000010,
    }),
    false,
  );
});

test("rejects malformed signatures and stale timestamps", () => {
  assert.equal(
    verifyKailoWebhook({
      rawBody,
      timestamp,
      signature: "sha256=not-v1",
      secret,
      now: 1700000010,
    }),
    false,
  );
  assert.equal(
    verifyKailoWebhook({
      rawBody,
      timestamp,
      signature: signatureFor(rawBody),
      secret,
      now: 1700001000,
      toleranceSeconds: 300,
    }),
    false,
  );
});

