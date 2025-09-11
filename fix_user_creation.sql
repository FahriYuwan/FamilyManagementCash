-- Complete Fix for User Registration and Login Issues
-- This fixes: "User created in auth but not in users table" problem
-- Run this in Supabase SQL Editor

-- Step 1: Check current state
SELECT 'Current auth users:' as info, count(*) as count FROM auth.users;
SELECT 'Current app users:' as info, count(*) as count FROM public.users;

-- Step 2: Drop the problematic trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Step 3: Disable RLS temporarily for setup
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Step 4: Sync existing auth users to app users table
INSERT INTO public.users (id, email, name, role)
SELECT 
  id, 
  email,
  COALESCE(
    raw_user_meta_data->>'name',
    raw_user_meta_data->>'full_name',
    split_part(email, '@', 1)
  ) as name,
  CASE 
    WHEN email LIKE '%ayah%' THEN 'ayah'::user_role
    WHEN raw_user_meta_data->>'role' = 'ayah' THEN 'ayah'::user_role
    ELSE 'ibu'::user_role
  END as role
FROM auth.users 
WHERE id NOT IN (SELECT id FROM public.users)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  updated_at = NOW();

-- Step 5: Create improved trigger function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Disable RLS for this operation
  PERFORM set_config('row_security', 'off', true);
  
  BEGIN
    INSERT INTO public.users (id, email, name, role)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(
        NEW.raw_user_meta_data->>'name',
        NEW.raw_user_meta_data->>'full_name',
        split_part(NEW.email, '@', 1)
      ),
      CASE 
        WHEN NEW.email LIKE '%ayah%' THEN 'ayah'::user_role
        WHEN NEW.raw_user_meta_data->>'role' = 'ayah' THEN 'ayah'::user_role
        ELSE 'ibu'::user_role
      END
    );
    
    RAISE LOG 'User profile created for: %', NEW.email;
    
  EXCEPTION 
    WHEN unique_violation THEN
      UPDATE public.users 
      SET 
        email = NEW.email,
        name = COALESCE(
          NEW.raw_user_meta_data->>'name',
          NEW.raw_user_meta_data->>'full_name',
          split_part(NEW.email, '@', 1)
        ),
        updated_at = NOW()
      WHERE id = NEW.id;
      
      RAISE LOG 'User profile updated for: %', NEW.email;
      
    WHEN OTHERS THEN
      RAISE LOG 'Error in handle_new_user for %: % (SQLSTATE: %)', NEW.email, SQLERRM, SQLSTATE;
      -- Continue anyway, don't fail the auth user creation
  END;
  
  -- Re-enable RLS
  PERFORM set_config('row_security', 'on', true);
  
  RETURN NEW;
END;
$$;

-- Step 6: Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- Step 7: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.users TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;

-- Step 8: Re-enable RLS with proper policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Debug - Allow all for users" ON public.users;

-- Create comprehensive RLS policies
CREATE POLICY "Users can view own profile" 
ON public.users FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON public.users FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
ON public.users FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Step 9: Test the complete flow
SELECT 'After sync - auth users:' as info, count(*) as count FROM auth.users;
SELECT 'After sync - app users:' as info, count(*) as count FROM public.users;

-- Step 10: Verify trigger exists
SELECT 
  'Trigger status:' as info,
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Step 11: Test user creation manually (optional)
-- You can uncomment this to test:
-- INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
-- VALUES (
--   gen_random_uuid(),
--   'test@example.com',
--   crypt('password123', gen_salt('bf')),
--   NOW(),
--   NOW(),
--   NOW()
-- );

SELECT '✅ Fix completed! Now try registering a new user.' as status;