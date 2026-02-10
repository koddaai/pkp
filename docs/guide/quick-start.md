# Quick Start

Build a complete product catalog in 5 minutes.

## Setup

```bash
# Install CLI
npm install -g pkp

# Create catalog
pkp init electronics-store
cd electronics-store
```

## Add Products

Create `products/iphone-16-pro.md`:

```yaml
---
schema: pkp/1.0
sku: "iphone-16-pro-256"
gtin: "194253766476"
brand: "Apple"
name: "iPhone 16 Pro 256GB"
category: "celulares/smartphones"
summary: "Pro smartphone with A18 Pro chip and titanium design"

identifiers:
  manufacturer_sku: "MYM83LL/A"
  ean: "194253766476"

price:
  type: msrp
  currency: USD
  value: 999
  source: manufacturer
  updated_at: "2025-01-15"

availability: in-stock

specs:
  display_size: 6.3
  display_type: "Super Retina XDR OLED"
  display_resolution: "2622x1206"
  refresh_rate_hz: 120
  processor: "Apple A18 Pro"
  ram_gb: 8
  storage_gb: 256
  main_camera_mp: 48
  front_camera_mp: 12
  battery_mah: 3582
  fast_charging_w: 27
  wireless_charging: true
  water_resistance: "IP68"
  os: "iOS 18"
  5g: true
  weight_g: 199
  colors: ["Black Titanium", "White Titanium", "Natural Titanium", "Desert Titanium"]

confidence:
  specs:
    source: manufacturer
    verified_at: "2025-01-15"

highlights:
  - "A18 Pro chip with 6-core GPU"
  - "48MP Fusion camera with 5x optical zoom"
  - "Titanium design with Ceramic Shield"
  - "Action button for quick access"

tags:
  - "flagship"
  - "5g"
  - "pro-camera"
---

## Overview

The iPhone 16 Pro features Apple's most advanced chip, the A18 Pro,
delivering exceptional performance for gaming, photo editing, and AI tasks.

## Key Features

- **A18 Pro Chip**: 6-core CPU and 6-core GPU for pro-level performance
- **Pro Camera System**: 48MP main + 48MP ultra-wide + 12MP telephoto with 5x zoom
- **Titanium Design**: Grade 5 titanium with Ceramic Shield front
- **All-day Battery**: Up to 27 hours of video playback

## Specifications

| Spec | Value |
|------|-------|
| Display | 6.3" Super Retina XDR OLED |
| Resolution | 2622 x 1206 pixels |
| Processor | Apple A18 Pro |
| RAM | 8GB |
| Storage | 256GB |

## FAQ

### Does it support wireless charging?
Yes, it supports MagSafe (15W) and Qi2 wireless charging.

### Is it water resistant?
Yes, IP68 rated for up to 6 meters for 30 minutes.

### What colors are available?
Black Titanium, White Titanium, Natural Titanium, and Desert Titanium.
```

## Build and Deploy

```bash
# Validate
pkp validate .

# Build
pkp build .

# Preview
pkp serve dist
```

## AI Generation (Optional)

Generate products automatically from URLs:

```bash
# Set API key
export ANTHROPIC_API_KEY=sk-ant-...

# Generate from URL
pkp generate -u https://apple.com/iphone-16-pro -c celulares/smartphones

# Batch generate
pkp generate --file urls.txt -c celulares/smartphones -n 5
```

## Deploy to Your Server

Copy the `dist/.well-known/pkp/` directory to your web server.

Your products will be available at:
- `https://yourdomain.com/.well-known/pkp/catalog.json`
- `https://yourdomain.com/.well-known/pkp/products/iphone-16-pro-256.md`
