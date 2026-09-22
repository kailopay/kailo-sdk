# Receive webhook events

The KailoPay backend can deliver signed order events to a registered HTTPS endpoint. SDK version `0.1.0` does not yet export a webhook verification helper, so verify the signature in your application before processing an event.

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

Example with Node.js:

```ts
import { createHmac, timingSafeEqual } from "node:crypto";

export function verifyKailoWebhook(
  rawBody: string,
  timestamp: string,
  signatureHeader: string,
  secret: string,
): boolean {
  const expected = `v1=${createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`, "utf8")
    .digest("hex")}`;
  const received = Buffer.from(signatureHeader, "utf8");
  const calculated = Buffer.from(expected, "utf8");

  return received.length === calculated.length && timingSafeEqual(received, calculated);
}
```

Reject stale timestamps before accepting an event. Record the event ID and make event handling idempotent because delivery is at least once.

## Current SDK boundary

The backend control plane owns webhook registration, delivery history, test events, and replay. Those routes use a developer session rather than an API key. The first SDK release does not wrap those routes.

The SDK roadmap includes a typed webhook verification helper after the event envelope and secret lifecycle are finalized for public release.
