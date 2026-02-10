# PRODUCT.md Format

See the [Format Reference](/reference/format) for complete documentation of the PRODUCT.md format.

## Quick Reference

```yaml
---
schema: pkp/1.0           # Required: always pkp/1.0
sku: "product-sku"        # Required: unique identifier
brand: "Brand Name"       # Required: brand name
name: "Product Name"      # Required: product name
category: "category"      # Required: product category
summary: "Brief desc"     # Recommended: for AI discovery

specs:
  # Category-specific fields

price:
  type: msrp
  currency: USD
  value: 999.99

confidence:
  specs:
    source: manufacturer
    verified_at: "2025-01-15"
---

## Overview
Product description...

## FAQ
### Question?
Answer.
```
