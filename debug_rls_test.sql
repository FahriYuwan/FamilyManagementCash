-- Test RLS Policies and User Access
-- Run this in Supabase SQL Editor to test if RLS is blocking access

-- Test 1: Check if auth function works properly
SELECT 
  'Auth function test' as test_name,
  auth.uid() as current_auth_uid,
  auth.role() as current_role;

-- Test 2: Temporarily disable RLS to see if that's the issue
SET row_security = off;
SELECT 
  'RLS OFF - Can we see users?' as test_name,
  id, email, name, role 
FROM public.users 
WHERE email = 'ayah@demo.com';
SET row_security = on;

-- Test 3: Check RLS policies for users table
SELECT 
  policyname,
  cmd,
  permissive,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public';

-- Test 4: Try to simulate what the application does
-- This simulates the getUserProfile query
DO $$
DECLARE
    demo_user_id uuid;
    test_result record;
BEGIN
    -- Get the demo user ID
    SELECT id INTO demo_user_id 
    FROM auth.users 
    WHERE email = 'ayah@demo.com';
    
    IF demo_user_id IS NULL THEN
        RAISE NOTICE 'Demo user not found in auth.users';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Demo user ID: %', demo_user_id;
    
    -- Try the exact query that the app does
    -- This should work with RLS if the user is authenticated
    BEGIN
        SELECT * INTO test_result 
        FROM public.users 
        WHERE id = demo_user_id;
        
        IF test_result IS NULL THEN
            RAISE NOTICE 'User not found in public.users table';
        ELSE
            RAISE NOTICE 'SUCCESS: Found user in public.users - Name: %, Role: %', 
                       test_result.name, test_result.role;
        END IF;
    EXCEPTION WHEN insufficient_privilege THEN
        RAISE NOTICE 'RLS POLICY BLOCK: Insufficient privilege';
    WHEN OTHERS THEN
        RAISE NOTICE 'OTHER ERROR: %', SQLERRM;
    END;
END $$;

-- Test 5: Create a test policy that allows everything (temporary)
DROP POLICY IF EXISTS "Debug - Allow all for users" ON public.users;
CREATE POLICY "Debug - Allow all for users" 
ON public.users 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Test if this fixes the issue (we'll remove this policy later)
SELECT 
  'After debug policy' as test_name,
  count(*) as accessible_users 
FROM public.users;