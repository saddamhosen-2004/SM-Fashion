'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Expense } from '@/types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Plus, Trash2, Search, Loader2, CreditCard, DollarSign } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Form fields
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('other')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [note, setNote] = useState('')

  const supabase = createClient()

  useEffect(() => {
    fetchExpenses()
  }, [])

  const fetchExpenses = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('date', { ascending: false })
      if (error) throw error
      setExpenses(data || [])
    } catch (error: any) {
      toast.error('Failed to load expenses: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenForm = () => {
    setTitle('')
    setAmount('')
    setCategory('other')
    setDate(new Date().toISOString().split('T')[0])
    setNote('')
    setIsFormOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const amt = parseFloat(amount)
    if (!title || isNaN(amt) || amt <= 0) {
      toast.error('Please enter a valid title and positive amount')
      return
    }

    setSubmitting(true)
    try {
      const { error } = await supabase
        .from('expenses')
        .insert([
          {
            title,
            amount: amt,
            category,
            date,
            note: note || null,
          }
        ])

      if (error) throw error

      toast.success('Expense recorded successfully!')
      setIsFormOpen(false)
      fetchExpenses()
    } catch (error: any) {
      toast.error('Error saving expense: ' + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense record?')) return

    try {
      const { error } = await supabase.from('expenses').delete().eq('id', id)
      if (error) throw error
      toast.success('Expense deleted successfully')
      fetchExpenses()
    } catch (error: any) {
      toast.error('Failed to delete: ' + error.message)
    }
  }

  const filteredExpenses = expenses.filter((exp) => {
    const matchesSearch =
      exp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (exp.note && exp.note.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesCategory = categoryFilter === 'all' || exp.category === categoryFilter

    return matchesSearch && matchesCategory
  })

  // Calculate total monthly expenses
  const getTotalExpenses = () => {
    return filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0)
  }

  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    { value: 'rent', label: 'Rent' },
    { value: 'salary', label: 'Salary' },
    { value: 'utility', label: 'Utility' },
    { value: 'transport', label: 'Transport' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'other', label: 'Other' },
  ]

  const formCategoryOptions = categoryOptions.slice(1) // exclude 'all'

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Expense Tracker</h2>
          <p className="text-sm text-muted-foreground">Log utility bills, rent, office supplies, salaries, and operational costs.</p>
        </div>
        <Button onClick={handleOpenForm} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Expense
        </Button>
      </div>

      {/* KPI & Summary row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between col-span-1">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Operational Costs</span>
            <h3 className="text-2xl font-bold text-slate-900">৳{getTotalExpenses()}</h3>
          </div>
          <div className="h-10 w-10 bg-red-50 text-red-650 rounded-full flex items-center justify-center">
            <CreditCard className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Toolbar filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
        <div className="relative">
          <Input
            placeholder="Search by title or note..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        </div>

        <Select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          options={categoryOptions}
        />
      </div>

      {/* Grid: Table & Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Expenses List */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="p-12 text-center text-slate-500">No expenses recorded.</div>
          ) : (
            <div className="overflow-x-auto text-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
                    <th className="p-4">Expense Info</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredExpenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4">
                        <span className="font-bold text-slate-900 block">{exp.title}</span>
                        {exp.note && <span className="text-xs text-muted-foreground line-clamp-1">{exp.note}</span>}
                      </td>
                      <td className="p-4 uppercase text-xs font-bold text-slate-600">{exp.category}</td>
                      <td className="p-4 text-slate-500">{new Date(exp.date).toLocaleDateString()}</td>
                      <td className="p-4 font-bold text-red-650">৳{exp.amount}</td>
                      <td className="p-4 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(exp.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add Expense Panel */}
        {isFormOpen ? (
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4 h-fit">
            <h3 className="text-lg font-bold text-slate-900">Record Operational Expense</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Expense Title *"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Electric Bill, Rent"
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Amount (৳) *"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 5000"
                  required
                />
                <Select
                  label="Category *"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  options={formCategoryOptions}
                />
              </div>

              <Input
                label="Date *"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />

              <Textarea
                label="Notes / Remarks (Optional)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="May utility bill paid online."
                rows={3}
              />

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" loading={submitting}>
                  Log Expense
                </Button>
              </div>
            </form>
          </div>
        ) : (
          <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg p-6 flex flex-col items-center justify-center text-center h-48">
            <p className="text-sm text-slate-500 mb-2">Record a new business expense.</p>
            <Button variant="outline" size="sm" onClick={handleOpenForm}>
              Record Expense
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
