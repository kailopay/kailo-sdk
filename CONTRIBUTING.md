# Contributing to KailoPay SDK

Thanks for helping improve the KailoPay TypeScript SDK.

## Development setup

Requirements:

- Node.js 20 or newer;
- pnpm 11.19.0 or newer.

Install dependencies and run the verification suite:

```bash
pnpm install --frozen-lockfile
pnpm test
pnpm run build
```

## Pull requests

- Keep the server-side-only boundary intact. Never add private keys, API keys, or provider secrets to source, tests, fixtures, or documentation.
- Preserve the existing on-ramp and off-ramp request paths and response contracts unless the corresponding backend API change is intentional and documented.
- Add or update contract tests for request, authentication, error, and response behavior.
- Update the API reference, changelog, and relevant guides when the public SDK surface changes.
- Use semantic versioning when proposing a release.

## Release changes

Do not publish from a pull request. Releases are created by pushing a `vX.Y.Z` tag after the change has landed on `main`. See [the publishing guide](docs/publishing.md).
