// @ts-nocheck
import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/supabase'

// Cache the client to avoid recreating it
let supabaseClient: ReturnType<typeof createBrowserClient<Database>> | null = null

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined'

export function createClient() {
  // Return cached client if available and we're in browser
  if (supabaseClient && isBrowser) {
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
  
  // More detailed environment variable checking
  if (!supabaseUrl) {
    const error = 'Missing NEXT_PUBLIC_SUPABASE_URL environment variable'
    console.error(error)
    if (!isBrowser) {
      // In server environment, this might be expected during build
      console.log('This might be expected during build time in server components')
    }
    // Don't throw error in server environment during build
    if (isBrowser) {
      throw new Error(error)
    }
    return null
  }
  
  if (!supabaseKey) {
    const error = 'Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable'
    console.error(error)
    if (!isBrowser) {
      // In server environment, this might be expected during build
      console.log('This might be expected during build time in server components')
    }
    // Don't throw error in server environment during build
    if (isBrowser) {
      throw new Error(error)
    }
    return null
  }
  
  try {
    supabaseClient = createBrowserClient<Database>(
      supabaseUrl,
      supabaseKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storage: window.localStorage,
          storageKey: 'supabase.auth.token',
          flowType: 'pkce'
        },
        global: {
          headers: {
            'Cache-Control': 'no-store'
          }
        }
      }
    )
    console.log('Supabase client created successfully')
    return supabaseClient
  } catch (err) {
    console.error('Failed to create Supabase browser client:', err)
    // In production, we might want to return a fallback or null instead of throwing
    if (process.env.NODE_ENV === 'production') {
      console.warn('Production mode: Returning null instead of throwing error')
      return null
    }
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
    if (!supabase) {
      return { user: null, error: new Error('Supabase client not initialized') }
    }
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
    const { user, error } = await getCurrentUser()
    if (error) {
      console.error('isAuthenticated check failed:', error)
      return false
    }
    return !!user
  } catch (err) {
    console.error('isAuthenticated failed:', err)
    return false
  }
}