#!/usr/bin/env node

/**
 * PKP Registry Server CLI
 *
 * Usage: pkp-registry-server [options]
 */

import { createRegistryServer } from "./server.js";
import type { StorageConfig } from "./storage/interface.js";

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
PKP Registry Server - MCP Server for global PKP product discovery

Usage: pkp-registry-server [options]

Options:
  --domain <domain>      Add a domain to index on startup (can be repeated)
  --name <name>          Server name (default: "PKP Registry Server")
  --version <ver>        Server version (default: "1.0.0")

  Storage Options:
  --storage <type>       Storage backend: "memory" or "postgresql" (default: "memory")
  --pg-host <host>       PostgreSQL host (default: "localhost")
  --pg-port <port>       PostgreSQL port (default: 5432)
  --pg-database <db>     PostgreSQL database name
  --pg-user <user>       PostgreSQL user
  --pg-password <pass>   PostgreSQL password (or use PGPASSWORD env var)
  --pg-ssl               Enable SSL for PostgreSQL connection

  -h, --help             Show this help message

Environment Variables:
  PGHOST                 PostgreSQL host
  PGPORT                 PostgreSQL port
  PGDATABASE             PostgreSQL database
  PGUSER                 PostgreSQL user
  PGPASSWORD             PostgreSQL password

Example:
  # In-memory storage (default)
  pkp-registry-server --domain pkp.kodda.ai

  # PostgreSQL storage
  pkp-registry-server --storage postgresql --pg-database pkp --pg-user pkp

  # Using environment variables
  PGDATABASE=pkp PGUSER=pkp pkp-registry-server --storage postgresql

The server runs over stdio and can be used with any MCP-compatible client.
You can also register domains dynamically using the register_catalog tool.
`);
    process.exit(0);
  }

  // Parse options
  const domains: string[] = [];
  let name = "PKP Registry Server";
  let version = "1.0.0";
  let storageType: "memory" | "postgresql" = "memory";
  let pgHost = process.env.PGHOST || "localhost";
  let pgPort = parseInt(process.env.PGPORT || "5432", 10);
  let pgDatabase = process.env.PGDATABASE || "";
  let pgUser = process.env.PGUSER || "";
  let pgPassword = process.env.PGPASSWORD || "";
  let pgSsl = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    if (arg === "--domain" && nextArg) {
      domains.push(nextArg);
      i++;
    } else if (arg === "--name" && nextArg) {
      name = nextArg;
      i++;
    } else if (arg === "--version" && nextArg) {
      version = nextArg;
      i++;
    } else if (arg === "--storage" && nextArg) {
      if (nextArg === "postgresql" || nextArg === "memory") {
        storageType = nextArg;
      } else {
        console.error(`Invalid storage type: ${nextArg}. Use "memory" or "postgresql".`);
        process.exit(1);
      }
      i++;
    } else if (arg === "--pg-host" && nextArg) {
      pgHost = nextArg;
      i++;
    } else if (arg === "--pg-port" && nextArg) {
      pgPort = parseInt(nextArg, 10);
      i++;
    } else if (arg === "--pg-database" && nextArg) {
      pgDatabase = nextArg;
      i++;
    } else if (arg === "--pg-user" && nextArg) {
      pgUser = nextArg;
      i++;
    } else if (arg === "--pg-password" && nextArg) {
      pgPassword = nextArg;
      i++;
    } else if (arg === "--pg-ssl") {
      pgSsl = true;
    }
  }

  // Build storage config
  let storage: StorageConfig = { type: "memory" };

  if (storageType === "postgresql") {
    if (!pgDatabase) {
      console.error("PostgreSQL database name is required. Use --pg-database or PGDATABASE env var.");
      process.exit(1);
    }
    if (!pgUser) {
      console.error("PostgreSQL user is required. Use --pg-user or PGUSER env var.");
      process.exit(1);
    }

    storage = {
      type: "postgresql",
      postgresql: {
        host: pgHost,
        port: pgPort,
        database: pgDatabase,
        user: pgUser,
        password: pgPassword,
        ssl: pgSsl,
      },
    };

    console.error(`[Registry] Using PostgreSQL storage: ${pgUser}@${pgHost}:${pgPort}/${pgDatabase}`);
  } else {
    console.error("[Registry] Using in-memory storage");
  }

  try {
    const server = await createRegistryServer({
      name,
      version,
      domains,
      storage,
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
