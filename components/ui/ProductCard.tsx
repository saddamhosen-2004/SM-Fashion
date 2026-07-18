'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Product } from '@/types'
import { Badge } from './Badge'
import { Button } from './Button'
import { ShoppingCart } from 'lucide-react'
import { useCartStore } from '@/lib/store/cart'
import { useLanguage } from '@/components/providers/LanguageProvider'
import toast from 'react-hot-toast'

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const router = useRouter()
  const addItem = useCartStore((state) => state.addItem)
  const { translateProduct, t } = useLanguage()
  const { displayName } = translateProduct(product)

  const hasDiscount = !!product.discount_price && product.discount_price < product.price
  const discountPercentage = hasDiscount
    ? Math.round(((product.price - product.discount_price!) / product.price) * 100)
    : 0

  const primaryImage = product.images?.find((img) => img.is_primary)?.url || 
                       product.images?.[0]?.url || 
                       '/placeholder-product.jpg'

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    addItem(product)
    toast.success(`${displayName} added to cart!`, {
      position: 'bottom-right',
      style: {
        background: '#006a4e',
        color: '#fff',
      }
    })
  }

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    addItem(product)
    router.push('/checkout')
  }

  return (
    <Link href={`/products/${product.slug}`} className="group flex flex-col bg-card rounded-lg overflow-hidden border border-border shadow-sm hover:shadow-lg hover:border-primary/20 hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] animate-fade-in-up">
      <div className="relative aspect-square overflow-hidden bg-muted">
        <Image
          src={primaryImage}
          alt={displayName}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover object-center group-hover:scale-108 transition-transform duration-500 ease-out"
          unoptimized={primaryImage.startsWith('http') || primaryImage.startsWith('/')}
        />
        
        {hasDiscount && (
          <div className="absolute top-2 left-2 z-10 transition-transform group-hover:scale-110 duration-300">
            <Badge variant="secondary" className="font-bold">
              -{discountPercentage}%
            </Badge>
          </div>
        )}

        {product.stock_quantity <= 0 && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] flex items-center justify-center z-10">
            <span className="bg-danger text-white text-xs font-bold uppercase px-3 py-1 rounded">{t('product.outOfStock')}</span>
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-sm text-foreground line-clamp-2 min-h-[40px] group-hover:text-primary transition-colors duration-200">
          {displayName}
        </h3>
        
        <div className="mt-2 flex items-baseline gap-2">
          {hasDiscount ? (
            <>
              <span className="text-lg font-bold text-primary">৳{product.discount_price}</span>
              <span className="text-xs text-muted-foreground line-through">৳{product.price}</span>
            </>
          ) : (
            <span className="text-lg font-bold text-foreground">৳{product.price}</span>
          )}
        </div>

        <div className="mt-auto pt-4 flex gap-2">
          <Button
            onClick={handleAddToCart}
            disabled={product.stock_quantity <= 0}
            variant="outline"
            className="flex-1 flex items-center justify-center gap-1.5 h-9 text-xs font-bold border border-primary text-primary hover:bg-primary/5 rounded-full active:scale-95 transition-all duration-200"
            size="sm"
          >
            <ShoppingCart className="w-3.5 h-3.5 shrink-0" />
            {t('product.addToCart')}
          </Button>
          <Button
            onClick={handleBuyNow}
            disabled={product.stock_quantity <= 0}
            className="flex-1 flex items-center justify-center gap-1.5 h-9 text-xs font-bold bg-primary hover:bg-primary-hover text-white rounded-full shadow hover:shadow-primary/20 active:scale-95 transition-all duration-200"
            size="sm"
          >
            {t('product.buyNow')}
          </Button>
        </div>
      </div>
    </Link>
  )
}
