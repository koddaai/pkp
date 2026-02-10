import { writeFile, mkdir, copyFile } from "node:fs/promises";
import { join } from "node:path";
import { slugify } from "@pkprotocol/shared";

/**
 * PKP Configuration
 */
export interface PKPConfig {
  publisher: {
    name: string;
    type: "manufacturer" | "retailer" | "aggregator" | "community";
    domain: string;
    contact?: string;
  };
}

/**
 * Product data for generation
 */
export interface ProductData {
  sku: string;
  name: string;
  category: string;
  summary: string;
  price?: {
    type: string;
    currency: string;
    value?: number;
  };
  confidence?: {
    specs?: {
      source: string;
    };
  };
  completeness?: number;
  sourcePath: string;
}

/**
 * Generate .well-known/pkp/ structure from PRODUCT.md files
 */
export async function generateWellKnownPKP(
  products: ProductData[],
  config: PKPConfig,
  outputDir: string
): Promise<void> {
  const pkpDir = join(outputDir, ".well-known", "pkp");
  const productsDir = join(pkpDir, "products");

  // Create directories
  await mkdir(productsDir, { recursive: true });

  // Generate catalog.json
  const catalog = {
    schema: "pkp/1.0" as const,
    type: "catalog" as const,
    publisher: config.publisher,
    categories: [...new Set(products.map((p) => p.category))],
    total_products: products.length,
    updated_at: new Date().toISOString(),
    products: products.map((p) => ({
      sku: p.sku,
      uri: `pkp://${config.publisher.domain}/${p.sku}`,
      name: p.name,
      category: p.category,
      summary: p.summary,
      price: p.price,
      confidence_source: p.confidence?.specs?.source ?? "unknown",
      completeness_score: p.completeness ? p.completeness / 100 : undefined,
      url: `/.well-known/pkp/products/${slugify(p.sku)}.md`,
      updated_at: new Date().toISOString(),
    })),
  };

  await writeFile(join(pkpDir, "catalog.json"), JSON.stringify(catalog, null, 2));

  // Copy PRODUCT.md files
  for (const product of products) {
    const destPath = join(productsDir, `${slugify(product.sku)}.md`);
    await copyFile(product.sourcePath, destPath);
  }

  // Generate pkp.txt
  const pkpTxt = [
    "# PKP (Product Knowledge Protocol)",
    `# ${config.publisher.name}`,
    "# Spec: github.com/koddaai/pkp",
    "",
    "catalog: /.well-known/pkp/catalog.json",
  ].join("\n");

  await writeFile(join(outputDir, "pkp.txt"), pkpTxt);
}
