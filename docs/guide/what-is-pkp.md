# What is PKP?

PKP (Product Knowledge Protocol) is an **open standard** for representing product knowledge in a way that AI agents can easily consume, compare, and reason about.

## The Problem

Today's e-commerce data is:
- **Scattered** across different platforms and formats
- **Inconsistent** in structure and terminology
- **Hard to compare** across categories and brands
- **Difficult for AI** to reliably parse and understand

## The Solution

PKP provides:

1. **Standardized Format** - PRODUCT.md files with YAML frontmatter
2. **Category Schemas** - Consistent specs per product category
3. **Confidence Metadata** - Source attribution and verification
4. **Web-native Distribution** - Data lives at `/.well-known/pkp/`

## Architecture Overview

```
Layer 0 - Static Files (on vendor domains)
├── /.well-known/pkp/catalog.json   → Product index
├── /.well-known/pkp/products/*.md  → PRODUCT.md files
└── Access: HTTP GET, zero cost

Layer 1 - Catalog MCP Server
├── Serves local PKP catalog via MCP
├── Tools: search, compare, filter
└── For: Single catalog access

Layer 2 - Registry MCP Server
├── Indexes multiple PKP catalogs
├── Cross-domain product search
└── For: Global product discovery
```

## Key Concepts

### PRODUCT.md

Each product is described in a Markdown file with YAML frontmatter:

```yaml
---
schema: pkp/1.0
sku: "macbook-air-m4"
brand: "Apple"
name: "MacBook Air M4"
category: "notebooks"
summary: "Ultra-thin laptop with M4 chip"

specs:
  screen_size: 13.6
  processor: "Apple M4"
  ram_gb: 16
  storage_gb: 512
---

## Overview
The MacBook Air M4 is Apple's thinnest laptop...
```

### Category Schemas

Each category has defined specs that enable comparison:

| Category | Key Specs |
|----------|-----------|
| `smartphones` | display_size, processor, ram_gb, camera_mp |
| `notebooks` | screen_size, processor, ram_gb, gpu |
| `tvs` | screen_size, resolution, panel_type |

### Confidence Levels

Data sources are ranked by reliability:

1. `manufacturer` - Official vendor data
2. `retailer-feed` - Authorized retailer feeds
3. `community` - User-contributed data
4. `ai-generated` - AI-extracted data
5. `scraped` - Web-scraped data

## Use Cases

- **AI Shopping Assistants** - Compare products intelligently
- **Product Catalogs** - Structured data for e-commerce
- **Price Comparison** - Aggregate prices across retailers
- **Review Aggregation** - Consolidate product reviews
