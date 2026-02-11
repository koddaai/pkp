import { NextRequest, NextResponse } from "next/server";
import { trackApiRequest } from "@/lib/api-analytics";

/**
 * Proxy for PKP catalog.json
 * Serves the catalog index with AI agent tracking
 *
 * This endpoint is designed for AI agents to discover the catalog.
 * All requests are tracked for analytics.
 */

const CATALOG_DATA = {
  schema: "pkp/1.0",
  type: "catalog",
  publisher: {
    name: "Kodda.ai",
    type: "aggregator",
    domain: "pkp.kodda.ai",
    contact: "pkp@kodda.ai",
  },
  description: "Product Knowledge Protocol catalog with 77k+ products from Brazilian retailers",
  total_products: 77326,
  categories: [
    "eletrodomesticos",
    "moda",
    "notebooks",
    "celulares/smartphones",
    "monitors",
    "tablets",
    "audio",
    "tvs",
    "cameras",
    "smartwatches",
    "games",
    "acessorios",
    "informatica",
  ],
  brands_count: 150,
  top_brands: [
    "Adidas",
    "Nike",
    "LG",
    "Centauro",
    "Mizuno",
    "Samsung",
    "Apple",
    "Corsair",
    "Dell",
  ],
  sources: [
    "Kabum BR",
    "Adidas BR",
    "Centauro BR",
    "Mizuno BR",
    "Cobasi BR",
    "LG BR",
    "Consul BR",
    "Samsung BR",
    "Electrolux BR",
    "Stanley BR",
  ],
  updated_at: new Date().toISOString().split("T")[0],
  endpoints: {
    catalog: "/api/pkp/catalog",
    manifest: "/api/pkp/manifest",
    products: "/api/products",
    search: "/api/products?search=query",
  },
  documentation: "https://pkp.kodda.ai/docs/",
  studio: "https://pkp-studio.vercel.app",
};

export async function GET(request: NextRequest) {
  // Track the request
  await trackApiRequest(request, "catalog_fetch");

  return NextResponse.json(CATALOG_DATA, {
    headers: {
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      "Access-Control-Allow-Origin": "*",
      "X-PKP-Version": "1.0",
    },
  });
}

// Support HEAD requests for checking availability
export async function HEAD(request: NextRequest) {
  await trackApiRequest(request, "catalog_fetch");

  return new NextResponse(null, {
    headers: {
      "Content-Type": "application/json",
      "X-PKP-Version": "1.0",
      "X-PKP-Products": "77326",
    },
  });
}
