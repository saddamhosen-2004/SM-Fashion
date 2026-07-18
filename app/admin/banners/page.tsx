'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Banner } from '@/types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Plus, Trash2, Search, Loader2, Image as ImageIcon } from 'lucide-react'
import toast from 'react-hot-toast'

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Form fields
  const [imageUrl, setImageUrl] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [displayOrder, setDisplayOrder] = useState('0')
  const [isActive, setIsActive] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    fetchBanners()
  }, [])

  const fetchBanners = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .order('display_order', { ascending: true })

      if (error) throw error
      setBanners(data || [])
    } catch (error: any) {
      toast.error('Failed to load banners: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenForm = () => {
    setImageUrl('')
    setLinkUrl('')
    setDisplayOrder(banners.length.toString())
    setIsActive(true)
    setIsFormOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!imageUrl) {
      toast.error('Banner Image URL is required')
      return
    }

    const order = parseInt(displayOrder)
    if (isNaN(order)) {
      toast.error('Display order must be a valid number')
      return
    }

    setSubmitting(true)
    try {
      const { error } = await supabase
        .from('banners')
        .insert([
          {
            image_url: imageUrl,
            link_url: linkUrl || null,
            display_order: order,
            is_active: isActive,
          }
        ])

      if (error) throw error

      toast.success('Homepage banner added successfully!')
      setIsFormOpen(false)
      fetchBanners()
    } catch (error: any) {
      toast.error('Failed to save banner: ' + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) return

    try {
      const { error } = await supabase.from('banners').delete().eq('id', id)
      if (error) throw error
      toast.success('Banner deleted successfully')
      fetchBanners()
    } catch (error: any) {
      toast.error('Failed to delete banner: ' + error.message)
    }
  }

  const toggleActive = async (banner: Banner) => {
    try {
      const { error } = await supabase
        .from('banners')
        .update({ is_active: !banner.is_active })
        .eq('id', banner.id)

      if (error) throw error
      toast.success(banner.is_active ? 'Banner deactivated' : 'Banner activated')
      fetchBanners()
    } catch (error: any) {
      toast.error('Failed to update banner: ' + error.message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Homepage Banners</h2>
          <p className="text-sm text-muted-foreground">Manage sliding hero banner images, links, and display order priorities on the storefront.</p>
        </div>
        <Button onClick={handleOpenForm} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Banner
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Banner List Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : banners.length === 0 ? (
              <div className="p-12 text-center text-slate-500">No banners created yet.</div>
            ) : (
              <div className="overflow-x-auto text-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
                      <th className="p-4 w-28">Preview</th>
                      <th className="p-4">Link URL</th>
                      <th className="p-4 text-center">Display Order</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {banners.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4">
                          <div className="relative h-12 w-24 rounded border border-slate-150 overflow-hidden bg-slate-50">
                            <img
                              src={b.image_url}
                              alt="Banner Preview"
                              className="h-full w-full object-cover"
                            />
                          </div>
                        </td>
                        <td className="p-4 font-mono text-xs text-slate-600 max-w-[150px] truncate">
                          {b.link_url || '-'}
                        </td>
                        <td className="p-4 text-center font-semibold text-slate-800">
                          {b.display_order}
                        </td>
                        <td className="p-4">
                          <button onClick={() => toggleActive(b)}>
                            <Badge variant={b.is_active ? 'success' : 'outline'}>
                              {b.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </button>
                        </td>
                        <td className="p-4 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(b.id)}
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
        </div>

        {/* Add Banner panel */}
        {isFormOpen ? (
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4 h-fit">
            <h3 className="text-lg font-bold text-slate-900">Add Homepage Banner</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Banner Image URL *"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://ik.imagekit.io/..."
                required
              />

              <Input
                label="Redirect Link URL (Optional)"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="e.g. /products?category=panjabi"
              />

              <Input
                label="Display Order Priority"
                type="number"
                min="0"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(e.target.value)}
                required
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
                  Banner Active / Visible
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" loading={submitting}>
                  Save Slide
                </Button>
              </div>
            </form>
          </div>
        ) : (
          <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg p-6 flex flex-col items-center justify-center text-center h-48">
            <p className="text-sm text-slate-500 mb-2">Upload a new hero slide banner image.</p>
            <Button variant="outline" size="sm" onClick={handleOpenForm}>
              Record Banner
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
