/**
 * Studio configuration for different environments
 */

const isVercel = process.env.VERCEL === "1";
const isProduction = process.env.NODE_ENV === "production";

export const config = {
  isVercel,
  isProduction,

  // Default catalog path (can be overridden via query param)
  defaultCatalogPath: process.env.CATALOG_PATH || "examples/kodda-catalog",

  // Analytics settings
  analytics: {
    // In production/Vercel, analytics are read-only (demo mode)
    // In development, full read/write
    enabled: true,
    writeEnabled: !isVercel,
  },
};
