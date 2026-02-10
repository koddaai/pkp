# pkp publish

Publish a PKP catalog to a target directory for deployment.

## Usage

```bash
pkp publish <target> [options]
```

## Arguments

| Argument | Description |
|----------|-------------|
| `target` | Destination directory for published files |

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `-s, --source <dir>` | Source directory (build output) | `./dist` |
| `-v, --verbose` | Show detailed output | `false` |
| `-n, --dry-run` | Preview without copying files | `false` |

## Examples

```bash
# Publish to local directory
pkp publish /var/www/pkp

# Specify source directory
pkp publish /var/www/pkp --source ./build

# Preview what would be published
pkp publish /var/www/pkp --dry-run

# Verbose output
pkp publish /var/www/pkp --verbose
```

## Output

```
🚀 Publishing PKP catalog...

Catalog: My Store
Products: 25
Source: ./dist

Target: /var/www/pkp
Files: 52 (156.2 KB)

📦 Publishing...

✓ Published 52 files to /var/www/pkp

📝 Next steps:

  1. Configure your web server to serve /var/www/pkp
  2. Verify at https://your-domain/.well-known/pkp/catalog.json
  3. Test with pkp serve /var/www/pkp locally

✨ Publish complete!
```

## Dry Run

Use `--dry-run` to preview what would be published:

```bash
pkp publish /var/www/pkp --dry-run
```

```
🚀 Publishing PKP catalog...

Catalog: My Store
Products: 25
Source: ./dist

Target: /var/www/pkp
Files: 52 (156.2 KB)

[DRY RUN] Would copy files to: /var/www/pkp
  Run without --dry-run to actually publish.
```

## Workflow

The typical workflow is:

```bash
# 1. Build the catalog
pkp build ./my-catalog --output ./dist

# 2. Preview the publish
pkp publish /var/www/pkp --dry-run

# 3. Actually publish
pkp publish /var/www/pkp
```

## Directory Structure

After publishing, the target directory will contain:

```
/var/www/pkp/
├── .well-known/
│   └── pkp/
│       ├── catalog.json    # Product index
│       └── products/
│           ├── product-1.md
│           ├── product-2.md
│           └── ...
└── pkp.txt                 # Discovery file
```

## Web Server Configuration

### Nginx

```nginx
server {
    listen 80;
    server_name example.com;
    root /var/www/pkp;

    location /.well-known/pkp/ {
        default_type application/json;
        add_header Access-Control-Allow-Origin *;
    }

    location ~ \.md$ {
        default_type text/markdown;
        add_header Access-Control-Allow-Origin *;
    }
}
```

### Apache

```apache
<Directory /var/www/pkp>
    Header set Access-Control-Allow-Origin "*"
</Directory>

<FilesMatch "\.md$">
    ForceType text/markdown
</FilesMatch>
```

## Use Cases

- **Production deployment**: Copy built catalog to web server
- **Staging environments**: Deploy to test servers
- **Static hosting**: Prepare files for CDN upload
- **Local testing**: Copy to a local web server directory

## Future Enhancements

Future versions may support additional deployment targets:

- `pkp publish s3://bucket/path` - Amazon S3
- `pkp publish gh-pages` - GitHub Pages
- `pkp publish rsync://server/path` - rsync
