# Catalog Server

The PKP Catalog Server is an MCP server that serves a local PKP catalog to AI agents.

## Installation

```bash
npm install -g @pkprotocol/catalog-server
```

## Usage

```bash
pkp-catalog-server <catalog-dir>
```

Example:
```bash
pkp-catalog-server ./dist
```

## MCP Configuration

Add to your Claude Desktop config (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "pkp-catalog": {
      "command": "pkp-catalog-server",
      "args": ["./path/to/catalog"]
    }
  }
}
```

## Tools

### search_products

Search products with filters.

```typescript
{
  query?: string,        // Search text
  category?: string,     // Filter by category
  brand?: string,        // Filter by brand
  min_price?: number,    // Minimum price
  max_price?: number,    // Maximum price
  limit?: number         // Max results (default: 10)
}
```

### get_product

Get complete product details by SKU.

```typescript
{
  sku: string  // Product SKU
}
```

### compare_products

Compare 2-5 products side by side.

```typescript
{
  skus: string[]  // Array of SKUs to compare
}
```

### list_categories

List all categories in the catalog.

### list_brands

List all brands in the catalog.

### get_catalog_info

Get catalog metadata (name, description, product count).

### get_product_faq

Extract FAQ section from a product.

```typescript
{
  sku: string  // Product SKU
}
```

### get_alternatives

Find alternative products in the same category.

```typescript
{
  sku: string,      // Product SKU
  limit?: number    // Max alternatives (default: 5)
}
```

## Resources

### pkp://catalog

Returns catalog metadata as JSON.

### pkp://product/{sku}

Returns full PRODUCT.md content for a product.

## Example Conversation

```
User: What smartphones do you have?

Claude: Let me search the catalog.
[Calls search_products with category: "celulares/smartphones"]

I found 3 smartphones:
1. Galaxy S25 Ultra - R$ 8,999
2. iPhone 16 Pro Max - R$ 12,499
3. Pixel 9 Pro XL - R$ 7,999

User: Compare the Galaxy and iPhone

Claude: [Calls compare_products with skus: ["galaxy-s25-ultra", "iphone-16-pro-max"]]

Here's a comparison:
| Feature | Galaxy S25 Ultra | iPhone 16 Pro Max |
|---------|-----------------|-------------------|
| Display | 6.9" AMOLED | 6.9" OLED |
| Camera | 200MP | 48MP |
| Price | R$ 8,999 | R$ 12,499 |
...
```
