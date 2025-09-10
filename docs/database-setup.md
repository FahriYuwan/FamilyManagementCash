# Supabase Database Setup

## 1. Create Supabase Project

1. Visit [supabase.com](https://supabase.com)
2. Create new project
3. Copy your project URL and anon key to `.env.local`

## 2. Database Schema

Run these SQL commands in Supabase SQL Editor:

```sql
-- Create custom types
CREATE TYPE user_role AS ENUM ('ayah', 'ibu');
CREATE TYPE transaction_type AS ENUM ('income', 'expense');
CREATE TYPE order_status AS ENUM ('paid', 'unpaid');
CREATE TYPE expense_category AS ENUM ('bahan', 'produksi', 'tenaga_kerja', 'operasional', 'lainnya');
CREATE TYPE debt_status AS ENUM ('lunas', 'belum');

-- Create users table
CREATE TABLE users (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role user_role NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create household_transactions table
CREATE TABLE household_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type transaction_type NOT NULL,
    amount NUMERIC(15,2) NOT NULL,
    category TEXT NOT NULL,
    note TEXT,
    date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create orders table
CREATE TABLE orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_name TEXT NOT NULL,
    order_date DATE NOT NULL,
    income NUMERIC(15,2) NOT NULL,
    status order_status DEFAULT 'unpaid',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create order_expenses table
CREATE TABLE order_expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    category expense_category NOT NULL,
    amount NUMERIC(15,2) NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create debts table
CREATE TABLE debts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    debtor_name TEXT NOT NULL,
    amount NUMERIC(15,2) NOT NULL,
    status debt_status DEFAULT 'belum',
    due_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own transactions" ON household_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON household_transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions" ON household_transactions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions" ON household_transactions
    FOR DELETE USING (auth.uid() = user_id);

-- Similar policies for orders (ayah only)
CREATE POLICY "Ayah can manage orders" ON orders
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'ayah'
        )
    );

CREATE POLICY "Ayah can manage order expenses" ON order_expenses
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'ayah'
        )
    );

CREATE POLICY "Ayah can manage debts" ON debts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'ayah'
        )
    );
```

## 3. Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## 4. Auth Setup

1. Go to Authentication > Settings in Supabase
2. Enable email authentication
3. Configure redirect URLs for your domain