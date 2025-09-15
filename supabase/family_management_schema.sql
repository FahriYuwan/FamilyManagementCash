-- ====================================================================
-- FAMILY MANAGEMENT CASH DATABASE SCHEMA WITH FAMILY SYNC
-- Complete schema with family synchronization and user registration
-- Run this entire script in Supabase SQL Editor
-- ====================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ====================================================================
-- STEP 1: CLEAN SLATE - Remove everything (Corrected and Simplified)
-- ====================================================================
-- The DROP TABLE ... CASCADE command will automatically remove all dependent objects,
-- including triggers, indexes, and policies on those tables.
-- The DROP FUNCTION ... CASCADE will remove functions and any triggers that depend on them
-- (like 'on_auth_user_created' which depends on 'handle_new_user').
-- This makes explicit DROP TRIGGER commands for public tables redundant and erroneous.

-- Drop all functions and their dependent triggers
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.update_debt_paid_amount() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.set_family_id() CASCADE;
DROP FUNCTION IF EXISTS public.check_family_role_limit() CASCADE;

-- Drop all tables
DROP TABLE IF EXISTS public.debt_payments CASCADE;
DROP TABLE IF EXISTS public.debts CASCADE;
DROP TABLE IF EXISTS public.order_expenses CASCADE;
DROP TABLE IF EXISTS public.order_expense_categories CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.household_transactions CASCADE;
DROP TABLE IF EXISTS public.household_categories CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.families CASCADE;

-- Drop all custom enum types
DROP TYPE IF EXISTS order_status CASCADE;
DROP TYPE IF EXISTS debt_type CASCADE;
DROP TYPE IF EXISTS transaction_type CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- ====================================================================
-- STEP 2: CREATE ENUM TYPES
-- ====================================================================

CREATE TYPE user_role AS ENUM ('ayah', 'ibu');
CREATE TYPE transaction_type AS ENUM ('income', 'expense');
CREATE TYPE debt_type AS ENUM ('receivable', 'payable');
CREATE TYPE order_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');

-- ====================================================================
-- STEP 3: CREATE CORE TABLES WITH FAMILY SYNC
-- ====================================================================

-- Family groups table
CREATE TABLE public.families (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'ibu',
  avatar_url TEXT,
  family_id UUID REFERENCES public.families(id) ON DELETE SET NULL,
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
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  family_id UUID REFERENCES public.families(id) ON DELETE CASCADE
);

-- Garment business orders (for 'ayah' role only)
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
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  family_id UUID REFERENCES public.families(id) ON DELETE CASCADE
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
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  family_id UUID REFERENCES public.families(id) ON DELETE CASCADE
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

-- ====================================================================
-- STEP 4: CREATE PERFORMANCE INDEXES
-- ====================================================================

CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_family_id ON public.users(family_id);
CREATE INDEX idx_household_transactions_user_id ON public.household_transactions(user_id);
CREATE INDEX idx_household_transactions_family_id ON public.household_transactions(family_id);
CREATE INDEX idx_household_transactions_date ON public.household_transactions(date);
CREATE INDEX idx_household_transactions_type ON public.household_transactions(type);
CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_orders_family_id ON public.orders(family_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_date ON public.orders(order_date);
CREATE INDEX idx_order_expenses_order_id ON public.order_expenses(order_id);
CREATE INDEX idx_debts_user_id ON public.debts(user_id);
CREATE INDEX idx_debts_family_id ON public.debts(family_id);
CREATE INDEX idx_debts_type ON public.debts(type);
CREATE INDEX idx_debt_payments_debt_id ON public.debt_payments(debt_id);

-- ====================================================================
-- STEP 5: CREATE TRIGGER FUNCTIONS
-- ====================================================================

-- Function to automatically update updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to automatically set family_id on insert
CREATE OR REPLACE FUNCTION set_family_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NOT NULL AND NEW.family_id IS NULL THEN
    SELECT family_id INTO NEW.family_id
    FROM public.users
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update debt paid amount when payment is added
CREATE OR REPLACE FUNCTION update_debt_paid_amount()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.debts 
    SET paid_amount = paid_amount + NEW.amount
    WHERE id = NEW.debt_id;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE public.debts 
    SET paid_amount = paid_amount - OLD.amount + NEW.amount
    WHERE id = NEW.debt_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.debts 
    SET paid_amount = paid_amount - OLD.amount
    WHERE id = OLD.debt_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check family role limits (one ayah and one ibu per family)
CREATE OR REPLACE FUNCTION check_family_role_limit()
RETURNS TRIGGER AS $$
DECLARE
  ayah_count INTEGER;
  ibu_count INTEGER;
BEGIN
  -- Skip check if family_id is being set to NULL (leaving family)
  IF NEW.family_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Count existing members with each role in the family
  SELECT COUNT(*) INTO ayah_count
  FROM public.users
  WHERE family_id = NEW.family_id AND role = 'ayah' AND id != NEW.id;
  
  SELECT COUNT(*) INTO ibu_count
  FROM public.users
  WHERE family_id = NEW.family_id AND role = 'ibu' AND id != NEW.id;
  
  -- Check if adding this user would exceed limits
  IF NEW.role = 'ayah' AND ayah_count >= 1 THEN
    RAISE EXCEPTION 'Family already has one ayah (father). Only one ayah is allowed per family.';
  END IF;
  
  IF NEW.role = 'ibu' AND ibu_count >= 1 THEN
    RAISE EXCEPTION 'Family already has one ibu (mother). Only one ibu is allowed per family.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle new user registration with proper error handling
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert user profile with error handling
  BEGIN
    INSERT INTO public.users (id, email, name, role)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(
        NEW.raw_user_meta_data->>'name',
        NEW.raw_user_meta_data->>'full_name',
        split_part(NEW.email, '@', 1),
        'User'
      ),
      CASE 
        WHEN NEW.raw_user_meta_data->>'role' = 'ayah' THEN 'ayah'::user_role
        WHEN NEW.email LIKE '%ayah%' THEN 'ayah'::user_role
        ELSE 'ibu'::user_role
      END
    );
  EXCEPTION 
    WHEN unique_violation THEN
      -- Update existing user if already exists
      UPDATE public.users 
      SET 
        email = NEW.email,
        name = COALESCE(
          NEW.raw_user_meta_data->>'name',
          NEW.raw_user_meta_data->>'full_name',
          name
        ),
        updated_at = NOW()
      WHERE id = NEW.id;
    WHEN OTHERS THEN
      -- Log error but don't fail the auth user creation
      RAISE WARNING 'Error creating user profile for %: %', NEW.email, SQLERRM;
  END;
  
  RETURN NEW;
END;
$$;

-- ====================================================================
-- STEP 6: CREATE TRIGGERS
-- ====================================================================

-- Triggers to automatically update updated_at columns
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON public.users 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
  
CREATE TRIGGER update_household_categories_updated_at 
  BEFORE UPDATE ON public.household_categories 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
  
CREATE TRIGGER update_household_transactions_updated_at 
  BEFORE UPDATE ON public.household_transactions 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
  
CREATE TRIGGER update_orders_updated_at 
  BEFORE UPDATE ON public.orders 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
  
CREATE TRIGGER update_order_expenses_updated_at 
  BEFORE UPDATE ON public.order_expenses 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
  
CREATE TRIGGER update_debts_updated_at 
  BEFORE UPDATE ON public.debts 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
  
CREATE TRIGGER update_families_updated_at 
  BEFORE UPDATE ON public.families 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Trigger to automatically set family_id
CREATE TRIGGER set_transaction_family_id
  BEFORE INSERT ON public.household_transactions
  FOR EACH ROW EXECUTE PROCEDURE set_family_id();

CREATE TRIGGER set_order_family_id
  BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE PROCEDURE set_family_id();

CREATE TRIGGER set_debt_family_id
  BEFORE INSERT ON public.debts
  FOR EACH ROW EXECUTE PROCEDURE set_family_id();

-- Trigger to check family role limits
CREATE TRIGGER check_family_role_limit_trigger
  BEFORE UPDATE OF family_id OR INSERT ON public.users
  FOR EACH ROW EXECUTE PROCEDURE check_family_role_limit();

-- Trigger to update debt paid amount
CREATE TRIGGER debt_payment_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.debt_payments
  FOR EACH ROW EXECUTE PROCEDURE update_debt_paid_amount();

-- Trigger to create user profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- ====================================================================
-- STEP 7: SYNC EXISTING AUTH USERS
-- ====================================================================

