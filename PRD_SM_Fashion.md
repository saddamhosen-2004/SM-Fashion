# Product Requirements Document (PRD)
## SM Fashion — E-Commerce Website

| | |
|---|---|
| **Project** | SM Fashion — E-Commerce Website |
| **Client** | SM Fashion |
| **Type** | B2C E-Commerce |
| **Version** | 1.1 |
| **Date** | June 2026 |
| **Tech Stack** | Next.js · Tailwind CSS · Supabase · ImageKit.io · GitHub · Vercel · next-intl |

---

## 1. Project Overview

### 1.1 Summary
A full-featured e-commerce web application built for **SM Fashion** — a Bangladeshi clothing store. The website will consist of a public-facing storefront and a powerful admin panel. From the admin panel, everything — products, categories, orders, customers, and inventory — can be managed. Business income, expenses, and profit/loss reports will all be available in real time.

### 1.2 Goals
- Customers can browse and purchase products online
- The admin can manage the entire business from a single dashboard
- Complete records of sales, purchases, and profit/loss will be maintained
- The website will be mobile-friendly, fast, and secure
- The public website will support both Bangla and English — customers can switch languages freely

### 1.3 Target Users

| User Type | Description |
|---|---|
| Customer | Visits the website and purchases products |
| Admin / Owner | Manages the entire system |
| Staff (Optional) | Processes orders with limited access |

---

## 2. Tech Stack Details

| Technology | Use Case |
|---|---|
| **Next.js 14+ (App Router)** | Frontend + Backend (API Routes / Server Actions) |
| **Tailwind CSS** | UI Styling |
| **Supabase** | Database (PostgreSQL), Auth, Realtime, Storage |
| **ImageKit.io** | Product image upload, optimization, CDN delivery |
| **next-intl** | Internationalization (Bangla / English language support) |
| **GitHub** | Version control |
| **Vercel** | Hosting & Deployment |

---

## 3. Database Schema (Supabase)

### 3.1 Core Tables

```
users           → auth.users (Supabase Auth)
profiles        → user details (name, phone, address, role)
categories      → product categories
products        → product listings
product_images  → multiple images per product
inventory       → stock tracking per product/variant
orders          → customer orders
order_items     → items inside each order
payments        → payment records
expenses        → business expenses
suppliers       → supplier/vendor info
purchases       → stock purchases from suppliers
purchase_items  → items inside each purchase
```

### 3.2 Key Fields

**products**
```
id, name, slug, description, category_id,
price, discount_price, cost_price,
sku, stock_quantity, unit,
is_active, is_featured,
created_at, updated_at
```

**orders**
```
id, customer_id, status (pending/processing/shipped/delivered/cancelled),
total_amount, discount_amount, shipping_charge,
payment_status (paid/unpaid/partial),
payment_method (cod/bkash/nagad/bank),
shipping_address, notes,
created_at, updated_at
```

**expenses**
```
id, title, amount, category (rent/salary/utility/other),
date, note, created_at
```

**purchases**
```
id, supplier_id, total_amount, paid_amount, due_amount,
invoice_no, date, note, created_at
```

---

## 4. Features

---

### 4.1 Public Website (Customer Facing)

#### 4.1.1 Homepage
- Hero banner / slider (manageable from the admin panel)
- Featured products section
- Category grid / showcase
- New arrivals section
- Sale / discount section
- Footer: contact info, address, social media links

#### 4.1.2 Product Listing Page
- Category filter
- Price range filter
- Sort by: newest, price low-to-high, price high-to-low, popularity
- Search bar (by product name or SKU)
- Pagination or infinite scroll
- Grid / List view toggle

#### 4.1.3 Product Detail Page
- Multiple product images (served via ImageKit.io CDN)
- Product name, price, and discount price
- Size / Color / Variant selector
- Stock status indicator (In Stock / Out of Stock)
- Add to Cart button
- Full product description
- Related products section

#### 4.1.4 Cart
- Add, remove, and update item quantities
- Subtotal, discount, and shipping cost calculation
- Apply coupon code (optional — Phase 2)
- Proceed to Checkout button

