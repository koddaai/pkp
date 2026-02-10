import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile } from "fs/promises";
import { parseProductMd, validateProductMd } from "@pkprotocol/spec";

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

    return NextResponse.json({
      success: true,
      path: filePath,
      raw: content,
      frontmatter: parsed.frontmatter,
      content: parsed.content,
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
