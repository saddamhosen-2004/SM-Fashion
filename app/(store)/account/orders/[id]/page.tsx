'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { User, ShoppingBag, ChevronLeft, Calendar, MapPin, CreditCard } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AccountOrderDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [loading, setLoading] = useState(true)
  const [order, setOrder] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    async function loadOrder() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*, product:products(*))')
        .eq('id', id)
        .eq('customer_id', user.id)
        .single()

      if (error) {
        toast.error('Failed to load order details')
      } else {
        setOrder(data)
      }
      setLoading(false)
    }

    if (id) loadOrder()
  }, [id])

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning'
      case 'processing':
        return 'default'
      case 'shipped':
        return 'secondary'
      case 'delivered':
        return 'success'
      case 'cancelled':
        return 'danger'
      default:
        return 'outline'
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 flex justify-center items-center">
        <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center space-y-4">
        <p className="text-slate-500">Order not found.</p>
        <Link href="/account/orders">
          <Button variant="outline">Back to Orders</Button>
        </Link>
      </div>
    )
  }

  const shipping = order.shipping_address

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Navigation Sidebar */}
        <div className="md:col-span-1 space-y-2">
          <Link
            href="/account"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            <User className="h-4 w-4" />
            My Profile
          </Link>
          <Link
            href="/account/orders"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold bg-primary/5 text-primary"
          >
            <ShoppingBag className="h-4 w-4" />
            My Orders
          </Link>
        </div>

        {/* Order Detail Content */}
        <div className="md:col-span-3 space-y-6">
          
          {/* Header Action */}
          <div className="flex items-center gap-2">
            <Link href="/account/orders" className="text-slate-500 hover:text-slate-900 flex items-center gap-1 text-sm">
              <ChevronLeft className="h-4 w-4" /> Back to Orders
            </Link>
          </div>

          <div className="bg-white p-6 rounded-xl border border-border shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
              <div>
                <span className="text-xs text-muted-foreground uppercase font-bold">Order ID</span>
                <h2 className="text-xl font-bold font-mono text-slate-900">
                  #{order.id.substring(0, 8).toUpperCase()}
                </h2>
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <Badge variant={getStatusVariant(order.status)}>
                  {order.status.toUpperCase()}
                </Badge>
                <Badge variant={order.payment_status === 'paid' ? 'success' : 'outline'}>
                  PAYMENT: {order.payment_status.toUpperCase()}
                </Badge>
              </div>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm text-slate-600">
              <div className="flex gap-2.5 items-start">
                <Calendar className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <span className="font-bold text-slate-900 block text-xs uppercase tracking-wider">Date Placed</span>
                  <span>{new Date(order.created_at).toLocaleString()}</span>
                </div>
              </div>

              <div className="flex gap-2.5 items-start">
                <MapPin className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <span className="font-bold text-slate-900 block text-xs uppercase tracking-wider">Shipping Address</span>
                  <p className="text-slate-800 font-medium">{shipping?.name}</p>
                  <p className="text-xs leading-relaxed">{shipping?.address}, {shipping?.district}, {shipping?.division}</p>
                </div>
              </div>

              <div className="flex gap-2.5 items-start">
                <CreditCard className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <span className="font-bold text-slate-900 block text-xs uppercase tracking-wider">Payment Method</span>
                  <span className="uppercase font-semibold text-slate-800">{order.payment_method}</span>
                </div>
              </div>
            </div>

            {/* Order Items Table */}
            <div className="border-t border-border pt-6 space-y-4">
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Ordered Items</h3>
              
              <div className="divide-y divide-slate-100 border border-slate-100 rounded-lg overflow-hidden">
                {order.order_items?.map((item: any, idx: number) => {
                  const product = item.product
                  const primaryImage = product?.images?.find((img: any) => img.is_primary)?.url || 
                                       product?.images?.[0]?.url || 
                                       '/placeholder-product.jpg'

                  return (
                    <div key={item.id || idx} className="flex gap-4 p-4 items-center text-sm">
                      <div className="relative h-12 w-12 rounded border border-slate-100 overflow-hidden shrink-0 bg-slate-50">
                        <img
                          src={primaryImage}
                          alt={product?.name || 'Product'}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-bold text-slate-900 block truncate">{product?.name || 'Deleted Product'}</span>
                        <span className="text-xs text-muted-foreground">
                          Qty: {item.quantity} · Price: ৳{item.unit_price}
                        </span>
                      </div>
                      <span className="font-bold text-slate-900 shrink-0">৳{item.total_price}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Pricing breakdown */}
            <div className="border-t border-slate-100 pt-4 flex flex-col items-end text-sm space-y-2">
              <div className="flex justify-between w-64 text-slate-600">
                <span>Subtotal:</span>
                <span className="font-semibold text-slate-900">৳{order.total_amount - order.shipping_charge}</span>
              </div>
              <div className="flex justify-between w-64 text-slate-600">
                <span>Shipping:</span>
                <span className="font-semibold text-slate-900">৳{order.shipping_charge}</span>
              </div>
              <div className="flex justify-between w-64 font-bold text-slate-950 text-base pt-2 border-t border-slate-100">
                <span>Total Amount:</span>
                <span className="text-primary">৳{order.total_amount}</span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  )
}
