// @ts-nocheck
import { createClient } from '@/lib/supabase'
import { startOfMonth, endOfMonth, startOfYear, endOfYear, format, subMonths, subYears } from 'date-fns'

export interface MonthlyReport {
  month: string
  income: number
  expenses: number
  balance: number
  business_revenue?: number
  business_profit?: number
}

export interface CategoryReport {
  category: string
  amount: number
  percentage: number
  count: number
}

export interface DebtReport {
  month: string
  receivables: number
  payables: number
  net_position: number
}

export interface BusinessOrderReport {
  month: string
  orders_count: number
  total_revenue: number
  total_expenses: number
  profit: number
  average_order_value: number
}

export class ReportsService {
  private supabase = createClient()

  async getMonthlyReport(userId: string, months: number = 12): Promise<MonthlyReport[]> {
    const endDate = new Date()
    const startDate = subMonths(endDate, months - 1)
    
    try {
      // Get household transactions grouped by month
      const { data: householdData, error: householdError } = await this.supabase
        .from('household_transactions')
        .select('amount, type, date')
        .eq('user_id', userId)
        .gte('date', format(startOfMonth(startDate), 'yyyy-MM-dd'))
        .lte('date', format(endOfMonth(endDate), 'yyyy-MM-dd'))
        .order('date')

      if (householdError) throw householdError

      // Get business orders grouped by month
      const { data: businessData, error: businessError } = await this.supabase
        .from('orders')
        .select(`
          total_income, 
          order_date,
          order_expenses(amount)
        `)
        .eq('user_id', userId)
        .gte('order_date', format(startOfMonth(startDate), 'yyyy-MM-dd'))
        .lte('order_date', format(endOfMonth(endDate), 'yyyy-MM-dd'))
        .order('order_date')

      if (businessError) throw businessError

      // Process data by month
      const monthlyData: { [key: string]: MonthlyReport } = {}
      
      // Initialize months
      for (let i = 0; i < months; i++) {
        const monthDate = subMonths(endDate, months - 1 - i)
        const monthKey = format(monthDate, 'yyyy-MM')
        monthlyData[monthKey] = {
          month: format(monthDate, 'MMM yyyy'),
          income: 0,
          expenses: 0,
          balance: 0,
          business_revenue: 0,
          business_profit: 0
        }
      }

      // Process household transactions
      householdData?.forEach(transaction => {
        const monthKey = format(new Date(transaction.date), 'yyyy-MM')
        if (monthlyData[monthKey]) {
          if (transaction.type === 'income') {
            monthlyData[monthKey].income += transaction.amount
          } else {
            monthlyData[monthKey].expenses += transaction.amount
          }
        }
      })

      // Process business orders
      businessData?.forEach(order => {
        const monthKey = format(new Date(order.order_date), 'yyyy-MM')
        if (monthlyData[monthKey]) {
          monthlyData[monthKey].business_revenue! += order.total_income
          const totalExpenses = order.order_expenses?.reduce((sum: number, exp: any) => sum + exp.amount, 0) || 0
          monthlyData[monthKey].business_profit! += order.total_income - totalExpenses
        }
      })

      // Calculate balances
      Object.values(monthlyData).forEach(month => {
        month.balance = month.income - month.expenses
      })

      return Object.values(monthlyData)
    } catch (error) {
      console.error('Error getting monthly report:', error)
      throw error
    }
  }

  async getCategoryReport(userId: string, type: 'income' | 'expense', months: number = 3): Promise<CategoryReport[]> {
    const endDate = new Date()
    const startDate = subMonths(endDate, months)
    
    try {
      const { data, error } = await this.supabase
        .from('household_transactions')
        .select(`
          amount,
          household_categories(name)
        `)
        .eq('user_id', userId)
        .eq('type', type)
        .gte('date', format(startOfMonth(startDate), 'yyyy-MM-dd'))
        .lte('date', format(endOfMonth(endDate), 'yyyy-MM-dd'))

      if (error) throw error

      // Group by category
      const categoryData: { [key: string]: { amount: number; count: number } } = {}
      let totalAmount = 0

      data?.forEach(transaction => {
        const categoryName = transaction.household_categories?.name || 'Uncategorized'
        if (!categoryData[categoryName]) {
          categoryData[categoryName] = { amount: 0, count: 0 }
        }
        categoryData[categoryName].amount += transaction.amount
        categoryData[categoryName].count += 1
        totalAmount += transaction.amount
      })

      // Convert to array with percentages
      return Object.entries(categoryData)
        .map(([category, data]) => ({
          category,
          amount: data.amount,
          count: data.count,
          percentage: totalAmount > 0 ? (data.amount / totalAmount) * 100 : 0
        }))
        .sort((a, b) => b.amount - a.amount)
    } catch (error) {
      console.error('Error getting category report:', error)
      throw error
    }
  }

