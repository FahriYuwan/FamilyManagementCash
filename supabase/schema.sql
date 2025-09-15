-- FamilyManagementCash Database Schema with Family Synchronization
-- Run this in Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_role AS ENUM ('ayah', 'ibu');
CREATE TYPE transaction_type AS ENUM ('income', 'expense');
CREATE TYPE debt_type AS ENUM ('receivable', 'payable');
CREATE TYPE order_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');

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

-- Insert default household categories
INSERT INTO public.household_categories (name, icon, color, is_default) VALUES
('Makanan & Minuman', '🍽️', '#ef4444', true),
('Transportasi', '🚗', '#3b82f6', true),
('Kesehatan', '🏥', '#10b981', true),
('Pendidikan', '📚', '#f59e0b', true),
('Hiburan', '🎬', '#8b5cf6', true),
('Tagihan', '💡', '#6b7280', true),
('Pakaian', '👕', '#ec4899', true),
('Lainnya', '📝', '#64748b', true);

-- Insert default order expense categories
INSERT INTO public.order_expense_categories (name, description) VALUES
('Bahan Baku', 'Kain, benang, kancing, resleting, dll'),
('Tenaga Kerja', 'Upah penjahit dan helper'),
('Produksi', 'Listrik, mesin, perawatan alat'),
('Operasional', 'Transport, komunikasi, packaging');

-- Create indexes for better performance
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
CREATE INDEX idx_users_family_id ON public.users(family_id);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_household_categories_updated_at BEFORE UPDATE ON public.household_categories FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_household_transactions_updated_at BEFORE UPDATE ON public.household_transactions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_order_expenses_updated_at BEFORE UPDATE ON public.order_expenses FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_debts_updated_at BEFORE UPDATE ON public.debts FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_families_updated_at BEFORE UPDATE ON public.families FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.household_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.household_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debt_payments ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Families policies
CREATE POLICY "Family members can view family" ON public.families FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE family_id = families.id AND id = auth.uid())
);
CREATE POLICY "Family members can update family" ON public.families FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.users WHERE family_id = families.id AND id = auth.uid())
);

-- Household categories policies
CREATE POLICY "Users can view household categories" ON public.household_categories FOR SELECT USING (
  is_default = true OR user_id = auth.uid()
);
CREATE POLICY "Users can insert household categories" ON public.household_categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own household categories" ON public.household_categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own household categories" ON public.household_categories FOR DELETE USING (auth.uid() = user_id AND is_default = false);

-- Household transactions policies
CREATE POLICY "Users can view own household transactions" ON public.household_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Family members can view household transactions" ON public.household_transactions FOR SELECT USING (
  family_id IN (SELECT family_id FROM public.users WHERE id = auth.uid() AND family_id IS NOT NULL)
);
CREATE POLICY "Users can insert household transactions" ON public.household_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own household transactions" ON public.household_transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own household transactions" ON public.household_transactions FOR DELETE USING (auth.uid() = user_id);

-- Orders policies (only 'ayah' role can access)
CREATE POLICY "Ayah can view orders" ON public.orders FOR SELECT USING (
  auth.uid() = user_id AND 
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ayah')
);
CREATE POLICY "Family members can view orders" ON public.orders FOR SELECT USING (
  family_id IN (SELECT family_id FROM public.users WHERE id = auth.uid() AND family_id IS NOT NULL) AND
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ayah')
);
CREATE POLICY "Ayah can insert orders" ON public.orders FOR INSERT WITH CHECK (
  auth.uid() = user_id AND 
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ayah')
);
CREATE POLICY "Ayah can update orders" ON public.orders FOR UPDATE USING (
  auth.uid() = user_id AND 
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ayah')
);
CREATE POLICY "Ayah can delete orders" ON public.orders FOR DELETE USING (
  auth.uid() = user_id AND 
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ayah')
);

-- Order expenses policies
CREATE POLICY "Ayah can view order expenses" ON public.order_expenses FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND user_id = auth.uid()) AND
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ayah')
);
CREATE POLICY "Family members can view order expenses" ON public.order_expenses FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND family_id IN (SELECT family_id FROM public.users WHERE id = auth.uid() AND family_id IS NOT NULL)) AND
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ayah')
);
CREATE POLICY "Ayah can insert order expenses" ON public.order_expenses FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND user_id = auth.uid()) AND
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ayah')
);
CREATE POLICY "Ayah can update order expenses" ON public.order_expenses FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND user_id = auth.uid()) AND
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ayah')
);
CREATE POLICY "Ayah can delete order expenses" ON public.order_expenses FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND user_id = auth.uid()) AND
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ayah')
);

-- Debts policies
CREATE POLICY "Users can view own debts" ON public.debts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Family members can view debts" ON public.debts FOR SELECT USING (
  family_id IN (SELECT family_id FROM public.users WHERE id = auth.uid() AND family_id IS NOT NULL)
);
CREATE POLICY "Users can insert debts" ON public.debts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own debts" ON public.debts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own debts" ON public.debts FOR DELETE USING (auth.uid() = user_id);

-- Debt payments policies
CREATE POLICY "Users can view debt payments" ON public.debt_payments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.debts WHERE id = debt_id AND user_id = auth.uid())
);
CREATE POLICY "Family members can view debt payments" ON public.debt_payments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.debts WHERE id = debt_id AND family_id IN (SELECT family_id FROM public.users WHERE id = auth.uid() AND family_id IS NOT NULL))
);
CREATE POLICY "Users can insert debt payments" ON public.debt_payments FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.debts WHERE id = debt_id AND user_id = auth.uid())
);
CREATE POLICY "Users can update debt payments" ON public.debt_payments FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.debts WHERE id = debt_id AND user_id = auth.uid())
);
CREATE POLICY "Users can delete debt payments" ON public.debt_payments FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.debts WHERE id = debt_id AND user_id = auth.uid())
);

-- Order expense categories can be viewed by everyone (no RLS needed for this table)
ALTER TABLE public.order_expense_categories DISABLE ROW LEVEL SECURITY;

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'ibu')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

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

-- Trigger to update debt paid amount
CREATE TRIGGER debt_payment_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.debt_payments
  FOR EACH ROW EXECUTE PROCEDURE update_debt_paid_amount();

-- Function to automatically set family_id on insert for transactions, orders, and debts
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

-- Triggers to automatically set family_id
CREATE TRIGGER set_transaction_family_id
  BEFORE INSERT ON public.household_transactions
  FOR EACH ROW EXECUTE PROCEDURE set_family_id();

CREATE TRIGGER set_order_family_id
  BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE PROCEDURE set_family_id();

CREATE TRIGGER set_debt_family_id
  BEFORE INSERT ON public.debts
  FOR EACH ROW EXECUTE PROCEDURE set_family_id();