# pkp build

Build PKP catalog for deployment.

## Usage

```bash
pkp build [directory] [options]
```

## Arguments

| Argument | Description | Default |
|----------|-------------|---------|
| `directory` | Source directory | Current directory |

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `-o, --output <dir>` | Output directory | `./dist` |
| `-c, --config <file>` | Config file path | `pkp.config.json` |
| `-v, --verbose` | Show detailed output | `false` |

## Examples

```bash
# Build current directory
pkp build

# Build specific directory
pkp build ./my-catalog

# Custom output directory
pkp build . --output ./public

# Verbose output
pkp build . --verbose
```

## Output Structure

```
dist/
├── pkp.txt                      # Discovery pointer
└── .well-known/
    └── pkp/
        ├── catalog.json         # Product index
        └── products/
            ├── product-a.md
            └── product-b.md
```

## catalog.json

```json
{
  "schema": "pkp-catalog/1.0",
  "name": "My Catalog",
  "description": "Product catalog",
  "updated_at": "2025-01-15T10:00:00Z",
  "products": [
    {
      "sku": "product-a",
      "name": "Product A",
      "brand": "Brand",
      "category": "notebooks",
      "path": "products/product-a.md",
      "completeness_score": 0.85
    }
  ]
}
```
