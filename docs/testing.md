# Run tests and local integrations

## Run the package checks

Install the development dependency and run the build plus contract tests:

```bash
pnpm install
pnpm test
```

The test suite uses Node's built-in test runner. It checks request paths, authentication headers, idempotency headers, query encoding, API error mapping, and response validation.

## Use a custom transport

Pass a `fetch` implementation to test application code without making network requests:

```ts
const requests: string[] = [];

const kailo = new KailoPay({
  apiKey: "pk_test_example",
  fetch: async (input) => {
    requests.push(String(input));
    return new Response(JSON.stringify({
      orders: [],
      next_cursor: "",
    }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  },
});

await kailo.orders.list();
```

Use a recorded sandbox response or a backend integration environment to test the complete payment and Stellar lifecycle. Do not use a unit-test mock to claim that a payment was confirmed on-chain.

## Test against the local backend

Start the backend on its configured local port, set the API key and base URL, and run the same server-side code against the local API:

```bash
$env:KAILOPAY_API_KEY = "pk_test_example"
$env:KAILOPAY_BASE_URL = "http://localhost:8080"
pnpm test
```

The SDK tests do not require a running backend. The local integration requires a configured backend database and testnet dependencies.

