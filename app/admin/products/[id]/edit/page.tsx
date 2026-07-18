'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ProductForm } from '@/components/admin/ProductForm'
import { Product } from '@/types'
import { Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function EditProductPage() {
  const params = useParams()
  const id = params.id as string
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function loadProduct() {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*, images:product_images(*)')
          .eq('id', id)
          .single()

        if (error) throw error
        setProduct(data)
      } catch (error: any) {
        toast.error('Failed to load product: ' + error.message)
      } finally {
        setLoading(false)
      }
    }

    if (id) loadProduct()
  }, [id])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center bg-white rounded-lg border border-slate-200">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="bg-red-50 text-red-800 p-6 rounded-lg border border-red-200 text-center">
        Product not found or has been deleted.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Edit Product</h2>
        <p className="text-sm text-muted-foreground">Modify details for &ldquo;{product.name}&rdquo;.</p>
      </div>

      <ProductForm initialData={product} productId={product.id} />
    </div>
  )
}
