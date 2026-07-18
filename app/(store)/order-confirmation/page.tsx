'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { CheckCircle2, ShoppingBag, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import toast from 'react-hot-toast'

function OrderConfirmationContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')
  const router = useRouter()
  
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function loadOrder() {
      if (!orderId) {
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*, order_items(*, product:products(*))')
          .eq('id', orderId)
          .single()

        if (error) throw error
        setOrder(data)
      } catch (error: any) {
        console.error('Failed to load order info:', error)
        toast.error('Failed to load order info')
      } finally {
        setLoading(false)
      }
    }

    loadOrder()
  }, [orderId])

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 flex flex-col justify-center items-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-slate-500">Retrieving order confirmation details...</p>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 text-center space-y-4">
        <h2 className="text-xl font-bold text-red-600">Order not found</h2>
        <p className="text-sm text-slate-500">The requested order ID could not be loaded.</p>
        <Link href="/">
          <Button>Back to Home</Button>
        </Link>
      </div>
    )
  }

  const shipping = order.shipping_address

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8 text-center space-y-8">
      {/* Thank you header */}
      <div className="space-y-4">
        <div className="h-16 w-16 bg-success/15 text-success rounded-full flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-slate-900">Thank You for Your Order!</h1>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            Your Cash on Delivery order has been successfully placed. We will contact you soon on <span className="font-bold text-slate-900">{shipping?.phone}</span> to confirm your delivery address.
          </p>
        </div>
      </div>

      {/* Order Summary Card */}
      <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden text-left text-sm">
        <div className="bg-slate-50 p-4 border-b border-border flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          <div>
            <span className="text-xs text-muted-foreground uppercase font-bold">Order Number</span>
            <p className="font-mono font-bold text-slate-900 text-sm">#{order.id.substring(0, 8).toUpperCase()}</p>
          </div>
          <div className="sm:text-right">
            <span className="text-xs text-muted-foreground uppercase font-bold">Estimated Delivery</span>
            <p className="font-bold text-slate-900 text-sm">2 - 4 Business Days</p>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Shipping Address */}
          <div>
            <h4 className="font-extrabold text-slate-950 uppercase tracking-wider text-xs mb-2">Delivery Address</h4>
            <p className="text-slate-800 font-bold">{shipping?.name}</p>
            <p className="text-slate-600 mt-0.5">{shipping?.address}</p>
            <p className="text-slate-600">{shipping?.district}, {shipping?.division}</p>
            <p className="text-slate-600">Phone: {shipping?.phone}</p>
          </div>

          {/* Payment Method */}
          <div>
            <h4 className="font-extrabold text-slate-950 uppercase tracking-wider text-xs mb-2">Payment Details</h4>
            <div className="flex gap-2 items-center">
              <span className="font-bold text-slate-900">Cash on Delivery (COD)</span>
              <Badge variant="outline">Unpaid</Badge>
            </div>
          </div>

          {/* Total Amount */}
          <div className="border-t border-slate-100 pt-4 flex justify-between items-center">
            <span className="font-bold text-slate-900 text-base">Total Amount to Pay</span>
            <span className="text-primary font-extrabold text-xl">৳{order.total_amount}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link href="/products">
          <Button variant="outline" className="w-full sm:w-auto h-12 px-8 rounded-full">
            Continue Shopping
          </Button>
        </Link>
        <Link href="/account/orders">
          <Button className="w-full sm:w-auto h-12 px-8 rounded-full">
            View My Orders
          </Button>
        </Link>
      </div>
    </div>
  )
}

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-7xl px-4 py-16 flex flex-col justify-center items-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-slate-500">Loading order confirmation details...</p>
      </div>
    }>
      <OrderConfirmationContent />
    </Suspense>
  )
}
