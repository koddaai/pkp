# pkp generate

Generate PRODUCT.md files from URLs using AI.

## Usage

```bash
# Single URL
pkp generate -u <url> -c <category>

# Batch mode
pkp generate --file <urls.txt> -c <category>
```

## Options

| Option | Description |
|--------|-------------|
| `-u, --url <url>` | Product page URL |
| `-c, --category <cat>` | Product category |
| `-b, --brand <brand>` | Brand name (optional) |
| `-o, --output <file>` | Output file path |
| `-f, --file <file>` | Batch file with URLs |
| `-d, --output-dir <dir>` | Output directory for batch (default: ./generated) |
| `-n, --concurrency <n>` | Parallel requests (default: 3) |
| `-v, --verbose` | Show detailed output |

## Prerequisites

Set your Anthropic API key:

```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

## Examples

### Single Product

```bash
pkp generate \
  -u https://samsung.com/galaxy-s25-ultra \
  -c celulares/smartphones \
  -b Samsung \
  -o galaxy-s25-ultra.md
```

### Batch Generation

Create a file `urls.txt`:

```
# Notebooks
https://apple.com/macbook-air,notebooks,Apple
https://dell.com/xps-15,notebooks,Dell

# Smartphones
https://samsung.com/galaxy-s25,celulares/smartphones,Samsung
```

Generate all products:

```bash
pkp generate \
  --file urls.txt \
  --output-dir ./products \
  --concurrency 5
```

## Categories

| Category | Description |
|----------|-------------|
| `celulares/smartphones` | Mobile phones |
| `notebooks` | Laptops and notebooks |
| `tvs` | Televisions |
| `eletrodomesticos` | Home appliances |
| `moda` | Fashion and clothing |
| `games` | Gaming consoles and accessories |

## Output

The generated PRODUCT.md includes:
- YAML frontmatter with all available specs
- Category-specific fields
- Product overview and key features
- FAQ section
- Confidence marked as `ai-generated`

## Batch Report

After batch generation, you'll see a summary:

```
📊 Batch Generation Summary

  Total: 10
  Success: 8
  Failed: 2
  Avg Completeness: 75%

✓ Generated files:
  - products/galaxy-s25-ultra.md
  - products/iphone-16-pro.md
  ...

✗ Failed URLs:
  - https://example.com/unavailable
    Error: Failed to fetch URL: 404 Not Found
```
