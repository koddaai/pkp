import { readFile, readdir } from "node:fs/promises";
import { join, extname, relative } from "node:path";
import chalk from "chalk";
import { parseProductMd, validateProductMd, calculateCompleteness } from "@pkprotocol/spec";

export interface StatsOptions {
  verbose?: boolean;
  json?: boolean;
}

interface ProductStats {
  sku: string;
  name: string;
  category: string;
  completeness: number;
  confidence?: string;
  hasPrice: boolean;
  hasImages: boolean;
  valid: boolean;
}

interface CatalogStats {
  totalProducts: number;
  validProducts: number;
  invalidProducts: number;
  categories: Record<string, number>;
  completeness: {
    average: number;
    min: number;
    max: number;
    distribution: Record<string, number>;
  };
  confidence: Record<string, number>;
  withPrice: number;
  withImages: number;
}

/**
 * Find all .md files in a directory recursively
 */
async function findMarkdownFiles(dir: string): Promise<string[]> {
  const files: string[] = [];

  async function scan(currentDir: string): Promise<void> {
    try {
      const entries = await readdir(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(currentDir, entry.name);

        if (entry.isDirectory()) {
          if (!entry.name.startsWith(".") && entry.name !== "node_modules" && entry.name !== "dist") {
            await scan(fullPath);
          }
        } else if (entry.isFile() && extname(entry.name) === ".md") {
          files.push(fullPath);
        }
      }
    } catch {
      // Directory doesn't exist or can't be read
    }
  }

  await scan(dir);
  return files;
}

/**
 * Parse a PRODUCT.md file and extract stats
 */
async function parseProductStats(filePath: string): Promise<ProductStats | null> {
  try {
    const content = await readFile(filePath, "utf-8");
    const validation = validateProductMd(content);
    const parsed = parseProductMd(content);
    const frontmatter = parsed.frontmatter;

    return {
      sku: (frontmatter.sku as string) || "unknown",
      name: (frontmatter.name as string) || "Unknown",
      category: (frontmatter.category as string) || "uncategorized",
      completeness: Math.round(calculateCompleteness(frontmatter) * 100),
      confidence: (frontmatter.confidence as { specs?: { source?: string } })?.specs?.source,
      hasPrice: !!frontmatter.price,
      hasImages: !!(frontmatter.images && (frontmatter.images as string[]).length > 0),
      valid: validation.valid,
    };
  } catch {
    return null;
  }
}

/**
 * Calculate catalog statistics
 */
function calculateCatalogStats(products: ProductStats[]): CatalogStats {
  const stats: CatalogStats = {
    totalProducts: products.length,
    validProducts: products.filter((p) => p.valid).length,
    invalidProducts: products.filter((p) => !p.valid).length,
    categories: {},
    completeness: {
      average: 0,
      min: 100,
      max: 0,
      distribution: {
        "0-25%": 0,
        "26-50%": 0,
        "51-75%": 0,
        "76-100%": 0,
      },
    },
    confidence: {},
    withPrice: 0,
    withImages: 0,
  };

  if (products.length === 0) return stats;

  let totalCompleteness = 0;

  for (const product of products) {
    // Categories
    stats.categories[product.category] = (stats.categories[product.category] || 0) + 1;

    // Completeness
    totalCompleteness += product.completeness;
    if (product.completeness < stats.completeness.min) stats.completeness.min = product.completeness;
    if (product.completeness > stats.completeness.max) stats.completeness.max = product.completeness;

    // Completeness distribution
    const dist = stats.completeness.distribution;
    if (product.completeness <= 25) {
      dist["0-25%"] = (dist["0-25%"] || 0) + 1;
    } else if (product.completeness <= 50) {
      dist["26-50%"] = (dist["26-50%"] || 0) + 1;
    } else if (product.completeness <= 75) {
      dist["51-75%"] = (dist["51-75%"] || 0) + 1;
    } else {
      dist["76-100%"] = (dist["76-100%"] || 0) + 1;
    }

    // Confidence
    const conf = product.confidence || "unknown";
    stats.confidence[conf] = (stats.confidence[conf] || 0) + 1;

    // Price & Images
    if (product.hasPrice) stats.withPrice++;
    if (product.hasImages) stats.withImages++;
  }

  stats.completeness.average = Math.round(totalCompleteness / products.length);

  return stats;
}

/**
 * Print statistics in human-readable format
 */
