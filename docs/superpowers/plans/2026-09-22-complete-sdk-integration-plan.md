# Complete SDK Integration Surface Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the server-side KailoPay SDK integration surface with explicit sandbox configuration, SEP-24 wallet flows, and signed webhook verification without changing the backend on-ramp or off-ramp contract.

**Architecture:** Keep `KailoPay` as a thin HTTP client over the versioned OpenAPI contract. Keep transaction authentication, SEP-10 bearer authentication, and retail-session cookie authentication explicit at the transport boundary. Keep webhook verification as a pure Node.js helper that consumes the exact raw body and headers; do not add dashboard session APIs to the API-key transaction client.

**Tech Stack:** TypeScript 5.9, Node.js 20+, native `fetch`, Node `crypto`, Node built-in test runner, pnpm.

**Spec:** `D:/Proyek/kailopay/kailo-sdk/openapi/kailopay.yaml` plus the backend integration contract in `D:/Proyek/kailopay/kailopay-be/documentations/backend/API-DESIGN.md`.

## Global Constraints

- The SDK is server-side only; never place an API key in browser or mobile bundles.
- Preserve the existing `/v1/quotes`, `/v1/onramps`, `/v1/offramps`, and `/v1/orders` paths, fields, response shapes, and idempotency behavior.
- Keep IDR and XLM amounts as exact strings; never convert money to JavaScript floating-point numbers.
- SEP-24 interactive start requests use `multipart/form-data`; the client must let `fetch` create the multipart boundary.
- SEP-24 wallet routes use a short-lived `Authorization: Bearer <SEP-10 token>`; interactive completion uses the retail session cookie.
- Webhook signatures cover `<timestamp>.<exact_raw_request_body>` with HMAC-SHA256 and use constant-time comparison.
- The sandbox/testnet does not move real fiat value; payout disclosures remain visible in the public types and docs.
- Do not publish to npm or push to a remote without a separate explicit request.

## Review Focus

- An invalid or missing SEP-10 token must be sent as a bearer token for wallet-owned SEP-24 routes and must not replace the API key in unrelated routes.
- Multipart requests must include optional fields without a manually supplied `Content-Type` boundary.
- SEP-24 transaction lookup must encode exactly one lookup identifier and reject ambiguous input before making a request.
- Webhook verification must reject malformed signatures, stale timestamps, and changed raw bodies while accepting valid multibyte bodies.
- Sandbox configuration must require `environment: "sandbox"` and reject non-test API keys before any request is sent.

### Task 1: Make environment and authentication explicit

**Files:**
- Modify: `src/types.ts`
- Modify: `src/client.ts`
- Modify: `src/index.ts`
- Test: `test/client.test.mjs`

**Interfaces:**
- `KailoPayOptions` gains required `environment: "sandbox"`.
- Internal request authentication supports the API key, a SEP-10 bearer token, a retail session cookie, or no credentials.
- Existing on-ramp, off-ramp, quote, and order methods keep their public signatures and endpoint paths.

- [ ] Write tests for required sandbox configuration, API-key prefix validation, and explicit auth headers.
- [ ] Run `pnpm test` and observe the new tests fail because `environment` and auth modes are not implemented.
- [ ] Implement the minimum transport changes and update existing fixtures.
- [ ] Run `pnpm test` and confirm the full suite passes.
- [ ] Commit with `feat: make SDK environment and auth explicit`.

### Task 2: Add typed SEP-24 wallet methods

**Files:**
- Create: `src/sep24-types.ts`
- Create: `src/sep24-decoders.ts`
- Modify: `src/client.ts`
- Modify: `src/index.ts`
- Test: `test/sep24.test.mjs`

**Interfaces:**
- `kailo.sep24.info()` calls `GET /sep24/info`.
- `kailo.sep24.deposit.start()` calls `POST /sep24/transactions/deposit/interactive` with a SEP-10 bearer token and multipart form data.
- `kailo.sep24.withdraw.start()` calls `POST /sep24/transactions/withdraw/interactive` with a SEP-10 bearer token and multipart form data.
- `kailo.sep24.transactions.list()` calls `GET /sep24/transactions` with owner-scoped filters.
- `kailo.sep24.transactions.get()` calls `GET /sep24/transaction` with exactly one lookup identifier.
- `kailo.sep24.interactive.get()` and `.complete()` use a `kailopay_session` cookie and JSON responses for server-side integrations.

- [ ] Write tests for request paths, bearer token headers, multipart fields, query encoding, and discriminated transaction lookup.
- [ ] Run the focused SEP-24 test and observe it fail because the surface does not exist.
- [ ] Implement exact request and response types, boundary decoders, and methods.
- [ ] Run the focused test and then `pnpm test`.
- [ ] Commit with `feat: add typed SEP-24 client methods`.

### Task 3: Add webhook signature verification

**Files:**
- Create: `src/webhooks.ts`
- Modify: `src/index.ts`
- Modify: `package.json`
- Test: `test/webhooks.test.mjs`

**Interfaces:**
- `verifyKailoWebhook(options: VerifyKailoWebhookOptions): boolean` accepts a string or byte-array raw body, the `KailoPay-Timestamp` value, the `KailoPay-Signature` value, the endpoint secret, and an optional tolerance and clock for deterministic tests.
- Verification requires the `v1=` signature format, a valid Unix timestamp, a timestamp inside the configured tolerance, and a constant-time HMAC comparison.

- [ ] Write tests for valid signatures, changed body, malformed signature, stale timestamp, and multibyte raw body.
- [ ] Run the focused webhook test and observe it fail because the helper does not exist.
- [ ] Implement the Node `crypto` verifier and add the Node type dependency.
- [ ] Run the focused test and then `pnpm test`.
- [ ] Commit with `feat: add webhook signature verification`.

### Task 4: Update docs, tests, and release metadata

**Files:**
- Modify: `README.md`
- Modify: `docs/quickstart.md`
- Modify: `docs/api-reference.md`
- Modify: `docs/orders.md`
- Modify: `docs/webhooks.md`
- Modify: `docs/testing.md`
- Modify: `CHANGELOG.md`
- Test: `test/client.test.mjs`, `test/sep24.test.mjs`, `test/webhooks.test.mjs`

- [ ] Document the required `environment: "sandbox"` option and the SEP-24 authentication split.
- [ ] Add SEP-24 and webhook examples that use exact strings and raw bodies.
- [ ] Remove duplicate README sections and keep install instructions honest about local versus published usage.
- [ ] Run `pnpm test`, `pnpm run build`, and `git diff --check`.
- [ ] Commit with `docs: document completed SDK integration surface`.

