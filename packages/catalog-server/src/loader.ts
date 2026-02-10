/**
 * Catalog Loader
 *
 * Loads catalog.json and PRODUCT.md files from a directory
 */

import { readFile, readdir, stat } from "node:fs/promises";
import { join, extname } from "node:path";
import { PKPCatalog, parseProductMd, PKPProductBase } from "@pkprotocol/spec";
import type { PKPCatalogProduct } from "@pkprotocol/spec";
import type { LoadedCatalog, LoadedProduct } from "./types.js";

/**
 * Load catalog.json from a directory
 */
async function loadCatalogJson(catalogPath: string): Promise<PKPCatalog> {
  const content = await readFile(catalogPath, "utf-8");
  const data = JSON.parse(content);

  // Validate with Zod
  const result = PKPCatalog.safeParse(data);
  if (!result.success) {
    throw new Error(`Invalid catalog.json: ${result.error.message}`);
  }

  return result.data;
}

/**
 * Find all .md files in a directory recursively
 */
async function findMarkdownFiles(dir: string): Promise<string[]> {
  const files: string[] = [];

  async function scan(currentDir: string): Promise<void> {
    try {
      const entries = await readdir(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(currentDir, entry.name);

        if (entry.isDirectory()) {
          await scan(fullPath);
        } else if (entry.isFile() && extname(entry.name) === ".md") {
          files.push(fullPath);
        }
      }
    } catch {
      // Directory doesn't exist or can't be read
    }
  }

  await scan(dir);
  return files;
}

/**
 * Load a full catalog from a directory
 *
 * The directory should contain:
 * - .well-known/pkp/catalog.json
 * - .well-known/pkp/products/*.md
 *
 * OR source PRODUCT.md files in any structure
 */
export async function loadCatalog(sourceDir: string): Promise<LoadedCatalog> {
  const products = new Map<string, LoadedProduct>();
  const byCategory = new Map<string, LoadedProduct[]>();

  // Try to load from .well-known structure first
  const wellKnownCatalogPath = join(
    sourceDir,
    ".well-known",
    "pkp",
    "catalog.json"
  );
  const wellKnownProductsDir = join(sourceDir, ".well-known", "pkp", "products");

  let catalog: PKPCatalog;
  let productFiles: string[] = [];

  try {
    await stat(wellKnownCatalogPath);
    catalog = await loadCatalogJson(wellKnownCatalogPath);
    productFiles = await findMarkdownFiles(wellKnownProductsDir);
  } catch {
    // No .well-known structure, try root catalog.json
    const rootCatalogPath = join(sourceDir, "catalog.json");
    try {
      await stat(rootCatalogPath);
      catalog = await loadCatalogJson(rootCatalogPath);
      // Look for products in current directory
      productFiles = await findMarkdownFiles(sourceDir);
    } catch {
      throw new Error(
        `No catalog.json found in ${sourceDir} or ${wellKnownCatalogPath}`
      );
    }
  }

  // Build SKU to entry map from catalog
  const skuToEntry = new Map<string, PKPCatalogProduct>();
  if (catalog.products) {
    for (const entry of catalog.products) {
      skuToEntry.set(entry.sku.toLowerCase(), entry);
    }
  }

  // Load each product file
  for (const filePath of productFiles) {
    try {
      const raw = await readFile(filePath, "utf-8");
      const parsed = parseProductMd(raw);

      // Get SKU from frontmatter
      const sku = parsed.frontmatter.sku as string;
      if (!sku) {
        console.warn(`Skipping ${filePath}: no SKU in frontmatter`);
        continue;
      }

      // Find catalog entry
      let entry = skuToEntry.get(sku.toLowerCase());
      if (!entry) {
        // Create a minimal entry
        entry = {
          sku,
          name: parsed.frontmatter.name as string,
          category: parsed.frontmatter.category as string,
          summary: (parsed.frontmatter.summary as string) || "",
          url: filePath,
        };
      }

      // Parse full product
      const result = PKPProductBase.safeParse(parsed.frontmatter);
      if (!result.success) {
        console.warn(`Skipping ${filePath}: ${result.error.message}`);
        continue;
      }

      const loadedProduct: LoadedProduct = {
        entry,
        product: result.data,
        content: parsed.content,
        raw,
      };

      products.set(sku.toLowerCase(), loadedProduct);

      // Index by category
      const category = result.data.category;
      if (!byCategory.has(category)) {
        byCategory.set(category, []);
      }
      byCategory.get(category)!.push(loadedProduct);
    } catch (error) {
      console.warn(
        `Error loading ${filePath}: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  return {
    catalog,
    products,
    byCategory,
    sourceDir,
  };
}

/**
 * Reload a catalog (for watch mode)
 */
export async function reloadCatalog(
  currentCatalog: LoadedCatalog
): Promise<LoadedCatalog> {
  return loadCatalog(currentCatalog.sourceDir);
}
