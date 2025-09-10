// @ts-nocheck
import { createClient } from '@/lib/supabase'
import { HouseholdTransaction, CreateHouseholdTransactionData, HouseholdCategory } from '@/types'

export class HouseholdService {
  private supabase = createClient()

  async getTransactions(userId: string, filters?: {
    startDate?: string
    endDate?: string
    type?: 'income' | 'expense'
  }) {
    let query = this.supabase
      .from('household_transactions')
      .select(`*, category:household_categories(*)`)
      .eq('user_id', userId)
      .order('date', { ascending: false })

    if (filters?.startDate) query = query.gte('date', filters.startDate)
    if (filters?.endDate) query = query.lte('date', filters.endDate)
    if (filters?.type) query = query.eq('type', filters.type)

    const { data, error } = await query
    if (error) throw error
    return data as HouseholdTransaction[]
  }

  async createTransaction(userId: string, data: CreateHouseholdTransactionData) {
    const { data: result, error } = await this.supabase
      .from('household_transactions')
      .insert({ ...data, user_id: userId })
      .select(`*, category:household_categories(*)`)
      .single()

    if (error) throw error
    return result as HouseholdTransaction
  }

  async updateTransaction(id: string, updates: Partial<CreateHouseholdTransactionData>) {
    const { data, error } = await this.supabase
      .from('household_transactions')
      .update(updates)
      .eq('id', id)
      .select(`*, category:household_categories(*)`)
      .single()

    if (error) throw error
    return data as HouseholdTransaction
  }

  async deleteTransaction(id: string) {
    const { error } = await this.supabase
      .from('household_transactions')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  async getCategories(userId: string) {
    const { data, error } = await this.supabase
      .from('household_categories')
      .select('*')
      .or(`is_default.eq.true,user_id.eq.${userId}`)
      .order('name')

    if (error) throw error
    return data as HouseholdCategory[]
  }

  async createCategory(userId: string, categoryData: {
    name: string
    icon?: string
    color?: string
  }) {
    const { data, error } = await this.supabase
      .from('household_categories')
      .insert({ ...categoryData, user_id: userId })
      .select()
      .single()

    if (error) throw error
    return data as HouseholdCategory
  }

  async updateCategory(id: string, updates: {
    name?: string
    icon?: string
    color?: string
  }) {
    const { data, error } = await this.supabase
      .from('household_categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as HouseholdCategory
  }

  async deleteCategory(id: string) {
    const { error } = await this.supabase
      .from('household_categories')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  async getSummary(userId: string) {
    const startDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString().split('T')[0]

    const transactions = await this.getTransactions(userId, { startDate })

    const summary = transactions.reduce(
      (acc, t) => {
        if (t.type === 'income') acc.totalIncome += t.amount
        else acc.totalExpenses += t.amount
        return acc
      },
      { totalIncome: 0, totalExpenses: 0 }
    )

    return { ...summary, balance: summary.totalIncome - summary.totalExpenses }
  }
}