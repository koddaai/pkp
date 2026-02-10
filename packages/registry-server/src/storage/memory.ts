/**
 * In-Memory Storage Implementation
 *
 * Uses Maps for fast in-memory storage.
 * Data is lost on restart.
 */

import type {
  RegisteredDomain,
  IndexedProduct,
  RegistrySearchOptions,
  RegistrySearchResult,
  RegistryStats,
  QueryLogEntry,
  AccessStats,
  QueryType,
  ClientType,
} from "../types.js";
import type { RegistryStorage } from "./interface.js";

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
 * Calculate relevance score for a product
 */
function calculateScore(product: IndexedProduct, queryTokens: string[]): number {
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
 * In-memory storage implementation
 */
export class InMemoryStorage implements RegistryStorage {
  private domains = new Map<string, RegisteredDomain>();
  private products = new Map<string, IndexedProduct>();
  private productsByDomain = new Map<string, IndexedProduct[]>();
  private productsByCategory = new Map<string, IndexedProduct[]>();
  private searchIndex = new Map<string, Set<string>>(); // term -> URIs
  private queryLogs: QueryLogEntry[] = [];
  private readonly MAX_QUERY_LOGS = 10000; // Keep last 10k queries in memory

  async initialize(): Promise<void> {
    // Nothing to initialize for in-memory storage
  }

  async close(): Promise<void> {
    // Clear all data
    this.domains.clear();
    this.products.clear();
    this.productsByDomain.clear();
    this.productsByCategory.clear();
    this.searchIndex.clear();
  }

  // ============================================
  // Domain Operations
  // ============================================

  async saveDomain(domain: RegisteredDomain): Promise<void> {
    this.domains.set(domain.domain, domain);
  }

  async getDomain(name: string): Promise<RegisteredDomain | null> {
    return this.domains.get(name) ?? null;
  }

  async getAllDomains(): Promise<RegisteredDomain[]> {
    return Array.from(this.domains.values());
  }

  async deleteDomain(name: string): Promise<void> {
    // Remove all products from this domain
    await this.deleteProductsByDomain(name);
    // Remove domain
    this.domains.delete(name);
  }

  async updateDomainCrawlStatus(
    domain: string,
    status: "success" | "failed" | "pending",
    error?: string
  ): Promise<void> {
    const existing = this.domains.get(domain);
    if (existing) {
      existing.last_crawl_status = status;
      if (status === "success") {
        existing.last_crawled_at = new Date();
        existing.last_error = undefined;
      } else if (error) {
        existing.last_error = error;
      }
    }
  }

  // ============================================
  // Product Operations
  // ============================================

  async saveProduct(product: IndexedProduct): Promise<void> {
    // Remove from old indexes if exists
    const existing = this.products.get(product.uri);
    if (existing) {
      this.removeProductFromIndexes(existing);
    }

    // Add to main index
    this.products.set(product.uri, product);

    // Add to domain index
    if (!this.productsByDomain.has(product.domain)) {
      this.productsByDomain.set(product.domain, []);
    }
    this.productsByDomain.get(product.domain)!.push(product);

    // Add to category index
    if (!this.productsByCategory.has(product.category)) {
      this.productsByCategory.set(product.category, []);
    }
    this.productsByCategory.get(product.category)!.push(product);

    // Add to search index
    this.indexProductForSearch(product);
  }

  async saveProducts(products: IndexedProduct[]): Promise<void> {
    for (const product of products) {
      await this.saveProduct(product);
    }
  }

  async getProduct(uri: string): Promise<IndexedProduct | null> {
    return this.products.get(uri) ?? null;
  }

  async deleteProductsByDomain(domain: string): Promise<void> {
    const products = this.productsByDomain.get(domain) || [];
    // Create a copy to avoid issues with modifying array while iterating
    const productsCopy = [...products];

    for (const product of productsCopy) {
      this.removeProductFromIndexes(product);
      this.products.delete(product.uri);
    }

    this.productsByDomain.delete(domain);

    // Update domain product count
    const domainData = this.domains.get(domain);
    if (domainData) {
      domainData.product_count = 0;
    }
  }

  private removeProductFromIndexes(product: IndexedProduct): void {
    // Remove from search index
    for (const [, uris] of this.searchIndex) {
      uris.delete(product.uri);
    }

    // Remove from category index
    const categoryProducts = this.productsByCategory.get(product.category);
    if (categoryProducts) {
      const idx = categoryProducts.findIndex((p) => p.uri === product.uri);
      if (idx !== -1) {
        categoryProducts.splice(idx, 1);
      }
    }

    // Remove from domain index
    const domainProducts = this.productsByDomain.get(product.domain);
    if (domainProducts) {
      const idx = domainProducts.findIndex((p) => p.uri === product.uri);
      if (idx !== -1) {
        domainProducts.splice(idx, 1);
      }
    }
  }

  private indexProductForSearch(product: IndexedProduct): void {
    const addToIndex = (tokens: string[]) => {
      for (const token of tokens) {
        if (!this.searchIndex.has(token)) {
          this.searchIndex.set(token, new Set());
        }
        this.searchIndex.get(token)!.add(product.uri);
      }
    };

    // Index name
    addToIndex(tokenize(product.name));

    // Index summary
    addToIndex(tokenize(product.summary));

    // Index brand
    if (product.brand) {
      addToIndex(tokenize(product.brand));
    }

    // Index category
    addToIndex(tokenize(product.category));

    // Index SKU as exact match
    const skuLower = product.sku.toLowerCase();
    if (!this.searchIndex.has(skuLower)) {
      this.searchIndex.set(skuLower, new Set());
    }
    this.searchIndex.get(skuLower)!.add(product.uri);
  }

  // ============================================
  // Search Operations
  // ============================================

  async search(options: RegistrySearchOptions = {}): Promise<RegistrySearchResult[]> {
    const limit = options.limit ?? 20;
    const offset = options.offset ?? 0;

    let candidateUris: Set<string>;

    // If we have a query, use the search index
    if (options.query) {
      const queryTokens = tokenize(options.query);
      candidateUris = new Set();

      for (const token of queryTokens) {
        const matches = this.searchIndex.get(token);
        if (matches) {
          for (const uri of matches) {
            candidateUris.add(uri);
          }
        }

        // Also check for partial matches
        for (const [indexToken, uris] of this.searchIndex) {
          if (indexToken.includes(token) || token.includes(indexToken)) {
            for (const uri of uris) {
              candidateUris.add(uri);
            }
          }
        }
      }
    } else {
      // No query, start with all products
      candidateUris = new Set(this.products.keys());
    }

    // Filter and score
    const results: Array<{ product: IndexedProduct; score: number }> = [];
    const queryTokens = options.query ? tokenize(options.query) : [];

    for (const uri of candidateUris) {
      const product = this.products.get(uri);
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

  async countSearchResults(options: Omit<RegistrySearchOptions, "limit" | "offset">): Promise<number> {
    const results = await this.search({ ...options, limit: 10000, offset: 0 });
    return results.length;
  }

  // ============================================
  // Stats and Listings
  // ============================================

  async getStats(): Promise<RegistryStats> {
    const categories = new Set<string>();
    for (const product of this.products.values()) {
      categories.add(product.category);
    }

    let activeDomains = 0;
    for (const domain of this.domains.values()) {
      if (domain.active && domain.last_crawl_status === "success") {
        activeDomains++;
      }
    }

    return {
      total_domains: this.domains.size,
      active_domains: activeDomains,
      total_products: this.products.size,
      total_categories: categories.size,
      last_updated: new Date(),
    };
  }

  async listCategories(): Promise<Array<{ name: string; count: number }>> {
    const result: Array<{ name: string; count: number }> = [];

    for (const [category, products] of this.productsByCategory) {
      result.push({ name: category, count: products.length });
    }

    return result.sort((a, b) => b.count - a.count);
  }

  async listBrands(): Promise<Array<{ name: string; count: number }>> {
    const brandCounts = new Map<string, number>();

    for (const product of this.products.values()) {
      if (product.brand) {
        brandCounts.set(product.brand, (brandCounts.get(product.brand) || 0) + 1);
      }
    }

    const result: Array<{ name: string; count: number }> = [];
    for (const [name, count] of brandCounts) {
      result.push({ name, count });
    }

    return result.sort((a, b) => b.count - a.count);
  }

  // ============================================
  // Analytics Operations
  // ============================================

  async logQuery(entry: Omit<QueryLogEntry, "id" | "created_at">): Promise<void> {
    const logEntry: QueryLogEntry = {
      ...entry,
      id: crypto.randomUUID(),
      created_at: new Date(),
    };

    this.queryLogs.push(logEntry);

    // Keep only last MAX_QUERY_LOGS entries
    if (this.queryLogs.length > this.MAX_QUERY_LOGS) {
      this.queryLogs = this.queryLogs.slice(-this.MAX_QUERY_LOGS);
    }
  }

  async getAccessStats(period: "today" | "week" | "month" | "all"): Promise<AccessStats> {
    const now = new Date();
    let cutoff: Date;

    switch (period) {
      case "today":
        cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "week":
        cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        cutoff = new Date(0);
    }

    const filteredLogs = this.queryLogs.filter((log) => log.created_at >= cutoff);

    // Count by query type
    const byQueryType: Record<QueryType, number> = {
      search: 0,
      get_product: 0,
      compare: 0,
      filter: 0,
      alternatives: 0,
      catalog_fetch: 0,
      product_fetch: 0,
    };

    // Count by client type
    const byClientType: Record<ClientType, number> = {
      mcp: 0,
      rest: 0,
      cli: 0,
      crawler: 0,
      studio: 0,
      agent: 0,
      unknown: 0,
    };

    // Count by AI bot
    const byAiBot: Record<string, number> = {};

    // Count products accessed
    const productCounts = new Map<string, number>();

    // Count searches
    const searchCounts = new Map<string, number>();

    // Count categories
    const categoryCounts = new Map<string, number>();

    // Count by hour
    const hourCounts = new Map<number, number>();

    for (const log of filteredLogs) {
      byQueryType[log.query_type]++;
      byClientType[log.client_type]++;

      if (log.ai_bot) {
        byAiBot[log.ai_bot] = (byAiBot[log.ai_bot] || 0) + 1;
      }

      if (log.product_uri) {
        productCounts.set(log.product_uri, (productCounts.get(log.product_uri) || 0) + 1);
      }

      if (log.query_text && log.query_type === "search") {
        searchCounts.set(log.query_text, (searchCounts.get(log.query_text) || 0) + 1);
      }

      if (log.category) {
        categoryCounts.set(log.category, (categoryCounts.get(log.category) || 0) + 1);
      }

      const hour = log.created_at.getHours();
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
    }

    // Get top products with names
    const topProducts = Array.from(productCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([uri, count]) => {
        const product = this.products.get(uri);
        return {
          uri,
          name: product?.name || uri,
          count,
        };
      });

    // Get top searches
    const topSearches = Array.from(searchCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([query, count]) => ({ query, count }));

    // Get top categories
    const topCategories = Array.from(categoryCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([category, count]) => ({ category, count }));

    // Requests by hour (0-23)
    const requestsByHour = [];
    for (let hour = 0; hour < 24; hour++) {
      requestsByHour.push({ hour, count: hourCounts.get(hour) || 0 });
    }

    return {
      period,
      total_requests: filteredLogs.length,
      unique_products_accessed: productCounts.size,
      by_query_type: byQueryType,
      by_client_type: byClientType,
      by_ai_bot: byAiBot,
      top_products: topProducts,
      top_searches: topSearches,
      top_categories: topCategories,
      requests_by_hour: requestsByHour,
    };
  }

  async getRecentQueries(limit: number): Promise<QueryLogEntry[]> {
    return this.queryLogs.slice(-limit).reverse();
  }
}
