import Link from 'next/link'
import { getProductBySlug, getProducts } from '@/lib/services/products'
import { ProductDetailClient } from '@/components/ProductDetailClient'
import { ProductCard } from '@/components/ui/ProductCard'
import { ChevronRight } from 'lucide-react'
import { notFound } from 'next/navigation'

export const revalidate = 0

interface ProductDetailPageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const resolvedParams = await params
  const { slug } = resolvedParams

  const product = await getProductBySlug(slug)
  if (!product) {
    notFound()
  }

  // Fetch related products (same category, excluding current product)
  const related = await getProducts({
    categoryId: product.category_id || undefined,
    limit: 5,
  })
  const relatedFiltered = related.filter((p) => p.id !== product.id).slice(0, 4)

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-12">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link href="/" className="hover:text-primary">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/products" className="hover:text-primary">Products</Link>
        {product.category && (
          <>
            <ChevronRight className="h-3 w-3" />
            <Link href={`/products?category=${product.category.slug}`} className="hover:text-primary">
              {product.category.name}
            </Link>
          </>
        )}
        <ChevronRight className="h-3 w-3" />
        <span className="text-slate-900 font-bold truncate max-w-[200px]">{product.name}</span>
      </div>

      {/* Main product view */}
      <ProductDetailClient product={product} />

      {/* Product Description details */}
      <div className="border-t border-border pt-8 max-w-3xl space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Product Specifications & Description</h2>
        <div className="text-slate-600 leading-relaxed text-sm whitespace-pre-line">
          {product.description || 'No detailed specifications provided for this product.'}
        </div>
      </div>

      {/* Related Products */}
      {relatedFiltered.length > 0 && (
        <div className="border-t border-border pt-12 space-y-6">
          <h2 className="text-2xl font-bold text-slate-900">You May Also Like</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {relatedFiltered.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
