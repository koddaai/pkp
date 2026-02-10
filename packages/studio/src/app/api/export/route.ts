import { NextRequest, NextResponse } from "next/server";
import { generateWellKnownPKP, type ProductData, type PKPConfig } from "@pkprotocol/static-generator";
import { parseProductMd, validateProductMd } from "@pkprotocol/spec";
import path from "path";
import fs from "fs";

async function scanProductFiles(dir: string): Promise<string[]> {
  const files: string[] = [];

  async function scan(currentDir: string) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        // Skip common non-product directories
        if (!["node_modules", ".git", "dist", ".well-known"].includes(entry.name)) {
          await scan(fullPath);
        }
      } else if (entry.isFile() && entry.name.endsWith(".md") && !entry.name.startsWith("README")) {
        files.push(fullPath);
      }
    }
  }

  await scan(dir);
  return files;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { catalogPath, outputPath, publisher } = body;

    if (!catalogPath) {
      return NextResponse.json({ error: "catalogPath is required" }, { status: 400 });
    }

    // Resolve paths
    const resolvedCatalogPath = path.resolve(catalogPath);
    const resolvedOutputPath = outputPath
      ? path.resolve(outputPath)
      : path.join(resolvedCatalogPath, "dist");

    // Verify catalog path exists
    if (!fs.existsSync(resolvedCatalogPath)) {
      return NextResponse.json({ error: "Catalog path does not exist" }, { status: 400 });
    }

    // Scan for product files
    const productFiles = await scanProductFiles(resolvedCatalogPath);

    if (productFiles.length === 0) {
      return NextResponse.json({ error: "No PRODUCT.md files found" }, { status: 400 });
    }

    // Parse products
    const products: ProductData[] = [];

    for (const filePath of productFiles) {
      try {
        const content = fs.readFileSync(filePath, "utf-8");
        const { frontmatter } = parseProductMd(content);
        const validation = validateProductMd(content);

        if (frontmatter.sku && frontmatter.name && frontmatter.category) {
          products.push({
            sku: String(frontmatter.sku),
            name: String(frontmatter.name),
            category: String(frontmatter.category),
            summary: String(frontmatter.summary || ""),
            price: frontmatter.price as ProductData["price"],
            confidence: frontmatter.confidence as ProductData["confidence"],
            completeness: validation.completeness * 100,
            sourcePath: filePath,
          });
        }
      } catch (e) {
        // Skip invalid files
        console.warn(`Skipping invalid file: ${filePath}`, e);
      }
    }

    if (products.length === 0) {
      return NextResponse.json({ error: "No valid products found" }, { status: 400 });
    }

    // Build config
    const config: PKPConfig = {
      publisher: {
        name: publisher?.name || "PKP Catalog",
        type: publisher?.type || "retailer",
        domain: publisher?.domain || "localhost",
      },
    };

    // Generate .well-known/pkp/
    await generateWellKnownPKP(products, config, resolvedOutputPath);

    return NextResponse.json({
      success: true,
      outputPath: resolvedOutputPath,
      productCount: products.length,
      files: [
        ".well-known/pkp/catalog.json",
        `.well-known/pkp/products/*.md (${products.length} files)`,
        "pkp.txt",
      ],
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Export failed" },
      { status: 500 }
    );
  }
}
