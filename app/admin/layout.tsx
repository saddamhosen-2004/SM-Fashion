'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  List,
  ShoppingCart,
  LogOut,
  ChevronRight,
  Menu,
  Store,
  Archive,
  TrendingUp,
  CreditCard,
  BarChart2,
  Users,
  Image,
  Truck,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ToastProvider } from '@/components/providers/ToastProvider'
import toast from 'react-hot-toast'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function checkAdmin() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Access denied. Please log in.')
        router.push('/auth/login?redirectTo=/admin')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      if (!profile || (profile.role !== 'admin' && profile.role !== 'staff')) {
        toast.error('Access denied. Admins only.')
        router.push('/')
        return
      }

      setProfile(profile)
      setLoading(false)
    }
    checkAdmin()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    toast.success('Logged out successfully')
    router.push('/')
  }

  const menuItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/products', label: 'Products', icon: Package },
    { href: '/admin/categories', label: 'Categories', icon: List },
    { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
    { href: '/admin/inventory', label: 'Inventory', icon: Archive },
    { href: '/admin/suppliers', label: 'Suppliers', icon: Truck },
    { href: '/admin/purchases', label: 'Purchases', icon: TrendingUp },
    { href: '/admin/expenses', label: 'Expenses', icon: CreditCard },
    { href: '/admin/reports/sales', label: 'Sales Report', icon: BarChart2 },
    { href: '/admin/reports/profit-loss', label: 'P&L Statement', icon: BarChart2 },
    { href: '/admin/reports/balance-sheet', label: 'Balance Sheet', icon: BarChart2 },
    { href: '/admin/customers', label: 'Customers', icon: Users },
    { href: '/admin/banners', label: 'Banners', icon: Image },
  ]

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800">
      <ToastProvider />

      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } fixed inset-y-0 left-0 z-20 flex flex-col bg-slate-900 text-slate-200 transition-all duration-300 border-r border-slate-800`}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-800 shrink-0">
          <Link href="/admin" className="flex items-center gap-2 overflow-hidden">
            <span className="text-xl font-black text-primary truncate">
              SM <span className={`text-white font-semibold ${!sidebarOpen && 'hidden'}`}>Admin</span>
            </span>
          </Link>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white hidden md:block"
          >
            <ChevronRight className={`h-5 w-5 transition-transform duration-300 ${sidebarOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-primary text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className={`${!sidebarOpen && 'md:hidden'}`}>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 space-y-1 shrink-0">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <Store className="h-5 w-5 shrink-0" />
            <span className={`${!sidebarOpen && 'md:hidden'}`}>View Store</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:text-white hover:bg-red-950/30"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span className={`${!sidebarOpen && 'md:hidden'}`}>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${sidebarOpen ? 'md:pl-64' : 'md:pl-20'}`}>
        {/* Top Header */}
        <header className="flex h-16 items-center justify-between px-6 bg-white border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 md:hidden"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-lg font-semibold text-slate-800">SM Fashion Admin Panel</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex flex-col text-right hidden sm:block">
              <span className="text-sm font-medium text-slate-800">{profile?.full_name || 'Admin'}</span>
              <span className="text-xs text-muted-foreground uppercase">{profile?.role || 'admin'}</span>
            </div>
            <div className="h-9 w-9 rounded-full bg-primary text-white font-bold flex items-center justify-center border border-primary/20 shadow-sm">
              {profile?.full_name ? profile.full_name[0].toUpperCase() : 'A'}
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
