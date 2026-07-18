import Link from 'next/link'
import { Mail, Phone, MapPin } from 'lucide-react'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="w-full bg-slate-950 text-slate-100 border-t border-slate-800">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-4">
            <span className="text-2xl font-black tracking-tight text-primary">
              SM <span className="text-white font-semibold">Fashion</span>
            </span>
            <p className="text-sm text-slate-300">
              Your destination for authentic, premium clothing and accessories in Bangladesh. Quality fabrics, trendsetting designs, and exceptional service.
            </p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-primary transition-colors text-slate-300" aria-label="Facebook">
                <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1V12h3v3h-3v6.8c4.56-.93 8-4.96 8-9.8z"/>
                </svg>
              </a>
              <a href="#" className="hover:text-primary transition-colors text-slate-300" aria-label="Instagram">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                </svg>
              </a>
              <a href="#" className="hover:text-primary transition-colors text-slate-300" aria-label="Twitter">
                <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-bold uppercase text-white tracking-wider mb-4">Shop Categories</h3>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>
                <Link href="/products?category=panjabi" className="hover:text-white transition-colors">Panjabi</Link>
              </li>
              <li>
                <Link href="/products?category=sharee" className="hover:text-white transition-colors">Sharee</Link>
              </li>
              <li>
                <Link href="/products?category=salwar-kameez" className="hover:text-white transition-colors">Salwar Kameez</Link>
              </li>
              <li>
                <Link href="/products" className="hover:text-white transition-colors">All Products</Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-sm font-bold uppercase text-white tracking-wider mb-4">Links</h3>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>
                <Link href="/cart" className="hover:text-white transition-colors">Shopping Cart</Link>
              </li>
              <li>
                <Link href="/checkout" className="hover:text-white transition-colors">Checkout</Link>
              </li>
              <li>
                <Link href="/account/orders" className="hover:text-white transition-colors">Order Tracking</Link>
              </li>
              <li>
                <Link href="/auth/login" className="hover:text-white transition-colors">Sign In</Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h3 className="text-sm font-bold uppercase text-white tracking-wider mb-4">Contact Us</h3>
            <ul className="space-y-3 text-sm text-slate-300">
              <li className="flex items-start gap-2">
                <MapPin className="h-5 w-5 text-primary shrink-0" />
                <span>Sector 11, Uttara, Dhaka - 1230, Bangladesh</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-primary shrink-0" />
                <span>+880 1700-000000</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary shrink-0" />
                <span>info@smfashion.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-800 text-center text-xs text-slate-400 space-y-1">
          <p>© {currentYear} SM Fashion. All rights reserved.</p>
          <p className="text-slate-300 font-semibold">Developed with 💙 by Saddam Bin Mazid</p>
        </div>
      </div>
    </footer>
  )
}
