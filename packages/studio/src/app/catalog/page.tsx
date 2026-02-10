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
} from "lucide-react";

interface Product {
  sku: string;
  name: string;
  brand?: string;
  category: string;
  subcategory?: string;
  summary?: string;
  price?: { value: number; currency: string };
  completeness?: number;
  confidence?: {
    specs?: { source: string; level: string };
    price?: { source: string; level: string };
  };
  tags?: string[];
  path: string;
}

interface ProductDetail extends Product {
  highlights?: string[];
  specs?: Record<string, unknown>;
  purchase_urls?: Array<{ retailer: string; url: string }>;
  availability?: string;
  identifiers?: { ean?: string; mpn?: string };
}

export default function CatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ProductDetail | null>(null);
  const [productLoading, setProductLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Default to the example catalog
  const catalogPath = "./examples/kodda-catalog";

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    setLoading(true);
    try {
      const res = await fetch(`/api/products?path=${encodeURIComponent(catalogPath)}`);
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

  async function loadProductDetail(path: string) {
    setProductLoading(true);
    try {
      const res = await fetch(`/api/product?path=${encodeURIComponent(path)}`);
      const data = await res.json();
      if (data.product) {
        setSelectedProduct(data.product);
      }
    } catch (error) {
      console.error("Failed to load product:", error);
    } finally {
      setProductLoading(false);
    }
  }

  const categories = Array.from(new Set(products.map((p) => p.category))).sort();

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.brand?.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = !selectedCategory || p.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  function formatPrice(price?: { value: number; currency: string }) {
    if (!price) return null;
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: price.currency,
    }).format(price.value);
  }

  function getConfidenceColor(source?: string) {
    switch (source) {
      case "manufacturer":
        return "text-green-500";
      case "retailer-feed":
        return "text-blue-500";
      case "ai-generated":
        return "text-yellow-500";
      case "scraped":
        return "text-orange-500";
      default:
        return "text-gray-500";
    }
  }

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

        {/* Filter Panel */}
        {showFilters && (
          <div className="mb-6 p-4 border border-[var(--border)] rounded-lg bg-[var(--muted)]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium">Categories</h3>
              {selectedCategory && (
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="text-sm text-[var(--primary)] hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
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
            {filteredProducts.length} product{filteredProducts.length !== 1 ? "s" : ""} found
          </p>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="text-center py-12 text-[var(--muted-foreground)]">Loading products...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-[var(--muted-foreground)] mx-auto mb-4" />
            <p className="text-[var(--muted-foreground)]">No products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((product) => (
              <button
                key={product.sku}
                onClick={() => loadProductDetail(product.path)}
                className="text-left p-4 border border-[var(--border)] rounded-lg hover:border-[var(--primary)] transition-colors bg-[var(--background)]"
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs font-mono text-[var(--muted-foreground)]">{product.sku}</span>
                  {product.completeness !== undefined && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        product.completeness >= 0.8
                          ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                          : product.completeness >= 0.5
                          ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                          : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                      }`}
                    >
                      {Math.round(product.completeness * 100)}%
                    </span>
                  )}
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

                {/* Summary - What AI will tell users */}
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

                {/* Confidence Scores */}
                {selectedProduct.confidence && (
                  <div className="mb-6 p-4 border border-[var(--border)] rounded-lg">
                    <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Data Confidence
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedProduct.confidence.specs && (
                        <div>
                          <p className="text-xs text-[var(--muted-foreground)] mb-1">Specs</p>
                          <p className={`font-medium ${getConfidenceColor(selectedProduct.confidence.specs.source)}`}>
                            {selectedProduct.confidence.specs.source} ({selectedProduct.confidence.specs.level})
                          </p>
                        </div>
                      )}
                      {selectedProduct.confidence.price && (
                        <div>
                          <p className="text-xs text-[var(--muted-foreground)] mb-1">Price</p>
                          <p className={`font-medium ${getConfidenceColor(selectedProduct.confidence.price.source)}`}>
                            {selectedProduct.confidence.price.source} ({selectedProduct.confidence.price.level})
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Highlights */}
                {selectedProduct.highlights && selectedProduct.highlights.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-medium mb-3">Key Highlights</h3>
                    <ul className="space-y-2">
                      {selectedProduct.highlights.map((highlight, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Tags */}
                {selectedProduct.tags && selectedProduct.tags.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <Tag className="w-4 h-4" />
                      Tags
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedProduct.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-[var(--muted)] rounded text-sm"
                        >
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

                {/* Completeness */}
                <div className="p-4 bg-[var(--muted)] rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Data Completeness</span>
                    <span className="font-bold">
                      {selectedProduct.completeness
                        ? `${Math.round(selectedProduct.completeness * 100)}%`
                        : "N/A"}
                    </span>
                  </div>
                  {selectedProduct.completeness !== undefined && (
                    <div className="h-2 bg-[var(--border)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[var(--primary)]"
                        style={{ width: `${selectedProduct.completeness * 100}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
