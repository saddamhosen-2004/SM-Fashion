'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Product } from '@/types'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ShoppingCart, Heart, Shield, RotateCcw, Truck } from 'lucide-react'
import { useCartStore } from '@/lib/store/cart'
import { useLanguage } from '@/components/providers/LanguageProvider'
import toast from 'react-hot-toast'

interface ProductDetailClientProps {
  product: Product
}

export function ProductDetailClient({ product }: ProductDetailClientProps) {
  const router = useRouter()
  const { translateProduct, t } = useLanguage()
  const { displayName, displayDescription } = translateProduct(product)

  const [selectedImage, setSelectedImage] = useState(
    product.images?.find((img) => img.is_primary)?.url ||
    product.images?.[0]?.url ||
    '/placeholder-product.jpg'
  )
  
  const [quantity, setQuantity] = useState(1)
  const [selectedSize, setSelectedSize] = useState<string>('')
  const [selectedColor, setSelectedColor] = useState<string>('')
  const addItem = useCartStore((state) => state.addItem)

  const handleBuyNow = () => {
    addItem(product, quantity, selectedSize || undefined, selectedColor || undefined)
    router.push('/checkout')
  }

  const hasDiscount = !!product.discount_price && product.discount_price < product.price
  const discountPercentage = hasDiscount
    ? Math.round(((product.price - product.discount_price!) / product.price) * 100)
    : 0

  const handleAddToCart = () => {
    // If product category is clothing/apparel, we might want sizes (for MVP we'll make sizes optional or log them)
    addItem(product, quantity, selectedSize || undefined, selectedColor || undefined)
    toast.success(`${displayName} added to cart!`, {
      position: 'bottom-right',
      style: {
        background: '#006a4e',
        color: '#fff',
      }
    })
  }

  const sizes = ['S', 'M', 'L', 'XL', 'XXL']
  const colors = ['Crimson', 'Emerald', 'Classic Navy', 'Midnight Black', 'Ivory']

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
      {/* Left Column: Image Gallery */}
      <div className="space-y-4">
        <div className="relative aspect-square rounded-2xl border border-border overflow-hidden bg-slate-50">
          <Image
            src={selectedImage}
            alt={displayName}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover object-center"
            unoptimized={selectedImage.startsWith('http') || selectedImage.startsWith('/')}
            priority
          />
          {hasDiscount && (
            <div className="absolute top-4 left-4 z-10">
              <Badge variant="secondary" className="text-sm font-bold px-3 py-1 shadow-sm">
                -{discountPercentage}% Off
              </Badge>
            </div>
          )}
        </div>

        {/* Thumbnails */}
        {product.images && product.images.length > 1 && (
          <div className="flex gap-3 overflow-x-auto pb-1">
            {product.images.map((img, idx) => (
              <button
                key={img.id || idx}
                onClick={() => setSelectedImage(img.url)}
                className={`relative h-20 w-20 rounded-lg border overflow-hidden bg-slate-50 shrink-0 transition-all ${
                  selectedImage === img.url ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-slate-400'
                }`}
              >
                <Image
                  src={img.url}
                  alt={`${displayName} Thumbnail ${idx + 1}`}
                  fill
                  sizes="80px"
                  className="object-cover"
                  unoptimized={img.url.startsWith('http') || img.url.startsWith('/')}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right Column: Product details */}
      <div className="flex flex-col space-y-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary">
            {product.category?.name || 'SM Fashion Exclusive'}
          </span>
          <h1 className="text-3xl font-black text-slate-900 mt-1">{displayName}</h1>
          <p className="text-xs text-muted-foreground mt-1">SKU: {product.sku || 'N/A'}</p>
        </div>

        {/* Price Section */}
        <div className="flex items-baseline gap-3 border-y border-border py-4">
          {hasDiscount ? (
            <>
              <span className="text-3xl font-extrabold text-primary">৳{product.discount_price}</span>
              <span className="text-lg text-slate-400 line-through">৳{product.price}</span>
            </>
          ) : (
            <span className="text-3xl font-extrabold text-slate-900">৳{product.price}</span>
          )}
        </div>

        {/* Sizes Selection (Optional for now) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-900">Select Size:</span>
            <span className="text-xs text-muted-foreground underline cursor-pointer">Size Guide</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {sizes.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setSelectedSize(size)}
                className={`h-10 px-4 rounded-lg border text-sm font-semibold transition-all ${
                  selectedSize === size
                    ? 'border-primary bg-primary/5 text-primary font-bold'
                    : 'border-border text-slate-700 hover:border-slate-400'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Quantity and Actions */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-slate-900">Quantity:</span>
            <div className="flex items-center border border-border rounded-lg bg-white h-10 overflow-hidden">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3 hover:bg-muted text-slate-600 transition-colors h-full"
              >
                -
              </button>
              <span className="px-4 text-sm font-bold text-slate-800">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                className="px-3 hover:bg-muted text-slate-600 transition-colors h-full"
              >
                +
              </button>
            </div>
            
            <span className="text-xs font-medium text-slate-500">
              {product.stock_quantity > 0 ? (
                <span className="text-success font-bold">{t('product.inStock')} ({product.stock_quantity} left)</span>
              ) : (
                <span className="text-danger font-bold">{t('product.outOfStock')}</span>
              )}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              onClick={handleAddToCart}
              disabled={product.stock_quantity <= 0}
              variant="outline"
              className="flex-1 flex items-center justify-center gap-2 h-12 rounded-full border-2 border-primary text-primary hover:bg-primary/5 font-bold"
              size="lg"
            >
              <ShoppingCart className="h-5 w-5" />
              {t('product.addToCart')}
            </Button>
            <Button
              onClick={handleBuyNow}
              disabled={product.stock_quantity <= 0}
              className="flex-1 flex items-center justify-center gap-2 h-12 rounded-full font-bold bg-primary hover:bg-primary-hover shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all"
              size="lg"
            >
              {t('product.buyNow')}
            </Button>
            <Button variant="outline" size="icon" className="h-12 w-12 shrink-0 rounded-full">
              <Heart className="h-5 w-5 text-slate-500 hover:text-red-500 transition-colors" />
            </Button>
          </div>

          {/* Description Section */}
          {displayDescription && (
            <div className="border-t border-border pt-4">
              <h3 className="text-xs font-semibold text-slate-900 mb-1">Description</h3>
              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{displayDescription}</p>
            </div>
          )}
        </div>

        {/* Small Value Features */}
        <div className="border-t border-border pt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-primary shrink-0" />
            <span>Cash on Delivery</span>
          </div>
          <div className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4 text-primary shrink-0" />
            <span>7-Day Easy Returns</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary shrink-0" />
            <span>Secure Checkout</span>
          </div>
        </div>

      </div>
    </div>
  )
}