function printStats(stats: CatalogStats, verbose: boolean): void {
  console.log(chalk.blue("\n📊 Catalog Statistics\n"));

  // Overview
  console.log(chalk.bold("Overview:"));
  console.log(`  Total products:    ${chalk.cyan(stats.totalProducts)}`);
  console.log(`  Valid:             ${chalk.green(stats.validProducts)}`);
  if (stats.invalidProducts > 0) {
    console.log(`  Invalid:           ${chalk.red(stats.invalidProducts)}`);
  }
  console.log(`  With price:        ${chalk.cyan(stats.withPrice)} (${Math.round((stats.withPrice / stats.totalProducts) * 100)}%)`);
  console.log(`  With images:       ${chalk.cyan(stats.withImages)} (${Math.round((stats.withImages / stats.totalProducts) * 100)}%)`);

  // Categories
  console.log(chalk.bold("\nCategories:"));
  const sortedCategories = Object.entries(stats.categories).sort((a, b) => b[1] - a[1]);
  for (const [category, count] of sortedCategories) {
    const percentage = Math.round((count / stats.totalProducts) * 100);
    const bar = "█".repeat(Math.round(percentage / 5)) + "░".repeat(20 - Math.round(percentage / 5));
    console.log(`  ${chalk.cyan(category.padEnd(25))} ${bar} ${count} (${percentage}%)`);
  }

  // Completeness
  console.log(chalk.bold("\nCompleteness:"));
  console.log(`  Average:           ${chalk.cyan(stats.completeness.average + "%")}`);
  console.log(`  Min:               ${chalk.yellow(stats.completeness.min + "%")}`);
  console.log(`  Max:               ${chalk.green(stats.completeness.max + "%")}`);

  console.log(chalk.bold("\n  Distribution:"));
  for (const [range, count] of Object.entries(stats.completeness.distribution)) {
    const percentage = Math.round((count / stats.totalProducts) * 100);
    const bar = "█".repeat(Math.round(percentage / 5)) + "░".repeat(20 - Math.round(percentage / 5));
    console.log(`    ${range.padEnd(10)} ${bar} ${count} (${percentage}%)`);
  }

  // Confidence
  if (verbose || Object.keys(stats.confidence).length > 1) {
    console.log(chalk.bold("\nConfidence Sources:"));
    const sortedConfidence = Object.entries(stats.confidence).sort((a, b) => b[1] - a[1]);
    for (const [source, count] of sortedConfidence) {
      const percentage = Math.round((count / stats.totalProducts) * 100);
      console.log(`  ${chalk.cyan(source.padEnd(20))} ${count} (${percentage}%)`);
    }
  }

  console.log("");
}

/**
 * Stats command - Show catalog statistics
 */
export async function statsCommand(
  directory: string = ".",
  options: StatsOptions = {}
): Promise<void> {
  const { verbose = false, json = false } = options;
  const baseDir = join(process.cwd(), directory);

  if (!json) {
    console.log(chalk.blue("\n📈 Analyzing PKP catalog...\n"));
  }

  // Find all .md files
  const files = await findMarkdownFiles(baseDir);

  if (files.length === 0) {
    if (json) {
      console.log(JSON.stringify({ error: "No markdown files found" }, null, 2));
    } else {
      console.log(chalk.yellow("⚠️  No .md files found in " + directory + "\n"));
    }
    return;
  }

  if (!json) {
    console.log(chalk.gray(`Found ${files.length} markdown file(s)\n`));
  }

  // Parse all products
  const products: ProductStats[] = [];

  for (const file of files) {
    const stats = await parseProductStats(file);
    if (stats) {
      products.push(stats);
      if (verbose && !json) {
        const completenessColor =
          stats.completeness >= 75 ? chalk.green : stats.completeness >= 50 ? chalk.yellow : chalk.red;
        console.log(
          `  ${chalk.cyan(relative(baseDir, file))} - ${completenessColor(stats.completeness + "%")} complete`
        );
      }
    }
  }

  if (products.length === 0) {
    if (json) {
      console.log(JSON.stringify({ error: "No valid products found" }, null, 2));
    } else {
      console.log(chalk.yellow("⚠️  No valid PRODUCT.md files found.\n"));
    }
    return;
  }

  // Calculate statistics
  const stats = calculateCatalogStats(products);

  // Output
  if (json) {
    console.log(JSON.stringify(stats, null, 2));
  } else {
    printStats(stats, verbose);
    console.log(chalk.green("✨ Analysis complete!\n"));
  }
}
