"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Upload,
  Loader2,
  CheckCircle,
  XCircle,
  FileText,
  Play,
  Pause,
  RotateCcw,
} from "lucide-react";

const CATEGORIES = [
  { value: "", label: "Auto-detect" },
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
  { value: "moveis", label: "Moveis" },
  { value: "brinquedos", label: "Brinquedos" },
  { value: "livros", label: "Livros" },
  { value: "beleza", label: "Beleza" },
];

interface UrlEntry {
  url: string;
  category?: string;
  status: "pending" | "processing" | "success" | "error";
  result?: {
    sku?: string;
    name?: string;
    path?: string;
    error?: string;
  };
}

export default function BatchPage() {
  const [urlText, setUrlText] = useState("");
  const [defaultCategory, setDefaultCategory] = useState("");
  const [entries, setEntries] = useState<UrlEntry[]>([]);
  const [processing, setProcessing] = useState(false);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);

  function parseUrls(): UrlEntry[] {
    const lines = urlText.split("\n").filter((line) => line.trim() && !line.startsWith("#"));
    return lines.map((line) => {
      const parts = line.split(",").map((p) => p.trim());
      return {
        url: parts[0],
        category: parts[1] || defaultCategory || undefined,
        status: "pending" as const,
      };
    });
  }

  function handleParse() {
    const parsed = parseUrls();
    if (parsed.length > 0) {
      setEntries(parsed);
    }
  }

  async function processUrl(entry: UrlEntry): Promise<UrlEntry> {
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: entry.url,
          category: entry.category || undefined,
        }),
      });

      const data = await res.json();

      if (data.success) {
        return {
          ...entry,
          status: "success",
          result: {
            sku: data.sku,
            name: data.name,
            path: data.path,
          },
        };
      } else {
        return {
          ...entry,
          status: "error",
          result: { error: data.error || "Unknown error" },
        };
      }
    } catch (error) {
      return {
        ...entry,
        status: "error",
        result: { error: error instanceof Error ? error.message : "Unknown error" },
      };
    }
  }

  async function handleStart() {
    setProcessing(true);
    setPaused(false);
    pausedRef.current = false;

    const pendingEntries = entries.filter((e) => e.status === "pending" || e.status === "error");

    for (let i = 0; i < pendingEntries.length; i++) {
      if (pausedRef.current) {
        break;
      }

      const entry = pendingEntries[i];
      const entryIndex = entries.findIndex((e) => e.url === entry.url);

      // Mark as processing
      setEntries((prev) =>
        prev.map((e, idx) => (idx === entryIndex ? { ...e, status: "processing" } : e))
      );

      // Process
      const result = await processUrl(entry);

      // Update result
      setEntries((prev) => prev.map((e, idx) => (idx === entryIndex ? result : e)));

      // Small delay between requests
      if (i < pendingEntries.length - 1 && !pausedRef.current) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }

    setProcessing(false);
  }

  function handlePause() {
    setPaused(true);
    pausedRef.current = true;
  }

  function handleReset() {
    setEntries(entries.map((e) => ({ ...e, status: "pending", result: undefined })));
    setPaused(false);
    pausedRef.current = false;
  }

  const successCount = entries.filter((e) => e.status === "success").length;
  const errorCount = entries.filter((e) => e.status === "error").length;
  const pendingCount = entries.filter((e) => e.status === "pending").length;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-[var(--border)] bg-[var(--muted)]">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <Upload className="w-6 h-6 text-[var(--primary)]" />
            <h1 className="text-xl font-bold">Batch Import</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {entries.length === 0 ? (
          <>
            <div className="mb-6">
              <p className="text-[var(--muted-foreground)]">
                Import multiple products at once. Enter one URL per line, optionally followed by
                category (comma-separated).
              </p>
            </div>

            {/* Input Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">URLs (one per line)</label>
                <textarea
                  value={urlText}
                  onChange={(e) => setUrlText(e.target.value)}
                  rows={10}
                  placeholder="https://store.com/product-1&#10;https://store.com/product-2,notebooks&#10;https://store.com/product-3,celulares/smartphones&#10;# Lines starting with # are ignored"
                  className="w-full px-4 py-3 border border-[var(--border)] rounded-md bg-[var(--background)] font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Default Category</label>
                <select
                  value={defaultCategory}
                  onChange={(e) => setDefaultCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-[var(--border)] rounded-md bg-[var(--background)]"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-[var(--muted-foreground)] mt-1">
                  Used when no category is specified per URL
                </p>
              </div>

              <button
                onClick={handleParse}
                disabled={!urlText.trim()}
                className="w-full py-3 bg-[var(--primary)] text-white rounded-md hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <FileText className="w-5 h-5" />
                Parse URLs ({urlText.split("\n").filter((l) => l.trim() && !l.startsWith("#")).length}{" "}
                found)
              </button>
            </div>

            {/* Format Info */}
            <div className="mt-8 p-4 bg-[var(--muted)] rounded-lg">
              <p className="text-sm font-medium mb-2">URL Format:</p>
              <pre className="text-xs text-[var(--muted-foreground)] bg-[var(--background)] p-3 rounded">
{`# Simple - uses default category or auto-detect
https://store.com/product-1

# With category
https://store.com/product-2,notebooks

# With category and brand
https://store.com/product-3,celulares/smartphones`}
              </pre>
            </div>
          </>
        ) : (
          <>
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Progress</span>
                <span className="text-sm text-[var(--muted-foreground)]">
                  {successCount + errorCount} / {entries.length}
                </span>
              </div>
              <div className="h-2 bg-[var(--muted)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--primary)] transition-all"
                  style={{ width: `${((successCount + errorCount) / entries.length) * 100}%` }}
                />
              </div>
              <div className="flex gap-4 mt-2 text-xs">
                <span className="text-green-600">{successCount} success</span>
                <span className="text-red-600">{errorCount} errors</span>
                <span className="text-[var(--muted-foreground)]">{pendingCount} pending</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex gap-2 mb-6">
              {!processing ? (
                <button
                  onClick={handleStart}
                  disabled={pendingCount === 0 && errorCount === 0}
                  className="flex-1 py-2 bg-[var(--primary)] text-white rounded-md hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  {pendingCount > 0 ? "Start Processing" : "Retry Failed"}
                </button>
              ) : (
                <button
                  onClick={handlePause}
                  className="flex-1 py-2 bg-yellow-500 text-white rounded-md hover:opacity-90 flex items-center justify-center gap-2"
                >
                  <Pause className="w-4 h-4" />
                  Pause
                </button>
              )}
              <button
                onClick={handleReset}
                disabled={processing}
                className="px-4 py-2 border border-[var(--border)] rounded-md hover:bg-[var(--muted)] disabled:opacity-50"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setEntries([])}
                disabled={processing}
                className="px-4 py-2 border border-[var(--border)] rounded-md hover:bg-[var(--muted)] disabled:opacity-50"
              >
                Clear
              </button>
            </div>

            {/* Results Table */}
            <div className="border border-[var(--border)] rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-[var(--muted)]">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium">URL</th>
                    <th className="px-4 py-2 text-left font-medium w-32">Category</th>
                    <th className="px-4 py-2 text-left font-medium w-24">Status</th>
                    <th className="px-4 py-2 text-left font-medium">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {entries.map((entry, idx) => (
                    <tr key={idx} className="hover:bg-[var(--muted)]">
                      <td className="px-4 py-2 truncate max-w-xs" title={entry.url}>
                        {entry.url}
                      </td>
                      <td className="px-4 py-2 text-[var(--muted-foreground)]">
                        {entry.category || "auto"}
                      </td>
                      <td className="px-4 py-2">
                        {entry.status === "pending" && (
                          <span className="text-[var(--muted-foreground)]">Pending</span>
                        )}
                        {entry.status === "processing" && (
                          <span className="flex items-center gap-1 text-blue-600">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Processing
                          </span>
                        )}
                        {entry.status === "success" && (
                          <span className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="w-3 h-3" />
                            Success
                          </span>
                        )}
                        {entry.status === "error" && (
                          <span className="flex items-center gap-1 text-red-600">
                            <XCircle className="w-3 h-3" />
                            Error
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-xs">
                        {entry.result?.name && (
                          <span className="text-green-700">{entry.result.name}</span>
                        )}
                        {entry.result?.error && (
                          <span className="text-red-600">{entry.result.error}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
