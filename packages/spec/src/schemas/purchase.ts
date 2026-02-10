import { z } from "zod";

/**
 * Purchase URL entry
 */
export const PurchaseUrl = z.object({
  retailer: z.string(),
  url: z.string().url(),
  ap2_enabled: z.boolean().default(false),
});
export type PurchaseUrl = z.infer<typeof PurchaseUrl>;

/**
 * Array of purchase URLs
 */
export const PKPPurchaseUrls = z.array(PurchaseUrl).optional();
export type PKPPurchaseUrls = z.infer<typeof PKPPurchaseUrls>;
