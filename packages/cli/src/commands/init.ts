import { writeFile, mkdir, access } from "node:fs/promises";
import { join } from "node:path";
import chalk from "chalk";

/**
 * Default pkp.config.yml content
 */
const DEFAULT_CONFIG = `# PKP Catalog Configuration
# See: https://github.com/koddaai/pkp

schema: pkp/1.0

publisher:
  name: "Your Company Name"
  type: community  # manufacturer | retailer | aggregator | community
  domain: "example.com"
  contact: "contact@example.com"

# Source directories for PRODUCT.md files
sources:
  - "./products"

# Output directory for .well-known/pkp/
output: "./dist"

# Categories in this catalog
categories:
  - "celulares/smartphones"
  - "notebooks"
`;

/**
 * Default PRODUCT.md template
 */
const PRODUCT_TEMPLATE = `---
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
  updated_at: "${new Date().toISOString()}"

# === CONFIDENCE ===
confidence:
  specs:
    level: medium
    source: ai-generated
    verified_at: "${new Date().toISOString()}"

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
`;

/**
 * Initialize a new PKP catalog
 */
export async function initCommand(directory: string = "."): Promise<void> {
  const targetDir = join(process.cwd(), directory);
  const configPath = join(targetDir, "pkp.config.yml");
  const productsDir = join(targetDir, "products");
  const exampleProduct = join(productsDir, "example-product.md");

  console.log(chalk.blue("\n📦 Initializing PKP catalog...\n"));

  // Create target directory if it doesn't exist
  try {
    await mkdir(targetDir, { recursive: true });
  } catch {
    // Directory might already exist
  }

  // Check if config already exists
  try {
    await access(configPath);
    console.log(chalk.yellow("⚠️  pkp.config.yml already exists. Skipping...\n"));
  } catch {
    // Create config file
    await writeFile(configPath, DEFAULT_CONFIG);
    console.log(chalk.green("✓ Created pkp.config.yml"));
  }

  // Create products directory
  try {
    await mkdir(productsDir, { recursive: true });
    console.log(chalk.green("✓ Created products/ directory"));
  } catch {
    // Directory might already exist
  }

  // Create example product
  try {
    await access(exampleProduct);
    console.log(chalk.yellow("⚠️  Example product already exists. Skipping..."));
  } catch {
    await writeFile(exampleProduct, PRODUCT_TEMPLATE);
    console.log(chalk.green("✓ Created products/example-product.md"));
  }

  console.log(chalk.blue("\n📝 Next steps:\n"));
  console.log("  1. Edit " + chalk.cyan("pkp.config.yml") + " with your publisher info");
  console.log("  2. Add PRODUCT.md files to " + chalk.cyan("products/"));
  console.log("  3. Run " + chalk.cyan("pkp validate products/") + " to check your files");
  console.log("  4. Run " + chalk.cyan("pkp build") + " to generate .well-known/pkp/");
  console.log("  5. Run " + chalk.cyan("pkp serve") + " to test locally\n");

  console.log(chalk.green("✨ PKP catalog initialized successfully!\n"));
}
