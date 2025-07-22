-- Debug Restaurant Deals Issue

-- 1. Check if deals exist in the database
SELECT 
    'Total deals in database:' as check_type,
    COUNT(*) as count
FROM deals;

-- 2. Check deals with their details
SELECT 
    id,
    title,
    active,
    start_time,
    end_time,
    end_time > NOW() as is_future,
    created_at
FROM deals
ORDER BY created_at DESC;

-- 3. Check if the view exists
SELECT EXISTS (
    SELECT FROM information_schema.views 
    WHERE table_schema = 'public' 
    AND table_name = 'deals_with_restaurants'
) as view_exists;

-- 4. If view doesn't exist, create it
DROP VIEW IF EXISTS deals_with_restaurants CASCADE;

CREATE VIEW deals_with_restaurants AS
SELECT 
  d.id,
  d.restaurant_id,
  d.title,
  d.description,
  d.original_price,
  d.deal_price,
  d.image_url,
  d.tags,
  d.start_time,
  d.end_time,
  d.active,
  d.views,
  d.claims,
  d.created_at,
  d.updated_at,
  r.name as restaurant_name,
  r.category as restaurant_category,
  r.location as restaurant_location,
  r.address as restaurant_address,
  r.logo as restaurant_logo,
  r.phone as restaurant_phone
FROM deals d
JOIN restaurants r ON d.restaurant_id = r.id
WHERE d.active = true AND d.end_time > NOW();

-- Grant permissions
GRANT SELECT ON deals_with_restaurants TO anon, authenticated;

-- 5. Check what's in the view
SELECT 
    'Deals in view:' as check_type,
    COUNT(*) as count
FROM deals_with_restaurants;

-- 6. Show the actual deals in the view
SELECT 
    id,
    title,
    restaurant_name,
    deal_price,
    end_time,
    active
FROM deals_with_restaurants;

-- 7. Check for any deals that might be filtered out
SELECT 
    'Inactive deals:' as reason,
    COUNT(*) as count
FROM deals d
JOIN restaurants r ON d.restaurant_id = r.id
WHERE d.active = false
UNION ALL
SELECT 
    'Past deals:' as reason,
    COUNT(*) as count
FROM deals d
JOIN restaurants r ON d.restaurant_id = r.id
WHERE d.end_time <= NOW()
UNION ALL
SELECT 
    'Active future deals:' as reason,
    COUNT(*) as count
FROM deals d
JOIN restaurants r ON d.restaurant_id = r.id
WHERE d.active = true AND d.end_time > NOW();

-- 8. Check RLS policies
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
WHERE tablename IN ('deals', 'restaurants', 'deals_with_restaurants')
ORDER BY tablename, policyname;
