import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { parseProductMd, parseAndValidateProductMd } from "../src/parser.js";
import { validateProductMd, validateProduct } from "../src/validator.js";
import { getCategoryMinCompleteness } from "../src/schemas/categories/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const examplesDir = join(__dirname, "../../../examples/kodda-catalog");

/**
 * Helper to load a PRODUCT.md file
 */
function loadExample(path: string): string {
  return readFileSync(join(examplesDir, path), "utf-8");
}

describe("PRODUCT.md Examples", () => {
  describe("Smartphones", () => {
    it("Galaxy S25 Ultra should be valid", () => {
      const content = loadExample("smartphones/galaxy-s25-ultra.md");
      const result = validateProductMd(content);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);

      const parsed = parseProductMd(content);
      expect(parsed.frontmatter.sku).toBe("SM-S926BZKDZTO");
      expect(parsed.frontmatter.brand).toBe("Samsung");
      expect(parsed.frontmatter.category).toBe("celulares/smartphones");
    });

    it("Galaxy S25 Ultra should meet category threshold", () => {
      const content = loadExample("smartphones/galaxy-s25-ultra.md");
      const result = validateProductMd(content);

      expect(result.meetsThreshold).toBe(true);
      expect(result.completeness).toBeGreaterThanOrEqual(0.7);
    });

    it("iPhone 16 Pro Max should be valid", () => {
      const content = loadExample("smartphones/iphone-16-pro-max.md");
      const result = validateProductMd(content);

      expect(result.valid).toBe(true);

      const parsed = parseProductMd(content);
      expect(parsed.frontmatter.brand).toBe("Apple");
    });

    it("Pixel 9 Pro XL should be valid", () => {
      const content = loadExample("smartphones/pixel-9-pro-xl.md");
      const result = validateProductMd(content);

      expect(result.valid).toBe(true);

      const parsed = parseProductMd(content);
      expect(parsed.frontmatter.brand).toBe("Google");
    });
  });

  describe("Notebooks", () => {
    it("MacBook Air M4 15 should be valid", () => {
      const content = loadExample("notebooks/macbook-air-m4-15.md");
      const result = validateProductMd(content);

      expect(result.valid).toBe(true);

      const parsed = parseProductMd(content);
      expect(parsed.frontmatter.brand).toBe("Apple");
      expect(parsed.frontmatter.category).toBe("notebooks");
    });

    it("Dell XPS 15 2025 should be valid", () => {
      const content = loadExample("notebooks/dell-xps-15-2025.md");
      const result = validateProductMd(content);

      expect(result.valid).toBe(true);

      const parsed = parseProductMd(content);
      expect(parsed.frontmatter.brand).toBe("Dell");
    });
  });

  describe("TVs", () => {
    it("Samsung Neo QLED 65 should be valid", () => {
      const content = loadExample("tvs/samsung-neo-qled-65.md");
      const result = validateProductMd(content);

      expect(result.valid).toBe(true);

      const parsed = parseProductMd(content);
      expect(parsed.frontmatter.brand).toBe("Samsung");
      expect(parsed.frontmatter.category).toBe("tvs");
    });
  });

  describe("Eletrodomesticos", () => {
    it("Electrolux Lava Loucas LV14B should be valid", () => {
      const content = loadExample("eletrodomesticos/electrolux-lava-loucas-lv14b.md");
      const result = validateProductMd(content);

      expect(result.valid).toBe(true);

      const parsed = parseProductMd(content);
      expect(parsed.frontmatter.brand).toBe("Electrolux");
      expect(parsed.frontmatter.category).toBe("eletrodomesticos");
    });
  });

  describe("Moda", () => {
    it("Nike Air Max 90 should be valid", () => {
      const content = loadExample("moda/nike-air-max-90.md");
      const result = validateProductMd(content);

      expect(result.valid).toBe(true);

      const parsed = parseProductMd(content);
      expect(parsed.frontmatter.brand).toBe("Nike");
      expect(parsed.frontmatter.category).toBe("moda");
    });

    it("Adidas Ultraboost Light should be valid", () => {
      const content = loadExample("moda/adidas-ultraboost-light.md");
      const result = validateProductMd(content);

      expect(result.valid).toBe(true);

      const parsed = parseProductMd(content);
      expect(parsed.frontmatter.brand).toBe("Adidas");
    });
  });

  describe("Games", () => {
    it("PlayStation 5 Pro should be valid", () => {
      const content = loadExample("games/playstation-5-pro.md");
      const result = validateProductMd(content);

      expect(result.valid).toBe(true);

      const parsed = parseProductMd(content);
      expect(parsed.frontmatter.brand).toBe("Sony");
      expect(parsed.frontmatter.category).toBe("games");
    });
  });

  describe("All Examples Validation Summary", () => {
    const examples = [
      { path: "smartphones/galaxy-s25-ultra.md", category: "smartphones" },
      { path: "smartphones/iphone-16-pro-max.md", category: "smartphones" },
      { path: "smartphones/pixel-9-pro-xl.md", category: "smartphones" },
      { path: "notebooks/macbook-air-m4-15.md", category: "notebooks" },
      { path: "notebooks/dell-xps-15-2025.md", category: "notebooks" },
      { path: "tvs/samsung-neo-qled-65.md", category: "tvs" },
      { path: "eletrodomesticos/electrolux-lava-loucas-lv14b.md", category: "eletrodomesticos" },
      { path: "moda/nike-air-max-90.md", category: "moda" },
      { path: "moda/adidas-ultraboost-light.md", category: "moda" },
      { path: "games/playstation-5-pro.md", category: "games" },
    ];

    it("all examples should be valid", () => {
      for (const example of examples) {
        const content = loadExample(example.path);
        const result = validateProductMd(content);

        expect(result.valid, `${example.path} should be valid`).toBe(true);
      }
    });

    it("all examples should have required frontmatter fields", () => {
      for (const example of examples) {
        const content = loadExample(example.path);
        const parsed = parseProductMd(content);

        expect(parsed.frontmatter.sku, `${example.path} should have sku`).toBeDefined();
        expect(parsed.frontmatter.brand, `${example.path} should have brand`).toBeDefined();
        expect(parsed.frontmatter.name, `${example.path} should have name`).toBeDefined();
        expect(parsed.frontmatter.category, `${example.path} should have category`).toBeDefined();
      }
    });

    it("all examples should have content section", () => {
      for (const example of examples) {
        const content = loadExample(example.path);
        const parsed = parseProductMd(content);

        expect(parsed.content.length, `${example.path} should have content`).toBeGreaterThan(0);
      }
    });

    it("all examples should have price information", () => {
      for (const example of examples) {
        const content = loadExample(example.path);
        const parsed = parseProductMd(content);

        expect(parsed.frontmatter.price, `${example.path} should have price`).toBeDefined();
      }
    });

    it("all examples should have confidence information", () => {
      for (const example of examples) {
        const content = loadExample(example.path);
        const parsed = parseProductMd(content);

        expect(parsed.frontmatter.confidence, `${example.path} should have confidence`).toBeDefined();
      }
    });
  });

  describe("Product URI Format", () => {
    it("all examples should have valid canonical domain", () => {
      const examples = [
        "smartphones/galaxy-s25-ultra.md",
        "smartphones/iphone-16-pro-max.md",
        "notebooks/macbook-air-m4-15.md",
      ];

      for (const path of examples) {
        const content = loadExample(path);
        const parsed = parseProductMd(content);

        if (parsed.frontmatter.canonical) {
          const canonical = parsed.frontmatter.canonical as { domain: string; url: string };
          expect(canonical.domain).toBeDefined();
          expect(canonical.url).toContain("/.well-known/pkp/");
        }
      }
    });
  });
});
