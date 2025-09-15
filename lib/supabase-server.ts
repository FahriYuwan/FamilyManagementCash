import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/supabase'

export function createClient() {
  try {
    const cookieStore = cookies()
    
    // Validate environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      console.warn('Missing Supabase environment variables in server client')
      // In production, we might want to handle this more gracefully
      if (process.env.NODE_ENV === 'production') {
        console.warn('Production mode: Returning null instead of throwing error')
        return null
      }
      throw new Error('Missing Supabase environment variables')
    }

    return createServerClient<Database>(
      supabaseUrl,
      supabaseKey,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            try {
              cookieStore.set({ name, value, ...options })
            } catch (error) {
              // The `set` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
              console.warn('Cookie set failed in server client:', error)
            }
          },
          remove(name: string, options: any) {
            try {
              cookieStore.set({ name, value: '', ...options })
            } catch (error) {
              // The `delete` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
              console.warn('Cookie remove failed in server client:', error)
            }
          },
        }
      }
    )
  } catch (error) {
    console.error('Failed to create Supabase server client:', error)
    // In production, we might want to return a fallback or null instead of throwing
    if (process.env.NODE_ENV === 'production') {
      console.warn('Production mode: Returning null instead of throwing error in server client')
      return null
    }
    throw error
  }
}