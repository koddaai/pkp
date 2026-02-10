import { NextRequest, NextResponse } from "next/server";
import { readdir, readFile } from "fs/promises";
import { join } from "path";
import { parseProductMd, validateProductMd } from "@pkprotocol/spec";

interface ProductSummary {
  sku: string;
  name: string;
  brand?: string;
  category: string;
  price?: { value: number; currency: string };
  completeness?: number;
  path: string;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const catalogPath = searchParams.get("path");

  if (!catalogPath) {
    return NextResponse.json({ error: "Path is required" }, { status: 400 });
  }

  try {
    // Resolve path (handle relative paths)
    const resolvedPath = catalogPath.startsWith("/")
      ? catalogPath
      : join(process.cwd(), "..", "..", catalogPath);

    // Find all PRODUCT.md files
    const products: ProductSummary[] = [];
    await scanDirectory(resolvedPath, products);

    return NextResponse.json({ products, count: products.length });
  } catch (error) {
    console.error("Error loading products:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load products" },
      { status: 500 }
    );
  }
}

async function scanDirectory(dir: string, products: ProductSummary[]): Promise<void> {
  try {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        // Skip hidden directories and node_modules
        if (!entry.name.startsWith(".") && entry.name !== "node_modules" && entry.name !== "dist") {
          await scanDirectory(fullPath, products);
        }
      } else if (entry.name.endsWith(".md") && entry.name !== "README.md") {
        // Try to parse as PRODUCT.md
        try {
          const content = await readFile(fullPath, "utf-8");
          const parsed = parseProductMd(content);

          const fm = parsed.frontmatter;
          if (fm?.sku) {
            const validation = validateProductMd(content);
            const price = fm.price as { value?: number; currency?: string } | undefined;

            products.push({
              sku: String(fm.sku),
              name: String(fm.name || "Unnamed"),
              brand: fm.brand ? String(fm.brand) : undefined,
              category: String(fm.category || "uncategorized"),
              price: price?.value
                ? {
                    value: price.value,
                    currency: price.currency || "BRL",
                  }
                : undefined,
              completeness: validation.completeness,
              path: fullPath,
            });
          }
        } catch {
          // Not a valid PRODUCT.md, skip
        }
      }
    }
  } catch {
    // Directory doesn't exist or can't be read
  }
}
