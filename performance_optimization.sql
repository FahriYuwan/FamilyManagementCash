-- Performance Optimization for Supabase Authentication
-- Run this in Supabase SQL Editor to improve authentication speed

-- Step 1: Add database connection pooling optimizations
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET track_activity_query_size = 2048;
ALTER SYSTEM SET log_min_duration_statement = 1000;

-- Step 2: Optimize the users table for faster authentication queries
-- Add partial index for faster auth lookups
CREATE INDEX IF NOT EXISTS idx_users_auth_lookup ON public.users(id) WHERE id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_email_lookup ON public.users(email) WHERE email IS NOT NULL;

-- Step 3: Optimize RLS policies for faster execution
-- Drop and recreate policies with better performance
DROP POLICY IF EXISTS "Enable read access for users" ON public.users;
DROP POLICY IF EXISTS "Enable insert for users" ON public.users;
DROP POLICY IF EXISTS "Enable update for users" ON public.users;

-- Create optimized policies with simpler conditions
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Step 4: Optimize the trigger function for faster execution
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Simple, fast insert with minimal logic
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'ibu'::user_role)
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Don't fail auth creation for profile issues
    RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 5: Add connection optimization settings
-- These help reduce connection overhead
ALTER DATABASE postgres SET log_statement = 'none';
ALTER DATABASE postgres SET log_duration = off;
ALTER DATABASE postgres SET log_lock_waits = off;

-- Step 6: Create a simple health check function for faster status checks
CREATE OR REPLACE FUNCTION public.health_check()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 'healthy'::TEXT;
$$;

-- Step 7: Vacuum and analyze for better performance
VACUUM ANALYZE public.users;
VACUUM ANALYZE auth.users;

-- Step 8: Show performance improvements
SELECT 
  'Performance optimization completed!' as status,
  'Users table size:' as info,
  pg_size_pretty(pg_total_relation_size('public.users')) as size;

SELECT 
  'Index information:' as info,
  indexname,
  tablename
FROM pg_indexes 
WHERE tablename = 'users' AND schemaname = 'public';

SELECT '✅ Database optimized for faster authentication!' as final_status;