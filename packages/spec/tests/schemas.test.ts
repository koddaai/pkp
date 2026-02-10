import { describe, it, expect } from "vitest";
import {
  ConfidenceBlock,
  ConfidenceLevel,
  ConfidenceSource,
  PKPConfidence,
  SOURCE_PRECEDENCE,
} from "../src/schemas/confidence.js";
import { PKPPrice, PriceType, PriceSource } from "../src/schemas/price.js";
import { PurchaseUrl, PKPPurchaseUrls } from "../src/schemas/purchase.js";
import {
  PKPCanonical,
  ProductURI,
  parseProductURI,
  buildProductURI,
} from "../src/schemas/canonical.js";
import { PKPIdentifiers, PKPVariant } from "../src/schemas/variant.js";
import { PKPPreferredTerm, PKPNarrative } from "../src/schemas/narrative.js";
import { PKPReviews } from "../src/schemas/reviews.js";

describe("Confidence Schema", () => {
  it("should validate confidence levels", () => {
    expect(ConfidenceLevel.parse("high")).toBe("high");
    expect(ConfidenceLevel.parse("medium")).toBe("medium");
    expect(ConfidenceLevel.parse("low")).toBe("low");
    expect(() => ConfidenceLevel.parse("invalid")).toThrow();
  });

  it("should validate confidence sources", () => {
    expect(ConfidenceSource.parse("manufacturer")).toBe("manufacturer");
    expect(ConfidenceSource.parse("retailer-feed")).toBe("retailer-feed");
    expect(ConfidenceSource.parse("ai-generated")).toBe("ai-generated");
    expect(() => ConfidenceSource.parse("invalid")).toThrow();
  });

  it("should validate confidence block", () => {
    const block = {
      level: "high",
      source: "manufacturer",
      verified_at: "2026-02-09T12:00:00Z",
    };
    expect(ConfidenceBlock.parse(block)).toEqual(block);
  });

  it("should have correct source precedence", () => {
    expect(SOURCE_PRECEDENCE["manufacturer"]).toBe(5);
    expect(SOURCE_PRECEDENCE["retailer-feed"]).toBe(4);
    expect(SOURCE_PRECEDENCE["community"]).toBe(3);
    expect(SOURCE_PRECEDENCE["ai-generated"]).toBe(2);
    expect(SOURCE_PRECEDENCE["scraped"]).toBe(1);
  });

  it("should validate PKPConfidence with optional fields", () => {
    const confidence = {
      specs: {
        level: "high",
        source: "manufacturer",
        verified_at: "2026-02-09T12:00:00Z",
      },
    };
    expect(PKPConfidence.parse(confidence)).toEqual(confidence);
  });
});

describe("Price Schema", () => {
  it("should validate price types", () => {
    expect(PriceType.parse("msrp")).toBe("msrp");
    expect(PriceType.parse("street")).toBe("street");
    expect(PriceType.parse("range")).toBe("range");
    expect(PriceType.parse("unknown")).toBe("unknown");
  });

  it("should validate MSRP price with value", () => {
    const price = {
      type: "msrp",
      currency: "BRL",
      value: 9999.0,
      source: "manufacturer",
      updated_at: "2026-02-09T12:00:00Z",
    };
    expect(PKPPrice.parse(price)).toMatchObject(price);
  });

  it("should validate range price with min/max", () => {
    const price = {
      type: "range",
      currency: "BRL",
      min: 8000.0,
      max: 10000.0,
      source: "retailer",
      updated_at: "2026-02-09T12:00:00Z",
    };
    expect(PKPPrice.parse(price)).toMatchObject(price);
  });

  it("should validate unknown price without value", () => {
    const price = {
      type: "unknown",
      currency: "BRL",
      source: "inferred",
      updated_at: "2026-02-09T12:00:00Z",
    };
    expect(PKPPrice.parse(price)).toMatchObject(price);
  });

  it("should reject MSRP price without value", () => {
    const price = {
      type: "msrp",
      currency: "BRL",
      source: "manufacturer",
      updated_at: "2026-02-09T12:00:00Z",
    };
    expect(() => PKPPrice.parse(price)).toThrow();
  });

  it("should reject range price without min/max", () => {
    const price = {
      type: "range",
      currency: "BRL",
      source: "retailer",
      updated_at: "2026-02-09T12:00:00Z",
    };
    expect(() => PKPPrice.parse(price)).toThrow();
  });
});

