'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Search, Loader2, Eye, Ban, ShieldAlert } from 'lucide-react'
import toast from 'react-hot-toast'

export default function CustomersPage() {
  const [profiles, setProfiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  const supabase = createClient()

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    setLoading(true)
    try {
      // Fetch profiles + count of their orders
      const { data, error } = await supabase
        .from('profiles')
        .select('*, orders:orders(count, total_amount)')
        .order('created_at', { ascending: false })

      if (error) throw error
      
      // Calculate order counts & total spend
      const formatted = (data || []).map((prof: any) => {
        const orderCount = prof.orders?.length || 0
        const totalSpend = prof.orders?.reduce((sum: number, o: any) => sum + o.total_amount, 0) || 0
        return {
          ...prof,
          order_count: orderCount,
          total_spend: totalSpend
        }
      })

      setProfiles(formatted)
    } catch (error: any) {
      toast.error('Failed to load customers: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const toggleBan = async (customer: any) => {
    const actionStr = customer.is_banned ? 'unban' : 'ban'
    if (!confirm(`Are you sure you want to ${actionStr} this customer?`)) return

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_banned: !customer.is_banned })
        .eq('id', customer.id)

      if (error) throw error
      toast.success(`Customer ${actionStr}ned successfully!`)
      fetchCustomers()
    } catch (error: any) {
      toast.error('Failed to update customer: ' + error.message)
    }
  }

  const filteredCustomers = profiles.filter((c) =>
    (c.full_name && c.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.phone && c.phone.includes(searchTerm)) ||
    (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    c.role.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Customer Database</h2>
          <p className="text-sm text-muted-foreground">Monitor buyer accounts, order counts, lifetime spends, and ban statuses.</p>
        </div>
      </div>

      {/* Toolbar filters */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
        <div className="relative flex-1 max-w-sm">
          <Input
            placeholder="Search by name, phone, or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No customers found.</div>
        ) : (
          <div className="overflow-x-auto text-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
                  <th className="p-4">Customer Name</th>
                  <th className="p-4">Contact Info</th>
                  <th className="p-4">Role</th>
                  <th className="p-4 text-center">Orders Placed</th>
                  <th className="p-4">Lifetime Spend</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-bold text-slate-900">
                      {c.full_name || 'Guest User'}
                    </td>
                    <td className="p-4">
                      <div className="text-slate-800">{c.phone || '-'}</div>
                    </td>
                    <td className="p-4">
                      <Badge variant={c.role === 'admin' ? 'default' : c.role === 'staff' ? 'secondary' : 'outline'}>
                        {c.role.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="p-4 text-center font-semibold">{c.order_count}</td>
                    <td className="p-4 font-bold text-slate-900">৳{c.total_spend}</td>
                    <td className="p-4">
                      {c.is_banned ? (
                        <Badge variant="danger" className="flex items-center gap-1 w-fit">
                          <Ban className="h-3 w-3" /> BANNED
                        </Badge>
                      ) : (
                        <Badge variant="success">ACTIVE</Badge>
                      )}
                    </td>
                    <td className="p-4 text-right space-x-1">
                      <Link href={`/admin/customers/${c.id}`}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-slate-500 hover:text-slate-800"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleBan(c)}
                        className={`${c.is_banned ? 'text-green-600 hover:text-green-700 hover:bg-green-50' : 'text-red-500 hover:text-red-700 hover:bg-red-50'}`}
                        title={c.is_banned ? 'Unban User' : 'Ban User'}
                      >
                        <Ban className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
