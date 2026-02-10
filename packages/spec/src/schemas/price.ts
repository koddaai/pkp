import { z } from "zod";

/**
 * Price type enum
 */
export const PriceType = z.enum(["msrp", "street", "range", "unknown"]);
export type PriceType = z.infer<typeof PriceType>;

/**
 * Price source
 */
export const PriceSource = z.enum(["manufacturer", "retailer", "inferred"]);
export type PriceSource = z.infer<typeof PriceSource>;

/**
 * PKP Price schema
 */
export const PKPPrice = z
  .object({
    type: PriceType,
    currency: z.string().default("BRL"),
    value: z.number().positive().optional(),
    min: z.number().positive().optional(),
    max: z.number().positive().optional(),
    map: z.number().positive().optional(), // Minimum Advertised Price
    source: PriceSource,
    updated_at: z.string().datetime(),
  })
  .refine(
    (p) => {
      if (p.type === "msrp" || p.type === "street") return p.value != null;
      if (p.type === "range") return p.min != null && p.max != null;
      return true; // 'unknown' doesn't require values
    },
    { message: "Price fields must match type" }
  );

export type PKPPrice = z.infer<typeof PKPPrice>;
