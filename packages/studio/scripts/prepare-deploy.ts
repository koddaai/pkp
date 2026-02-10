#!/usr/bin/env tsx
/**
 * Prepare Studio for deployment
 * Copies catalog manifest into public folder for static serving
 */

import { copyFile, mkdir, writeFile } from "fs/promises";
import { existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STUDIO_ROOT = join(__dirname, "..");
const CATALOG_PATH = join(STUDIO_ROOT, "..", "..", "examples", "kodda-catalog");
const PUBLIC_DATA = join(STUDIO_ROOT, "public", "data");

async function main() {
  console.log("Preparing Studio for deployment...\n");

  // Create public/data directory
  if (!existsSync(PUBLIC_DATA)) {
    await mkdir(PUBLIC_DATA, { recursive: true });
    console.log("Created public/data directory");
  }

  // Copy manifest.json
  const manifestSrc = join(CATALOG_PATH, "manifest.json");
  const manifestDest = join(PUBLIC_DATA, "manifest.json");

  if (existsSync(manifestSrc)) {
    await copyFile(manifestSrc, manifestDest);
    console.log("Copied manifest.json to public/data/");
  } else {
    console.error("Warning: manifest.json not found at", manifestSrc);
    console.log("Run: npx tsx scripts/build-manifest.ts --catalog ./examples/kodda-catalog");
  }

  // Create empty analytics.json for initial state
  const analyticsPath = join(PUBLIC_DATA, "analytics.json");
  if (!existsSync(analyticsPath)) {
    const emptyAnalytics = {
      events: [],
      summary: {
        total_requests: 0,
        by_agent: {},
        by_product: {},
        by_day: {},
      },
    };
    await writeFile(analyticsPath, JSON.stringify(emptyAnalytics, null, 2));
    console.log("Created empty analytics.json");
  }

  console.log("\nDone! Ready for deployment.");
}

main().catch(console.error);
