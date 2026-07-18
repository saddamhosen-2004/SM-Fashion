'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Product, InventoryLog } from '@/types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { Archive, Plus, History, Search, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterState, setFilterState] = useState('all') // all, low, out

  // Form fields
  const [isAdjustOpen, setIsAdjustOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [selectedProductId, setSelectedProductId] = useState('')
  const [quantityInput, setQuantityInput] = useState('')
  const [adjustmentType, setAdjustmentType] = useState<'in' | 'out'>('in')
  const [reason, setReason] = useState('Physical count correction')

  const supabase = createClient()

  useEffect(() => {
    fetchInventoryData()
  }, [])

  const fetchInventoryData = async () => {
    setLoading(true)
    try {
      // 1. Fetch products
      const { data: prods, error: prodError } = await supabase
        .from('products')
        .select('*, category:categories(name)')
        .order('name')
      if (prodError) throw prodError
      setProducts(prods || [])

      if (prods && prods.length > 0 && !selectedProductId) {
        setSelectedProductId(prods[0].id)
      }

      // 2. Fetch inventory logs
      const { data: movements, error: logError } = await supabase
        .from('inventory')
        .select('*, product:products(name, sku)')
        .order('created_at', { ascending: false })
      if (logError) throw logError
      setLogs(movements || [])
    } catch (error: any) {
      toast.error('Failed to load inventory data: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault()
    const qty = parseInt(quantityInput)
    if (isNaN(qty) || qty <= 0) {
      toast.error('Please enter a valid positive quantity')
      return
    }

    setSubmitting(true)
    try {
      const targetProduct = products.find(p => p.id === selectedProductId)
      if (!targetProduct) throw new Error('Product not found')

      const netQuantity = adjustmentType === 'in' ? qty : -qty
      const newStock = targetProduct.stock_quantity + netQuantity

      if (newStock < 0) {
        throw new Error('Stock quantity cannot be adjusted below zero')
      }

      // 1. Update product stock level
      const { error: prodError } = await supabase
        .from('products')
        .update({ stock_quantity: newStock })
        .eq('id', selectedProductId)

      if (prodError) throw prodError

      // 2. Write inventory log entry
      const { error: logError } = await supabase
        .from('inventory')
        .insert([
          {
            product_id: selectedProductId,
            quantity: netQuantity,
            type: adjustmentType === 'in' ? 'in' : 'out',
            reason: reason || 'Manual adjustment',
          }
        ])

      if (logError) throw logError

      toast.success('Stock adjusted successfully!')
      setQuantityInput('')
      setIsAdjustOpen(false)
      fetchInventoryData()
    } catch (error: any) {
      toast.error(error.message || 'Failed to adjust stock')
    } finally {
      setSubmitting(false)
    }
  }

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()))

    const isLow = p.stock_quantity > 0 && p.stock_quantity <= p.low_stock_threshold
    const isOut = p.stock_quantity <= 0

    if (filterState === 'low') return matchesSearch && isLow
    if (filterState === 'out') return matchesSearch && isOut
    return matchesSearch
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Inventory Control</h2>
          <p className="text-sm text-muted-foreground">Adjust stock levels, set stock alarms, and view physical count history logs.</p>
        </div>
        <Button onClick={() => setIsAdjustOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Adjust Stock
        </Button>
      </div>

      {/* Grid: Stock Levels & Movement Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Product Stock Levels list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
            <div className="relative flex-1 max-w-xs">
              <Input
                placeholder="Search catalog..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-9"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            </div>

            <div className="flex gap-1 border border-slate-200 rounded-lg p-0.5 bg-slate-50">
              <button
                onClick={() => setFilterState('all')}
                className={`text-xs px-2.5 py-1.5 rounded font-bold transition-colors ${filterState === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                All
              </button>
              <button
                onClick={() => setFilterState('low')}
                className={`text-xs px-2.5 py-1.5 rounded font-bold transition-colors ${filterState === 'low' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Low Stock
              </button>
              <button
                onClick={() => setFilterState('out')}
                className={`text-xs px-2.5 py-1.5 rounded font-bold transition-colors ${filterState === 'out' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Out of Stock
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-12 text-center text-slate-500">No products match current filters.</div>
            ) : (
              <div className="overflow-x-auto text-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
                      <th className="p-4">Product Details</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Current Stock</th>
                      <th className="p-4">Low Threshold</th>
                      <th className="p-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredProducts.map((p) => {
                      const isOut = p.stock_quantity <= 0
                      const isLow = p.stock_quantity > 0 && p.stock_quantity <= p.low_stock_threshold
                      return (
                        <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4">
                            <span className="font-bold text-slate-900 block">{p.name}</span>
                            <span className="text-xs text-muted-foreground">SKU: {p.sku || 'N/A'}</span>
                          </td>
                          <td className="p-4 text-slate-600">{(p as any).category?.name || '-'}</td>
                          <td className="p-4 font-bold text-slate-850">
                            {p.stock_quantity} {p.unit}s
                          </td>
                          <td className="p-4 text-slate-500">{p.low_stock_threshold} {p.unit}s</td>
                          <td className="p-4">
                            <Badge variant={isOut ? 'danger' : isLow ? 'warning' : 'success'}>
                              {isOut ? 'OUT OF STOCK' : isLow ? 'LOW STOCK' : 'OK'}
                            </Badge>
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

        {/* Right Side: Stock Movement History Logs */}
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <History className="h-4 w-4 text-slate-500" />
            <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Stock Movement Logs</h4>
          </div>

          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">No stock movements recorded yet.</div>
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
              {logs.map((log) => {
                const isAddition = log.quantity > 0
                return (
                  <div key={log.id} className="text-xs border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                    <div className="flex justify-between items-baseline gap-2">
                      <span className="font-bold text-slate-800 line-clamp-1">{log.product?.name || 'Deleted Product'}</span>
                      <span className={`font-bold shrink-0 ${isAddition ? 'text-green-600' : 'text-red-600'}`}>
                        {isAddition ? '+' : ''}{log.quantity}
                      </span>
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                      <span>Reason: {log.reason}</span>
                      <span>{new Date(log.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Adjust Stock Dialog Modal */}
      {isAdjustOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-lg max-w-md w-full space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="text-lg font-bold text-slate-900">Adjust Inventory</h3>
              <button onClick={() => setIsAdjustOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleAdjustStock} className="space-y-4">
              <Select
                label="Select Product"
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                options={products.map((p) => ({ value: p.id, label: `${p.name} (Current: ${p.stock_quantity})` }))}
              />

              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Adjustment Type"
                  value={adjustmentType}
                  onChange={(e) => setAdjustmentType(e.target.value as 'in' | 'out')}
                  options={[
                    { value: 'in', label: 'Restock / Stock In (+)' },
                    { value: 'out', label: 'Reduce / Damage (-)' },
                  ]}
                />
                <Input
                  label="Quantity"
                  type="number"
                  min="1"
                  value={quantityInput}
                  onChange={(e) => setQuantityInput(e.target.value)}
                  placeholder="e.g. 10"
                  required
                />
              </div>

              <Input
                label="Reason / Remarks"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Supplier delivery, damage count"
                required
              />

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setIsAdjustOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" loading={submitting}>
                  Apply Adjustment
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
