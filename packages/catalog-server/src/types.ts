/**
 * Catalog Server Types
 */

import type { PKPCatalog, PKPCatalogProduct, PKPProductBase } from "@pkp/spec";

/**
 * Loaded product with full content
 */
export interface LoadedProduct {
  /** Catalog entry (L0 data) */
  entry: PKPCatalogProduct;
  /** Full product data from PRODUCT.md */
  product: PKPProductBase;
  /** Markdown content */
  content: string;
  /** Raw markdown */
  raw: string;
}

/**
 * Loaded catalog with all products
 */
export interface LoadedCatalog {
  /** Catalog metadata */
  catalog: PKPCatalog;
  /** Products indexed by SKU */
  products: Map<string, LoadedProduct>;
  /** Products indexed by category */
  byCategory: Map<string, LoadedProduct[]>;
  /** Source directory */
  sourceDir: string;
}

/**
 * Search options for products
 */
export interface SearchOptions {
  /** Text query to search in name, summary, tags */
  query?: string;
  /** Filter by category */
  category?: string;
  /** Minimum price */
  minPrice?: number;
  /** Maximum price */
  maxPrice?: number;
  /** Filter by brand */
  brand?: string;
  /** Filter by tags */
  tags?: string[];
  /** Maximum results */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
}

/**
 * Search result
 */
export interface SearchResult {
  sku: string;
  name: string;
  brand: string;
  category: string;
  summary: string;
  price?: {
    value?: number;
    currency: string;
  };
  score: number;
}

/**
 * Comparison result
 */
export interface ComparisonResult {
  skus: string[];
  products: Array<{
    sku: string;
    name: string;
    brand: string;
    category: string;
    price?: {
      value?: number;
      currency: string;
    };
    specs: Record<string, unknown>;
  }>;
  differences: Record<string, Array<{ sku: string; value: unknown }>>;
  similarities: Record<string, unknown>;
}
