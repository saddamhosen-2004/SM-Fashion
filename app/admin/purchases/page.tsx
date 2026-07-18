'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Purchase } from '@/types'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Plus, Search, Loader2, DollarSign } from 'lucide-react'
import toast from 'react-hot-toast'

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('all')

  // Due Payment modal states
  const [isPayOpen, setIsPayOpen] = useState(false)
  const [selectedPurchase, setSelectedPurchase] = useState<any>(null)
  const [payAmountInput, setPayAmountInput] = useState('')
  const [paying, setPaying] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    fetchPurchases()
  }, [])

  const fetchPurchases = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('purchases')
        .select('*, supplier:suppliers(*)')
        .order('date', { ascending: false })

      if (error) throw error
      setPurchases(data || [])
    } catch (error: any) {
      toast.error('Failed to load purchases: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenPayModal = (purchase: any) => {
    setSelectedPurchase(purchase)
    setPayAmountInput(purchase.due_amount.toString())
    setIsPayOpen(true)
  }

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    const payAmt = parseFloat(payAmountInput)
    if (isNaN(payAmt) || payAmt <= 0) {
      toast.error('Please enter a valid positive payment amount')
      return
    }

    if (payAmt > selectedPurchase.due_amount) {
      toast.error('Payment amount exceeds current due amount')
      return
    }

    setPaying(true)
    try {
      const newPaidAmount = selectedPurchase.paid_amount + payAmt
      const newDueAmount = selectedPurchase.due_amount - payAmt

      const { error } = await supabase
        .from('purchases')
        .update({
          paid_amount: newPaidAmount,
          due_amount: newDueAmount
        })
        .eq('id', selectedPurchase.id)

      if (error) throw error

      toast.success('Payment recorded successfully!')
      setIsPayOpen(false)
      fetchPurchases()
    } catch (error: any) {
      toast.error('Failed to update payment: ' + error.message)
    } finally {
      setPaying(false)
    }
  }

  const filteredPurchases = purchases.filter((p) => {
    const matchesSearch =
      (p.invoice_no && p.invoice_no.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.supplier?.name && p.supplier.name.toLowerCase().includes(searchTerm.toLowerCase()))

    const isDue = p.due_amount > 0
    const isPaid = p.due_amount <= 0

    if (paymentFilter === 'due') return matchesSearch && isDue
    if (paymentFilter === 'paid') return matchesSearch && isPaid
    return matchesSearch
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Stock Purchase Records</h2>
          <p className="text-sm text-muted-foreground">Log manufacturing purchases from suppliers to update inventory levels and due balances.</p>
        </div>
        <Link href="/admin/purchases/new">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Purchase
          </Button>
        </Link>
      </div>

      {/* Toolbar filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
        <div className="relative">
          <Input
            placeholder="Search by invoice or supplier..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        </div>

        <Select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          options={[
            { value: 'all', label: 'All Purchases' },
            { value: 'due', label: 'Outstanding Dues' },
            { value: 'paid', label: 'Fully Paid' },
          ]}
        />
      </div>

      {/* Purchases Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredPurchases.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No purchases found.</div>
        ) : (
          <div className="overflow-x-auto text-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
                  <th className="p-4">Invoice No</th>
                  <th className="p-4">Supplier</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Total Amount</th>
                  <th className="p-4">Paid Amount</th>
                  <th className="p-4">Due Balance</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPurchases.map((p) => {
                  const hasDue = p.due_amount > 0
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-mono font-bold text-slate-900">
                        {p.invoice_no || 'N/A'}
                      </td>
                      <td className="p-4 text-slate-800">{p.supplier?.name || 'Deleted Supplier'}</td>
                      <td className="p-4 text-slate-500">{new Date(p.date).toLocaleDateString()}</td>
                      <td className="p-4 font-bold text-slate-900">৳{p.total_amount}</td>
                      <td className="p-4 text-green-600 font-medium">৳{p.paid_amount}</td>
                      <td className={`p-4 font-semibold ${hasDue ? 'text-red-650' : 'text-slate-500'}`}>
                        ৳{p.due_amount}
                      </td>
                      <td className="p-4">
                        <Badge variant={hasDue ? 'danger' : 'success'}>
                          {hasDue ? 'DUE OUTSTANDING' : 'FULLY PAID'}
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                        {hasDue ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenPayModal(p)}
                            className="flex items-center gap-1 ml-auto text-primary"
                          >
                            <DollarSign className="h-4.5 w-4.5" /> Pay Due
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground font-medium pr-3">Completed</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Due Payment Modal Dialog */}
      {isPayOpen && selectedPurchase && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-lg max-w-md w-full space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="text-lg font-bold text-slate-900">Record Vendor Payment</h3>
              <button onClick={() => setIsPayOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <div className="space-y-1 text-sm bg-slate-50 p-3 rounded-lg">
              <div className="flex justify-between">
                <span className="text-slate-500">Supplier:</span>
                <span className="font-bold text-slate-800">{selectedPurchase.supplier?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Invoice:</span>
                <span className="font-bold text-slate-800">{selectedPurchase.invoice_no}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 mt-2 pt-2">
                <span className="text-slate-550">Outstanding Due:</span>
                <span className="font-bold text-red-650">৳{selectedPurchase.due_amount}</span>
              </div>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <Input
                label="Payment Amount (৳)"
                type="number"
                min="0.01"
                step="0.01"
                value={payAmountInput}
                onChange={(e) => setPayAmountInput(e.target.value)}
                placeholder="Enter amount to pay"
                required
              />

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setIsPayOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" loading={paying}>
                  Record Payment
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
