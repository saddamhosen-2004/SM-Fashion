'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, Loader2, Eye, Filter } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Order } from '@/types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import toast from 'react-hot-toast'

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')

  const supabase = createClient()

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, customer:profiles(*)')
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrders(data || [])
    } catch (error: any) {
      toast.error('Failed to load orders: ' + error.message)
    } finally {
      setLoading(false)
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

  const filteredOrders = orders.filter((order) => {
    const shipping = order.shipping_address as any
    const matchesSearch =
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (shipping?.name && shipping.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (shipping?.phone && shipping.phone.includes(searchTerm))

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    const matchesPayment = paymentFilter === 'all' || order.payment_status === paymentFilter

    return matchesSearch && matchesStatus && matchesPayment
  })

  const statusOptions = [
    { value: 'all', label: 'All Order Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'processing', label: 'Processing' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' },
  ]

  const paymentOptions = [
    { value: 'all', label: 'All Payment Statuses' },
    { value: 'unpaid', label: 'Unpaid' },
    { value: 'paid', label: 'Paid' },
    { value: 'partial', label: 'Partial' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Order Management</h2>
          <p className="text-sm text-muted-foreground">Manage and track delivery statuses, invoices, and payment verifications.</p>
        </div>
      </div>

      {/* Filters toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
        <div className="relative">
          <Input
            placeholder="Search by ID, name, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        </div>

        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={statusOptions}
        />

        <Select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          options={paymentOptions}
        />
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-center p-6">
            <p className="text-slate-500">No orders found matching filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
                  <th className="p-4">Order ID</th>
                  <th className="p-4">Customer Info</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Method</th>
                  <th className="p-4">Total Amount</th>
                  <th className="p-4">Payment Status</th>
                  <th className="p-4">Order Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((order) => {
                  const shipping = order.shipping_address as any
                  return (
                    <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-mono font-bold text-slate-900">
                        #{order.id.substring(0, 8).toUpperCase()}
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-slate-900">{shipping?.name || 'Guest'}</div>
                        <div className="text-xs text-muted-foreground">{shipping?.phone}</div>
                      </td>
                      <td className="p-4 text-slate-500">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-slate-600 uppercase text-xs font-bold">{order.payment_method}</td>
                      <td className="p-4 font-semibold text-slate-900">৳{order.total_amount}</td>
                      <td className="p-4">
                        <Badge variant={order.payment_status === 'paid' ? 'success' : 'outline'}>
                          {order.payment_status}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Badge variant={getStatusVariant(order.status)}>
                          {order.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                        <Link href={`/admin/orders/${order.id}`}>
                          <Button variant="ghost" size="sm" className="flex items-center gap-1.5 ml-auto text-primary">
                            <Eye className="h-4 w-4" /> Manage
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
