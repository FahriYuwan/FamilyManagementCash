-- Complete Database Schema for Family Management Cash
-- This script creates ALL tables, policies, triggers, and demo data from scratch
-- Run this in Supabase SQL Editor after deleting all tables

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing enum types if they exist to avoid conflicts
DROP TYPE IF EXISTS order_status CASCADE;
DROP TYPE IF EXISTS debt_type CASCADE;
DROP TYPE IF EXISTS transaction_type CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- Create enum types
CREATE TYPE user_role AS ENUM ('ayah', 'ibu');
CREATE TYPE transaction_type AS ENUM ('income', 'expense');
CREATE TYPE debt_type AS ENUM ('receivable', 'payable');
CREATE TYPE order_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');

-- Drop existing tables first to avoid conflicts
DROP TABLE IF EXISTS public.debt_payments CASCADE;
DROP TABLE IF EXISTS public.debts CASCADE;
DROP TABLE IF EXISTS public.order_expenses CASCADE;
DROP TABLE IF EXISTS public.order_expense_categories CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.household_transactions CASCADE;
DROP TABLE IF EXISTS public.household_categories CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'ibu',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Household expense categories
CREATE TABLE public.household_categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Household transactions (income and expenses)
CREATE TABLE public.household_transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES public.household_categories(id) ON DELETE SET NULL,
  type transaction_type NOT NULL,
  amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  description TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Garment business orders
