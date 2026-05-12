import { createClient } from '@supabase/supabase-js'

// Cliente con SERVICE_ROLE_KEY — acceso total, solo usar en el servidor
// NUNCA exponer en el cliente (browser)
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
