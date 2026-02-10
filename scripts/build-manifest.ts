#!/usr/bin/env npx ts-node
/**
 * Build catalog manifest for fast Studio loading
 *
 * Usage:
 *   npx tsx scripts/build-manifest.ts --catalog ./examples/kodda-catalog
 */

import { writeFileSync, readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, dirname } from 'path';

interface ProductSummary {
  sku: string;
  name: string;
  brand?: string;
  category: string;
  subcategory?: string;
  price?: { value: number; currency: string };
  retailer?: string;
  path: string;
}

interface CatalogManifest {
  version: '1.0';
  generated_at: string;
  stats: {
    total_products: number;
    categories: Record<string, number>;
    brands: Record<string, number>;
    retailers: Record<string, number>;
    price_range: { min: number; max: number };
  };
  products: ProductSummary[];
}

function parseYamlFrontmatter(content: string): Record<string, unknown> | null {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;

  const yaml = match[1];
  const result: Record<string, unknown> = {};

  // Simple YAML parsing for flat values
  const lines = yaml.split('\n');
  let currentKey = '';
  let inObject = false;
  let objectKey = '';
  let objectValue: Record<string, unknown> = {};

  for (const line of lines) {
    // Skip comments and empty lines
    if (line.trim().startsWith('#') || !line.trim()) continue;

    // Check for nested object start
    const objectMatch = line.match(/^(\w+):\s*$/);
    if (objectMatch) {
      if (inObject && objectKey) {
        result[objectKey] = objectValue;
      }
      objectKey = objectMatch[1];
      objectValue = {};
      inObject = true;
      continue;
    }

    // Check for nested property
    const nestedMatch = line.match(/^\s+(\w+):\s*(.+)?$/);
    if (nestedMatch && inObject) {
      const [, key, rawValue] = nestedMatch;
      if (rawValue) {
        objectValue[key] = parseValue(rawValue);
      }
      continue;
    }

    // Check for top-level property
    const propMatch = line.match(/^(\w+):\s*(.+)$/);
    if (propMatch) {
      if (inObject && objectKey) {
        result[objectKey] = objectValue;
        inObject = false;
        objectKey = '';
        objectValue = {};
      }
      const [, key, rawValue] = propMatch;
      result[key] = parseValue(rawValue);
    }
  }

  // Save last object
  if (inObject && objectKey) {
    result[objectKey] = objectValue;
  }

  return result;
}

function parseValue(raw: string): unknown {
  const trimmed = raw.trim();

  // Remove quotes
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }

  // Boolean
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;

  // Number
  const num = Number(trimmed);
  if (!isNaN(num)) return num;

  // Array (simple)
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    return trimmed.slice(1, -1).split(',').map(s => parseValue(s.trim()));
  }

  return trimmed;
}

function scanProducts(dir: string): ProductSummary[] {
  const products: ProductSummary[] = [];

  function scan(currentDir: string) {
    const entries = readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(currentDir, entry.name);

      if (entry.isDirectory()) {
        if (!entry.name.startsWith('.') && entry.name !== 'node_modules' && entry.name !== 'dist') {
          scan(fullPath);
        }
      } else if (entry.name.endsWith('.md') && entry.name !== 'README.md') {
        try {
          const content = readFileSync(fullPath, 'utf-8');
          const fm = parseYamlFrontmatter(content);

          if (fm?.sku) {
            const price = fm.price as { value?: number; currency?: string } | undefined;
            const purchaseUrls = fm.purchase_urls as Array<{ retailer?: string }> | undefined;

            products.push({
              sku: String(fm.sku),
              name: String(fm.name || 'Unnamed'),
              brand: fm.brand ? String(fm.brand) : undefined,
              category: String(fm.category || 'outros'),
              subcategory: fm.subcategory ? String(fm.subcategory) : undefined,
              price: price?.value ? { value: price.value, currency: price.currency || 'BRL' } : undefined,
              retailer: purchaseUrls?.[0]?.retailer,
              path: fullPath,
            });
          }
        } catch {
          // Skip invalid files
        }
      }
    }
  }

  scan(dir);
  return products;
}

function buildStats(products: ProductSummary[]) {
  const categories: Record<string, number> = {};
  const brands: Record<string, number> = {};
  const retailers: Record<string, number> = {};
  let minPrice = Infinity;
  let maxPrice = 0;

  for (const p of products) {
    // Categories
    categories[p.category] = (categories[p.category] || 0) + 1;

    // Brands
    if (p.brand) {
      brands[p.brand] = (brands[p.brand] || 0) + 1;
    }

    // Retailers
    if (p.retailer) {
      retailers[p.retailer] = (retailers[p.retailer] || 0) + 1;
    }

    // Price range
    if (p.price?.value) {
      minPrice = Math.min(minPrice, p.price.value);
      maxPrice = Math.max(maxPrice, p.price.value);
    }
  }

  return {
    total_products: products.length,
    categories,
    brands,
    retailers,
    price_range: {
      min: minPrice === Infinity ? 0 : minPrice,
      max: maxPrice,
    },
  };
}

async function main() {
  const args = process.argv.slice(2);
  let catalogPath = './examples/kodda-catalog';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--catalog' && args[i + 1]) {
      catalogPath = args[++i];
    }
  }

  console.log(`\nBuilding Catalog Manifest`);
  console.log(`=========================`);
  console.log(`Catalog: ${catalogPath}\n`);

  const startTime = Date.now();

  // Scan all products
  console.log('Scanning products...');
  const products = scanProducts(catalogPath);
  console.log(`Found ${products.length} products in ${Date.now() - startTime}ms`);

  // Build stats
  console.log('Building stats...');
  const stats = buildStats(products);

  // Create manifest
  const manifest: CatalogManifest = {
    version: '1.0',
    generated_at: new Date().toISOString(),
    stats,
    products,
  };

  // Write manifest
  const manifestPath = join(catalogPath, 'manifest.json');
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');

  console.log(`\nManifest written to: ${manifestPath}`);
  console.log(`\nStats:`);
  console.log(`  Products: ${stats.total_products.toLocaleString()}`);
  console.log(`  Categories: ${Object.keys(stats.categories).length}`);
  console.log(`  Brands: ${Object.keys(stats.brands).length}`);
  console.log(`  Retailers: ${Object.keys(stats.retailers).length}`);
  console.log(`  Price range: R$ ${stats.price_range.min.toFixed(2)} - R$ ${stats.price_range.max.toFixed(2)}`);
  console.log(`\nTop categories:`);
  Object.entries(stats.categories)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([cat, count]) => console.log(`  ${cat}: ${count}`));
  console.log(`\nTop retailers:`);
  Object.entries(stats.retailers)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([ret, count]) => console.log(`  ${ret}: ${count}`));

  console.log(`\nTotal time: ${Date.now() - startTime}ms`);
}

main().catch(console.error);
