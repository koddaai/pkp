"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Package,
  ArrowLeft,
  Bot,
  Tag,
  DollarSign,
  CheckCircle,
  XCircle,
  Shield,
  ExternalLink,
  ChevronRight,
  Filter,
  X,
  Loader2,
  Store,
  Layers,
  TrendingUp,
  BarChart3,
} from "lucide-react";

interface Product {
  sku: string;
  name: string;
  brand?: string;
  category: string;
  subcategory?: string;
  summary?: string;
  price?: { value: number; currency: string };
  retailer?: string;
  path: string;
}

interface ProductDetail extends Product {
  highlights?: string[];
  specs?: Record<string, unknown>;
  purchase_urls?: Array<{ retailer: string; url: string }>;
  availability?: string;
  identifiers?: { ean?: string; mpn?: string };
  completeness?: number;
  confidence?: {
    specs?: { source: string; level: string };
    price?: { source: string; level: string };
  };
  tags?: string[];
}

interface CatalogStats {
  total: number;
  categories: string[];
  brands: string[];
  retailers: string[];
  stats: {
    total_products: number;
    categories: Record<string, number>;
    brands: Record<string, number>;
    retailers: Record<string, number>;
    price_range: { min: number; max: number };
  };
  generated_at: string;
}

const PAGE_SIZE = 50;

