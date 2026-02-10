# Schema Reference

Complete reference for the PKP PRODUCT.md schema.

## Schema Version

```yaml
schema: pkp/1.0
```

All PRODUCT.md files must declare the schema version.

## Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `schema` | string | Must be `pkp/1.0` |
| `sku` | string | Unique product identifier |
| `brand` | string | Brand/manufacturer name |
| `name` | string | Product name |
| `category` | string | Product category (see [Categories](/reference/categories)) |

## Optional Fields

### Basic Information

| Field | Type | Description |
|-------|------|-------------|
| `summary` | string | Brief description for AI discovery (max 200 chars) |
| `description` | string | Longer product description |
| `status` | string | `active`, `discontinued`, `upcoming` |

### Identifiers

```yaml
identifiers:
  manufacturer_sku: "SM-S928BZKQZTO"
  ean: "1234567890123"
  upc: "012345678901"
  asin: "B0XXXXXX"
  gtin: "01234567890123"
```

### Canonical URLs

```yaml
canonical:
  manufacturer_url: "https://samsung.com/galaxy-s25-ultra"
  support_url: "https://samsung.com/support/galaxy-s25-ultra"
```

### Price

```yaml
price:
  type: msrp          # msrp | promotional | starting_at
  currency: BRL       # ISO 4217 currency code
  value: 9499.00
  valid_until: "2025-03-01"  # Optional expiration
```

### Specs

Category-specific specifications. See [Category Schemas](/reference/categories) for details.

```yaml
specs:
  display_size: 6.9
  processor: "Snapdragon 8 Elite"
  ram_gb: 12
  # ... category-specific fields
```

### Confidence

Data source and verification. See [Confidence Levels](/guide/confidence) for details.

```yaml
confidence:
  specs:
    source: manufacturer    # manufacturer | retailer-feed | community | ai-generated | scraped
    verified_at: "2025-01-15"
```

### Media

```yaml
media:
  images:
    - url: "https://example.com/product-front.jpg"
      alt: "Product front view"
      type: product
    - url: "https://example.com/product-lifestyle.jpg"
      type: lifestyle
  videos:
    - url: "https://youtube.com/watch?v=xxxxx"
      title: "Product Review"
```

### Availability

```yaml
availability:
  in_stock: true
  regions: ["BR", "US", "EU"]
  ships_from: "BR"
```

## Markdown Content

After the YAML frontmatter, include markdown content:

```markdown
---
# YAML frontmatter here
---

## Highlights
- Key feature 1
- Key feature 2

## Specifications
Detailed specs table...

## FAQ
### Common question?
Answer here.
```

### Recommended Sections

| Section | Purpose |
|---------|---------|
| `## Highlights` | Key selling points (bullet list) |
| `## Specifications` | Detailed specs table |
| `## FAQ` | Common questions and answers |
| `## Reviews` | Summary of user reviews |
| `## Comparisons` | How it compares to alternatives |

## Complete Example

```yaml
---
schema: pkp/1.0
sku: "galaxy-s25-ultra"
brand: "Samsung"
name: "Galaxy S25 Ultra"
category: "celulares/smartphones"
summary: "Flagship smartphone with S Pen and 200MP camera"
status: active

identifiers:
  manufacturer_sku: "SM-S938BZKQZTO"
  ean: "7892509123456"

canonical:
  manufacturer_url: "https://samsung.com/br/smartphones/galaxy-s25-ultra"

price:
  type: msrp
  currency: BRL
  value: 9499.00

specs:
  display_size: 6.9
  display_type: "Dynamic AMOLED 2X"
  processor: "Snapdragon 8 Elite"
  ram_gb: 12
  storage_gb: 256
  main_camera_mp: 200
  battery_mah: 5000
  5g: true

confidence:
  specs:
    source: manufacturer
    verified_at: "2025-01-15"
  price:
    source: retailer-feed
    verified_at: "2025-01-20"
---

## Highlights
- 200MP main camera with AI-powered processing
- S Pen with ultra-low latency
- Titanium frame with Gorilla Glass Armor

## FAQ
### Does it support 5G?
Yes, all major 5G bands including mmWave.

### Is the S Pen included?
Yes, built into the device body.
```

## Validation

Validate your PRODUCT.md files:

```bash
pkp validate ./products
```

The validator checks:
- Required fields present
- Valid category
- Category-specific spec validation
- Confidence source validity
- Completeness score
