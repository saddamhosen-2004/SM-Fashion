'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Supplier } from '@/types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Plus, Edit, Trash2, Search, Loader2, Phone, Mail, MapPin } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Form fields
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [note, setNote] = useState('')

  const supabase = createClient()

  useEffect(() => {
    fetchSuppliers()
  }, [])

  const fetchSuppliers = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('name')
      if (error) throw error
      setSuppliers(data || [])
    } catch (error: any) {
      toast.error('Failed to load suppliers: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenNewForm = () => {
    setEditingId(null)
    setName('')
    setPhone('')
    setEmail('')
    setAddress('')
    setNote('')
    setIsFormOpen(true)
  }

  const handleOpenEditForm = (supplier: Supplier) => {
    setEditingId(supplier.id)
    setName(supplier.name)
    setPhone(supplier.phone || '')
    setEmail(supplier.email || '')
    setAddress(supplier.address || '')
    setNote(supplier.note || '')
    setIsFormOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name) {
      toast.error('Supplier name is required')
      return
    }

    setSubmitting(true)
    try {
      const supplierData = {
        name,
        phone: phone || null,
        email: email || null,
        address: address || null,
        note: note || null,
      }

      if (editingId) {
        const { error } = await supabase
          .from('suppliers')
          .update(supplierData)
          .eq('id', editingId)
        if (error) throw error
        toast.success('Supplier updated successfully')
      } else {
        const { error } = await supabase
          .from('suppliers')
          .insert([supplierData])
        if (error) throw error
        toast.success('Supplier added successfully')
      }

      setIsFormOpen(false)
      fetchSuppliers()
    } catch (error: any) {
      toast.error('Error saving supplier: ' + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this supplier?')) return

    try {
      const { error } = await supabase.from('suppliers').delete().eq('id', id)
      if (error) throw error
      toast.success('Supplier deleted successfully')
      fetchSuppliers()
    } catch (error: any) {
      toast.error('Failed to delete: ' + error.message)
    }
  }

  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.phone && s.phone.includes(searchTerm)) ||
      (s.email && s.email.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Suppliers & Vendors</h2>
          <p className="text-sm text-muted-foreground">Manage manufacturer/supplier details for stock purchasing entries.</p>
        </div>
        <Button onClick={handleOpenNewForm} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Supplier
        </Button>
      </div>

      {/* Search Toolbar */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
        <div className="relative flex-1 max-w-sm">
          <Input
            placeholder="Search suppliers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-10"
          />
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Suppliers Table */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredSuppliers.length === 0 ? (
            <div className="p-12 text-center text-slate-500">No suppliers found.</div>
          ) : (
            <div className="overflow-x-auto text-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
                    <th className="p-4">Supplier Info</th>
                    <th className="p-4">Contact Details</th>
                    <th className="p-4">Address</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSuppliers.map((supplier) => (
                    <tr key={supplier.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4">
                        <span className="font-bold text-slate-900 block">{supplier.name}</span>
                        {supplier.note && <span className="text-xs text-muted-foreground line-clamp-1">{supplier.note}</span>}
                      </td>
                      <td className="p-4 space-y-1">
                        {supplier.phone && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-650">
                            <Phone className="h-3.5 w-3.5 text-primary" /> {supplier.phone}
                          </div>
                        )}
                        {supplier.email && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-650">
                            <Mail className="h-3.5 w-3.5 text-primary" /> {supplier.email}
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-xs text-slate-600 max-w-[200px] truncate">
                        {supplier.address || '-'}
                      </td>
                      <td className="p-4 text-right space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEditForm(supplier)}
                          className="text-slate-500 hover:text-slate-800"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(supplier.id)}
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

        {/* Supplier Form Panel */}
        {isFormOpen ? (
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4 h-fit">
            <h3 className="text-lg font-bold text-slate-900">
              {editingId ? 'Edit Supplier' : 'Add New Supplier'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Supplier/Vendor Name *"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Dhaka Apparel Mill"
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="017xxxxxxxx"
                />
                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vendor@example.com"
                />
              </div>

              <Textarea
                label="Business Address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Uttara, Dhaka"
                rows={3}
              />

              <Input
                label="Internal Remarks / Notes"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Panjabi fabric supplier"
              />

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" loading={submitting}>
                  Save Vendor
                </Button>
              </div>
            </form>
          </div>
        ) : (
          <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg p-6 flex flex-col items-center justify-center text-center h-48">
            <p className="text-sm text-slate-500 mb-2">Select a vendor to edit, or add a new one.</p>
            <Button variant="outline" size="sm" onClick={handleOpenNewForm}>
              Quick Add Vendor
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
