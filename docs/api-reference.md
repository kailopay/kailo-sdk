# API reference

This page documents the public exports in SDK version `0.2.0`.

## `KailoPay` constructor

```ts
new KailoPay(options: KailoPayOptions)
```

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `apiKey` | `string` | required | Server-side KailoPay API key. |
| `environment` | `"sandbox"` | required | Explicitly selects the sandbox and Stellar testnet contract. |
| `baseUrl` | `string` | `http://localhost:8080` | API origin without a trailing slash. |
| `fetch` | `typeof fetch` | global `fetch` | Optional transport for tests or custom runtimes. |
| `timeoutMs` | `number` | `15000` | Request timeout in milliseconds. |

The constructor rejects an empty API key, a non-`pk_test_` key, a missing environment, and a non-positive timeout.

## `kailo.quotes.preview()`

```ts
kailo.quotes.preview(
  request: QuotePreviewRequest,
  options?: { signal?: AbortSignal },
): Promise<QuotePreviewResponse>
```

Calls `POST /v1/quotes`. This endpoint is public in the backend contract. The SDK still sends the configured bearer header for a consistent transport.

## `kailo.onramp.create()`

```ts
kailo.onramp.create(
  request: CreateOnrampRequest,
  options?: RequestOptions,
): Promise<OrderResponse>
```

Calls `POST /v1/onramps` and sends `Idempotency-Key` when `options.idempotencyKey` is set.

## `kailo.offramp.create()`

```ts
kailo.offramp.create(
  request: CreateOfframpRequest,
  options?: RequestOptions,
): Promise<OrderResponse>
```

Calls `POST /v1/offramps` and sends `Idempotency-Key` when `options.idempotencyKey` is set.

## `kailo.orders.get()`

```ts
kailo.orders.get(
  id: string,
  options?: { signal?: AbortSignal },
): Promise<OrderResponse>
```

Calls `GET /v1/orders/{id}`. The SDK URL-encodes the order ID.

## `kailo.orders.list()`

```ts
kailo.orders.list(
  options?: ListOrdersOptions & { signal?: AbortSignal },
): Promise<ListOrdersResponse>
```

Calls `GET /v1/orders` with the optional `limit` and `cursor` query parameters.

## Amount helpers

```ts
minorAmount(value: string): MinorAmount
exactAmount(value: string): ExactAmount
```

`minorAmount` accepts a positive integer string for IDR minor units. `exactAmount` accepts an XLM decimal string with one to seven fraction digits.

Both helpers throw `Error` when the input format is invalid.

## `KailoPayError`

The client throws `KailoPayError` for non-2xx API responses.

| Property | Type | Description |
| --- | --- | --- |
| `status` | `number` | HTTP status code. |
| `code` | `string \| undefined` | Backend error code when present. |
| `requestId` | `string \| undefined` | `x-request-id` response header when present. |
| `details` | `ApiErrorPayload \| null` | Sanitized JSON error body. |

The client throws `KailoPayTimeoutError` when its own timeout aborts a request. The client does not retry requests automatically.

## SEP-24 methods

| SDK method | Backend endpoint | Authentication |
| --- | --- | --- |
| `sep24.info` | `GET /sep24/info` | None |
| `sep24.deposit.start` | `POST /sep24/transactions/deposit/interactive` | SEP-10 bearer token |
| `sep24.withdraw.start` | `POST /sep24/transactions/withdraw/interactive` | SEP-10 bearer token |
| `sep24.transactions.list` | `GET /sep24/transactions` | SEP-10 bearer token |
| `sep24.transactions.get` | `GET /sep24/transaction` | SEP-10 bearer token |
| `sep24.interactive.get` | `GET /sep24/interactive/{id}` | Retail session cookie |
| `sep24.interactive.complete` | `POST /sep24/interactive/{id}` | Retail session cookie |

`sep24.transactions.get()` requires exactly one lookup identifier. Start methods require an idempotency key.

## `verifyKailoWebhook()`

```ts
verifyKailoWebhook({
  rawBody: string | Uint8Array,
  timestamp: string,
  signature: string,
  secret: string,
  toleranceSeconds?: number,
  now?: number,
}): boolean
```

The default timestamp tolerance is 300 seconds. The helper signs `<timestamp>.<exact_raw_request_body>` with HMAC-SHA256 and compares the `v1=` digest in constant time.

## Endpoint mapping

| SDK method | Backend endpoint |
| --- | --- |
| `quotes.preview` | `POST /v1/quotes` |
| `onramp.create` | `POST /v1/onramps` |
| `offramp.create` | `POST /v1/offramps` |
| `orders.get` | `GET /v1/orders/{id}` |
| `orders.list` | `GET /v1/orders` |
| `sep24.info` | `GET /sep24/info` |
| `sep24.deposit.start` | `POST /sep24/transactions/deposit/interactive` |
| `sep24.withdraw.start` | `POST /sep24/transactions/withdraw/interactive` |
