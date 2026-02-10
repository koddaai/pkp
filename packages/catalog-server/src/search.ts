/**
 * Product Search
 *
 * Simple in-memory search for catalog products
 */

import type {
  LoadedCatalog,
  LoadedProduct,
  SearchOptions,
  SearchResult,
  ComparisonResult,
} from "./types.js";

/**
 * Calculate relevance score for a product against a query
 */
function calculateScore(product: LoadedProduct, query: string): number {
  const q = query.toLowerCase();
  let score = 0;

  // Exact SKU match
  if (product.product.sku.toLowerCase() === q) {
    score += 100;
  }

  // Name contains query
  if (product.product.name.toLowerCase().includes(q)) {
    score += 50;
  }

  // Brand matches
  if (product.product.brand.toLowerCase().includes(q)) {
    score += 30;
  }

  // Summary contains query
  if (product.entry.summary.toLowerCase().includes(q)) {
    score += 20;
  }

  // Tags contain query
  if (product.product.tags) {
    for (const tag of product.product.tags) {
      if (tag.toLowerCase().includes(q)) {
        score += 10;
      }
    }
  }

  // Use cases contain query
  if (product.product.use_cases) {
    for (const useCase of product.product.use_cases) {
      if (useCase.toLowerCase().includes(q)) {
        score += 5;
      }
    }
  }

  // Content contains query
  if (product.content.toLowerCase().includes(q)) {
    score += 2;
  }

  return score;
}

/**
 * Check if product matches filters
 */
function matchesFilters(product: LoadedProduct, options: SearchOptions): boolean {
  // Category filter
  if (options.category) {
    const category = options.category.toLowerCase();
    if (
      !product.product.category.toLowerCase().includes(category) &&
      !product.product.subcategory?.toLowerCase().includes(category)
    ) {
      return false;
    }
  }

  // Brand filter
  if (options.brand) {
    if (
      product.product.brand.toLowerCase() !== options.brand.toLowerCase()
    ) {
      return false;
    }
  }

  // Price filters
  if (options.minPrice !== undefined || options.maxPrice !== undefined) {
    const price = product.product.price?.value;
    if (price === undefined) return false;
    if (options.minPrice !== undefined && price < options.minPrice) return false;
    if (options.maxPrice !== undefined && price > options.maxPrice) return false;
  }

  // Tags filter
  if (options.tags && options.tags.length > 0) {
    const productTags = product.product.tags?.map((t) => t.toLowerCase()) || [];
    const hasAllTags = options.tags.every((tag) =>
      productTags.includes(tag.toLowerCase())
    );
    if (!hasAllTags) return false;
  }

  return true;
}

/**
 * Search products in a catalog
 */
export function searchProducts(
  catalog: LoadedCatalog,
  options: SearchOptions = {}
): SearchResult[] {
  const results: Array<{ product: LoadedProduct; score: number }> = [];
  const limit = options.limit ?? 10;
  const offset = options.offset ?? 0;

  for (const product of catalog.products.values()) {
    // Check filters
    if (!matchesFilters(product, options)) {
      continue;
    }

    // Calculate score
    let score = 0;
    if (options.query) {
      score = calculateScore(product, options.query);
      // Must have some relevance to query
      if (score === 0) continue;
    } else {
      // No query, just filtering - use completeness as score
      score = product.entry.completeness_score ?? 50;
    }

    results.push({ product, score });
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);

  // Apply pagination
  const paginated = results.slice(offset, offset + limit);

  // Map to SearchResult
  return paginated.map(({ product, score }) => ({
    sku: product.product.sku,
    name: product.product.name,
    brand: product.product.brand,
    category: product.product.category,
    summary: product.entry.summary,
    price: product.product.price
      ? {
          value: product.product.price.value,
          currency: product.product.price.currency,
        }
      : undefined,
    score,
  }));
}

/**
 * Get a product by SKU
 */
export function getProduct(
  catalog: LoadedCatalog,
  sku: string
): LoadedProduct | undefined {
  return catalog.products.get(sku.toLowerCase());
}

/**
 * Get products by category
 */
export function getProductsByCategory(
  catalog: LoadedCatalog,
  category: string
): LoadedProduct[] {
  return catalog.byCategory.get(category) || [];
}

/**
 * List all categories
 */
export function listCategories(catalog: LoadedCatalog): string[] {
  return Array.from(catalog.byCategory.keys()).sort();
}

/**
 * List all brands
 */
export function listBrands(catalog: LoadedCatalog): string[] {
  const brands = new Set<string>();
  for (const product of catalog.products.values()) {
    brands.add(product.product.brand);
  }
  return Array.from(brands).sort();
}

/**
 * Compare multiple products
 */
export function compareProducts(
  catalog: LoadedCatalog,
  skus: string[]
): ComparisonResult | null {
  const products: ComparisonResult["products"] = [];
  const allSpecs: Map<string, Map<string, unknown>> = new Map();

  for (const sku of skus) {
    const product = getProduct(catalog, sku);
    if (!product) {
      return null;
    }

    products.push({
      sku: product.product.sku,
      name: product.product.name,
      brand: product.product.brand,
      category: product.product.category,
      price: product.product.price
        ? {
            value: product.product.price.value,
            currency: product.product.price.currency,
          }
        : undefined,
      specs: product.product.specs || {},
    });

    // Collect specs
    if (product.product.specs) {
      for (const [key, value] of Object.entries(product.product.specs)) {
        if (!allSpecs.has(key)) {
          allSpecs.set(key, new Map());
        }
        allSpecs.get(key)!.set(sku, value);
      }
    }
  }

  // Find differences and similarities
  const differences: ComparisonResult["differences"] = {};
  const similarities: ComparisonResult["similarities"] = {};

  for (const [key, values] of allSpecs) {
    const uniqueValues = new Set(
      Array.from(values.values()).map((v) => JSON.stringify(v))
    );

    if (uniqueValues.size === 1) {
      // All products have the same value
      similarities[key] = values.values().next().value;
    } else {
      // Products have different values
      differences[key] = Array.from(values.entries()).map(([sku, value]) => ({
        sku,
        value,
      }));
    }
  }

  return {
    skus,
    products,
    differences,
    similarities,
  };
}
