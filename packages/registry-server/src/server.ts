/**
 * Registry MCP Server
 *
 * MCP Server for global PKP product discovery across multiple catalogs
 */

import { FastMCP } from "fastmcp";
import { z } from "zod";
import type { RegistryStorage, StorageConfig } from "./storage/interface.js";
import { createStorage } from "./storage/index.js";
import { fetchCatalog, catalogToRegisteredDomain, catalogToIndexedProducts, fetchProduct } from "./indexer/crawler.js";
import { resolveProductUri } from "./indexer/index.js";

export interface RegistryServerOptions {
  /** Server name */
  name?: string;
  /** Server version */
  version?: string;
  /** Initial domains to index */
  domains?: string[];
  /** Storage configuration */
  storage?: StorageConfig;
}

/**
 * Index a domain into storage
 */
async function indexDomainToStorage(
  storage: RegistryStorage,
  domain: string
): Promise<{ success: boolean; products_indexed: number; error?: string }> {
  try {
    const catalog = await fetchCatalog(domain);
    const registeredDomain = catalogToRegisteredDomain(domain, catalog);
    const products = catalogToIndexedProducts(domain, catalog);

    // Remove old products from this domain
    await storage.deleteProductsByDomain(domain);

    // Save new products
    await storage.saveProducts(products);

    // Update domain info
    registeredDomain.product_count = products.length;
    await storage.saveDomain(registeredDomain);

    return {
      success: true,
      products_indexed: products.length,
    };
  } catch (error) {
    // Update domain with error status
    await storage.updateDomainCrawlStatus(
      domain,
      "failed",
      error instanceof Error ? error.message : "Unknown error"
    );

    return {
      success: false,
      products_indexed: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Create a PKP Registry MCP Server
 */
export async function createRegistryServer(options: RegistryServerOptions = {}): Promise<FastMCP> {
  const {
    name = "PKP Registry Server",
    version = "1.0.0",
    domains = [],
    storage: storageConfig = { type: "memory" },
  } = options;

  // Initialize storage
  const storage = await createStorage(storageConfig);

  const mcp = new FastMCP({
    name,
    version: version as `${number}.${number}.${number}`,
  });

  // Index initial domains on startup
  if (domains.length > 0) {
    (async () => {
      for (const domain of domains) {
        console.error(`[Registry] Indexing initial domain: ${domain}`);
        const result = await indexDomainToStorage(storage, domain);
        if (result.success) {
          console.error(`[Registry] Indexed ${result.products_indexed} products from ${domain}`);
        } else {
          console.error(`[Registry] Failed to index ${domain}: ${result.error}`);
        }
      }
    })();
  }

  // Tool: search_products
  mcp.addTool({
    name: "search_products",
    description:
      "Search for products across all registered PKP catalogs. Returns matching products from multiple sources with relevance scores.",
    parameters: z.object({
      query: z.string().optional().describe("Text to search for in product names, descriptions, and brands"),
      domain: z.string().optional().describe("Filter by specific domain"),
      category: z.string().optional().describe("Filter by category"),
      brand: z.string().optional().describe("Filter by brand"),
      min_price: z.number().optional().describe("Minimum price filter"),
      max_price: z.number().optional().describe("Maximum price filter"),
      min_completeness: z.number().min(0).max(1).optional().describe("Minimum completeness score (0-1)"),
      limit: z.number().optional().default(20).describe("Maximum results to return"),
      offset: z.number().optional().default(0).describe("Offset for pagination"),
    }),
    execute: async (args) => {
      const results = await storage.search({
        query: args.query,
        domain: args.domain,
        category: args.category,
        brand: args.brand,
        minPrice: args.min_price,
        maxPrice: args.max_price,
        minCompleteness: args.min_completeness,
        limit: args.limit,
        offset: args.offset,
      });

      return JSON.stringify(
        {
          count: results.length,
          products: results,
        },
        null,
        2
      );
    },
  });

  // Tool: resolve_product
  mcp.addTool({
    name: "resolve_product",
    description:
      "Resolve a PKP URI (pkp://domain/sku) to full product information. Fetches the complete PRODUCT.md from the source.",
    parameters: z.object({
      uri: z.string().describe("PKP URI in format pkp://domain/sku"),
    }),
    execute: async (args) => {
      const parsed = resolveProductUri(args.uri);
      if (!parsed) {
        return JSON.stringify({ error: `Invalid PKP URI: ${args.uri}` });
      }

      const indexed = await storage.getProduct(args.uri);
      if (!indexed) {
        return JSON.stringify({ error: `Product not found in index: ${args.uri}` });
      }

      try {
        const markdown = await fetchProduct(parsed.domain, indexed.product_url);
        return JSON.stringify(
          {
            uri: args.uri,
            domain: parsed.domain,
            sku: parsed.sku,
            indexed: {
              name: indexed.name,
              category: indexed.category,
              summary: indexed.summary,
              price: indexed.price,
              completeness_score: indexed.completeness_score,
            },
            content: markdown,
          },
          null,
          2
        );
      } catch (error) {
        return JSON.stringify({
          uri: args.uri,
          error: `Failed to fetch product: ${error instanceof Error ? error.message : "Unknown error"}`,
          indexed: {
            name: indexed.name,
            category: indexed.category,
            summary: indexed.summary,
            price: indexed.price,
          },
        });
      }
    },
  });

  // Tool: get_product_info
  mcp.addTool({
    name: "get_product_info",
    description: "Get indexed information about a product by URI (without fetching full content).",
    parameters: z.object({
      uri: z.string().describe("PKP URI in format pkp://domain/sku"),
    }),
    execute: async (args) => {
      const product = await storage.getProduct(args.uri);
      if (!product) {
        return JSON.stringify({ error: `Product not found: ${args.uri}` });
      }

      return JSON.stringify(product, null, 2);
    },
  });

  // Tool: list_catalogs
  mcp.addTool({
    name: "list_catalogs",
    description: "List all registered PKP catalogs in the registry.",
    parameters: z.object({}),
    execute: async () => {
      const domains = await storage.getAllDomains();

      return JSON.stringify(
        {
          count: domains.length,
          catalogs: domains.map((d) => ({
            domain: d.domain,
            publisher: d.publisher_name,
            type: d.publisher_type,
            products: d.product_count,
            categories: d.categories,
            last_crawled: d.last_crawled_at,
            status: d.last_crawl_status,
          })),
        },
        null,
        2
      );
    },
  });

  // Tool: register_catalog
  mcp.addTool({
    name: "register_catalog",
    description:
      "Register a new PKP catalog in the registry. The catalog will be crawled and indexed.",
    parameters: z.object({
      domain: z.string().describe("Domain to register (e.g., 'products.example.com')"),
    }),
    execute: async (args) => {
      // Check if already registered
      const existing = await storage.getDomain(args.domain);
      if (existing) {
        return JSON.stringify({
          success: false,
          message: `Domain ${args.domain} is already registered`,
        });
      }

      const result = await indexDomainToStorage(storage, args.domain);

      if (result.success) {
        return JSON.stringify({
          success: true,
          domain: args.domain,
          products_indexed: result.products_indexed,
          message: `Successfully registered and indexed ${result.products_indexed} products`,
        });
      } else {
        return JSON.stringify({
          success: false,
          domain: args.domain,
          error: result.error,
          message: `Failed to register domain: ${result.error}`,
        });
      }
    },
  });

  // Tool: refresh_catalog
  mcp.addTool({
    name: "refresh_catalog",
    description: "Refresh a registered catalog by re-crawling it.",
    parameters: z.object({
      domain: z.string().describe("Domain to refresh"),
    }),
    execute: async (args) => {
      const existing = await storage.getDomain(args.domain);
      if (!existing) {
        return JSON.stringify({
          success: false,
          message: `Domain ${args.domain} is not registered`,
        });
      }

      const result = await indexDomainToStorage(storage, args.domain);

      if (result.success) {
        return JSON.stringify({
          success: true,
          domain: args.domain,
          products_indexed: result.products_indexed,
          message: `Successfully refreshed ${result.products_indexed} products`,
        });
      } else {
        return JSON.stringify({
          success: false,
          domain: args.domain,
          error: result.error,
        });
      }
    },
  });

  // Tool: unregister_catalog
  mcp.addTool({
    name: "unregister_catalog",
    description: "Remove a catalog from the registry.",
    parameters: z.object({
      domain: z.string().describe("Domain to unregister"),
    }),
    execute: async (args) => {
      const existing = await storage.getDomain(args.domain);
      if (!existing) {
        return JSON.stringify({
          success: false,
          message: `Domain ${args.domain} is not registered`,
        });
      }

      await storage.deleteDomain(args.domain);

      return JSON.stringify({
        success: true,
        domain: args.domain,
        message: `Successfully unregistered ${args.domain}`,
      });
    },
  });

  // Tool: list_categories
  mcp.addTool({
    name: "list_categories",
    description: "List all product categories across all registered catalogs.",
    parameters: z.object({}),
    execute: async () => {
      const categories = await storage.listCategories();

      return JSON.stringify(
        {
          count: categories.length,
          categories,
        },
        null,
        2
      );
    },
  });

  // Tool: get_registry_stats
  mcp.addTool({
    name: "get_registry_stats",
    description: "Get statistics about the registry.",
    parameters: z.object({}),
    execute: async () => {
      const stats = await storage.getStats();

      return JSON.stringify(stats, null, 2);
    },
  });

  // Tool: compare_across_catalogs
  mcp.addTool({
    name: "compare_across_catalogs",
    description:
      "Compare products from different catalogs. Useful for finding the same product across different retailers.",
    parameters: z.object({
      uris: z
        .array(z.string())
        .min(2)
        .max(5)
        .describe("List of PKP URIs to compare"),
    }),
    execute: async (args) => {
      const products = [];

      for (const uri of args.uris) {
        const product = await storage.getProduct(uri);
        if (product) {
          products.push({
            uri,
            domain: product.domain,
            sku: product.sku,
            name: product.name,
            category: product.category,
            price: product.price,
            completeness_score: product.completeness_score,
            confidence_source: product.confidence_source,
          });
        } else {
          products.push({
            uri,
            error: "Product not found",
          });
        }
      }

      // Find price differences
      const pricesWithValues = products
        .filter((p) => "price" in p && p.price?.value)
        .map((p) => ({ uri: p.uri, domain: p.domain, price: p.price }));

      const priceComparison =
        pricesWithValues.length > 0
          ? {
              lowest: pricesWithValues.reduce((a, b) =>
                (a.price?.value ?? Infinity) < (b.price?.value ?? Infinity) ? a : b
              ),
              highest: pricesWithValues.reduce((a, b) =>
                (a.price?.value ?? 0) > (b.price?.value ?? 0) ? a : b
              ),
            }
          : null;

      return JSON.stringify(
        {
          products,
          price_comparison: priceComparison,
        },
        null,
        2
      );
    },
  });

  // Resource: registry stats
  mcp.addResource({
    uri: "pkp://registry/stats",
    name: "Registry Statistics",
    description: "Current statistics about the PKP registry",
    mimeType: "application/json",
    async load() {
      const stats = await storage.getStats();
      return { text: JSON.stringify(stats, null, 2) };
    },
  });

  // Resource: catalog list
  mcp.addResource({
    uri: "pkp://registry/catalogs",
    name: "Registered Catalogs",
    description: "List of all registered PKP catalogs",
    mimeType: "application/json",
    async load() {
      const domains = await storage.getAllDomains();
      return {
        text: JSON.stringify(
          {
            count: domains.length,
            catalogs: domains.map((d) => ({
              domain: d.domain,
              publisher: d.publisher_name,
              products: d.product_count,
              categories: d.categories,
            })),
          },
          null,
          2
        ),
      };
    },
  });

  return mcp;
}
