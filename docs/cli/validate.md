# pkp validate

Validate PRODUCT.md files against the PKP specification.

## Usage

```bash
pkp validate <path> [options]
```

## Arguments

| Argument | Description |
|----------|-------------|
| `path` | File or directory to validate |

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `-v, --verbose` | Show detailed validation info | `false` |
| `-s, --strict` | Exit with error if any warnings | `false` |

## Examples

```bash
# Validate single file
pkp validate products/iphone.md

# Validate directory
pkp validate ./products

# Verbose output
pkp validate . --verbose

# Strict mode (fail on warnings)
pkp validate . --strict
```

## Validation Checks

- Required fields (sku, brand, name, category)
- Valid YAML frontmatter
- Category-specific spec validation
- Completeness score calculation
- Price format validation
- Date format validation

## Output

```
Validating 5 files...

✓ products/iphone-16-pro.md (85% complete)
✓ products/galaxy-s25.md (78% complete)
⚠ products/pixel-9.md (62% complete) - missing: battery_mah, weight_g
✗ products/invalid.md - missing required field: brand

Summary:
  Valid: 3
  Warnings: 1
  Errors: 1
```
