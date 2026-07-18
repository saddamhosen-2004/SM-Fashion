import { createClient } from '@/lib/supabase/server'
import { Product, ProductImage } from '@/types'

export async function getProducts(options?: {
  categorySlug?: string
  categoryId?: string
  search?: string
  minPrice?: number
  maxPrice?: number
  sortBy?: 'newest' | 'price-low' | 'price-high' | 'popularity'
  adminOnly?: boolean
  limit?: number
}) {
  const supabase = await createClient()
  let query = supabase
    .from('products')
    .select('*, category:categories(*), images:product_images(*)')

  if (!options?.adminOnly) {
    query = query.eq('is_active', true)
  }

  if (options?.categoryId) {
    query = query.eq('category_id', options.categoryId)
  } else if (options?.categorySlug) {
    const { data: category } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', options.categorySlug)
      .maybeSingle()
    if (category) {
      // Fetch subcategories
      const { data: subcats } = await supabase
        .from('categories')
        .select('id')
        .eq('parent_id', category.id)
      
      if (subcats && subcats.length > 0) {
        const categoryIds = [category.id, ...subcats.map((c) => c.id)]
        query = query.in('category_id', categoryIds)
      } else {
        query = query.eq('category_id', category.id)
      }
    } else {
      return [] // Category not found
    }
  }

  if (options?.search) {
    query = query.or(`name.ilike.%${options.search}%,sku.ilike.%${options.search}%`)
  }

  if (options?.minPrice !== undefined) {
    query = query.gte('price', options.minPrice)
  }

  if (options?.maxPrice !== undefined) {
    query = query.lte('price', options.maxPrice)
  }

  // Sorting
  if (options?.sortBy === 'price-low') {
    query = query.order('price', { ascending: true })
  } else if (options?.sortBy === 'price-high') {
    query = query.order('price', { ascending: false })
  } else {
    // Default or newest
    query = query.order('created_at', { ascending: false })
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching products:', error)
    return []
  }

  return (data || []).map((prod: any) => {
    // Sort images by display order
    if (prod.images) {
      prod.images.sort((a: any, b: any) => a.display_order - b.display_order)
    }
    return prod
  }) as Product[]
}

export async function getProductById(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select('*, category:categories(*), images:product_images(*)')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    console.error('Error fetching product by id:', error)
    return null
  }

  if (data?.images) {
    data.images.sort((a: any, b: any) => a.display_order - b.display_order)
  }

  return data as Product
}

export async function getProductBySlug(slug: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select('*, category:categories(*), images:product_images(*)')
    .eq('slug', slug)
    .maybeSingle()

  if (error) {
    console.error('Error fetching product by slug:', error)
    return null
  }

  if (data?.images) {
    data.images.sort((a: any, b: any) => a.display_order - b.display_order)
  }

  return data as Product
}

export async function createProduct(
  product: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'images' | 'category'>,
  images: Omit<ProductImage, 'id' | 'product_id' | 'created_at'>[]
) {
  const supabase = await createClient()

  // 1. Insert product
  const { data: insertedProduct, error: productError } = await supabase
    .from('products')
    .insert([product])
    .select()
    .single()

  if (productError) {
    throw new Error(productError.message)
  }

  // 2. Insert images if any
  if (images && images.length > 0) {
    const imagesToInsert = images.map((img) => ({
      product_id: insertedProduct.id,
      url: img.url,
      alt: img.alt || '',
      display_order: img.display_order || 0,
      is_primary: img.is_primary || false,
    }))

    const { error: imagesError } = await supabase
      .from('product_images')
      .insert(imagesToInsert)

    if (imagesError) {
      // Soft fail or log - image insert failed but product was created
      console.error('Error inserting product images:', imagesError)
    }
  }

  return getProductById(insertedProduct.id)
}

export async function updateProduct(
  id: string,
  product: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at' | 'images' | 'category'>>,
  images?: Omit<ProductImage, 'id' | 'product_id' | 'created_at'>[]
) {
  const supabase = await createClient()

  // 1. Update product text info
  const { error: productError } = await supabase
    .from('products')
    .update({ ...product, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (productError) {
    throw new Error(productError.message)
  }

  // 2. Update images if provided (replace them)
  if (images !== undefined) {
    // Delete existing images first
    const { error: deleteError } = await supabase
      .from('product_images')
      .delete()
      .eq('product_id', id)

    if (deleteError) {
      console.error('Error deleting old images:', deleteError)
    }

    // Insert new ones
    if (images.length > 0) {
      const imagesToInsert = images.map((img) => ({
        product_id: id,
        url: img.url,
        alt: img.alt || '',
        display_order: img.display_order || 0,
        is_primary: img.is_primary || false,
      }))

      const { error: insertError } = await supabase
        .from('product_images')
        .insert(imagesToInsert)

      if (insertError) {
        console.error('Error inserting new images:', insertError)
      }
    }
  }

  return getProductById(id)
}

export async function deleteProduct(id: string) {
  const supabase = await createClient()
  
  // As per PRD: Delete Product (soft delete)
  const { error } = await supabase
    .from('products')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  return true
}
