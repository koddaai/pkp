import { readdir, stat, readFile, mkdir, copyFile, access } from "node:fs/promises";
import { join, relative } from "node:path";
import chalk from "chalk";

export interface PublishOptions {
  verbose?: boolean;
  dryRun?: boolean;
}

/**
 * Copy directory recursively
 */
async function copyDir(src: string, dest: string, verbose: boolean): Promise<number> {
  let count = 0;

  async function copy(srcDir: string, destDir: string): Promise<void> {
    await mkdir(destDir, { recursive: true });
    const entries = await readdir(srcDir, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = join(srcDir, entry.name);
      const destPath = join(destDir, entry.name);

      if (entry.isDirectory()) {
        await copy(srcPath, destPath);
      } else {
        await copyFile(srcPath, destPath);
        count++;
        if (verbose) {
          console.log(chalk.gray(`  Copied: ${relative(src, srcPath)}`));
        }
      }
    }
  }

  await copy(src, dest);
  return count;
}

/**
 * Get directory size and file count
 */
async function getDirInfo(dir: string): Promise<{ files: number; size: number }> {
  let files = 0;
  let size = 0;

  async function scan(currentDir: string): Promise<void> {
    const entries = await readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(currentDir, entry.name);

      if (entry.isDirectory()) {
        await scan(fullPath);
      } else {
        files++;
        const stats = await stat(fullPath);
        size += stats.size;
      }
    }
  }

  await scan(dir);
  return { files, size };
}

/**
 * Format bytes to human readable
 */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

/**
 * Publish to local directory (filesystem deployment)
 */
async function publishToDirectory(
  sourceDir: string,
  targetDir: string,
  options: PublishOptions
): Promise<void> {
  const { verbose = false, dryRun = false } = options;

  console.log(chalk.bold("\nTarget: ") + chalk.cyan(targetDir));

  // Get source info
  const info = await getDirInfo(sourceDir);
  console.log(chalk.bold("Files: ") + chalk.cyan(info.files) + chalk.gray(` (${formatBytes(info.size)})`));

  if (dryRun) {
    console.log(chalk.yellow("\n[DRY RUN] Would copy files to: " + targetDir));
    console.log(chalk.gray("  Run without --dry-run to actually publish.\n"));
    return;
  }

  // Copy files
  console.log(chalk.blue("\n📦 Publishing...\n"));

  const copied = await copyDir(sourceDir, targetDir, verbose);

  console.log(chalk.green(`✓ Published ${copied} files to ${targetDir}\n`));
}

/**
 * Publish command - Deploy PKP catalog
 */
export async function publishCommand(
  sourceDir: string = "./dist",
  targetDir: string,
  options: PublishOptions = {}
): Promise<void> {
  const { verbose = false, dryRun = false } = options;
  const fullSourceDir = join(process.cwd(), sourceDir);

  console.log(chalk.blue("\n🚀 Publishing PKP catalog...\n"));

  // Verify source directory exists
  try {
    await access(fullSourceDir);
  } catch {
    console.log(chalk.red("✗ Source directory not found: " + sourceDir));
    console.log(chalk.yellow("\n  Run " + chalk.cyan("pkp build") + " first to generate the catalog.\n"));
    process.exit(1);
  }

  // Check for .well-known/pkp/
  const wellKnownPath = join(fullSourceDir, ".well-known", "pkp");
  try {
    await access(wellKnownPath);
  } catch {
    console.log(chalk.red("✗ No .well-known/pkp/ found in " + sourceDir));
    console.log(chalk.yellow("\n  Run " + chalk.cyan("pkp build") + " first to generate the catalog.\n"));
    process.exit(1);
  }

  // Read catalog info
  try {
    const catalogPath = join(wellKnownPath, "catalog.json");
    const catalog = JSON.parse(await readFile(catalogPath, "utf-8"));
    console.log(chalk.bold("Catalog: ") + chalk.cyan(catalog.publisher?.name || "Unknown"));
    console.log(chalk.bold("Products: ") + chalk.cyan(catalog.products?.length || 0));
    console.log(chalk.bold("Source: ") + chalk.cyan(sourceDir));
  } catch {
    console.log(chalk.yellow("⚠️  Could not read catalog.json"));
  }

  // Determine target type and publish
  const fullTargetDir = join(process.cwd(), targetDir);

  // For now, only support local directory publishing
  // Future: Add support for S3, GitHub Pages, rsync, etc.
  await publishToDirectory(fullSourceDir, fullTargetDir, { verbose, dryRun });

  // Print next steps
  if (!dryRun) {
    console.log(chalk.blue("📝 Next steps:\n"));
    console.log("  1. Configure your web server to serve " + chalk.cyan(targetDir));
    console.log("  2. Verify at " + chalk.cyan(`https://your-domain/.well-known/pkp/catalog.json`));
    console.log("  3. Test with " + chalk.cyan("pkp serve " + targetDir) + " locally\n");
    console.log(chalk.green("✨ Publish complete!\n"));
  }
}
