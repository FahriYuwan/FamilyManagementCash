// @ts-nocheck
// @ts-nocheck
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { User, UserRole, Family } from '@/types'
import { Database } from '@/types/supabase'
import { createClient } from '@/lib/supabase'
import { FamilyService } from '@/lib/family-service'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name: string, role: UserRole) => Promise<any>
  signOut: () => Promise<void>
  updateProfile: (data: Database['public']['Tables']['users']['Update']) => Promise<void>
  refreshUser: () => Promise<void>
  createFamily: (name: string) => Promise<Family | null>
  joinFamily: (familyId: string) => Promise<boolean>
  leaveFamily: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()
  const familyService = new FamilyService()

  // Check if Supabase client is properly initialized
  if (!supabase) {
    console.error('Supabase client failed to initialize')
    // In production, we might want to show an error message to the user
  }

  const getUserProfile = async (userId: string): Promise<User | null> => {
    try {
      console.log('🔍 getUserProfile called with userId:', userId)
      
      // Check if Supabase client is available
      if (!supabase) {
        console.error('Supabase client not available in getUserProfile')
        return null
      }
      
      // Quick table access test with timeout
      const testPromise = supabase
        .from('users')
        .select('count', { count: 'exact' })
        .limit(0)
      
      const testTimeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Table access timeout')), 3000)
      )
      
      const { error: testError } = await Promise.race([testPromise, testTimeoutPromise]) as any
      
      if (testError) {
        console.error('❌ Users table access test failed:', testError)
        throw new Error(`Database table access error: ${testError.message}`)
      }
      
      console.log('✅ Users table accessible, attempting to fetch profile...')
      
      // Fetch profile with family information including all family members
      const profilePromise = supabase
        .from('users')
        .select(`
          *,
          family:families(
            *,
            members:users(*)
          )
        `)
        .eq('id', userId)
        .single()
      
      const profileTimeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
      )

      const { data, error } = await Promise.race([profilePromise, profileTimeoutPromise]) as any

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
      
      // Check if Supabase client is available
      if (!supabase) {
        console.error('Supabase client not available in createUserProfileFromAuth')
        return null
      }
      
      // Get user data from auth.users
      const { data: authUser, error: authError } = await supabase.auth.getUser()
      if (authError || !authUser.user) {
        console.error('❌ Could not get auth user data:', authError)
        return null
      }
      
      // Insert into users table
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert([{
          id: userId,
          email: authUser.user.email!,
          name: authUser.user.user_metadata?.name || authUser.user.email!.split('@')[0],
          role: authUser.user.user_metadata?.role || 'ibu'
        }])
        .select(`
          *,
          family:families(*)
        `)
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
        // Only initialize auth in browser environment
        if (typeof window === 'undefined') {
          setLoading(false)
          return
        }
        
        // Check if Supabase client is available
        if (!supabase) {
          console.error('Supabase client not available, skipping auth initialization')
          setLoading(false)
          return
        }
        
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

    // Only set up auth state listener in browser and if Supabase is available
    if (typeof window !== 'undefined' && supabase) {
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

      return () => {
        if (subscription) {
          subscription.unsubscribe()
        }
      }
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    console.log('🔍 Starting signIn with timeout protection...')
    
    // Check if Supabase client is available
    if (!supabase) {
      throw new Error('Authentication service not available')
    }
    
    // Add timeout protection for login
    const loginPromise = supabase.auth.signInWithPassword({ email, password })
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Login timeout after 8 seconds')), 8000)
    )
    
    try {
      const { data, error } = await Promise.race([loginPromise, timeoutPromise]) as any
      
      if (error) throw error
      
      if (data.user) {
        console.log('✅ Auth successful, fetching profile...')
        // Add timeout for profile fetch too
        const profilePromise = getUserProfile(data.user.id)
        const profileTimeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
        )
        
        try {
          const profile = await Promise.race([profilePromise, profileTimeoutPromise]) as any
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
    
    // Check if Supabase client is available
    if (!supabase) {
      throw new Error('Registration service not available')
    }
    
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
      const { data, error } = await Promise.race([signUpPromise, timeoutPromise]) as any
      
      if (error) throw error
      
      console.log('✅ Registration successful:', data)
      return data
    } catch (error) {
      console.error('❌ Registration failed:', error)
      throw error
    }
  }

  const signOut = async () => {
    // Check if Supabase client is available
    if (!supabase) {
      throw new Error('Sign out service not available')
    }
    
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setUser(null)
    router.push('/')
  }

  const updateProfile = async (updates: Database['public']['Tables']['users']['Update']) => {
    if (!user) throw new Error('No user logged in')
    // Check if Supabase client is available
    if (!supabase) {
      throw new Error('Profile update service not available')
    }
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
    console.log('Refreshing user data...')
    const profile = await getUserProfile(user.id)
    if (profile) {
      console.log('User profile refreshed:', profile)
      setUser(profile)
    }
  }

  const createFamily = async (name: string): Promise<Family | null> => {
    if (!user) throw new Error('No user logged in')
    
    console.log('Creating family with user:', user);
    try {
      console.log('Calling familyService.createFamily with:', { name, userId: user.id, userRole: user.role });
      const result = await familyService.createFamily(name, user.id, user.role)
      console.log('Family service result:', result);
      
      if (result.error) {
        console.error('Error creating family:', result.error)
        alert('Error creating family: ' + result.error)
        return null
      }
      
      // Refresh user data to include family info
      await refreshUser()
      return result.family
    } catch (error: any) {
      console.error('Error creating family:', error)
      const errorMessage = error.message || error.toString()
      alert('Error creating family: ' + errorMessage)
      return null
    }
  }

  const joinFamily = async (familyId: string): Promise<boolean> => {
    if (!user) throw new Error('No user logged in')
    
    try {
      const result = await familyService.joinFamily(user.id, familyId, user.role)
      
      if (result.error) {
        console.error('Error joining family:', result.error)
        alert('Error: ' + result.error)
        return false
      }
      
      // Refresh user data to include family info
      await refreshUser()
      return result.success
    } catch (error) {
      console.error('Error joining family:', error)
      alert('Error joining family: ' + (error as Error).message)
      return false
    }
  }

  const leaveFamily = async (): Promise<boolean> => {
    if (!user) throw new Error('No user logged in')
    
    try {
      const result = await familyService.leaveFamily(user.id)
      
      if (result.error) {
        console.error('Error leaving family:', result.error)
        alert('Error: ' + result.error)
        return false
      }
      
      // Refresh user data to remove family info
      await refreshUser()
      return result.success
    } catch (error) {
      console.error('Error leaving family:', error)
      alert('Error leaving family: ' + (error as Error).message)
      return false
    }
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      signIn, 
      signUp, 
      signOut, 
      updateProfile, 
      refreshUser,
      createFamily,
      joinFamily,
      leaveFamily
    }}>
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