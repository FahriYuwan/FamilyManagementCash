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
      
      // First, check if users table exists and is accessible
      const { data: testData, error: testError } = await supabase
        .from('users')
        .select('count', { count: 'exact' })
        .limit(0)
      
      if (testError) {
        console.error('❌ Users table access test failed:', testError)
        throw new Error(`Database table access error: ${testError.message}`)
      }
      
      console.log('✅ Users table accessible, attempting to fetch profile...')
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

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
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    if (data.user) {
      const profile = await getUserProfile(data.user.id)
      if (profile) setUser(profile)
    }
  }

  const signUp = async (email: string, password: string, name: string, role: UserRole) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, role } }
    })
    if (error) throw error
    return data
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