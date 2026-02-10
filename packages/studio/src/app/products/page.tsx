"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Package, ArrowLeft, Search, RefreshCw, Pencil } from "lucide-react";

interface Product {
  sku: string;
  name: string;
  brand?: string;
  category: string;
  price?: { value: number; currency: string };
  completeness?: number;
  path: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [catalogPath, setCatalogPath] = useState("");

  useEffect(() => {
    // Get catalog path from localStorage or use default
    const saved = localStorage.getItem("pkp-catalog-path");
    if (saved) {
      setCatalogPath(saved);
      loadProducts(saved);
    } else {
      setLoading(false);
    }
  }, []);

  async function loadProducts(path: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/products?path=${encodeURIComponent(path)}`);
      const data = await res.json();
      if (data.products) {
        setProducts(data.products);
      }
    } catch (error) {
      console.error("Failed to load products:", error);
    } finally {
      setLoading(false);
    }
  }

  function handleSetPath() {
    const path = prompt("Enter catalog path:", catalogPath || "./examples/kodda-catalog");
    if (path) {
      setCatalogPath(path);
      localStorage.setItem("pkp-catalog-path", path);
      loadProducts(path);
    }
  }

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.brand?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-[var(--border)] bg-[var(--muted)]">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <Package className="w-6 h-6 text-[var(--primary)]" />
              <h1 className="text-xl font-bold">Products</h1>
            </div>
          </div>
          <button
            onClick={handleSetPath}
            className="text-sm px-3 py-1.5 bg-[var(--primary)] text-white rounded-md hover:opacity-90"
          >
            Set Catalog Path
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {!catalogPath ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-[var(--muted-foreground)] mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No catalog selected</h2>
            <p className="text-[var(--muted-foreground)] mb-4">
              Set a catalog path to view products
            </p>
            <button
              onClick={handleSetPath}
              className="px-4 py-2 bg-[var(--primary)] text-white rounded-md hover:opacity-90"
            >
              Set Catalog Path
            </button>
          </div>
        ) : (
          <>
            {/* Search and Info */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 pr-4 py-2 border border-[var(--border)] rounded-md bg-[var(--background)] w-64"
                  />
                </div>
                <span className="text-sm text-[var(--muted-foreground)]">
                  {filteredProducts.length} products
                </span>
              </div>
              <button
                onClick={() => loadProducts(catalogPath)}
                className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>

            {/* Products Table */}
            {loading ? (
              <div className="text-center py-12 text-[var(--muted-foreground)]">
                Loading products...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-12 text-[var(--muted-foreground)]">
                No products found
              </div>
            ) : (
              <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-[var(--muted)]">
                    <tr>
                      <th className="text-left px-4 py-3 text-sm font-medium">Product</th>
                      <th className="text-left px-4 py-3 text-sm font-medium">Category</th>
                      <th className="text-left px-4 py-3 text-sm font-medium">Price</th>
                      <th className="text-left px-4 py-3 text-sm font-medium">Completeness</th>
                      <th className="text-left px-4 py-3 text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => (
                      <tr key={product.sku} className="border-t border-[var(--border)] hover:bg-[var(--muted)]">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-[var(--muted-foreground)]">
                              {product.brand} &middot; {product.sku}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">{product.category}</td>
                        <td className="px-4 py-3 text-sm">
                          {product.price
                            ? `${product.price.currency} ${product.price.value.toLocaleString()}`
                            : "-"}
                        </td>
                        <td className="px-4 py-3">
                          {product.completeness !== undefined ? (
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-2 bg-[var(--muted)] rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-[var(--primary)]"
                                  style={{ width: `${product.completeness * 100}%` }}
                                />
                              </div>
                              <span className="text-sm">{Math.round(product.completeness * 100)}%</span>
                            </div>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/edit?path=${encodeURIComponent(product.path)}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white rounded-md transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Edit
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
