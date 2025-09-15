// @ts-nocheck
import { createClient } from '@/lib/supabase'
import { Family, User, UserRole } from '@/types'

export class FamilyService {
  private supabase = createClient()

  async getFamilyById(familyId: string): Promise<Family | null> {
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

    return data as unknown as Family
  }

  async getFamilyByUserId(userId: string): Promise<Family | null> {
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
  }

  async createFamily(name: string, creatorId: string, creatorRole: UserRole): Promise<{ family: Family | null; error: string | null }> {
    try {
      console.log('Creating family with parameters:', { name, creatorId, creatorRole });
      
      // Check if user is already in a family
      const { data: existingUser, error: userCheckError } = await this.supabase
        .from('users')
        .select('family_id')
        .eq('id', creatorId)
        .single()

      if (userCheckError) {
        console.error('Error checking user family status:', userCheckError)
        return { family: null, error: 'Failed to check user status' }
      }

      if (existingUser?.family_id) {
        return { family: null, error: 'You are already part of a family' }
      }

      // Create the family
      console.log('Attempting to create family with name:', name);
      const { data: family, error: familyError } = await this.supabase
        .from('families')
        .insert([{ name }])
        .select()
        .single()

      if (familyError) {
        console.error('Error creating family:', familyError)
        console.error('Error code:', familyError.code)
        console.error('Error message:', familyError.message)
        if (familyError.code === '42501' || familyError.message.includes('permission') || familyError.message.includes('403')) {
          return { family: null, error: 'Insufficient permissions to create family. Please check your account permissions.' }
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
        await this.supabase.from('families').delete().eq('id', family.id)
        if (userError.code === '42501' || userError.message.includes('permission') || userError.message.includes('403')) {
          return { family: null, error: 'Insufficient permissions to join family' }
        }
        return { family: null, error: 'Failed to join family: ' + userError.message }
      }

      // Return the family with members
      const familyData = await this.getFamilyById(family.id)
      return { family: familyData, error: null }
    } catch (error) {
      console.error('Error creating family:', error)
      return { family: null, error: 'Failed to create family: ' + (error as Error).message }
    }
  }

  async joinFamily(userId: string, familyId: string, userRole: UserRole): Promise<{ success: boolean; error: string | null }> {
    try {
      // Check if user is already in a family
      const { data: existingUser, error: userCheckError } = await this.supabase
        .from('users')
        .select('family_id')
        .eq('id', userId)
        .single()

      if (userCheckError) {
        console.error('Error checking user family status:', userCheckError)
        return { success: false, error: 'Failed to check user status' }
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

      return { success: true, error: null }
    } catch (error) {
      console.error('Error joining family:', error)
      return { success: false, error: 'Failed to join family: ' + (error as Error).message }
    }
  }

  async leaveFamily(userId: string): Promise<{ success: boolean; error: string | null }> {
    try {
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
      console.error('Error leaving family:', error)
      return { success: false, error: 'Failed to leave family: ' + (error as Error).message }
    }
  }

  async getFamilyMembers(familyId: string): Promise<User[]> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('family_id', familyId)

    if (error) {
      console.error('Error fetching family members:', error)
      return []
    }

    return data as unknown as User[]
  }

  async isFamilyMember(userId: string, familyId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .eq('family_id', familyId)
      .single()

    return !error && !!data
  }

  // Subscribe to real-time updates for family members
  subscribeToFamilyMembers(familyId: string, callback: (payload: any) => void) {
    return this.supabase
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
      .subscribe()
  }

  // Unsubscribe from real-time updates
  unsubscribeFromFamilyMembers(channel: any) {
    return this.supabase.removeChannel(channel)
  }
}