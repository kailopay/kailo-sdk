# Authenticate securely

The SDK authenticates API requests with a KailoPay API key.

## Use a sandbox API key

Pass the key to the client constructor:

```ts
const kailo = new KailoPay({
  apiKey: process.env.KAILOPAY_API_KEY,
  environment: "sandbox",
});
```

API-key-authenticated transaction requests send this header:

```http
Authorization: Bearer pk_test_...
```

SEP-24 wallet-owned methods use a short-lived SEP-10 bearer token. Interactive
methods use the `kailopay_session` cookie returned by the retail hand-off.

The SDK does not create, revoke, or list API keys. Those operations use the authenticated developer control plane and remain outside the server-to-server order client in version `0.2.0`.

## Keep the key on the server

Store the key in a secret manager or a protected environment variable. Do not commit the key to source control. Do not return the key to a browser or mobile client.

If a key is exposed, revoke it through the KailoPay developer control plane and create a replacement.

## Select the environment explicitly

The SDK does not change environments based on a hidden default. Set both the API key and the base URL for the environment you want to use:

```ts
const kailo = new KailoPay({
  apiKey: process.env.KAILOPAY_TEST_API_KEY,
  environment: "sandbox",
  baseUrl: "https://sandbox-api.example.com",
});
```

The current backend contract supports the sandbox environment on the Stellar testnet. The sandbox does not move real fiat value.
