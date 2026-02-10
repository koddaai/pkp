/**
 * @pkprotocol/registry-server - PKP Registry for central discovery
 */

export { createRegistryServer, type RegistryServerOptions } from "./server.js";

// Storage
export {
  createStorage,
  InMemoryStorage,
  PostgreSQLStorage,
} from "./storage/index.js";
export type {
  RegistryStorage,
  StorageConfig,
  PostgreSQLConfig,
} from "./storage/index.js";

// Crawler
export {
  crawlDomainPKP,
  fetchCatalog,
  fetchProduct,
  catalogToRegisteredDomain,
  catalogToIndexedProducts,
} from "./indexer/crawler.js";

// Legacy indexer (kept for backwards compatibility)
export {
  createRegistryIndex,
  indexDomain,
  removeDomain,
  searchProducts,
  getProductByUri,
  resolveProductUri,
  getStats,
  listDomains,
  listCategories,
} from "./indexer/index.js";

// Types
export type {
  RegisteredDomain,
  IndexedProduct,
  RegistrySearchOptions,
  RegistrySearchResult,
  CrawlResult,
  RegistryStats,
  RegistryIndex,
} from "./types.js";
