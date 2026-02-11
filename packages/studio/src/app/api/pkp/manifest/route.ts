import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import { trackApiRequest } from "@/lib/api-analytics";

/**
 * Proxy for PKP manifest.json (full product data)
 * Serves the complete product catalog with AI agent tracking
 *
 * This is the main endpoint for AI agents to fetch all product data.
 * The response is large (~23MB) so it's streamed and cached.
 */

// Cache the manifest in memory to avoid repeated file reads
let manifestCache: { data: string; timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getManifest(): Promise<string | null> {
  // Check cache
  if (manifestCache && Date.now() - manifestCache.timestamp < CACHE_TTL) {
    return manifestCache.data;
  }

  // Try public/data/manifest.json first (Vercel deployment)
  const publicPath = join(process.cwd(), "public", "data", "manifest.json");

  // Fallback to examples folder (local development)
  const localPath = join(process.cwd(), "..", "..", "examples", "kodda-catalog", "manifest.json");

  const manifestPath = existsSync(publicPath) ? publicPath : localPath;

  if (!existsSync(manifestPath)) {
    console.error("Manifest not found at:", manifestPath);
    return null;
  }

  try {
    const content = await readFile(manifestPath, "utf-8");

    // Update cache
    manifestCache = {
      data: content,
      timestamp: Date.now(),
    };

    return content;
  } catch (error) {
    console.error("Error reading manifest:", error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  // Track the request
  await trackApiRequest(request, "catalog_fetch");

  const manifest = await getManifest();

  if (!manifest) {
    return NextResponse.json(
      { error: "Manifest not found" },
      { status: 404 }
    );
  }

  return new NextResponse(manifest, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      "Access-Control-Allow-Origin": "*",
      "X-PKP-Version": "1.0",
    },
  });
}

// Support HEAD requests for checking availability and size
export async function HEAD(request: NextRequest) {
  await trackApiRequest(request, "catalog_fetch");

  const manifest = await getManifest();

  return new NextResponse(null, {
    headers: {
      "Content-Type": "application/json",
      "Content-Length": manifest ? String(manifest.length) : "0",
      "X-PKP-Version": "1.0",
    },
  });
}
