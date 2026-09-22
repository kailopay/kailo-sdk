# Changelog

## 0.2.0

Complete the server-side integration surface.

- Require explicit `environment: "sandbox"` configuration and validate `pk_test_` keys.
- Add typed SEP-24 asset, interactive, transaction, and browser hand-off methods.
- Add explicit SEP-10 bearer and retail-session cookie authentication modes.
- Add `verifyKailoWebhook()` with timestamp tolerance and constant-time HMAC comparison.
- Expand the integration documentation and API reference.

## 0.1.0

Initial SDK foundation.

- Add a typed Node.js and TypeScript client.
- Add quote preview, on-ramp, off-ramp, and order methods.
- Add exact string amount helpers for IDR minor units and XLM decimals.
- Add API-key authentication, idempotency headers, timeout handling, and structured errors.
- Add response validation and contract tests.
- Add the versioned backend OpenAPI contract.
