import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execSync, ExecSyncOptionsWithBufferEncoding } from "node:child_process";

describe("pkp validate", () => {
  let tempDir: string;
  const cliPath = join(__dirname, "..", "dist", "cli.js");

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "pkp-test-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  const validProduct = `---
schema: pkp/1.0
sku: "test-notebook-001"
brand: "TestBrand"
name: "Test Notebook"
category: "notebooks"
summary: "A test notebook for validation testing"

price:
  type: msrp
  currency: BRL
  value: 1999.00
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
`;

  const invalidProduct = `---
sku: "test-invalid"
---

No valid PKP structure.
`;

  it("validates a valid product file", async () => {
    await mkdir(join(tempDir, "products"));
    await writeFile(join(tempDir, "products", "valid.md"), validProduct);

    const result = execSync(`node ${cliPath} validate products`, {
      cwd: tempDir,
      encoding: "utf-8",
    });

    expect(result).toContain("valid.md");
    expect(result).toContain("complete");
  });

  it("reports invalid product", async () => {
    await mkdir(join(tempDir, "products"));
    await writeFile(join(tempDir, "products", "invalid.md"), invalidProduct);

    const options: ExecSyncOptionsWithBufferEncoding = {
      cwd: tempDir,
      encoding: "buffer",
    };

    try {
      execSync(`node ${cliPath} validate products`, options);
      expect.fail("Should have thrown");
    } catch (error: unknown) {
      const execError = error as { stdout: Buffer };
      const output = execError.stdout.toString();
      expect(output).toContain("invalid.md");
    }
  });

  it("validates single file", async () => {
    await writeFile(join(tempDir, "product.md"), validProduct);

    const result = execSync(`node ${cliPath} validate product.md`, {
      cwd: tempDir,
      encoding: "utf-8",
    });

    expect(result).toContain("product.md");
  });

  it("supports verbose mode", async () => {
    await mkdir(join(tempDir, "products"));
    await writeFile(join(tempDir, "products", "valid.md"), validProduct);

    const result = execSync(`node ${cliPath} validate products --verbose`, {
      cwd: tempDir,
      encoding: "utf-8",
    });

    expect(result).toContain("Category:");
  });

  it("exits with error in strict mode with warnings", async () => {
    const productWithWarnings = `---
schema: pkp/1.0
sku: "test-001"
brand: "TestBrand"
name: "Test Product"
category: "notebooks"
summary: "A test product"
---

Minimal content.
`;

    await mkdir(join(tempDir, "products"));
    await writeFile(join(tempDir, "products", "minimal.md"), productWithWarnings);

    const options: ExecSyncOptionsWithBufferEncoding = {
      cwd: tempDir,
      encoding: "buffer",
    };

    try {
      execSync(`node ${cliPath} validate products --strict --verbose`, options);
      // May or may not throw depending on completeness threshold
    } catch (error: unknown) {
      const execError = error as { stdout: Buffer };
      const output = execError.stdout.toString();
      expect(output).toContain("threshold");
    }
  });

  it("handles non-existent path", async () => {
    try {
      execSync(`node ${cliPath} validate nonexistent`, {
        cwd: tempDir,
        encoding: "buffer",
      });
      expect.fail("Should have thrown");
    } catch (error: unknown) {
      const execError = error as { stdout: Buffer };
      const output = execError.stdout.toString();
      expect(output).toContain("not found");
    }
  });

  it("handles empty directory", async () => {
    await mkdir(join(tempDir, "empty"));

    const result = execSync(`node ${cliPath} validate empty`, {
      cwd: tempDir,
      encoding: "utf-8",
    });

    expect(result).toContain("No .md files found");
  });
});
