/**
 * PostgreSQL Storage Implementation
 *
 * Uses PostgreSQL for persistent storage with full-text search.
 * Requires migrations from /migrations/ to be run first.
 */

import pg from "pg";
import type {
  RegisteredDomain,
  IndexedProduct,
  RegistrySearchOptions,
  RegistrySearchResult,
  RegistryStats,
} from "../types.js";
import type { RegistryStorage, PostgreSQLConfig } from "./interface.js";

const { Pool } = pg;

/**
 * PostgreSQL storage implementation
 */
export class PostgreSQLStorage implements RegistryStorage {
  private pool: pg.Pool;

  constructor(config: PostgreSQLConfig) {
    this.pool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      ssl: config.ssl ? { rejectUnauthorized: false } : undefined,
      max: config.maxConnections ?? 10,
    });
  }

  async initialize(): Promise<void> {
    // Test connection
    const client = await this.pool.connect();
    try {
      await client.query("SELECT 1");
    } finally {
      client.release();
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  // ============================================
  // Domain Operations
  // ============================================

  async saveDomain(domain: RegisteredDomain): Promise<void> {
    const query = `
      INSERT INTO pkp_domains (
        domain, publisher_name, publisher_type, contact_email,
        registered_at, last_crawl_at, last_crawl_status, last_crawl_error,
        product_count, categories, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (domain) DO UPDATE SET
        publisher_name = EXCLUDED.publisher_name,
        publisher_type = EXCLUDED.publisher_type,
        contact_email = EXCLUDED.contact_email,
        last_crawl_at = EXCLUDED.last_crawl_at,
        last_crawl_status = EXCLUDED.last_crawl_status,
        last_crawl_error = EXCLUDED.last_crawl_error,
        product_count = EXCLUDED.product_count,
        categories = EXCLUDED.categories,
        status = EXCLUDED.status,
        updated_at = NOW()
    `;

    await this.pool.query(query, [
      domain.domain,
      domain.publisher_name,
      domain.publisher_type,
      domain.contact ?? null,
      domain.registered_at,
      domain.last_crawled_at ?? null,
      domain.last_crawl_status,
      domain.last_error ?? null,
      domain.product_count,
      domain.categories,
      domain.active ? "active" : "inactive",
    ]);
  }

  async getDomain(name: string): Promise<RegisteredDomain | null> {
    const query = `
      SELECT domain, publisher_name, publisher_type, contact_email,
             created_at as registered_at, last_crawl_at, last_crawl_status,
             last_crawl_error, product_count, categories, status
      FROM pkp_domains
      WHERE domain = $1
    `;

    const result = await this.pool.query(query, [name]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.rowToDomain(result.rows[0]);
  }

  async getAllDomains(): Promise<RegisteredDomain[]> {
    const query = `
      SELECT domain, publisher_name, publisher_type, contact_email,
             created_at as registered_at, last_crawl_at, last_crawl_status,
             last_crawl_error, product_count, categories, status
      FROM pkp_domains
      ORDER BY domain
    `;

    const result = await this.pool.query(query);
    return result.rows.map((row) => this.rowToDomain(row));
  }

  async deleteDomain(name: string): Promise<void> {
    // Products are deleted via CASCADE
    await this.pool.query("DELETE FROM pkp_domains WHERE domain = $1", [name]);
  }

  async updateDomainCrawlStatus(
    domain: string,
    status: "success" | "failed" | "pending",
    error?: string
  ): Promise<void> {
    const query = `
      UPDATE pkp_domains SET
        last_crawl_status = $2,
        last_crawl_at = CASE WHEN $2 = 'success' THEN NOW() ELSE last_crawl_at END,
        last_crawl_error = $3,
        updated_at = NOW()
      WHERE domain = $1
    `;

    await this.pool.query(query, [domain, status, error ?? null]);
  }

  private rowToDomain(row: Record<string, unknown>): RegisteredDomain {
    return {
      domain: row.domain as string,
      publisher_name: row.publisher_name as string,
      publisher_type: row.publisher_type as RegisteredDomain["publisher_type"],
      contact: (row.contact_email as string) ?? undefined,
      registered_at: new Date(row.registered_at as string),
      last_crawled_at: row.last_crawl_at ? new Date(row.last_crawl_at as string) : undefined,
      last_crawl_status: (row.last_crawl_status as RegisteredDomain["last_crawl_status"]) ?? "pending",
      last_error: (row.last_crawl_error as string) ?? undefined,
      product_count: Number(row.product_count) || 0,
      categories: (row.categories as string[]) ?? [],
      active: row.status === "active",
    };
  }

  // ============================================
  // Product Operations
  // ============================================

  async saveProduct(product: IndexedProduct): Promise<void> {
    const query = `
      INSERT INTO pkp_registry_index (
        uri, domain, sku, gtin, name, brand, category,
        summary, price_value, price_currency, price_type,
        confidence_source, completeness_score, product_url, indexed_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      ON CONFLICT (uri) DO UPDATE SET
        name = EXCLUDED.name,
        brand = EXCLUDED.brand,
        category = EXCLUDED.category,
        summary = EXCLUDED.summary,
        price_value = EXCLUDED.price_value,
        price_currency = EXCLUDED.price_currency,
        price_type = EXCLUDED.price_type,
        confidence_source = EXCLUDED.confidence_source,
        completeness_score = EXCLUDED.completeness_score,
        product_url = EXCLUDED.product_url,
        indexed_at = EXCLUDED.indexed_at,
        updated_at = NOW()
    `;

    await this.pool.query(query, [
      product.uri,
      product.domain,
      product.sku,
      product.gtin ?? null,
      product.name,
      product.brand ?? null,
      product.category,
      product.summary,
      product.price?.value ?? null,
      product.price?.currency ?? null,
      product.price?.type ?? null,
      product.confidence_source ?? null,
      product.completeness_score ?? null,
      product.product_url,
      product.indexed_at,
    ]);
  }

  async saveProducts(products: IndexedProduct[]): Promise<void> {
    if (products.length === 0) return;

    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");

      for (const product of products) {
        await this.saveProductWithClient(client, product);
      }

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  private async saveProductWithClient(client: pg.PoolClient, product: IndexedProduct): Promise<void> {
    const query = `
      INSERT INTO pkp_registry_index (
        uri, domain, sku, gtin, name, brand, category,
        summary, price_value, price_currency, price_type,
        confidence_source, completeness_score, product_url, indexed_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      ON CONFLICT (uri) DO UPDATE SET
        name = EXCLUDED.name,
        brand = EXCLUDED.brand,
        category = EXCLUDED.category,
        summary = EXCLUDED.summary,
        price_value = EXCLUDED.price_value,
        price_currency = EXCLUDED.price_currency,
        price_type = EXCLUDED.price_type,
        confidence_source = EXCLUDED.confidence_source,
        completeness_score = EXCLUDED.completeness_score,
        product_url = EXCLUDED.product_url,
        indexed_at = EXCLUDED.indexed_at,
        updated_at = NOW()
    `;

    await client.query(query, [
      product.uri,
      product.domain,
      product.sku,
      product.gtin ?? null,
      product.name,
      product.brand ?? null,
      product.category,
      product.summary,
      product.price?.value ?? null,
      product.price?.currency ?? null,
      product.price?.type ?? null,
      product.confidence_source ?? null,
      product.completeness_score ?? null,
      product.product_url,
      product.indexed_at,
    ]);
  }

  async getProduct(uri: string): Promise<IndexedProduct | null> {
    const query = `
      SELECT uri, domain, sku, gtin, name, brand, category,
             summary, price_value, price_currency, price_type,
             confidence_source, completeness_score, product_url, indexed_at
      FROM pkp_registry_index
      WHERE uri = $1
    `;

    const result = await this.pool.query(query, [uri]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.rowToProduct(result.rows[0]);
  }

  async deleteProductsByDomain(domain: string): Promise<void> {
    await this.pool.query("DELETE FROM pkp_registry_index WHERE domain = $1", [domain]);
  }

  private rowToProduct(row: Record<string, unknown>): IndexedProduct {
    return {
      uri: row.uri as string,
      domain: row.domain as string,
      sku: row.sku as string,
      gtin: (row.gtin as string) ?? undefined,
      name: row.name as string,
      brand: (row.brand as string) ?? undefined,
      category: row.category as string,
      summary: row.summary as string,
      price: row.price_value
        ? {
            value: Number(row.price_value),
            currency: row.price_currency as string,
            type: row.price_type as string,
          }
        : undefined,
      confidence_source: (row.confidence_source as string) ?? undefined,
      completeness_score: row.completeness_score ? Number(row.completeness_score) : undefined,
      product_url: row.product_url as string,
      indexed_at: new Date(row.indexed_at as string),
    };
  }

  // ============================================
  // Search Operations
  // ============================================

  async search(options: RegistrySearchOptions = {}): Promise<RegistrySearchResult[]> {
    const limit = options.limit ?? 20;
    const offset = options.offset ?? 0;

    const conditions: string[] = ["1=1"];
    const params: unknown[] = [];
    let paramIndex = 1;

    // Full-text search
    if (options.query) {
      conditions.push(`search_vector @@ plainto_tsquery('portuguese', $${paramIndex})`);
      params.push(options.query);
      paramIndex++;
    }

    // Filters
    if (options.domain) {
      conditions.push(`domain = $${paramIndex}`);
      params.push(options.domain);
      paramIndex++;
    }

    if (options.category) {
      conditions.push(`category ILIKE $${paramIndex}`);
      params.push(`%${options.category}%`);
      paramIndex++;
    }

    if (options.brand) {
      conditions.push(`LOWER(brand) = LOWER($${paramIndex})`);
      params.push(options.brand);
      paramIndex++;
    }

    if (options.minPrice !== undefined) {
      conditions.push(`price_value >= $${paramIndex}`);
      params.push(options.minPrice);
      paramIndex++;
    }

    if (options.maxPrice !== undefined) {
      conditions.push(`price_value <= $${paramIndex}`);
      params.push(options.maxPrice);
      paramIndex++;
    }

    if (options.minCompleteness !== undefined) {
      conditions.push(`completeness_score >= $${paramIndex}`);
      params.push(options.minCompleteness);
      paramIndex++;
    }

    // Build scoring expression
    let scoreExpr = "completeness_score * 100";
    if (options.query) {
      scoreExpr = `ts_rank_cd(search_vector, plainto_tsquery('portuguese', $1)) * 1000 + COALESCE(completeness_score, 0.5) * 50`;
    }

    const query = `
      SELECT uri, domain, sku, name, brand, category, summary,
             price_value, price_currency, completeness_score,
             ${scoreExpr} AS score
      FROM pkp_registry_index
      WHERE ${conditions.join(" AND ")}
      ORDER BY score DESC, name ASC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(limit, offset);

    const result = await this.pool.query(query, params);

    return result.rows.map((row) => ({
      uri: row.uri as string,
      domain: row.domain as string,
      sku: row.sku as string,
      name: row.name as string,
      brand: (row.brand as string) ?? undefined,
      category: row.category as string,
      summary: row.summary as string,
      price: row.price_value
        ? {
            value: Number(row.price_value),
            currency: row.price_currency as string,
          }
        : undefined,
      completeness_score: row.completeness_score ? Number(row.completeness_score) : undefined,
      score: Number(row.score) || 0,
    }));
  }

  async countSearchResults(options: Omit<RegistrySearchOptions, "limit" | "offset">): Promise<number> {
    const conditions: string[] = ["1=1"];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (options.query) {
      conditions.push(`search_vector @@ plainto_tsquery('portuguese', $${paramIndex})`);
      params.push(options.query);
      paramIndex++;
    }

    if (options.domain) {
      conditions.push(`domain = $${paramIndex}`);
      params.push(options.domain);
      paramIndex++;
    }

    if (options.category) {
      conditions.push(`category ILIKE $${paramIndex}`);
      params.push(`%${options.category}%`);
      paramIndex++;
    }

    if (options.brand) {
      conditions.push(`LOWER(brand) = LOWER($${paramIndex})`);
      params.push(options.brand);
      paramIndex++;
    }

    if (options.minPrice !== undefined) {
      conditions.push(`price_value >= $${paramIndex}`);
      params.push(options.minPrice);
      paramIndex++;
    }

    if (options.maxPrice !== undefined) {
      conditions.push(`price_value <= $${paramIndex}`);
      params.push(options.maxPrice);
      paramIndex++;
    }

    if (options.minCompleteness !== undefined) {
      conditions.push(`completeness_score >= $${paramIndex}`);
      params.push(options.minCompleteness);
      paramIndex++;
    }

    const query = `
      SELECT COUNT(*) as count
      FROM pkp_registry_index
      WHERE ${conditions.join(" AND ")}
    `;

    const result = await this.pool.query(query, params);
    return Number(result.rows[0].count) || 0;
  }

  // ============================================
  // Stats and Listings
  // ============================================

  async getStats(): Promise<RegistryStats> {
    const domainsQuery = `
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'active' AND last_crawl_status = 'success') as active
      FROM pkp_domains
    `;

    const productsQuery = `
      SELECT
        COUNT(*) as total,
        COUNT(DISTINCT category) as categories
      FROM pkp_registry_index
    `;

    const [domainsResult, productsResult] = await Promise.all([
      this.pool.query(domainsQuery),
      this.pool.query(productsQuery),
    ]);

    return {
      total_domains: Number(domainsResult.rows[0].total) || 0,
      active_domains: Number(domainsResult.rows[0].active) || 0,
      total_products: Number(productsResult.rows[0].total) || 0,
      total_categories: Number(productsResult.rows[0].categories) || 0,
      last_updated: new Date(),
    };
  }

  async listCategories(): Promise<Array<{ name: string; count: number }>> {
    const query = `
      SELECT category as name, COUNT(*) as count
      FROM pkp_registry_index
      GROUP BY category
      ORDER BY count DESC
    `;

    const result = await this.pool.query(query);
    return result.rows.map((row) => ({
      name: row.name as string,
      count: Number(row.count) || 0,
    }));
  }

  async listBrands(): Promise<Array<{ name: string; count: number }>> {
    const query = `
      SELECT brand as name, COUNT(*) as count
      FROM pkp_registry_index
      WHERE brand IS NOT NULL
      GROUP BY brand
      ORDER BY count DESC
    `;

    const result = await this.pool.query(query);
    return result.rows.map((row) => ({
      name: row.name as string,
      count: Number(row.count) || 0,
    }));
  }
}
