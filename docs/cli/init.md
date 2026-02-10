# pkp init

Initialize a new PKP catalog.

## Usage

```bash
pkp init [directory]
```

## Arguments

| Argument | Description | Default |
|----------|-------------|---------|
| `directory` | Directory to initialize | Current directory |

## What it Creates

```
my-catalog/
├── pkp.config.json    # Catalog configuration
├── products/          # Product files directory
│   └── example.md     # Example PRODUCT.md
└── README.md          # Catalog documentation
```

## Example

```bash
# Initialize in new directory
pkp init my-store

# Initialize in current directory
pkp init .
```

## Configuration File

The generated `pkp.config.json`:

```json
{
  "name": "My Catalog",
  "description": "PKP Product Catalog",
  "domain": "example.com",
  "productsDir": "products",
  "outputDir": "dist"
}
```
