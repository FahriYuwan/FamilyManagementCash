import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/supabase'

export function createClient() {
  // Validate environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  console.log('Supabase createClient called with:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseKey,
    urlLength: supabaseUrl?.length || 0,
    keyLength: supabaseKey?.length || 0
  })
  
  if (!supabaseUrl || !supabaseKey) {
    const error = `Missing Supabase environment variables. URL: ${!!supabaseUrl}, KEY: ${!!supabaseKey}`
    console.error(error)
    throw new Error(error)
  }
  
  try {
    const client = createBrowserClient<Database>(
      supabaseUrl,
      supabaseKey
    )
    console.log('Supabase client created successfully')
    return client
  } catch (err) {
    console.error('Failed to create Supabase browser client:', err)
    throw err
  }
}

// Legacy export for backward compatibility - lazy initialization
export const getSupabaseClient = () => {
  try {
    return createClient()
  } catch (err) {
    console.error('Failed to get Supabase client:', err)
    return null
  }
}

// Helper function to get current user
export const getCurrentUser = async () => {
  try {
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
  } catch (err) {
    console.error('getCurrentUser failed:', err)
    return { user: null, error: err }
  }
}

// Helper function to check if user is authenticated
export const isAuthenticated = async () => {
  try {
    const { user } = await getCurrentUser()
    return !!user
  } catch (err) {
    console.error('isAuthenticated failed:', err)
    return false
  }
}