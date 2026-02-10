import { z } from "zod";
import { PKPConfidence } from "./confidence.js";
import { PKPPrice } from "./price.js";
import { PKPPurchaseUrls } from "./purchase.js";
import { PKPCanonical, ProductURI } from "./canonical.js";
import { PKPIdentifiers } from "./variant.js";
import { PKPReviews } from "./reviews.js";
import { PKPPreferredTerm } from "./narrative.js";

/**
 * Availability status
 */
export const Availability = z.enum([
  "in-stock",
  "out-of-stock",
  "pre-order",
  "discontinued",
  "unknown",
]);
export type Availability = z.infer<typeof Availability>;

/**
 * Publisher type for precedence resolution
 */
export const PublisherType = z.enum(["manufacturer", "retailer", "aggregator", "community"]);
export type PublisherType = z.infer<typeof PublisherType>;

/**
 * Alternative product reference
 */
export const PKPAlternative = z.object({
  sku: z.string(),
  brand: z.string(),
  reason: z.string(),
});
export type PKPAlternative = z.infer<typeof PKPAlternative>;

/**
 * Accessory query
 */
export const PKPAccessory = z.object({
  category: z.string(),
  query: z.string(),
});
export type PKPAccessory = z.infer<typeof PKPAccessory>;

/**
 * Relationships section
 */
export const PKPRelationships = z.object({
  replaces: z.array(z.string()).optional(),
  alternatives: z.array(PKPAlternative).optional(),
  accessories: z.array(PKPAccessory).optional(),
});
export type PKPRelationships = z.infer<typeof PKPRelationships>;

/**
 * Base PKP Product schema (category-agnostic)
 */
export const PKPProductBase = z.object({
  // Schema version
  schema: z.literal("pkp/1.0"),

  // Identity
  sku: z.string(),
  gtin: z.string().optional(),
  brand: z.string(),
  name: z.string(),
  category: z.string(),
  subcategory: z.string().optional(),

  // Additional identifiers
  identifiers: PKPIdentifiers,

  // Variants
  family_id: z.string().optional(),
  variant_of: z.string().nullable().optional(),
  variant_attributes: z.array(z.string()).optional(),

  // Canonical URI
  uri: ProductURI.optional(),
  canonical: PKPCanonical,

  // Discovery (L0)
  summary: z.string(),
  tags: z.array(z.string()).optional(),
  target_audience: z.array(z.string()).optional(),
  use_cases: z.array(z.string()).optional(),

  // Price
  price: PKPPrice.optional(),
  availability: Availability.optional(),
  launch_date: z.string().optional(),

  // Purchase
  purchase_urls: PKPPurchaseUrls,

  // Confidence
  confidence: PKPConfidence.optional(),

  // Specs (L1) - category-specific, validated separately
  specs: z.record(z.unknown()).optional(),

  // Relationships
  relationships: PKPRelationships.optional(),

  // Narrative (supplier-controlled)
  highlights: z.array(z.string()).optional(),
  preferred_terms: z.array(PKPPreferredTerm).optional(),

  // Reviews
  reviews: PKPReviews,
});

export type PKPProductBase = z.infer<typeof PKPProductBase>;
