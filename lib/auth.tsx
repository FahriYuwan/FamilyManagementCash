// @ts-nocheck
// @ts-nocheck
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { User, UserRole } from '@/types'
import { Database } from '@/types/supabase'
import { createClient } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name: string, role: UserRole) => Promise<any>
  signOut: () => Promise<void>
  updateProfile: (data: Database['public']['Tables']['users']['Update']) => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  const getUserProfile = async (userId: string): Promise<User | null> => {
    try {
      console.log('🔍 getUserProfile called with userId:', userId)
      
      // Quick table access test with timeout
      const testPromise = supabase
        .from('users')
        .select('count', { count: 'exact' })
        .limit(0)
      
      const testTimeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Table access timeout')), 3000)
      )
      
      const { error: testError } = await Promise.race([testPromise, testTimeoutPromise])
      
      if (testError) {
        console.error('❌ Users table access test failed:', testError)
        throw new Error(`Database table access error: ${testError.message}`)
      }
      
      console.log('✅ Users table accessible, attempting to fetch profile...')
      
      // Fetch profile with timeout
      const profilePromise = supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()
      
      const profileTimeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
      )

      const { data, error } = await Promise.race([profilePromise, profileTimeoutPromise])

      if (error) {
        console.error('❌ Profile fetch error:', error)
        if (error.code === 'PGRST116') {
          console.log('📝 User not found in users table, attempting to create from auth data...')
          return await createUserProfileFromAuth(userId)
        }
        throw new Error(`Database error querying schema: ${error.message} (Code: ${error.code})`)
      }
      
      console.log('✅ Profile found:', data)
      return data ? (data as unknown as User) : null
    } catch (error) {
      console.error('❌ Error in getUserProfile:', error)
      return null
    }
  }

  const createUserProfileFromAuth = async (userId: string): Promise<User | null> => {
    try {
      console.log('🔨 Creating user profile from auth data for:', userId)
      
      // Get user data from auth.users
      const { data: authUser, error: authError } = await supabase.auth.getUser()
      if (authError || !authUser.user) {
        console.error('❌ Could not get auth user data:', authError)
        return null
      }
      
      // Insert into users table
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: authUser.user.email!,
          name: authUser.user.user_metadata?.name || authUser.user.email!.split('@')[0],
          role: authUser.user.user_metadata?.role || 'ibu'
        })
        .select()
        .single()
      
      if (insertError) {
        console.error('❌ Failed to create user profile:', insertError)
        return null
      }
      
      console.log('✅ User profile created successfully:', newUser)
      return newUser as unknown as User
    } catch (error) {
      console.error('❌ Error creating user profile:', error)
      return null
    }
  }

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          const profile = await getUserProfile(session.user.id)
          if (profile) setUser(profile)
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
      } finally {
        setLoading(false)
      }
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user && event === 'SIGNED_IN') {
          const profile = await getUserProfile(session.user.id)
          if (profile) setUser(profile)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    console.log('🔍 Starting signIn with timeout protection...')
    
    // Add timeout protection for login
    const loginPromise = supabase.auth.signInWithPassword({ email, password })
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Login timeout after 8 seconds')), 8000)
    )
    
    try {
      const { data, error } = await Promise.race([loginPromise, timeoutPromise])
      
      if (error) throw error
      
      if (data.user) {
        console.log('✅ Auth successful, fetching profile...')
        // Add timeout for profile fetch too
        const profilePromise = getUserProfile(data.user.id)
        const profileTimeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
        )
        
        try {
          const profile = await Promise.race([profilePromise, profileTimeoutPromise])
          if (profile) {
            setUser(profile)
            console.log('✅ Login completed successfully')
          } else {
            console.log('⚠️ Profile not found, but auth successful')
            // Create a minimal user object from auth data
            setUser({
              id: data.user.id,
              email: data.user.email!,
              name: data.user.user_metadata?.name || data.user.email!.split('@')[0],
              role: data.user.user_metadata?.role || 'ibu',
              avatar_url: null,
              created_at: data.user.created_at,
              updated_at: new Date().toISOString()
            })
          }
        } catch (profileError) {
          console.warn('Profile fetch failed, using auth data:', profileError)
          // Fallback to auth user data
          setUser({
            id: data.user.id,
            email: data.user.email!,
            name: data.user.user_metadata?.name || data.user.email!.split('@')[0],
            role: data.user.user_metadata?.role || 'ibu',
            avatar_url: null,
            created_at: data.user.created_at,
            updated_at: new Date().toISOString()
          })
        }
      }
    } catch (error) {
      console.error('❌ Login failed:', error)
      throw error
    }
  }

  const signUp = async (email: string, password: string, name: string, role: UserRole) => {
    console.log('🔍 Starting signUp with timeout protection...')
    
    // Add timeout protection for registration
    const signUpPromise = supabase.auth.signUp({
      email,
      password,
      options: { data: { name, role } }
    })
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Registration timeout after 10 seconds')), 10000)
    )
    
    try {
      const { data, error } = await Promise.race([signUpPromise, timeoutPromise])
      
      if (error) throw error
      
      console.log('✅ Registration successful:', data)
      return data
    } catch (error) {
      console.error('❌ Registration failed:', error)
      throw error
    }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setUser(null)
    router.push('/')
  }

  const updateProfile = async (updates: Database['public']['Tables']['users']['Update']) => {
    if (!user) throw new Error('No user logged in')
    // TODO: Fix type issues with Supabase update
    // const { data, error } = await supabase
    //   .from('users')
    //   .update(updates)
    //   .eq('id', user.id)
    //   .select()
    //   .single()
    // if (error) throw error
    // setUser(data as User)
    console.log('Update profile called with:', updates)
  }

  const refreshUser = async () => {
    if (!user) return
    const profile = await getUserProfile(user.id)
    if (profile) setUser(profile)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, updateProfile, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}

export function useRoleAccess() {
  const { user } = useAuth()
  return {
    canAccessBusiness: user?.role === 'ayah',
    canAccessHousehold: true,
    canManageUsers: user?.role === 'ayah',
    canExportData: true,
    userRole: user?.role
  }
}