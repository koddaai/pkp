import { z } from "zod";

/**
 * Canonical reference pointing to the authoritative source
 */
export const PKPCanonical = z
  .object({
    domain: z.string(),
    url: z.string(),
  })
  .optional();

export type PKPCanonical = z.infer<typeof PKPCanonical>;

/**
 * Product URI format: pkp://{domain}/{sku}
 */
export const ProductURI = z
  .string()
  .regex(/^pkp:\/\/[^/]+\/.+$/, "Invalid Product URI format. Expected: pkp://{domain}/{sku}");

export type ProductURI = z.infer<typeof ProductURI>;

/**
 * Parse a Product URI into components
 */
export function parseProductURI(uri: string): { domain: string; sku: string } | null {
  const match = uri.match(/^pkp:\/\/([^/]+)\/(.+)$/);
  if (!match) return null;
  return { domain: match[1]!, sku: match[2]! };
}

/**
 * Build a Product URI from components
 */
export function buildProductURI(domain: string, sku: string): string {
  return `pkp://${domain}/${sku}`;
}
