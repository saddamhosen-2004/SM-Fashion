import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { ToastProvider } from '@/components/providers/ToastProvider'

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <ToastProvider />
      <Navbar />
      <main className="flex-1 bg-background">{children}</main>
      <Footer />
    </div>
  )
}
