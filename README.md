# `@kailopay/sdk`

Official TypeScript/Node.js SDK for the KailoPay sandbox and Stellar testnet API.

> This first release is server-side only. Never ship a KailoPay API key in a browser or mobile bundle. The sandbox does not move real fiat value.

## Status

The repository is the Week 1 SDK foundation. It currently provides typed helpers for:

- on-ramp order creation;
- off-ramp order creation;
- quote preview;
- order lookup and cursor-based listing;
- timeout handling and structured API errors;
- `Authorization: Bearer pk_test_...` and `Idempotency-Key` headers.

Developer dashboard, analytics, revenue, wallet-profile, and webhook-administration routes remain session-authenticated control-plane APIs. They will be added as a separate surface only when their public SDK contract is finalized.

## Documentation

Start with the [SDK quickstart](docs/quickstart.md). Use the [API reference](docs/api-reference.md) to look up client options, methods, types, and errors.

- [Documentation map](docs/README.md)
- [Authenticate securely](docs/authentication.md)
- [Create and track orders](docs/orders.md)
- [Receive webhook events](docs/webhooks.md)
- [Run tests and local integrations](docs/testing.md)
- [Changelog](CHANGELOG.md)

## Documentation

Start with the [SDK quickstart](docs/quickstart.md). Use the [API reference](docs/api-reference.md) to look up client options, methods, types, and errors.

- [Documentation map](docs/README.md)
- [Authenticate securely](docs/authentication.md)
- [Create and track orders](docs/orders.md)
- [Receive webhook events](docs/webhooks.md)
- [Run tests and local integrations](docs/testing.md)
- [Changelog](CHANGELOG.md)

## Install

```bash
npm install @kailopay/sdk
```

## Quickstart

```ts
import { KailoPay, minorAmount } from "@kailopay/sdk";

const kailo = new KailoPay({
  apiKey: process.env.KAILOPAY_API_KEY,
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

The backend contract currently exposes the sandbox/testnet environment through the configured API base URL and the API key prefix. The SDK does not silently switch environments. Use an explicit base URL and `pk_test_...` key for testnet:

```ts
const kailo = new KailoPay({
  apiKey: process.env.KAILOPAY_TEST_API_KEY,
  baseUrl: "https://sandbox-api.kailopay.example",
});
```

The SDK only sends requests; it does not generate Stellar private keys or perform custodial signing.

## Local development

```bash
npm install
npm test
```

`npm test` builds the package and runs its request-contract tests with Node's built-in test runner.

## Compatibility promise

The SDK is a thin client over the published OpenAPI contract. It does not change the backend's existing on-ramp or off-ramp paths, request fields, idempotency behavior, or response shapes. Breaking API changes require a new SDK major version.
