// @ts-nocheck
import { createClient } from '@/lib/supabase'
import { Family, User, UserRole } from '@/types'

export class FamilyService {
  private supabase = createClient()

  constructor() {
    console.log('FamilyService initialized with supabase client');
  }

  async getFamilyById(familyId: string): Promise<Family | null> {
    try {
      const { data, error } = await this.supabase
        .from('families')
        .select(`
          *,
          members:users(*)
        `)
        .eq('id', familyId)
        .single()

      if (error) {
        console.error('Error fetching family:', error)
        return null
      }

      console.log('Family data fetched:', data);
      return data as unknown as Family
    } catch (error) {
      console.error('Exception in getFamilyById:', error)
      return null
    }
  }

  async getFamilyByUserId(userId: string): Promise<Family | null> {
    try {
      // First get the user's family_id
      const { data: user, error: userError } = await this.supabase
        .from('users')
        .select('family_id')
        .eq('id', userId)
        .single()

      if (userError || !user?.family_id) {
        return null
      }

      // Then get the family with members
      return this.getFamilyById(user.family_id)
    } catch (error) {
      console.error('Exception in getFamilyByUserId:', error)
      return null
    }
  }

  async createFamily(name: string, creatorId: string, creatorRole: UserRole): Promise<{ family: Family | null; error: string | null }> {
    try {
      console.log('Creating family with parameters:', { name, creatorId, creatorRole });
      
      // Validate inputs
      if (!name || !creatorId || !creatorRole) {
        return { family: null, error: 'Invalid parameters: name, creatorId, and creatorRole are required' }
      }
      
      // Check if user is already in a family
      const { data: existingUser, error: userCheckError } = await this.supabase
        .from('users')
        .select('family_id')
        .eq('id', creatorId)
        .single()

      if (userCheckError) {
        console.error('Error checking user family status:', userCheckError)
        return { family: null, error: 'Failed to check user status: ' + userCheckError.message }
      }

      if (existingUser?.family_id) {
        return { family: null, error: 'You are already part of a family' }
      }

      // Create the family
      console.log('Attempting to create family with name:', name);
      const insertData = { name };
      console.log('Insert data:', insertData);
      
      const { data: family, error: familyError } = await this.supabase
        .from('families')
        .insert([insertData]) // Wrap in array for consistency
        .select()
        .single()
      
      console.log('Family insert result:', { data: family, error: familyError });

      if (familyError) {
        console.error('Error creating family:', familyError)
        console.error('Error code:', familyError.code)
        console.error('Error message:', familyError.message)
        
        // Handle specific error cases
        if (familyError.code === '42501' || familyError.message.includes('permission') || familyError.message.includes('403')) {
          console.error('RLS Policy Error Details:', {
            code: familyError.code,
            message: familyError.message,
            hint: familyError.hint
          });
          return { family: null, error: 'Insufficient permissions to create family. Please check your account permissions.' }
        }
        
        // Handle network/timeout errors
        if (familyError.message.includes('timeout') || familyError.message.includes('network')) {
          return { family: null, error: 'Network timeout while creating family. Please try again.' }
        }
        
        return { family: null, error: 'Failed to create family: ' + familyError.message }
      }
      
      console.log('Family created successfully:', family);

      // Update the creator's family_id
      const { error: userError } = await this.supabase
        .from('users')
        .update({ family_id: family.id })
        .eq('id', creatorId)

      if (userError) {
        console.error('Error updating user with family ID:', userError)
        // Try to clean up the created family since we couldn't assign the user to it
        try {
          await this.supabase.from('families').delete().eq('id', family.id)
        } catch (cleanupError) {
          console.error('Failed to cleanup family after user update error:', cleanupError)
        }
        
        if (userError.code === '42501' || userError.message.includes('permission') || userError.message.includes('403')) {
          return { family: null, error: 'Insufficient permissions to join family' }
        }
        return { family: null, error: 'Failed to join family: ' + userError.message }
      }

      // Return the family with members
      const familyData = await this.getFamilyById(family.id)
      return { family: familyData, error: null }
    } catch (error) {
      console.error('Exception in createFamily:', error)
      return { family: null, error: 'Failed to create family: ' + (error as Error).message }
    }
  }

