import assert from "node:assert/strict";
import test from "node:test";
import { KailoPay, KailoPayError } from "../dist/index.js";

const orderResponse = {
  order: {
    id: "order-1",
    status: "created",
    environment: "sandbox",
    network: "stellar_testnet",
    fiat: { currency: "IDR", amount_minor: "100000" },
    asset: { network: "stellar_testnet", code: "XLM", amount: "1.0000000" },
    quote: {
      rate: "100000",
      adjusted_rate: "100000",
      spread_bps: 0,
      source_at: "2026-09-22T00:00:00Z",
      expires_at: "2026-09-22T00:05:00Z",
    },
    stellar_destination: { account: "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF" },
    created_at: "2026-09-22T00:00:00Z",
    updated_at: "2026-09-22T00:00:00Z",
  },
};

test("creates an on-ramp with bearer and idempotency headers", async () => {
  let received;
  const client = new KailoPay({
    apiKey: "pk_test_example",
    baseUrl: "https://api.example.test/",
    fetch: async (input, init) => {
      received = { input, init };
      return new Response(JSON.stringify(orderResponse), {
        status: 201,
        headers: { "content-type": "application/json" },
      });
    },
  });

  await client.onramp.create(
    {
      fiat: { currency: "IDR", amount_minor: "100000" },
      stellar_destination: { account: "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF" },
    },
    { idempotencyKey: "idempotency-1" },
  );

  assert.equal(received.input, "https://api.example.test/v1/onramps");
  assert.equal(received.init.headers.get("Authorization"), "Bearer pk_test_example");
  assert.equal(received.init.headers.get("Idempotency-Key"), "idempotency-1");
  assert.equal(received.init.method, "POST");
});

test("encodes order ids and query parameters", async () => {
  const requests = [];
  const client = new KailoPay({
    apiKey: "pk_test_example",
    baseUrl: "https://api.example.test",
    fetch: async (input) => {
      const url = String(input);
      requests.push(url);
      const payload = url.includes("?limit=") ? { orders: [], next_cursor: "" } : orderResponse;
      return new Response(JSON.stringify(payload), { status: 200 });
    },
  });

  await client.orders.get("order/with spaces");
  await client.orders.list({ limit: 25, cursor: "next page" });

  assert.equal(requests[0], "https://api.example.test/v1/orders/order%2Fwith%20spaces");
  assert.equal(requests[1], "https://api.example.test/v1/orders?limit=25&cursor=next+page");
});

test("maps API errors without exposing the API key", async () => {
  const client = new KailoPay({
    apiKey: "pk_test_secret",
    fetch: async () =>
      new Response(JSON.stringify({ code: "AMOUNT_OUT_OF_RANGE", message: "amount is invalid" }), {
        status: 422,
        headers: { "x-request-id": "request-1" },
      }),
  });

  await assert.rejects(
    client.orders.get("order-1"),
    (error) => {
      assert.ok(error instanceof KailoPayError);
      assert.equal(error.status, 422);
      assert.equal(error.code, "AMOUNT_OUT_OF_RANGE");
      assert.equal(error.requestId, "request-1");
      assert.equal(String(error), "KailoPayError: amount is invalid");
      assert.equal(String(error).includes("pk_test_secret"), false);
      return true;
    },
  );
});
