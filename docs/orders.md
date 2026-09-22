# Create and track orders

The SDK exposes the existing KailoPay order API. It does not implement payment or Stellar settlement logic in the client.

## Preview a quote

Quote previews do not create orders or reserve liquidity.

```ts
import { KailoPay, minorAmount } from "@kailopay/sdk";

const response = await kailo.quotes.preview({
  direction: "buy",
  fiat: {
    currency: "IDR",
    amount_minor: minorAmount("100000"),
  },
  asset: {
    network: "stellar_testnet",
    code: "XLM",
  },
});

console.log(response.quote.asset.amount);
console.log(response.quote.expires_at);
```

The order creation endpoint fetches an authoritative quote again. A preview can expire or differ from the order quote.

## Use idempotency for mutations

The backend requires an `Idempotency-Key` header for on-ramp and off-ramp creation. Pass the value through `RequestOptions.idempotencyKey`:

```ts
await kailo.onramp.create(request, {
  idempotencyKey: "checkout-session-123",
});
```

Use a stable key for one logical operation. Do not reuse a key for a different amount, destination, or order.

The SDK does not retry mutations automatically. If a request times out after the server may have accepted it, query the order or reconcile the operation before sending another mutation.

## Read orders

```ts
const order = await kailo.orders.get(orderId);
const page = await kailo.orders.list({ limit: 25 });

if (page.next_cursor !== "") {
  const nextPage = await kailo.orders.list({
    limit: 25,
    cursor: page.next_cursor,
  });
}
```

The API returns exact amounts as strings. Keep those values as strings in your application and database.

## Understand the order states

| Direction | Typical states | Terminal states |
| --- | --- | --- |
| Buy XLM | `created`, `payment_pending`, `payment_confirmed`, `stellar_processing` | `completed`, `expired`, `payment_failed`, `stellar_failed`, `cancelled` |
| Sell XLM | `created`, `asset_pending`, `asset_received`, `retirement_processing`, `withdrawal_processing` | `completed`, `expired`, `asset_invalid`, `retirement_failed`, `withdrawal_failed` |

The backend may expose additional state transitions as the order progresses. Treat unknown status values as non-terminal until the API contract defines them.

## Check sandbox payout disclosure

Off-ramp responses can include a `payout` object. Read `payout.simulated` and `payout.disclosure` before showing a payout as real money.

