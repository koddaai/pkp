# pkp stats

Show statistics for a PKP catalog.

## Usage

```bash
pkp stats [directory] [options]
```

## Arguments

| Argument | Description | Default |
|----------|-------------|---------|
| `directory` | Catalog directory to analyze | `.` |

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `-v, --verbose` | Show detailed stats per file | `false` |
| `-j, --json` | Output as JSON | `false` |

## Examples

```bash
# Analyze current directory
pkp stats

# Analyze specific catalog
pkp stats ./my-catalog

# Verbose output (shows each file)
pkp stats ./products --verbose

# JSON output (for scripting)
pkp stats ./products --json
```

## Output

```
📈 Analyzing PKP catalog...

Found 11 markdown file(s)

📊 Catalog Statistics

Overview:
  Total products:    11
  Valid:             11
  With price:        11 (100%)
  With images:       0 (0%)

Categories:
  celulares/smartphones     █████░░░░░░░░░░░░░░░ 3 (27%)
  moda                      ████░░░░░░░░░░░░░░░░ 2 (18%)
  notebooks                 ████░░░░░░░░░░░░░░░░ 2 (18%)
  eletrodomesticos          ██░░░░░░░░░░░░░░░░░░ 1 (9%)
  games                     ██░░░░░░░░░░░░░░░░░░ 1 (9%)
  tvs                       ██░░░░░░░░░░░░░░░░░░ 1 (9%)

Completeness:
  Average:           85%
  Min:               62%
  Max:               100%

  Distribution:
    0-25%      ░░░░░░░░░░░░░░░░░░░░ 0 (0%)
    26-50%     ░░░░░░░░░░░░░░░░░░░░ 0 (0%)
    51-75%     ████░░░░░░░░░░░░░░░░ 2 (18%)
    76-100%    ████████████████░░░░ 9 (82%)

Confidence Sources:
  manufacturer           6 (55%)
  ai-generated           3 (27%)
  scraped                2 (18%)

✨ Analysis complete!
```

## JSON Output

With `--json`, outputs structured data:

```json
{
  "totalProducts": 11,
  "validProducts": 11,
  "invalidProducts": 0,
  "categories": {
    "celulares/smartphones": 3,
    "moda": 2,
    "notebooks": 2
  },
  "completeness": {
    "average": 85,
    "min": 62,
    "max": 100,
    "distribution": {
      "0-25%": 0,
      "26-50%": 0,
      "51-75%": 2,
      "76-100%": 9
    }
  },
  "confidence": {
    "manufacturer": 6,
    "ai-generated": 3,
    "scraped": 2
  },
  "withPrice": 11,
  "withImages": 0
}
```

## Use Cases

- **Catalog auditing**: Check overall health of your product data
- **CI/CD pipelines**: Monitor completeness metrics over time
- **Data quality**: Identify products needing improvement
- **Reporting**: Generate statistics for stakeholders