#### 4.1.5 Checkout
- Shipping address form
- Payment method selection: COD, bKash, Nagad, Bank Transfer
- Order summary before placing the order
- Place Order button
- Order confirmation page with optional email/SMS notification

#### 4.1.6 Customer Account
- Register / Login (via Supabase Auth)
- Profile update (name, phone, address)
- Order history with order detail view
- Order status tracking

---

### 4.2 Admin Panel

> Route: `/admin` — Role-based access; only users with the `admin` role can access this panel.

#### 4.2.1 Admin Dashboard
- Total Sales (today, this week, this month, this year)
- Total Orders broken down by status
- Total Revenue vs. Total Expenses
- Net Profit / Loss
- Low stock alerts
- Recent orders list
- Top selling products chart
- Revenue trend chart (line / bar)

#### 4.2.2 Product Management
- Product list with search, filter, and sort
- Add New Product form:
  - Name, Slug (auto-generated)
  - Category (dropdown)
  - Description (rich text / markdown)
  - Price, Discount Price, Cost Price
  - SKU, Unit (piece / kg / yard / etc.)
  - Stock Quantity
  - Multiple image upload via ImageKit.io
  - Is Featured? / Is Active? toggles
- Edit Product
- Delete Product (soft delete)
- Bulk actions: activate, deactivate, delete

#### 4.2.3 Category Management
- Category list with product count
- Add / Edit / Delete category
- Parent-child category support (sub-categories)
- Category image upload

#### 4.2.4 Order Management
- Order list with filters (status, date range, payment status)
- Order detail view:
  - Customer information
  - Items ordered
  - Pricing breakdown
  - Payment information
- Update order status
- Add shipping tracking number
- Print invoice / packing slip

#### 4.2.5 Customer Management
- Full customer list
- Customer detail view: profile, order history, total spend
- Ban / unban customer

#### 4.2.6 Inventory Management
- Current stock level per product
- Configurable low stock threshold for alerts
- Manual stock adjustment (add / subtract) with reason logging
- Full stock history log

#### 4.2.7 Purchase / Stock-In Management
- Supplier list (add, edit, delete)
- New Purchase entry:
  - Select supplier
  - Add products with quantity and cost per unit
  - Total amount, amount paid, and amount due
  - Invoice number and date
- Purchase list with filters
- Update due payments

#### 4.2.8 Expense Management
- Add daily / monthly expenses:
  - Title, amount, category, date, note
- Expense list with date range filter
- Expense categories: Rent, Salary, Utility, Transport, Marketing, Others

#### 4.2.9 Accounts & Reports

**Sales Report**
- Total sales by date range
- Sales broken down by category
- Sales broken down by product
- Export to CSV

**Purchase Report**
- Total purchase cost
- Outstanding payments to suppliers

**Expense Report**
- Total expenses by category and date range

**Profit & Loss Statement**
```
Total Revenue       = Sum of all paid order amounts
- Total COGS        = cost_price × quantity_sold
- Total Expenses    = rent + salary + utility + others
- Total Purchases   = stock purchase cost
= Net Profit / Loss
```

**Balance Sheet Summary**
- Cash in hand / bank (manual entry)
- Total receivables (unpaid orders)
- Total payables (amounts due to suppliers)
- Total inventory value (cost price × current stock)

#### 4.2.10 Banner / Homepage Management
- Upload and update hero banners
- Set banner display order, link URL, and active/inactive status
- Select featured products for the homepage

#### 4.2.11 Settings
- Store name, logo, address, phone, and email
- Social media links
- Delivery charge configuration (flat rate or by area)
- Toggle payment methods on/off

---

### 4.3 Authentication & Authorization

| Role | Access |
|---|---|
| Customer | Public pages + own account only |
| Admin | Full admin panel access |
| Staff (Optional) | Orders and inventory only |

- Supabase Auth is used for authentication (email / password)
- Row Level Security (RLS) is enabled in Supabase
- Admin routes are protected using Next.js `middleware.ts`

