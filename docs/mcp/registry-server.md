# Registry Server

The PKP Registry Server aggregates multiple PKP catalogs for global product discovery.

## Installation

```bash
npm install -g @pkprotocol/registry-server
```

## Usage

```bash
pkp-registry-server [options]
```

### In-Memory Storage (default)

```bash
pkp-registry-server --domain pkp.kodda.ai
```

### PostgreSQL Storage

For production use with persistence and full-text search:

```bash
pkp-registry-server --storage postgresql \
  --pg-host localhost \
  --pg-database pkp \
  --pg-user pkp \
  --domain pkp.kodda.ai
```

**PostgreSQL Options:**
| Option | Description |
|--------|-------------|
| `--storage postgresql` | Enable PostgreSQL storage |
| `--pg-host <host>` | PostgreSQL host (default: localhost) |
| `--pg-port <port>` | PostgreSQL port (default: 5432) |
| `--pg-database <db>` | Database name (required) |
| `--pg-user <user>` | Database user (required) |
| `--pg-password <pass>` | Database password |
| `--pg-ssl` | Enable SSL connection |

**Environment Variables:**
```bash
export PGHOST=localhost
export PGPORT=5432
export PGDATABASE=pkp
export PGUSER=pkp
export PGPASSWORD=secret
```

### Database Setup

Run migrations before using PostgreSQL:

```bash
psql -d pkp -f migrations/001_create_pkp_domains.sql
psql -d pkp -f migrations/002_create_pkp_registry_index.sql
psql -d pkp -f migrations/003_create_pkp_query_log.sql
psql -d pkp -f migrations/004_create_fulltext_search_pt.sql
```

## MCP Configuration

```json
{
  "mcpServers": {
    "pkp-registry": {
      "command": "pkp-registry-server",
      "args": ["--domain", "registry.pkp.dev"]
    }
  }
}
```

## Tools

### search_products

Search products across all registered catalogs.

```typescript
{
  query?: string,
  category?: string,
  brand?: string,
  domain?: string,      // Filter by catalog domain
  min_price?: number,
  max_price?: number,
  limit?: number
}
```

### resolve_product

Resolve a PKP URI to product details.

```typescript
{
  uri: string  // e.g., "pkp://store.example.com/iphone-16-pro"
}
```

### register_catalog

Register a new catalog in the registry.

```typescript
{
  domain: string  // Domain hosting the catalog
}
```

### refresh_catalog

Re-crawl and update a registered catalog.

```typescript
{
  domain: string
}
```

### unregister_catalog

Remove a catalog from the registry.

```typescript
{
  domain: string
}
```

### list_catalogs

List all registered catalogs.

### list_categories

List all categories across catalogs.

### get_registry_stats

Get registry statistics (catalog count, product count, etc).

### compare_across_catalogs

Compare products from different catalogs.

```typescript
{
  uris: string[]  // Array of PKP URIs
}
```

## Resources

### pkp://registry/stats

Registry statistics.

### pkp://registry/catalogs

List of registered catalogs.

## Product URIs

The registry uses PKP URIs for global product identification:

```
pkp://{domain}/{sku}
```

Examples:
- `pkp://apple.com/iphone-16-pro`
- `pkp://samsung.com/galaxy-s25-ultra`
- `pkp://store.example.com/my-product`

## Catalog Discovery

The registry discovers catalogs by fetching:

```
https://{domain}/.well-known/pkp/catalog.json
```

Catalogs must follow the PKP specification to be indexed.
