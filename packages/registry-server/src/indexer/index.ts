/**
 * Registry Index
 *
 * In-memory index for fast product search across multiple PKP catalogs
 */

import type {
  RegistryIndex,
  RegisteredDomain,
  IndexedProduct,
  RegistrySearchOptions,
  RegistrySearchResult,
  RegistryStats,
} from "../types.js";
import { fetchCatalog, catalogToRegisteredDomain, catalogToIndexedProducts } from "./crawler.js";

/**
 * Create a new empty registry index
 */
export function createRegistryIndex(): RegistryIndex {
  return {
    domains: new Map(),
    products: new Map(),
    productsByDomain: new Map(),
    productsByCategory: new Map(),
    searchIndex: new Map(),
  };
}

/**
 * Tokenize text for search indexing
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 2);
}

/**
 * Index a product for full-text search
 */
function indexProductForSearch(
  index: RegistryIndex,
  product: IndexedProduct
): void {
  // Index name
  for (const token of tokenize(product.name)) {
    if (!index.searchIndex.has(token)) {
      index.searchIndex.set(token, new Set());
    }
    index.searchIndex.get(token)!.add(product.uri);
  }

  // Index summary
  for (const token of tokenize(product.summary)) {
    if (!index.searchIndex.has(token)) {
      index.searchIndex.set(token, new Set());
    }
    index.searchIndex.get(token)!.add(product.uri);
  }

  // Index brand
  if (product.brand) {
    for (const token of tokenize(product.brand)) {
      if (!index.searchIndex.has(token)) {
        index.searchIndex.set(token, new Set());
      }
      index.searchIndex.get(token)!.add(product.uri);
    }
  }

  // Index category
  for (const token of tokenize(product.category)) {
    if (!index.searchIndex.has(token)) {
      index.searchIndex.set(token, new Set());
    }
    index.searchIndex.get(token)!.add(product.uri);
  }

  // Index SKU as exact match
  const skuLower = product.sku.toLowerCase();
  if (!index.searchIndex.has(skuLower)) {
    index.searchIndex.set(skuLower, new Set());
  }
  index.searchIndex.get(skuLower)!.add(product.uri);
}

/**
 * Remove a product from the search index
 */
function removeProductFromSearch(
  index: RegistryIndex,
  product: IndexedProduct
): void {
  for (const [, uris] of index.searchIndex) {
    uris.delete(product.uri);
  }
}

/**
 * Add or update a domain in the index
 */
