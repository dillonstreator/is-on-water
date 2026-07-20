# Changesets

Record user-facing changes before merge:

```sh
pnpm changeset
```

On push to `main`, the Release workflow opens a Version Packages PR. Merging it bumps the version, updates `CHANGELOG.md`, creates a git tag, and publishes a GitHub Release (no npm publish — this package is `private`).
