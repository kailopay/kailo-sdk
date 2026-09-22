# Publish the SDK to npm

This repository is configured for the public package `@kailopay/sdk` and a tag-based npm release workflow.

The examples below assume the canonical public repository is `kailopay/kailo-sdk`. If the repository is created under a different GitHub owner, update `repository`, `homepage`, `bugs`, and the trusted-publisher configuration before publishing.

## What is configured

- `package.json` declares the public npm registry, public scoped-package access, repository metadata, and package keywords.
- `files` limits the published tarball to `dist`, `README.md`, and `LICENSE`.
- `prepublishOnly` builds the TypeScript output and runs the contract tests.
- `.github/workflows/publish.yml` publishes only when a `vX.Y.Z` tag is pushed.
- The workflow verifies that the Git tag exactly matches the package version before publishing.
- GitHub Actions uses npm trusted publishing through OIDC, so no long-lived npm publish token is stored in GitHub Actions.

## One-time account setup

1. Create or confirm the npm user or organization that owns the `@kailopay` scope.
2. Enable two-factor authentication on the npm account.
3. Create the public GitHub repository at `https://github.com/kailopay/kailo-sdk`.
4. Add the GitHub repository as `origin` and push this repository, including `.github/workflows/publish.yml`:

   ```bash
   git remote add origin https://github.com/kailopay/kailo-sdk.git
   git push --set-upstream origin main
   ```

5. Bootstrap the first package version manually from the repository root:

   ```bash
   npm login
   npm publish --access public
   ```

6. On npmjs.com, open `@kailopay/sdk` → **Settings** → **Trusted Publisher** and add:

   - provider: GitHub Actions;
   - owner: `kailopay`;
   - repository: `kailo-sdk`;
   - workflow filename: `publish.yml`;
   - environment: blank unless a GitHub deployment environment is introduced.

After the first package exists, the trusted-publisher relationship can be configured for future automated releases. npm's trusted publishing requires a recent npm CLI and a supported cloud-hosted CI provider; the workflow uses Node.js 24 and GitHub-hosted Actions runners.

## Validate before the first publish

```bash
pnpm install --frozen-lockfile
pnpm test
pnpm pack --dry-run
```

Review the pack output for secrets, private keys, `.env` files, and unnecessary internal files. The package must never contain API keys or Stellar private keys.

## Release a new version

Use semantic versioning and create a tag that matches `package.json`:

```bash
npm version patch
git push origin main --follow-tags
```

The tag push starts the workflow. It installs from the frozen lockfile, verifies the tag, runs tests, and publishes the package with `npm publish --access public`.

Do not reuse a published version. If a release has already reached npm, increment the version even when the previous publication must be deprecated.

## Verify the release

```bash
npm view @kailopay/sdk version
npm install @kailopay/sdk
```

The package remains a server-side sandbox/testnet SDK. The existing on-ramp and off-ramp API methods are not changed by the publishing configuration.
