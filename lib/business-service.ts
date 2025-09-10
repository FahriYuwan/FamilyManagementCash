// @ts-nocheck
import { createClient } from '@/lib/supabase'
import { Order, CreateOrderData, OrderExpense, CreateOrderExpenseData } from '@/types'

export class BusinessService {
  private supabase = createClient()

  async getOrders(userId: string) {
    const { data, error } = await this.supabase
      .from('orders')
      .select(`*, expenses:order_expenses(*, category:order_expense_categories(*))`)
      .eq('user_id', userId)
      .order('order_date', { ascending: false })

    if (error) throw error
    return data.map((order: any) => ({
      ...order,
      total_expenses: order.expenses?.reduce((sum: number, exp: any) => sum + exp.amount, 0) || 0,
      profit: order.total_income - (order.expenses?.reduce((sum: number, exp: any) => sum + exp.amount, 0) || 0)
    })) as Order[]
  }

  async createOrder(userId: string, data: CreateOrderData) {
    const { data: result, error } = await this.supabase
      .from('orders')
      .insert({ ...data, user_id: userId, total_income: data.quantity * data.unit_price })
      .select()
      .single()
    if (error) throw error
    return result as Order
  }

  async updateOrder(id: string, updates: Partial<CreateOrderData>) {
    const { data, error } = await this.supabase
      .from('orders')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as Order
  }

  async deleteOrder(id: string) {
    const { error } = await this.supabase.from('orders').delete().eq('id', id)
    if (error) throw error
  }

  async createOrderExpense(data: CreateOrderExpenseData) {
    const { data: result, error } = await this.supabase
      .from('order_expenses')
      .insert(data)
      .select(`*, category:order_expense_categories(*)`)
      .single()
    if (error) throw error
    return result as OrderExpense
  }

  async getExpenseCategories() {
    const { data, error } = await this.supabase
      .from('order_expense_categories')
      .select('*')
      .order('name')
    if (error) throw error
    return data
  }

  async getBusinessSummary(userId: string) {
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString().split('T')[0]
    
    const orders = await this.getOrders(userId)
    const monthlyOrders = orders.filter(o => o.order_date >= startOfMonth)
    
    return monthlyOrders.reduce(
      (acc, order) => {
        acc.totalRevenue += order.total_income
        acc.totalExpenses += order.total_expenses || 0
        acc.totalProfit += order.profit || 0
        if (order.status === 'completed') acc.completedOrders += 1
        return acc
      },
      { totalOrders: monthlyOrders.length, completedOrders: 0, totalRevenue: 0, totalExpenses: 0, totalProfit: 0 }
    )
  }
}