---

## 5. Page Structure / Routes

### Public Routes
```
/                        → Homepage
/products                → All products
/products/[slug]         → Product detail
/category/[slug]         → Category products
/cart                    → Shopping cart
/checkout                → Checkout
/order-confirmation      → Order success page
/account                 → Customer dashboard
/account/orders          → Order history
/account/orders/[id]     → Order detail
/auth/login              → Login
/auth/register           → Register
```

### Admin Routes
```
/admin                          → Dashboard
/admin/products                 → Product list
/admin/products/new             → Add product
/admin/products/[id]/edit       → Edit product
/admin/categories               → Categories
/admin/orders                   → Orders
/admin/orders/[id]              → Order detail
/admin/customers                → Customers
/admin/inventory                → Inventory
/admin/purchases                → Purchase list
/admin/purchases/new            → New purchase
/admin/suppliers                → Suppliers
/admin/expenses                 → Expenses
/admin/reports/sales            → Sales report
/admin/reports/profit-loss      → P&L report
/admin/banners                  → Banner management
/admin/settings                 → Store settings
```

---

## 6. UI/UX Requirements

- **Mobile-first design** — fully responsive using Tailwind CSS
- **Color Theme:** Based on SM Fashion's brand colors (default: green + white for a Bangladeshi theme)
- **Language:** Public website supports Bangla and English with a visible language toggle; Admin panel is English only
- **Admin panel:** Clean sidebar layout with paginated data tables
- **Loading states:** Skeleton loaders for product cards
- **Toast notifications:** Shown for add to cart, order placed, and error events
- **Image optimization:** Automatic WebP conversion and lazy loading via ImageKit.io

---

## 7. Internationalization — i18n (Bangla / English)

### 7.1 Scope
| Area | Language Support |
|---|---|
| Public Website (storefront) | Bangla + English (user can switch) |
| Admin Panel | English only |

### 7.2 Library
**`next-intl`** will be used for i18n in the Next.js App Router.

```bash
npm install next-intl
```

### 7.3 Folder Structure

```
/messages
  en.json       ← English translations
  bn.json       ← Bangla translations

/app
  /[locale]     ← Dynamic locale segment
    layout.tsx
    page.tsx
    /products
    /cart
    /checkout
    ...
```

### 7.4 Translation File Example

**`messages/en.json`**
```json
{
  "nav": {
    "home": "Home",
    "products": "Products",
    "cart": "Cart",
    "login": "Login"
  },
  "product": {
    "addToCart": "Add to Cart",
    "inStock": "In Stock",
    "outOfStock": "Out of Stock",
    "relatedProducts": "Related Products"
  },
  "checkout": {
    "placeOrder": "Place Order",
    "shippingAddress": "Shipping Address",
    "paymentMethod": "Payment Method"
  }
}
```

**`messages/bn.json`**
```json
{
  "nav": {
    "home": "হোম",
    "products": "পণ্যসমূহ",
    "cart": "কার্ট",
    "login": "লগইন"
  },
  "product": {
    "addToCart": "কার্টে যোগ করুন",
    "inStock": "স্টকে আছে",
    "outOfStock": "স্টকে নেই",
    "relatedProducts": "সম্পর্কিত পণ্য"
  },
  "checkout": {
    "placeOrder": "অর্ডার করুন",
    "shippingAddress": "ডেলিভারি ঠিকানা",
    "paymentMethod": "পেমেন্ট পদ্ধতি"
  }
}
```

### 7.5 Language Toggle UI
- A **BN / EN** toggle button will appear in the public site's navbar
- User's language preference will be saved in a cookie so it persists across pages
- Default language: **Bangla (bn)**
- Supported locales: `bn`, `en`

### 7.6 URL Structure with Locale

```
/bn                        → Homepage (Bangla)
/en                        → Homepage (English)
/bn/products               → Products (Bangla)
/en/products               → Products (English)
/bn/products/[slug]        → Product detail (Bangla)
/en/products/[slug]        → Product detail (English)
```

