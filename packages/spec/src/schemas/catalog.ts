import { z } from "zod";
import { PKPPrice } from "./price.js";
import { PublisherType } from "./base.js";

/**
 * Publisher information in catalog
 */
export const PKPCatalogPublisher = z.object({
  name: z.string(),
  type: PublisherType,
  domain: z.string(),
  contact: z.string().email().optional(),
});
export type PKPCatalogPublisher = z.infer<typeof PKPCatalogPublisher>;

/**
 * Product entry in catalog (L0 data only)
 */
export const PKPCatalogProduct = z.object({
  sku: z.string(),
  uri: z.string().optional(), // pkp://{domain}/{sku}
  gtin: z.string().optional(),
  name: z.string(),
  category: z.string(),
  summary: z.string(),
  price: PKPPrice.optional(),
  confidence_source: z.string().optional(),
  completeness_score: z.number().min(0).max(1).optional(),
  url: z.string(), // Relative URL to PRODUCT.md
  updated_at: z.string().datetime().optional(),
});
export type PKPCatalogProduct = z.infer<typeof PKPCatalogProduct>;

/**
 * Shard reference (for large catalogs)
 */
export const PKPCatalogShard = z.object({
  category: z.string(),
  url: z.string(),
  count: z.number(),
});
export type PKPCatalogShard = z.infer<typeof PKPCatalogShard>;

/**
 * Catalog type
 */
export const CatalogType = z.enum(["catalog", "index"]);
export type CatalogType = z.infer<typeof CatalogType>;

/**
 * Full catalog schema (< 500 products) or shard index (> 500)
 */
export const PKPCatalog = z
  .object({
    schema: z.literal("pkp/1.0"),
    type: CatalogType.default("catalog"),
    publisher: PKPCatalogPublisher,
    categories: z.array(z.string()),
    total_products: z.number(),
    updated_at: z.string().datetime(),
    // type: "catalog" → inline list
    products: z.array(PKPCatalogProduct).optional(),
    // type: "index" → shard references
    shards: z.array(PKPCatalogShard).optional(),
  })
  .refine(
    (c) => {
      if (c.type === "catalog") return c.products != null && c.products.length > 0;
      if (c.type === "index") return c.shards != null && c.shards.length > 0;
      return true;
    },
    { message: "catalog needs products, index needs shards" }
  );

export type PKPCatalog = z.infer<typeof PKPCatalog>;
