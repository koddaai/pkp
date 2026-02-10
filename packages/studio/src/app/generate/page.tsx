"use client";

import { useState } from "react";
import Link from "next/link";
import { Package, ArrowLeft, Sparkles, Loader2, CheckCircle, XCircle } from "lucide-react";

const CATEGORIES = [
  { value: "celulares/smartphones", label: "Smartphones" },
  { value: "notebooks", label: "Notebooks" },
  { value: "tvs", label: "TVs" },
  { value: "tablets", label: "Tablets" },
  { value: "audio", label: "Audio (Headphones/Speakers)" },
  { value: "monitors", label: "Monitors" },
  { value: "smartwatches", label: "Smartwatches" },
  { value: "cameras", label: "Cameras" },
  { value: "eletrodomesticos", label: "Eletrodomesticos" },
  { value: "moda", label: "Moda" },
  { value: "games", label: "Games" },
];

interface GenerateResult {
  success: boolean;
  sku?: string;
  name?: string;
  path?: string;
  error?: string;
  content?: string;
}

export default function GeneratePage() {
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("celulares/smartphones");
  const [brand, setBrand] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerateResult | null>(null);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, category, brand: brand || undefined }),
      });

      const data = await res.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-[var(--border)] bg-[var(--muted)]">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-[var(--primary)]" />
            <h1 className="text-xl font-bold">Generate Product</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <p className="text-[var(--muted-foreground)]">
            Generate a PRODUCT.md file from a product page URL using AI
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleGenerate} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Product URL *</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://store.example.com/product"
              required
              className="w-full px-4 py-2 border border-[var(--border)] rounded-md bg-[var(--background)]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Category *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2 border border-[var(--border)] rounded-md bg-[var(--background)]"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Brand (optional)</label>
            <input
              type="text"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="e.g., Apple, Samsung"
              className="w-full px-4 py-2 border border-[var(--border)] rounded-md bg-[var(--background)]"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !url}
            className="w-full py-3 bg-[var(--primary)] text-white rounded-md hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate PRODUCT.md
              </>
            )}
          </button>
        </form>

        {/* Result */}
        {result && (
          <div className="mt-8">
            {result.success ? (
              <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-green-800 dark:text-green-200">
                      Product generated successfully!
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                      {result.name} ({result.sku})
                    </p>
                    {result.path && (
                      <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                        Saved to: {result.path}
                      </p>
                    )}
                  </div>
                </div>

                {result.content && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
                      Preview:
                    </p>
                    <pre className="p-3 bg-white dark:bg-gray-900 rounded border text-xs overflow-x-auto max-h-64">
                      {result.content}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-800 dark:text-red-200">
                      Failed to generate product
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                      {result.error}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Info */}
        <div className="mt-8 p-4 bg-[var(--muted)] rounded-lg">
          <p className="text-sm text-[var(--muted-foreground)]">
            <strong>Note:</strong> This feature requires the ANTHROPIC_API_KEY environment variable
            to be set. The AI will scrape the product page and generate a structured PRODUCT.md file
            following the PKP specification.
          </p>
        </div>
      </main>
    </div>
  );
}
