import Link from 'next/link'
import { getProducts } from '@/lib/services/products'
import { getCategories } from '@/lib/services/categories'
import { ProductCard } from '@/components/ui/ProductCard'
import { Badge } from '@/components/ui/Badge'
import { ChevronRight } from 'lucide-react'

export const revalidate = 0

interface ProductsPageProps {
  searchParams: Promise<{
    category?: string
    search?: string
    sortBy?: 'newest' | 'price-low' | 'price-high' | 'popularity'
  }>
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const resolvedParams = await searchParams
  const activeCategorySlug = resolvedParams.category
  const searchQuery = resolvedParams.search
  const activeSort = resolvedParams.sortBy || 'newest'

  // Fetch initial data
  const [products, categories] = await Promise.all([
    getProducts({
      categorySlug: activeCategorySlug,
      search: searchQuery,
      sortBy: activeSort,
    }),
    getCategories(),
  ])

  // Get active category object for display
  const activeCategory = activeCategorySlug
    ? categories.find((c) => c.slug === activeCategorySlug)
    : null

  const sortingOptions = [
    { value: 'newest', label: 'Newest Arrivals' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
  ]

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-6">
        <Link href="/" className="hover:text-primary">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/products" className={`hover:text-primary ${!activeCategorySlug ? 'text-slate-900 font-bold' : ''}`}>
          All Products
        </Link>
        {activeCategory && (
          <>
            <ChevronRight className="h-3 w-3" />
            <span className="text-slate-900 font-bold">{activeCategory.name}</span>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Sidebar - Categories & Filters */}
        <div className="lg:col-span-1">
          <div className="bg-white p-4 lg:p-6 rounded-xl border border-border shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-950 hidden lg:block">Categories</h3>
            <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 scrollbar-none snap-x">
              <Link
                href="/products"
                className={`text-xs lg:text-sm py-1.5 px-3 rounded-full lg:rounded-lg hover:bg-slate-50 transition-colors shrink-0 snap-align-start ${
                  !activeCategorySlug ? 'bg-primary/10 text-primary font-bold border border-primary/20' : 'text-slate-600 border border-slate-150 lg:border-none'
                }`}
              >
                All ({categories.reduce((acc, cat) => acc + (cat.product_count || 0), 0)})
              </Link>
              {categories
                .filter((c) => c.is_active && !c.parent_id)
                .map((parent) => {
                  const children = categories.filter((c) => c.parent_id === parent.id && c.is_active)
                  const isParentActive = activeCategorySlug === parent.slug
                  return (
                    <div key={parent.id} className="flex lg:flex-col gap-1 shrink-0 lg:shrink lg:mt-2 lg:first:mt-0 snap-align-start">
                      <Link
                        href={`/products?category=${parent.slug}`}
                        className={`text-xs lg:text-sm py-1.5 px-3 rounded-full lg:rounded-lg hover:bg-slate-50 transition-colors flex justify-between items-center border lg:border-none ${
                          isParentActive ? 'bg-primary/10 text-primary font-bold border-primary/20' : 'text-slate-800 lg:font-semibold border-slate-150'
                        }`}
                      >
                        <span>{parent.name}</span>
                      </Link>
                      {children.length > 0 && (
                        <div className="hidden lg:flex flex-col gap-1 border-l border-slate-100 ml-3 mt-1 pl-4">
                          {children.map((child) => (
                            <Link
                              key={child.id}
                              href={`/products?category=${child.slug}`}
                              className={`text-xs py-1 px-2.5 rounded hover:bg-slate-50 transition-colors ${
                                activeCategorySlug === child.slug ? 'text-primary font-bold bg-primary/5' : 'text-slate-550'
                              }`}
                            >
                              {child.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
            </div>
          </div>
        </div>

        {/* Right side - Products list */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-slate-900">
                {activeCategory ? activeCategory.name : 'All Products'}
              </h2>
              {searchQuery && (
                <p className="text-xs text-muted-foreground mt-1">
                  Showing results for &ldquo;{searchQuery}&rdquo;
                </p>
              )}
            </div>

            {/* Sorting controls */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground shrink-0">Sort By:</span>
              <div className="flex gap-1 border border-border rounded-lg p-0.5 bg-white">
                {sortingOptions.map((opt) => (
                  <Link
                    key={opt.value}
                    href={{
                      pathname: '/products',
                      query: {
                        ...(activeCategorySlug ? { category: activeCategorySlug } : {}),
                        ...(searchQuery ? { search: searchQuery } : {}),
                        sortBy: opt.value,
                      },
                    }}
                    className={`text-[11px] font-bold px-2 py-1.5 rounded transition-colors ${
                      activeSort === opt.value
                        ? 'bg-primary text-white'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {opt.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Products Grid */}
          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center p-12 bg-white rounded-xl border border-border min-h-[300px]">
              <p className="text-slate-500 mb-2">No products found in this category.</p>
              <Link href="/products" className="text-primary font-bold hover:underline">
                Clear Filters & View All
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
