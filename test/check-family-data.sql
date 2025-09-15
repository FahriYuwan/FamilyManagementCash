-- Check the specific family and its members
SELECT 'Family Info' as section, id, name, created_at, updated_at 
FROM families 
WHERE id = 'eb4faa44-2fe0-437d-9a32-b8d7c87a3d53';

SELECT 'Users in Family' as section, id, name, role, family_id, created_at 
FROM users 
WHERE family_id = 'eb4faa44-2fe0-437d-9a32-b8d7c87a3d53';

SELECT 'All Users' as section, id, name, role, family_id, created_at 
FROM users 
ORDER BY name;

SELECT 'Family with Members' as section, 
       f.id as family_id, 
       f.name as family_name,
       u.id as user_id,
       u.name as user_name,
       u.role as user_role
FROM families f
LEFT JOIN users u ON f.id = u.family_id
WHERE f.id = 'eb4faa44-2fe0-437d-9a32-b8d7c87a3d53'
ORDER BY u.name;