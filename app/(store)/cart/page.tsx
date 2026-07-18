'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useCartStore } from '@/lib/store/cart'
import { Button } from '@/components/ui/Button'
import { Trash2, ShoppingBag, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'

export default function CartPage() {
  const [mounted, setMounted] = useState(false)
  const { items, updateQuantity, removeItem, getSubtotal, getShippingCharge, getTotal } = useCartStore()

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 flex justify-center items-center">
        <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 text-center space-y-6">
        <div className="h-16 w-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto">
          <ShoppingBag className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-900">Your shopping cart is empty</h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Browse our collection of premium clothing and find something beautiful to add to your wardrobe today.
          </p>
        </div>
        <Link href="/products" className="inline-block">
          <Button size="lg" className="rounded-full px-8">
            Start Shopping
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      <h1 className="text-3xl font-black text-slate-900">Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Cart Items List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="divide-y divide-slate-100 border border-border bg-white rounded-xl overflow-hidden shadow-sm">
            {items.map((item, idx) => {
              const product = item.product
              const price = product.discount_price ?? product.price
              const primaryImage = product.images?.find((img) => img.is_primary)?.url || 
                                   product.images?.[0]?.url || 
                                   '/placeholder-product.jpg'

              return (
                <div key={idx} className="flex gap-4 p-4 hover:bg-slate-50/50 transition-colors">
                  {/* Thumbnail */}
                  <div className="relative h-20 w-20 rounded-lg overflow-hidden border border-slate-100 shrink-0 bg-slate-50">
                    <Image
                      src={primaryImage}
                      alt={product.name}
                      fill
                      sizes="80px"
                      className="object-cover"
                      unoptimized={primaryImage.startsWith('http') || primaryImage.startsWith('/')}
                    />
                  </div>

                  {/* Item Description */}
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <Link href={`/products/${product.slug}`} className="font-bold text-sm text-slate-900 hover:text-primary transition-colors line-clamp-1">
                        {product.name}
                      </Link>
                      
                      {/* Attributes */}
                      <div className="flex flex-wrap gap-2 mt-1">
                        {item.selectedSize && (
                          <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded">
                            Size: {item.selectedSize}
                          </span>
                        )}
                        {item.selectedColor && (
                          <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded">
                            Color: {item.selectedColor}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-4 mt-2">
                      {/* Quantity Selector */}
                      <div className="flex items-center border border-border rounded-lg bg-white h-8 overflow-hidden">
                        <button
                          type="button"
                          onClick={() => updateQuantity(product.id, item.quantity - 1, item.selectedSize, item.selectedColor)}
                          className="px-2 hover:bg-muted text-slate-600 transition-colors h-full text-sm font-bold"
                        >
                          -
                        </button>
                        <span className="px-3 text-xs font-bold text-slate-800">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(product.id, item.quantity + 1, item.selectedSize, item.selectedColor)}
                          className="px-2 hover:bg-muted text-slate-600 transition-colors h-full text-sm font-bold"
                        >
                          +
                        </button>
                      </div>

                      {/* Pricing */}
                      <span className="text-sm font-bold text-slate-900">৳{price * item.quantity}</span>
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => {
                      removeItem(product.id, item.selectedSize, item.selectedColor)
                      toast.success('Removed from cart')
                    }}
                    className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg shrink-0 h-fit"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* Pricing Summary Side Card */}
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-xl border border-border shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-950 border-b border-border pb-3">
              Order Summary
            </h3>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-900">৳{getSubtotal()}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Shipping Charge</span>
                <span className="font-semibold text-slate-900">৳{getShippingCharge()}</span>
              </div>
              <div className="flex justify-between text-slate-950 font-bold text-base pt-3 border-t border-slate-100">
                <span>Total Amount</span>
                <span className="text-primary text-lg">৳{getTotal()}</span>
              </div>
            </div>

            <Link href="/checkout" className="block w-full pt-2">
              <Button className="w-full flex items-center justify-center gap-2 h-12" size="lg">
                Proceed to Checkout
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}
