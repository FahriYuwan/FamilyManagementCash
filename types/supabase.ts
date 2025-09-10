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
          name: string
          email: string
          role: 'ayah' | 'ibu'
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          role: 'ayah' | 'ibu'
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          role?: 'ayah' | 'ibu'
          created_at?: string
        }
      }
      household_transactions: {
        Row: {
          id: string
          user_id: string
          type: 'income' | 'expense'
          amount: number
          category: string
          note: string | null
          date: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'income' | 'expense'
          amount: number
          category: string
          note?: string | null
          date: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'income' | 'expense'
          amount?: number
          category?: string
          note?: string | null
          date?: string
          created_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          customer_name: string
          order_date: string
          income: number
          status: 'paid' | 'unpaid'
          created_at: string
        }
        Insert: {
          id?: string
          customer_name: string
          order_date: string
          income: number
          status?: 'paid' | 'unpaid'
          created_at?: string
        }
        Update: {
          id?: string
          customer_name?: string
          order_date?: string
          income?: number
          status?: 'paid' | 'unpaid'
          created_at?: string
        }
      }
      order_expenses: {
        Row: {
          id: string
          order_id: string
          category: 'bahan' | 'produksi' | 'tenaga_kerja' | 'operasional' | 'lainnya'
          amount: number
          note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          category: 'bahan' | 'produksi' | 'tenaga_kerja' | 'operasional' | 'lainnya'
          amount: number
          note?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          category?: 'bahan' | 'produksi' | 'tenaga_kerja' | 'operasional' | 'lainnya'
          amount?: number
          note?: string | null
          created_at?: string
        }
      }
      debts: {
        Row: {
          id: string
          order_id: string | null
          debtor_name: string
          amount: number
          status: 'lunas' | 'belum'
          due_date: string | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id?: string | null
          debtor_name: string
          amount: number
          status?: 'lunas' | 'belum'
          due_date?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string | null
          debtor_name?: string
          amount?: number
          status?: 'lunas' | 'belum'
          due_date?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}