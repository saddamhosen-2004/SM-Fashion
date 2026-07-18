'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Plus, Edit, Trash2, Search, Loader2, Star, CheckCircle, XCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Product, Category } from '@/types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import toast from 'react-hot-toast'

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [stockFilter, setStockFilter] = useState('all')

  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch categories for filter dropdown
      const { data: cats, error: catError } = await supabase
        .from('categories')
        .select('*')
        .order('name')
      if (catError) throw catError
      setCategories(cats || [])

      // Fetch products
      const { data: prods, error: prodError } = await supabase
        .from('products')
        .select('*, category:categories(*), images:product_images(*)')
        .order('created_at', { ascending: false })
      if (prodError) throw prodError
      setProducts(prods || [])
    } catch (error: any) {
      toast.error('Failed to load products: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product? (Soft delete)')) return

    try {
      // Perform soft delete
      const { error } = await supabase
        .from('products')
        .update({ is_active: false })
        .eq('id', id)

      if (error) throw error
      toast.success('Product soft deleted successfully')
      fetchData()
    } catch (error: any) {
      toast.error('Failed to delete product: ' + error.message)
    }
  }

  const toggleFeatured = async (product: Product) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_featured: !product.is_featured })
        .eq('id', product.id)

      if (error) throw error
      toast.success(product.is_featured ? 'Removed from featured list' : 'Added to featured list')
      fetchData()
    } catch (error: any) {
      toast.error('Failed to update product: ' + error.message)
    }
  }

  const toggleActive = async (product: Product) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: !product.is_active })
        .eq('id', product.id)

      if (error) throw error
      toast.success(product.is_active ? 'Product deactivated' : 'Product activated')
      fetchData()
    } catch (error: any) {
      toast.error('Failed to update product: ' + error.message)
    }
  }

  const filteredProducts = products.filter((prod) => {
    const matchesSearch =
      prod.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (prod.sku && prod.sku.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesCategory = categoryFilter === 'all' || prod.category_id === categoryFilter

    const matchesStock =
      stockFilter === 'all' ||
      (stockFilter === 'out' && prod.stock_quantity <= 0) ||
      (stockFilter === 'low' && prod.stock_quantity > 0 && prod.stock_quantity <= prod.low_stock_threshold) ||
      (stockFilter === 'in' && prod.stock_quantity > prod.low_stock_threshold)

    return matchesSearch && matchesCategory && matchesStock
  })

  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    ...categories.map((c) => ({ value: c.id, label: c.name })),
  ]

  const stockOptions = [
    { value: 'all', label: 'All Stock Levels' },
    { value: 'in', label: 'In Stock' },
    { value: 'low', label: 'Low Stock' },
    { value: 'out', label: 'Out of Stock' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Product Catalog</h2>
          <p className="text-sm text-muted-foreground">Add, search, edit, and organize clothing items and stock thresholds.</p>
        </div>
        <Link href="/admin/products/new">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        </Link>
      </div>

      {/* Toolbar Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
        <div className="relative">
          <Input
            placeholder="Search by name or SKU..."
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

        <Select
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value)}
          options={stockOptions}
        />
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-center p-6">
            <p className="text-slate-500 mb-2">No products found matching filters.</p>
            <Link href="/admin/products/new">
              <Button variant="outline">Create a product</Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
                  <th className="p-4 w-16">Image</th>
                  <th className="p-4">Product Info</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Cost</th>
                  <th className="p-4">Stock</th>
                  <th className="p-4 text-center">Featured</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((prod) => {
                  const primaryImage = prod.images?.find((img) => img.is_primary)?.url || 
                                       prod.images?.[0]?.url || 
                                       '/placeholder-product.jpg'
                  
                  const isLowStock = prod.stock_quantity > 0 && prod.stock_quantity <= prod.low_stock_threshold
                  const isOutOfStock = prod.stock_quantity <= 0

                  return (
                    <tr key={prod.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4">
                        <div className="relative h-12 w-12 rounded border border-slate-100 overflow-hidden bg-slate-50">
                          <Image
                            src={primaryImage}
                            alt={prod.name}
                            fill
                            sizes="48px"
                            className="object-cover"
                            unoptimized={primaryImage.startsWith('http') || primaryImage.startsWith('/')}
                          />
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-slate-900 line-clamp-1">{prod.name}</div>
                        <div className="text-xs text-muted-foreground">SKU: {prod.sku || 'N/A'}</div>
                      </td>
                      <td className="p-4 text-slate-600">{prod.category?.name || '-'}</td>
                      <td className="p-4 font-semibold text-slate-900">
                        {prod.discount_price ? (
                          <div className="flex flex-col">
                            <span className="text-primary">৳{prod.discount_price}</span>
                            <span className="text-xs text-slate-400 line-through">৳{prod.price}</span>
                          </div>
                        ) : (
                          <span>৳{prod.price}</span>
                        )}
                      </td>
                      <td className="p-4 text-slate-500">৳{prod.cost_price}</td>
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className={`font-semibold ${isOutOfStock ? 'text-red-600' : isLowStock ? 'text-amber-500' : 'text-slate-900'}`}>
                            {prod.stock_quantity} {prod.unit}s
                          </span>
                          {isOutOfStock ? (
                            <span className="text-[10px] uppercase font-bold text-red-600">Out of Stock</span>
                          ) : isLowStock ? (
                            <span className="text-[10px] uppercase font-bold text-amber-500">Low Stock Alert</span>
                          ) : null}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => toggleFeatured(prod)}
                          className="text-slate-400 hover:text-secondary transition-colors"
                        >
                          <Star className={`h-5 w-5 mx-auto ${prod.is_featured ? 'fill-secondary text-secondary' : ''}`} />
                        </button>
                      </td>
                      <td className="p-4">
                        <button onClick={() => toggleActive(prod)}>
                          <Badge variant={prod.is_active ? 'success' : 'outline'}>
                            {prod.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </button>
                      </td>
                      <td className="p-4 text-right space-x-1">
                        <Link href={`/admin/products/${prod.id}/edit`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-slate-500 hover:text-slate-800"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(prod.id)}
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
    </div>
  )
}
