-- Fix User Creation Trigger
-- Run this in Supabase SQL Editor to fix the "Database error creating new user" issue

-- Step 1: Check if the trigger is causing the issue by temporarily disabling it
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Step 2: Test creating a user manually (this should work without the trigger)
-- After running this, try creating a user in Supabase Dashboard to see if it works

-- Step 3: If user creation works without trigger, recreate an improved trigger
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
BEGIN
  -- Add detailed logging
  RAISE LOG 'Trigger started for user: %', NEW.email;
  
  BEGIN
    -- Try to insert the user profile
    INSERT INTO public.users (id, email, name, role)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(
        NEW.raw_user_meta_data->>'name',
        NEW.raw_user_meta_data->>'full_name',
        split_part(NEW.email, '@', 1)
      ),
      COALESCE(
        (NEW.raw_user_meta_data->>'role')::user_role,
        CASE 
          WHEN NEW.email LIKE '%ayah%' THEN 'ayah'::user_role
          ELSE 'ibu'::user_role
        END
      )
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      name = EXCLUDED.name,
      updated_at = NOW();
    
    RAISE LOG 'User profile created successfully for: %', NEW.email;
    
  EXCEPTION 
    WHEN unique_violation THEN
      RAISE LOG 'User profile already exists for: %', NEW.email;
    WHEN OTHERS THEN
      RAISE LOG 'Error creating user profile for %: % (SQLSTATE: %)', NEW.email, SQLERRM, SQLSTATE;
      -- Don't fail the auth user creation, just log the error
  END;
  
  RETURN NEW;
END;
$$;

-- Step 4: Recreate the trigger (run this after testing user creation)
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- Step 5: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT INSERT, UPDATE ON public.users TO authenticated;

-- Step 6: Test the complete flow
SELECT 'Trigger setup completed. Try creating a user in Supabase Dashboard now.' as status;

-- Step 7: Check current trigger status
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Step 8: Check user table permissions
SELECT 
  grantee,
  privilege_type
FROM information_schema.role_table_grants 
WHERE table_name = 'users' AND table_schema = 'public';