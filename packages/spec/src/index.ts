/**
 * @pkprotocol/spec - PKP Specification Package
 *
 * Schemas, parser, and validator for Product Knowledge Protocol
 */

// Core Schemas
export * from "./schemas/confidence.js";
export * from "./schemas/price.js";
export * from "./schemas/purchase.js";
export * from "./schemas/canonical.js";
export * from "./schemas/variant.js";
export * from "./schemas/narrative.js";
export * from "./schemas/reviews.js";
export * from "./schemas/base.js";
export * from "./schemas/catalog.js";

// Category Schemas
export * from "./schemas/categories/index.js";

// Parser
export * from "./parser.js";

// Validator
export * from "./validator.js";

// Version
export const PKP_SPEC_VERSION = "1.0";
