import { PKPProductBase } from "./schemas/base.js";
import { parseProductMd } from "./parser.js";
import {
  getCategoryMeta,
  getCategoryMinCompleteness,
  getCategoryRequiredSpecs,
  validateCategorySpecs,
} from "./schemas/categories/index.js";

/**
 * Default completeness threshold
 */
const DEFAULT_THRESHOLD = 0.6;

/**
 * Core fields for completeness calculation
 */
const CORE_FIELDS = [
  "sku",
  "brand",
  "name",
  "category",
  "summary",
  "price",
  "confidence",
  "specs",
] as const;

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  completeness: number;
  meetsThreshold: boolean;
  threshold: number;
  categoryMeta?: {
    category: string;
    minCompleteness: number;
    requiredSpecs: string[];
  };
}

/**
 * Calculate completeness score (0-1)
 */
export function calculateCompleteness(data: Record<string, unknown>): number {
  let filled = 0;
  for (const field of CORE_FIELDS) {
    const value = data[field];
    if (value !== undefined && value !== null && value !== "") {
      filled++;
    }
  }
  return filled / CORE_FIELDS.length;
}

/**
 * Get completeness threshold for a category
 * Now uses category metadata from schemas
 */
export function getCategoryThreshold(category: string): number {
  return getCategoryMinCompleteness(category);
}

/**
 * Check if required specs are present
 */
function checkRequiredSpecs(
  specs: Record<string, unknown> | undefined,
  requiredSpecs: string[]
): string[] {
  if (!specs) {
    if (requiredSpecs.length > 0) {
      return ["specs: Missing required specs object"];
    }
    return [];
  }

  const missing: string[] = [];

  for (const path of requiredSpecs) {
    const parts = path.split(".");
    let current: unknown = specs;

    for (const part of parts) {
      if (current === null || current === undefined || typeof current !== "object") {
        missing.push(`specs.${path}: Required field missing`);
        break;
      }
      current = (current as Record<string, unknown>)[part];
    }

    if (current === undefined || current === null) {
      if (!missing.includes(`specs.${path}: Required field missing`)) {
        missing.push(`specs.${path}: Required field missing`);
      }
    }
  }

  return missing;
}

/**
 * Validate a product object
 */
export function validateProduct(data: Record<string, unknown>): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Parse with Zod (base schema)
  const result = PKPProductBase.safeParse(data);

  if (!result.success) {
    for (const error of result.error.errors) {
      errors.push(`${error.path.join(".")}: ${error.message}`);
    }
  }

  // Get category info
  const category = typeof data.category === "string" ? data.category : "";
  const subcategory = typeof data.subcategory === "string" ? data.subcategory : undefined;
  const categoryMeta = getCategoryMeta(category);
  const threshold = getCategoryMinCompleteness(category);
  const requiredSpecs = getCategoryRequiredSpecs(category, subcategory);

  // Validate category-specific specs
  if (data.specs && categoryMeta) {
    const specsValidation = validateCategorySpecs(category, subcategory, data.specs);
    if (!specsValidation.valid) {
      // Add as warnings, not errors (category specs are recommendations)
      warnings.push(...specsValidation.errors);
    }
  }

  // Check required specs
  const missingSpecs = checkRequiredSpecs(
    data.specs as Record<string, unknown> | undefined,
    requiredSpecs
  );
  if (missingSpecs.length > 0) {
    warnings.push(...missingSpecs);
  }

  // Calculate completeness
  const completeness = calculateCompleteness(data);

  // Check completeness
  const meetsThreshold = completeness >= threshold;
  if (!meetsThreshold) {
    warnings.push(
      `Completeness ${(completeness * 100).toFixed(0)}% is below threshold ${(threshold * 100).toFixed(0)}% for category "${category}"`
    );
  }

  // Additional warnings
  if (!data.confidence) {
    warnings.push("Missing confidence block - source and verification unknown");
  }

  if (!data.price) {
    warnings.push("Missing price information");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    completeness,
    meetsThreshold,
    threshold,
    categoryMeta: categoryMeta
      ? {
          category: categoryMeta.category,
          minCompleteness: categoryMeta.min_completeness,
          requiredSpecs: [...requiredSpecs],
        }
      : undefined,
  };
}

/**
 * Validate a PRODUCT.md string
 */
export function validateProductMd(markdown: string): ValidationResult {
  try {
    const parsed = parseProductMd(markdown);
    return validateProduct(parsed.frontmatter);
  } catch (err) {
    return {
      valid: false,
      errors: [err instanceof Error ? err.message : "Failed to parse PRODUCT.md"],
      warnings: [],
      completeness: 0,
      meetsThreshold: false,
      threshold: DEFAULT_THRESHOLD,
    };
  }
}

/**
 * Validate multiple products and return summary
 */
export function validateProducts(
  products: Array<{ name: string; data: Record<string, unknown> }>
): {
  total: number;
  valid: number;
  invalid: number;
  belowThreshold: number;
  results: Array<{ name: string; result: ValidationResult }>;
} {
  const results = products.map((p) => ({
    name: p.name,
    result: validateProduct(p.data),
  }));

  return {
    total: results.length,
    valid: results.filter((r) => r.result.valid).length,
    invalid: results.filter((r) => !r.result.valid).length,
    belowThreshold: results.filter((r) => !r.result.meetsThreshold).length,
    results,
  };
}
