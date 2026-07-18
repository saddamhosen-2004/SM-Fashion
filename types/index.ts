export interface Profile {
  id: string
  full_name: string | null
  phone: string | null
  address: string | null
  role: 'customer' | 'admin' | 'staff'
  avatar_url: string | null
  created_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  parent_id: string | null
  image_url: string | null
  is_active: boolean
  created_at: string
  product_count?: number
  name_bn?: string | null
}

export interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  category_id: string | null
  price: number
  discount_price: number | null
  cost_price: number
  sku: string | null
  stock_quantity: number
  unit: string
  is_active: boolean
  is_featured: boolean
  low_stock_threshold: number
  created_at: string
  updated_at: string
  category?: Category | null
  images?: ProductImage[]
  name_bn?: string | null
  description_bn?: string | null
}

export interface ProductImage {
  id: string
  product_id: string
  url: string
  alt: string | null
  display_order: number
  is_primary: boolean
  created_at: string
}

export interface ShippingAddress {
  name: string
  phone: string
  address: string
  district: string
  division: string
}

export interface Order {
  id: string
  customer_id: string | null
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  total_amount: number
  discount_amount: number
  shipping_charge: number
  payment_status: 'paid' | 'unpaid' | 'partial'
  payment_method: 'cod' | 'bkash' | 'nagad' | 'bank'
  shipping_address: ShippingAddress
  notes: string | null
  created_at: string
  updated_at: string
  customer?: Profile | null
  items?: OrderItem[]
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string | null
  quantity: number
  unit_price: number
  total_price: number
  product?: Product | null
}

export interface Payment {
  id: string
  order_id: string
  amount: number
  method: string
  reference_no: string | null
  paid_at: string
}

export interface Expense {
  id: string
  title: string
  amount: number
  category: 'rent' | 'salary' | 'utility' | 'transport' | 'marketing' | 'other'
  date: string
  note: string | null
  created_at: string
}

export interface Supplier {
  id: string
  name: string
  phone: string | null
  email: string | null
  address: string | null
  note: string | null
  created_at: string
}

export interface Purchase {
  id: string
  supplier_id: string | null
  total_amount: number
  paid_amount: number
  due_amount: number
  invoice_no: string | null
  date: string
  note: string | null
  created_at: string
  supplier?: Supplier | null
  items?: PurchaseItem[]
}

export interface PurchaseItem {
  id: string
  purchase_id: string
  product_id: string | null
  quantity: number
  cost_per_unit: number
  total_cost: number
  product?: Product | null
}

export interface InventoryLog {
  id: string
  product_id: string
  quantity: number
  type: 'in' | 'out' | 'adjustment'
  reason: string | null
  created_at: string
  product?: Product | null
}

export interface Banner {
  id: string
  image_url: string
  link_url: string | null
  display_order: number
  is_active: boolean
  created_at: string
}
