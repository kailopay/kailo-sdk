# Use SEP-24

The SEP-24 client uses a short-lived SEP-10 bearer token for wallet-owned operations. It returns an interactive URL for the wallet or application to open.

## Read supported assets

```ts
const info = await kailo.sep24.info();
console.log(info.deposit.XLM);
console.log(info.withdraw.XLM);
```

The info response contains the enabled state, limits, amount unit, and fiat currency for XLM deposits and withdrawals.

## Start a deposit

```ts
const start = await kailo.sep24.deposit.start(
  {
    asset_code: "XLM",
    amount_minor: "100000",
    account: "G...",
    payment_method: "qris",
  },
  {
    sep10Token: process.env.KAILOPAY_SEP10_TOKEN,
    idempotencyKey: "sep24-deposit-001",
  },
);

console.log(start.id, start.url);
```

The method sends `multipart/form-data`. The SDK creates the form boundary through `fetch`.

## Start a withdrawal

```ts
const start = await kailo.sep24.withdraw.start(
  {
    asset_code: "XLM",
    amount: "25.0000000",
    destination_token: "test-destination-001",
  },
  {
    sep10Token: process.env.KAILOPAY_SEP10_TOKEN,
    idempotencyKey: "sep24-withdraw-001",
  },
);
```

The sandbox destination is a synthetic token. It is not a bank account and does not cause a real IDR payout.

## List or read transactions

```ts
const page = await kailo.sep24.transactions.list({
  sep10Token: process.env.KAILOPAY_SEP10_TOKEN,
  limit: 20,
  kind: "deposit",
});

const transaction = await kailo.sep24.transactions.get({
  sep10Token: process.env.KAILOPAY_SEP10_TOKEN,
  id: page.transactions[0].id,
});
```

Pass exactly one of `id`, `stellar_transaction_id`, or `external_transaction_id` to `transactions.get()`.

## Complete an interactive hand-off

The interactive endpoints use the `kailopay_session` cookie because the browser hand-off links the wallet transaction to a KailoPay retail session.

```ts
const projection = await kailo.sep24.interactive.get(start.id, {
  sessionCookie: "kailopay_session=session-value",
});

const completed = await kailo.sep24.interactive.complete(start.id, {
  sessionCookie: "kailopay_session=session-value",
  destination_token: "test-destination-001",
});
```

Do not put the session cookie or SEP-10 token in a browser bundle. Use the returned interactive URL for the user-facing hand-off.

