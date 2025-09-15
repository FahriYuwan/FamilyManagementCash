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
      // Check if user is already in a family
      const { data: existingUser } = await this.supabase
        .from('users')
        .select('family_id')
        .eq('id', creatorId)
        .single()

      if (existingUser?.family_id) {
        return { family: null, error: 'You are already part of a family' }
      }

      // Create the family
      const { data: family, error: familyError } = await this.supabase
        .from('families')
        .insert({ name })
        .select()
        .single()

      if (familyError) throw familyError

      // Update the creator's family_id
      const { error: userError } = await this.supabase
        .from('users')
        .update({ family_id: family.id })
        .eq('id', creatorId)

      if (userError) throw userError

      // Return the family with members
      const familyData = await this.getFamilyById(family.id)
      return { family: familyData, error: null }
    } catch (error) {
      console.error('Error creating family:', error)
      return { family: null, error: 'Failed to create family' }
    }
  }

  async joinFamily(userId: string, familyId: string, userRole: UserRole): Promise<{ success: boolean; error: string | null }> {
    try {
      // Check if user is already in a family
      const { data: existingUser } = await this.supabase
        .from('users')
        .select('family_id')
        .eq('id', userId)
        .single()

      if (existingUser?.family_id) {
        return { success: false, error: 'You are already part of a family' }
      }

      // Check if family exists
      const { data: family, error: familyError } = await this.supabase
        .from('families')
        .select('*')
        .eq('id', familyId)
        .single()

      if (familyError || !family) {
        return { success: false, error: 'Family not found' }
      }

      // Check if family already has a member with the same role
      const { data: existingMembers, error: membersError } = await this.supabase
        .from('users')
        .select('role')
        .eq('family_id', familyId)

      if (membersError) {
        return { success: false, error: 'Failed to check family members' }
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

      if (error) throw error

      return { success: true, error: null }
    } catch (error) {
      console.error('Error joining family:', error)
      return { success: false, error: 'Failed to join family' }
    }
  }

  async leaveFamily(userId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await this.supabase
        .from('users')
        .update({ family_id: null })
        .eq('id', userId)

      if (error) throw error

      return { success: true, error: null }
    } catch (error) {
      console.error('Error leaving family:', error)
      return { success: false, error: 'Failed to leave family' }
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