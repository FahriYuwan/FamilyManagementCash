export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          role: 'ayah' | 'ibu'
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name: string
          role?: 'ayah' | 'ibu'
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: 'ayah' | 'ibu'
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      household_categories: {
        Row: {
          id: string
          name: string
          icon: string | null
          color: string | null
          is_default: boolean
          user_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          icon?: string | null
          color?: string | null
          is_default?: boolean
          user_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          icon?: string | null
          color?: string | null
          is_default?: boolean
          user_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "household_categories_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      household_transactions: {
        Row: {
          id: string
          user_id: string
          category_id: string | null
          type: 'income' | 'expense'
          amount: number
          description: string
          date: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category_id?: string | null
          type: 'income' | 'expense'
          amount: number
          description: string
          date?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          category_id?: string | null
          type?: 'income' | 'expense'
          amount?: number
          description?: string
          date?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "household_transactions_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "household_transactions_category_id_fkey"
            columns: ["category_id"]
            referencedRelation: "household_categories"
            referencedColumns: ["id"]
          }
        ]
      }
      orders: {
        Row: {
          id: string
          user_id: string
          order_number: string
          customer_name: string
          customer_contact: string | null
          description: string
          quantity: number
          unit_price: number
          total_income: number
          status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
          order_date: string
          deadline_date: string | null
          completion_date: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          order_number: string
          customer_name: string
          customer_contact?: string | null
          description: string
          quantity: number
          unit_price: number
          status?: 'pending' | 'in_progress' | 'completed' | 'cancelled'
          order_date?: string
          deadline_date?: string | null
          completion_date?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          order_number?: string
          customer_name?: string
          customer_contact?: string | null
          description?: string
          quantity?: number
          unit_price?: number
          status?: 'pending' | 'in_progress' | 'completed' | 'cancelled'
          order_date?: string
          deadline_date?: string | null
          completion_date?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      order_expense_categories: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_at?: string
        }
        Relationships: []
      }
      order_expenses: {
        Row: {
          id: string
          order_id: string
          category_id: string
          amount: number
          description: string
          date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_id: string
          category_id: string
          amount: number
          description: string
          date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          category_id?: string
          amount?: number
          description?: string
          date?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_expenses_order_id_fkey"
            columns: ["order_id"]
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_expenses_category_id_fkey"
            columns: ["category_id"]
            referencedRelation: "order_expense_categories"
            referencedColumns: ["id"]
          }
        ]
      }
      debts: {
        Row: {
          id: string
          user_id: string
          type: 'receivable' | 'payable'
          debtor_creditor_name: string
          amount: number
          paid_amount: number
          remaining_amount: number
          description: string
          due_date: string | null
          is_settled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'receivable' | 'payable'
          debtor_creditor_name: string
          amount: number
          paid_amount?: number
          description: string
          due_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'receivable' | 'payable'
          debtor_creditor_name?: string
          amount?: number
          paid_amount?: number
          description?: string
          due_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "debts_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      debt_payments: {
        Row: {
          id: string
          debt_id: string
          amount: number
          payment_date: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          debt_id: string
          amount: number
          payment_date?: string
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          debt_id?: string
          amount?: number
          payment_date?: string
          notes?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "debt_payments_debt_id_fkey"
            columns: ["debt_id"]
            referencedRelation: "debts"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'ayah' | 'ibu'
      transaction_type: 'income' | 'expense'
      debt_type: 'receivable' | 'payable'
      order_status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}