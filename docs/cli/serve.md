# pkp serve

Serve PKP catalog locally for testing.

## Usage

```bash
pkp serve [directory] [options]
```

## Arguments

| Argument | Description | Default |
|----------|-------------|---------|
| `directory` | Directory to serve | Current directory |

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `-p, --port <port>` | Port to serve on | `3000` |
| `-h, --host <host>` | Host to bind to | `localhost` |

## Examples

```bash
# Serve dist directory
pkp serve ./dist

# Custom port
pkp serve ./dist --port 8080

# Bind to all interfaces
pkp serve ./dist --host 0.0.0.0
```

## Output

```
🚀 PKP Catalog Server

  Serving: ./dist
  URL: http://localhost:3000

  Endpoints:
    GET /.well-known/pkp/catalog.json
    GET /.well-known/pkp/products/:sku.md

  Press Ctrl+C to stop
```

## Testing

Once running, you can test with:

```bash
# Get catalog
curl http://localhost:3000/.well-known/pkp/catalog.json

# Get product
curl http://localhost:3000/.well-known/pkp/products/my-product.md
```
