/**
 * Registry Server Types
 */

/**
 * Registered domain in the registry
 */
export interface RegisteredDomain {
  /** Domain name (e.g., "pkp.kodda.ai") */
  domain: string;
  /** Publisher name */
  publisher_name: string;
  /** Publisher type */
  publisher_type: "manufacturer" | "retailer" | "aggregator" | "community";
  /** Contact email */
  contact?: string;
  /** When the domain was registered */
  registered_at: Date;
  /** Last successful crawl */
  last_crawled_at?: Date;
  /** Last crawl status */
  last_crawl_status: "success" | "failed" | "pending";
  /** Error message if last crawl failed */
  last_error?: string;
  /** Number of products in the catalog */
  product_count: number;
  /** Categories available */
  categories: string[];
  /** Whether the domain is active */
  active: boolean;
}

/**
 * Indexed product in the registry
 */
export interface IndexedProduct {
  /** PKP URI (pkp://domain/sku) */
  uri: string;
  /** Domain this product belongs to */
  domain: string;
  /** Product SKU */
  sku: string;
  /** GTIN if available */
  gtin?: string;
  /** Product name */
  name: string;
  /** Brand */
  brand?: string;
  /** Category */
  category: string;
  /** Summary for search */
  summary: string;
  /** Price info */
  price?: {
    value?: number;
    currency: string;
    type: string;
  };
  /** Confidence source */
  confidence_source?: string;
  /** Completeness score (0-1) */
  completeness_score?: number;
  /** URL to fetch full product */
  product_url: string;
  /** When this was indexed */
  indexed_at: Date;
}

/**
 * Search options for registry
 */
export interface RegistrySearchOptions {
  /** Text query */
  query?: string;
  /** Filter by domain */
  domain?: string;
  /** Filter by category */
  category?: string;
  /** Filter by brand */
  brand?: string;
  /** Minimum price */
  minPrice?: number;
  /** Maximum price */
  maxPrice?: number;
  /** Minimum completeness (0-1) */
  minCompleteness?: number;
  /** Maximum results */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
}

/**
 * Search result from registry
 */
export interface RegistrySearchResult {
  uri: string;
  domain: string;
  sku: string;
  name: string;
  brand?: string;
  category: string;
  summary: string;
  price?: {
    value?: number;
    currency: string;
  };
  completeness_score?: number;
  score: number;
}

/**
 * Crawl result
 */
export interface CrawlResult {
  domain: string;
  success: boolean;
  products_indexed: number;
  categories: string[];
  error?: string;
  duration_ms: number;
}

/**
 * Registry statistics
 */
export interface RegistryStats {
  total_domains: number;
  active_domains: number;
  total_products: number;
  total_categories: number;
  last_updated: Date;
}

/**
 * In-memory registry index
 */
export interface RegistryIndex {
  /** Registered domains */
  domains: Map<string, RegisteredDomain>;
  /** Indexed products by URI */
  products: Map<string, IndexedProduct>;
  /** Products indexed by domain */
  productsByDomain: Map<string, IndexedProduct[]>;
  /** Products indexed by category */
  productsByCategory: Map<string, IndexedProduct[]>;
  /** Search index (simple text index) */
  searchIndex: Map<string, Set<string>>; // term -> URIs
}
