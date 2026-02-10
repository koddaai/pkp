/**
 * Registry Storage Interface
 *
 * Abstract interface for registry storage backends.
 * Implementations: InMemoryStorage, PostgreSQLStorage
 */

import type {
  RegisteredDomain,
  IndexedProduct,
  RegistrySearchOptions,
  RegistrySearchResult,
  RegistryStats,
} from "../types.js";

/**
 * Storage interface for the registry
 */
export interface RegistryStorage {
  /**
   * Initialize the storage (connect to DB, create tables, etc.)
   */
  initialize(): Promise<void>;

  /**
   * Close the storage connection
   */
  close(): Promise<void>;

  // ============================================
  // Domain Operations
  // ============================================

  /**
   * Save or update a domain
   */
  saveDomain(domain: RegisteredDomain): Promise<void>;

  /**
   * Get a domain by name
   */
  getDomain(name: string): Promise<RegisteredDomain | null>;

  /**
   * Get all registered domains
   */
  getAllDomains(): Promise<RegisteredDomain[]>;

  /**
   * Delete a domain and all its products
   */
  deleteDomain(name: string): Promise<void>;

  /**
   * Update domain crawl status
   */
  updateDomainCrawlStatus(
    domain: string,
    status: "success" | "failed" | "pending",
    error?: string
  ): Promise<void>;

  // ============================================
  // Product Operations
  // ============================================

  /**
   * Save or update a product
   */
  saveProduct(product: IndexedProduct): Promise<void>;

  /**
   * Save multiple products (batch operation)
   */
  saveProducts(products: IndexedProduct[]): Promise<void>;

  /**
   * Get a product by URI
   */
  getProduct(uri: string): Promise<IndexedProduct | null>;

  /**
   * Delete all products from a domain
   */
  deleteProductsByDomain(domain: string): Promise<void>;

  // ============================================
  // Search Operations
  // ============================================

  /**
   * Search products with filters and pagination
   */
  search(options: RegistrySearchOptions): Promise<RegistrySearchResult[]>;

  /**
   * Count total results for a search (without pagination)
   */
  countSearchResults(options: Omit<RegistrySearchOptions, "limit" | "offset">): Promise<number>;

  // ============================================
  // Stats and Listings
  // ============================================

  /**
   * Get registry statistics
   */
  getStats(): Promise<RegistryStats>;

  /**
   * List all categories with product counts
   */
  listCategories(): Promise<Array<{ name: string; count: number }>>;

  /**
   * List all brands with product counts
   */
  listBrands(): Promise<Array<{ name: string; count: number }>>;
}

/**
 * Storage configuration
 */
export interface StorageConfig {
  type: "memory" | "postgresql";
  postgresql?: PostgreSQLConfig;
}

/**
 * PostgreSQL configuration
 */
export interface PostgreSQLConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: boolean;
  maxConnections?: number;
}

/**
 * Create a storage instance based on configuration
 */
export async function createStorage(config: StorageConfig): Promise<RegistryStorage> {
  if (config.type === "postgresql" && config.postgresql) {
    const { PostgreSQLStorage } = await import("./postgresql.js");
    const storage = new PostgreSQLStorage(config.postgresql);
    await storage.initialize();
    return storage;
  }

  // Default to in-memory
  const { InMemoryStorage } = await import("./memory.js");
  const storage = new InMemoryStorage();
  await storage.initialize();
  return storage;
}
