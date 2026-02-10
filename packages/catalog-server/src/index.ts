/**
 * @pkp/catalog-server - MCP Server for serving PKP catalog data
 */

export { createCatalogServer, type CatalogServerOptions } from "./server.js";
export { loadCatalog, reloadCatalog } from "./loader.js";
export {
  searchProducts,
  getProduct,
  getProductsByCategory,
  listCategories,
  listBrands,
  compareProducts,
} from "./search.js";
export type {
  LoadedCatalog,
  LoadedProduct,
  SearchOptions,
  SearchResult,
  ComparisonResult,
} from "./types.js";
