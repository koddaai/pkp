import Link from "next/link";
import { Package, Sparkles, CheckCircle, FolderOpen, Upload, FolderOutput, Bot, BarChart3 } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-[var(--border)] bg-[var(--muted)]">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-6 h-6 text-[var(--primary)]" />
            <h1 className="text-xl font-bold">PKP Studio</h1>
          </div>
          <nav className="flex gap-4">
            <Link href="/catalog" className="text-sm hover:text-[var(--primary)]">
              Catalog
            </Link>
            <Link href="/products" className="text-sm hover:text-[var(--primary)]">
              Products
            </Link>
            <Link href="/generate" className="text-sm hover:text-[var(--primary)]">
              Generate
            </Link>
            <Link href="/batch" className="text-sm hover:text-[var(--primary)]">
              Batch Import
            </Link>
            <Link href="/export" className="text-sm hover:text-[var(--primary)]">
              Export
            </Link>
            <Link href="/analytics" className="text-sm hover:text-[var(--primary)]">
              Analytics
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Welcome to PKP Studio</h2>
          <p className="text-[var(--muted-foreground)]">
            Manage your product catalogs with the Product Knowledge Protocol
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link
            href="/catalog"
            className="p-6 border border-[var(--primary)] rounded-lg hover:bg-[var(--muted)] transition-colors"
          >
            <Bot className="w-8 h-8 text-[var(--primary)] mb-3" />
            <h3 className="font-semibold mb-1">AI View</h3>
            <p className="text-sm text-[var(--muted-foreground)]">
              See how AI agents view your products
            </p>
          </Link>

          <Link
            href="/products"
            className="p-6 border border-[var(--border)] rounded-lg hover:border-[var(--primary)] transition-colors"
          >
            <FolderOpen className="w-8 h-8 text-[var(--primary)] mb-3" />
            <h3 className="font-semibold mb-1">Browse Products</h3>
            <p className="text-sm text-[var(--muted-foreground)]">
              View and edit your PRODUCT.md files
            </p>
          </Link>

          <Link
            href="/generate"
            className="p-6 border border-[var(--border)] rounded-lg hover:border-[var(--primary)] transition-colors"
          >
            <Sparkles className="w-8 h-8 text-[var(--primary)] mb-3" />
            <h3 className="font-semibold mb-1">Generate Product</h3>
            <p className="text-sm text-[var(--muted-foreground)]">
              Create PRODUCT.md from a URL using AI
            </p>
          </Link>

          <Link
            href="/batch"
            className="p-6 border border-[var(--border)] rounded-lg hover:border-[var(--primary)] transition-colors"
          >
            <Upload className="w-8 h-8 text-[var(--primary)] mb-3" />
            <h3 className="font-semibold mb-1">Batch Import</h3>
            <p className="text-sm text-[var(--muted-foreground)]">
              Import multiple products from URLs
            </p>
          </Link>

          <Link
            href="/export"
            className="p-6 border border-[var(--border)] rounded-lg hover:border-[var(--primary)] transition-colors"
          >
            <FolderOutput className="w-8 h-8 text-[var(--primary)] mb-3" />
            <h3 className="font-semibold mb-1">Export Catalog</h3>
            <p className="text-sm text-[var(--muted-foreground)]">
              Generate .well-known/pkp/ for deployment
            </p>
          </Link>

          <Link
            href="/analytics"
            className="p-6 border border-[var(--border)] rounded-lg hover:border-[var(--primary)] transition-colors"
          >
            <BarChart3 className="w-8 h-8 text-[var(--primary)] mb-3" />
            <h3 className="font-semibold mb-1">AI Analytics</h3>
            <p className="text-sm text-[var(--muted-foreground)]">
              Track AI agents accessing your products
            </p>
          </Link>
        </div>

        {/* Stats (placeholder) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-[var(--muted)] rounded-lg">
            <p className="text-2xl font-bold">0</p>
            <p className="text-sm text-[var(--muted-foreground)]">Products</p>
          </div>
          <div className="p-4 bg-[var(--muted)] rounded-lg">
            <p className="text-2xl font-bold">0</p>
            <p className="text-sm text-[var(--muted-foreground)]">Categories</p>
          </div>
          <div className="p-4 bg-[var(--muted)] rounded-lg">
            <p className="text-2xl font-bold">0</p>
            <p className="text-sm text-[var(--muted-foreground)]">Brands</p>
          </div>
          <div className="p-4 bg-[var(--muted)] rounded-lg">
            <p className="text-2xl font-bold">-</p>
            <p className="text-sm text-[var(--muted-foreground)]">Last Build</p>
          </div>
        </div>
      </main>
    </div>
  );
}
