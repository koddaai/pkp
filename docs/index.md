---
layout: home

hero:
  name: "PKP"
  text: "Product Knowledge Protocol"
  tagline: Open standard for AI agent product knowledge
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/kodda-ai/pkp

features:
  - title: Web-native
    details: Data lives in /.well-known/pkp/ on vendor domains. No central database required.
  - title: Agent-first
    details: Designed for AI agents to discover, compare, and recommend products intelligently.
  - title: Explicit Confidence
    details: Every data block has source attribution and verification timestamps.
  - title: Comparable by Design
    details: Category-specific schemas ensure products can be meaningfully compared.
---

## What is PKP?

PKP (Product Knowledge Protocol) is an **open format + category schemas** for representing product knowledge in a way that any AI agent can consume.

It's the missing layer in the agentic commerce stack - solving "what to buy and why" before payment (AP2) and transaction (UCP) protocols.

```yaml
# Example PRODUCT.md
---
schema: pkp/1.0
sku: "galaxy-s25-ultra"
brand: "Samsung"
name: "Galaxy S25 Ultra"
category: "celulares/smartphones"
summary: "Flagship smartphone with S Pen and 200MP camera"

specs:
  display_size: 6.9
  processor: "Snapdragon 8 Elite"
  ram_gb: 12
  storage_gb: 256
  main_camera_mp: 200
  battery_mah: 5000

confidence:
  specs:
    source: manufacturer
    verified_at: "2025-01-15"
---

## Overview
The Galaxy S25 Ultra is Samsung's most advanced smartphone...
```

## Quick Install

```bash
# Install the CLI
npm install -g pkp

# Initialize a new catalog
pkp init my-catalog

# Build for deployment
pkp build my-catalog
```

## Packages

| Package | Description |
|---------|-------------|
| `pkp` | CLI for validating, building, and generating product data |
| `@pkprotocol/spec` | Schemas, parser, and validator |
| `@pkprotocol/catalog-server` | MCP server for serving catalog data |
| `@pkprotocol/registry-server` | Central discovery and indexing service |
| `@pkprotocol/skills` | AI prompts for product assistants |
