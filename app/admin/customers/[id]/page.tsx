'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ChevronLeft, Calendar, Phone, MapPin, ShoppingBag, Ban, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function CustomerDetailPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()

  const [customer, setCustomer] = useState<any>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    async function loadCustomerData() {
      try {
        // 1. Fetch profile
        const { data: prof, error: profError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', id)
          .single()
        if (profError) throw profError
        setCustomer(prof)

        // 2. Fetch customer orders
        const { data: ords, error: ordError } = await supabase
          .from('orders')
          .select('*')
          .eq('customer_id', id)
          .order('created_at', { ascending: false })
        if (ordError) throw ordError
        setOrders(ords || [])

      } catch (error: any) {
        toast.error('Failed to load customer details: ' + error.message)
      } finally {
        setLoading(false)
      }
    }

    if (id) loadCustomerData()
  }, [id])

  const toggleBan = async () => {
    const actionStr = customer.is_banned ? 'unban' : 'ban'
    if (!confirm(`Are you sure you want to ${actionStr} this customer?`)) return

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_banned: !customer.is_banned })
        .eq('id', customer.id)

      if (error) throw error
      toast.success(`Customer ${actionStr}ned successfully!`)
      setCustomer({ ...customer, is_banned: !customer.is_banned })
    } catch (error: any) {
      toast.error('Failed to update customer status: ' + error.message)
    }
  }

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
      <div className="flex h-64 items-center justify-center bg-white rounded-lg border border-slate-200">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="bg-red-50 text-red-800 p-6 rounded-lg border border-red-200 text-center">
        Customer record not found.
      </div>
    )
  }

  const totalSpend = orders.reduce((sum, o) => sum + o.total_amount, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Link href="/admin/customers" className="text-slate-500 hover:text-slate-800 flex items-center gap-1 text-sm font-medium">
          <ChevronLeft className="h-4 w-4" /> Back to Customers
        </Link>
        <Button
          onClick={toggleBan}
          variant={customer.is_banned ? 'outline' : 'danger'}
          className="flex items-center gap-2"
        >
          <Ban className="h-4 w-4" />
          {customer.is_banned ? 'Unban Customer' : 'Ban Customer'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: profile details card */}
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-6 h-fit">
          <div className="border-b border-slate-100 pb-4 text-center">
            <div className="h-16 w-16 bg-primary/10 text-primary font-black text-xl flex items-center justify-center rounded-full mx-auto border-2 border-primary/20 shadow-sm">
              {customer.full_name ? customer.full_name[0].toUpperCase() : 'U'}
            </div>
            <h3 className="text-lg font-bold text-slate-900 mt-3">{customer.full_name || 'Guest User'}</h3>
            <span className="text-xs text-muted-foreground uppercase">{customer.role}</span>
          </div>

          <div className="space-y-4 text-sm text-slate-700">
            <div className="flex gap-2.5 items-start">
              <Phone className="h-5 w-5 text-primary shrink-0" />
              <div>
                <span className="font-bold text-slate-900 block text-xs uppercase tracking-wider">Phone</span>
                <span>{customer.phone || 'N/A'}</span>
              </div>
            </div>

            <div className="flex gap-2.5 items-start">
              <MapPin className="h-5 w-5 text-primary shrink-0" />
              <div>
                <span className="font-bold text-slate-900 block text-xs uppercase tracking-wider">Default Shipping Address</span>
                <span className="text-xs leading-relaxed">{customer.address || 'No address logged'}</span>
              </div>
            </div>

            <div className="flex gap-2.5 items-start">
              <Calendar className="h-5 w-5 text-primary shrink-0" />
              <div>
                <span className="font-bold text-slate-900 block text-xs uppercase tracking-wider">Account Created</span>
                <span>{new Date(customer.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="flex gap-2.5 items-start border-t border-slate-100 pt-4">
              <ShoppingBag className="h-5 w-5 text-primary shrink-0" />
              <div>
                <span className="font-bold text-slate-900 block text-xs uppercase tracking-wider">Purchase Summary</span>
                <p className="font-medium text-slate-800">Total Spend: <span className="font-bold text-primary">৳{totalSpend}</span></p>
                <p className="text-xs text-slate-500">{orders.length} orders placed</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Customer Orders history table */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
          <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wider border-b border-slate-100 pb-2">
            Purchase Order History
          </h4>

          {orders.length === 0 ? (
            <div className="text-center py-12 text-slate-500">No orders placed by this customer.</div>
          ) : (
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
                    <th className="py-2.5 px-3">Order ID</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Total Amount</th>
                    <th className="py-2.5 px-3">Payment Method</th>
                    <th className="py-2.5 px-3">Order Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-55/50">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                        #{o.id.substring(0, 8).toUpperCase()}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">{new Date(o.created_at).toLocaleDateString()}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-950">৳{o.total_amount}</td>
                      <td className="py-2.5 px-3 uppercase font-medium text-slate-750">{o.payment_method}</td>
                      <td className="py-2.5 px-3">
                        <Badge variant={getStatusVariant(o.status)}>
                          {o.status}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <Link href={`/admin/orders/${o.id}`}>
                          <Button variant="ghost" size="sm" className="h-7 text-primary text-[10px] font-bold">
                            View Order
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
