import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Fallback values prevent build-time crash when env vars are not yet set on Vercel.
  // Actual API calls are made in the browser where real env vars are available.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co'
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key'
  return createBrowserClient(url, key)
}
