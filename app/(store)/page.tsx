import Link from 'next/link'
import Image from 'next/image'
import { getProducts } from '@/lib/services/products'
import { getCategories } from '@/lib/services/categories'
import { ProductCard } from '@/components/ui/ProductCard'
import { ArrowRight, ShoppingBag, Truck, ShieldCheck, Heart } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { HeroBanner } from '@/components/HeroBanner'
import { createClient } from '@/lib/supabase/server'

// Allow dynamic data fetching
export const revalidate = 0

export default async function StoreHomepage() {
  const supabase = await createClient()

  // Fetch active banners
  const { data: banners } = await supabase
    .from('banners')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  // Fetch all active products and categories
  const [allProducts, categories] = await Promise.all([
    getProducts({ limit: 100, sortBy: 'newest' }),
    getCategories()
  ])

  // Filter root categories
  const rootCategories = categories.filter(c => c.is_active && !c.parent_id).slice(0, 4)

  // Map products to categories for category-wise display
  const categoriesWithProducts = rootCategories.map((cat) => {
    const catProducts = allProducts.filter((p) => p.category_id === cat.id).slice(0, 4)
    return {
      ...cat,
      products: catProducts
    }
  }).filter(c => c.products.length > 0)

  // Fallback to general featured items if no categories have items
  const featured = allProducts.filter(p => p.is_featured).slice(0, 4)
  const fallbackFeatured = featured.length > 0 ? featured : allProducts.slice(0, 4)

  return (
    <div className="space-y-16 pb-16">
      
      {/* Hero Banner Slider */}
      <HeroBanner banners={banners || []} />

      {/* Categories Showcase (The Shopping Bar) */}
      {rootCategories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex items-baseline justify-between border-b border-slate-100 pb-2">
            <h2 className="text-2xl font-black tracking-tight text-slate-900">Shop by Category</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {rootCategories.map((cat) => (
              <Link
                key={cat.id}
                href={`/products?category=${cat.slug}`}
                className="group relative flex flex-col items-center justify-center p-6 rounded-xl border border-border bg-white text-center hover:border-primary/30 hover:shadow-md transition-all duration-300 min-h-[140px]"
              >
                <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                  <ShoppingBag className="h-6 w-6" />
                </div>
                <span className="font-bold text-slate-900 text-sm group-hover:text-primary transition-colors">
                  {cat.name}
                </span>
                <span className="text-[11px] text-muted-foreground mt-1">
                  {cat.name_bn ? cat.name_bn : ''}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Category-Wise Product Grids */}
      {categoriesWithProducts.length > 0 ? (
        categoriesWithProducts.map((cat) => (
          <section key={cat.id} className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
            <div className="flex items-baseline justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-slate-900">{cat.name}</h2>
                {cat.name_bn && <p className="text-xs text-muted-foreground mt-0.5">{cat.name_bn} কালেকশন</p>}
              </div>
              <Link
                href={`/products?category=${cat.slug}`}
                className="text-sm font-semibold text-primary hover:text-primary-hover flex items-center gap-1"
              >
                See All <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              {cat.products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        ))
      ) : (
        /* Fallback: Flat featured items list if database has no categorized items */
        fallbackFeatured.length > 0 && (
          <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
            <div className="flex items-baseline justify-between border-b border-slate-100 pb-2">
              <h2 className="text-2xl font-black tracking-tight text-slate-900">Featured Items</h2>
              <Link href="/products" className="text-sm font-semibold text-primary hover:text-primary-hover flex items-center gap-1">
                See All <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              {fallbackFeatured.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )
      )}

      {/* Services Value Proposition (Moved Lower Down) */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 bg-white p-8 rounded-2xl border border-border shadow-sm">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Truck className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 font-inter">Fast Delivery</h4>
              <p className="text-xs text-muted-foreground">Cash on delivery all over Bangladesh</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 font-inter">100% Genuine Fabrics</h4>
              <p className="text-xs text-muted-foreground">Sourced directly from local weavers</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 font-inter">Premium Packaging</h4>
              <p className="text-xs text-muted-foreground">Perfect for gifting and special occasions</p>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
