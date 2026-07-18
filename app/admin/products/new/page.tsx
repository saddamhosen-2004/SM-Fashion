import { ProductForm } from '@/components/admin/ProductForm'

export default function NewProductPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Create Product</h2>
        <p className="text-sm text-muted-foreground">Add a new item to the store catalog.</p>
      </div>

      <ProductForm />
    </div>
  )
}
