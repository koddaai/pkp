# Confidence Levels

PKP uses confidence levels to indicate the reliability of product data. Every data block can have source attribution and verification timestamps.

## Why Confidence Matters

In the world of product data:
- Manufacturer specs are authoritative
- Retailer data may be outdated or incomplete
- AI-generated data needs verification
- Scraped data may contain errors

PKP makes this explicit so AI agents can make informed decisions.

## Confidence Sources

| Level | Source | Description | Trust |
|-------|--------|-------------|-------|
| 1 | `manufacturer` | Official manufacturer data | Highest |
| 2 | `retailer-feed` | Authorized retailer feeds | High |
| 3 | `community` | User contributions | Medium |
| 4 | `ai-generated` | AI-extracted data | Low |
| 5 | `scraped` | Web-scraped data | Lowest |

## PRODUCT.md Format

```yaml
confidence:
  specs:
    source: manufacturer
    verified_at: "2025-01-15"
  price:
    source: retailer-feed
    verified_at: "2025-01-20"
  summary:
    source: ai-generated
    verified_at: "2025-01-18"
```

## Field-Level Confidence

You can specify confidence for individual fields or groups:

```yaml
confidence:
  # Group confidence
  specs:
    source: manufacturer
    verified_at: "2025-01-15"

  # Individual field confidence
  price:
    source: retailer-feed
    verified_at: "2025-01-20"
```

## Precedence Rules

When merging data from multiple sources, higher confidence wins:

```
manufacturer > retailer-feed > community > ai-generated > scraped
```

### Example Conflict Resolution

If manufacturer says RAM is 12GB but a scraped source says 16GB, the 12GB value is used because `manufacturer` has higher confidence.

## Best Practices

### For Data Publishers

1. **Always include source**: Be transparent about where data comes from
2. **Update verified_at**: Keep timestamps current when you verify data
3. **Use appropriate level**: Don't claim `manufacturer` for scraped data

### For AI Agents

1. **Check confidence before recommending**: High-stakes decisions need high-confidence data
2. **Warn users about low confidence**: "Note: This spec was AI-generated and may need verification"
3. **Prefer manufacturer data**: When available, prioritize authoritative sources

## API Response

When using MCP servers, confidence is included in product responses:

```json
{
  "sku": "galaxy-s25-ultra",
  "specs": {
    "ram_gb": 12,
    "storage_gb": 256
  },
  "confidence": {
    "specs": {
      "source": "manufacturer",
      "verified_at": "2025-01-15"
    }
  }
}
```

## Validation

The PKP validator checks:
- Valid confidence source values
- ISO 8601 date format for `verified_at`
- Consistency between confidence blocks and data fields

```bash
pkp validate ./products
# Will warn if confidence sources are invalid
```
