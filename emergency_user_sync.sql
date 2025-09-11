-- Emergency User Sync Fix
-- This script will fix the "user created in auth but not in users table" issue
-- Run this IMMEDIATELY in Supabase SQL Editor

-- Step 1: Show current mismatch
SELECT 'BEFORE FIX:' as status;
SELECT 'Auth users count:' as type, count(*) as count FROM auth.users;
SELECT 'App users count:' as type, count(*) as count FROM public.users;

-- Step 2: Temporarily disable RLS to ensure sync works
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Step 3: Sync ALL missing users from auth to app table
INSERT INTO public.users (id, email, name, role, created_at, updated_at)
SELECT 
  a.id,
  a.email,
  COALESCE(
    a.raw_user_meta_data->>'name',
    split_part(a.email, '@', 1),
    'User'
  ) as name,
  CASE 
    WHEN a.email LIKE '%ayah%' THEN 'ayah'::user_role
    WHEN a.raw_user_meta_data->>'role' = 'ayah' THEN 'ayah'::user_role
    ELSE 'ibu'::user_role
  END as role,
  a.created_at,
  NOW() as updated_at
FROM auth.users a 
WHERE NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = a.id)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  updated_at = NOW();

-- Step 4: Re-enable RLS with proper policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for users" ON public.users;
DROP POLICY IF EXISTS "Enable insert for users" ON public.users;
DROP POLICY IF EXISTS "Enable update for users" ON public.users;

CREATE POLICY "Enable read access for users" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Enable insert for users" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable update for users" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Step 5: Fix the trigger for future registrations
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  SET local row_security = off;
  
  INSERT INTO public.users (id, email, name, role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1),
      'User'
    ),
    CASE 
      WHEN NEW.email LIKE '%ayah%' THEN 'ayah'::user_role
      WHEN NEW.raw_user_meta_data->>'role' = 'ayah' THEN 'ayah'::user_role
      ELSE 'ibu'::user_role
    END,
    NEW.created_at,
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    updated_at = NOW();
    
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to create user profile for %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 6: Grant proper permissions
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated, service_role;

-- Step 7: Show results after fix
SELECT 'AFTER FIX:' as status;
SELECT 'Auth users count:' as type, count(*) as count FROM auth.users;
SELECT 'App users count:' as type, count(*) as count FROM public.users;

SELECT '✅ SYNC COMPLETED! Now try logging in.' as final_status;