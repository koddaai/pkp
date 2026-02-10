"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  FileText,
  Code,
  Eye,
  EyeOff,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import yaml from "yaml";

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  completeness: number;
  meetsThreshold: boolean;
}

interface ProductData {
  path: string;
  raw: string;
  frontmatter: Record<string, unknown>;
  content: string;
  validation: ValidationResult;
}

const CATEGORIES = [
  "celulares/smartphones",
  "notebooks",
  "tvs",
  "eletrodomesticos",
  "moda",
  "games",
  "tablets",
  "audio",
  "monitors",
  "smartwatches",
  "cameras",
  "moveis",
  "brinquedos",
  "livros",
  "beleza",
];

export default function EditPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <RefreshCw className="w-6 h-6 animate-spin text-[var(--muted-foreground)]" />
        </div>
      }
    >
      <EditPageContent />
    </Suspense>
  );
}

function EditPageContent() {
  const searchParams = useSearchParams();
  const filePath = searchParams.get("path");

  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"form" | "raw">("form");
  const [hasChanges, setHasChanges] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Form fields
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [summary, setSummary] = useState("");
  const [priceValue, setPriceValue] = useState("");
  const [priceCurrency, setPriceCurrency] = useState("BRL");
  const [markdownContent, setMarkdownContent] = useState("");
  const [rawContent, setRawContent] = useState("");

  const loadProduct = useCallback(async () => {
    if (!filePath) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/product?path=${encodeURIComponent(filePath)}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load product");
      }

      setProduct(data);
      setRawContent(data.raw);

      // Populate form fields
      const fm = data.frontmatter;
      setSku(String(fm.sku || ""));
      setName(String(fm.name || ""));
      setBrand(String(fm.brand || ""));
      setCategory(String(fm.category || ""));
      setSummary(String(fm.summary || ""));

      if (fm.price && typeof fm.price === "object") {
        const price = fm.price as { value?: number; currency?: string };
        setPriceValue(price.value?.toString() || "");
        setPriceCurrency(price.currency || "BRL");
      }

      setMarkdownContent(data.content);
      setHasChanges(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load product");
    } finally {
      setLoading(false);
    }
  }, [filePath]);

  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  function buildContent(): string {
    if (mode === "raw") {
      return rawContent;
    }

    // Build frontmatter from form fields
    const frontmatter: Record<string, unknown> = {
      schema: "pkp/1.0",
      sku,
      brand,
      name,
      category,
      summary,
    };

    if (priceValue) {
      frontmatter.price = {
        type: "msrp",
        currency: priceCurrency,
        value: parseFloat(priceValue),
        source: "retailer",
        updated_at: new Date().toISOString(),
      };
    }

    // Preserve other frontmatter fields from original
    if (product?.frontmatter) {
      const preserved = ["specs", "confidence", "identifiers", "canonical", "tags", "highlights"];
      for (const key of preserved) {
        if (product.frontmatter[key]) {
          frontmatter[key] = product.frontmatter[key];
        }
      }
    }

    const yamlStr = yaml.stringify(frontmatter);
    return `---\n${yamlStr}---\n\n${markdownContent}`;
  }

  async function handleSave() {
    if (!filePath) return;

    setSaving(true);
    setError(null);

    try {
      const content = buildContent();

      const res = await fetch("/api/product", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: filePath, content }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save");
      }

      // Update product with new validation
      setProduct((prev) =>
        prev
          ? {
              ...prev,
              raw: content,
              frontmatter: data.frontmatter,
              validation: data.validation,
            }
          : null
      );
      setRawContent(content);
      setHasChanges(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  function handleFormChange() {
    setHasChanges(true);
  }

  if (!filePath) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-12 h-12 text-[var(--muted-foreground)] mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No file selected</h2>
          <p className="text-[var(--muted-foreground)] mb-4">
            Select a product from the products list to edit
          </p>
          <Link
            href="/products"
            className="px-4 py-2 bg-[var(--primary)] text-white rounded-md hover:opacity-90"
          >
            Go to Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-[var(--border)] bg-[var(--muted)] sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/products"
              className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-semibold">{name || "Edit Product"}</h1>
              <p className="text-xs text-[var(--muted-foreground)] truncate max-w-md">
                {filePath}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Mode Toggle */}
            <div className="flex border border-[var(--border)] rounded-md overflow-hidden">
              <button
                onClick={() => setMode("form")}
                className={`px-3 py-1.5 text-sm flex items-center gap-1.5 ${
                  mode === "form"
                    ? "bg-[var(--primary)] text-white"
                    : "bg-[var(--background)] hover:bg-[var(--muted)]"
                }`}
              >
                <FileText className="w-4 h-4" />
                Form
              </button>
              <button
                onClick={() => setMode("raw")}
                className={`px-3 py-1.5 text-sm flex items-center gap-1.5 ${
                  mode === "raw"
                    ? "bg-[var(--primary)] text-white"
                    : "bg-[var(--background)] hover:bg-[var(--muted)]"
                }`}
              >
                <Code className="w-4 h-4" />
                Raw
              </button>
            </div>

            <button
              onClick={loadProduct}
              className="p-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              title="Reload"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium ${
                hasChanges
                  ? "bg-[var(--primary)] text-white hover:opacity-90"
                  : "bg-[var(--muted)] text-[var(--muted-foreground)] cursor-not-allowed"
              }`}
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Editor */}
        <main className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="w-6 h-6 animate-spin text-[var(--muted-foreground)]" />
            </div>
          ) : error ? (
            <div className="p-6 max-w-2xl mx-auto">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <div className="flex items-center gap-2 font-medium">
                  <AlertCircle className="w-5 h-5" />
                  Error loading product
                </div>
                <p className="mt-1 text-sm">{error}</p>
              </div>
            </div>
          ) : mode === "raw" ? (
            <div className="p-6">
              <textarea
                value={rawContent}
                onChange={(e) => {
                  setRawContent(e.target.value);
                  setHasChanges(true);
                }}
                className="w-full h-[calc(100vh-200px)] font-mono text-sm p-4 border border-[var(--border)] rounded-lg bg-[var(--background)]"
                spellCheck={false}
              />
            </div>
          ) : (
            <div className="p-6 max-w-3xl mx-auto space-y-6">
              {/* Basic Info */}
              <section>
                <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">SKU</label>
                    <input
                      type="text"
                      value={sku}
                      onChange={(e) => {
                        setSku(e.target.value);
                        handleFormChange();
                      }}
                      className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--background)]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Brand</label>
                    <input
                      type="text"
                      value={brand}
                      onChange={(e) => {
                        setBrand(e.target.value);
                        handleFormChange();
                      }}
                      className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--background)]"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        handleFormChange();
                      }}
                      className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--background)]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Category</label>
                    <select
                      value={category}
                      onChange={(e) => {
                        setCategory(e.target.value);
                        handleFormChange();
                      }}
                      className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--background)]"
                    >
                      <option value="">Select category...</option>
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block text-sm font-medium mb-1">Price</label>
                      <input
                        type="number"
                        value={priceValue}
                        onChange={(e) => {
                          setPriceValue(e.target.value);
                          handleFormChange();
                        }}
                        className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--background)]"
                        placeholder="0.00"
                      />
                    </div>
                    <div className="w-24">
                      <label className="block text-sm font-medium mb-1">Currency</label>
                      <select
                        value={priceCurrency}
                        onChange={(e) => {
                          setPriceCurrency(e.target.value);
                          handleFormChange();
                        }}
                        className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--background)]"
                      >
                        <option value="BRL">BRL</option>
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                      </select>
                    </div>
                  </div>
                </div>
              </section>

              {/* Summary */}
              <section>
                <h2 className="text-lg font-semibold mb-4">Summary</h2>
                <textarea
                  value={summary}
                  onChange={(e) => {
                    setSummary(e.target.value);
                    handleFormChange();
                  }}
                  rows={3}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--background)]"
                  placeholder="Brief description for AI discovery..."
                />
              </section>

              {/* Content */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Content (Markdown)</h2>
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md border ${
                      showPreview
                        ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                        : "border-[var(--border)] hover:bg-[var(--muted)]"
                    }`}
                  >
                    {showPreview ? (
                      <>
                        <EyeOff className="w-4 h-4" />
                        Hide Preview
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4" />
                        Show Preview
                      </>
                    )}
                  </button>
                </div>

                {showPreview ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-2">
                        Editor
                      </label>
                      <textarea
                        value={markdownContent}
                        onChange={(e) => {
                          setMarkdownContent(e.target.value);
                          handleFormChange();
                        }}
                        rows={20}
                        className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--background)] font-mono text-sm"
                        placeholder="## Highlights&#10;- Feature 1&#10;- Feature 2&#10;&#10;## FAQ&#10;..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-2">
                        Preview
                      </label>
                      <div className="h-[480px] overflow-auto px-4 py-3 border border-[var(--border)] rounded-md bg-[var(--background)] prose prose-sm max-w-none">
                        <ReactMarkdown>{markdownContent || "*No content yet*"}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                ) : (
                  <textarea
                    value={markdownContent}
                    onChange={(e) => {
                      setMarkdownContent(e.target.value);
                      handleFormChange();
                    }}
                    rows={15}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--background)] font-mono text-sm"
                    placeholder="## Highlights&#10;- Feature 1&#10;- Feature 2&#10;&#10;## FAQ&#10;..."
                  />
                )}
              </section>
            </div>
          )}
        </main>

        {/* Sidebar - Validation */}
        <aside className="w-80 border-l border-[var(--border)] bg-[var(--muted)] p-4 overflow-auto">
          <h3 className="font-semibold mb-4">Validation</h3>

          {product?.validation && (
            <div className="space-y-4">
              {/* Status */}
              <div
                className={`p-3 rounded-lg ${
                  product.validation.valid
                    ? "bg-green-50 border border-green-200"
                    : "bg-red-50 border border-red-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  {product.validation.valid ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  )}
                  <span
                    className={`font-medium ${
                      product.validation.valid ? "text-green-700" : "text-red-700"
                    }`}
                  >
                    {product.validation.valid ? "Valid" : "Invalid"}
                  </span>
                </div>
              </div>

              {/* Completeness */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Completeness</span>
                  <span className="text-sm">
                    {Math.round(product.validation.completeness * 100)}%
                  </span>
                </div>
                <div className="h-2 bg-[var(--background)] rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      product.validation.meetsThreshold
                        ? "bg-green-500"
                        : "bg-yellow-500"
                    }`}
                    style={{
                      width: `${product.validation.completeness * 100}%`,
                    }}
                  />
                </div>
                {!product.validation.meetsThreshold && (
                  <p className="text-xs text-yellow-600 mt-1">
                    Below category threshold
                  </p>
                )}
              </div>

              {/* Errors */}
              {product.validation.errors.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-red-600 mb-2">
                    Errors ({product.validation.errors.length})
                  </h4>
                  <ul className="space-y-1">
                    {product.validation.errors.map((err, i) => (
                      <li
                        key={i}
                        className="text-xs text-red-600 bg-red-50 p-2 rounded"
                      >
                        {err}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Warnings */}
              {product.validation.warnings.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-yellow-600 mb-2">
                    Warnings ({product.validation.warnings.length})
                  </h4>
                  <ul className="space-y-1 max-h-48 overflow-auto">
                    {product.validation.warnings.map((warn, i) => (
                      <li
                        key={i}
                        className="text-xs text-yellow-700 bg-yellow-50 p-2 rounded"
                      >
                        {warn}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