describe("Purchase Schema", () => {
  it("should validate purchase URL", () => {
    const url = {
      retailer: "Amazon",
      url: "https://amazon.com.br/product",
      ap2_enabled: false,
    };
    expect(PurchaseUrl.parse(url)).toMatchObject(url);
  });

  it("should validate array of purchase URLs", () => {
    const urls = [
      { retailer: "Amazon", url: "https://amazon.com.br/product", ap2_enabled: false },
      { retailer: "Magazine Luiza", url: "https://magazineluiza.com.br/product", ap2_enabled: true },
    ];
    expect(PKPPurchaseUrls.parse(urls)).toEqual(urls);
  });

  it("should reject invalid URL", () => {
    const url = {
      retailer: "Amazon",
      url: "not-a-valid-url",
      ap2_enabled: false,
    };
    expect(() => PurchaseUrl.parse(url)).toThrow();
  });
});

describe("Canonical Schema", () => {
  it("should validate canonical reference", () => {
    const canonical = {
      domain: "samsung.com.br",
      url: "/.well-known/pkp/products/galaxy-s25.md",
    };
    expect(PKPCanonical.parse(canonical)).toEqual(canonical);
  });

  it("should validate product URI", () => {
    expect(ProductURI.parse("pkp://samsung.com.br/SM-S926B")).toBe("pkp://samsung.com.br/SM-S926B");
    expect(() => ProductURI.parse("invalid-uri")).toThrow();
    expect(() => ProductURI.parse("http://example.com")).toThrow();
  });

  it("should parse product URI correctly", () => {
    const result = parseProductURI("pkp://samsung.com.br/SM-S926B");
    expect(result).toEqual({ domain: "samsung.com.br", sku: "SM-S926B" });
  });

  it("should return null for invalid URI", () => {
    expect(parseProductURI("invalid")).toBeNull();
  });

  it("should build product URI correctly", () => {
    expect(buildProductURI("samsung.com.br", "SM-S926B")).toBe("pkp://samsung.com.br/SM-S926B");
  });
});

describe("Variant Schema", () => {
  it("should validate identifiers", () => {
    const identifiers = {
      mpn: "SM-S926B",
      ean: "7892509123456",
      asin: "B0EXAMPLE",
    };
    expect(PKPIdentifiers.parse(identifiers)).toEqual(identifiers);
  });

  it("should validate variant info", () => {
    const variant = {
      family_id: "galaxy-s25-ultra",
      variant_of: null,
      variant_attributes: ["storage", "cor"],
    };
    expect(PKPVariant.parse(variant)).toEqual(variant);
  });
});

describe("Narrative Schema", () => {
  it("should validate preferred term", () => {
    const term = {
      term: "S Pen",
      avoid: ["caneta", "stylus"],
    };
    expect(PKPPreferredTerm.parse(term)).toEqual(term);
  });

  it("should validate narrative", () => {
    const narrative = {
      highlights: ["7 anos de atualizacoes", "Camera 200MP"],
      preferred_terms: [{ term: "Galaxy AI", avoid: ["IA da Samsung"] }],
    };
    expect(PKPNarrative.parse(narrative)).toEqual(narrative);
  });
});

describe("Reviews Schema", () => {
  it("should validate reviews", () => {
    const reviews = {
      average_rating: 4.6,
      total_reviews: 1847,
      source: "multiple",
      highlights_positive: ["camera excelente"],
      highlights_negative: ["preco alto"],
    };
    expect(PKPReviews.parse(reviews)).toEqual(reviews);
  });

  it("should reject rating above 5", () => {
    const reviews = {
      average_rating: 5.5,
      total_reviews: 100,
    };
    expect(() => PKPReviews.parse(reviews)).toThrow();
  });

  it("should reject negative total_reviews", () => {
    const reviews = {
      average_rating: 4.0,
      total_reviews: -10,
    };
    expect(() => PKPReviews.parse(reviews)).toThrow();
  });
});
