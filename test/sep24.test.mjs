import assert from "node:assert/strict";
import test from "node:test";
import { KailoPay } from "../dist/index.js";

const account = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";

const startResponse = {
  type: "interactive_customer_info_needed",
  url: "http://localhost:8080/sep24/interactive/tx-1",
  id: "tx-1",
  kyc_required: true,
  environment: "sandbox",
  network: "stellar_testnet",
};

const transaction = {
  id: "tx-1",
  kind: "deposit",
  status: "pending_anchor",
  started_at: "2026-09-22T00:00:00Z",
  updated_at: "2026-09-22T00:00:00Z",
  amount_in: "100000",
  amount_out: "1.0000000",
};

function makeClient(fetch) {
  return new KailoPay({
    apiKey: "pk_test_example",
    environment: "sandbox",
    baseUrl: "https://api.example.test",
    fetch,
  });
}

test("reads SEP-24 info without adding transaction credentials", async () => {
  let request;
  const client = makeClient(async (input, init) => {
    request = { input: String(input), init };
    return new Response(JSON.stringify({
      deposit: { XLM: { enabled: true, min_amount: 1000, max_amount: 1000000, amount_unit: "idr_minor", fiat_currency: "IDR" } },
      withdraw: { XLM: { enabled: true, min_amount: 0.1, max_amount: 100, amount_unit: "XLM", fiat_currency: "IDR" } },
      fee: {},
    }), { status: 200 });
  });

  await client.sep24.info();

  assert.equal(request.input, "https://api.example.test/sep24/info");
  assert.equal(request.init.headers.get("Authorization"), null);
});

test("starts an SEP-24 deposit with a SEP-10 bearer token and multipart fields", async () => {
  let request;
  const client = makeClient(async (input, init) => {
    request = { input: String(input), init };
    return new Response(JSON.stringify(startResponse), { status: 200 });
  });

  const response = await client.sep24.deposit.start(
    {
      asset_code: "XLM",
      amount_minor: "100000",
      account,
      memo: "memo-1",
      memo_type: "text",
      payment_method: "qris",
    },
    { sep10Token: "sep10.jwt", idempotencyKey: "deposit-1" },
  );

  assert.equal(response.id, "tx-1");
  assert.equal(request.input, "https://api.example.test/sep24/transactions/deposit/interactive");
  assert.equal(request.init.method, "POST");
  assert.equal(request.init.headers.get("Authorization"), "Bearer sep10.jwt");
  assert.equal(request.init.headers.get("Idempotency-Key"), "deposit-1");
  assert.equal(request.init.headers.get("Content-Type"), null);
  assert.equal(request.init.body.get("asset_code"), "XLM");
  assert.equal(request.init.body.get("amount_minor"), "100000");
  assert.equal(request.init.body.get("account"), account);
  assert.equal(request.init.body.get("payment_method"), "qris");
});

test("lists SEP-24 transactions with wallet filters", async () => {
  let request;
  const client = makeClient(async (input, init) => {
    request = { input: String(input), init };
    return new Response(JSON.stringify({ transactions: [transaction] }), { status: 200 });
  });

  const response = await client.sep24.transactions.list({
    sep10Token: "sep10.jwt",
    limit: 10,
    asset_code: "XLM",
    kind: "deposit",
    no_older_than: "2026-09-01T00:00:00Z",
    paging_id: "page-1",
    lang: "en",
  });

  assert.equal(response.transactions[0].id, "tx-1");
  assert.equal(request.input, "https://api.example.test/sep24/transactions?limit=10&asset_code=XLM&kind=deposit&no_older_than=2026-09-01T00%3A00%3A00Z&paging_id=page-1&lang=en");
  assert.equal(request.init.headers.get("Authorization"), "Bearer sep10.jwt");
});

test("rejects ambiguous SEP-24 transaction lookup before making a request", async () => {
  let calls = 0;
  const client = makeClient(async () => {
    calls += 1;
    return new Response(JSON.stringify({ transaction }), { status: 200 });
  });

  await assert.rejects(
    client.sep24.transactions.get({ sep10Token: "sep10.jwt", id: "tx-1", stellar_transaction_id: "hash-1" }),
    /exactly one transaction lookup identifier/,
  );
  assert.equal(calls, 0);
});

test("does not leave a timeout active when SEP-10 authentication is empty", async () => {
  const client = makeClient(async () => new Response(JSON.stringify({ transactions: [] }), { status: 200 }));
  const originalSetTimeout = globalThis.setTimeout;
  const originalClearTimeout = globalThis.clearTimeout;
  let activeTimeouts = 0;

  globalThis.setTimeout = (...args) => {
    activeTimeouts += 1;
    return originalSetTimeout(...args);
  };
  globalThis.clearTimeout = (handle) => {
    activeTimeouts -= 1;
    return originalClearTimeout(handle);
  };

  try {
    await assert.rejects(
      client.sep24.transactions.list({ sep10Token: "" }),
      /bearer token is required/,
    );
    assert.equal(activeTimeouts, 0);
  } finally {
    globalThis.setTimeout = originalSetTimeout;
    globalThis.clearTimeout = originalClearTimeout;
  }
});

test("uses the retail session cookie for SEP-24 interactive completion", async () => {
  let request;
  const client = makeClient(async (input, init) => {
    request = { input: String(input), init };
    return new Response(JSON.stringify({ transaction }), { status: 200 });
  });

  await client.sep24.interactive.complete("tx-1", {
    sessionCookie: "kailopay_session=session-value",
    destination_token: "destination-1",
  });

  assert.equal(request.input, "https://api.example.test/sep24/interactive/tx-1");
  assert.equal(request.init.headers.get("Authorization"), null);
  assert.equal(request.init.headers.get("Cookie"), "kailopay_session=session-value");
  assert.equal(request.init.headers.get("Content-Type"), "application/x-www-form-urlencoded");
  assert.equal(request.init.body, "destination_token=destination-1");
});