CREATE TABLE public.orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  order_number TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_contact TEXT,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(15,2) NOT NULL CHECK (unit_price > 0),
  total_income DECIMAL(15,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  status order_status DEFAULT 'pending',
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  deadline_date DATE,
  completion_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order expense categories
CREATE TABLE public.order_expense_categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order expenses breakdown
CREATE TABLE public.order_expenses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES public.order_expense_categories(id) NOT NULL,
  amount DECIMAL(15,2) NOT NULL CHECK (amount >= 0),
  description TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Debts and receivables
CREATE TABLE public.debts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  type debt_type NOT NULL,
  debtor_creditor_name TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  paid_amount DECIMAL(15,2) DEFAULT 0 CHECK (paid_amount >= 0),
  remaining_amount DECIMAL(15,2) GENERATED ALWAYS AS (amount - paid_amount) STORED,
  description TEXT NOT NULL,
  due_date DATE,
  is_settled BOOLEAN GENERATED ALWAYS AS (paid_amount >= amount) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Debt payments tracking
CREATE TABLE public.debt_payments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  debt_id UUID REFERENCES public.debts(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert demo users from auth.users into application users table
-- Handle specific demo email formats and ensure proper role assignment
INSERT INTO public.users (id, email, name, role) 
SELECT id, email,
  CASE 
    WHEN email = 'ayah@demo.com' THEN 'Demo Ayah'
    WHEN email = 'ibu@demo.com' THEN 'Demo Ibu'
    WHEN email = 'demo.ayah@example.com' THEN 'Demo Ayah'
    WHEN email = 'demo.ibu@example.com' THEN 'Demo Ibu'
    WHEN email LIKE '%ayah%' THEN 'Demo Ayah'
    WHEN email LIKE '%ibu%' THEN 'Demo Ibu'
    ELSE COALESCE(split_part(email, '@', 1), 'User')
  END as name,
  CASE 
    WHEN email = 'ayah@demo.com' THEN 'ayah'::user_role
    WHEN email = 'demo.ayah@example.com' THEN 'ayah'::user_role
    WHEN email LIKE '%ayah%' THEN 'ayah'::user_role
    ELSE 'ibu'::user_role
  END as role
FROM auth.users 
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role;

-- Insert default data
INSERT INTO public.household_categories (name, icon, color, is_default) VALUES
('Makanan & Minuman', '🍽️', '#ef4444', true),
('Transportasi', '🚗', '#3b82f6', true),
('Kesehatan', '🏥', '#10b981', true),
('Pendidikan', '📚', '#f59e0b', true),
('Hiburan', '🎬', '#8b5cf6', true),
('Tagihan', '💡', '#6b7280', true),
('Pakaian', '👕', '#ec4899', true),
('Lainnya', '📝', '#64748b', true)
ON CONFLICT DO NOTHING;

INSERT INTO public.order_expense_categories (name, description) VALUES
('Bahan Baku', 'Kain, benang, kancing, resleting, dll'),
('Tenaga Kerja', 'Upah penjahit dan helper'),
('Produksi', 'Listrik, mesin, perawatan alat'),
('Operasional', 'Transport, komunikasi, packaging')
ON CONFLICT DO NOTHING;

-- Create indexes and enable RLS
CREATE INDEX IF NOT EXISTS idx_household_transactions_user_id ON public.household_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_debts_user_id ON public.debts(user_id);
CREATE INDEX IF NOT EXISTS idx_debt_payments_debt_id ON public.debt_payments(debt_id);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.household_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.household_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debt_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_expense_categories DISABLE ROW LEVEL SECURITY;

-- Create essential policies with proper permissions
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can view household categories" ON public.household_categories;
CREATE POLICY "Users can view household categories" ON public.household_categories FOR SELECT USING (is_default = true OR user_id = auth.uid());
DROP POLICY IF EXISTS "Users can insert household categories" ON public.household_categories;
CREATE POLICY "Users can insert household categories" ON public.household_categories FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can view own household transactions" ON public.household_transactions;
CREATE POLICY "Users can view own household transactions" ON public.household_transactions FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert household transactions" ON public.household_transactions;
CREATE POLICY "Users can insert household transactions" ON public.household_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update household transactions" ON public.household_transactions;
CREATE POLICY "Users can update household transactions" ON public.household_transactions FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete household transactions" ON public.household_transactions;
CREATE POLICY "Users can delete household transactions" ON public.household_transactions FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Ayah can view orders" ON public.orders;
CREATE POLICY "Ayah can view orders" ON public.orders FOR SELECT USING (
  auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ayah')
);
DROP POLICY IF EXISTS "Ayah can insert orders" ON public.orders;
CREATE POLICY "Ayah can insert orders" ON public.orders FOR INSERT WITH CHECK (
  auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ayah')
);
DROP POLICY IF EXISTS "Ayah can update orders" ON public.orders;
CREATE POLICY "Ayah can update orders" ON public.orders FOR UPDATE USING (
  auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ayah')
);
DROP POLICY IF EXISTS "Ayah can delete orders" ON public.orders;
CREATE POLICY "Ayah can delete orders" ON public.orders FOR DELETE USING (
  auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ayah')
);

DROP POLICY IF EXISTS "Users can view own debts" ON public.debts;
CREATE POLICY "Users can view own debts" ON public.debts FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert debts" ON public.debts;
CREATE POLICY "Users can insert debts" ON public.debts FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update debts" ON public.debts;
CREATE POLICY "Users can update debts" ON public.debts FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete debts" ON public.debts;
CREATE POLICY "Users can delete debts" ON public.debts FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view debt payments" ON public.debt_payments;
CREATE POLICY "Users can view debt payments" ON public.debt_payments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.debts WHERE id = debt_id AND user_id = auth.uid())
);
DROP POLICY IF EXISTS "Users can insert debt payments" ON public.debt_payments;
CREATE POLICY "Users can insert debt payments" ON public.debt_payments FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.debts WHERE id = debt_id AND user_id = auth.uid())
);
DROP POLICY IF EXISTS "Users can update debt payments" ON public.debt_payments;
CREATE POLICY "Users can update debt payments" ON public.debt_payments FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.debts WHERE id = debt_id AND user_id = auth.uid())
);
DROP POLICY IF EXISTS "Users can delete debt payments" ON public.debt_payments;
CREATE POLICY "Users can delete debt payments" ON public.debt_payments FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.debts WHERE id = debt_id AND user_id = auth.uid())
);

-- Create triggers
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ language 'plpgsql';

-- Drop existing trigger to avoid conflicts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create improved user profile creation function
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  -- Log the attempt
  RAISE LOG 'Creating user profile for: %', NEW.email;
  
  -- Insert new user with proper error handling
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'name',
      NEW.raw_user_meta_data->>'full_name', 
      split_part(NEW.email, '@', 1)
    ),
    COALESCE(
      (NEW.raw_user_meta_data->>'role')::user_role,
      CASE 
        WHEN NEW.email LIKE '%ayah%' THEN 'ayah'::user_role
        ELSE 'ibu'::user_role
      END
    )
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    updated_at = NOW();
  
  RAISE LOG 'User profile created successfully for: %', NEW.email;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error creating user profile for %: %', NEW.email, SQLERRM;
    -- Don't fail the auth user creation, just log the error
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Final verification
SELECT 'Schema creation completed successfully!' as status;
SELECT 'Demo users:' as info, COUNT(*) as count FROM public.users;
SELECT 'Default categories:' as info, COUNT(*) as count FROM public.household_categories WHERE is_default = true;