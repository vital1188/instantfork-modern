-- DIAGNOSTIC SCRIPT: Run this to understand the issue

-- 1. Check if restaurants table exists
SELECT 
    'Table exists:' as check_type,
    EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'restaurants'
    ) as result;

-- 2. If table exists, show all columns
SELECT 
    ordinal_position,
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'restaurants'
ORDER BY ordinal_position;

-- 3. Check specifically for email column
SELECT 
    'Email column exists:' as check_type,
    EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'restaurants'
        AND column_name = 'email'
    ) as result;

-- 4. Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'restaurants';

-- 5. Check if there are any rows in the table
SELECT 
    'Row count:' as check_type,
    COUNT(*) as result
FROM restaurants;

-- 6. Try a simple insert test (this will fail if structure is wrong)
-- DO NOT RUN THIS IF YOU HAVE PRODUCTION DATA
/*
INSERT INTO restaurants (
    owner_id,
    name,
    description,
    category,
    address,
    phone,
    email,
    location
) VALUES (
    gen_random_uuid(),
    'Test Restaurant',
    'Test Description',
    'Pizza',
    '123 Test St',
    '555-1234',
    'test@example.com',
    '{"lat": 0, "lng": 0}'::jsonb
);
*/
