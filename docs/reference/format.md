# PRODUCT.md Format

The PRODUCT.md format is a Markdown file with YAML frontmatter containing structured product data.

## Basic Structure

```yaml
---
schema: pkp/1.0
sku: "product-sku"
brand: "Brand Name"
name: "Product Name"
category: "category/subcategory"
summary: "Brief description for AI discovery"

# Optional fields...
---

## Overview
Product description in Markdown...

## Key Features
- Feature 1
- Feature 2

## FAQ
### Common question?
Answer...
```

## Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `schema` | string | Always `pkp/1.0` |
| `sku` | string | Unique product identifier |
| `brand` | string | Brand name |
| `name` | string | Product name |
| `category` | string | Product category |

## Optional Fields

### Identifiers

```yaml
gtin: "1234567890123"         # EAN/UPC barcode

identifiers:
  manufacturer_sku: "MFG-123"
  ean: "1234567890123"
  upc: "123456789012"
  asin: "B0XXXXXXXX"
```

### Pricing

```yaml
price:
  type: msrp                   # msrp | street
  currency: USD
  value: 999.99
  source: manufacturer         # manufacturer | retailer | scraped
  updated_at: "2025-01-15"

price_history:
  - value: 1099.99
    date: "2024-12-01"
  - value: 999.99
    date: "2025-01-15"
```

### Availability

```yaml
availability: in-stock        # in-stock | out-of-stock | pre-order | unknown
```

### Specifications

```yaml
specs:
  # Category-specific fields
  display_size: 6.7
  processor: "Snapdragon 8 Gen 3"
  ram_gb: 12
  storage_gb: 256
```

### Confidence

```yaml
confidence:
  specs:
    source: manufacturer      # manufacturer | retailer-feed | community | ai-generated | scraped
    verified_at: "2025-01-15"
    level: 0.95               # Optional: 0-1 confidence score
```

### URLs

```yaml
canonical:
  manufacturer_url: "https://brand.com/product"
  support_url: "https://brand.com/support/product"

purchase_urls:
  - retailer: "Amazon"
    url: "https://amazon.com/dp/..."
    price: 899.99
  - retailer: "Best Buy"
    url: "https://bestbuy.com/..."
    price: 949.99
```

### Reviews

```yaml
reviews:
  count: 1250
  rating: 4.5
  source: "amazon.com"
```

### Metadata

```yaml
summary: "Brief description for AI discovery (max 200 chars)"

highlights:
  - "Key feature 1"
  - "Key feature 2"

target_audience:
  - "Professionals"
  - "Content creators"

use_cases:
  - "Video editing"
  - "Gaming"

tags:
  - "flagship"
  - "5g"
  - "pro"
```

## Markdown Body

The markdown body should include:

1. **Overview** - 2-3 paragraph product description
2. **Key Features** - Bullet list of main features
3. **Specifications** - Detailed specs table
4. **What's in the Box** - Included items
5. **FAQ** - Common questions and answers

## Example

```yaml
---
schema: pkp/1.0
sku: "macbook-air-m4-13"
gtin: "195949185441"
brand: "Apple"
name: "MacBook Air 13\" M4"
category: "notebooks"
summary: "Ultra-thin laptop with M4 chip, 18-hour battery, and fanless design"

identifiers:
  manufacturer_sku: "MC123LL/A"
  ean: "195949185441"

price:
  type: msrp
  currency: USD
  value: 1099
  source: manufacturer
  updated_at: "2025-01-15"

availability: in-stock

specs:
  screen_size: 13.6
  screen_resolution: "2560x1664"
  screen_type: "Liquid Retina"
  processor: "Apple M4"
  processor_cores: 10
  ram_gb: 16
  ram_type: "Unified Memory"
  storage_gb: 256
  storage_type: "SSD"
  gpu: "10-core GPU"
  battery_wh: 52.6
  weight_kg: 1.24
  os: "macOS Sequoia"

confidence:
  specs:
    source: manufacturer
    verified_at: "2025-01-15"

highlights:
  - "M4 chip with 10-core CPU and 10-core GPU"
  - "Up to 18 hours of battery life"
  - "Fanless, silent operation"
  - "1080p FaceTime HD camera"

tags:
  - "ultrabook"
  - "apple-silicon"
  - "fanless"
---

## Overview

The MacBook Air with M4 chip delivers exceptional performance in an
incredibly thin and light design...
```
