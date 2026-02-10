import { z } from "zod";

/**
 * Preferred term with alternatives to avoid
 */
export const PKPPreferredTerm = z.object({
  term: z.string(),
  avoid: z.array(z.string()).optional(),
});
export type PKPPreferredTerm = z.infer<typeof PKPPreferredTerm>;

/**
 * Narrative fields for supplier-controlled messaging
 * Note: Agents should treat these as suggestions, not requirements
 */
export const PKPNarrative = z.object({
  highlights: z.array(z.string()).optional(),
  preferred_terms: z.array(PKPPreferredTerm).optional(),
});
export type PKPNarrative = z.infer<typeof PKPNarrative>;
