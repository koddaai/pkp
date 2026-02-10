import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import { trackEvent, getTrackingInfo } from "@/lib/analytics";
import { config } from "@/lib/config";

interface ProductSummary {
  sku: string;
  name: string;
  brand?: string;
  category: string;
  subcategory?: string;
  price?: { value: number; currency: string };
  retailer?: string;
  path: string;
}

interface CatalogManifest {
  version: string;
  generated_at: string;
  stats: {
    total_products: number;
    categories: Record<string, number>;
    brands: Record<string, number>;
    retailers: Record<string, number>;
    price_range: { min: number; max: number };
  };
  products: ProductSummary[];
}

// In-memory cache
let manifestCache: { path: string; data: CatalogManifest; timestamp: number } | null = null;
const CACHE_TTL = 300000; // 5 minutes

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const catalogPath = searchParams.get("path");
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");
  const search = searchParams.get("search")?.toLowerCase();
  const category = searchParams.get("category");
  const brand = searchParams.get("brand");
  const statsOnly = searchParams.get("statsOnly") === "true";
  const indexOnly = searchParams.get("indexOnly") === "true"; // Legacy support

  // Use default catalog path if not provided
  const effectivePath = catalogPath || config.defaultCatalogPath;

  try {
    // Try to load manifest
    const manifest = await loadManifest(effectivePath);

    if (!manifest) {
      return NextResponse.json({
        error: "No manifest.json found. Run: npx tsx scripts/build-manifest.ts --catalog " + effectivePath,
        needsManifest: true,
      }, { status: 404 });
    }

    // Return stats only
    if (statsOnly || indexOnly) {
      return NextResponse.json({
        total: manifest.stats.total_products,
        categories: Object.keys(manifest.stats.categories).sort(),
        brands: Object.keys(manifest.stats.brands).sort(),
        retailers: Object.keys(manifest.stats.retailers).sort(),
        stats: manifest.stats,
        generated_at: manifest.generated_at,
      });
    }

    // Filter products
    let filtered = manifest.products;

    if (search) {
      filtered = filtered.filter(
        p => p.name.toLowerCase().includes(search) ||
             p.sku.toLowerCase().includes(search) ||
             p.brand?.toLowerCase().includes(search)
      );
    }

    if (category) {
      filtered = filtered.filter(p => p.category === category);
    }

    if (brand) {
      filtered = filtered.filter(p => p.brand === brand);
    }

    // Paginate
    const paginated = filtered.slice(offset, offset + limit);

    // Track the request (non-blocking)
    const { userAgent, ip, referer } = getTrackingInfo(request);
    trackEvent({
      event: search ? "search" : "catalog_fetch",
      userAgent,
      ip,
      referer,
      query: search,
    });

    return NextResponse.json({
      products: paginated,
      total: filtered.length,
      limit,
      offset,
      hasMore: offset + limit < filtered.length,
    });
  } catch (error) {
    console.error("Error loading products:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load products" },
      { status: 500 }
    );
  }
}

async function loadManifest(catalogPath: string): Promise<CatalogManifest | null> {
  // In Vercel/production, try public/data/manifest.json first
  const publicManifestPath = join(process.cwd(), "public", "data", "manifest.json");
  const localManifestPath = catalogPath.startsWith("/")
    ? join(catalogPath, "manifest.json")
    : join(process.cwd(), "..", "..", catalogPath, "manifest.json");

  const manifestPath = config.isVercel && existsSync(publicManifestPath)
    ? publicManifestPath
    : localManifestPath;

  // Check cache
  if (manifestCache &&
      manifestCache.path === manifestPath &&
      Date.now() - manifestCache.timestamp < CACHE_TTL) {
    return manifestCache.data;
  }

  // Check if manifest exists
  if (!existsSync(manifestPath)) {
    return null;
  }

  try {
    const content = await readFile(manifestPath, "utf-8");
    const manifest = JSON.parse(content) as CatalogManifest;

    // Update cache
    manifestCache = {
      path: manifestPath,
      data: manifest,
      timestamp: Date.now(),
    };

    console.log(`Loaded manifest: ${manifest.stats.total_products} products`);
    return manifest;
  } catch (error) {
    console.error("Error loading manifest:", error);
    return null;
  }
}
