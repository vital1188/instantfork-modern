-- Check if the view exists
SELECT EXISTS (
    SELECT FROM information_schema.views 
    WHERE table_schema = 'public' 
    AND table_name = 'deals_with_restaurants'
) as view_exists;

-- Check if there are any deals in the deals table
SELECT COUNT(*) as total_deals FROM deals;

-- Check active deals
SELECT COUNT(*) as active_deals FROM deals WHERE active = true;

-- Check future deals
SELECT COUNT(*) as future_deals FROM deals WHERE end_time > NOW();

-- Check active future deals
SELECT COUNT(*) as active_future_deals FROM deals WHERE active = true AND end_time > NOW();

-- Show all deals with their status
SELECT 
    id,
    title,
    active,
    start_time,
    end_time,
    end_time > NOW() as is_future,
    created_at
FROM deals
ORDER BY created_at DESC
LIMIT 10;

-- Check the view content
SELECT * FROM deals_with_restaurants LIMIT 5;

-- If view doesn't exist or is empty, recreate it
DROP VIEW IF EXISTS deals_with_restaurants;

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

-- Test the view again
SELECT COUNT(*) as view_count FROM deals_with_restaurants;

-- Show what's in the view
SELECT 
    id,
    title,
    restaurant_name,
    active,
    end_time,
    end_time > NOW() as is_future
FROM deals_with_restaurants;
