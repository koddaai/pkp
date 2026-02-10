import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { InMemoryStorage } from "../src/storage/memory.js";
import type { RegisteredDomain, IndexedProduct } from "../src/types.js";

describe("InMemoryStorage", () => {
  let storage: InMemoryStorage;

  beforeEach(async () => {
    storage = new InMemoryStorage();
    await storage.initialize();
  });

  afterEach(async () => {
    await storage.close();
  });

  const createDomain = (name: string): RegisteredDomain => ({
    domain: name,
    catalog_url: `https://${name}/.well-known/pkp/catalog.json`,
    registered_at: new Date(),
    active: true,
    product_count: 0,
  });

  const createProduct = (sku: string, domain: string): IndexedProduct => ({
    uri: `pkp://${domain}/${sku}`,
    domain,
    sku,
    name: `Product ${sku}`,
    brand: "TestBrand",
    category: "notebooks",
    summary: `Summary for ${sku}`,
    price: { value: 1999, currency: "BRL" },
    completeness_score: 0.8,
    indexed_at: new Date(),
  });

  describe("Domain Operations", () => {
    it("saves and retrieves a domain", async () => {
      const domain = createDomain("test.com");
      await storage.saveDomain(domain);

      const retrieved = await storage.getDomain("test.com");
      expect(retrieved).not.toBeNull();
      expect(retrieved!.domain).toBe("test.com");
    });

    it("updates existing domain", async () => {
      const domain = createDomain("test.com");
      await storage.saveDomain(domain);

      domain.product_count = 10;
      await storage.saveDomain(domain);

      const retrieved = await storage.getDomain("test.com");
      expect(retrieved!.product_count).toBe(10);
    });

    it("returns null for non-existent domain", async () => {
      const result = await storage.getDomain("nonexistent.com");
      expect(result).toBeNull();
    });

    it("gets all domains", async () => {
      await storage.saveDomain(createDomain("test1.com"));
      await storage.saveDomain(createDomain("test2.com"));

      const domains = await storage.getAllDomains();
      expect(domains.length).toBe(2);
    });

    it("deletes domain and its products", async () => {
      const domain = createDomain("test.com");
      await storage.saveDomain(domain);
      await storage.saveProduct(createProduct("sku1", "test.com"));
      await storage.saveProduct(createProduct("sku2", "test.com"));

      await storage.deleteDomain("test.com");

      const retrieved = await storage.getDomain("test.com");
      expect(retrieved).toBeNull();

      const products = await storage.search({ domain: "test.com" });
      expect(products.length).toBe(0);
    });

    it("updates crawl status", async () => {
      const domain = createDomain("test.com");
      await storage.saveDomain(domain);

      await storage.updateDomainCrawlStatus("test.com", "success");
      let retrieved = await storage.getDomain("test.com");
      expect(retrieved!.last_crawl_status).toBe("success");

      await storage.updateDomainCrawlStatus("test.com", "failed", "Connection error");
      retrieved = await storage.getDomain("test.com");
      expect(retrieved!.last_crawl_status).toBe("failed");
      expect(retrieved!.last_error).toBe("Connection error");
    });
  });

  describe("Product Operations", () => {
    it("saves and retrieves a product", async () => {
      const product = createProduct("test-sku", "test.com");
      await storage.saveProduct(product);

      const retrieved = await storage.getProduct("pkp://test.com/test-sku");
      expect(retrieved).not.toBeNull();
      expect(retrieved!.sku).toBe("test-sku");
    });

    it("saves multiple products", async () => {
      const products = [
        createProduct("sku1", "test.com"),
        createProduct("sku2", "test.com"),
        createProduct("sku3", "test.com"),
      ];
      await storage.saveProducts(products);

      const stats = await storage.getStats();
      expect(stats.total_products).toBe(3);
    });

    it("returns null for non-existent product", async () => {
      const result = await storage.getProduct("pkp://test.com/nonexistent");
      expect(result).toBeNull();
    });

    it("updates existing product", async () => {
      const product = createProduct("test-sku", "test.com");
      await storage.saveProduct(product);

      product.name = "Updated Product Name";
      await storage.saveProduct(product);

      const retrieved = await storage.getProduct("pkp://test.com/test-sku");
      expect(retrieved!.name).toBe("Updated Product Name");
    });
  });

  describe("Search Operations", () => {
    beforeEach(async () => {
      // Add test products
      await storage.saveProduct({
        ...createProduct("galaxy-s24", "samsung.com"),
        name: "Samsung Galaxy S24 Ultra",
        brand: "Samsung",
        category: "celulares/smartphones",
        summary: "Smartphone premium com câmera de 200MP",
        price: { value: 10499, currency: "BRL" },
      });

      await storage.saveProduct({
        ...createProduct("iphone-16", "apple.com"),
        name: "iPhone 16 Pro Max",
        brand: "Apple",
        category: "celulares/smartphones",
        summary: "iPhone topo de linha com chip A18",
        price: { value: 12499, currency: "BRL" },
      });

      await storage.saveProduct({
        ...createProduct("macbook-air", "apple.com"),
        name: "MacBook Air M4",
        brand: "Apple",
        category: "notebooks",
        summary: "Notebook ultrafino com chip Apple Silicon",
        price: { value: 13999, currency: "BRL" },
      });
    });

    it("searches by query", async () => {
      const results = await storage.search({ query: "samsung" });
      expect(results.length).toBe(1);
      expect(results[0].brand).toBe("Samsung");
    });

    it("searches by partial query", async () => {
      const results = await storage.search({ query: "galaxy" });
      expect(results.length).toBe(1);
      expect(results[0].name).toContain("Galaxy");
    });

    it("filters by domain", async () => {
      const results = await storage.search({ domain: "apple.com" });
      expect(results.length).toBe(2);
      for (const result of results) {
        expect(result.domain).toBe("apple.com");
      }
    });

    it("filters by category", async () => {
      const results = await storage.search({ category: "smartphones" });
      expect(results.length).toBe(2);
    });

    it("filters by brand", async () => {
      const results = await storage.search({ brand: "Apple" });
      expect(results.length).toBe(2);
    });

    it("filters by price range", async () => {
      const results = await storage.search({
        minPrice: 12000,
        maxPrice: 14000,
      });
      expect(results.length).toBe(2);
      for (const result of results) {
        expect(result.price!.value).toBeGreaterThanOrEqual(12000);
        expect(result.price!.value).toBeLessThanOrEqual(14000);
      }
    });

    it("combines query and filters", async () => {
      const results = await storage.search({
        query: "pro",
        category: "smartphones",
      });
      expect(results.length).toBeGreaterThan(0);
      for (const result of results) {
        expect(result.category.toLowerCase()).toContain("smartphone");
      }
    });

    it("respects limit", async () => {
      const results = await storage.search({ limit: 1 });
      expect(results.length).toBe(1);
    });

    it("respects offset", async () => {
      const all = await storage.search({ limit: 10 });
      const offset = await storage.search({ limit: 10, offset: 1 });
      expect(offset.length).toBe(all.length - 1);
    });

    it("returns empty for no matches", async () => {
      const results = await storage.search({ query: "nonexistent" });
      expect(results.length).toBe(0);
    });
  });

  describe("Stats and Listings", () => {
    beforeEach(async () => {
      await storage.saveDomain({
        ...createDomain("test.com"),
        active: true,
        last_crawl_status: "success",
      });
      await storage.saveDomain({
        ...createDomain("inactive.com"),
        active: false,
      });

      await storage.saveProduct({
        ...createProduct("p1", "test.com"),
        category: "notebooks",
        brand: "Dell",
      });
      await storage.saveProduct({
        ...createProduct("p2", "test.com"),
        category: "notebooks",
        brand: "Apple",
      });
      await storage.saveProduct({
        ...createProduct("p3", "test.com"),
        category: "smartphones",
        brand: "Apple",
      });
    });

    it("returns correct stats", async () => {
      const stats = await storage.getStats();
      expect(stats.total_domains).toBe(2);
      expect(stats.active_domains).toBe(1);
      expect(stats.total_products).toBe(3);
      expect(stats.total_categories).toBe(2);
    });

    it("lists categories with counts", async () => {
      const categories = await storage.listCategories();
      expect(categories.length).toBe(2);

      const notebooks = categories.find((c) => c.name === "notebooks");
      expect(notebooks).toBeDefined();
      expect(notebooks!.count).toBe(2);
    });

    it("lists brands with counts", async () => {
      const brands = await storage.listBrands();
      expect(brands.length).toBe(2);

      const apple = brands.find((b) => b.name === "Apple");
      expect(apple).toBeDefined();
      expect(apple!.count).toBe(2);
    });

    it("sorts categories by count", async () => {
      const categories = await storage.listCategories();
      for (let i = 1; i < categories.length; i++) {
        expect(categories[i - 1].count).toBeGreaterThanOrEqual(categories[i].count);
      }
    });
  });
});
