import { z } from "zod";

/**
 * Aggregated review data
 */
export const PKPReviews = z
  .object({
    average_rating: z.number().min(0).max(5),
    total_reviews: z.number().int().min(0),
    source: z.string().optional(), // "multiple", "amazon", etc
    highlights_positive: z.array(z.string()).optional(),
    highlights_negative: z.array(z.string()).optional(),
  })
  .optional();

export type PKPReviews = z.infer<typeof PKPReviews>;