### 7.7 Font Setup
Both languages need separate fonts loaded via Google Fonts in `layout.tsx`:

```tsx
import { Inter } from 'next/font/google'           // English
import { Hind_Siliguri } from 'next/font/google'   // Bangla
```

Tailwind CSS will apply the correct font family based on the active locale.

### 7.8 Product Content (Bangla vs English)
For product names and descriptions stored in the database, two fields will exist:

```
products table:
  name_en       → English product name
  name_bn       → Bangla product name
  description_en
  description_bn
```

The frontend will display the correct field based on the active locale.

### 7.9 Phase
i18n will be implemented in **Phase 2** after core features are complete in Phase 1.

---

## 8. ImageKit.io Integration

- All product images are uploaded to and stored in ImageKit.io
- Automatic resizing: thumbnail (300×300), medium (600×600), large (1200×1200)
- Images are served via CDN for fast load times globally
- When a product image is replaced, the old image is deleted from ImageKit.io

---

## 9. Development Phases

### Phase 1 — Core (MVP)
- [ ] Supabase setup (tables, auth, RLS policies)
- [ ] Next.js project setup with Tailwind CSS
- [ ] Admin: Product CRUD
- [ ] Admin: Category CRUD
- [ ] Public: Homepage, product listing, product detail
- [ ] Public: Cart + Checkout (COD only)
- [ ] Admin: Order management
- [ ] Basic dashboard (sales count and revenue summary)

### Phase 2 — Business Features
- [ ] Inventory management
- [ ] Purchase and supplier management
- [ ] Expense tracking
- [ ] Profit & Loss report
- [ ] Customer accounts and order history
- [ ] Banner / homepage management
- [ ] i18n — Bangla / English language toggle (next-intl)
- [ ] Bangla font integration (Hind Siliguri)
- [ ] Add `name_bn`, `description_bn` fields to products and categories

### Phase 3 — Advanced
- [ ] Online payment integration (bKash / Nagad API)
- [ ] Coupon / discount system
- [ ] SMS notifications for order confirmation
- [ ] Advanced reports with CSV export
- [ ] Staff role and access control
- [ ] SEO optimization (meta tags, sitemap, Open Graph)

---

## 10. Non-Functional Requirements

| Requirement | Target |
|---|---|
| Page Load Speed | Under 3 seconds (Vercel CDN) |
| Mobile Responsive | 100% — all screen sizes |
| Security | Supabase RLS + Next.js middleware auth checks |
| Image Performance | ImageKit CDN with lazy loading and WebP |
| Uptime | 99.9% (Vercel hosting) |
| Code Quality | GitHub branch strategy with pull requests |

---

## 11. Deployment Strategy

- **Repository:** GitHub (main + develop branches)
- **Hosting:** Vercel (auto-deploy on push to main)
- **Database:** Supabase (free tier to start)
- **Images:** ImageKit.io (free tier — 20GB bandwidth)
- **Environment Variables:** Stored in Vercel dashboard; `.env.local` used for local development

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY=
IMAGEKIT_PRIVATE_KEY=
NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT=
```

---

## 12. Future Considerations (Out of Scope for Now)

- Multi-vendor marketplace
- Mobile app (React Native)
- Loyalty points / rewards system
- WhatsApp integration for order notifications
- POS (Point of Sale) system for the physical store
- Bulk product import via CSV / Excel

---

## 13. Glossary

| Term | Meaning |
|---|---|
| COGS | Cost of Goods Sold — the cost price of items sold |
| SKU | Stock Keeping Unit — a unique product identifier code |
| RLS | Row Level Security — Supabase's data access security layer |
| COD | Cash on Delivery |
| P&L | Profit and Loss |
| i18n | Internationalization — supporting multiple languages in an app |
| Locale | A language/region setting, e.g. `bn` for Bangla, `en` for English |
| next-intl | A Next.js library for handling translations and locale routing |

---

*PRD prepared for **SM Fashion** E-Commerce Project*  
*Tech Stack: Next.js · Tailwind CSS · Supabase · ImageKit.io · GitHub · Vercel · next-intl*
