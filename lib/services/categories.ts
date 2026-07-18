import { createClient } from '@/lib/supabase/server'
import { Category } from '@/types'

export async function getCategories() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('categories')
    .select('*, products:products(count)')
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching categories:', error)
    return []
  }

  // Format count
  return (data || []).map((cat: any) => ({
    ...cat,
    product_count: cat.products?.[0]?.count || 0,
  })) as Category[]
}

export async function createCategory(category: Omit<Category, 'id' | 'created_at'>) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('categories')
    .insert([category])
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as Category
}

export async function updateCategory(id: string, category: Partial<Omit<Category, 'id' | 'created_at'>>) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('categories')
    .update(category)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as Category
}

export async function deleteCategory(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  return true
}
