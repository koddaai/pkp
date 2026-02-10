import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile } from "fs/promises";
import { parseProductMd, validateProductMd } from "@pkprotocol/spec";
import { trackEvent, getTrackingInfo } from "@/lib/analytics";

interface Frontmatter {
  sku?: string;
  name?: string;
  brand?: string;
  category?: string;
  subcategory?: string;
  summary?: string;
  price?: { value?: number; currency?: string };
  availability?: string;
  confidence?: {
    specs?: { source?: string; level?: string };
    price?: { source?: string; level?: string };
  };
  highlights?: string[];
  tags?: string[];
  identifiers?: { ean?: string; mpn?: string };
  purchase_urls?: Array<{ retailer: string; url: string }>;
}

/**
 * GET /api/product?path=/path/to/product.md
 * Read a single product file
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const filePath = searchParams.get("path");

  if (!filePath) {
    return NextResponse.json({ error: "Path is required" }, { status: 400 });
  }

  try {
    const content = await readFile(filePath, "utf-8");
    const parsed = parseProductMd(content);
    const validation = validateProductMd(content);
    const fm = parsed.frontmatter as Frontmatter | undefined;

    // Build product object for catalog browser
    const product = fm ? {
      sku: String(fm.sku || ""),
      name: String(fm.name || "Unnamed"),
      brand: fm.brand ? String(fm.brand) : undefined,
      category: String(fm.category || "uncategorized"),
      subcategory: fm.subcategory ? String(fm.subcategory) : undefined,
      summary: fm.summary ? String(fm.summary) : undefined,
      price: fm.price?.value ? {
        value: fm.price.value,
        currency: fm.price.currency || "BRL",
      } : undefined,
      availability: fm.availability ? String(fm.availability) : undefined,
      confidence: fm.confidence,
      highlights: fm.highlights,
      tags: fm.tags,
      identifiers: fm.identifiers,
      purchase_urls: fm.purchase_urls,
      completeness: validation.completeness,
      path: filePath,
    } : null;

    // Track the product view (non-blocking)
    const { userAgent, ip, referer } = getTrackingInfo(request);
    trackEvent({
      event: "product_view",
      userAgent,
      ip,
      referer,
      productSku: product?.sku,
      productName: product?.name,
    });

    return NextResponse.json({
      success: true,
      path: filePath,
      raw: content,
      frontmatter: parsed.frontmatter,
      content: parsed.content,
      product,
      validation: {
        valid: validation.valid,
        errors: validation.errors,
        warnings: validation.warnings,
        completeness: validation.completeness,
        meetsThreshold: validation.meetsThreshold,
      },
    });
  } catch (error) {
    console.error("Error reading product:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to read product" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/product
 * Save a product file
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { path: filePath, content } = body;

    if (!filePath) {
      return NextResponse.json({ error: "Path is required" }, { status: 400 });
    }

    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    // Validate before saving
    const validation = validateProductMd(content);

    // Save the file
    await writeFile(filePath, content, "utf-8");

    // Parse the saved content
    const parsed = parseProductMd(content);

    return NextResponse.json({
      success: true,
      path: filePath,
      frontmatter: parsed.frontmatter,
      validation: {
        valid: validation.valid,
        errors: validation.errors,
        warnings: validation.warnings,
        completeness: validation.completeness,
        meetsThreshold: validation.meetsThreshold,
      },
    });
  } catch (error) {
    console.error("Error saving product:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save product" },
      { status: 500 }
    );
  }
}
