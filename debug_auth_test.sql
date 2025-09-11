-- Authentication Test Script
-- Run this in Supabase SQL Editor to test authentication flow

-- Test 1: Simulate the exact query that the app makes
-- This is what getUserProfile() function does
DO $$
DECLARE
    test_user_id uuid;
    user_record record;
BEGIN
    -- Get a demo user ID from auth.users
    SELECT id INTO test_user_id 
    FROM auth.users 
    WHERE email = 'ayah@demo.com' 
    LIMIT 1;
    
    IF test_user_id IS NULL THEN
        RAISE NOTICE 'ERROR: No demo user found in auth.users with email ayah@demo.com';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Testing with user ID: %', test_user_id;
    
    -- Try to select from users table (this is what fails)
    BEGIN
        SELECT * INTO user_record
        FROM public.users 
        WHERE id = test_user_id;
        
        IF user_record IS NULL THEN
            RAISE NOTICE 'ERROR: User exists in auth.users but NOT in public.users';
        ELSE
            RAISE NOTICE 'SUCCESS: User found in public.users - Name: %, Role: %', user_record.name, user_record.role;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'ERROR querying public.users: %', SQLERRM;
    END;
END $$;

-- Test 2: Check if RLS is blocking access
SET row_security = off;
SELECT 
    'RLS OFF TEST' as test_name,
    count(*) as total_users
FROM public.users;
SET row_security = on;

-- Test 3: Check what the auth.uid() function returns (should be null in SQL editor)
SELECT 
    'Auth context test' as test_name,
    auth.uid() as current_auth_uid,
    CASE 
        WHEN auth.uid() IS NULL THEN 'No authenticated user (expected in SQL editor)'
        ELSE 'Authenticated user found'
    END as auth_status;

-- Test 4: Manual user insertion test
INSERT INTO public.users (id, email, name, role)
SELECT 
    id, 
    email, 
    'Test User Manual Insert',
    'ibu'::user_role
FROM auth.users 
WHERE email = 'ayah@demo.com'
  AND id NOT IN (SELECT id FROM public.users)
ON CONFLICT (id) DO UPDATE SET
    name = 'Manual Insert Updated',
    role = 'ayah'::user_role;

-- Verify the insertion worked
SELECT 
    'After manual insert' as test_name,
    id, 
    email, 
    name, 
    role
FROM public.users 
WHERE email = 'ayah@demo.com';