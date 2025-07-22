-- Fix Restaurant Deals Visibility on Map

-- 1. First, let's check what deals exist
SELECT 'Checking all deals in database:' as step;
SELECT id, title, restaurant_id, active, start_time, end_time, created_at
FROM deals
ORDER BY created_at DESC;

-- 2. Check what restaurants exist
SELECT 'Checking all restaurants:' as step;
SELECT id, name, location, address
FROM restaurants;

-- 3. Drop and recreate the view with proper structure
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

-- 4. Grant permissions
GRANT SELECT ON deals_with_restaurants TO anon, authenticated;

-- 5. Update any existing deals to be active with future end times
UPDATE deals 
SET 
  active = true,
  end_time = NOW() + INTERVAL '7 days',
  start_time = NOW() - INTERVAL '1 hour'
WHERE restaurant_id IN (SELECT id FROM restaurants);

-- 6. If no deals exist, create some sample deals for existing restaurants
DO $$
DECLARE
  rest RECORD;
  deal_count INTEGER;
BEGIN
  -- Check if we have any deals
  SELECT COUNT(*) INTO deal_count FROM deals;
  
  IF deal_count = 0 THEN
    -- Create sample deals for each restaurant
    FOR rest IN SELECT * FROM restaurants LIMIT 5
    LOOP
      INSERT INTO deals (
        restaurant_id,
        title,
        description,
        original_price,
        deal_price,
        image_url,
        tags,
        start_time,
        end_time,
        active
      ) VALUES (
        rest.id,
        CASE 
          WHEN rest.category = 'Italian' THEN '50% Off Pasta Special'
          WHEN rest.category = 'Mexican' THEN 'Taco Tuesday Deal'
          WHEN rest.category = 'American' THEN 'Burger & Fries Combo'
          WHEN rest.category = 'Asian' THEN 'Lunch Bento Box Special'
          ELSE '25% Off Dinner Special'
        END,
        'Limited time offer! Come enjoy our delicious food at a great price.',
        CASE 
          WHEN rest.category = 'Italian' THEN 45.00
          WHEN rest.category = 'Mexican' THEN 25.00
          WHEN rest.category = 'American' THEN 35.00
          WHEN rest.category = 'Asian' THEN 30.00
          ELSE 40.00
        END,
        CASE 
          WHEN rest.category = 'Italian' THEN 22.50
          WHEN rest.category = 'Mexican' THEN 15.00
          WHEN rest.category = 'American' THEN 20.00
          WHEN rest.category = 'Asian' THEN 18.00
          ELSE 30.00
        END,
        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800',
        ARRAY['dinner', 'special', 'limited-time'],
        NOW() - INTERVAL '1 hour',
        NOW() + INTERVAL '7 days',
        true
      );
    END LOOP;
  END IF;
END $$;

-- 7. Verify the view has data
SELECT 'Checking deals in view:' as step;
SELECT COUNT(*) as deal_count FROM deals_with_restaurants;

-- 8. Show sample data from the view
SELECT 'Sample deals from view:' as step;
SELECT 
  id,
  title,
  restaurant_name,
  restaurant_location,
  deal_price,
  active,
  end_time
FROM deals_with_restaurants
LIMIT 10;

-- 9. Create RPC functions for incrementing views and claims if they don't exist
CREATE OR REPLACE FUNCTION increment_deal_views(deal_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE deals 
  SET views = COALESCE(views, 0) + 1 
  WHERE id = deal_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_deal_claims(deal_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE deals 
  SET claims = COALESCE(claims, 0) + 1 
  WHERE id = deal_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Ensure location data is properly formatted
UPDATE restaurants
SET location = jsonb_build_object(
  'lat', (location->>'lat')::float,
  'lng', (location->>'lng')::float
)
WHERE location IS NOT NULL 
  AND jsonb_typeof(location) = 'object'
  AND location ? 'lat' 
  AND location ? 'lng';

-- Final check
SELECT 'Final summary:' as step;
SELECT 
  (SELECT COUNT(*) FROM restaurants) as total_restaurants,
  (SELECT COUNT(*) FROM deals) as total_deals,
  (SELECT COUNT(*) FROM deals WHERE active = true AND end_time > NOW()) as active_deals,
  (SELECT COUNT(*) FROM deals_with_restaurants) as deals_in_view;
