import { describe, it, expect } from "vitest";
import {
  parseProductMd,
  serializeProduct,
  parseAndValidateProductMd,
} from "../src/parser.js";

describe("Parser", () => {
  describe("parseProductMd", () => {
    it("should parse frontmatter and content", () => {
      const markdown = `---
sku: "SM-S928B"
brand: "Samsung"
name: "Galaxy S25 Ultra"
category: "celulares/smartphones"
---

# Galaxy S25 Ultra

O melhor smartphone da Samsung.
`;

      const result = parseProductMd(markdown);

      expect(result.frontmatter.sku).toBe("SM-S928B");
      expect(result.frontmatter.brand).toBe("Samsung");
      expect(result.frontmatter.name).toBe("Galaxy S25 Ultra");
      expect(result.frontmatter.category).toBe("celulares/smartphones");
      expect(result.content).toContain("# Galaxy S25 Ultra");
      expect(result.content).toContain("O melhor smartphone da Samsung.");
      expect(result.raw).toBe(markdown);
    });

    it("should handle complex nested frontmatter", () => {
      const markdown = `---
sku: "TEST-001"
brand: "TestBrand"
name: "Test Product"
category: "test"
specs:
  display:
    size: "6.8"
    resolution: "3120x1440"
  battery:
    capacity: 5000
price:
  type: "msrp"
  currency: "BRL"
  value: 9999
---

Content here.
`;

      const result = parseProductMd(markdown);

      expect(result.frontmatter.specs).toBeDefined();
      expect((result.frontmatter.specs as any).display.size).toBe("6.8");
      expect((result.frontmatter.specs as any).battery.capacity).toBe(5000);
      expect((result.frontmatter.price as any).value).toBe(9999);
    });

    it("should handle empty content", () => {
      const markdown = `---
sku: "TEST-001"
brand: "TestBrand"
name: "Test Product"
category: "test"
---
`;

      const result = parseProductMd(markdown);

      expect(result.frontmatter.sku).toBe("TEST-001");
      expect(result.content).toBe("");
    });

    it("should handle arrays in frontmatter", () => {
      const markdown = `---
sku: "TEST-001"
brand: "TestBrand"
name: "Test Product"
category: "test"
narrative:
  highlights:
    - "Feature 1"
    - "Feature 2"
    - "Feature 3"
---

Content.
`;

      const result = parseProductMd(markdown);

      expect((result.frontmatter.narrative as any).highlights).toEqual([
        "Feature 1",
        "Feature 2",
        "Feature 3",
      ]);
    });
  });

  describe("serializeProduct", () => {
    it("should serialize back to markdown format", () => {
      const frontmatter = {
        sku: "TEST-001",
        brand: "TestBrand",
        name: "Test Product",
        category: "test",
      };
      const content = "# Test Product\n\nDescription here.";

      const result = serializeProduct(frontmatter, content);

      expect(result).toContain("sku: TEST-001");
      expect(result).toContain("brand: TestBrand");
      expect(result).toContain("name: Test Product");
      expect(result).toContain("category: test");
      expect(result).toContain("# Test Product");
      expect(result).toContain("Description here.");
    });

    it("should roundtrip parse -> serialize -> parse", () => {
      const original = `---
sku: "ROUND-001"
brand: "RoundBrand"
name: "Roundtrip Test"
category: "test"
---

# Content

Some description.
`;

      const parsed = parseProductMd(original);
      const serialized = serializeProduct(parsed.frontmatter, parsed.content);
      const reparsed = parseProductMd(serialized);

      expect(reparsed.frontmatter.sku).toBe(parsed.frontmatter.sku);
      expect(reparsed.frontmatter.brand).toBe(parsed.frontmatter.brand);
      expect(reparsed.frontmatter.name).toBe(parsed.frontmatter.name);
      expect(reparsed.content).toContain("# Content");
    });
  });

  describe("parseAndValidateProductMd", () => {
    it("should validate valid product", () => {
      const markdown = `---
schema: pkp/1.0
sku: "VALID-001"
brand: "ValidBrand"
name: "Valid Product"
category: "test/subcategory"
summary: "A valid test product"
---

# Valid Product

Description.
`;

      const result = parseAndValidateProductMd(markdown);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.sku).toBe("VALID-001");
      expect(result.content).toContain("# Valid Product");
    });

    it("should reject product without required fields", () => {
      const markdown = `---
sku: "INVALID-001"
---

Missing required fields.
`;

      const result = parseAndValidateProductMd(markdown);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain("brand");
    });

    it("should handle malformed YAML", () => {
      const markdown = `---
sku: "BAD
brand: broken yaml
---

Content.
`;

      const result = parseAndValidateProductMd(markdown);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should validate product with all optional fields", () => {
      const markdown = `---
schema: pkp/1.0
sku: "FULL-001"
brand: "FullBrand"
name: "Full Product"
category: "smartphones"
subcategory: "flagship"
summary: "Complete product with all fields"
canonical:
  domain: "example.com"
  url: "/.well-known/pkp/products/full-001.md"
identifiers:
  mpn: "FULL-001-MPN"
  ean: "1234567890123"
specs:
  display:
    size: "6.5"
price:
  type: "msrp"
  currency: "BRL"
  value: 5999
  source: "manufacturer"
  updated_at: "2026-02-09T12:00:00Z"
confidence:
  specs:
    level: "high"
    source: "manufacturer"
    verified_at: "2026-02-09T12:00:00Z"
highlights:
  - "Feature 1"
  - "Feature 2"
reviews:
  average_rating: 4.5
  total_reviews: 100
purchase_urls:
  - retailer: "Amazon"
    url: "https://amazon.com.br/product"
    ap2_enabled: false
family_id: "full-family"
variant_of: null
variant_attributes:
  - "storage"
---

# Full Product

Complete description.
`;

      const result = parseAndValidateProductMd(markdown);

      expect(result.success).toBe(true);
      expect(result.data?.sku).toBe("FULL-001");
      expect(result.data?.price?.value).toBe(5999);
      expect(result.data?.confidence?.specs?.level).toBe("high");
    });
  });
});
