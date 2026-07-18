'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { User, ShoppingBag } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AccountProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  
  // Fields
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')

  const supabase = createClient()

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login?redirectTo=/account')
        return
      }

      const { data: prof, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        toast.error('Failed to load profile details')
      } else {
        setProfile(prof)
        setFullName(prof.full_name || '')
        setPhone(prof.phone || '')
        setAddress(prof.address || '')
      }
      setLoading(false)
    }

    loadProfile()
  }, [])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName || !phone) {
      toast.error('Name and Phone are required')
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          phone,
          address,
        })
        .eq('id', profile.id)

      if (error) throw error
      toast.success('Profile updated successfully')
    } catch (error: any) {
      toast.error('Failed to update: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 flex justify-center items-center">
        <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Navigation Sidebar */}
        <div className="md:col-span-1 space-y-2">
          <Link
            href="/account"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold bg-primary/5 text-primary"
          >
            <User className="h-4 w-4" />
            My Profile
          </Link>
          <Link
            href="/account/orders"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            <ShoppingBag className="h-4 w-4" />
            My Orders
          </Link>
        </div>

        {/* Profile Content */}
        <div className="md:col-span-3 bg-white p-6 rounded-xl border border-border shadow-sm space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Personal Information</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Update your default contact and shipping details.</p>
          </div>

          <form onSubmit={handleUpdate} className="space-y-4 max-w-xl">
            <Input
              label="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />

            <Input
              label="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />

            <Textarea
              label="Default Shipping Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="House, Street, Area..."
              rows={4}
            />

            <div className="pt-2">
              <Button type="submit" loading={saving}>
                Save Changes
              </Button>
            </div>
          </form>
        </div>

      </div>
    </div>
  )
}
