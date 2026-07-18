'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/lib/store/cart'
import { useLanguage } from '@/components/providers/LanguageProvider'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Badge } from '@/components/ui/Badge'
import { ShoppingBag, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'

export default function CheckoutPage() {
  const router = useRouter()
  const { translateProduct, t } = useLanguage()
  const [mounted, setMounted] = useState(false)
  const { items, getSubtotal, getShippingCharge, getTotal, clearCart } = useCartStore()
  const supabase = createClient()

  // Form fields
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [district, setDistrict] = useState('')
  const [division, setDivision] = useState('')
  const [notes, setNotes] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'bkash' | 'nagad'>('cod')
  const [submitting, setSubmitting] = useState(false)

  // Auth User check
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        if (profile) {
          setName(profile.full_name || '')
          setPhone(profile.phone || '')
          setAddress(profile.address || '')
        }
      }
    }
    loadUser()
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
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 text-center space-y-4">
        <h2 className="text-xl font-bold">Your cart is empty.</h2>
        <Button onClick={() => router.push('/products')}>Back to Products</Button>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !phone || !address || !district || !division) {
      toast.error('Please fill in all shipping details')
      return
    }

    setSubmitting(true)
    try {
      const totalAmount = getTotal()
      const shippingCharge = getShippingCharge()
      const subtotal = getSubtotal()

      // 1. Double check stock availability
      for (const item of items) {
        const { data: currentProduct, error: stockCheckError } = await supabase
          .from('products')
          .select('stock_quantity, name')
          .eq('id', item.product.id)
          .single()

        if (stockCheckError || !currentProduct) {
          throw new Error(`Failed to check stock for ${item.product.name}`)
        }

        if (currentProduct.stock_quantity < item.quantity) {
          throw new Error(`Sorry, only ${currentProduct.stock_quantity} units of ${item.product.name} are in stock. Please reduce quantity in cart.`)
        }
      }

      // 2. Insert order
      const shippingAddress = {
        name,
        phone,
        address,
        district,
        division,
      }

      const { data: newOrder, error: orderError } = await supabase
        .from('orders')
        .insert([
          {
            customer_id: userId,
            status: 'pending',
            total_amount: totalAmount,
            discount_amount: 0.0,
            shipping_charge: shippingCharge,
            payment_status: 'unpaid',
            payment_method: paymentMethod,
            shipping_address: shippingAddress,
            notes: notes || null,
          },
        ])
        .select()
        .single()

      if (orderError) throw orderError

      // 3. Insert order items
      const orderItemsToInsert = items.map((item) => {
        const itemPrice = item.product.discount_price ?? item.product.price
        return {
          order_id: newOrder.id,
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: itemPrice,
          total_price: itemPrice * item.quantity,
        }
      })

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItemsToInsert)

      if (itemsError) throw itemsError

      // 4. Update stock levels
      for (const item of items) {
        const newQty = item.product.stock_quantity - item.quantity
        const { error: stockUpdateError } = await supabase
          .from('products')
          .update({ stock_quantity: newQty })
          .eq('id', item.product.id)

        if (stockUpdateError) {
          console.error(`Failed to update stock for ${item.product.name}:`, stockUpdateError)
        }

        // Write inventory movement log
        await supabase.from('inventory').insert([
          {
            product_id: item.product.id,
            quantity: -item.quantity,
            type: 'out',
            reason: `Order placed #${newOrder.id.substring(0, 8)}`,
          },
        ])
      }

      // If COD checkout succeeded
      toast.success('Order placed successfully!')
      clearCart()
      router.push(`/order-confirmation?orderId=${newOrder.id}`)
    } catch (error: any) {
      toast.error(error.message || 'An error occurred during checkout')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      <h1 className="text-3xl font-black text-slate-900">Checkout</h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Columns - Shipping Form & Payment */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-border shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-955 border-b border-border pb-3">
              {t('checkout.shippingAddress')}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Receiver name"
                required
              />
              <Input
                label="Phone Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Receiver mobile number"
                required
              />
            </div>

            <Input
              label="Detailed Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="House, Flat, Street, Area..."
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="District / City"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="e.g. Dhaka"
                required
              />
              <Input
                label="Division"
                value={division}
                onChange={(e) => setDivision(e.target.value)}
                placeholder="e.g. Dhaka"
                required
              />
            </div>

            <Textarea
              label="Delivery Instructions (Optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Leave with security guard"
              rows={3}
            />
          </div>

          {/* Payment Method */}
          <div className="bg-white p-6 rounded-xl border border-border shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-950 border-b border-border pb-3">
              Payment Method
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <label className="flex items-center gap-3 p-4 rounded-lg border border-primary bg-primary/5 cursor-pointer">
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'cod'}
                  onChange={() => setPaymentMethod('cod')}
                  className="h-4 w-4 text-primary focus:ring-primary border-slate-300"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-900">Cash on Delivery</span>
                  <span className="text-[10px] text-muted-foreground">Pay with cash when delivered</span>
                </div>
              </label>

              {/* bKash (Phase 3 placeholder) */}
              <label className="flex items-center gap-3 p-4 rounded-lg border border-slate-200 opacity-60 cursor-not-allowed">
                <input
                  type="radio"
                  name="payment"
                  disabled
                  className="h-4 w-4 text-primary focus:ring-primary border-slate-300"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-900">bKash Pay</span>
                  <span className="text-[10px] text-amber-600 font-extrabold uppercase">Coming Soon</span>
                </div>
              </label>

              {/* Nagad (Phase 3 placeholder) */}
              <label className="flex items-center gap-3 p-4 rounded-lg border border-slate-200 opacity-60 cursor-not-allowed">
                <input
                  type="radio"
                  name="payment"
                  disabled
                  className="h-4 w-4 text-primary focus:ring-primary border-slate-300"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-900">Nagad Pay</span>
                  <span className="text-[10px] text-amber-600 font-extrabold uppercase">Coming Soon</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column - Order Items summary */}
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-xl border border-border shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-950 border-b border-border pb-3">
              Items in Order
            </h3>

            <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 pr-1">
              {items.map((item, idx) => {
                const product = item.product
                const { displayName } = translateProduct(product)
                const price = product.discount_price ?? product.price
                const primaryImage = product.images?.find((img) => img.is_primary)?.url || 
                                     product.images?.[0]?.url || 
                                     '/placeholder-product.jpg'

                return (
                  <div key={idx} className="flex gap-3 py-3 items-center">
                    <div className="relative h-12 w-12 rounded border border-slate-100 overflow-hidden shrink-0 bg-slate-50">
                      <img
                        src={primaryImage}
                        alt={displayName}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-xs text-slate-900 truncate">{displayName}</h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Qty: {item.quantity} {item.selectedSize ? `· Size: ${item.selectedSize}` : ''}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-slate-900">৳{price * item.quantity}</span>
                  </div>
                )
              })}
            </div>

            <div className="border-t border-border pt-4 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Cart Subtotal</span>
                <span className="font-semibold text-slate-900">৳{getSubtotal()}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Shipping Charge</span>
                <span className="font-semibold text-slate-900">৳{getShippingCharge()}</span>
              </div>
              <div className="flex justify-between text-slate-950 font-bold text-sm pt-3 border-t border-slate-100">
                <span>Order Total</span>
                <span className="text-primary text-base">৳{getTotal()}</span>
              </div>
            </div>

            <Button
              type="submit"
              loading={submitting}
              className="w-full flex items-center justify-center h-12 text-sm font-bold mt-2 hover:scale-[1.01] active:scale-[0.99] transition-transform duration-150"
              size="lg"
            >
              {t('checkout.placeOrder')}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
