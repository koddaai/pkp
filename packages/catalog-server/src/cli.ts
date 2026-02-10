#!/usr/bin/env node

/**
 * PKP Catalog Server CLI
 *
 * Usage: pkp-catalog-server <catalog-dir>
 */

import { createCatalogServer } from "./server.js";

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    console.log(`
PKP Catalog Server - MCP Server for Product Knowledge Protocol

Usage: pkp-catalog-server <catalog-dir> [options]

Arguments:
  catalog-dir    Directory containing the PKP catalog
                 (must have .well-known/pkp/catalog.json)

Options:
  --name <name>     Server name (default: "PKP Catalog Server")
  --version <ver>   Server version (default: "1.0.0")
  -h, --help        Show this help message

Example:
  pkp-catalog-server ./dist
  pkp-catalog-server ./my-catalog --name "My Store Catalog"

The server runs over stdio and can be used with any MCP-compatible client.
`);
    process.exit(0);
  }

  const catalogDir = args[0]!;

  // Parse options
  let name = "PKP Catalog Server";
  let version = "1.0.0";

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];
    if (arg === "--name" && nextArg) {
      name = nextArg;
      i++;
    } else if (arg === "--version" && nextArg) {
      version = nextArg;
      i++;
    }
  }

  try {
    const server = createCatalogServer({
      catalogDir,
      name,
      version,
    });

    // Start the server
    await server.start({
      transportType: "stdio",
    });
  } catch (error) {
    console.error("Error starting server:", error);
    process.exit(1);
  }
}

main();
