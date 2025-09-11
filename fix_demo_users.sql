-- Verify tables were created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;-- Fix for Missing Demo Users in Application Users Table
-- Run this in Supabase SQL Editor

-- Insert demo users into the application users table
-- These match the existing auth.users records

INSERT INTO public.users (id, email, name, role) 
SELECT 
  id,
  email,
  CASE 
    WHEN email = 'ayah@demo.com' THEN 'Ayah Demo'
    WHEN email = 'ibu@demo.com' THEN 'Ibu Demo'
    ELSE split_part(email, '@', 1)
  END as name,
  CASE 
    WHEN email = 'ayah@demo.com' THEN 'ayah'::user_role
    WHEN email = 'ibu@demo.com' THEN 'ibu'::user_role
    ELSE 'ibu'::user_role
  END as role
FROM auth.users 
WHERE email IN ('ayah@demo.com', 'ibu@demo.com')
AND NOT EXISTS (
  SELECT 1 FROM public.users WHERE users.id = auth.users.id
);

-- Verify the insert worked
SELECT id, email, name, role, created_at FROM public.users;