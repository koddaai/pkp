import matter from "gray-matter";
import { PKPProductBase } from "./schemas/base.js";

/**
 * Parsed PRODUCT.md result
 */
export interface ParsedProduct {
  frontmatter: Record<string, unknown>;
  content: string;
  raw: string;
}

/**
 * Parse a PRODUCT.md string into frontmatter and content
 */
export function parseProductMd(markdown: string): ParsedProduct {
  const { data, content } = matter(markdown);
  return {
    frontmatter: data,
    content: content.trim(),
    raw: markdown,
  };
}

/**
 * Serialize a product object back to PRODUCT.md format
 */
export function serializeProduct(
  frontmatter: Record<string, unknown>,
  content: string
): string {
  return matter.stringify(content, frontmatter);
}

/**
 * Parse and validate a PRODUCT.md string
 */
export function parseAndValidateProductMd(markdown: string): {
  success: boolean;
  data?: PKPProductBase;
  error?: string;
  content?: string;
} {
  try {
    const parsed = parseProductMd(markdown);
    const result = PKPProductBase.safeParse(parsed.frontmatter);

    if (!result.success) {
      return {
        success: false,
        error: result.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("; "),
      };
    }

    return {
      success: true,
      data: result.data,
      content: parsed.content,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown parsing error",
    };
  }
}
