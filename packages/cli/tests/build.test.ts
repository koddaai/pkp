import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, writeFile, mkdir, readFile, access } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execSync } from "node:child_process";

describe("pkp build", () => {
  let tempDir: string;
  const cliPath = join(__dirname, "..", "dist", "cli.js");

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "pkp-test-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  const config = `schema: pkp/1.0

publisher:
  name: "Test Publisher"
  type: community
  domain: "test.example.com"
  contact: "test@example.com"

sources:
  - "./products"

output: "./dist"

categories:
  - "notebooks"
`;

  const validProduct = `---
schema: pkp/1.0
sku: "notebook-001"
brand: "TestBrand"
name: "Test Notebook"
category: "notebooks"
summary: "A test notebook for building"

price:
  type: msrp
  currency: BRL
  value: 2999.00
  source: manufacturer
  updated_at: "2024-01-01T00:00:00Z"

specs:
  display:
    size_inches: 15.6
    resolution: "1920x1080"
  processor:
    name: "Intel Core i7-1355U"
  memory:
    ram_gb: 16
  storage:
    ssd_gb: 512
  battery:
    capacity_wh: 56
  physical:
    weight_kg: 1.8
  software:
    os: "Windows 11"

confidence:
  specs:
    level: high
    source: manufacturer
    verified_at: "2024-01-01T00:00:00Z"
---

## About
This is a test notebook.

## FAQ
### Is this a good notebook?
Yes, it's great for testing.
`;

  async function setupCatalog(): Promise<void> {
    await writeFile(join(tempDir, "pkp.config.yml"), config);
    await mkdir(join(tempDir, "products"));
    await writeFile(join(tempDir, "products", "notebook-001.md"), validProduct);
  }

  it("generates .well-known/pkp/ structure", async () => {
    await setupCatalog();

    execSync(`node ${cliPath} build`, { cwd: tempDir });

    // Check catalog.json exists
    const catalogPath = join(tempDir, "dist", ".well-known", "pkp", "catalog.json");
    await expect(access(catalogPath)).resolves.toBeUndefined();

    const catalog = JSON.parse(await readFile(catalogPath, "utf-8"));
    expect(catalog.schema).toBe("pkp/1.0");
    expect(catalog.publisher).toBeDefined();
    expect(catalog.products).toBeInstanceOf(Array);
    expect(catalog.products.length).toBe(1);
  });

  it("generates product files", async () => {
    await setupCatalog();

    execSync(`node ${cliPath} build`, { cwd: tempDir });

    // Check product file exists
    const productPath = join(tempDir, "dist", ".well-known", "pkp", "products", "notebook-001.md");
    await expect(access(productPath)).resolves.toBeUndefined();

    const content = await readFile(productPath, "utf-8");
    expect(content).toContain("notebook-001");
    expect(content).toContain("Test Notebook");
  });

  it("generates pkp.txt", async () => {
    await setupCatalog();

    execSync(`node ${cliPath} build`, { cwd: tempDir });

    const pkpTxtPath = join(tempDir, "dist", "pkp.txt");
    await expect(access(pkpTxtPath)).resolves.toBeUndefined();

    const content = await readFile(pkpTxtPath, "utf-8");
    expect(content).toContain(".well-known/pkp/");
  });

  it("supports custom output directory", async () => {
    await setupCatalog();

    execSync(`node ${cliPath} build --output custom-output`, { cwd: tempDir });

    const catalogPath = join(tempDir, "custom-output", ".well-known", "pkp", "catalog.json");
    await expect(access(catalogPath)).resolves.toBeUndefined();
  });

  it("handles multiple products", async () => {
    await setupCatalog();

    const secondProduct = validProduct.replace("notebook-001", "notebook-002").replace("Test Notebook", "Second Notebook");
    await writeFile(join(tempDir, "products", "notebook-002.md"), secondProduct);

    execSync(`node ${cliPath} build`, { cwd: tempDir });

    const catalogPath = join(tempDir, "dist", ".well-known", "pkp", "catalog.json");
    const catalog = JSON.parse(await readFile(catalogPath, "utf-8"));
    expect(catalog.products.length).toBe(2);
  });

  it("includes catalog metadata", async () => {
    await setupCatalog();

    execSync(`node ${cliPath} build`, { cwd: tempDir });

    const catalogPath = join(tempDir, "dist", ".well-known", "pkp", "catalog.json");
    const catalog = JSON.parse(await readFile(catalogPath, "utf-8"));

    expect(catalog.total_products).toBe(1);
    expect(catalog.categories).toContain("notebooks");
    expect(catalog.publisher).toBeDefined();
  });

  it("verbose mode shows detailed output", async () => {
    await setupCatalog();

    const result = execSync(`node ${cliPath} build --verbose`, {
      cwd: tempDir,
      encoding: "utf-8",
    });

    expect(result).toContain("notebook-001");
  });

  it("fails without config file", async () => {
    await mkdir(join(tempDir, "products"));
    await writeFile(join(tempDir, "products", "test.md"), validProduct);

    try {
      execSync(`node ${cliPath} build`, {
        cwd: tempDir,
        encoding: "buffer",
      });
      expect.fail("Should have thrown");
    } catch (error: unknown) {
      const execError = error as { stdout: Buffer };
      const output = execError.stdout.toString();
      expect(output).toContain("config");
    }
  });
});
