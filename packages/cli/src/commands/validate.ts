import { readFile, readdir, stat } from "node:fs/promises";
import { join, extname, relative } from "node:path";
import chalk from "chalk";
import { validateProductMd, type ValidationResult } from "@pkp/spec";

export interface ValidateOptions {
  verbose?: boolean;
  strict?: boolean;
}

/**
 * Find all .md files in a directory recursively
 */
async function findMarkdownFiles(dir: string): Promise<string[]> {
  const files: string[] = [];

  async function scan(currentDir: string): Promise<void> {
    const entries = await readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(currentDir, entry.name);

      if (entry.isDirectory()) {
        // Skip node_modules and hidden directories
        if (!entry.name.startsWith(".") && entry.name !== "node_modules") {
          await scan(fullPath);
        }
      } else if (entry.isFile() && extname(entry.name) === ".md") {
        files.push(fullPath);
      }
    }
  }

  await scan(dir);
  return files;
}

/**
 * Print validation result for a file
 */
function printResult(
  filePath: string,
  result: ValidationResult,
  basePath: string,
  verbose: boolean
): void {
  const relativePath = relative(basePath, filePath);
  const completenessPercent = Math.round(result.completeness * 100);

  if (result.valid) {
    if (result.meetsThreshold) {
      console.log(
        chalk.green("✓") +
          " " +
          chalk.cyan(relativePath) +
          chalk.gray(` (${completenessPercent}% complete)`)
      );
    } else {
      console.log(
        chalk.yellow("⚠") +
          " " +
          chalk.cyan(relativePath) +
          chalk.yellow(` (${completenessPercent}% < ${Math.round(result.threshold * 100)}% threshold)`)
      );
    }
  } else {
    console.log(chalk.red("✗") + " " + chalk.cyan(relativePath));
  }

  // Print errors
  if (result.errors.length > 0) {
    for (const error of result.errors) {
      console.log(chalk.red("    ✗ " + error));
    }
  }

  // Print warnings (only in verbose mode or if there are errors)
  if (verbose || !result.valid) {
    for (const warning of result.warnings) {
      console.log(chalk.yellow("    ⚠ " + warning));
    }
  }

  // Print category info in verbose mode
  if (verbose && result.categoryMeta) {
    console.log(
      chalk.gray(
        `    Category: ${result.categoryMeta.category} (min: ${Math.round(result.categoryMeta.minCompleteness * 100)}%)`
      )
    );
  }
}

/**
 * Validate a single file or directory
 */
export async function validateCommand(
  path: string,
  options: ValidateOptions = {}
): Promise<void> {
  const { verbose = false, strict = false } = options;
  const targetPath = join(process.cwd(), path);

  console.log(chalk.blue("\n🔍 Validating PKP files...\n"));

  let files: string[];
  let basePath: string;

  // Check if path is file or directory
  try {
    const stats = await stat(targetPath);

    if (stats.isDirectory()) {
      files = await findMarkdownFiles(targetPath);
      basePath = targetPath;

      if (files.length === 0) {
        console.log(chalk.yellow("⚠️  No .md files found in " + path + "\n"));
        return;
      }

      console.log(chalk.gray(`Found ${files.length} markdown file(s)\n`));
    } else {
      files = [targetPath];
      basePath = process.cwd();
    }
  } catch {
    console.log(chalk.red("✗ Path not found: " + path + "\n"));
    process.exit(1);
  }

  // Validate each file
  let validCount = 0;
  let invalidCount = 0;
  let warningCount = 0;
  let belowThresholdCount = 0;

  for (const file of files) {
    try {
      const content = await readFile(file, "utf-8");
      const result = validateProductMd(content);

      printResult(file, result, basePath, verbose);

      if (result.valid) {
        validCount++;
        if (!result.meetsThreshold) {
          belowThresholdCount++;
        }
      } else {
        invalidCount++;
      }

      warningCount += result.warnings.length;
    } catch (error) {
      console.log(chalk.red("✗") + " " + chalk.cyan(relative(basePath, file)));
      console.log(
        chalk.red("    ✗ Failed to read file: " + (error instanceof Error ? error.message : "Unknown error"))
      );
      invalidCount++;
    }
  }

  // Print summary
  console.log(chalk.blue("\n📊 Summary:\n"));
  console.log("  " + chalk.green(`${validCount} valid`));

  if (invalidCount > 0) {
    console.log("  " + chalk.red(`${invalidCount} invalid`));
  }

  if (belowThresholdCount > 0) {
    console.log("  " + chalk.yellow(`${belowThresholdCount} below threshold`));
  }

  if (warningCount > 0) {
    console.log("  " + chalk.yellow(`${warningCount} warning(s)`));
  }

  console.log("");

  // Exit with error code if strict mode and there are issues
  if (strict && (invalidCount > 0 || (belowThresholdCount > 0 && verbose))) {
    console.log(chalk.red("Validation failed in strict mode.\n"));
    process.exit(1);
  }

  if (invalidCount > 0) {
    console.log(chalk.red("Some files have validation errors.\n"));
    process.exit(1);
  }

  console.log(chalk.green("✨ Validation complete!\n"));
}
