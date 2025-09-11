-- Debug Schema Verification Script
-- Run this in Supabase SQL Editor to check the current state

-- 1. Check if users table exists and has correct structure
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'users'
ORDER BY ordinal_position;

-- 2. Check if demo users exist in auth.users
SELECT 
  'auth.users' as table_name,
  id, 
  email, 
  email_confirmed_at,
  created_at
FROM auth.users 
WHERE email IN ('ayah@demo.com', 'ibu@demo.com', 'demo.ayah@example.com', 'demo.ibu@example.com')
ORDER BY email;

-- 3. Check if demo users exist in application users table
SELECT 
  'public.users' as table_name,
  id, 
  email, 
  name,
  role,
  created_at
FROM public.users 
ORDER BY email;

-- 4. Check RLS policies on users table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'users';

-- 5. Test if current auth context can access users table
SELECT 
  'Current auth check' as test_name,
  auth.uid() as current_user_id,
  count(*) as accessible_users
FROM public.users
WHERE auth.uid() = id;

-- 6. Check all public tables exist
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 7. Check enum types exist
SELECT 
  typname as enum_name,
  enumlabel as enum_values
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE typname IN ('user_role', 'transaction_type', 'debt_type', 'order_status')
ORDER BY typname, enumsortorder;