  async getDebtTrend(userId: string, months: number = 12): Promise<DebtReport[]> {
    const endDate = new Date()
    const startDate = subMonths(endDate, months - 1)
    
    try {
      const { data, error } = await this.supabase
        .from('debts')
        .select('amount, type, created_at')
        .eq('user_id', userId)
        .gte('created_at', format(startOfMonth(startDate), 'yyyy-MM-dd'))
        .lte('created_at', format(endOfMonth(endDate), 'yyyy-MM-dd'))
        .order('created_at')

      if (error) throw error

      // Process data by month
      const monthlyData: { [key: string]: DebtReport } = {}
      
      // Initialize months
      for (let i = 0; i < months; i++) {
        const monthDate = subMonths(endDate, months - 1 - i)
        const monthKey = format(monthDate, 'yyyy-MM')
        monthlyData[monthKey] = {
          month: format(monthDate, 'MMM yyyy'),
          receivables: 0,
          payables: 0,
          net_position: 0
        }
      }

      // Process debt data
      data?.forEach(debt => {
        const monthKey = format(new Date(debt.created_at), 'yyyy-MM')
        if (monthlyData[monthKey]) {
          if (debt.type === 'receivable') {
            monthlyData[monthKey].receivables += debt.amount
          } else {
            monthlyData[monthKey].payables += debt.amount
          }
        }
      })

      // Calculate net positions
      Object.values(monthlyData).forEach(month => {
        month.net_position = month.receivables - month.payables
      })

      return Object.values(monthlyData)
    } catch (error) {
      console.error('Error getting debt trend:', error)
      throw error
    }
  }

  async getBusinessReport(userId: string, months: number = 12): Promise<BusinessOrderReport[]> {
    const endDate = new Date()
    const startDate = subMonths(endDate, months - 1)
    
    try {
      const { data, error } = await this.supabase
        .from('orders')
        .select(`
          total_income, 
          order_date,
          order_expenses(amount)
        `)
        .eq('user_id', userId)
        .gte('order_date', format(startOfMonth(startDate), 'yyyy-MM-dd'))
        .lte('order_date', format(endOfMonth(endDate), 'yyyy-MM-dd'))
        .order('order_date')

      if (error) throw error

      // Process data by month
      const monthlyData: { [key: string]: BusinessOrderReport } = {}
      
      // Initialize months
      for (let i = 0; i < months; i++) {
        const monthDate = subMonths(endDate, months - 1 - i)
        const monthKey = format(monthDate, 'yyyy-MM')
        monthlyData[monthKey] = {
          month: format(monthDate, 'MMM yyyy'),
          orders_count: 0,
          total_revenue: 0,
          total_expenses: 0,
          profit: 0,
          average_order_value: 0
        }
      }

      // Process orders
      data?.forEach(order => {
        const monthKey = format(new Date(order.order_date), 'yyyy-MM')
        if (monthlyData[monthKey]) {
          monthlyData[monthKey].orders_count += 1
          monthlyData[monthKey].total_revenue += order.total_income
          const orderExpenses = order.order_expenses?.reduce((sum: number, exp: any) => sum + exp.amount, 0) || 0
          monthlyData[monthKey].total_expenses += orderExpenses
        }
      })

      // Calculate profits and averages
      Object.values(monthlyData).forEach(month => {
        month.profit = month.total_revenue - month.total_expenses
        month.average_order_value = month.orders_count > 0 ? month.total_revenue / month.orders_count : 0
      })

      return Object.values(monthlyData)
    } catch (error) {
      console.error('Error getting business report:', error)
      throw error
    }
  }

  async getYearlyComparison(userId: string): Promise<{
    current_year: MonthlyReport[]
    previous_year: MonthlyReport[]
  }> {
    const currentYear = new Date().getFullYear()
    
    const [currentYearData, previousYearData] = await Promise.all([
      this.getMonthlyReport(userId, 12),
      this.getYearlyReportForYear(userId, currentYear - 1)
    ])

    return {
      current_year: currentYearData,
      previous_year: previousYearData
    }
  }

  private async getYearlyReportForYear(userId: string, year: number): Promise<MonthlyReport[]> {
    const startDate = new Date(year, 0, 1)
    const endDate = new Date(year, 11, 31)
    
    // Similar implementation to getMonthlyReport but for specific year
    // ... (implementation similar to getMonthlyReport)
    return []
  }
}