#!/usr/bin/env node

import { Command } from "commander";
import {
  initCommand,
  validateCommand,
  buildCommand,
  serveCommand,
  generateCommand,
  statsCommand,
  diffCommand,
  publishCommand,
} from "./commands/index.js";

const program = new Command();

program
  .name("pkp")
  .description("CLI for Product Knowledge Protocol - Build AI-ready product catalogs")
  .version("0.1.0");

// Init command
program
  .command("init [directory]")
  .description("Initialize a new PKP catalog with config and example files")
  .action(async (directory?: string) => {
    await initCommand(directory);
  });

// Validate command
program
  .command("validate <path>")
  .description("Validate PRODUCT.md file(s)")
  .option("-v, --verbose", "Show detailed validation info", false)
  .option("-s, --strict", "Exit with error if any warnings", false)
  .action(async (path: string, options: { verbose: boolean; strict: boolean }) => {
    await validateCommand(path, options);
  });

// Build command
program
  .command("build [directory]")
  .description("Generate .well-known/pkp/ from PRODUCT.md files")
  .option("-o, --output <dir>", "Output directory")
  .option("-c, --config <file>", "Config file path")
  .option("-v, --verbose", "Show detailed build info", false)
  .action(async (directory: string | undefined, options: { output?: string; config?: string; verbose: boolean }) => {
    await buildCommand(directory, options);
  });

// Serve command
program
  .command("serve [directory]")
  .description("Serve PKP catalog locally for testing")
  .option("-p, --port <port>", "Port to serve on", "3000")
  .option("-h, --host <host>", "Host to bind to", "localhost")
  .action(async (directory: string | undefined, options: { port: string; host: string }) => {
    await serveCommand(directory, {
      port: parseInt(options.port, 10),
      host: options.host,
    });
  });

// Generate command - AI-powered PRODUCT.md generation
program
  .command("generate")
  .description("Generate PRODUCT.md from URL(s) using AI")
  .option("-u, --url <url>", "Product page URL")
  .option("-c, --category <category>", "Product category")
  .option("-b, --brand <brand>", "Brand name (optional)")
  .option("-o, --output <file>", "Output file path (single URL mode)")
  .option("-f, --file <file>", "Batch file with URLs (one per line)")
  .option("-d, --output-dir <dir>", "Output directory for batch mode", "./generated")
  .option("-n, --concurrency <n>", "Parallel requests for batch mode", "3")
  .option("-v, --verbose", "Show detailed output", false)
  .action(async (options: {
    url?: string;
    category?: string;
    brand?: string;
    output?: string;
    file?: string;
    outputDir?: string;
    concurrency?: string;
    verbose: boolean;
  }) => {
    await generateCommand({
      ...options,
      concurrency: options.concurrency ? parseInt(options.concurrency, 10) : 3,
    });
  });

// Stats command - Catalog statistics
program
  .command("stats [directory]")
  .description("Show statistics for a PKP catalog")
  .option("-v, --verbose", "Show detailed stats per file", false)
  .option("-j, --json", "Output as JSON", false)
  .action(async (directory: string | undefined, options: { verbose: boolean; json: boolean }) => {
    await statsCommand(directory, options);
  });

// Diff command - Compare PRODUCT.md files
program
  .command("diff <file1> <file2>")
  .description("Compare two PRODUCT.md files")
  .option("-v, --verbose", "Show detailed diff output", false)
  .option("-j, --json", "Output as JSON", false)
  .action(async (file1: string, file2: string, options: { verbose: boolean; json: boolean }) => {
    await diffCommand(file1, file2, options);
  });

// Publish command - Deploy catalog
program
  .command("publish <target>")
  .description("Publish PKP catalog to a directory")
  .option("-s, --source <dir>", "Source directory", "./dist")
  .option("-v, --verbose", "Show detailed output", false)
  .option("-n, --dry-run", "Show what would be published without copying", false)
  .action(async (target: string, options: { source: string; verbose: boolean; dryRun: boolean }) => {
    await publishCommand(options.source, target, {
      verbose: options.verbose,
      dryRun: options.dryRun,
    });
  });

export function run(): void {
  program.parse();
}

// Run if executed directly
run();
