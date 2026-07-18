'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { ShoppingCart, User, Search, Menu, X, LogOut, ChevronDown } from 'lucide-react'
import { useCartStore } from '@/lib/store/cart'
import { useLanguage } from '@/components/providers/LanguageProvider'
import { createClient } from '@/lib/supabase/client'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
import toast from 'react-hot-toast'

export function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const cartItemsCount = useCartStore((state) => state.getTotalItems())
  const supabase = createClient()

  useEffect(() => {
    async function getSession() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        setProfile(profile)
      }
      setLoading(false)
    }

    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = session?.user ?? null
        setUser(currentUser)
        if (currentUser) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .single()
          setProfile(profile)
        } else {
          setProfile(null)
        }
        setLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    toast.success('Logged out successfully')
    router.push('/')
  }

  const { locale, setLocale, t } = useLanguage()

  const navLinks = [
    { href: '/', label: t('nav.home') },
    { href: '/products', label: t('nav.products') },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border glass shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-black tracking-tight text-primary">
              SM <span className="text-foreground font-semibold">Fashion</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  pathname === link.href ? 'text-primary font-semibold' : 'text-muted-foreground'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="hidden sm:flex flex-1 max-w-md relative">
            <input
              type="search"
              placeholder="Search products, SKUs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 rounded-full border border-input bg-background pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            />
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-muted-foreground" />
          </form>

          {/* Icons & Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Language Switcher */}
            <button
              onClick={() => setLocale(locale === 'bn' ? 'en' : 'bn')}
              className="text-xs font-bold px-2.5 py-1 border border-slate-200 rounded-full hover:bg-slate-100 transition-all flex items-center gap-1 cursor-pointer shrink-0 h-8"
              title={locale === 'bn' ? 'Switch to English' : 'বাংলায় দেখুন'}
            >
              <span className={locale === 'bn' ? 'text-primary font-black' : 'text-slate-400'}>বাং</span>
              <span className="text-slate-350 font-normal">|</span>
              <span className={locale === 'en' ? 'text-primary font-black' : 'text-slate-400'}>EN</span>
            </button>

            {/* Cart Icon */}
            <Link href="/cart" className="relative p-2 hover:bg-muted rounded-full transition-colors">
              <ShoppingCart className="h-6 w-6 text-foreground" />
              {mounted && cartItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-secondary-foreground text-xs font-bold shadow-sm">
                  {cartItemsCount}
                </span>
              )}
            </Link>

            {/* User Dropdown */}
            {loading ? (
              <div className="h-9 w-9 rounded-full bg-muted-foreground/15 animate-pulse" />
            ) : user ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-1 p-1 hover:bg-muted rounded-full transition-colors focus:outline-none"
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                    {profile?.full_name ? profile.full_name[0].toUpperCase() : 'U'}
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground hidden sm:block" />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-lg border border-border bg-card p-1 shadow-lg z-50">
                    <div className="px-3 py-2 border-b border-border text-xs text-muted-foreground">
                      Signed in as <p className="font-semibold text-foreground truncate">{profile?.full_name || user.email}</p>
                    </div>
                    {profile?.role === 'admin' || profile?.role === 'staff' ? (
                      <Link
                        href="/admin"
                        onClick={() => setDropdownOpen(false)}
                        className="block w-full text-left px-3 py-2 text-sm text-foreground hover:bg-muted rounded-md transition-colors"
                      >
                        Admin Panel
                      </Link>
                    ) : null}
                    <Link
                      href="/account"
                      onClick={() => setDropdownOpen(false)}
                      className="block w-full text-left px-3 py-2 text-sm text-foreground hover:bg-muted rounded-md transition-colors"
                    >
                      My Profile
                    </Link>
                    <Link
                      href="/account/orders"
                      onClick={() => setDropdownOpen(false)}
                      className="block w-full text-left px-3 py-2 text-sm text-foreground hover:bg-muted rounded-md transition-colors"
                    >
                      My Orders
                    </Link>
                    <button
                      onClick={() => {
                        setDropdownOpen(false)
                        handleLogout()
                      }}
                      className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-danger hover:bg-danger/10 rounded-md transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/auth/login">
                <Button size="sm" variant="default" className="rounded-full">
                  <User className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">{t('nav.login')}</span>
                </Button>
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 hover:bg-muted rounded-full md:hidden"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="md:hidden border-t border-border bg-card px-4 py-3 space-y-3 shadow-inner">
          <form onSubmit={handleSearch} className="relative w-full">
            <input
              type="search"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 rounded-full border border-input bg-background pl-10 pr-4 text-sm"
            />
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
          </form>

          <nav className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-muted ${
                  pathname === link.href ? 'text-primary font-bold bg-primary/5' : 'text-foreground'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  )
}
