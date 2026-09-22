# KailoPay SDK documentation

Use these pages to integrate the KailoPay sandbox and Stellar testnet API with a server-side TypeScript or Node.js application.

## Start here

Follow the [SDK quickstart](quickstart.md) to install the package, create a client, and submit a test order.

## Choose a guide

- [Authenticate securely](authentication.md) explains API keys, environments, and secret handling.
- [Create and track orders](orders.md) explains quotes, on-ramp, off-ramp, idempotency, and order states.
- [Use SEP-24](sep24.md) explains wallet authentication and interactive deposit or withdrawal hand-off.
- [Receive webhook events](webhooks.md) explains the current webhook contract and signature verification helper.
- [Run tests and local integrations](testing.md) explains package tests and custom `fetch` adapters.

## Look up a symbol

The [API reference](api-reference.md) lists the exported client methods, options, amount helpers, response types, and errors.

## Contract source

The [versioned OpenAPI contract](../openapi/kailopay.yaml) is the source of truth for endpoint paths and wire-format fields. Update the contract copy before publishing an SDK release that follows a backend API change.
