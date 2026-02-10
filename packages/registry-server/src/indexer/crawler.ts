/**
 * PKP Domain Crawler
 *
 * Crawls /.well-known/pkp/catalog.json from registered domains
 */

import { fetch } from "undici";
import { PKPCatalog } from "@pkprotocol/spec";
import type { CrawlResult, IndexedProduct, RegisteredDomain } from "../types.js";

/**
 * Fetch and parse a PKP catalog from a domain
 */
export async function fetchCatalog(domain: string): Promise<PKPCatalog> {
  const catalogUrl = `https://${domain}/.well-known/pkp/catalog.json`;

  const response = await fetch(catalogUrl, {
    headers: {
      Accept: "application/json",
      "User-Agent": "PKP-Registry/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch catalog: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  // Validate with Zod
  const result = PKPCatalog.safeParse(data);
  if (!result.success) {
    throw new Error(`Invalid catalog: ${result.error.message}`);
  }

  return result.data;
}

/**
 * Fetch a single product markdown from a domain
 */
export async function fetchProduct(domain: string, productUrl: string): Promise<string> {
  const url = productUrl.startsWith("http")
    ? productUrl
    : `https://${domain}${productUrl}`;

  const response = await fetch(url, {
    headers: {
      Accept: "text/markdown, text/plain, */*",
      "User-Agent": "PKP-Registry/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch product: ${response.status} ${response.statusText}`);
  }

  return await response.text();
}

/**
 * Convert catalog products to indexed products
 */
function catalogToIndexedProducts(
  domain: string,
  catalog: PKPCatalog
): IndexedProduct[] {
  const products: IndexedProduct[] = [];
  const now = new Date();

  if (!catalog.products) {
    return products;
  }

  for (const p of catalog.products) {
    const uri = p.uri || `pkp://${domain}/${p.sku}`;

    products.push({
      uri,
      domain,
      sku: p.sku,
      gtin: p.gtin,
      name: p.name,
      category: p.category,
      summary: p.summary,
      price: p.price
        ? {
            value: p.price.value,
            currency: p.price.currency,
            type: p.price.type,
          }
        : undefined,
      confidence_source: p.confidence_source,
      completeness_score: p.completeness_score,
      product_url: p.url,
      indexed_at: now,
    });
  }

  return products;
}

/**
 * Crawl a domain for PKP data
 */
export async function crawlDomainPKP(domain: string): Promise<CrawlResult> {
  const startTime = Date.now();

  try {
    const catalog = await fetchCatalog(domain);
    const products = catalogToIndexedProducts(domain, catalog);

    return {
      domain,
      success: true,
      products_indexed: products.length,
      categories: catalog.categories,
      duration_ms: Date.now() - startTime,
    };
  } catch (error) {
    return {
      domain,
      success: false,
      products_indexed: 0,
      categories: [],
      error: error instanceof Error ? error.message : "Unknown error",
      duration_ms: Date.now() - startTime,
    };
  }
}

/**
 * Create a registered domain from a catalog
 */
export function catalogToRegisteredDomain(
  domain: string,
  catalog: PKPCatalog
): RegisteredDomain {
  return {
    domain,
    publisher_name: catalog.publisher.name,
    publisher_type: catalog.publisher.type,
    contact: catalog.publisher.contact,
    registered_at: new Date(),
    last_crawled_at: new Date(),
    last_crawl_status: "success",
    product_count: catalog.products?.length ?? 0,
    categories: catalog.categories,
    active: true,
  };
}

export { catalogToIndexedProducts };
