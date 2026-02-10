# Changesets

This directory contains configuration for [Changesets](https://github.com/changesets/changesets), which manages versioning and changelogs for PKP packages.

## Adding a changeset

When you make a change that needs to be released, run:

```bash
pnpm changeset
```

This will prompt you to:
1. Select which packages have changed
2. Choose the semver bump type (patch/minor/major)
3. Write a summary of the changes

## Releasing

The release process is automated via GitHub Actions:

1. When changesets are merged to `main`, a "Version Packages" PR is created
2. Merging that PR triggers the publish workflow
3. Packages are published to npm with the new versions

## Manual release (if needed)

```bash
pnpm changeset version  # Apply version bumps
pnpm build              # Build all packages
pnpm changeset publish  # Publish to npm
```
