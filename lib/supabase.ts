import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/supabase'

export function createClient() {
  // Validate environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
  }
  
  return createBrowserClient<Database>(
    supabaseUrl,
    supabaseKey
  )
}

// Legacy export for backward compatibility
export const supabase = createClient()

// Helper function to get current user
export const getCurrentUser = async () => {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
}

// Helper function to check if user is authenticated
export const isAuthenticated = async () => {
  const { user } = await getCurrentUser()
  return !!user
}