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
  refreshSession: () => Promise<void>
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
      
      // First, get the user's basic info and family_id
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (userError) {
        console.error('❌ User fetch error:', userError)
        if (userError.code === 'PGRST116') {
          console.log('📝 User not found in users table, attempting to create from auth data...')
          return await createUserProfileFromAuth(userId)
        }
        throw new Error(`Database error querying user: ${userError.message} (Code: ${userError.code})`)
      }

      console.log('✅ User data fetched:', userData)

      // If user has a family, fetch the complete family info with all members
      if (userData.family_id) {
        console.log('User belongs to family, fetching complete family data...')
        const { data: familyData, error: familyError } = await supabase
          .from('families')
          .select(`
            *,
            members:users(*)
          `)
          .eq('id', userData.family_id)
          .single();

        if (familyError) {
          console.error('❌ Family fetch error:', familyError);
          // Coba cara alternatif untuk mengambil data keluarga
          const { data: familyDataAlt, error: familyErrorAlt } = await supabase
            .from('families')
            .select('*')
            .eq('id', userData.family_id)
            .single();
          
          if (familyErrorAlt) {
            console.error('❌ Alternative family fetch error:', familyErrorAlt);
            throw new Error(`Database error querying family: ${familyErrorAlt.message} (Code: ${familyErrorAlt.code})`);
          }
          
          // Ambil anggota keluarga secara terpisah
          const { data: membersData, error: membersError } = await supabase
            .from('users')
            .select('*')
            .eq('family_id', userData.family_id);
          
          // Log the query for debugging
          console.log('Fetching family members with family_id:', userData.family_id);
          
          if (membersError) {
            console.error('❌ Family members fetch error:', membersError);
            throw new Error(`Database error querying family members: ${membersError.message} (Code: ${membersError.code})`);
          }
          
          const completeFamilyData = {
            ...familyDataAlt,
            members: membersData || []
          };
          
          console.log('✅ Family data with members (alternative method) fetched:', completeFamilyData);

          // Combine user data with complete family data
          const completeUserData = {
            ...userData,
            family: completeFamilyData
          };

          console.log('✅ Profile found with complete family data (alternative method):', completeUserData);
          return completeUserData as unknown as User;
        }

        console.log('✅ Family data with members fetched:', familyData);

        // Combine user data with complete family data
        const completeUserData = {
          ...userData,
          family: familyData
        };

        console.log('✅ Profile found with complete family data:', completeUserData);
        return completeUserData as unknown as User;
      } else {
        // User has no family, return basic user data
        const userDataWithoutFamily = {
          ...userData,
          family: null
        }
        
        console.log('✅ Profile found without family:', userDataWithoutFamily)
        return userDataWithoutFamily as unknown as User
      }
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
        
        // Get session with retry mechanism
        let attempts = 0;
        const maxAttempts = 3;
        let sessionData = null;
        
        while (attempts < maxAttempts && !sessionData) {
          try {
            const { data: { session } } = await supabase.auth.getSession();
            sessionData = session;
            break;
          } catch (error) {
            console.warn(`Session fetch attempt ${attempts + 1} failed:`, error);
            attempts++;
            if (attempts < maxAttempts) {
              await new Promise(resolve => setTimeout(resolve, 1000 * attempts)); // Exponential backoff
            }
          }
        }
        
        if (sessionData?.user) {
          const profile = await getUserProfile(sessionData.user.id);
          if (profile) setUser(profile);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Set up periodic session refresh
    let refreshInterval: NodeJS.Timeout | null = null;
    if (typeof window !== 'undefined') {
      refreshInterval = setInterval(() => {
        if (user && supabase) {
          refreshUser();
        }
      }, 15 * 60 * 1000); // Refresh every 15 minutes
    }

    // Only set up auth state listener in browser and if Supabase is available
    if (typeof window !== 'undefined' && supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('Auth state change:', event, session?.user?.id);
          
          if (session?.user) {
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
              try {
                const profile = await getUserProfile(session.user.id);
                if (profile) {
                  setUser(profile);
                  console.log('User profile set after auth event:', event);
                }
              } catch (error) {
                console.error('Error fetching profile after auth event:', error);
              }
            }
          } else if (event === 'SIGNED_OUT') {
            setUser(null);
            console.log('User signed out');
          }
          
          // Only set loading to false if it's not already false
          if (loading) {
            setLoading(false);
          }
        }
      );

      return () => {
        if (subscription) {
          subscription.unsubscribe();
        }
        if (refreshInterval) {
          clearInterval(refreshInterval);
        }
      };
    }
  }, [supabase, loading]);

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
    try {
      if (!user) {
        // If no user in state, check if there's a session
        console.log('No user in state, checking for session');
        
        if (supabase) {
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('Error getting session:', error);
            return;
          }
          
          if (session?.user) {
            console.log('Found session, fetching profile for user:', session.user.id);
            const profile = await getUserProfile(session.user.id);
            if (profile) {
              console.log('User profile refreshed from session:', profile);
              setUser(profile);
              return;
            }
          } else {
            console.log('No active session found');
          }
        }
        return;
      }
      
      console.log('Refreshing user data for user:', user.id);
      
      // Tambahkan beberapa percobaan untuk memperbarui data
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts) {
        try {
          const profile = await getUserProfile(user.id);
          if (profile) {
            console.log('User profile refreshed with family data:', profile);
            setUser(profile);
            return;
          } else {
            console.log('Failed to refresh user profile, attempt:', attempts + 1);
            attempts++;
            // Tunggu sebentar sebelum mencoba lagi
            if (attempts < maxAttempts) {
              await new Promise(resolve => setTimeout(resolve, 1000 * attempts)); // Exponential backoff
            }
          }
        } catch (error) {
          console.error('Error refreshing user profile, attempt:', attempts + 1, error);
          attempts++;
          // Tunggu sebentar sebelum mencoba lagi
          if (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000 * attempts)); // Exponential backoff
          }
        }
      }
      
      console.log('Failed to refresh user profile after', maxAttempts, 'attempts');
    } catch (error) {
      console.error('Error in refreshUser function:', error);
    }
  };

  const refreshSession = async () => {
    if (!supabase) return;
    
    try {
      console.log('Attempting to refresh session');
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('Error refreshing session:', error);
        return;
      }
      
      if (data.session?.user) {
        console.log('Session refreshed successfully');
        const profile = await getUserProfile(data.session.user.id);
        if (profile) {
          setUser(profile);
        }
      } else {
        console.log('No session after refresh');
      }
    } catch (error) {
      console.error('Error in refreshSession function:', error);
    }
  };

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
      console.log('User attempting to join family:', { userId: user.id, familyId, userRole: user.role })
      const result = await familyService.joinFamily(user.id, familyId, user.role)
      
      if (result.error) {
        console.error('Error joining family:', result.error)
        alert('Error: ' + result.error)
        return false
      }
      
      // Add a delay to ensure database is updated before refreshing
      await new Promise(resolve => setTimeout(resolve, 1000))
      
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
      refreshSession,
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