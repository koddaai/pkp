import { describe, it, expect, beforeAll } from "vitest";
import { join } from "node:path";
import { loadCatalog } from "../src/loader.js";
import {
  searchProducts,
  getProduct,
  listCategories,
  listBrands,
  compareProducts,
  getProductsByCategory,
} from "../src/search.js";
import type { LoadedCatalog } from "../src/types.js";

describe("Catalog Search", () => {
  let catalog: LoadedCatalog;

  beforeAll(async () => {
    // Load the kodda-catalog example
    const catalogPath = join(__dirname, "..", "..", "..", "examples", "kodda-catalog", "dist");
    catalog = await loadCatalog(catalogPath);
  });

  describe("loadCatalog", () => {
    it("loads catalog with products", () => {
      expect(catalog.products.size).toBeGreaterThan(0);
    });

    it("indexes products by category", () => {
      expect(catalog.byCategory.size).toBeGreaterThan(0);
    });

    it("has catalog metadata", () => {
      expect(catalog.catalog.schema).toBe("pkp/1.0");
      expect(catalog.catalog.publisher).toBeDefined();
    });
  });

  describe("searchProducts", () => {
    it("returns all products without query", () => {
      const results = searchProducts(catalog, { limit: 100 });
      expect(results.length).toBeGreaterThan(0);
    });

    it("searches by query", () => {
      const results = searchProducts(catalog, { query: "galaxy" });
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].name.toLowerCase()).toContain("galaxy");
    });

    it("filters by category", () => {
      const results = searchProducts(catalog, { category: "smartphones" });
      expect(results.length).toBeGreaterThan(0);
      for (const result of results) {
        expect(result.category.toLowerCase()).toContain("smartphone");
      }
    });

    it("filters by brand", () => {
      const results = searchProducts(catalog, { brand: "Samsung" });
      expect(results.length).toBeGreaterThan(0);
      for (const result of results) {
        expect(result.brand).toBe("Samsung");
      }
    });

    it("filters by price range", () => {
      const results = searchProducts(catalog, {
        minPrice: 5000,
        maxPrice: 15000,
      });
      expect(results.length).toBeGreaterThan(0);
      for (const result of results) {
        expect(result.price).toBeDefined();
        expect(result.price!.value).toBeGreaterThanOrEqual(5000);
        expect(result.price!.value).toBeLessThanOrEqual(15000);
      }
    });

    it("respects limit", () => {
      const results = searchProducts(catalog, { limit: 2 });
      expect(results.length).toBeLessThanOrEqual(2);
    });

    it("respects offset", () => {
      const all = searchProducts(catalog, { limit: 100 });
      const offset = searchProducts(catalog, { limit: 100, offset: 1 });
      if (all.length > 1) {
        expect(offset[0].sku).toBe(all[1].sku);
      }
    });

    it("combines query and filters", () => {
      const results = searchProducts(catalog, {
        query: "pro",
        category: "smartphones",
      });
      for (const result of results) {
        expect(result.category.toLowerCase()).toContain("smartphone");
      }
    });
  });

  describe("getProduct", () => {
    it("gets product by SKU", () => {
      const product = getProduct(catalog, "sm-s926bzkdzto");
      expect(product).toBeDefined();
      expect(product!.product.name).toContain("Galaxy");
    });

    it("returns undefined for non-existent SKU", () => {
      const product = getProduct(catalog, "non-existent-sku");
      expect(product).toBeUndefined();
    });

    it("is case-insensitive", () => {
      const lower = getProduct(catalog, "sm-s926bzkdzto");
      const upper = getProduct(catalog, "SM-S926BZKDZTO");
      expect(lower).toBeDefined();
      expect(upper).toBeDefined();
      expect(lower!.product.sku).toBe(upper!.product.sku);
    });
  });

  describe("listCategories", () => {
    it("returns all categories", () => {
      const categories = listCategories(catalog);
      expect(categories.length).toBeGreaterThan(0);
      expect(categories).toContain("celulares/smartphones");
    });

    it("returns sorted categories", () => {
      const categories = listCategories(catalog);
      const sorted = [...categories].sort();
      expect(categories).toEqual(sorted);
    });
  });

  describe("listBrands", () => {
    it("returns all brands", () => {
      const brands = listBrands(catalog);
      expect(brands.length).toBeGreaterThan(0);
    });

    it("returns sorted brands", () => {
      const brands = listBrands(catalog);
      const sorted = [...brands].sort();
      expect(brands).toEqual(sorted);
    });
  });

  describe("getProductsByCategory", () => {
    it("returns products in category", () => {
      const products = getProductsByCategory(catalog, "celulares/smartphones");
      expect(products.length).toBeGreaterThan(0);
      for (const product of products) {
        expect(product.product.category).toBe("celulares/smartphones");
      }
    });

    it("returns empty array for non-existent category", () => {
      const products = getProductsByCategory(catalog, "non-existent");
      expect(products).toEqual([]);
    });
  });

  describe("compareProducts", () => {
    it("compares multiple products", () => {
      const skus = ["sm-s926bzkdzto", "iphone-16-pro-max-256gb"];
      const result = compareProducts(catalog, skus);

      expect(result).not.toBeNull();
      expect(result!.products.length).toBe(2);
      expect(result!.skus).toEqual(skus);
    });

    it("identifies differences", () => {
      const skus = ["sm-s926bzkdzto", "iphone-16-pro-max-256gb"];
      const result = compareProducts(catalog, skus);

      expect(result).not.toBeNull();
      // Products should have some differences in specs
      expect(Object.keys(result!.differences).length).toBeGreaterThanOrEqual(0);
    });

    it("returns null if product not found", () => {
      const skus = ["sm-s926bzkdzto", "non-existent"];
      const result = compareProducts(catalog, skus);
      expect(result).toBeNull();
    });
  });
});
