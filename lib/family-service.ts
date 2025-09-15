// @ts-nocheck
import { createClient } from '@/lib/supabase'
import { Family, User } from '@/types'

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

  async createFamily(name: string, creatorId: string): Promise<Family | null> {
    try {
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
      return this.getFamilyById(family.id)
    } catch (error) {
      console.error('Error creating family:', error)
      return null
    }
  }

  async joinFamily(userId: string, familyId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('users')
        .update({ family_id: familyId })
        .eq('id', userId)

      return !error
    } catch (error) {
      console.error('Error joining family:', error)
      return false
    }
  }

  async leaveFamily(userId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('users')
        .update({ family_id: null })
        .eq('id', userId)

      return !error
    } catch (error) {
      console.error('Error leaving family:', error)
      return false
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