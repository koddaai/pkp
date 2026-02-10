# Getting Started

This guide will help you set up PKP and create your first product catalog.

## Prerequisites

- Node.js 22 or higher
- npm, pnpm, or yarn

## Installation

Install the PKP CLI globally:

::: code-group

```bash [npm]
npm install -g pkp
```

```bash [pnpm]
pnpm add -g pkp
```

```bash [yarn]
yarn global add pkp
```

:::

Verify the installation:

```bash
pkp --version
```

## Create Your First Catalog

### 1. Initialize a new catalog

```bash
pkp init my-catalog
cd my-catalog
```

This creates:
```
my-catalog/
├── pkp.config.json    # Catalog configuration
├── products/          # Product files directory
│   └── example.md     # Example PRODUCT.md
└── README.md
```

### 2. Edit the example product

Open `products/example.md` and customize it for your product:

```yaml
---
schema: pkp/1.0
sku: "my-first-product"
brand: "My Brand"
name: "My Product Name"
category: "notebooks"
summary: "A great product for developers"

specs:
  screen_size: 14
  processor: "Intel Core i7"
  ram_gb: 16
  storage_gb: 512

price:
  type: msrp
  currency: USD
  value: 999.99
---

## Overview

Describe your product here...
```

### 3. Validate your catalog

```bash
pkp validate .
```

This checks for:
- Valid YAML frontmatter
- Required fields (sku, brand, name, category)
- Category-specific spec validation
- Completeness score

### 4. Build for deployment

```bash
pkp build .
```

This generates:
```
dist/
├── .well-known/
│   └── pkp/
│       ├── catalog.json      # Product index
│       └── products/
│           └── my-first-product.md
└── pkp.txt                   # Discovery file
```

### 5. Preview locally

```bash
pkp serve dist
```

Open http://localhost:3000 to see your catalog.

## Next Steps

- [Quick Start](/guide/quick-start) - Build a complete catalog
- [PRODUCT.md Format](/guide/product-format) - Learn the full format
- [Categories](/guide/categories) - Explore category schemas
- [CLI Reference](/cli/overview) - All CLI commands
