'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Category, Product, ProductImage } from '@/types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Trash2, Plus, Image as ImageIcon, Star, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface ProductFormProps {
  initialData?: Product & { images?: ProductImage[] }
  productId?: string
}

export function ProductForm({ initialData, productId }: ProductFormProps) {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingCats, setLoadingCats] = useState(true)
  const [saving, setSaving] = useState(false)

  // Form states
  const [name, setName] = useState(initialData?.name || '')
  const [nameBn, setNameBn] = useState((initialData as any)?.name_bn || '')
  const [slug, setSlug] = useState(initialData?.slug || '')
  const [sku, setSku] = useState(initialData?.sku || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [descriptionBn, setDescriptionBn] = useState((initialData as any)?.description_bn || '')
  const [categoryId, setCategoryId] = useState(initialData?.category_id || '')
  const [price, setPrice] = useState(initialData?.price?.toString() || '0')
  const [discountPrice, setDiscountPrice] = useState(initialData?.discount_price?.toString() || '')
  const [costPrice, setCostPrice] = useState(initialData?.cost_price?.toString() || '0')
  const [stockQuantity, setStockQuantity] = useState(initialData?.stock_quantity?.toString() || '0')
  const [unit, setUnit] = useState(initialData?.unit || 'piece')
  const [lowStockThreshold, setLowStockThreshold] = useState(initialData?.low_stock_threshold?.toString() || '5')
  const [isActive, setIsActive] = useState(initialData !== undefined ? initialData.is_active : true)
  const [isFeatured, setIsFeatured] = useState(initialData !== undefined ? initialData.is_featured : false)

  // Image list state
  const [images, setImages] = useState<Omit<ProductImage, 'id' | 'product_id' | 'created_at'>[]>(
    initialData?.images?.map(img => ({
      url: img.url,
      alt: img.alt || '',
      display_order: img.display_order,
      is_primary: img.is_primary
    })) || []
  )

  // Input for adding direct URL
  const [imageUrlInput, setImageUrlInput] = useState('')

  const supabase = createClient()

  useEffect(() => {
    async function fetchCats() {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .eq('is_active', true)
          .order('name')
        if (error) throw error
        setCategories(data || [])
        if (data && data.length > 0 && !categoryId) {
          setCategoryId(data[0].id)
        }
      } catch (error: any) {
        toast.error('Failed to load categories: ' + error.message)
      } finally {
        setLoadingCats(false)
      }
    }
    fetchCats()
  }, [])

  // Auto slug generation from name
  useEffect(() => {
    if (!productId && name) {
      setSlug(
        name
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
      )
    }
  }, [name, productId])

  const handleAddImageUrl = () => {
    if (!imageUrlInput.trim()) return
    const isPrimary = images.length === 0 // Make primary if first image
    
    setImages([
      ...images,
      {
        url: imageUrlInput.trim(),
        alt: name || 'Product Image',
        display_order: images.length,
        is_primary: isPrimary
      }
    ])
    setImageUrlInput('')
    toast.success('Image link added')
  }

  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    // Re-adjust display orders and primaries
    const updated = newImages.map((img, i) => ({
      ...img,
      display_order: i,
      is_primary: img.is_primary && i === 0 ? true : false
    }))
    // If we deleted the primary image, make the first remaining image primary
    if (updated.length > 0 && !updated.some(img => img.is_primary)) {
      updated[0].is_primary = true
    }
    setImages(updated)
  }

  const handleSetPrimaryImage = (index: number) => {
    setImages(
      images.map((img, i) => ({
        ...img,
        is_primary: i === index
      }))
    )
    toast.success('Primary image updated')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !slug || !categoryId || !price) {
      toast.error('Please fill in name, slug, category, and price')
      return
    }

    setSaving(true)
    try {
      const parsedPrice = parseFloat(price)
      const parsedDiscountPrice = discountPrice ? parseFloat(discountPrice) : null
      const parsedCostPrice = parseFloat(costPrice)
      const parsedStock = parseInt(stockQuantity)
      const parsedThreshold = parseInt(lowStockThreshold)

      if (isNaN(parsedPrice) || isNaN(parsedCostPrice) || isNaN(parsedStock) || isNaN(parsedThreshold)) {
        toast.error('Prices and quantities must be valid numbers')
        setSaving(false)
        return
      }

      const productPayload = {
        name,
        name_bn: nameBn || null,
        slug,
        sku: sku || null,
        description: description || null,
        description_bn: descriptionBn || null,
        category_id: categoryId,
        price: parsedPrice,
        discount_price: parsedDiscountPrice,
        cost_price: parsedCostPrice,
        stock_quantity: parsedStock,
        unit,
        low_stock_threshold: parsedThreshold,
        is_active: isActive,
        is_featured: isFeatured,
      }

      if (productId) {
        // 1. Update product
        const { error: prodError } = await supabase
          .from('products')
          .update({ ...productPayload, updated_at: new Date().toISOString() })
          .eq('id', productId)

        if (prodError) throw prodError

        // 2. Re-insert images (delete then insert)
        const { error: deleteError } = await supabase
          .from('product_images')
          .delete()
          .eq('product_id', productId)

        if (deleteError) throw deleteError

        if (images.length > 0) {
          const imagesToInsert = images.map((img) => ({
            product_id: productId,
            url: img.url,
            alt: img.alt || name,
            display_order: img.display_order,
            is_primary: img.is_primary,
          }))

          const { error: insertError } = await supabase
            .from('product_images')
            .insert(imagesToInsert)

          if (insertError) throw insertError
        }

        toast.success('Product updated successfully')
      } else {
        // 1. Create product
        const { data: newProd, error: prodError } = await supabase
          .from('products')
          .insert([productPayload])
          .select()
          .single()

        if (prodError) throw prodError

        // 2. Create images
        if (images.length > 0) {
          const imagesToInsert = images.map((img) => ({
            product_id: newProd.id,
            url: img.url,
            alt: img.alt || name,
            display_order: img.display_order,
            is_primary: img.is_primary,
          }))

          const { error: insertError } = await supabase
            .from('product_images')
            .insert(imagesToInsert)

          if (insertError) throw insertError
        }

        toast.success('Product created successfully')
      }

      router.push('/admin/products')
      router.refresh()
    } catch (error: any) {
      toast.error('Error saving product: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const categoryOptions = categories.map((c) => ({
    value: c.id,
    label: c.name,
  }))

  const unitOptions = [
    { value: 'piece', label: 'Piece' },
    { value: 'kg', label: 'Kilogram (kg)' },
    { value: 'yard', label: 'Yard' },
    { value: 'pack', label: 'Pack' },
  ]

  if (loadingCats) {
    return (
      <div className="flex h-64 items-center justify-center bg-white rounded-lg border border-slate-200">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column - Primary info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">General Information</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Product Name (English)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Premium Cotton Panjabi"
                required
              />
              <Input
                label="Product Name (Bangla)"
                value={nameBn}
                onChange={(e) => setNameBn(e.target.value)}
                placeholder="যেমন: প্রিমিয়াম কটন পাঞ্জাবী"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Slug (URL Key)"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g. premium-cotton-panjabi"
                required
              />
              <Input
                label="SKU (Item Code)"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="e.g. SMF-PNJ-001"
              />
            </div>

            <Textarea
              label="Product Description (English)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a detailed description of materials, fit, care instructions, etc."
              rows={4}
            />

            <Textarea
              label="Product Description (Bangla)"
              value={descriptionBn}
              onChange={(e) => setDescriptionBn(e.target.value)}
              placeholder="পণ্যটির বিস্তারিত বিবরণ এখানে দিন (যেমন: ফেব্রিক, সাইজ গাইড, ধোয়ার নিয়ম ইত্যাদি)"
              rows={4}
            />
          </div>

          {/* Pricing & Inventory */}
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">Pricing & Inventory</h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Regular Price (৳)"
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
              <Input
                label="Discount Price (৳)"
                type="number"
                min="0"
                step="0.01"
                value={discountPrice}
                onChange={(e) => setDiscountPrice(e.target.value)}
                placeholder="Leave blank if none"
              />
              <Input
                label="Cost Price (৳)"
                type="number"
                min="0"
                step="0.01"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                placeholder="Our purchase cost"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Initial Stock Quantity"
                type="number"
                min="0"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                required
              />
              <Select
                label="Unit of Measure"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                options={unitOptions}
              />
              <Input
                label="Low Stock Threshold"
                type="number"
                min="0"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Product Images */}
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">Product Images</h3>
            
            <div className="flex gap-2">
              <Input
                placeholder="Paste external image link (e.g. ImageKit URL)..."
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
              />
              <Button type="button" onClick={handleAddImageUrl} variant="outline" className="shrink-0">
                <Plus className="h-4 w-4 mr-2" /> Add Link
              </Button>
            </div>

            {images.length === 0 ? (
              <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 flex flex-col items-center justify-center text-slate-400">
                <ImageIcon className="h-10 w-10 mb-2" />
                <span className="text-sm">No images added. Paste image URL above.</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {images.map((img, index) => (
                  <div key={index} className="relative group border border-slate-200 rounded-lg overflow-hidden aspect-square bg-slate-50">
                    <img
                      src={img.url}
                      alt={img.alt || 'Product Image'}
                      className="h-full w-full object-cover"
                    />
                    
                    {/* Image Controls Overlay */}
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity duration-200">
                      <button
                        type="button"
                        onClick={() => handleSetPrimaryImage(index)}
                        className={`p-1.5 rounded-full ${img.is_primary ? 'bg-secondary text-secondary-foreground' : 'bg-white/80 hover:bg-white text-slate-700'}`}
                        title={img.is_primary ? 'Primary Image' : 'Set as Primary'}
                      >
                        <Star className="h-4 w-4 fill-current" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="p-1.5 rounded-full bg-white/80 hover:bg-white text-red-600 hover:text-red-700"
                        title="Delete Image"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {img.is_primary && (
                      <span className="absolute top-2 left-2 bg-secondary text-secondary-foreground text-[10px] font-extrabold uppercase px-2 py-0.5 rounded shadow-sm">
                        Primary
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column - Sidebar configuration */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">Publish Settings</h3>
            
            <Select
              label="Product Category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              options={categoryOptions}
            />

            <div className="border-t border-slate-100 pt-4 space-y-3">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 text-primary focus:ring-primary border-slate-300 rounded mt-0.5"
                />
                <div>
                  <label htmlFor="isActive" className="text-sm font-semibold text-slate-800">
                    Product Active
                  </label>
                  <p className="text-xs text-muted-foreground">Visible on public store catalog.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="isFeatured"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="h-4 w-4 text-primary focus:ring-primary border-slate-300 rounded mt-0.5"
                />
                <div>
                  <label htmlFor="isFeatured" className="text-sm font-semibold text-slate-800">
                    Featured Product
                  </label>
                  <p className="text-xs text-muted-foreground">Display in homepage featured collections.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/admin/products')}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" loading={saving} className="flex-1">
              Save Product
            </Button>
          </div>
        </div>

      </div>
    </form>
  )
}
