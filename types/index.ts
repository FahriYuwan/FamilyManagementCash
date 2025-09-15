// Core Types
export type UserRole = 'ayah' | 'ibu'
export type TransactionType = 'income' | 'expense'
export type DebtType = 'receivable' | 'payable'
export type OrderStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'

// Family Types
export interface Family {
  id: string
  name: string
  created_at: string
  updated_at: string
  members?: User[]
}

// User Types
export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  avatar_url?: string
  family_id?: string
  family?: Family
  created_at: string
  updated_at: string
}

export interface UserProfile {
  id: string
  email: string
  name: string
  role: UserRole
  avatar_url?: string
  family_id?: string
}

// Household Finance Types
export interface HouseholdCategory {
  id: string
  name: string
  icon?: string
  color?: string
  is_default: boolean
  user_id?: string
  created_at: string
  updated_at: string
}

export interface HouseholdTransaction {
  id: string
  user_id: string
  category_id?: string
  category?: HouseholdCategory
  type: TransactionType
  amount: number
  description: string
  date: string
  notes?: string
  created_at: string
  updated_at: string
  family_id?: string
}

export interface CreateHouseholdTransactionData {
  category_id?: string
  type: TransactionType
  amount: number
  description: string
  date: string
  notes?: string
}

// Garment Business Types
export interface Order {
  id: string
  user_id: string
  order_number: string
  customer_name: string
  customer_contact?: string
  description: string
  quantity: number
  unit_price: number
  total_income: number
  status: OrderStatus
  order_date: string
  deadline_date?: string
  completion_date?: string
  notes?: string
  created_at: string
  updated_at: string
  expenses?: OrderExpense[]
  total_expenses?: number
  profit?: number
  family_id?: string
}

export interface CreateOrderData {
  order_number: string
  customer_name: string
  customer_contact?: string
  description: string
  quantity: number
  unit_price: number
  status?: OrderStatus
  order_date: string
  deadline_date?: string
  notes?: string
}

export interface OrderExpenseCategory {
  id: string
  name: string
  description?: string
  created_at: string
}

export interface OrderExpense {
  id: string
  order_id: string
  category_id: string
  category?: OrderExpenseCategory
  amount: number
  description: string
  date: string
  created_at: string
  updated_at: string
}

export interface CreateOrderExpenseData {
  order_id: string
  category_id: string
  amount: number
  description: string
  date: string
}

// Debt Management Types
export interface Debt {
  id: string
  user_id: string
  type: DebtType
  debtor_creditor_name: string
  amount: number
  paid_amount: number
  remaining_amount: number
  description: string
  due_date?: string
  is_settled: boolean
  created_at: string
  updated_at: string
  payments?: DebtPayment[]
  family_id?: string
}

export interface CreateDebtData {
  type: DebtType
  debtor_creditor_name: string
  amount: number
  description: string
  due_date?: string
}

export interface DebtPayment {
  id: string
  debt_id: string
  amount: number
  payment_date: string
  notes?: string
  created_at: string
}

export interface CreateDebtPaymentData {
  debt_id: string
  amount: number
  payment_date: string
  notes?: string
}

// Dashboard & Analytics Types
export interface DashboardStats {
  household: {
    totalIncome: number
    totalExpenses: number
    balance: number
    monthlyIncome: number
    monthlyExpenses: number
    monthlyBalance: number
  }
  business?: {
    totalOrders: number
    completedOrders: number
    totalRevenue: number
    totalExpenses: number
    totalProfit: number
    monthlyRevenue: number
    monthlyProfit: number
  }
  debts: {
    totalReceivables: number
    totalPayables: number
    overdueReceivables: number
    overduePayables: number
  }
}

export interface CategorySummary {
  category: HouseholdCategory
  total: number
  percentage: number
  transactions: number
}

export interface MonthlyData {
  month: string
  income: number
  expenses: number
  profit?: number
}

export interface ChartData {
  name: string
  value: number
  color?: string
}

// Reporting Types
export interface ReportFilter {
  startDate: string
  endDate: string
  type?: 'household' | 'business' | 'debts'
  category?: string
  status?: OrderStatus
}

export interface ExportOptions {
  format: 'pdf' | 'excel'
  data: 'household' | 'business' | 'debts' | 'summary'
  filter?: ReportFilter
}

// API Response Types
export interface ApiResponse<T> {
  data?: T
  error?: string
  success: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  limit: number
  totalPages: number
}

// Form Types
export interface FormError {
  field: string
  message: string
}

export interface LoadingState {
  [key: string]: boolean
}

// Component Props Types
export interface BaseComponentProps {
  className?: string
  children?: React.ReactNode
}

export interface TableColumn<T> {
  key: keyof T
  label: string
  render?: (value: any, row: T) => React.ReactNode
  sortable?: boolean
  width?: string
}

export interface FilterOption {
  label: string
  value: string
}

// Settings Types
export interface UserSettings {
  currency: string
  dateFormat: string
  notifications: {
    email: boolean
    push: boolean
    reminders: boolean
  }
  privacy: {
    showBalance: boolean
    allowDataExport: boolean
  }
}

// Auth context type
export interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name: string, role: UserRole) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (data: Partial<User>) => Promise<void>
  refreshUser: () => Promise<void>
  createFamily: (name: string) => Promise<Family | null>
  joinFamily: (familyId: string) => Promise<boolean>
  leaveFamily: () => Promise<boolean>
}

// Legacy types for backward compatibility
export interface MenuItem {
  name: string
  href: string
  icon: any
  description?: string
}

// Form Types (Legacy)
export interface HouseholdTransactionForm {
  type: TransactionType
  amount: number | string
  category: string
  note?: string
  date: string
}

export interface OrderForm {
  customer_name: string
  order_date: string
  income: number | string
  status: OrderStatus
  expenses: OrderExpenseForm[]
}

export interface OrderExpenseForm {
  category: string
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
  'Makanan & Minuman',
  'Transportasi',
  'Kesehatan',
  'Pendidikan',
  'Hiburan',
  'Tagihan',
  'Pakaian',
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

// Status Options
export const ORDER_STATUS_OPTIONS = [
  { value: 'pending', label: 'Menunggu' },
  { value: 'in_progress', label: 'Dikerjakan' },
  { value: 'completed', label: 'Selesai' },
  { value: 'cancelled', label: 'Dibatalkan' }
] as const

export const DEBT_TYPE_OPTIONS = [
  { value: 'receivable', label: 'Piutang' },
  { value: 'payable', label: 'Hutang' }
] as const