export async function indexDomain(
  index: RegistryIndex,
  domain: string
): Promise<{ success: boolean; products_indexed: number; error?: string }> {
  try {
    const catalog = await fetchCatalog(domain);
    const registeredDomain = catalogToRegisteredDomain(domain, catalog);
    const products = catalogToIndexedProducts(domain, catalog);

    // Remove old products from this domain
    const existingProducts = index.productsByDomain.get(domain) || [];
    for (const product of existingProducts) {
      removeProductFromSearch(index, product);
      index.products.delete(product.uri);

      // Remove from category index
      const categoryProducts = index.productsByCategory.get(product.category);
      if (categoryProducts) {
        const idx = categoryProducts.findIndex((p) => p.uri === product.uri);
        if (idx !== -1) {
          categoryProducts.splice(idx, 1);
        }
      }
    }

    // Add new products
    index.productsByDomain.set(domain, products);

    for (const product of products) {
      index.products.set(product.uri, product);
      indexProductForSearch(index, product);

      // Index by category
      if (!index.productsByCategory.has(product.category)) {
        index.productsByCategory.set(product.category, []);
      }
      index.productsByCategory.get(product.category)!.push(product);
    }

    // Update domain info
    index.domains.set(domain, registeredDomain);

    return {
      success: true,
      products_indexed: products.length,
    };
  } catch (error) {
    // Update domain with error status
    const existing = index.domains.get(domain);
    if (existing) {
      existing.last_crawl_status = "failed";
      existing.last_error = error instanceof Error ? error.message : "Unknown error";
    }

    return {
      success: false,
      products_indexed: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Remove a domain from the index
 */
export function removeDomain(index: RegistryIndex, domain: string): void {
  const products = index.productsByDomain.get(domain) || [];

  for (const product of products) {
    removeProductFromSearch(index, product);
    index.products.delete(product.uri);

    // Remove from category index
    const categoryProducts = index.productsByCategory.get(product.category);
    if (categoryProducts) {
      const idx = categoryProducts.findIndex((p) => p.uri === product.uri);
      if (idx !== -1) {
        categoryProducts.splice(idx, 1);
      }
    }
  }

  index.productsByDomain.delete(domain);
  index.domains.delete(domain);
}

/**
 * Calculate relevance score for a product
 */
function calculateScore(
  product: IndexedProduct,
  queryTokens: string[]
): number {
  let score = 0;
  const nameLower = product.name.toLowerCase();
  const summaryLower = product.summary.toLowerCase();
  const skuLower = product.sku.toLowerCase();

  for (const token of queryTokens) {
    // Exact SKU match
    if (skuLower === token) {
      score += 100;
    }

    // Name contains token
    if (nameLower.includes(token)) {
      score += 50;
    }

    // Brand matches
    if (product.brand?.toLowerCase().includes(token)) {
      score += 30;
    }

    // Summary contains token
    if (summaryLower.includes(token)) {
      score += 10;
    }
  }

  // Boost by completeness
  if (product.completeness_score) {
    score *= 1 + product.completeness_score * 0.5;
  }

  return score;
}

/**
 * Search products in the registry
 */
export function searchProducts(
  index: RegistryIndex,
  options: RegistrySearchOptions = {}
): RegistrySearchResult[] {
  const limit = options.limit ?? 20;
  const offset = options.offset ?? 0;

  let candidateUris: Set<string>;

  // If we have a query, use the search index
  if (options.query) {
    const queryTokens = tokenize(options.query);
    candidateUris = new Set();

    for (const token of queryTokens) {
      const matches = index.searchIndex.get(token);
      if (matches) {
        for (const uri of matches) {
          candidateUris.add(uri);
        }
      }

      // Also check for partial matches
      for (const [indexToken, uris] of index.searchIndex) {
        if (indexToken.includes(token) || token.includes(indexToken)) {
          for (const uri of uris) {
            candidateUris.add(uri);
          }
        }
      }
    }
  } else {
    // No query, start with all products
    candidateUris = new Set(index.products.keys());
  }

  // Filter and score
  const results: Array<{ product: IndexedProduct; score: number }> = [];
  const queryTokens = options.query ? tokenize(options.query) : [];

  for (const uri of candidateUris) {
    const product = index.products.get(uri);
    if (!product) continue;

    // Apply filters
    if (options.domain && product.domain !== options.domain) continue;
    if (options.category && !product.category.toLowerCase().includes(options.category.toLowerCase())) continue;
    if (options.brand && product.brand?.toLowerCase() !== options.brand.toLowerCase()) continue;
    if (options.minPrice !== undefined && (product.price?.value ?? 0) < options.minPrice) continue;
    if (options.maxPrice !== undefined && (product.price?.value ?? Infinity) > options.maxPrice) continue;
    if (options.minCompleteness !== undefined && (product.completeness_score ?? 0) < options.minCompleteness) continue;

    const score = queryTokens.length > 0
      ? calculateScore(product, queryTokens)
      : (product.completeness_score ?? 0.5) * 100;

    if (score > 0 || queryTokens.length === 0) {
      results.push({ product, score });
    }
  }

  // Sort by score
  results.sort((a, b) => b.score - a.score);

  // Paginate
  const paginated = results.slice(offset, offset + limit);

  // Map to results
  return paginated.map(({ product, score }) => ({
    uri: product.uri,
    domain: product.domain,
    sku: product.sku,
    name: product.name,
    brand: product.brand,
    category: product.category,
    summary: product.summary,
    price: product.price
      ? {
          value: product.price.value,
          currency: product.price.currency,
        }
      : undefined,
    completeness_score: product.completeness_score,
    score,
  }));
}

/**
 * Get a product by URI
 */
export function getProductByUri(
  index: RegistryIndex,
  uri: string
): IndexedProduct | undefined {
  return index.products.get(uri);
}

/**
 * Resolve a product URI to full product info
 */
export function resolveProductUri(
  uri: string
): { domain: string; sku: string } | null {
  // Format: pkp://domain/sku
  const match = uri.match(/^pkp:\/\/([^/]+)\/(.+)$/);
  if (!match) return null;

  return {
    domain: match[1]!,
    sku: match[2]!,
  };
}

/**
 * Get registry statistics
 */
export function getStats(index: RegistryIndex): RegistryStats {
  const categories = new Set<string>();
  for (const product of index.products.values()) {
    categories.add(product.category);
  }

  let activeDomains = 0;
  for (const domain of index.domains.values()) {
    if (domain.active && domain.last_crawl_status === "success") {
      activeDomains++;
    }
  }

  return {
    total_domains: index.domains.size,
    active_domains: activeDomains,
    total_products: index.products.size,
    total_categories: categories.size,
    last_updated: new Date(),
  };
}

/**
 * List all registered domains
 */
export function listDomains(index: RegistryIndex): RegisteredDomain[] {
  return Array.from(index.domains.values());
}

/**
 * List all categories
 */
export function listCategories(index: RegistryIndex): Array<{ name: string; count: number }> {
  const result: Array<{ name: string; count: number }> = [];

  for (const [category, products] of index.productsByCategory) {
    result.push({ name: category, count: products.length });
  }

  return result.sort((a, b) => b.count - a.count);
}
