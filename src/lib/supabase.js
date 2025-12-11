import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables are not set. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your .env.local file')
}

/**
 * Supabase client instance for database operations
 * 
 * This is a configured Supabase client that connects to the project's database.
 * It uses the public schema and does not persist authentication sessions (suitable
 * for server-side API routes).
 * 
 * **Configuration:**
 * - Database schema: 'public'
 * - Auth session persistence: false (server-side only)
 * 
 * **Required Environment Variables:**
 * - NEXT_PUBLIC_SUPABASE_URL: Your Supabase project URL
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY: Your Supabase anonymous/public key
 * 
 * **Usage:**
 * ```javascript
 * import { supabase } from '@/lib/supabase';
 * 
 * const { data, error } = await supabase
 *   .from('connectors')
 *   .select('*')
 *   .eq('id', connectorId)
 *   .single();
 * ```
 * 
 * @type {import('@supabase/supabase-js').SupabaseClient}
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'public',
  },
  auth: {
    persistSession: false,
  },
})



