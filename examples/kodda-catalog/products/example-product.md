---
# === IDENTITY ===
schema: pkp/1.0
sku: "EXAMPLE-001"
brand: "ExampleBrand"
name: "Example Product"
category: "example-category"

# === DISCOVERY (L0) ===
summary: "Brief description of the product for AI agents and search."
tags: ["tag1", "tag2"]
target_audience: ["audience1", "audience2"]

# === PRICE ===
price:
  type: msrp
  currency: BRL
  value: 999.00
  source: manufacturer
  updated_at: "2026-02-09T17:24:00.997Z"

# === CONFIDENCE ===
confidence:
  specs:
    level: medium
    source: ai-generated
    verified_at: "2026-02-09T17:24:00.998Z"

# === SPECS (L1) ===
specs:
  # Add category-specific specs here
  example_field: "example_value"

# === NARRATIVE ===
highlights:
  - "Key feature 1"
  - "Key feature 2"
---

## About This Product

Add detailed product description here. This is the L2 content that AI agents use
for deeper understanding and answering specific questions.

## FAQ

**Common question 1?**
Answer to the question.

**Common question 2?**
Answer to the question.
