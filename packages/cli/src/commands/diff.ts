import { readFile } from "node:fs/promises";
import { join } from "node:path";
import chalk from "chalk";
import { parseProductMd, calculateCompleteness } from "@pkprotocol/spec";

export interface DiffOptions {
  verbose?: boolean;
  json?: boolean;
}

interface FieldDiff {
  field: string;
  type: "added" | "removed" | "changed";
  oldValue?: unknown;
  newValue?: unknown;
}

interface ProductDiff {
  file1: string;
  file2: string;
  sku1?: string;
  sku2?: string;
  completeness1: number;
  completeness2: number;
  diffs: FieldDiff[];
}

/**
 * Get all fields from frontmatter recursively
 */
function getFlatFields(obj: Record<string, unknown>, prefix = ""): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (value && typeof value === "object" && !Array.isArray(value)) {
      Object.assign(result, getFlatFields(value as Record<string, unknown>, fullKey));
    } else {
      result[fullKey] = value;
    }
  }

  return result;
}

/**
 * Compare two values for equality
 */
function valuesEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((val, idx) => valuesEqual(val, b[idx]));
  }

  if (typeof a === "object" && a !== null && typeof b === "object" && b !== null) {
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length) return false;
    return aKeys.every((key) => valuesEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]));
  }

  return false;
}

/**
 * Format value for display
 */
function formatValue(value: unknown): string {
  if (value === undefined || value === null) return "(empty)";
  if (typeof value === "string") return `"${value}"`;
  if (Array.isArray(value)) return `[${value.length} items]`;
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

/**
 * Compare two PRODUCT.md files
 */
async function compareFiles(file1Path: string, file2Path: string): Promise<ProductDiff> {
  const [content1, content2] = await Promise.all([
    readFile(file1Path, "utf-8"),
    readFile(file2Path, "utf-8"),
  ]);

  const parsed1 = parseProductMd(content1);
  const parsed2 = parseProductMd(content2);

  const flat1 = getFlatFields(parsed1.frontmatter);
  const flat2 = getFlatFields(parsed2.frontmatter);

  const allKeys = new Set([...Object.keys(flat1), ...Object.keys(flat2)]);
  const diffs: FieldDiff[] = [];

  for (const key of allKeys) {
    const val1 = flat1[key];
    const val2 = flat2[key];

    if (val1 === undefined && val2 !== undefined) {
      diffs.push({ field: key, type: "added", newValue: val2 });
    } else if (val1 !== undefined && val2 === undefined) {
      diffs.push({ field: key, type: "removed", oldValue: val1 });
    } else if (!valuesEqual(val1, val2)) {
      diffs.push({ field: key, type: "changed", oldValue: val1, newValue: val2 });
    }
  }

  // Sort diffs: changed first, then added, then removed
  diffs.sort((a, b) => {
    const order = { changed: 0, added: 1, removed: 2 };
    return order[a.type] - order[b.type];
  });

  return {
    file1: file1Path,
    file2: file2Path,
    sku1: parsed1.frontmatter.sku as string | undefined,
    sku2: parsed2.frontmatter.sku as string | undefined,
    completeness1: Math.round(calculateCompleteness(parsed1.frontmatter) * 100),
    completeness2: Math.round(calculateCompleteness(parsed2.frontmatter) * 100),
    diffs,
  };
}

/**
 * Print diff in human-readable format
 */
function printDiff(diff: ProductDiff, verbose: boolean): void {
  console.log(chalk.blue("\n📋 Product Diff\n"));

  // File info
  console.log(chalk.bold("Files:"));
  console.log(`  ${chalk.red("- " + diff.file1)} ${diff.sku1 ? chalk.gray(`(${diff.sku1})`) : ""}`);
  console.log(`  ${chalk.green("+ " + diff.file2)} ${diff.sku2 ? chalk.gray(`(${diff.sku2})`) : ""}`);

  // Completeness
  const compDiff = diff.completeness2 - diff.completeness1;
  const compColor = compDiff > 0 ? chalk.green : compDiff < 0 ? chalk.red : chalk.gray;
  console.log(
    chalk.bold("\nCompleteness: ") +
      chalk.cyan(diff.completeness1 + "%") +
      " → " +
      chalk.cyan(diff.completeness2 + "%") +
      " " +
      compColor(`(${compDiff > 0 ? "+" : ""}${compDiff}%)`)
  );

  // Changes
  if (diff.diffs.length === 0) {
    console.log(chalk.green("\n✓ No differences found\n"));
    return;
  }

  console.log(chalk.bold("\nChanges:") + chalk.gray(` (${diff.diffs.length} fields)`));

  const changedFields = diff.diffs.filter((d) => d.type === "changed");
  const addedFields = diff.diffs.filter((d) => d.type === "added");
  const removedFields = diff.diffs.filter((d) => d.type === "removed");

  // Changed
  if (changedFields.length > 0) {
    console.log(chalk.yellow("\n  Modified:"));
    for (const d of changedFields) {
      console.log(`    ${chalk.cyan(d.field)}`);
      if (verbose) {
        console.log(chalk.red(`      - ${formatValue(d.oldValue)}`));
        console.log(chalk.green(`      + ${formatValue(d.newValue)}`));
      } else {
        console.log(chalk.gray(`      ${formatValue(d.oldValue)} → ${formatValue(d.newValue)}`));
      }
    }
  }

  // Added
  if (addedFields.length > 0) {
    console.log(chalk.green("\n  Added:"));
    for (const d of addedFields) {
      console.log(`    ${chalk.green("+")} ${chalk.cyan(d.field)}: ${formatValue(d.newValue)}`);
    }
  }

  // Removed
  if (removedFields.length > 0) {
    console.log(chalk.red("\n  Removed:"));
    for (const d of removedFields) {
      console.log(`    ${chalk.red("-")} ${chalk.cyan(d.field)}: ${formatValue(d.oldValue)}`);
    }
  }

  console.log("");
}

/**
 * Diff command - Compare two PRODUCT.md files
 */
export async function diffCommand(
  file1: string,
  file2: string,
  options: DiffOptions = {}
): Promise<void> {
  const { verbose = false, json = false } = options;

  const file1Path = join(process.cwd(), file1);
  const file2Path = join(process.cwd(), file2);

  if (!json) {
    console.log(chalk.blue("\n🔍 Comparing PRODUCT.md files...\n"));
  }

  try {
    const diff = await compareFiles(file1Path, file2Path);

    if (json) {
      console.log(JSON.stringify(diff, null, 2));
    } else {
      printDiff(diff, verbose);

      // Summary
      const added = diff.diffs.filter((d) => d.type === "added").length;
      const removed = diff.diffs.filter((d) => d.type === "removed").length;
      const changed = diff.diffs.filter((d) => d.type === "changed").length;

      console.log(chalk.bold("Summary: "));
      console.log(
        `  ${chalk.green("+" + added + " added")}, ` +
          `${chalk.yellow("~" + changed + " changed")}, ` +
          `${chalk.red("-" + removed + " removed")}\n`
      );
    }
  } catch (error) {
    if (json) {
      console.log(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }, null, 2));
    } else {
      console.log(chalk.red("✗ " + (error instanceof Error ? error.message : "Failed to compare files") + "\n"));
    }
    process.exit(1);
  }
}
