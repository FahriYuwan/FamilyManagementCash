-- ====================================================================
-- FAMILY FEATURE TEST SCRIPT
-- Test script to verify family creation and role constraints
-- ====================================================================

-- Test 1: Create a family and add members
-- First, let's create two test users (in a real scenario, these would come from auth.users)
INSERT INTO public.users (id, email, name, role) 
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'ayah@test.com', 'Test Ayah', 'ayah'),
  ('22222222-2222-2222-2222-222222222222', 'ibu@test.com', 'Test Ibu', 'ibu')
ON CONFLICT (id) DO UPDATE SET 
  email = EXCLUDED.email, 
  name = EXCLUDED.name, 
  role = EXCLUDED.role;

-- Test 2: Create a family
INSERT INTO public.families (id, name) 
VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Test Family');

-- Test 3: Add ayah to family (should succeed)
UPDATE public.users 
SET family_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' 
WHERE id = '11111111-1111-1111-1111-111111111111';

-- Test 4: Add ibu to family (should succeed)
UPDATE public.users 
SET family_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' 
WHERE id = '22222222-2222-2222-2222-222222222222';

-- Test 5: Try to add another ayah to the same family (should fail)
INSERT INTO public.users (id, email, name, role) 
VALUES ('33333333-3333-3333-3333-333333333333', 'ayah2@test.com', 'Test Ayah 2', 'ayah')
ON CONFLICT (id) DO UPDATE SET 
  email = EXCLUDED.email, 
  name = EXCLUDED.name, 
  role = EXCLUDED.role;

-- This should fail with the constraint
UPDATE public.users 
SET family_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' 
WHERE id = '33333333-3333-3333-3333-333333333333';

-- Test 6: Try to add another ibu to the same family (should fail)
INSERT INTO public.users (id, email, name, role) 
VALUES ('44444444-4444-4444-4444-444444444444', 'ibu2@test.com', 'Test Ibu 2', 'ibu')
ON CONFLICT (id) DO UPDATE SET 
  email = EXCLUDED.email, 
  name = EXCLUDED.name, 
  role = EXCLUDED.role;

-- This should fail with the constraint
UPDATE public.users 
SET family_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' 
WHERE id = '44444444-4444-4444-4444-444444444444';

-- Test 7: Verify family members
SELECT 
  f.name as family_name,
  u.name as user_name,
  u.role as user_role
FROM public.families f
JOIN public.users u ON f.id = u.family_id
WHERE f.id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
ORDER BY u.role;

-- Test 8: Clean up test data
DELETE FROM public.users WHERE id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444444'
);

DELETE FROM public.families WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

-- Final verification
SELECT '✅ FAMILY FEATURE TESTS COMPLETED' as test_status;