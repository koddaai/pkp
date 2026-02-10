import { readFile, readdir, access, mkdir } from "node:fs/promises";
import { join, extname, relative } from "node:path";
import chalk from "chalk";
import { parse as parseYaml } from "yaml";
import { parseProductMd, validateProductMd, calculateCompleteness } from "@pkprotocol/spec";
import { generateWellKnownPKP } from "@pkprotocol/static-generator";

/**
 * PKP Configuration
 */
interface PKPConfig {
  publisher: {
    name: string;
    type: "manufacturer" | "retailer" | "aggregator" | "community";
    domain: string;
    contact?: string;
  };
}

/**
 * Product data for generation
 */
interface ProductData {
  sku: string;
  name: string;
  category: string;
  summary: string;
  price?: {
    type: string;
    currency: string;
    value?: number;
  };
  confidence?: {
    specs?: {
      source: string;
    };
  };
  completeness?: number;
  sourcePath: string;
}

export interface BuildOptions {
  output?: string;
  config?: string;
  verbose?: boolean;
}

/**
 * Default config file name
 */
const DEFAULT_CONFIG_FILE = "pkp.config.yml";

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
 * Load PKP config from file
 */
async function loadConfig(configPath: string): Promise<Record<string, unknown>> {
  try {
    const content = await readFile(configPath, "utf-8");
    return parseYaml(content) as Record<string, unknown>;
  } catch (error) {
    throw new Error(
      `Failed to load config from ${configPath}: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Parse a PRODUCT.md file and extract data for catalog
 */
async function parseProductFile(filePath: string): Promise<ProductData | null> {
  try {
    const content = await readFile(filePath, "utf-8");
    const validation = validateProductMd(content);

    if (!validation.valid) {
      return null;
    }

    const parsed = parseProductMd(content);
    const frontmatter = parsed.frontmatter;

    return {
      sku: frontmatter.sku as string,
      name: frontmatter.name as string,
      category: frontmatter.category as string,
      summary: (frontmatter.summary as string) || "",
      price: frontmatter.price as ProductData["price"],
      confidence: frontmatter.confidence as ProductData["confidence"],
      completeness: Math.round(calculateCompleteness(frontmatter) * 100),
      sourcePath: filePath,
    };
  } catch {
    return null;
  }
}

/**
 * Build .well-known/pkp/ from PRODUCT.md files
 */
export async function buildCommand(
  directory: string = ".",
  options: BuildOptions = {}
): Promise<void> {
  const { verbose = false } = options;
  const baseDir = join(process.cwd(), directory);
  const configPath = options.config
    ? join(process.cwd(), options.config)
    : join(baseDir, DEFAULT_CONFIG_FILE);

  console.log(chalk.blue("\n🔨 Building PKP catalog...\n"));

  // Load config
  let config: Record<string, unknown>;
  try {
    await access(configPath);
    config = await loadConfig(configPath);
    console.log(chalk.green("✓") + " Loaded config from " + chalk.cyan(relative(process.cwd(), configPath)));
  } catch {
    console.log(chalk.red("✗ Config file not found: " + configPath));
    console.log(chalk.yellow("\n  Run " + chalk.cyan("pkp init") + " to create a config file.\n"));
    process.exit(1);
  }

  // Validate config
  const publisher = config.publisher as PKPConfig["publisher"] | undefined;
  if (!publisher || !publisher.name || !publisher.domain || !publisher.type) {
    console.log(chalk.red("✗ Invalid config: publisher.name, publisher.domain, and publisher.type are required.\n"));
    process.exit(1);
  }

  // Determine source directories
  const sources = (config.sources as string[]) || ["./products"];
  const outputDir = options.output || (config.output as string) || "./dist";
  const fullOutputDir = join(baseDir, outputDir);

  // Find all PRODUCT.md files
  const allFiles: string[] = [];
  for (const source of sources) {
    const sourceDir = join(baseDir, source);
    const files = await findMarkdownFiles(sourceDir);
    allFiles.push(...files);
  }

  if (allFiles.length === 0) {
    console.log(chalk.yellow("⚠️  No .md files found in source directories.\n"));
    console.log("  Sources: " + sources.map((s) => chalk.cyan(s)).join(", "));
    console.log("\n  Add PRODUCT.md files to your source directories.\n");
    return;
  }

  console.log(chalk.gray(`\nFound ${allFiles.length} markdown file(s)\n`));

  // Parse all products
  const products: ProductData[] = [];
  const errors: string[] = [];

  for (const file of allFiles) {
    const relativePath = relative(baseDir, file);

    if (verbose) {
      console.log(chalk.gray("  Processing: " + relativePath));
    }

    const product = await parseProductFile(file);

    if (product) {
      products.push(product);
      console.log(
        chalk.green("✓") +
          " " +
          chalk.cyan(relativePath) +
          chalk.gray(` (${product.sku})`)
      );
    } else {
      errors.push(relativePath);
      console.log(chalk.red("✗") + " " + chalk.cyan(relativePath) + chalk.red(" (invalid)"));
    }
  }

  if (products.length === 0) {
    console.log(chalk.red("\n✗ No valid products found. Cannot build catalog.\n"));
    process.exit(1);
  }

  // Create output directory
  await mkdir(fullOutputDir, { recursive: true });

  // Generate .well-known/pkp/
  console.log(chalk.blue("\n📦 Generating .well-known/pkp/...\n"));

  try {
    await generateWellKnownPKP(
      products,
      { publisher: publisher as PKPConfig["publisher"] },
      fullOutputDir
    );

    console.log(chalk.green("✓") + " Created " + chalk.cyan(join(outputDir, "pkp.txt")));
    console.log(chalk.green("✓") + " Created " + chalk.cyan(join(outputDir, ".well-known/pkp/catalog.json")));
    console.log(
      chalk.green("✓") +
        " Created " +
        chalk.cyan(join(outputDir, ".well-known/pkp/products/")) +
        chalk.gray(` (${products.length} files)`)
    );
  } catch (error) {
    console.log(
      chalk.red("\n✗ Failed to generate PKP: " + (error instanceof Error ? error.message : "Unknown error") + "\n")
    );
    process.exit(1);
  }

  // Print summary
  console.log(chalk.blue("\n📊 Build Summary:\n"));
  console.log("  " + chalk.green(`${products.length} products built`));

  if (errors.length > 0) {
    console.log("  " + chalk.red(`${errors.length} files skipped (invalid)`));
  }

  console.log("\n  Output: " + chalk.cyan(fullOutputDir));

  // Print categories
  const categories = [...new Set(products.map((p) => p.category))];
  console.log("  Categories: " + categories.map((c) => chalk.cyan(c)).join(", "));

  console.log(chalk.blue("\n📝 Next steps:\n"));
  console.log("  1. Run " + chalk.cyan("pkp serve " + outputDir) + " to test locally");
  console.log("  2. Deploy " + chalk.cyan(outputDir) + " to your web server");
  console.log("  3. Verify at " + chalk.cyan(`https://${publisher.domain}/.well-known/pkp/catalog.json\n`));

  console.log(chalk.green("✨ Build complete!\n"));
}
