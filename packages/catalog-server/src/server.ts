/**
 * Catalog MCP Server
 *
 * MCP Server for serving PKP catalog data
 */

import { FastMCP } from "fastmcp";
import { z } from "zod";
import { loadCatalog } from "./loader.js";
import {
  searchProducts,
  getProduct,
  listCategories,
  listBrands,
  compareProducts,
  getProductsByCategory,
} from "./search.js";
import type { LoadedCatalog } from "./types.js";

export interface CatalogServerOptions {
  /** Directory containing the catalog */
  catalogDir: string;
  /** Server name */
  name?: string;
  /** Server version */
  version?: string;
}

/**
 * Create a PKP Catalog MCP Server
 */
export function createCatalogServer(options: CatalogServerOptions): FastMCP {
  const { catalogDir, name = "PKP Catalog Server", version = "1.0.0" } = options;

  let catalog: LoadedCatalog | null = null;

  const mcp = new FastMCP({
    name,
    version: version as `${number}.${number}.${number}`,
  });

  // Helper to ensure catalog is loaded
  async function ensureCatalog(): Promise<LoadedCatalog> {
    if (!catalog) {
      catalog = await loadCatalog(catalogDir);
    }
    return catalog;
  }

  // Tool: search_products
  mcp.addTool({
    name: "search_products",
    description:
      "Search for products in the catalog. Returns matching products with relevance scores.",
    parameters: z.object({
      query: z
        .string()
        .optional()
        .describe("Text to search for in product names, descriptions, and tags"),
      category: z.string().optional().describe("Filter by category"),
      brand: z.string().optional().describe("Filter by brand"),
      min_price: z.number().optional().describe("Minimum price filter"),
      max_price: z.number().optional().describe("Maximum price filter"),
      tags: z.array(z.string()).optional().describe("Filter by tags (all must match)"),
      limit: z.number().optional().default(10).describe("Maximum results to return"),
      offset: z.number().optional().default(0).describe("Offset for pagination"),
    }),
    execute: async (args) => {
      const cat = await ensureCatalog();
      const results = searchProducts(cat, {
        query: args.query,
        category: args.category,
        brand: args.brand,
        minPrice: args.min_price,
        maxPrice: args.max_price,
        tags: args.tags,
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

  // Tool: get_product
  mcp.addTool({
    name: "get_product",
    description:
      "Get full details for a specific product by SKU. Returns complete product information including specs, price, and narrative content.",
    parameters: z.object({
      sku: z.string().describe("The product SKU to retrieve"),
    }),
    execute: async (args) => {
      const cat = await ensureCatalog();
      const product = getProduct(cat, args.sku);

      if (!product) {
        return JSON.stringify({ error: `Product not found: ${args.sku}` });
      }

      return JSON.stringify(
        {
          sku: product.product.sku,
          name: product.product.name,
          brand: product.product.brand,
          category: product.product.category,
          subcategory: product.product.subcategory,
          summary: product.entry.summary,
          price: product.product.price,
          availability: product.product.availability,
          specs: product.product.specs,
          highlights: product.product.highlights,
          target_audience: product.product.target_audience,
          use_cases: product.product.use_cases,
          relationships: product.product.relationships,
          reviews: product.product.reviews,
          confidence: product.product.confidence,
          canonical: product.product.canonical,
          content: product.content,
        },
        null,
        2
      );
    },
  });

  // Tool: compare_products
  mcp.addTool({
    name: "compare_products",
    description:
      "Compare multiple products side by side. Returns specs differences and similarities.",
    parameters: z.object({
      skus: z
        .array(z.string())
        .min(2)
        .max(5)
        .describe("List of product SKUs to compare (2-5 products)"),
    }),
    execute: async (args) => {
      const cat = await ensureCatalog();
      const comparison = compareProducts(cat, args.skus);

      if (!comparison) {
        return JSON.stringify({
          error: "One or more products not found",
        });
      }

      return JSON.stringify(comparison, null, 2);
    },
  });

  // Tool: list_categories
  mcp.addTool({
    name: "list_categories",
    description: "List all product categories in the catalog.",
    parameters: z.object({}),
    execute: async () => {
      const cat = await ensureCatalog();
      const categories = listCategories(cat);

      return JSON.stringify(
        {
          count: categories.length,
          categories: categories.map((c) => ({
            name: c,
            product_count: getProductsByCategory(cat, c).length,
          })),
        },
        null,
        2
      );
    },
  });

  // Tool: list_brands
  mcp.addTool({
    name: "list_brands",
    description: "List all brands in the catalog.",
    parameters: z.object({}),
    execute: async () => {
      const cat = await ensureCatalog();
      const brands = listBrands(cat);

      return JSON.stringify(
        {
          count: brands.length,
          brands,
        },
        null,
        2
      );
    },
  });

  // Tool: get_catalog_info
  mcp.addTool({
    name: "get_catalog_info",
    description: "Get information about the catalog including publisher and statistics.",
    parameters: z.object({}),
    execute: async () => {
      const cat = await ensureCatalog();

      return JSON.stringify(
        {
          publisher: cat.catalog.publisher,
          total_products: cat.catalog.total_products,
          categories: cat.catalog.categories,
          updated_at: cat.catalog.updated_at,
        },
        null,
        2
      );
    },
  });

  // Tool: get_product_faq
  mcp.addTool({
    name: "get_product_faq",
    description:
      "Get FAQ section from a product's markdown content. Useful for answering common questions.",
    parameters: z.object({
      sku: z.string().describe("The product SKU"),
    }),
    execute: async (args) => {
      const cat = await ensureCatalog();
      const product = getProduct(cat, args.sku);

      if (!product) {
        return JSON.stringify({ error: `Product not found: ${args.sku}` });
      }

      // Extract FAQ section from markdown content
      const content = product.content;
      const faqMatch = content.match(/## FAQ\s*\n([\s\S]*?)(?=\n## |$)/i);

      if (!faqMatch) {
        return JSON.stringify({
          sku: args.sku,
          faq: null,
          message: "No FAQ section found in product content",
        });
      }

      // Parse Q&A pairs
      const faqContent = faqMatch[1] ?? "";
      const qaPattern = /### (.+?)\n([\s\S]*?)(?=\n### |$)/g;
      const faqs: Array<{ question: string; answer: string }> = [];

      let match;
      while ((match = qaPattern.exec(faqContent)) !== null) {
        const question = match[1];
        const answer = match[2];
        if (question && answer) {
          faqs.push({
            question: question.trim(),
            answer: answer.trim(),
          });
        }
      }

      return JSON.stringify(
        {
          sku: args.sku,
          name: product.product.name,
          faq: faqs,
        },
        null,
        2
      );
    },
  });

  // Tool: get_alternatives
  mcp.addTool({
    name: "get_alternatives",
    description:
      "Get alternative products for a given product. Includes direct alternatives and similar products in the same category.",
    parameters: z.object({
      sku: z.string().describe("The product SKU to find alternatives for"),
    }),
    execute: async (args) => {
      const cat = await ensureCatalog();
      const product = getProduct(cat, args.sku);

      if (!product) {
        return JSON.stringify({ error: `Product not found: ${args.sku}` });
      }

      // Get declared alternatives
      const declaredAlternatives = product.product.relationships?.alternatives || [];

      // Find similar products in the same category (excluding the current product)
      const categoryProducts = getProductsByCategory(cat, product.product.category)
        .filter((p) => p.product.sku !== product.product.sku)
        .slice(0, 5);

      return JSON.stringify(
        {
          sku: args.sku,
          name: product.product.name,
          declared_alternatives: declaredAlternatives,
          similar_in_category: categoryProducts.map((p) => ({
            sku: p.product.sku,
            name: p.product.name,
            brand: p.product.brand,
            price: p.product.price,
          })),
        },
        null,
        2
      );
    },
  });

  // Resource: catalog
  mcp.addResource({
    uri: "pkp://catalog",
    name: "Product Catalog",
    description: "The full product catalog metadata",
    mimeType: "application/json",
    async load() {
      const cat = await ensureCatalog();
      return {
        text: JSON.stringify(
          {
            publisher: cat.catalog.publisher,
            total_products: cat.catalog.total_products,
            categories: cat.catalog.categories,
            updated_at: cat.catalog.updated_at,
            products: cat.catalog.products?.map((p) => ({
              sku: p.sku,
              name: p.name,
              category: p.category,
              summary: p.summary,
            })),
          },
          null,
          2
        ),
      };
    },
  });

  // Resource template: product by SKU
  mcp.addResourceTemplate({
    uriTemplate: "pkp://product/{sku}",
    name: "Product Details",
    description: "Get full product details by SKU",
    mimeType: "text/markdown",
    arguments: [{ name: "sku", description: "Product SKU" }],
    async load({ sku }) {
      const cat = await ensureCatalog();
      const skuValue = sku as string;
      const product = getProduct(cat, skuValue);

      if (!product) {
        throw new Error(`Product not found: ${skuValue}`);
      }

      return { text: product.raw };
    },
  });

  return mcp;
}
