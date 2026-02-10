"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  FolderOutput,
  Loader2,
  CheckCircle,
  XCircle,
  FolderOpen,
} from "lucide-react";

interface ExportResult {
  success: boolean;
  outputPath?: string;
  productCount?: number;
  files?: string[];
  error?: string;
}

export default function ExportPage() {
  const [catalogPath, setCatalogPath] = useState("");
  const [outputPath, setOutputPath] = useState("");
  const [publisherName, setPublisherName] = useState("PKP Catalog");
  const [publisherType, setPublisherType] = useState("retailer");
  const [publisherDomain, setPublisherDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ExportResult | null>(null);

  // Load saved catalog path
  useEffect(() => {
    const saved = localStorage.getItem("pkp-catalog-path");
    if (saved) {
      setCatalogPath(saved);
      setOutputPath(saved + "/dist");
    }
  }, []);

  async function handleExport(e: React.FormEvent) {
    e.preventDefault();
    if (!catalogPath) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          catalogPath,
          outputPath: outputPath || undefined,
          publisher: {
            name: publisherName,
            type: publisherType,
            domain: publisherDomain || undefined,
          },
        }),
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
            <FolderOutput className="w-6 h-6 text-[var(--primary)]" />
            <h1 className="text-xl font-bold">Export Catalog</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <p className="text-[var(--muted-foreground)]">
            Export your catalog to the <code className="bg-[var(--muted)] px-1 rounded">.well-known/pkp/</code> format
            for deployment.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleExport} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              <FolderOpen className="w-4 h-4 inline mr-1" />
              Catalog Path *
            </label>
            <input
              type="text"
              value={catalogPath}
              onChange={(e) => setCatalogPath(e.target.value)}
              placeholder="/path/to/catalog"
              required
              className="w-full px-4 py-2 border border-[var(--border)] rounded-md bg-[var(--background)] font-mono text-sm"
            />
            <p className="text-xs text-[var(--muted-foreground)] mt-1">
              Directory containing your PRODUCT.md files
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Output Path</label>
            <input
              type="text"
              value={outputPath}
              onChange={(e) => setOutputPath(e.target.value)}
              placeholder="/path/to/output (default: catalog/dist)"
              className="w-full px-4 py-2 border border-[var(--border)] rounded-md bg-[var(--background)] font-mono text-sm"
            />
          </div>

          <fieldset className="border border-[var(--border)] rounded-md p-4">
            <legend className="text-sm font-medium px-2">Publisher Information</legend>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={publisherName}
                  onChange={(e) => setPublisherName(e.target.value)}
                  placeholder="Your Store Name"
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--background)]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <select
                    value={publisherType}
                    onChange={(e) => setPublisherType(e.target.value)}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--background)]"
                  >
                    <option value="manufacturer">Manufacturer</option>
                    <option value="retailer">Retailer</option>
                    <option value="aggregator">Aggregator</option>
                    <option value="community">Community</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Domain (optional)</label>
                  <input
                    type="text"
                    value={publisherDomain}
                    onChange={(e) => setPublisherDomain(e.target.value)}
                    placeholder="store.example.com"
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--background)]"
                  />
                </div>
              </div>
            </div>
          </fieldset>

          <button
            type="submit"
            disabled={loading || !catalogPath}
            className="w-full py-3 bg-[var(--primary)] text-white rounded-md hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <FolderOutput className="w-5 h-5" />
                Export to .well-known/pkp/
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
                      Export successful!
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                      {result.productCount} products exported
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-400 mt-2 font-mono">
                      {result.outputPath}
                    </p>
                    {result.files && (
                      <div className="mt-3">
                        <p className="text-xs font-medium text-green-800 dark:text-green-200 mb-1">
                          Generated files:
                        </p>
                        <ul className="text-xs text-green-700 dark:text-green-300 space-y-0.5">
                          {result.files.map((file, i) => (
                            <li key={i} className="font-mono">
                              {file}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-800 dark:text-red-200">Export failed</p>
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">{result.error}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Info */}
        <div className="mt-8 p-4 bg-[var(--muted)] rounded-lg">
          <p className="text-sm font-medium mb-2">Output Structure:</p>
          <pre className="text-xs text-[var(--muted-foreground)] bg-[var(--background)] p-3 rounded font-mono">
{`dist/
├── .well-known/
│   └── pkp/
│       ├── catalog.json    # Product index
│       └── products/
│           ├── product-1.md
│           └── product-2.md
└── pkp.txt                 # Discovery file`}
          </pre>
        </div>
      </main>
    </div>
  );
}
