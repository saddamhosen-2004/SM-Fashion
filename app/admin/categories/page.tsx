'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Search, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Category } from '@/types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import toast from 'react-hot-toast'

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  
  // Form fields
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [nameBn, setNameBn] = useState('')
  const [slug, setSlug] = useState('')
  const [parentId, setParentId] = useState<string>('null')
  const [imageUrl, setImageUrl] = useState('')
  const [isActive, setIsActive] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*, products:products(count)')
        .order('name', { ascending: true })

      if (error) throw error

      const formatted = (data || []).map((cat: any) => ({
        ...cat,
        product_count: cat.products?.[0]?.count || 0,
      })) as Category[]

      setCategories(formatted)
    } catch (error: any) {
      toast.error('Failed to load categories: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // Auto-generate slug from name
  useEffect(() => {
    if (!editingId && name) {
      setSlug(
        name
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
      )
    }
  }, [name, editingId])

  const handleOpenNewForm = () => {
    setEditingId(null)
    setName('')
    setNameBn('')
    setSlug('')
    setParentId('null')
    setImageUrl('')
    setIsActive(true)
    setIsFormOpen(true)
  }

  const handleOpenEditForm = (category: Category) => {
    setEditingId(category.id)
    setName(category.name)
    setNameBn((category as any).name_bn || '')
    setSlug(category.slug)
    setParentId(category.parent_id || 'null')
    setImageUrl(category.image_url || '')
    setIsActive(category.is_active)
    setIsFormOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !slug) {
      toast.error('Name and Slug are required')
      return
    }

    setSubmitting(true)
    try {
      const catData = {
        name,
        name_bn: nameBn || null,
        slug,
        parent_id: parentId === 'null' ? null : parentId,
        image_url: imageUrl || null,
        is_active: isActive,
      }

      if (editingId) {
        const { error } = await supabase
          .from('categories')
          .update(catData)
          .eq('id', editingId)

        if (error) throw error
        toast.success('Category updated successfully')
      } else {
        const { error } = await supabase
          .from('categories')
          .insert([catData])

        if (error) throw error
        toast.success('Category created successfully')
      }

      setIsFormOpen(false)
      fetchCategories()
    } catch (error: any) {
      toast.error('Error saving category: ' + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category? This will not delete the products under it.')) {
      return
    }

    try {
      const { error } = await supabase.from('categories').delete().eq('id', id)
      if (error) throw error
      toast.success('Category deleted successfully')
      fetchCategories()
    } catch (error: any) {
      toast.error('Failed to delete category: ' + error.message)
    }
  }

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cat.slug.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const parentOptions = [
    { value: 'null', label: 'None (Root Category)' },
    ...categories
      .filter((cat) => cat.id !== editingId) // Prevent self-referencing
      .map((cat) => ({ value: cat.id, label: cat.name })),
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Category Management</h2>
          <p className="text-sm text-muted-foreground">Manage hierarchy, slugs, and display states for product categories.</p>
        </div>
        <Button onClick={handleOpenNewForm} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Category
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
        <div className="relative flex-1 max-w-sm">
          <Input
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      {/* Grid Layout: Table & Slideover Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center text-center p-6">
              <p className="text-slate-500 mb-2">No categories found.</p>
              <Button variant="outline" onClick={handleOpenNewForm}>Create your first category</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
                    <th className="p-4">Name</th>
                    <th className="p-4">Slug</th>
                    <th className="p-4">Parent Category</th>
                    <th className="p-4 text-center">Products</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCategories.map((cat) => {
                    const parent = categories.find((c) => c.id === cat.parent_id)
                    return (
                      <tr key={cat.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 font-medium text-slate-900">{cat.name}</td>
                        <td className="p-4 text-slate-500">{cat.slug}</td>
                        <td className="p-4 text-slate-500">{parent ? parent.name : '-'}</td>
                        <td className="p-4 text-center font-semibold">{cat.product_count}</td>
                        <td className="p-4">
                          <Badge variant={cat.is_active ? 'success' : 'outline'}>
                            {cat.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="p-4 text-right space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEditForm(cat)}
                            className="text-slate-500 hover:text-slate-800"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(cat.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Slide-over Form Panel */}
        {isFormOpen ? (
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">
              {editingId ? 'Edit Category' : 'Add New Category'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Category Name (English)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Panjabi"
                required
              />

              <Input
                label="Category Name (Bangla)"
                value={nameBn}
                onChange={(e) => setNameBn(e.target.value)}
                placeholder="পাঞ্জাবী"
              />

              <Input
                label="Slug (URL Key)"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g. panjabi"
                required
              />

              <Select
                label="Parent Category"
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                options={parentOptions}
              />

              <Input
                label="Category Image URL (Optional)"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://ik.imagekit.io/..."
              />

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 text-primary focus:ring-primary border-slate-300 rounded"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-slate-700">
                  Visible in Navigation / Storefront
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" loading={submitting}>
                  Save
                </Button>
              </div>
            </form>
          </div>
        ) : (
          <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg p-6 flex flex-col items-center justify-center text-center h-48">
            <p className="text-sm text-slate-500 mb-2">Select a category to edit, or create a new one.</p>
            <Button variant="outline" size="sm" onClick={handleOpenNewForm}>
              Quick Add Category
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
