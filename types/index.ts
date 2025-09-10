// Application Types
export interface User {
  id: string
  name: string
  email: string
  role: 'ayah' | 'ibu'
  created_at: string
}

export interface HouseholdTransaction {
  id: string
  user_id: string
  type: 'income' | 'expense'
  amount: number
  category: string
  note?: string
  date: string
  created_at: string
}

export interface Order {
  id: string
  customer_name: string
  order_date: string
  income: number
  status: 'paid' | 'unpaid'
  created_at: string
  expenses?: OrderExpense[]
}

export interface OrderExpense {
  id: string
  order_id: string
  category: 'bahan' | 'produksi' | 'tenaga_kerja' | 'operasional' | 'lainnya'
  amount: number
  note?: string
  created_at: string
}

export interface Debt {
  id: string
  order_id?: string
  debtor_name: string
  amount: number
  status: 'lunas' | 'belum'
  due_date?: string
  created_at: string
}

// UI Types
export interface MenuItem {
  name: string
  href: string
  icon: any
  description?: string
}

export interface DashboardStats {
  totalIncome: number
  totalExpense: number
  balance: number
  ordersCount: number
  pendingDebts: number
}

// Form Types
export interface HouseholdTransactionForm {
  type: 'income' | 'expense'
  amount: number | string
  category: string
  note?: string
  date: string
}

export interface OrderForm {
  customer_name: string
  order_date: string
  income: number | string
  status: 'paid' | 'unpaid'
  expenses: OrderExpenseForm[]
}

export interface OrderExpenseForm {
  category: 'bahan' | 'produksi' | 'tenaga_kerja' | 'operasional' | 'lainnya'
  amount: number | string
  note?: string
}

export interface DebtForm {
  order_id?: string
  debtor_name: string
  amount: number | string
  status: 'lunas' | 'belum'
  due_date?: string
}

// Constants
export const HOUSEHOLD_CATEGORIES = [
  'Makan & Minum',
  'Transport',
  'Listrik & Air',
  'Pendidikan',
  'Kesehatan',
  'Belanja Rumah Tangga',
  'Hiburan',
  'Lainnya'
] as const

export const ORDER_EXPENSE_CATEGORIES = [
  'bahan',
  'produksi', 
  'tenaga_kerja',
  'operasional',
  'lainnya'
] as const

export const ORDER_EXPENSE_LABELS = {
  bahan: 'Bahan Baku',
  produksi: 'Biaya Produksi',
  tenaga_kerja: 'Tenaga Kerja',
  operasional: 'Biaya Operasional',
  lainnya: 'Lainnya'
} as const