export default function CatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ProductDetail | null>(null);
  const [productLoading, setProductLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [catalogStats, setCatalogStats] = useState<CatalogStats | null>(null);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const catalogPath = "./examples/kodda-catalog";

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounced(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Load stats on mount
  useEffect(() => {
    loadStats();
  }, []);

  // Load products when filters change
  useEffect(() => {
    setProducts([]);
    setOffset(0);
    loadProducts(0, true);
  }, [searchDebounced, selectedCategory]);

  async function loadStats() {
    try {
      const res = await fetch(`/api/products?path=${encodeURIComponent(catalogPath)}&statsOnly=true`);
      const data = await res.json();

      if (data.error) {
        setError(data.error);
        return;
      }

      setCatalogStats(data);
    } catch (err) {
      setError("Failed to load catalog stats");
    }
  }

  async function loadProducts(newOffset: number, reset = false) {
    if (reset) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const params = new URLSearchParams({
        path: catalogPath,
        limit: String(PAGE_SIZE),
        offset: String(newOffset),
      });

      if (searchDebounced) {
        params.set("search", searchDebounced);
      }
      if (selectedCategory) {
        params.set("category", selectedCategory);
      }

      const res = await fetch(`/api/products?${params}`);
      const data = await res.json();

      if (data.error) {
        setError(data.error);
        return;
      }

      if (data.products) {
        if (reset) {
          setProducts(data.products);
        } else {
          setProducts((prev) => [...prev, ...data.products]);
        }
        setTotal(data.total);
        setHasMore(data.hasMore);
        setOffset(newOffset + data.products.length);
      }
    } catch (err) {
      setError("Failed to load products");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  function loadMore() {
    if (!loadingMore && hasMore) {
      loadProducts(offset, false);
    }
  }

  async function loadProductDetail(path: string) {
    setProductLoading(true);
    try {
      const res = await fetch(`/api/product?path=${encodeURIComponent(path)}`);
      const data = await res.json();
      if (data.product) {
        setSelectedProduct(data.product);
      }
    } catch (err) {
      console.error("Failed to load product:", err);
    } finally {
      setProductLoading(false);
    }
  }

  function formatPrice(price?: { value: number; currency: string }) {
    if (!price) return null;
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: price.currency,
    }).format(price.value);
  }

  function formatNumber(n: number) {
    return n.toLocaleString("pt-BR");
  }

  // Get top categories for chart
  const topCategories = catalogStats?.stats.categories
    ? Object.entries(catalogStats.stats.categories)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
    : [];

  const maxCategoryCount = topCategories.length > 0 ? topCategories[0][1] : 0;

  // Get top brands
  const topBrands = catalogStats?.stats.brands
    ? Object.entries(catalogStats.stats.brands)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
    : [];

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="border-b border-[var(--border)] bg-[var(--muted)] sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <Bot className="w-6 h-6 text-[var(--primary)]" />
              <h1 className="text-xl font-bold">PKP Catalog Browser</h1>
            </div>
          </div>
          <div className="text-sm text-[var(--muted-foreground)]">
            How AI sees your products
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-700 dark:text-red-300">{error}</p>
            {error.includes("manifest") && (
              <code className="block mt-2 text-sm bg-red-100 dark:bg-red-900/40 p-2 rounded">
                npx tsx scripts/build-manifest.ts --catalog {catalogPath}
              </code>
            )}
          </div>
        )}

        {/* Dashboard Stats */}
        {catalogStats && (
          <div className="mb-8">
            {/* Main Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl text-white">
                <div className="flex items-center gap-2 mb-2 opacity-80">
                  <Package className="w-4 h-4" />
                  <span className="text-sm">Total Products</span>
                </div>
                <p className="text-3xl font-bold">{formatNumber(catalogStats.stats.total_products)}</p>
              </div>

              <div className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl text-white">
                <div className="flex items-center gap-2 mb-2 opacity-80">
                  <Layers className="w-4 h-4" />
                  <span className="text-sm">Categories</span>
                </div>
                <p className="text-3xl font-bold">{formatNumber(catalogStats.categories.length)}</p>
              </div>

              <div className="p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-xl text-white">
                <div className="flex items-center gap-2 mb-2 opacity-80">
                  <Tag className="w-4 h-4" />
                  <span className="text-sm">Brands</span>
                </div>
                <p className="text-3xl font-bold">{formatNumber(catalogStats.brands.length)}</p>
              </div>

              <div className="p-4 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl text-white">
                <div className="flex items-center gap-2 mb-2 opacity-80">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm">Price Range</span>
                </div>
                <p className="text-lg font-bold">
                  {formatPrice({ value: catalogStats.stats.price_range.min, currency: "BRL" })}
                  <span className="text-sm opacity-70 mx-1">-</span>
                  {formatPrice({ value: catalogStats.stats.price_range.max, currency: "BRL" })}
                </p>
              </div>
            </div>

            {/* Category Distribution */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-4 border border-[var(--border)] rounded-xl bg-[var(--background)]">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-5 h-5 text-[var(--primary)]" />
                  <h3 className="font-semibold">Top Categories</h3>
                </div>
                <div className="space-y-3">
                  {topCategories.map(([cat, count]) => (
                    <button
                      key={cat}
                      onClick={() => {
                        setSelectedCategory(selectedCategory === cat ? null : cat);
                        setShowFilters(false);
                      }}
                      className={`w-full text-left ${selectedCategory === cat ? 'ring-2 ring-[var(--primary)]' : ''}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm truncate">{cat}</span>
                        <span className="text-sm text-[var(--muted-foreground)]">
                          {formatNumber(count)}
                        </span>
                      </div>
                      <div className="h-2 bg-[var(--muted)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[var(--primary)] rounded-full transition-all"
                          style={{ width: `${(count / maxCategoryCount) * 100}%` }}
                        />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 border border-[var(--border)] rounded-xl bg-[var(--background)]">
                <div className="flex items-center gap-2 mb-4">
                  <Tag className="w-5 h-5 text-[var(--primary)]" />
                  <h3 className="font-semibold">Top Brands</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {topBrands.map(([brand, count]) => (
                    <span
                      key={brand}
                      className="px-3 py-1.5 bg-[var(--muted)] rounded-full text-sm"
                    >
                      {brand} <span className="text-[var(--muted-foreground)]">({formatNumber(count)})</span>
                    </span>
                  ))}
                </div>
                {catalogStats.brands.length > 8 && (
                  <p className="mt-3 text-sm text-[var(--muted-foreground)]">
                    +{formatNumber(catalogStats.brands.length - 8)} more brands
                  </p>
                )}
              </div>
            </div>

            {/* Last updated */}
            <p className="mt-4 text-xs text-[var(--muted-foreground)] text-right">
              Last indexed: {new Date(catalogStats.generated_at).toLocaleString("pt-BR")}
            </p>
          </div>
        )}

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <input
              type="text"
              placeholder="Search products by name, SKU, or brand..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-[var(--border)] rounded-lg bg-[var(--background)]"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-3 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)]"
          >
            <Filter className="w-4 h-4" />
            Filters
            {selectedCategory && (
              <span className="bg-[var(--primary)] text-white text-xs px-2 py-0.5 rounded-full">1</span>
            )}
          </button>
        </div>

        {/* Active Filter */}
        {selectedCategory && (
          <div className="mb-4 flex items-center gap-2">
            <span className="text-sm text-[var(--muted-foreground)]">Filtering by:</span>
            <button
              onClick={() => setSelectedCategory(null)}
              className="flex items-center gap-1 px-3 py-1 bg-[var(--primary)] text-white rounded-full text-sm"
            >
              {selectedCategory}
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Filter Panel */}
        {showFilters && catalogStats && (
          <div className="mb-6 p-4 border border-[var(--border)] rounded-lg bg-[var(--muted)]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium">All Categories ({catalogStats.categories.length})</h3>
              {selectedCategory && (
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="text-sm text-[var(--primary)] hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
              {catalogStats.categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    selectedCategory === cat
                      ? "bg-[var(--primary)] text-white"
                      : "bg-[var(--background)] border border-[var(--border)] hover:border-[var(--primary)]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results Count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-[var(--muted-foreground)]">
            {loading ? (
              "Loading..."
            ) : (
              <>
                Showing {products.length.toLocaleString()} of {total.toLocaleString()} products
                {selectedCategory && ` in "${selectedCategory}"`}
                {searchDebounced && ` matching "${searchDebounced}"`}
              </>
            )}
          </p>
        </div>

        {/* Product Grid */}
        {loading && !catalogStats ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[var(--primary)]" />
            <p className="text-[var(--muted-foreground)]">Loading catalog...</p>
          </div>
        ) : products.length === 0 && !loading ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-[var(--muted-foreground)] mx-auto mb-4" />
            <p className="text-[var(--muted-foreground)]">No products found</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => (
                <button
                  key={product.path}
                  onClick={() => loadProductDetail(product.path)}
                  className="text-left p-4 border border-[var(--border)] rounded-lg hover:border-[var(--primary)] transition-colors bg-[var(--background)]"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs font-mono text-[var(--muted-foreground)] truncate max-w-[70%]">
                      {product.sku}
                    </span>
                  </div>
                  <h3 className="font-semibold mb-1 line-clamp-2">{product.name}</h3>
                  <p className="text-sm text-[var(--muted-foreground)] mb-2">
                    {product.brand && `${product.brand} • `}
                    {product.category}
                  </p>
                  {product.price && (
                    <p className="text-lg font-bold text-[var(--primary)]">{formatPrice(product.price)}</p>
                  )}
                  <div className="mt-3 flex items-center text-xs text-[var(--primary)]">
                    View AI perspective <ChevronRight className="w-3 h-3 ml-1" />
                  </div>
                </button>
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="mt-8 text-center">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-6 py-3 bg-[var(--primary)] text-white rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-2 mx-auto"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>Load More ({(total - products.length).toLocaleString()} remaining)</>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--background)] rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-[var(--background)] border-b border-[var(--border)] p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-[var(--primary)]" />
                <span className="font-medium">How AI sees this product</span>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="p-2 hover:bg-[var(--muted)] rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {productLoading ? (
              <div className="p-8 text-center text-[var(--muted-foreground)]">Loading...</div>
            ) : (
              <div className="p-6">
                {/* Product Header */}
                <div className="mb-6">
                  <p className="text-sm font-mono text-[var(--muted-foreground)] mb-1">
                    {selectedProduct.sku}
                  </p>
                  <h2 className="text-2xl font-bold mb-2">{selectedProduct.name}</h2>
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    {selectedProduct.brand && (
                      <span className="px-2 py-1 bg-[var(--muted)] rounded">{selectedProduct.brand}</span>
                    )}
                    <span className="px-2 py-1 bg-[var(--muted)] rounded">{selectedProduct.category}</span>
                    {selectedProduct.subcategory && (
                      <span className="px-2 py-1 bg-[var(--muted)] rounded">{selectedProduct.subcategory}</span>
                    )}
                  </div>
                </div>

                {/* Summary */}
                {selectedProduct.summary && (
                  <div className="mb-6 p-4 bg-[var(--muted)] rounded-lg">
                    <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Bot className="w-4 h-4" />
                      AI Summary
                    </h3>
                    <p className="text-[var(--foreground)]">{selectedProduct.summary}</p>
                  </div>
                )}

                {/* Price & Availability */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-4 border border-[var(--border)] rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-4 h-4 text-[var(--muted-foreground)]" />
                      <span className="text-sm text-[var(--muted-foreground)]">Price</span>
                    </div>
                    {selectedProduct.price ? (
                      <p className="text-xl font-bold">{formatPrice(selectedProduct.price)}</p>
                    ) : (
                      <p className="text-[var(--muted-foreground)]">Not available</p>
                    )}
                  </div>
                  <div className="p-4 border border-[var(--border)] rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      {selectedProduct.availability === "in-stock" ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                      <span className="text-sm text-[var(--muted-foreground)]">Availability</span>
                    </div>
                    <p className="font-medium">
                      {selectedProduct.availability === "in-stock"
                        ? "In Stock"
                        : selectedProduct.availability || "Unknown"}
                    </p>
                  </div>
                </div>

                {/* Tags */}
                {selectedProduct.tags && selectedProduct.tags.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <Tag className="w-4 h-4" />
                      Tags
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedProduct.tags.map((tag) => (
                        <span key={tag} className="px-2 py-1 bg-[var(--muted)] rounded text-sm">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Identifiers */}
                {selectedProduct.identifiers && (
                  <div className="mb-6">
                    <h3 className="text-sm font-medium mb-3">Identifiers</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {selectedProduct.identifiers.ean && (
                        <div>
                          <span className="text-[var(--muted-foreground)]">EAN: </span>
                          <span className="font-mono">{selectedProduct.identifiers.ean}</span>
                        </div>
                      )}
                      {selectedProduct.identifiers.mpn && (
                        <div>
                          <span className="text-[var(--muted-foreground)]">MPN: </span>
                          <span className="font-mono">{selectedProduct.identifiers.mpn}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Purchase Links */}
                {selectedProduct.purchase_urls && selectedProduct.purchase_urls.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-medium mb-3">Where to Buy</h3>
                    <div className="space-y-2">
                      {selectedProduct.purchase_urls.map((link, i) => (
                        <a
                          key={i}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-3 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
                        >
                          <span>{link.retailer}</span>
                          <ExternalLink className="w-4 h-4 text-[var(--muted-foreground)]" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
