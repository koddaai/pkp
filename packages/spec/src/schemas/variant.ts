import { z } from "zod";

/**
 * Multi-standard identifiers for cross-domain matching
 */
export const PKPIdentifiers = z
  .object({
    mpn: z.string().optional(), // Manufacturer Part Number
    ean: z.string().optional(), // European Article Number
    asin: z.string().optional(), // Amazon Standard ID
    upc: z.string().optional(), // Universal Product Code
  })
  .optional();

export type PKPIdentifiers = z.infer<typeof PKPIdentifiers>;

/**
 * Variant schema for products with variations (color, size, storage)
 */
export const PKPVariant = z.object({
  family_id: z.string().optional(), // Groups all variants of same model
  variant_of: z.string().nullable().optional(), // SKU of parent (null = main model)
  variant_attributes: z.array(z.string()).optional(), // Axes of variation
});

export type PKPVariant = z.infer<typeof PKPVariant>;
