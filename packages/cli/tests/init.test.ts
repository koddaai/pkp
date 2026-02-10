import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, readFile, access } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execSync } from "node:child_process";

describe("pkp init", () => {
  let tempDir: string;
  const cliPath = join(__dirname, "..", "dist", "cli.js");

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "pkp-test-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it("creates pkp.config.yml", async () => {
    execSync(`node ${cliPath} init`, { cwd: tempDir });

    const configPath = join(tempDir, "pkp.config.yml");
    await expect(access(configPath)).resolves.toBeUndefined();

    const content = await readFile(configPath, "utf-8");
    expect(content).toContain("schema: pkp/1.0");
    expect(content).toContain("publisher:");
  });

  it("creates products directory", async () => {
    execSync(`node ${cliPath} init`, { cwd: tempDir });

    const productsPath = join(tempDir, "products");
    await expect(access(productsPath)).resolves.toBeUndefined();
  });

  it("creates example product", async () => {
    execSync(`node ${cliPath} init`, { cwd: tempDir });

    const examplePath = join(tempDir, "products", "example-product.md");
    await expect(access(examplePath)).resolves.toBeUndefined();

    const content = await readFile(examplePath, "utf-8");
    expect(content).toContain("schema: pkp/1.0");
    expect(content).toContain("sku:");
  });

  it("initializes in subdirectory", async () => {
    execSync(`node ${cliPath} init my-catalog`, { cwd: tempDir });

    const configPath = join(tempDir, "my-catalog", "pkp.config.yml");
    await expect(access(configPath)).resolves.toBeUndefined();
  });

  it("skips existing files", async () => {
    // First init
    execSync(`node ${cliPath} init`, { cwd: tempDir });

    // Get original content
    const configPath = join(tempDir, "pkp.config.yml");
    const originalContent = await readFile(configPath, "utf-8");

    // Second init should not overwrite
    execSync(`node ${cliPath} init`, { cwd: tempDir });

    const newContent = await readFile(configPath, "utf-8");
    expect(newContent).toBe(originalContent);
  });
});
