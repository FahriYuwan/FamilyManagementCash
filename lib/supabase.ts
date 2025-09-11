// @ts-nocheck
import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/supabase'

// Cache the client to avoid recreating it
let supabaseClient: ReturnType<typeof createBrowserClient<Database>> | null = null

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined'

export function createClient() {
  // Return cached client if available
  if (supabaseClient) {
    return supabaseClient
  }
  
  // Validate environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  console.log('Supabase createClient called with:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseKey,
    urlLength: supabaseUrl?.length || 0,
    keyLength: supabaseKey?.length || 0,
    isBrowser
  })
  
  if (!supabaseUrl || !supabaseKey) {
    const error = `Missing Supabase environment variables. URL: ${!!supabaseUrl}, KEY: ${!!supabaseKey}`
    console.error(error)
    throw new Error(error)
  }
  
  try {
    supabaseClient = createBrowserClient<Database>(
      supabaseUrl,
      supabaseKey,
      {
        auth: {
          persistSession: isBrowser,
          autoRefreshToken: isBrowser,
          detectSessionInUrl: isBrowser,
          storage: isBrowser ? window.localStorage : undefined,
          storageKey: 'supabase.auth.token'
        },
        global: {
          headers: {
            'Cache-Control': 'max-age=300' // 5 minutes cache
          }
        }
      }
    )
    console.log('Supabase client created successfully')
    return supabaseClient
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