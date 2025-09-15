-- Schema Verification Queries
-- Run these queries in your Supabase SQL Editor to verify the family synchronization schema

-- 1. Verify families table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'families'
);

-- 2. Verify family_id columns exist
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name IN ('users', 'household_transactions', 'orders', 'debts') 
  AND column_name = 'family_id';

-- 3. Verify triggers exist
SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name
FROM pg_trigger 
WHERE tgname LIKE '%family%';

-- 4. Verify RLS policies for family access
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE policyname LIKE '%family%' 
  OR qual LIKE '%family%';

-- 5. Test family data insertion
-- First create a test family
INSERT INTO families (name) 
VALUES ('Test Family') 
RETURNING id;

-- Then verify the family was created
SELECT * FROM families WHERE name = 'Test Family';

-- Clean up test data
DELETE FROM families WHERE name = 'Test Family';