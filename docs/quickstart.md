# Start with the KailoPay SDK

This tutorial creates a sandbox on-ramp order, reads its status, and creates an off-ramp order.

## Prerequisites

You need Node.js 20 or later and a KailoPay sandbox API key with the `pk_test_` prefix.

Keep the API key on your server. Do not put it in browser or mobile code.

## Install the package

```bash
npm install @kailopay/sdk
```

## Create the client

```ts
import { KailoPay } from "@kailopay/sdk";

const apiKey = process.env.KAILOPAY_API_KEY;
if (apiKey === undefined) {
  throw new Error("KAILOPAY_API_KEY is required");
}

const kailo = new KailoPay({
  apiKey,
  baseUrl: process.env.KAILOPAY_BASE_URL ?? "http://localhost:8080",
});
```

The client uses `http://localhost:8080` when you omit `baseUrl`. Set `baseUrl` to the deployed sandbox URL in a hosted integration.

## Create an on-ramp order

Use `minorAmount` for IDR values. The helper keeps money as a decimal string instead of a JavaScript floating-point number.

```ts
import { KailoPay, minorAmount } from "@kailopay/sdk";

const response = await kailo.onramp.create(
  {
    fiat: {
      currency: "IDR",
      amount_minor: minorAmount("100000"),
    },
    payment_method: "qris",
    stellar_destination: {
      account: "G...",
    },
  },
  {
    idempotencyKey: "buy-order-001",
  },
);

console.log(response.order.id);
console.log(response.order.checkout?.payment_link_url);
```

Use a new idempotency key for each logical purchase. Reuse the same key when you retry the same request after an unknown network result.

## Read the order

```ts
const response = await kailo.orders.get("order-id");

if (response.order.status === "completed") {
  console.log(response.order.stellar_transaction_hash);
}
```

The backend owns the order state. Do not infer completion from the presence of a checkout URL or a payment provider response.

## Create an off-ramp order

Use `exactAmount` for XLM values. The backend returns deposit instructions for the testnet transfer.

```ts
import { exactAmount } from "@kailopay/sdk";

const response = await kailo.offramp.create(
  {
    asset: {
      network: "stellar_testnet",
      code: "XLM",
      amount: exactAmount("25.0000000"),
    },
    withdrawal: {
      currency: "IDR",
      method: "sandbox_bank_transfer",
      destination_token: "test-destination-001",
    },
  },
  {
    idempotencyKey: "sell-order-001",
  },
);

console.log(response.order.id);
console.log(response.order.stellar_destination);
```

The sandbox payout is simulated. The order response identifies the payout as simulated and does not represent a real IDR transfer.