-- Sync any existing auth users to application users table
INSERT INTO public.users (id, email, name, role)
SELECT 
  id, 
  email,
  COALESCE(
    raw_user_meta_data->>'name',
    raw_user_meta_data->>'full_name',
    split_part(email, '@', 1),
    'User'
  ) as name,
  CASE 
    WHEN raw_user_meta_data->>'role' = 'ayah' THEN 'ayah'::user_role
    WHEN email LIKE '%ayah%' THEN 'ayah'::user_role
    ELSE 'ibu'::user_role
  END as role
FROM auth.users 
WHERE id NOT IN (SELECT id FROM public.users)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  updated_at = NOW();

-- ====================================================================
-- STEP 8: INSERT DEFAULT DATA
-- ====================================================================

-- Insert default household categories
INSERT INTO public.household_categories (name, icon, color, is_default) VALUES
('Makanan & Minuman', '🍽️', '#ef4444', true),
('Transportasi', '🚗', '#3b82f6', true),
('Kesehatan', '🏥', '#10b981', true),
('Pendidikan', '📚', '#f59e0b', true),
('Hiburan', '🎬', '#8b5cf6', true),
('Tagihan', '💡', '#6b7280', true),
('Pakaian', '👕', '#ec4899', true),
('Belanja Rumah Tangga', '🛒', '#06b6d4', true),
('Lainnya', '📝', '#64748b', true)
ON CONFLICT DO NOTHING;

-- Insert order expense categories
INSERT INTO public.order_expense_categories (name, description) VALUES
('Bahan Baku', 'Kain, benang, kancing, resleting, dan bahan utama lainnya'),
('Tenaga Kerja', 'Upah penjahit, helper, dan tenaga kerja produksi'),
('Produksi', 'Listrik, air, perawatan mesin, dan biaya produksi'),
('Operasional', 'Transport, komunikasi, packaging, dan biaya operasional'),
('Pemasaran', 'Iklan, promosi, dan aktivitas pemasaran'),
('Lainnya', 'Biaya-biaya lain yang tidak masuk kategori di atas')
ON CONFLICT DO NOTHING;

-- ====================================================================
-- STEP 9: ENABLE ROW LEVEL SECURITY (RLS)
-- ====================================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.household_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.household_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debt_payments ENABLE ROW LEVEL SECURITY;

-- Order expense categories are global, no RLS needed
ALTER TABLE public.order_expense_categories DISABLE ROW LEVEL SECURITY;

-- ====================================================================
-- STEP 10: CREATE COMPREHENSIVE RLS POLICIES
-- ====================================================================

-- Users table policies
CREATE POLICY "Users can view own profile" 
ON public.users FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON public.users FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
ON public.users FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Families table policies
CREATE POLICY "Family members can view family" 
ON public.families FOR SELECT 
USING (
  EXISTS (SELECT 1 FROM public.users WHERE family_id = families.id AND id = auth.uid())
);

CREATE POLICY "Family members can update family" 
ON public.families FOR UPDATE 
USING (
  EXISTS (SELECT 1 FROM public.users WHERE family_id = families.id AND id = auth.uid())
);

CREATE POLICY "Users can insert families" 
ON public.families FOR INSERT 
WITH CHECK (
  true
);

CREATE POLICY "Family members can insert families" 
ON public.families FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL
);

-- Household categories policies
CREATE POLICY "Users can view household categories" 
ON public.household_categories FOR SELECT 
USING (is_default = true OR user_id = auth.uid());

CREATE POLICY "Users can insert household categories" 
ON public.household_categories FOR INSERT 
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update own household categories" 
ON public.household_categories FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own household categories" 
ON public.household_categories FOR DELETE 
USING (auth.uid() = user_id AND is_default = false);

-- Household transactions policies
CREATE POLICY "Users can view own household transactions" 
ON public.household_transactions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Family members can view household transactions" 
ON public.household_transactions FOR SELECT 
USING (
  family_id IN (SELECT family_id FROM public.users WHERE id = auth.uid() AND family_id IS NOT NULL)
);

CREATE POLICY "Users can insert household transactions" 
ON public.household_transactions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own household transactions" 
ON public.household_transactions FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own household transactions" 
ON public.household_transactions FOR DELETE 
USING (auth.uid() = user_id);

-- Orders policies (ayah role only)
CREATE POLICY "Ayah can view orders" 
ON public.orders FOR SELECT 
USING (
  auth.uid() = user_id AND 
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ayah')
);

CREATE POLICY "Family members can view orders" 
ON public.orders FOR SELECT 
USING (
  family_id IN (SELECT family_id FROM public.users WHERE id = auth.uid() AND family_id IS NOT NULL) AND
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ayah')
);

