# Architecture

PKP is designed as a three-layer architecture for maximum flexibility and decentralization.

## Layer 0: Static Files

The foundation of PKP is static files hosted on vendor domains.

```
https://example.com/
├── pkp.txt                           # Optional: discovery pointer
└── .well-known/
    └── pkp/
        ├── catalog.json              # Product index (L0)
        └── products/
            ├── product-a.md          # PRODUCT.md files
            └── product-b.md
```

### Benefits
- **Zero cost**: Just static files
- **Decentralized**: Data stays on vendor domains
- **Cacheable**: Works with CDNs
- **No vendor lock-in**: Standard HTTP

### catalog.json

```json
{
  "schema": "pkp-catalog/1.0",
  "name": "Example Store",
  "description": "Quality products",
  "updated_at": "2025-01-15T10:00:00Z",
  "products": [
    {
      "sku": "product-a",
      "name": "Product A",
      "category": "notebooks",
      "path": "products/product-a.md"
    }
  ]
}
```

## Layer 1: Catalog MCP Server

For AI agents that need to interact with a single catalog.

```bash
# Start server
pkp-catalog-server ./dist
```

### Tools Available

| Tool | Description |
|------|-------------|
| `search_products` | Search with filters |
| `get_product` | Get product details |
| `compare_products` | Compare 2-5 products |
| `list_categories` | List all categories |
| `get_product_faq` | Get product FAQ |
| `get_alternatives` | Find similar products |

### MCP Resources

- `pkp://catalog` - Catalog metadata
- `pkp://product/{sku}` - Product content

## Layer 2: Registry MCP Server

For AI agents that need cross-catalog product discovery.

```bash
# Start registry
pkp-registry-server --domain registry.example.com
```

### Tools Available

| Tool | Description |
|------|-------------|
| `search_products` | Global search across catalogs |
| `resolve_product` | Resolve `pkp://domain/sku` URI |
| `register_catalog` | Add catalog to registry |
| `compare_across_catalogs` | Compare products from different catalogs |
| `list_catalogs` | List registered catalogs |

### Product URIs

Products can be referenced globally using PKP URIs:

```
pkp://example.com/iphone-16-pro
pkp://store.example.com/galaxy-s25-ultra
```

## Data Flow

```
┌─────────────────┐
│   AI Agent      │
│  (Claude, etc)  │
└────────┬────────┘
         │ MCP Protocol
         ▼
┌─────────────────┐     ┌─────────────────┐
│ Registry Server │────▶│ Catalog Server  │
│    (Layer 2)    │     │    (Layer 1)    │
└────────┬────────┘     └────────┬────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│  catalog.json   │     │  PRODUCT.md     │
│    (Layer 0)    │     │    (Layer 0)    │
└─────────────────┘     └─────────────────┘
```

## Confidence & Trust

Each data source has an associated trust level:

| Level | Source | Trust |
|-------|--------|-------|
| 1 | `manufacturer` | Highest |
| 2 | `retailer-feed` | High |
| 3 | `community` | Medium |
| 4 | `ai-generated` | Low |
| 5 | `scraped` | Lowest |

When conflicts occur, higher trust sources take precedence.
