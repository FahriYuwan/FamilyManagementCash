// @ts-nocheck
import { createClient } from '@/lib/supabase'
import { Debt, CreateDebtData, DebtPayment, CreateDebtPaymentData } from '@/types'

export class DebtService {
  private supabase = createClient()

  async getDebts(userId: string, filters?: {
    type?: 'receivable' | 'payable'
    isSettled?: boolean
  }) {
    let query = this.supabase
      .from('debts')
      .select(`*, payments:debt_payments(*)`)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (filters?.type) query = query.eq('type', filters.type)
    if (filters?.isSettled !== undefined) query = query.eq('is_settled', filters.isSettled)

    const { data, error } = await query
    if (error) throw error
    return data as Debt[]
  }

  // Get family debts for real-time sync
  async getFamilyDebts(familyId: string, filters?: {
    type?: 'receivable' | 'payable'
    isSettled?: boolean
  }) {
    let query = this.supabase
      .from('debts')
      .select(`
        *,
        payments:debt_payments(*),
        user:users(id, name, email)
      `)
      .eq('family_id', familyId)
      .order('created_at', { ascending: false })

    if (filters?.type) query = query.eq('type', filters.type)
    if (filters?.isSettled !== undefined) query = query.eq('is_settled', filters.isSettled)

    const { data, error } = await query
    if (error) throw error
    return data as Debt[]
  }

  async createDebt(userId: string, data: CreateDebtData) {
    const { data: result, error } = await this.supabase
      .from('debts')
      .insert({ ...data, user_id: userId })
      .select()
      .single()
    if (error) throw error
    return result as Debt
  }

  async updateDebt(id: string, updates: Partial<CreateDebtData>) {
    const { data, error } = await this.supabase
      .from('debts')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as Debt
  }

  async deleteDebt(id: string) {
    const { error } = await this.supabase.from('debts').delete().eq('id', id)
    if (error) throw error
  }

  async createPayment(data: CreateDebtPaymentData) {
    const { data: result, error } = await this.supabase
      .from('debt_payments')
      .insert(data)
      .select()
      .single()
    if (error) throw error
    return result as DebtPayment
  }

  async getDebtSummary(userId: string) {
    const debts = await this.getDebts(userId)
    
    return debts.reduce(
      (acc, debt) => {
        if (debt.type === 'receivable') {
          acc.totalReceivables += debt.amount
          if (!debt.is_settled && debt.due_date && new Date(debt.due_date) < new Date()) {
            acc.overdueReceivables += debt.remaining_amount
          }
        } else {
          acc.totalPayables += debt.amount
          if (!debt.is_settled && debt.due_date && new Date(debt.due_date) < new Date()) {
            acc.overduePayables += debt.remaining_amount
          }
        }
        return acc
      },
      { totalReceivables: 0, totalPayables: 0, overdueReceivables: 0, overduePayables: 0 }
    )
  }

  // Get family debt summary for shared dashboard
  async getFamilyDebtSummary(familyId: string) {
    const { data: debts, error } = await this.supabase
      .from('debts')
      .select('*')
      .eq('family_id', familyId)
    
    if (error) throw error
    
    return debts.reduce(
      (acc, debt) => {
        if (debt.type === 'receivable') {
          acc.totalReceivables += debt.amount
          if (!debt.is_settled && debt.due_date && new Date(debt.due_date) < new Date()) {
            acc.overdueReceivables += debt.remaining_amount
          }
        } else {
          acc.totalPayables += debt.amount
          if (!debt.is_settled && debt.due_date && new Date(debt.due_date) < new Date()) {
            acc.overduePayables += debt.remaining_amount
          }
        }
        return acc
      },
      { totalReceivables: 0, totalPayables: 0, overdueReceivables: 0, overduePayables: 0 }
    )
  }

  // Subscribe to real-time updates for family debts
  subscribeToFamilyDebts(familyId: string, callback: (payload: any) => void) {
    return this.supabase
      .channel('debts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'debts',
          filter: `family_id=eq.${familyId}`
        },
        callback
      )
      .subscribe()
  }

  // Subscribe to real-time updates for family debt payments
  subscribeToFamilyDebtPayments(familyId: string, callback: (payload: any) => void) {
    return this.supabase
      .channel('debt-payments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'debt_payments',
          filter: `debt_id=in.(${this.getFamilyDebtIdsQuery(familyId)})`
        },
        callback
      )
      .subscribe()
  }

  // Helper to get family debt IDs for payment subscription
  private async getFamilyDebtIdsQuery(familyId: string): Promise<string> {
    const { data, error } = await this.supabase
      .from('debts')
      .select('id')
      .eq('family_id', familyId)
    
    if (error) throw error
    
    return data.map(debt => debt.id).join(',')
  }

  // Unsubscribe from real-time updates
  unsubscribeFromFamilyDebts(channel: any) {
    return this.supabase.removeChannel(channel)
  }
}