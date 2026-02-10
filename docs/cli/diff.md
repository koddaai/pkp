# pkp diff

Compare two PRODUCT.md files and show differences.

## Usage

```bash
pkp diff <file1> <file2> [options]
```

## Arguments

| Argument | Description |
|----------|-------------|
| `file1` | First PRODUCT.md file (base) |
| `file2` | Second PRODUCT.md file (compare) |

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `-v, --verbose` | Show detailed diff output | `false` |
| `-j, --json` | Output as JSON | `false` |

## Examples

```bash
# Compare two products
pkp diff products/iphone-v1.md products/iphone-v2.md

# Verbose output (shows old/new values on separate lines)
pkp diff old.md new.md --verbose

# JSON output (for scripting)
pkp diff old.md new.md --json
```

## Output

```
🔍 Comparing PRODUCT.md files...

📋 Product Diff

Files:
  - products/iphone-v1.md (iphone-16-pro-256gb)
  + products/iphone-v2.md (iphone-16-pro-256gb)

Completeness: 85% → 92% (+7%)

Changes: (8 fields)

  Modified:
    price.value
      4999 → 4799
    specs.storage.base_gb
      128 → 256
    summary
      "Old description..." → "New description..."

  Added:
    + specs.camera.ois: true
    + specs.battery.wireless_charge_watts: 15

  Removed:
    - specs.display.notch: true

Summary:
  +2 added, ~3 changed, -1 removed
```

## JSON Output

With `--json`, outputs structured data:

```json
{
  "file1": "/path/to/old.md",
  "file2": "/path/to/new.md",
  "sku1": "iphone-16-pro-256gb",
  "sku2": "iphone-16-pro-256gb",
  "completeness1": 85,
  "completeness2": 92,
  "diffs": [
    {
      "field": "price.value",
      "type": "changed",
      "oldValue": 4999,
      "newValue": 4799
    },
    {
      "field": "specs.camera.ois",
      "type": "added",
      "newValue": true
    },
    {
      "field": "specs.display.notch",
      "type": "removed",
      "oldValue": true
    }
  ]
}
```

## Diff Types

| Type | Description |
|------|-------------|
| `added` | Field exists only in file2 |
| `removed` | Field exists only in file1 |
| `changed` | Field exists in both but values differ |

## Use Cases

- **Version tracking**: Compare product versions before/after updates
- **Quality assurance**: Verify expected changes in product data
- **Merge review**: Review differences before accepting updates
- **Debugging**: Find unexpected changes in product files
- **CI/CD**: Automated diff checking in pipelines

## Comparing Different Products

You can also compare different products to see specification differences:

```bash
# Compare iPhone vs Galaxy
pkp diff products/iphone.md products/galaxy.md

# Output shows all differing fields between products
```

This is useful for:
- Understanding competitive differences
- Validating data consistency across similar products
- Building comparison features
