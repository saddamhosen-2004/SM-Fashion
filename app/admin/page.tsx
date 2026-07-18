'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Product, Category, Order, ProductImage } from '@/types'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import {
  DollarSign,
  ShoppingBag,
  Clock,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Loader2,
  Package,
  List,
  Image as ImageIcon,
  Edit,
  Trash2,
  Plus,
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Truck
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function UnifiedAdminDashboard() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'categories' | 'banners' | 'orders'>('dashboard')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  // --- Core Lists States ---
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [banners, setBanners] = useState<any[]>([])
  const [orders, setOrders] = useState<Order[]>([])

  // --- KPI & Summary States ---
  const [todaySales, setTodaySales] = useState(0)
  const [totalOrders, setTotalOrders] = useState(0)
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0)
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([])
  const [weeklySalesData, setWeeklySalesData] = useState<{ day: string; amount: number }[]>([])

  // --- Search & Filter States ---
  const [productSearch, setProductSearch] = useState('')
  const [productCategoryFilter, setProductCategoryFilter] = useState('all')
  const [categorySearch, setCategorySearch] = useState('')
  const [orderSearch, setOrderSearch] = useState('')

  // --- Form Modal / Slider States ---
  const [isProductFormOpen, setIsProductFormOpen] = useState(false)
  const [editingProductId, setEditingProductId] = useState<string | null>(null)
  
  // Product Form Fields
  const [prodName, setProdName] = useState('')
  const [prodNameBn, setProdNameBn] = useState('')
  const [prodSlug, setProdSlug] = useState('')
  const [prodSku, setProdSku] = useState('')
  const [prodDescription, setProdDescription] = useState('')
  const [prodDescriptionBn, setProdDescriptionBn] = useState('')
  const [prodCategoryId, setProdCategoryId] = useState('')
  const [prodPrice, setProdPrice] = useState('0')
  const [prodDiscountPrice, setProdDiscountPrice] = useState('')
  const [prodCostPrice, setProdCostPrice] = useState('0')
  const [prodStock, setProdStock] = useState('0')
  const [prodUnit, setProdUnit] = useState('piece')
  const [prodThreshold, setProdThreshold] = useState('5')
  const [prodIsActive, setProdIsActive] = useState(true)
  const [prodIsFeatured, setProdIsFeatured] = useState(false)
  const [prodImageUrl, setProdImageUrl] = useState('') // Standard single image setup for quick uploads

  // Category Form Fields
  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false)
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [catName, setCatName] = useState('')
  const [catNameBn, setCatNameBn] = useState('')
  const [catSlug, setCatSlug] = useState('')
  const [catParentId, setCatParentId] = useState('null')
  const [catImageUrl, setCatImageUrl] = useState('')
  const [catIsActive, setCatIsActive] = useState(true)

  // Banner Form Fields
  const [isBannerFormOpen, setIsBannerFormOpen] = useState(false)
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null)
  const [bannerImageUrl, setBannerImageUrl] = useState('')
  const [bannerLinkUrl, setBannerLinkUrl] = useState('')
  const [bannerOrder, setBannerOrder] = useState('1')
  const [bannerIsActive, setBannerIsActive] = useState(true)

  // Order Details Modal
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false)

  useEffect(() => {
    fetchAllData()
  }, [])

  // Auto-generate product slug
  useEffect(() => {
    if (!editingProductId && prodName) {
      setProdSlug(prodName.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-'))
    }
  }, [prodName, editingProductId])

  // Auto-generate category slug
  useEffect(() => {
    if (!editingCategoryId && catName) {
      setCatSlug(catName.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-'))
    }
  }, [catName, editingCategoryId])

  const fetchAllData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchProducts(),
        fetchCategories(),
        fetchBanners(),
        fetchOrders()
      ])
    } catch (error) {
      console.error(error)
      toast.error('Failed to sync control center database!')
    } finally {
      setLoading(false)
    }
  }

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*, category:categories(*), images:product_images(*)')
      .order('created_at', { ascending: false })
    if (error) throw error
    setProducts(data || [])
  }

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*, products:products(count)')
      .order('name', { ascending: true })
    if (error) throw error
    setCategories((data || []).map((cat: any) => ({
      ...cat,
      product_count: cat.products?.[0]?.count || 0
    })) as Category[])
  }

  const fetchBanners = async () => {
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .order('display_order', { ascending: true })
    if (error) throw error
    setBanners(data || [])
  }

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*, customer:profiles(*), order_items(*, product:products(*))')
      .order('created_at', { ascending: false })
    if (error) throw error
    
    const allOrders = data || []
    setOrders(allOrders)

    // Calculate KPIs
    let revenue = 0
    let todayAmt = 0
    let pendingCount = 0
    const todayStr = new Date().toDateString()

    allOrders.forEach((o) => {
      revenue += o.total_amount
      if (o.status === 'pending') pendingCount++
      if (new Date(o.created_at).toDateString() === todayStr) {
        todayAmt += o.total_amount
      }
    })

    setTotalRevenue(revenue)
    setTotalOrders(allOrders.length)
    setTodaySales(todayAmt)
    setPendingOrdersCount(pendingCount)

    // Weekly sales logic
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - i)
      return d
    }).reverse()

    const weeklyData = last7Days.map((date) => {
      const dayStr = date.toLocaleDateString('en-US', { weekday: 'short' })
      const dateStr = date.toDateString()
      const amount = allOrders
        .filter((o) => new Date(o.created_at).toDateString() === dateStr)
        .reduce((sum, o) => sum + o.total_amount, 0)
      return { day: dayStr, amount }
    })
    setWeeklySalesData(weeklyData)
  }

  // Handle stock alerts
  useEffect(() => {
    const alerts = products.filter(p => p.stock_quantity <= p.low_stock_threshold)
    setLowStockProducts(alerts.slice(0, 5))
  }, [products])

  // --- PRODUCT CRUD HANDLERS ---
  const handleOpenProductNew = () => {
    setEditingProductId(null)
    setProdName('')
    setProdNameBn('')
    setProdSlug('')
    setProdSku('')
    setProdDescription('')
    setProdDescriptionBn('')
    setProdCategoryId(categories[0]?.id || '')
    setProdPrice('0')
    setProdDiscountPrice('')
    setProdCostPrice('0')
    setProdStock('0')
    setProdUnit('piece')
    setProdThreshold('5')
    setProdIsActive(true)
    setProdIsFeatured(false)
    setProdImageUrl('')
    setIsProductFormOpen(true)
  }

  const handleOpenProductEdit = (p: Product) => {
    setEditingProductId(p.id)
    setProdName(p.name)
    setProdNameBn((p as any).name_bn || '')
    setProdSlug(p.slug)
    setProdSku(p.sku || '')
    setProdDescription(p.description || '')
    setProdDescriptionBn((p as any).description_bn || '')
    setProdCategoryId(p.category_id || '')
    setProdPrice(p.price.toString())
    setProdDiscountPrice(p.discount_price?.toString() || '')
    setProdCostPrice(p.cost_price.toString())
    setProdStock(p.stock_quantity.toString())
    setProdUnit(p.unit)
    setProdThreshold(p.low_stock_threshold.toString())
    setProdIsActive(p.is_active)
    setProdIsFeatured(p.is_featured)
    setProdImageUrl(p.images?.[0]?.url || '')
    setIsProductFormOpen(true)
  }

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const priceNum = parseFloat(prodPrice)
    const discountNum = prodDiscountPrice ? parseFloat(prodDiscountPrice) : null
    const costNum = parseFloat(prodCostPrice)
    const stockNum = parseInt(prodStock)
    const thresholdNum = parseInt(prodThreshold)

    if (isNaN(priceNum) || isNaN(stockNum)) {
      toast.error('Name, price and stock are required!')
      return
    }

    try {
      const payload = {
        name: prodName,
        name_bn: prodNameBn || null,
        slug: prodSlug,
        sku: prodSku || null,
        description: prodDescription || null,
        description_bn: prodDescriptionBn || null,
        category_id: prodCategoryId || null,
        price: priceNum,
        discount_price: discountNum,
        cost_price: costNum,
        stock_quantity: stockNum,
        unit: prodUnit,
        low_stock_threshold: thresholdNum,
        is_active: prodIsActive,
        is_featured: prodIsFeatured
      }

      let returnedProductId = editingProductId

      if (editingProductId) {
        const { error } = await supabase
          .from('products')
          .update(payload)
          .eq('id', editingProductId)
        if (error) throw error
        toast.success('Product updated!')
      } else {
        const { data, error } = await supabase
          .from('products')
          .insert([payload])
          .select()
          .single()
        if (error) throw error
        returnedProductId = data.id
        toast.success('Product created!')
      }

      // Handle Image URL
      if (returnedProductId && prodImageUrl) {
        // Delete old primary images
        await supabase
          .from('product_images')
          .delete()
          .eq('product_id', returnedProductId)

        // Insert new image
        await supabase
          .from('product_images')
          .insert([{
            product_id: returnedProductId,
            url: prodImageUrl,
            is_primary: true,
            display_order: 1
          }])
      }

      setIsProductFormOpen(false)
      fetchProducts()
    } catch (err: any) {
      toast.error(err.message || 'Error saving product')
    }
  }

  const handleProductDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return
    try {
      const { error } = await supabase.from('products').delete().eq('id', id)
      if (error) throw error
      toast.success('Product deleted!')
      fetchProducts()
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete product')
    }
  }

  // --- CATEGORY CRUD HANDLERS ---
  const handleOpenCategoryNew = () => {
    setEditingCategoryId(null)
    setCatName('')
    setCatNameBn('')
    setCatSlug('')
    setCatParentId('null')
    setCatImageUrl('')
    setCatIsActive(true)
    setIsCategoryFormOpen(true)
  }

  const handleOpenCategoryEdit = (c: Category) => {
    setEditingCategoryId(c.id)
    setCatName(c.name)
    setCatNameBn((c as any).name_bn || '')
    setCatSlug(c.slug)
    setCatParentId(c.parent_id || 'null')
    setCatImageUrl(c.image_url || '')
    setCatIsActive(c.is_active)
    setIsCategoryFormOpen(true)
  }

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!catName || !catSlug) return

    try {
      const payload = {
        name: catName,
        name_bn: catNameBn || null,
        slug: catSlug,
        parent_id: catParentId === 'null' ? null : catParentId,
        image_url: catImageUrl || null,
        is_active: catIsActive
      }

      if (editingCategoryId) {
        const { error } = await supabase
          .from('categories')
          .update(payload)
          .eq('id', editingCategoryId)
        if (error) throw error
        toast.success('Category updated!')
      } else {
        const { error } = await supabase
          .from('categories')
          .insert([payload])
        if (error) throw error
        toast.success('Category created!')
      }

      setIsCategoryFormOpen(false)
      fetchCategories()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleCategoryDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category? (Products under it will remain but won\'t have a category)')) return
    try {
      const { error } = await supabase.from('categories').delete().eq('id', id)
      if (error) throw error
      toast.success('Category removed!')
      fetchCategories()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  // --- BANNER CRUD HANDLERS ---
  const handleOpenBannerNew = () => {
    setEditingBannerId(null)
    setBannerImageUrl('')
    setBannerLinkUrl('/products')
    setBannerOrder('1')
    setBannerIsActive(true)
    setIsBannerFormOpen(true)
  }

  const handleOpenBannerEdit = (b: any) => {
    setEditingBannerId(b.id)
    setBannerImageUrl(b.image_url)
    setBannerLinkUrl(b.link_url || '')
    setBannerOrder(b.display_order.toString())
    setBannerIsActive(b.is_active)
    setIsBannerFormOpen(true)
  }

  const handleBannerSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!bannerImageUrl) return

    try {
      const payload = {
        image_url: bannerImageUrl,
        link_url: bannerLinkUrl || null,
        display_order: parseInt(bannerOrder) || 1,
        is_active: bannerIsActive
      }

      if (editingBannerId) {
        const { error } = await supabase
          .from('banners')
          .update(payload)
          .eq('id', editingBannerId)
        if (error) throw error
        toast.success('Banner updated!')
      } else {
        const { error } = await supabase
          .from('banners')
          .insert([payload])
        if (error) throw error
        toast.success('Banner created!')
      }

      setIsBannerFormOpen(false)
      fetchBanners()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleBannerDelete = async (id: string) => {
    if (!confirm('Delete this banner?')) return
    try {
      const { error } = await supabase.from('banners').delete().eq('id', id)
      if (error) throw error
      toast.success('Banner deleted!')
      fetchBanners()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  // --- ORDER HANDLERS ---
  const handleOrderDetails = (order: Order) => {
    setSelectedOrder(order)
    setIsOrderModalOpen(true)
  }

  const handleOrderStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId)
      if (error) throw error
      toast.success(`Order set to ${newStatus}`)
      fetchOrders()
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus })
      }
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'pending': return 'warning'
      case 'processing': return 'default'
      case 'shipped': return 'secondary'
      case 'delivered': return 'success'
      case 'cancelled': return 'danger'
      default: return 'outline'
    }
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Filter lists
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(productSearch.toLowerCase()) || 
                          (p.sku && p.sku.toLowerCase().includes(productSearch.toLowerCase()))
    const matchesCategory = productCategoryFilter === 'all' || p.category_id === productCategoryFilter
    return matchesSearch && matchesCategory
  })

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(categorySearch.toLowerCase()) ||
    c.slug.toLowerCase().includes(categorySearch.toLowerCase())
  )

  const filteredOrders = orders.filter(o => {
    const shipping = o.shipping_address as any
    return o.id.toLowerCase().includes(orderSearch.toLowerCase()) ||
           (shipping?.name && shipping.name.toLowerCase().includes(orderSearch.toLowerCase())) ||
           (shipping?.phone && shipping.phone.includes(orderSearch))
  })

  const maxWeeklyAmount = Math.max(...weeklySalesData.map((d) => d.amount), 1000)

  return (
    <div className="space-y-6">
      
      {/* Title & Control Navigation */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900">Control Center</h2>
          <p className="text-xs text-muted-foreground">Manage products, categories, orders, and banners from a single dashboard.</p>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-wrap gap-1 bg-slate-100 p-1.5 rounded-lg border border-slate-200">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
              activeTab === 'dashboard' ? 'bg-white text-primary shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📊 Overview
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
              activeTab === 'products' ? 'bg-white text-primary shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📦 Products ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
              activeTab === 'categories' ? 'bg-white text-primary shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📂 Categories ({categories.length})
          </button>
          <button
            onClick={() => setActiveTab('banners')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
              activeTab === 'banners' ? 'bg-white text-primary shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🖼️ Banners ({banners.length})
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
              activeTab === 'orders' ? 'bg-white text-primary shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🛒 Orders ({orders.length})
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 📊 TAB 1: DASHBOARD OVERVIEW */}
      {/* ======================================================== */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Today&rsquo;s Sales</span>
                <h3 className="text-xl font-bold text-slate-800">৳{todaySales}</h3>
              </div>
              <div className="h-10 w-10 bg-primary/10 text-primary rounded-full flex items-center justify-center"><TrendingUp className="h-5 w-5" /></div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Orders</span>
                <h3 className="text-xl font-bold text-slate-800">{totalOrders}</h3>
              </div>
              <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center"><ShoppingBag className="h-5 w-5" /></div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Revenue</span>
                <h3 className="text-xl font-bold text-slate-800">৳{totalRevenue}</h3>
              </div>
              <div className="h-10 w-10 bg-green-50 text-green-600 rounded-full flex items-center justify-center"><DollarSign className="h-5 w-5" /></div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending Orders</span>
                <h3 className="text-xl font-bold text-slate-800">{pendingOrdersCount}</h3>
              </div>
              <div className="h-10 w-10 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center"><Clock className="h-5 w-5" /></div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Weekly Revenue Trends</h4>
              <div className="h-48 w-full flex flex-col justify-between">
                <div className="flex-1 flex items-end justify-between px-2 gap-4 pb-2 border-b border-slate-100">
                  {weeklySalesData.map((data, index) => {
                    const heightPercent = `${(data.amount / maxWeeklyAmount) * 90 + 5}%`
                    return (
                      <div key={index} className="flex-1 flex flex-col items-center gap-2 group relative">
                        <div className="text-[9px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity absolute -top-6 bg-primary/10 text-primary px-1.5 py-0.5 rounded shadow-sm">
                          ৳{data.amount}
                        </div>
                        <div style={{ height: heightPercent }} className="w-full bg-primary/20 hover:bg-primary rounded-t-sm transition-all duration-300 cursor-pointer" />
                      </div>
                    )
                  })}
                </div>
                <div className="flex justify-between text-[10px] font-bold text-slate-500 pt-2 px-2">
                  {weeklySalesData.map((data, index) => <span key={index} className="flex-1 text-center">{data.day}</span>)}
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5"><AlertTriangle className="h-4 w-4 text-amber-500" /> Stock Alerts</h4>
              {lowStockProducts.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">All products fully stocked!</div>
              ) : (
                <div className="space-y-3">
                  {lowStockProducts.map((p) => (
                    <div key={p.id} className="flex items-center justify-between gap-3 text-xs border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                      <div>
                        <span className="font-bold text-slate-800 block truncate">{p.name}</span>
                        <span className="text-[9px] text-muted-foreground">SKU: {p.sku || 'N/A'}</span>
                      </div>
                      <Badge variant={p.stock_quantity <= 0 ? 'danger' : 'warning'}>{p.stock_quantity} left</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 📦 TAB 2: PRODUCTS MANAGEMENT */}
      {/* ======================================================== */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm items-center justify-between">
            <div className="flex flex-1 gap-2 w-full max-w-lg">
              <div className="relative flex-1">
                <Input
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search products or SKU..."
                  className="pl-9 h-10 text-xs"
                />
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              </div>
              <select
                value={productCategoryFilter}
                onChange={(e) => setProductCategoryFilter(e.target.value)}
                className="border border-input bg-background rounded-lg px-3 text-xs h-10 outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <Button onClick={handleOpenProductNew} className="flex items-center gap-1.5 h-10 px-4 text-xs font-bold rounded-lg w-full sm:w-auto shrink-0">
              <Plus className="h-4 w-4" /> Add Product
            </Button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
                    <th className="p-4">Product Details</th>
                    <th className="p-4">SKU</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Price</th>
                    <th className="p-4">Stock</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map((p) => {
                    const primaryImg = p.images?.[0]?.url || '/placeholder-product.jpg'
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 flex items-center gap-3">
                          <img src={primaryImg} alt={p.name} className="h-10 w-10 rounded object-cover border border-slate-100" />
                          <div>
                            <span className="font-bold text-slate-800 block">{p.name}</span>
                            <span className="text-[10px] text-slate-400">{(p as any).name_bn || ''}</span>
                          </div>
                        </td>
                        <td className="p-4 font-mono font-semibold text-slate-600">{p.sku || '-'}</td>
                        <td className="p-4 text-slate-700 font-medium">{p.category?.name || '-'}</td>
                        <td className="p-4">
                          <span className="font-bold text-slate-800">৳{p.price}</span>
                          {p.discount_price && <span className="block text-[10px] text-slate-400 line-through">৳{p.discount_price}</span>}
                        </td>
                        <td className="p-4">
                          <Badge variant={p.stock_quantity <= p.low_stock_threshold ? 'warning' : 'outline'}>
                            {p.stock_quantity} left
                          </Badge>
                        </td>
                        <td className="p-4">
                          <Badge variant={p.is_active ? 'success' : 'outline'}>{p.is_active ? 'Active' : 'Draft'}</Badge>
                        </td>
                        <td className="p-4 text-right space-x-1">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenProductEdit(p)} className="text-slate-500 hover:text-slate-800"><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleProductDelete(p.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50"><Trash2 className="h-4 w-4" /></Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 📂 TAB 3: CATEGORIES MANAGEMENT */}
      {/* ======================================================== */}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm items-center justify-between">
            <div className="relative flex-1 max-w-md w-full">
              <Input
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                placeholder="Search categories..."
                className="pl-9 h-10 text-xs"
              />
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            </div>

            <Button onClick={handleOpenCategoryNew} className="flex items-center gap-1.5 h-10 px-4 text-xs font-bold rounded-lg w-full sm:w-auto shrink-0">
              <Plus className="h-4 w-4" /> Add Category
            </Button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
                    <th className="p-4">Name (English / Bangla)</th>
                    <th className="p-4">Slug</th>
                    <th className="p-4">Parent Category</th>
                    <th className="p-4 text-center">Products Count</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCategories.map((c) => {
                    const parent = categories.find(p => p.id === c.parent_id)
                    return (
                      <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 font-bold text-slate-800">
                          {c.name} <span className="text-[10px] text-slate-400 block font-normal">{(c as any).name_bn || '-'}</span>
                        </td>
                        <td className="p-4 font-mono text-slate-500">{c.slug}</td>
                        <td className="p-4 text-slate-650 font-medium">{parent ? parent.name : '-'}</td>
                        <td className="p-4 text-center font-bold">{c.product_count}</td>
                        <td className="p-4">
                          <Badge variant={c.is_active ? 'success' : 'outline'}>{c.is_active ? 'Visible' : 'Hidden'}</Badge>
                        </td>
                        <td className="p-4 text-right space-x-1">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenCategoryEdit(c)} className="text-slate-500 hover:text-slate-800"><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleCategoryDelete(c.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50"><Trash2 className="h-4 w-4" /></Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 🖼️ TAB 4: BANNERS MANAGEMENT */}
      {/* ======================================================== */}
      {activeTab === 'banners' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <Button onClick={handleOpenBannerNew} className="flex items-center gap-1.5 h-10 px-4 text-xs font-bold rounded-lg">
              <Plus className="h-4 w-4" /> Add Banner Slide
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {banners.map((b) => (
              <div key={b.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col group">
                <div className="relative aspect-[21/9] bg-slate-900 border-b border-slate-100 overflow-hidden">
                  <img src={b.image_url} alt="Slider Image" className="w-full h-full object-cover" />
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="outline" size="icon" onClick={() => handleOpenBannerEdit(b)} className="h-7 w-7 rounded bg-white"><Edit className="h-3.5 w-3.5" /></Button>
                    <Button variant="outline" size="icon" onClick={() => handleBannerDelete(b.id)} className="h-7 w-7 rounded bg-white text-red-550"><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
                <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                  <div className="text-xs space-y-1">
                    <div className="font-bold text-slate-800 truncate">Link: {b.link_url || 'No Destination'}</div>
                    <div className="text-[10px] text-slate-400">Display Order: {b.display_order}</div>
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <Badge variant={b.is_active ? 'success' : 'outline'}>{b.is_active ? 'Active' : 'Inactive'}</Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 🛒 TAB 5: ORDERS MANAGEMENT */}
      {/* ======================================================== */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="relative max-w-md w-full">
              <Input
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                placeholder="Search orders (ID, name, phone)..."
                className="pl-9 h-10 text-xs"
              />
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
                    <th className="p-4">Order ID</th>
                    <th className="p-4">Customer Details</th>
                    <th className="p-4">Method</th>
                    <th className="p-4">Total Amount</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.map((o) => {
                    const shipping = o.shipping_address as any
                    return (
                      <tr key={o.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 font-mono font-bold text-slate-900">#{o.id.substring(0, 8).toUpperCase()}</td>
                        <td className="p-4">
                          <div className="font-bold text-slate-800">{shipping?.name || 'Guest'}</div>
                          <div className="text-[10px] text-slate-400">{shipping?.phone || ''}</div>
                        </td>
                        <td className="p-4 font-bold text-slate-500 uppercase text-[10px]">{o.payment_method}</td>
                        <td className="p-4 font-bold text-slate-900">৳{o.total_amount}</td>
                        <td className="p-4">
                          <select
                            value={o.status}
                            onChange={(e) => handleOrderStatusUpdate(o.id, e.target.value)}
                            className="text-[10px] font-bold border border-slate-200 rounded-md p-1 outline-none focus:ring-1 focus:ring-primary bg-slate-50"
                          >
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td className="p-4 text-right">
                          <Button variant="ghost" size="sm" onClick={() => handleOrderDetails(o)} className="text-primary text-[10px] font-black h-8 hover:bg-slate-100 flex items-center gap-1.5 ml-auto">
                            <Eye className="h-3.5 w-3.5" /> Details
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: PRODUCT FORM */}
      {/* ======================================================== */}
      {isProductFormOpen && (
        <div className="fixed inset-0 bg-slate-950/40 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h3 className="text-base font-black text-slate-900">{editingProductId ? 'Edit Product' : 'Add New Product'}</h3>
              <button onClick={() => setIsProductFormOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold text-sm">✕</button>
            </div>
            
            <form onSubmit={handleProductSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Product Name (English)" value={prodName} onChange={(e) => setProdName(e.target.value)} required />
                <Input label="Product Name (Bangla)" value={prodNameBn} onChange={(e) => setProdNameBn(e.target.value)} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input label="Slug (URL Key)" value={prodSlug} onChange={(e) => setProdSlug(e.target.value)} required />
                <Input label="SKU (Item Code)" value={prodSku} onChange={(e) => setProdSku(e.target.value)} />
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Category</label>
                  <select
                    value={prodCategoryId}
                    onChange={(e) => setProdCategoryId(e.target.value)}
                    className="w-full border border-slate-200 bg-background rounded-lg px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary"
                    required
                  >
                    <option value="" disabled>Select category...</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Input label="Regular Price (৳)" type="number" value={prodPrice} onChange={(e) => setProdPrice(e.target.value)} required />
                <Input label="Discount Price (৳)" type="number" value={prodDiscountPrice} onChange={(e) => setProdDiscountPrice(e.target.value)} />
                <Input label="Cost Price (৳)" type="number" value={prodCostPrice} onChange={(e) => setProdCostPrice(e.target.value)} required />
                <Input label="Stock Quantity" type="number" value={prodStock} onChange={(e) => setProdStock(e.target.value)} required />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Stock Unit</label>
                  <select
                    value={prodUnit}
                    onChange={(e) => setProdUnit(e.target.value)}
                    className="w-full border border-slate-200 bg-background rounded-lg px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="piece">Piece</option>
                    <option value="kg">Kilogram (kg)</option>
                    <option value="yard">Yard</option>
                    <option value="pack">Pack</option>
                  </select>
                </div>
                <Input label="Low Stock Alert Threshold" type="number" value={prodThreshold} onChange={(e) => setProdThreshold(e.target.value)} required />
                <Input label="Image URL" value={prodImageUrl} onChange={(e) => setProdImageUrl(e.target.value)} placeholder="https://..." />
              </div>

              <Textarea label="Product Description (English)" value={prodDescription} onChange={(e) => setProdDescription(e.target.value)} rows={3} />
              <Textarea label="Product Description (Bangla)" value={prodDescriptionBn} onChange={(e) => setProdDescriptionBn(e.target.value)} rows={3} />

              <div className="flex gap-6 border-t border-slate-100 pt-4">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <input type="checkbox" checked={prodIsActive} onChange={(e) => setProdIsActive(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-primary" />
                  Is Active (Visible on storefront)
                </label>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <input type="checkbox" checked={prodIsFeatured} onChange={(e) => setProdIsFeatured(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-primary" />
                  Is Featured (Shows on Homepage slider)
                </label>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 shrink-0">
                <Button type="button" variant="outline" onClick={() => setIsProductFormOpen(false)} className="text-xs">Cancel</Button>
                <Button type="submit" className="text-xs">Save Product</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CATEGORY FORM */}
      {/* ======================================================== */}
      {isCategoryFormOpen && (
        <div className="fixed inset-0 bg-slate-950/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900">{editingCategoryId ? 'Edit Category' : 'Create Category'}</h3>
              <button onClick={() => setIsCategoryFormOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold text-sm">✕</button>
            </div>
            
            <form onSubmit={handleCategorySubmit} className="p-6 space-y-4">
              <Input label="Category Name (English)" value={catName} onChange={(e) => setCatName(e.target.value)} required />
              <Input label="Category Name (Bangla)" value={catNameBn} onChange={(e) => setCatNameBn(e.target.value)} />
              <Input label="Slug" value={catSlug} onChange={(e) => setCatSlug(e.target.value)} required />
              
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Parent Category</label>
                <select
                  value={catParentId}
                  onChange={(e) => setCatParentId(e.target.value)}
                  className="w-full border border-slate-200 bg-background rounded-lg px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="null">None (Root Category)</option>
                  {categories
                    .filter(c => c.id !== editingCategoryId)
                    .map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                  }
                </select>
              </div>

              <Input label="Image URL (Optional)" value={catImageUrl} onChange={(e) => setCatImageUrl(e.target.value)} />

              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 pt-2">
                <input type="checkbox" checked={catIsActive} onChange={(e) => setCatIsActive(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-primary" />
                Active in Store Navigation
              </label>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsCategoryFormOpen(false)} className="text-xs">Cancel</Button>
                <Button type="submit" className="text-xs">Save Category</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: BANNER FORM */}
      {/* ======================================================== */}
      {isBannerFormOpen && (
        <div className="fixed inset-0 bg-slate-950/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900">{editingBannerId ? 'Edit Banner' : 'Create Banner Slide'}</h3>
              <button onClick={() => setIsBannerFormOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold text-sm">✕</button>
            </div>
            
            <form onSubmit={handleBannerSubmit} className="p-6 space-y-4">
              <Input label="Image URL" value={bannerImageUrl} onChange={(e) => setBannerImageUrl(e.target.value)} required />
              <Input label="Link Destination URL" value={bannerLinkUrl} onChange={(e) => setBannerLinkUrl(e.target.value)} />
              <Input label="Display Order" type="number" value={bannerOrder} onChange={(e) => setBannerOrder(e.target.value)} required />

              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 pt-2">
                <input type="checkbox" checked={bannerIsActive} onChange={(e) => setBannerIsActive(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-primary" />
                Is Active (Show in Hero Slider)
              </label>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsBannerFormOpen(false)} className="text-xs">Cancel</Button>
                <Button type="submit" className="text-xs">Save Slide</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ORDER DETAILS */}
      {/* ======================================================== */}
      {isOrderModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-slate-950/40 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-slate-100 overflow-hidden max-h-[85vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h3 className="text-base font-bold text-slate-900">
                Order details: <span className="font-mono text-primary font-black">#{selectedOrder.id.substring(0, 8).toUpperCase()}</span>
              </h3>
              <button onClick={() => setIsOrderModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold text-sm">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Order Status & Info */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Placed On</span>
                  <span className="text-xs font-bold text-slate-800">{new Date(selectedOrder.created_at).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Payment Method</span>
                  <span className="text-xs font-bold text-slate-800 uppercase">{selectedOrder.payment_method}</span>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Delivery Details</h4>
                <div className="text-xs space-y-1 bg-white p-3 rounded-lg border border-slate-200">
                  <p><strong>Name</strong>: {(selectedOrder.shipping_address as any)?.name}</p>
                  <p><strong>Phone</strong>: {(selectedOrder.shipping_address as any)?.phone}</p>
                  <p><strong>Address</strong>: {(selectedOrder.shipping_address as any)?.address}</p>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Order Items</h4>
                <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-650">
                        <th className="p-3">Product Name</th>
                        <th className="p-3 text-center">Qty</th>
                        <th className="p-3 text-right">Price</th>
                        <th className="p-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.order_items?.map((item: any) => (
                        <tr key={item.id} className="border-b border-slate-100 last:border-0">
                          <td className="p-3 font-semibold text-slate-800">
                            {item.product?.name || 'Deleted Product'}
                            {item.size && <span className="block text-[9px] text-muted-foreground">Size: {item.size}</span>}
                            {item.color && <span className="block text-[9px] text-muted-foreground">Color: {item.color}</span>}
                          </td>
                          <td className="p-3 text-center font-bold text-slate-800">{item.quantity}</td>
                          <td className="p-3 text-right text-slate-700">৳{item.price}</td>
                          <td className="p-3 text-right font-bold text-slate-800">৳{item.price * item.quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals */}
              <div className="flex justify-end pt-4 border-t border-slate-100 text-xs">
                <div className="w-64 space-y-1">
                  <div className="flex justify-between font-bold text-slate-800">
                    <span>Order Total:</span>
                    <span>৳{selectedOrder.total_amount}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Change Status:</span>
                <select
                  value={selectedOrder.status}
                  onChange={(e) => handleOrderStatusUpdate(selectedOrder.id, e.target.value)}
                  className="text-xs font-bold border border-slate-200 rounded-md p-1 outline-none bg-white"
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <Button size="sm" onClick={() => setIsOrderModalOpen(false)} className="text-xs">Close</Button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
