-- Create function to calculate distance between two points using Haversine formula
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 FLOAT,
  lon1 FLOAT,
  lat2 FLOAT,
  lon2 FLOAT
) RETURNS FLOAT AS $$
DECLARE
  R FLOAT := 6371; -- Earth's radius in kilometers
  dlat FLOAT;
  dlon FLOAT;
  a FLOAT;
  c FLOAT;
BEGIN
  dlat := RADIANS(lat2 - lat1);
  dlon := RADIANS(lon2 - lon1);
  a := SIN(dlat/2) * SIN(dlat/2) + COS(RADIANS(lat1)) * COS(RADIANS(lat2)) * SIN(dlon/2) * SIN(dlon/2);
  c := 2 * ATAN2(SQRT(a), SQRT(1-a));
  RETURN R * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create an enhanced view that includes distance calculation
CREATE OR REPLACE VIEW deals_with_restaurants_enhanced AS
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
  r.phone as restaurant_phone,
  (r.location->>'lat')::FLOAT as restaurant_lat,
  (r.location->>'lng')::FLOAT as restaurant_lng
FROM deals d
JOIN restaurants r ON d.restaurant_id = r.id
WHERE d.active = true AND d.end_time > NOW();

-- Grant permissions
GRANT SELECT ON deals_with_restaurants_enhanced TO anon, authenticated;

-- Create function to search deals by location
CREATE OR REPLACE FUNCTION search_deals_by_location(
  user_lat FLOAT,
  user_lng FLOAT,
  max_distance FLOAT DEFAULT 10, -- Maximum distance in kilometers
  search_query TEXT DEFAULT NULL,
  category_filter TEXT DEFAULT NULL,
  max_price FLOAT DEFAULT NULL
) RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  original_price DECIMAL,
  deal_price DECIMAL,
  image_url TEXT,
  tags TEXT[],
  restaurant_name TEXT,
  restaurant_category TEXT,
  restaurant_address TEXT,
  distance FLOAT,
  end_time TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.title,
    d.description,
    d.original_price,
    d.deal_price,
    d.image_url,
    d.tags,
    d.restaurant_name,
    d.restaurant_category,
    d.restaurant_address,
    calculate_distance(user_lat, user_lng, d.restaurant_lat, d.restaurant_lng) as distance,
    d.end_time
  FROM deals_with_restaurants_enhanced d
  WHERE 
    -- Distance filter
    calculate_distance(user_lat, user_lng, d.restaurant_lat, d.restaurant_lng) <= max_distance
    -- Search query filter
    AND (search_query IS NULL OR search_query = '' OR 
         d.title ILIKE '%' || search_query || '%' OR 
         d.description ILIKE '%' || search_query || '%' OR
         d.restaurant_name ILIKE '%' || search_query || '%')
    -- Category filter
    AND (category_filter IS NULL OR category_filter = 'All' OR d.restaurant_category = category_filter)
    -- Price filter
    AND (max_price IS NULL OR d.deal_price <= max_price)
  ORDER BY distance ASC, d.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION search_deals_by_location TO anon, authenticated;
GRANT EXECUTE ON FUNCTION calculate_distance TO anon, authenticated;

-- Create RPC functions for incrementing views and claims
CREATE OR REPLACE FUNCTION increment_deal_views(deal_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE deals 
  SET views = views + 1 
  WHERE id = deal_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_deal_claims(deal_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE deals 
  SET claims = claims + 1 
  WHERE id = deal_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION increment_deal_views TO anon, authenticated;
GRANT EXECUTE ON FUNCTION increment_deal_claims TO anon, authenticated;

-- Test the location search function
-- Example: Search for deals within 5km of a location
SELECT * FROM search_deals_by_location(
  40.7128, -- NYC latitude
  -74.0060, -- NYC longitude
  5.0, -- 5km radius
  NULL, -- no search query
  NULL, -- all categories
  NULL  -- no price limit
);
