'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Loader2, TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ProfitLossPage() {
  const [loading, setLoading] = useState(true)

  // Filters
  const [startDate, setStartDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30) // last 30 days default
    return d.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0])

  // Data aggregations
  const [revenue, setRevenue] = useState(0)
  const [cogs, setCogs] = useState(0)
  const [expenses, setExpenses] = useState(0)
  const [purchases, setPurchases] = useState(0)

  const supabase = createClient()

  useEffect(() => {
    fetchPLData()
  }, [startDate, endDate])

  const fetchPLData = async () => {
    setLoading(true)
    try {
      // 1. Fetch Revenue: sum of all paid orders in range (PRD: Sum of all paid order amounts)
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*, order_items(*, product:products(cost_price))')
        .eq('payment_status', 'paid')
        .neq('status', 'cancelled')
        .gte('created_at', `${startDate}T00:00:00Z`)
        .lte('created_at', `${endDate}T23:59:59Z`)
      if (ordersError) throw ordersError

      const totalRevenue = (orders || []).reduce((sum, o) => sum + o.total_amount, 0)
      setRevenue(totalRevenue)

      // 2. Fetch COGS: sum(product.cost_price * order_items.quantity)
      let totalCogs = 0
      orders?.forEach((o) => {
        o.order_items?.forEach((item: any) => {
          const cost = item.product?.cost_price || 0
          totalCogs += cost * item.quantity
        })
      })
      setCogs(totalCogs)

      // 3. Fetch Expenses: sum(expenses.amount) in range
      const { data: expData, error: expError } = await supabase
        .from('expenses')
        .select('amount')
        .gte('date', startDate)
        .lte('date', endDate)
      if (expError) throw expError

      const totalExpenses = (expData || []).reduce((sum, e) => sum + e.amount, 0)
      setExpenses(totalExpenses)

      // 4. Fetch Purchases: sum(purchases.total_amount) in range
      const { data: purData, error: purError } = await supabase
        .from('purchases')
        .select('total_amount')
        .gte('date', startDate)
        .lte('date', endDate)
      if (purError) throw purError

      const totalPurchases = (purData || []).reduce((sum, p) => sum + p.total_amount, 0)
      setPurchases(totalPurchases)

    } catch (error: any) {
      toast.error('Failed to load P&L statement: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const netProfit = revenue - cogs - expenses - purchases
  const isProfit = netProfit >= 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Profit & Loss Statement (P&L)</h2>
          <p className="text-sm text-muted-foreground">Monitor real-time net profits, Cost of Goods Sold (COGS), and operating expense ratios.</p>
        </div>
      </div>

      {/* Date selector toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm max-w-xl">
        <Input
          label="Start Date"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <Input
          label="End Date"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Detailed Statement Table */}
          <div className="lg:col-span-2 bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-6">
            <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider border-b border-slate-100 pb-2">
              Income Statement Summary
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-1 text-slate-700">
                <span>Total Revenue (Paid Orders)</span>
                <span className="font-bold text-slate-900">৳{revenue}</span>
              </div>
              
              <div className="flex justify-between py-1 text-red-650">
                <span>(-) Cost of Goods Sold (COGS)</span>
                <span className="font-bold">৳{cogs}</span>
              </div>

              <div className="flex justify-between py-1 text-red-650">
                <span>(-) Operational Expenses</span>
                <span className="font-bold">৳{expenses}</span>
              </div>

              <div className="flex justify-between py-1 text-red-650">
                <span>(-) Stock Purchases</span>
                <span className="font-bold">৳{purchases}</span>
              </div>

              <div className={`flex justify-between border-t border-slate-200 mt-4 pt-4 text-base font-black ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                <span>Net {isProfit ? 'Profit' : 'Loss'}</span>
                <span>৳{netProfit}</span>
              </div>
            </div>
          </div>

          {/* Performance Overview (Right Column card) */}
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between min-h-[250px]">
            <div className="space-y-4">
              <h3 className="font-extrabold text-slate-950 text-xs uppercase tracking-wider">Performance Status</h3>
              <div className="flex items-center gap-3">
                <div className={`h-12 w-12 rounded-full flex items-center justify-center ${isProfit ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                  {isProfit ? <TrendingUp className="h-6 w-6" /> : <TrendingDown className="h-6 w-6" />}
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Net Outcome</span>
                  <Badge variant={isProfit ? 'success' : 'danger'} className="text-xs font-bold uppercase">
                    {isProfit ? 'PROFITABLE' : 'LOSS'}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-500 leading-relaxed border-t border-slate-100 pt-4 mt-6">
              Net income is calculated as gross paid sales minus Cost of Goods Sold (estimated at current item unit cost) minus business expenses and purchases in the selected date range.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
