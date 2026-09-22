# Receive webhook events

The KailoPay backend can deliver signed order events to a registered HTTPS endpoint. SDK version `0.2.0` exports `verifyKailoWebhook()` for signature verification.

## Preserve the raw request body

Read the request body as bytes before JSON parsing. Signature verification fails if your framework changes whitespace, key order, or encoding before verification.

The backend signs these bytes:

```text
${timestamp}.${rawRequestBody}
```

Use the timestamp and signature headers from the request. Compare the calculated signature in constant time.

The backend sends these headers:

```http
KailoPay-Event-Id: evt_...
KailoPay-Timestamp: 1787055000
KailoPay-Signature: v1=<hex HMAC-SHA256>
KailoPay-Event-Type: order.completed
KailoPay-Api-Version: 2026-08-01
```

Verify the event with the SDK:

```ts
import { verifyKailoWebhook } from "@kailopay/sdk";

const valid = verifyKailoWebhook({
  rawBody,
  timestamp: request.headers.get("KailoPay-Timestamp") ?? "",
  signature: request.headers.get("KailoPay-Signature") ?? "",
  secret: process.env.KAILOPAY_WEBHOOK_SECRET ?? "",
});

if (!valid) {
  throw new Error("invalid KailoPay webhook signature");
}
```

The helper rejects stale timestamps by default after 300 seconds. Record the event ID and make event handling idempotent because delivery is at least once.

## Current SDK boundary

The backend control plane owns webhook registration, delivery history, test events, and replay. Those routes use a developer session rather than an API key. The first SDK release does not wrap those routes.

The SDK does not wrap webhook registration, delivery history, test events, or replay. Those routes use a developer session rather than an API key.
