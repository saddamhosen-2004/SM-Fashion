'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Product, Supplier } from '@/types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Trash2, Plus, ArrowLeft, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface PurchaseLineItem {
  productId: string
  quantity: number
  costPerUnit: number
}

export default function NewPurchasePage() {
  const router = useRouter()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Fields
  const [supplierId, setSupplierId] = useState('')
  const [invoiceNo, setInvoiceNo] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [note, setNote] = useState('')
  const [paidAmount, setPaidAmount] = useState('0')

  // Dynamic items list
  const [itemsList, setItemsList] = useState<PurchaseLineItem[]>([
    { productId: '', quantity: 1, costPerUnit: 0 },
  ])

  const supabase = createClient()

  useEffect(() => {
    async function loadData() {
      try {
        // Fetch suppliers
        const { data: sups, error: supError } = await supabase
          .from('suppliers')
          .select('*')
          .order('name')
        if (supError) throw supError
        setSuppliers(sups || [])
        if (sups && sups.length > 0) setSupplierId(sups[0].id)

        // Fetch active products
        const { data: prods, error: prodError } = await supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .order('name')
        if (prodError) throw prodError
        setProducts(prods || [])
        if (prods && prods.length > 0) {
          setItemsList([{ productId: prods[0].id, quantity: 1, costPerUnit: prods[0].cost_price || 0 }])
        }
      } catch (error: any) {
        toast.error('Failed to load form data: ' + error.message)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const handleAddItemRow = () => {
    if (products.length === 0) return
    setItemsList([
      ...itemsList,
      { productId: products[0].id, quantity: 1, costPerUnit: products[0].cost_price || 0 },
    ])
  }

  const handleRemoveItemRow = (index: number) => {
    if (itemsList.length === 1) return
    setItemsList(itemsList.filter((_, i) => i !== index))
  }

  const handleItemChange = (index: number, field: keyof PurchaseLineItem, value: any) => {
    const updated = [...itemsList]
    if (field === 'productId') {
      updated[index].productId = value
      // Auto-set the unit cost based on product defaults
      const prod = products.find((p) => p.id === value)
      if (prod) {
        updated[index].costPerUnit = prod.cost_price || 0
      }
    } else if (field === 'quantity') {
      updated[index].quantity = parseInt(value) || 0
    } else if (field === 'costPerUnit') {
      updated[index].costPerUnit = parseFloat(value) || 0
    }
    setItemsList(updated)
  }

  // Calculate totals
  const getSubtotal = () => {
    return itemsList.reduce((sum, item) => sum + item.quantity * item.costPerUnit, 0)
  }

  const getDueAmount = () => {
    const paid = parseFloat(paidAmount) || 0
    return Math.max(0, getSubtotal() - paid)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!supplierId || itemsList.some((item) => !item.productId || item.quantity <= 0 || item.costPerUnit <= 0)) {
      toast.error('Please select a supplier and add valid products with cost and quantity')
      return
    }

    setSubmitting(true)
    try {
      const totalAmount = getSubtotal()
      const paidAmt = parseFloat(paidAmount) || 0
      const dueAmt = getDueAmount()

      // 1. Insert Purchase
      const { data: purchase, error: purchaseError } = await supabase
        .from('purchases')
        .insert([
          {
            supplier_id: supplierId,
            total_amount: totalAmount,
            paid_amount: paidAmt,
            due_amount: dueAmt,
            invoice_no: invoiceNo || null,
            date,
            note: note || null,
          },
        ])
        .select()
        .single()

      if (purchaseError) throw purchaseError

      // 2. Insert Purchase Items & update Stock
      for (const item of itemsList) {
        // Insert purchase item
        const { error: itemError } = await supabase
          .from('purchase_items')
          .insert([
            {
              purchase_id: purchase.id,
              product_id: item.productId,
              quantity: item.quantity,
              cost_per_unit: item.costPerUnit,
              total_cost: item.quantity * item.costPerUnit,
            },
          ])
        if (itemError) throw itemError

        // Get current product stock
        const currentProd = products.find((p) => p.id === item.productId)
        if (currentProd) {
          const newStock = currentProd.stock_quantity + item.quantity
          
          // Update product stock level and cost price (moving average or latest cost)
          const { error: stockError } = await supabase
            .from('products')
            .update({
              stock_quantity: newStock,
              cost_price: item.costPerUnit // Update latest cost price
            })
            .eq('id', item.productId)

          if (stockError) throw stockError

          // Log stock entry
          await supabase.from('inventory').insert([
            {
              product_id: item.productId,
              quantity: item.quantity,
              type: 'in',
              reason: `Supplier purchase invoice #${invoiceNo || purchase.id.substring(0, 8)}`,
            },
          ])
        }
      }

      toast.success('Supplier purchase logged successfully!')
      router.push('/admin/purchases')
      router.refresh()
    } catch (error: any) {
      toast.error('Error recording purchase: ' + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center bg-white rounded-lg border border-slate-200">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.push('/admin/purchases')} className="text-slate-500 hover:text-slate-800">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Record Supplier Purchase</h2>
          <p className="text-sm text-muted-foreground">Log bulk stock-in purchases, unit costs, and payables.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Purchase Form lines */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-2">Purchase Dockets</h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Select
                label="Supplier / Vendor"
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                options={suppliers.map((s) => ({ value: s.id, label: s.name }))}
                required
              />

              <Input
                label="Invoice Number"
                value={invoiceNo}
                onChange={(e) => setInvoiceNo(e.target.value)}
                placeholder="e.g. INV-2026-001"
              />

              <Input
                label="Purchase Date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Dynamic Item list lines */}
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-lg font-semibold text-slate-900">Purchase Item Details</h3>
              <Button type="button" variant="outline" size="sm" onClick={handleAddItemRow} className="flex items-center gap-1">
                <Plus className="h-4 w-4" /> Add Row
              </Button>
            </div>

            <div className="space-y-3">
              {itemsList.map((item, index) => (
                <div key={index} className="flex flex-col sm:flex-row gap-3 items-end border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                  <div className="flex-1 w-full">
                    <Select
                      label={index === 0 ? "Product" : ""}
                      value={item.productId}
                      onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                      options={products.map((p) => ({ value: p.id, label: p.name }))}
                    />
                  </div>

                  <div className="w-full sm:w-28">
                    <Input
                      label={index === 0 ? "Quantity" : ""}
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      required
                    />
                  </div>

                  <div className="w-full sm:w-32">
                    <Input
                      label={index === 0 ? "Cost / Unit (৳)" : ""}
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={item.costPerUnit}
                      onChange={(e) => handleItemChange(index, 'costPerUnit', e.target.value)}
                      required
                    />
                  </div>

                  <div className="w-full sm:w-24 text-right pr-2 pb-3 font-semibold text-slate-800 text-sm">
                    ৳{item.quantity * item.costPerUnit}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveItemRow(index)}
                    disabled={itemsList.length === 1}
                    className="p-2 text-slate-400 hover:text-red-650 rounded-lg hover:bg-red-50 disabled:opacity-30 mb-1"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Pricing & Submit */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-3">Dues & Settlement</h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal Invoice:</span>
                <span className="font-semibold text-slate-900">৳{getSubtotal()}</span>
              </div>
              <Input
                label="Amount Paid Now (৳)"
                type="number"
                min="0"
                step="0.01"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
              />
              <div className="flex justify-between text-slate-950 font-bold border-t border-slate-100 pt-3 text-base">
                <span>Outstanding Dues:</span>
                <span className="text-red-650">৳{getDueAmount()}</span>
              </div>
            </div>

            <Textarea
              label="Purchase notes / invoice details"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Paid via bank check, delivery pending."
              rows={3}
            />

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => router.push('/admin/purchases')} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" loading={submitting} className="flex-1">
                Save Invoice
              </Button>
            </div>
          </div>
        </div>

      </form>
    </div>
  )
}
