# CLI Overview

The PKP CLI provides commands for creating, validating, building, and generating product catalogs.

## Installation

```bash
npm install -g pkp
```

## Commands

| Command | Description |
|---------|-------------|
| [`pkp init`](/cli/init) | Initialize a new catalog |
| [`pkp validate`](/cli/validate) | Validate PRODUCT.md files |
| [`pkp build`](/cli/build) | Build catalog for deployment |
| [`pkp serve`](/cli/serve) | Serve catalog locally |
| [`pkp generate`](/cli/generate) | Generate products with AI |

## Global Options

```bash
pkp --version    # Show version
pkp --help       # Show help
```

## Quick Reference

```bash
# Create new catalog
pkp init my-catalog

# Validate products
pkp validate ./products

# Build for deployment
pkp build . --output ./dist

# Serve locally
pkp serve ./dist --port 3000

# Generate with AI (requires ANTHROPIC_API_KEY)
pkp generate -u https://example.com/product -c notebooks
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | API key for AI generation |

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Error (validation failed, build error, etc) |
