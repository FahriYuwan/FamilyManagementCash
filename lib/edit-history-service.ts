// @ts-nocheck
import { createClient } from '@/lib/supabase'
import { EditHistory } from '@/types'

export class EditHistoryService {
  private supabase = createClient()

  async getEditHistoryForFamily(familyId: string): Promise<EditHistory[]> {
    // First get all user IDs in the family
    const { data: users, error: usersError } = await this.supabase
      .from('users')
      .select('id')
      .eq('family_id', familyId)

    if (usersError) {
      console.error('Error fetching family users:', usersError)
      return []
    }

    const userIds = users.map(user => user.id)

    // Then get edit history for those users
    const { data, error } = await this.supabase
      .from('edit_history')
      .select(`
        *,
        user:users(name, role)
      `)
      .in('user_id', userIds)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Error fetching edit history:', error)
      return []
    }

    return data as unknown as EditHistory[]
  }

  async getEditHistoryForRecord(table_name: string, record_id: string): Promise<EditHistory[]> {
    const { data, error } = await this.supabase
      .from('edit_history')
      .select(`
        *,
        user:users(name, role)
      `)
      .eq('table_name', table_name)
      .eq('record_id', record_id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching edit history for record:', error)
      return []
    }

    return data as unknown as EditHistory[]
  }
}