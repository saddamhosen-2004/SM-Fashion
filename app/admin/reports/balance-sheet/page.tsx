'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Loader2, Shield, DollarSign } from 'lucide-react'
import toast from 'react-hot-toast'

export default function BalanceSheetPage() {
  const [loading, setLoading] = useState(true)

  // Manual cash in hand input (saved to localStorage for persistence)
  const [cashInHand, setCashInHand] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sm_balance_cash') || '50000'
    }
    return '50000'
  })

  // Balance sheet accounts
  const [receivables, setReceivables] = useState(0) // Unpaid order amounts
  const [payables, setPayables] = useState(0) // Supplier purchase dues
  const [inventoryValue, setInventoryValue] = useState(0) // Current product stock * cost price

  const supabase = createClient()

  useEffect(() => {
    fetchBalanceData()
  }, [])

  const fetchBalanceData = async () => {
    setLoading(true)
    try {
      // 1. Fetch Receivables: orders that are unpaid or partial
      const { data: orders, error: orderError } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('payment_status', 'unpaid')
        .neq('status', 'cancelled')
      if (orderError) throw orderError
      const totalRec = (orders || []).reduce((sum, o) => sum + o.total_amount, 0)
      setReceivables(totalRec)

      // 2. Fetch Payables: supplier purchase outstanding dues
      const { data: purchases, error: purError } = await supabase
        .from('purchases')
        .select('due_amount')
      if (purError) throw purError
      const totalPay = (purchases || []).reduce((sum, p) => sum + p.due_amount, 0)
      setPayables(totalPay)

      // 3. Fetch Inventory Value: sum(cost_price * stock_quantity) of active products
      const { data: products, error: prodError } = await supabase
        .from('products')
        .select('cost_price, stock_quantity')
        .eq('is_active', true)
      if (prodError) throw prodError
      const totalInvVal = (products || []).reduce((sum, p) => sum + p.cost_price * p.stock_quantity, 0)
      setInventoryValue(totalInvVal)

    } catch (error: any) {
      toast.error('Failed to load balance details: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveCash = () => {
    localStorage.setItem('sm_balance_cash', cashInHand)
    toast.success('Cash in hand balance updated')
  }

  const cash = parseFloat(cashInHand) || 0
  const totalAssets = cash + receivables + inventoryValue
  const totalLiabilities = payables
  const netWorth = totalAssets - totalLiabilities

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Balance Sheet Summary</h2>
          <p className="text-sm text-muted-foreground">Monitor company assets (cash, receivables, stock values) and liabilities (supplier dues).</p>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Assets Column */}
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-6">
            <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider border-b border-slate-100 pb-2 text-emerald-800">
              Current Assets
            </h3>
            
            <div className="space-y-4">
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <Input
                    label="Cash In Hand / Bank (৳)"
                    type="number"
                    value={cashInHand}
                    onChange={(e) => setCashInHand(e.target.value)}
                  />
                </div>
                <Button type="button" onClick={handleSaveCash} variant="outline" className="mb-0.5">
                  Save
                </Button>
              </div>

              <div className="flex justify-between text-sm text-slate-700 py-1 border-b border-slate-50">
                <span>Account Receivables (Unpaid Orders)</span>
                <span className="font-bold text-slate-900">৳{receivables}</span>
              </div>

              <div className="flex justify-between text-sm text-slate-700 py-1 border-b border-slate-50">
                <span>Current Inventory Value (at Cost)</span>
                <span className="font-bold text-slate-900">৳{inventoryValue}</span>
              </div>

              <div className="flex justify-between text-base font-black text-slate-950 border-t border-slate-100 pt-4">
                <span>Total Assets</span>
                <span className="text-emerald-800">৳{totalAssets}</span>
              </div>
            </div>
          </div>

          {/* Liabilities Column */}
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-6">
            <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider border-b border-slate-100 pb-2 text-red-800">
              Liabilities
            </h3>

            <div className="space-y-4 min-h-[170px]">
              <div className="flex justify-between text-sm text-slate-700 py-1 border-b border-slate-50">
                <span>Account Payables (Supplier Dues)</span>
                <span className="font-bold text-slate-900">৳{payables}</span>
              </div>

              <div className="flex justify-between text-base font-black text-slate-950 border-t border-slate-100 pt-4 mt-auto">
                <span>Total Liabilities</span>
                <span className="text-red-800">৳{totalLiabilities}</span>
              </div>
            </div>
          </div>

          {/* Net Worth Summary Column */}
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between min-h-[250px]">
            <div className="space-y-4">
              <h3 className="font-extrabold text-slate-950 text-xs uppercase tracking-wider">Equity Summary</h3>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-800 flex items-center justify-center">
                  <Shield className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Net Working Capital</span>
                  <span className="text-xl font-black text-slate-900">৳{netWorth}</span>
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-500 leading-relaxed border-t border-slate-100 pt-4 mt-6">
              Working capital represents company equity (Total Assets minus Total Liabilities). Keeping cash balance records up-to-date helps preserve calculation integrity.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
