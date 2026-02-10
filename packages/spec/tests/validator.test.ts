import { describe, it, expect } from "vitest";
import {
  validateProduct,
  validateProductMd,
  validateProducts,
  calculateCompleteness,
  getCategoryThreshold,
} from "../src/validator.js";

describe("Validator", () => {
  describe("calculateCompleteness", () => {
    it("should return 0 for empty object", () => {
      expect(calculateCompleteness({})).toBe(0);
    });

    it("should calculate correct completeness for partial data", () => {
      const data = {
        sku: "TEST-001",
        brand: "TestBrand",
        name: "Test Product",
        category: "test",
      };
      // 4 out of 8 core fields (sku, brand, name, category, summary, price, confidence, specs)
      expect(calculateCompleteness(data)).toBe(0.5);
    });

    it("should return 1 for complete data", () => {
      const data = {
        sku: "TEST-001",
        brand: "TestBrand",
        name: "Test Product",
        category: "test",
        summary: "Test summary",
        price: { type: "msrp", value: 100 },
        confidence: { specs: { level: "high" } },
        specs: { something: "value" },
      };
      expect(calculateCompleteness(data)).toBe(1);
    });

    it("should ignore empty strings", () => {
      const data = {
        sku: "",
        brand: "TestBrand",
        name: "Test Product",
        category: "test",
      };
      // 3 out of 8 (empty string doesn't count)
      expect(calculateCompleteness(data)).toBe(0.375);
    });
  });

  describe("getCategoryThreshold", () => {
    it("should return correct threshold for smartphones", () => {
      expect(getCategoryThreshold("smartphones")).toBe(0.7);
      expect(getCategoryThreshold("celulares/smartphones")).toBe(0.7);
    });

    it("should return correct threshold for notebooks", () => {
      expect(getCategoryThreshold("notebooks")).toBe(0.7);
    });

    it("should return correct threshold for tvs", () => {
      expect(getCategoryThreshold("tvs")).toBe(0.6);
    });

    it("should return correct threshold for moda", () => {
      expect(getCategoryThreshold("moda")).toBe(0.5);
    });

    it("should return default threshold for unknown category", () => {
      expect(getCategoryThreshold("unknown-category")).toBe(0.6);
    });
  });

  describe("validateProduct", () => {
    it("should validate minimal valid product", () => {
      const product = {
        schema: "pkp/1.0",
        sku: "TEST-001",
        brand: "TestBrand",
        name: "Test Product",
        category: "test",
        summary: "A test product summary",
      };

      const result = validateProduct(product);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject product without required fields", () => {
      const product = {
        sku: "TEST-001",
      };

      const result = validateProduct(product);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some((e) => e.includes("brand"))).toBe(true);
    });

    it("should warn about missing confidence", () => {
      const product = {
        schema: "pkp/1.0",
        sku: "TEST-001",
        brand: "TestBrand",
        name: "Test Product",
        category: "test",
        summary: "Test summary",
      };

      const result = validateProduct(product);

      expect(result.warnings.some((w) => w.includes("confidence"))).toBe(true);
    });

    it("should warn about missing price", () => {
      const product = {
        schema: "pkp/1.0",
        sku: "TEST-001",
        brand: "TestBrand",
        name: "Test Product",
        category: "test",
        summary: "Test summary",
      };

      const result = validateProduct(product);

      expect(result.warnings.some((w) => w.includes("price"))).toBe(true);
    });

    it("should calculate completeness correctly", () => {
      const product = {
        schema: "pkp/1.0",
        sku: "TEST-001",
        brand: "TestBrand",
        name: "Test Product",
        category: "test",
        summary: "Summary",
        price: { type: "msrp", value: 100, currency: "BRL", source: "test", updated_at: "2026-02-09T12:00:00Z" },
        confidence: { specs: { level: "high", source: "manufacturer", verified_at: "2026-02-09T12:00:00Z" } },
        specs: { display: { size: "6.5" } },
      };

      const result = validateProduct(product);

      expect(result.completeness).toBe(1);
      expect(result.meetsThreshold).toBe(true);
    });

    it("should warn when below category threshold", () => {
      const product = {
        schema: "pkp/1.0",
        sku: "TEST-001",
        brand: "TestBrand",
        name: "Test Product",
        category: "smartphones", // 70% threshold
        summary: "Test summary",
      };

      const result = validateProduct(product);

      expect(result.meetsThreshold).toBe(false);
      expect(result.threshold).toBe(0.7);
      expect(result.warnings.some((w) => w.includes("Completeness"))).toBe(true);
    });

    it("should include category metadata", () => {
      const product = {
        schema: "pkp/1.0",
        sku: "TEST-001",
        brand: "Samsung",
        name: "Galaxy Test",
        category: "smartphones",
        subcategory: "flagship",
        summary: "Test smartphone summary",
      };

      const result = validateProduct(product);

      expect(result.categoryMeta).toBeDefined();
      expect(result.categoryMeta?.category).toBe("celulares/smartphones");
      expect(result.categoryMeta?.minCompleteness).toBe(0.7);
    });

    it("should validate full smartphone product", () => {
      const product = {
        schema: "pkp/1.0",
        sku: "SM-S928B",
        brand: "Samsung",
        name: "Galaxy S25 Ultra",
        category: "celulares/smartphones",
        subcategory: "flagship",
        summary: "O smartphone mais avancado da Samsung",
        specs: {
          display: {
            size_inches: 6.9,
            resolution: "3120x1440",
            technology: "Dynamic AMOLED 2X",
            refresh_rate_hz: 120,
          },
          processor: {
            name: "Snapdragon 8 Elite",
            cores: 8,
          },
          camera: {
            main_mp: 200,
            ultrawide_mp: 12,
            telephoto_mp: 50,
            video_max: "8K@30fps",
          },
          battery: {
            capacity_mah: 5000,
            fast_charge_watts: 45,
            wireless_charge: true,
          },
          storage: {
            internal_gb: 256,
            ram_gb: 12,
          },
          connectivity: {
            five_g: true,
            wifi: "Wi-Fi 7",
            bluetooth: "5.4",
            nfc: true,
          },
          physical: {
            weight_grams: 232,
            ip_rating: "IP68",
          },
          software: {
            os: "Android 15",
            ui: "One UI 7",
            update_years: 7,
          },
        },
        price: {
          type: "msrp",
          currency: "BRL",
          value: 13499,
          source: "manufacturer",
          updated_at: "2026-02-09T12:00:00Z",
        },
        confidence: {
          specs: {
            level: "high",
            source: "manufacturer",
            verified_at: "2026-02-09T12:00:00Z",
          },
        },
      };

      const result = validateProduct(product);

      expect(result.valid).toBe(true);
      expect(result.completeness).toBe(1);
      expect(result.meetsThreshold).toBe(true);
    });
  });

  describe("validateProductMd", () => {
    it("should validate valid PRODUCT.md", () => {
      const markdown = `---
schema: pkp/1.0
sku: "TEST-001"
brand: "TestBrand"
name: "Test Product"
category: "test"
summary: "Test summary"
---

# Test Product

Description here.
`;

      const result = validateProductMd(markdown);

      expect(result.valid).toBe(true);
    });

    it("should reject invalid PRODUCT.md", () => {
      const markdown = `---
sku: "TEST-001"
---

Missing fields.
`;

      const result = validateProductMd(markdown);

      expect(result.valid).toBe(false);
    });

    it("should handle malformed markdown", () => {
      const markdown = `not valid yaml frontmatter`;

      const result = validateProductMd(markdown);

      expect(result.valid).toBe(false);
      expect(result.completeness).toBe(0);
    });
  });

  describe("validateProducts", () => {
    it("should validate multiple products", () => {
      const products = [
        {
          name: "product1",
          data: {
            schema: "pkp/1.0",
            sku: "P1",
            brand: "Brand1",
            name: "Product 1",
            category: "test",
            summary: "Product 1 summary",
          },
        },
        {
          name: "product2",
          data: {
            schema: "pkp/1.0",
            sku: "P2",
            brand: "Brand2",
            name: "Product 2",
            category: "test",
            summary: "Product 2 summary",
          },
        },
        {
          name: "invalid",
          data: {
            sku: "P3",
          },
        },
      ];

      const result = validateProducts(products);

      expect(result.total).toBe(3);
      expect(result.valid).toBe(2);
      expect(result.invalid).toBe(1);
      expect(result.results).toHaveLength(3);
    });

    it("should track below threshold products", () => {
      const products = [
        {
          name: "low-completeness",
          data: {
            schema: "pkp/1.0",
            sku: "P1",
            brand: "Brand1",
            name: "Product 1",
            category: "smartphones", // 70% threshold
            summary: "Summary",
          },
        },
        {
          name: "high-completeness",
          data: {
            schema: "pkp/1.0",
            sku: "P2",
            brand: "Brand2",
            name: "Product 2",
            category: "moda", // 50% threshold
            summary: "Summary",
            price: { type: "msrp", value: 100, currency: "BRL", source: "test", updated_at: "2026-02-09T12:00:00Z" },
            confidence: { specs: { level: "high", source: "manufacturer", verified_at: "2026-02-09T12:00:00Z" } },
            specs: { size: "M" },
          },
        },
      ];

      const result = validateProducts(products);

      expect(result.belowThreshold).toBe(1);
    });
  });
});