  async joinFamily(userId: string, familyId: string, userRole: UserRole): Promise<{ success: boolean; error: string | null }> {
    try {
      console.log('Attempting to join family:', { userId, familyId, userRole })
      
      // Validate inputs
      if (!userId || !familyId || !userRole) {
        return { success: false, error: 'Invalid parameters: userId, familyId, and userRole are required' }
      }
      
      // Check if user is already in a family
      const { data: existingUser, error: userCheckError } = await this.supabase
        .from('users')
        .select('family_id')
        .eq('id', userId)
        .single()

      if (userCheckError) {
        console.error('Error checking user family status:', userCheckError)
        return { success: false, error: 'Failed to check user status: ' + userCheckError.message }
      }

      if (existingUser?.family_id) {
        return { success: false, error: 'You are already part of a family' }
      }

      // Check if family exists
      const { data: family, error: familyError } = await this.supabase
        .from('families')
        .select('*')
        .eq('id', familyId)
        .single()

      if (familyError) {
        console.error('Error finding family:', familyError)
        if (familyError.code === 'PGRST116') {
          return { success: false, error: 'Family not found' }
        }
        return { success: false, error: 'Failed to find family: ' + familyError.message }
      }

      if (!family) {
        return { success: false, error: 'Family not found' }
      }

      // Check if family already has a member with the same role
      const { data: existingMembers, error: membersError } = await this.supabase
        .from('users')
        .select('role')
        .eq('family_id', familyId)

      if (membersError) {
        console.error('Error checking family members:', membersError)
        return { success: false, error: 'Failed to check family members: ' + membersError.message }
      }

      // Check if there's already a member with the same role
      const hasRoleMember = existingMembers.some((member: any) => member.role === userRole)
      if (hasRoleMember) {
        const roleText = userRole === 'ayah' ? 'father (ayah)' : 'mother (ibu)'
        return { success: false, error: `This family already has a ${roleText}` }
      }

      // Join the family
      console.log('Updating user with family_id:', { userId, familyId })
      const { error } = await this.supabase
        .from('users')
        .update({ family_id: familyId })
        .eq('id', userId)

      if (error) {
        console.error('Error joining family:', error)
        if (error.code === '42501' || error.message.includes('permission') || error.message.includes('403')) {
          return { success: false, error: 'Insufficient permissions to join family' }
        }
        return { success: false, error: 'Failed to join family: ' + error.message }
      }

      console.log('Successfully joined family')
      return { success: true, error: null }
    } catch (error) {
      console.error('Exception in joinFamily:', error)
      return { success: false, error: 'Failed to join family: ' + (error as Error).message }
    }
  }

  async leaveFamily(userId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      // Validate input
      if (!userId) {
        return { success: false, error: 'Invalid parameter: userId is required' }
      }
      
      const { error } = await this.supabase
        .from('users')
        .update({ family_id: null })
        .eq('id', userId)

      if (error) {
        console.error('Error leaving family:', error)
        if (error.code === '42501' || error.message.includes('permission') || error.message.includes('403')) {
          return { success: false, error: 'Insufficient permissions to leave family' }
        }
        return { success: false, error: 'Failed to leave family: ' + error.message }
      }

      return { success: true, error: null }
    } catch (error) {
      console.error('Exception in leaveFamily:', error)
      return { success: false, error: 'Failed to leave family: ' + (error as Error).message }
    }
  }

  async getFamilyMembers(familyId: string): Promise<User[]> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('family_id', familyId)

      if (error) {
        console.error('Error fetching family members:', error)
        return []
      }

      return data as unknown as User[]
    } catch (error) {
      console.error('Exception in getFamilyMembers:', error)
      return []
    }
  }

  async isFamilyMember(userId: string, familyId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .eq('family_id', familyId)
        .single()

      return !error && !!data
    } catch (error) {
      console.error('Exception in isFamilyMember:', error)
      return false
    }
  }

  // Subscribe to real-time updates for family members
  subscribeToFamilyMembers(familyId: string, callback: (payload: any) => void) {
    try {
      const channel = this.supabase
        .channel('family-members-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'users',
            filter: `family_id=eq.${familyId}`
          },
          callback
        )
        .subscribe((status: any) => {
          console.log('Family members subscription status:', status)
          if (status === 'SUBSCRIBED') {
            console.log('Successfully subscribed to family members changes')
          }
        })
      
      return channel
    } catch (error) {
      console.error('Exception in subscribeToFamilyMembers:', error)
      return null
    }
  }

  // Unsubscribe from real-time updates
  unsubscribeFromFamilyMembers(channel: any) {
    try {
      return this.supabase.removeChannel(channel)
    } catch (error) {
      console.error('Exception in unsubscribeFromFamilyMembers:', error)
      return null
    }
  }
}