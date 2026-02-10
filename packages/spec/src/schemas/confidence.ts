import { z } from "zod";

/**
 * Confidence levels for PKP data
 */
export const ConfidenceLevel = z.enum(["high", "medium", "low"]);
export type ConfidenceLevel = z.infer<typeof ConfidenceLevel>;

/**
 * Source of confidence data
 * Hierarchy: manufacturer > retailer-feed > community > ai-generated > scraped
 */
export const ConfidenceSource = z.enum([
  "manufacturer",
  "retailer-feed",
  "community",
  "ai-generated",
  "scraped",
]);
export type ConfidenceSource = z.infer<typeof ConfidenceSource>;

/**
 * Confidence block for any data section
 */
export const ConfidenceBlock = z.object({
  level: ConfidenceLevel,
  source: ConfidenceSource,
  verified_at: z.string().datetime(),
});
export type ConfidenceBlock = z.infer<typeof ConfidenceBlock>;

/**
 * Product-level confidence (multiple sections)
 */
export const PKPConfidence = z.object({
  specs: ConfidenceBlock.optional(),
  price: ConfidenceBlock.optional(),
  alternatives: ConfidenceBlock.optional(),
});
export type PKPConfidence = z.infer<typeof PKPConfidence>;

/**
 * Source precedence for canonical resolution
 */
export const SOURCE_PRECEDENCE: Record<ConfidenceSource, number> = {
  manufacturer: 5,
  "retailer-feed": 4,
  community: 3,
  "ai-generated": 2,
  scraped: 1,
};