CREATE POLICY "Ayah can insert orders" 
ON public.orders FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND 
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ayah')
);

CREATE POLICY "Ayah can update orders" 
ON public.orders FOR UPDATE 
USING (
  auth.uid() = user_id AND 
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ayah')
);

CREATE POLICY "Ayah can delete orders" 
ON public.orders FOR DELETE 
USING (
  auth.uid() = user_id AND 
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ayah')
);

-- Order expenses policies
CREATE POLICY "Ayah can view order expenses" 
ON public.order_expenses FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.orders o 
    WHERE o.id = order_id AND o.user_id = auth.uid()
  ) AND
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ayah')
);

CREATE POLICY "Family members can view order expenses" 
ON public.order_expenses FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.orders o 
    WHERE o.id = order_id AND o.family_id IN (SELECT family_id FROM public.users WHERE id = auth.uid() AND family_id IS NOT NULL)
  ) AND
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ayah')
);

CREATE POLICY "Ayah can insert order expenses" 
ON public.order_expenses FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders o 
    WHERE o.id = order_id AND o.user_id = auth.uid()
  ) AND
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ayah')
);

CREATE POLICY "Ayah can update order expenses" 
ON public.order_expenses FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.orders o 
    WHERE o.id = order_id AND o.user_id = auth.uid()
  ) AND
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ayah')
);

CREATE POLICY "Ayah can delete order expenses" 
ON public.order_expenses FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.orders o 
    WHERE o.id = order_id AND o.user_id = auth.uid()
  ) AND
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ayah')
);

-- Debts policies
CREATE POLICY "Users can view own debts" 
ON public.debts FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Family members can view debts" 
ON public.debts FOR SELECT 
USING (
  family_id IN (SELECT family_id FROM public.users WHERE id = auth.uid() AND family_id IS NOT NULL)
);

CREATE POLICY "Users can insert debts" 
ON public.debts FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own debts" 
ON public.debts FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own debts" 
ON public.debts FOR DELETE 
USING (auth.uid() = user_id);

-- Debt payments policies
CREATE POLICY "Users can view debt payments" 
ON public.debt_payments FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.debts d 
    WHERE d.id = debt_id AND d.user_id = auth.uid()
  )
);

CREATE POLICY "Family members can view debt payments" 
ON public.debt_payments FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.debts d 
    WHERE d.id = debt_id AND d.family_id IN (SELECT family_id FROM public.users WHERE id = auth.uid() AND family_id IS NOT NULL)
  )
);

CREATE POLICY "Users can insert debt payments" 
ON public.debt_payments FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.debts d 
    WHERE d.id = debt_id AND d.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update debt payments" 
ON public.debt_payments FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.debts d 
    WHERE d.id = debt_id AND d.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete debt payments" 
ON public.debt_payments FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.debts d 
    WHERE d.id = debt_id AND d.user_id = auth.uid()
  )
);

-- ====================================================================
-- STEP 11: GRANT PERMISSIONS
-- ====================================================================

-- Grant permissions to authenticated users
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ====================================================================
-- STEP 12: VERIFICATION AND STATUS REPORT
-- ====================================================================

-- Check table creation
SELECT 
  'TABLES CREATED' as status,
  COUNT(*) as table_count
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE';

-- Check enum types
SELECT 
  'ENUM TYPES' as status,
  COUNT(DISTINCT typname) as enum_count
FROM pg_type t 
WHERE typname IN ('user_role', 'transaction_type', 'debt_type', 'order_status');

-- Check triggers
SELECT 
  'TRIGGERS' as status,
  COUNT(*) as trigger_count
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
  AND trigger_name NOT LIKE 'RI_ConstraintTrigger%';

-- Check RLS policies
SELECT 
  'RLS POLICIES' as status,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public';

-- Check default data
SELECT 
  'DEFAULT CATEGORIES' as status,
  COUNT(*) as category_count
FROM public.household_categories 
WHERE is_default = true;

-- Check user sync
SELECT 
  'USER SYNC' as status,
  COUNT(*) as synced_users
FROM public.users;

-- Final status
SELECT '✅ COMPLETE DATABASE SETUP FINISHED SUCCESSFULLY!' as final_status;
SELECT 'ℹ️  You can now test user registration and login' as next_step;
SELECT 'ℹ️  Family synchronization is fully functional' as feature_status;