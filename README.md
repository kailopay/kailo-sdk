# `@kailopay/sdk`

Official TypeScript/Node.js SDK for the KailoPay sandbox and Stellar testnet API.

> This release is server-side only. Never ship a KailoPay API key in a browser or mobile bundle. The sandbox does not move real fiat value.

## Status

The SDK provides typed helpers for:

- on-ramp order creation;
- off-ramp order creation;
- quote preview;
- order lookup and cursor-based listing;
- SEP-24 asset information, interactive deposit and withdrawal starts, transaction lookup, and browser hand-off;
- webhook signature verification for raw request bodies;
- timeout handling and structured API errors;
- `Authorization: Bearer pk_test_...` and `Idempotency-Key` headers.

Developer dashboard, analytics, revenue, wallet-profile, and webhook-administration routes remain session-authenticated control-plane APIs. They will be added as a separate surface only when their public SDK contract is finalized.

## Documentation

Start with the [SDK quickstart](https://github.com/kailopay/kailo-sdk/blob/main/docs/quickstart.md). Use the [API reference](https://github.com/kailopay/kailo-sdk/blob/main/docs/api-reference.md) to look up client options, methods, types, and errors.

- [Documentation map](https://github.com/kailopay/kailo-sdk/blob/main/docs/README.md)
- [Authenticate securely](https://github.com/kailopay/kailo-sdk/blob/main/docs/authentication.md)
- [Create and track orders](https://github.com/kailopay/kailo-sdk/blob/main/docs/orders.md)
- [Use SEP-24](https://github.com/kailopay/kailo-sdk/blob/main/docs/sep24.md)
- [Receive webhook events](https://github.com/kailopay/kailo-sdk/blob/main/docs/webhooks.md)
- [Run tests and local integrations](https://github.com/kailopay/kailo-sdk/blob/main/docs/testing.md)
- [Publish the SDK](https://github.com/kailopay/kailo-sdk/blob/main/docs/publishing.md)
- [Changelog](https://github.com/kailopay/kailo-sdk/blob/main/CHANGELOG.md)
- [Contributing](https://github.com/kailopay/kailo-sdk/blob/main/CONTRIBUTING.md)
- [Security policy](https://github.com/kailopay/kailo-sdk/blob/main/SECURITY.md)

## Install

```bash
npm install @kailopay/sdk
```

## Quickstart

```ts
import { KailoPay, minorAmount } from "@kailopay/sdk";

const apiKey = process.env.KAILOPAY_API_KEY;
if (apiKey === undefined) {
  throw new Error("KAILOPAY_API_KEY is required");
}

const kailo = new KailoPay({
  apiKey,
  environment: "sandbox",
  baseUrl: process.env.KAILOPAY_BASE_URL ?? "http://localhost:8080",
  timeoutMs: 15_000,
});

const order = await kailo.onramp.create(
  {
    fiat: { currency: "IDR", amount_minor: minorAmount("100000") },
    payment_method: "qris",
    stellar_destination: {
      account: "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
    },
  },
  { idempotencyKey: "buy-demo-001" },
);

console.log(order.order.id, order.order.status);
```

Amounts are strings on purpose. Do not convert IDR or XLM values to JavaScript floating-point numbers.

## Testnet and test mode

The SDK requires an explicit environment. Use the `sandbox` environment and a `pk_test_...` key for testnet:

```ts
const testApiKey = process.env.KAILOPAY_TEST_API_KEY;
if (testApiKey === undefined) {
  throw new Error("KAILOPAY_TEST_API_KEY is required");
}

const kailo = new KailoPay({
  apiKey: testApiKey,
  environment: "sandbox",
  baseUrl: "https://sandbox-api.kailopay.example",
});
```

The SDK only sends requests; it does not generate Stellar private keys or perform custodial signing.

## Local development

```bash
npm install
npm test
```

`npm test` builds the package and runs its request-contract tests with Node's built-in test runner. The repository also supports `pnpm test`.

## Compatibility promise

The SDK is a thin client over the published OpenAPI contract. It does not change the backend's existing on-ramp or off-ramp paths, request fields, idempotency behavior, or response shapes. Breaking API changes require a new SDK major version.
