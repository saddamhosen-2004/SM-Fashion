'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { Textarea } from '@/components/ui/Textarea'
import { ChevronLeft, Printer, Calendar, Phone, MapPin, User, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function OrderDetailPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()

  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  // Edit fields
  const [status, setStatus] = useState('')
  const [paymentStatus, setPaymentStatus] = useState('')
  const [notes, setNotes] = useState('')

  const supabase = createClient()
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function loadOrder() {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*, order_items(*, product:products(*))')
          .eq('id', id)
          .single()

        if (error) throw error
        setOrder(data)
        setStatus(data.status)
        setPaymentStatus(data.payment_status)
        setNotes(data.notes || '')
      } catch (error: any) {
        toast.error('Failed to load order info: ' + error.message)
      } finally {
        setLoading(false)
      }
    }

    if (id) loadOrder()
  }, [id])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdating(true)

    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status,
          payment_status: paymentStatus,
          notes: notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (error) throw error
      toast.success('Order updated successfully')
      
      // Update local state
      setOrder({
        ...order,
        status,
        payment_status: paymentStatus,
        notes: notes || null,
      })
    } catch (error: any) {
      toast.error('Failed to update: ' + error.message)
    } finally {
      setUpdating(false)
    }
  }

  const handlePrint = () => {
    window.print()
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

  if (!order) {
    return (
      <div className="bg-red-50 text-red-800 p-6 rounded-lg border border-red-200 text-center">
        Order details not found.
      </div>
    )
  }

  const shipping = order.shipping_address || {}

  const orderStatusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'processing', label: 'Processing' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' },
  ]

  const paymentStatusOptions = [
    { value: 'unpaid', label: 'Unpaid' },
    { value: 'partial', label: 'Partial' },
    { value: 'paid', label: 'Paid' },
  ]

  return (
    <div className="space-y-6">
      
      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-invoice, #printable-invoice * {
            visibility: visible;
          }
          #printable-invoice {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white;
            color: black;
            padding: 20px;
          }
        }
      `}</style>

      <div className="flex items-center justify-between gap-4 print:hidden">
        <Link href="/admin/orders" className="text-slate-500 hover:text-slate-800 flex items-center gap-1 text-sm font-medium">
          <ChevronLeft className="h-4 w-4" /> Back to Orders
        </Link>
        <Button onClick={handlePrint} variant="outline" className="flex items-center gap-2">
          <Printer className="h-4 w-4" /> Print Invoice
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:hidden">
        
        {/* Left Column - Order details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Order ID</span>
                <h3 className="text-xl font-bold font-mono text-slate-900">
                  #{order.id.toUpperCase()}
                </h3>
              </div>
              <div className="flex gap-2">
                <Badge variant={getStatusVariant(order.status)}>
                  {order.status.toUpperCase()}
                </Badge>
                <Badge variant={order.payment_status === 'paid' ? 'success' : 'outline'}>
                  {order.payment_status.toUpperCase()}
                </Badge>
              </div>
            </div>

            {/* Metadata Info Grid */}
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
                  <span className="font-bold text-slate-900 block text-xs uppercase tracking-wider">Shipping Details</span>
                  <p className="text-slate-800 font-semibold">{shipping.name}</p>
                  <p className="text-xs mt-0.5 leading-relaxed">{shipping.address}</p>
                  <p className="text-xs">{shipping.district}, {shipping.division}</p>
                </div>
              </div>

              <div className="flex gap-2.5 items-start">
                <Phone className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <span className="font-bold text-slate-900 block text-xs uppercase tracking-wider">Contact Info</span>
                  <span>{shipping.phone}</span>
                </div>
              </div>
            </div>

            {/* Order Items Table */}
            <div className="border-t border-slate-100 pt-6 space-y-4">
              <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">Items in Order</h4>
              
              <div className="divide-y divide-slate-100 border border-slate-100 rounded-lg overflow-hidden text-sm">
                {order.order_items?.map((item: any, idx: number) => {
                  const product = item.product
                  const image = product?.images?.find((img: any) => img.is_primary)?.url || 
                                product?.images?.[0]?.url || 
                                '/placeholder-product.jpg'

                  return (
                    <div key={item.id || idx} className="flex gap-4 p-4 items-center justify-between">
                      <div className="flex gap-3 items-center min-w-0">
                        <div className="relative h-10 w-10 rounded border border-slate-100 overflow-hidden shrink-0 bg-slate-50">
                          <img
                            src={image}
                            alt={product?.name || 'Product'}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-slate-900 block truncate">{product?.name || 'Deleted Product'}</span>
                          <span className="text-xs text-muted-foreground">Qty: {item.quantity} · Price: ৳{item.unit_price}</span>
                        </div>
                      </div>
                      <span className="font-bold text-slate-900">৳{item.total_price}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Calculations */}
            <div className="border-t border-slate-100 pt-4 flex flex-col items-end text-sm space-y-2">
              <div className="flex justify-between w-64 text-slate-600">
                <span>Subtotal:</span>
                <span className="font-semibold text-slate-900">৳{order.total_amount - order.shipping_charge}</span>
              </div>
              <div className="flex justify-between w-64 text-slate-600">
                <span>Shipping Cost:</span>
                <span className="font-semibold text-slate-900">৳{order.shipping_charge}</span>
              </div>
              <div className="flex justify-between w-64 font-bold text-slate-950 text-base pt-2 border-t border-slate-100">
                <span>Grand Total:</span>
                <span className="text-primary">৳{order.total_amount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Manage Status Panel */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-3">Update Order</h3>

            <form onSubmit={handleUpdate} className="space-y-4">
              <Select
                label="Order Status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                options={orderStatusOptions}
              />

              <Select
                label="Payment Status"
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
                options={paymentStatusOptions}
              />

              <div className="text-sm font-semibold text-slate-700">Payment Method: <span className="uppercase text-slate-800 font-bold">{order.payment_method}</span></div>

              <Textarea
                label="Staff notes / delivery comments"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Verified over phone. Dispatched."
                rows={4}
              />

              <Button type="submit" loading={updating} className="w-full">
                Apply Updates
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Printable Invoice (hidden on web, visible on print) */}
      <div id="printable-invoice" ref={printRef} className="hidden print:block p-8 font-sans max-w-4xl mx-auto">
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-emerald-800">SM FASHION</h1>
            <p className="text-xs text-slate-600 mt-1">Sector 11, Uttara, Dhaka-1230</p>
            <p className="text-xs text-slate-600">Phone: +880 1700-000000 · Email: info@smfashion.com</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold uppercase tracking-wider text-slate-900">INVOICE</h2>
            <p className="text-sm font-mono mt-1">Order: #{order.id.substring(0, 8).toUpperCase()}</p>
            <p className="text-xs text-slate-500">Date: {new Date(order.created_at).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Invoice Info Grid */}
        <div className="grid grid-cols-2 gap-8 my-8 text-xs">
          <div>
            <h4 className="font-extrabold uppercase text-slate-900 mb-2">Customer Details</h4>
            <p className="font-bold text-slate-850">{shipping.name}</p>
            <p className="text-slate-600 mt-0.5">{shipping.address}</p>
            <p className="text-slate-600">{shipping.district}, {shipping.division}</p>
            <p className="text-slate-600 font-bold">Phone: {shipping.phone}</p>
          </div>
          <div className="text-right">
            <h4 className="font-extrabold uppercase text-slate-900 mb-2">Payment Info</h4>
            <p className="text-slate-700">Method: <span className="uppercase font-bold">{order.payment_method}</span></p>
            <p className="text-slate-700">Status: <span className="uppercase font-bold">{order.payment_status}</span></p>
          </div>
        </div>

        {/* Items List */}
        <table className="w-full text-left border-collapse text-xs my-8">
          <thead>
            <tr className="border-b-2 border-slate-900 font-bold text-slate-800">
              <th className="py-2">Item Description</th>
              <th className="py-2 text-center">Unit Price</th>
              <th className="py-2 text-center">Qty</th>
              <th className="py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {order.order_items?.map((item: any, idx: number) => (
              <tr key={idx}>
                <td className="py-3 font-semibold text-slate-850">{item.product?.name || 'Product'}</td>
                <td className="py-3 text-center">৳{item.unit_price}</td>
                <td className="py-3 text-center">{item.quantity}</td>
                <td className="py-3 text-right font-bold">৳{item.total_price}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Total Calculations */}
        <div className="flex flex-col items-end text-xs space-y-1.5 border-t border-slate-300 pt-4">
          <div className="flex justify-between w-64 text-slate-650">
            <span>Subtotal:</span>
            <span className="font-semibold text-slate-900">৳{order.total_amount - order.shipping_charge}</span>
          </div>
          <div className="flex justify-between w-64 text-slate-650">
            <span>Shipping Charge:</span>
            <span className="font-semibold text-slate-900">৳{order.shipping_charge}</span>
          </div>
          <div className="flex justify-between w-64 font-bold text-slate-950 text-sm pt-2 border-t-2 border-slate-900">
            <span>Total Amount:</span>
            <span>৳{order.total_amount}</span>
          </div>
        </div>

        {/* Invoice Footer */}
        <div className="mt-16 text-center text-[10px] text-slate-400 border-t border-slate-100 pt-6">
          <p>Thank you for shopping with SM Fashion! For returns, contact support within 7 days.</p>
        </div>
      </div>
    </div>
  )
}
