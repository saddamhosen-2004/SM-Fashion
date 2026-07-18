'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { User, ShoppingBag, Eye } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AccountOrdersPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    async function loadOrders() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login?redirectTo=/account/orders')
        return
      }

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        toast.error('Failed to load orders')
      } else {
        setOrders(data || [])
      }
      setLoading(false)
    }

    loadOrders()
  }, [])

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

        {/* Orders Content */}
        <div className="md:col-span-3 bg-white p-6 rounded-xl border border-border shadow-sm space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Order History</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Track shipping statuses and view order breakdowns.</p>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-lg p-6">
              <ShoppingBag className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500 text-sm mb-4">You have not placed any orders yet.</p>
              <Link href="/products">
                <Button variant="outline" size="sm">Shop Products</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-100 rounded-lg">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
                    <th className="p-4">Order ID</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Total</th>
                    <th className="p-4">Method</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-mono font-bold text-slate-900">
                        #{order.id.substring(0, 8).toUpperCase()}
                      </td>
                      <td className="p-4 text-slate-500">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-4 font-semibold text-slate-950">৳{order.total_amount}</td>
                      <td className="p-4 text-slate-600 uppercase text-xs">{order.payment_method}</td>
                      <td className="p-4">
                        <Badge variant={getStatusVariant(order.status)}>
                          {order.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                        <Link href={`/account/orders/${order.id}`}>
                          <Button variant="ghost" size="sm" className="flex items-center gap-1.5 ml-auto text-primary">
                            <Eye className="h-4 w-4" /> View
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
