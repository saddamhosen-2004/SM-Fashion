'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { BarChart3, Calendar, FileText, Download, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SalesReportPage() {
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<any[]>([])

  // Filters
  const [startDate, setStartDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30) // last 30 days default
    return d.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0])

  const supabase = createClient()

  useEffect(() => {
    fetchReportData()
  }, [startDate, endDate])

  const fetchReportData = async () => {
    setLoading(true)
    try {
      // Query order items + product + category info inside date range
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*, product:products(*, category:categories(name)))')
        .gte('created_at', `${startDate}T00:00:00Z`)
        .lte('created_at', `${endDate}T23:59:59Z`)
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrders(data || [])
    } catch (error: any) {
      toast.error('Failed to load sales data: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // Aggregate stats
  const totalSales = orders.reduce((sum, o) => sum + o.total_amount, 0)
  const totalOrders = orders.length
  const avgOrderValue = totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0

  // Group by Product
  const productSalesMap: Record<string, { name: string; sku: string; qty: number; total: number }> = {}
  // Group by Category
  const categorySalesMap: Record<string, { name: string; total: number }> = {}

  orders.forEach((order) => {
    order.order_items?.forEach((item: any) => {
      const prod = item.product
      if (prod) {
        // Product grouping
        if (!productSalesMap[prod.id]) {
          productSalesMap[prod.id] = { name: prod.name, sku: prod.sku || 'N/A', qty: 0, total: 0 }
        }
        productSalesMap[prod.id].qty += item.quantity
        productSalesMap[prod.id].total += item.total_price

        // Category grouping
        const catName = prod.category?.name || 'Uncategorized'
        if (!categorySalesMap[catName]) {
          categorySalesMap[catName] = { name: catName, total: 0 }
        }
        categorySalesMap[catName].total += item.total_price
      }
    })
  })

  const topProducts = Object.values(productSalesMap).sort((a, b) => b.total - a.total).slice(0, 8)
  const categorySales = Object.values(categorySalesMap).sort((a, b) => b.total - a.total)

  // Export to CSV helper
  const handleExportCSV = () => {
    if (orders.length === 0) {
      toast.error('No data available to export')
      return
    }

    const headers = ['Order ID', 'Date', 'Customer Name', 'Phone', 'Payment Method', 'Payment Status', 'Status', 'Shipping Charge', 'Total Amount']
    const rows = orders.map((o) => {
      const shipping = o.shipping_address || {}
      return [
        o.id,
        new Date(o.created_at).toLocaleDateString(),
        shipping.name || 'Guest',
        shipping.phone || '',
        o.payment_method,
        o.payment_status,
        o.status,
        o.shipping_charge,
        o.total_amount
      ]
    })

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map(val => `"${val}"`).join(','))].join('\n')
    
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `sales_report_${startDate}_to_${endDate}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('CSV exported successfully')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Sales & Item Reports</h2>
          <p className="text-sm text-muted-foreground">Analyze revenue totals, average check sizes, and product category distributions.</p>
        </div>
        <Button onClick={handleExportCSV} variant="outline" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export to CSV
        </Button>
      </div>

      {/* Date Range Selectors Toolbar */}
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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Filtered Revenue</span>
          <h3 className="text-2xl font-bold text-slate-900">৳{totalSales}</h3>
        </div>
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Filtered Order Count</span>
          <h3 className="text-2xl font-bold text-slate-900">{totalOrders}</h3>
        </div>
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Average Basket Value</span>
          <h3 className="text-2xl font-bold text-slate-900">৳{avgOrderValue}</h3>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Selling Products table */}
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
            <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-1.5">
              <BarChart3 className="h-4 w-4 text-primary" /> Top Selling Products
            </h4>
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
                    <th className="py-2.5 px-3">Product Name</th>
                    <th className="py-2.5 px-3">SKU</th>
                    <th className="py-2.5 px-3 text-center">Qty Sold</th>
                    <th className="py-2.5 px-3 text-right">Total Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {topProducts.map((prod, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{prod.name}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">{prod.sku}</td>
                      <td className="py-2.5 px-3 text-center font-bold">{prod.qty}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-950">৳{prod.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sales by Category table */}
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
            <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-primary" /> Sales By Category
            </h4>
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 text-right">Total Revenue</th>
                    <th className="py-2.5 px-3 text-right">Revenue Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {categorySales.map((cat, idx) => {
                    const share = totalSales > 0 ? Math.round((cat.total / totalSales) * 100) : 0
                    return (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{cat.name}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-950">৳{cat.total}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-500">{share}%</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
