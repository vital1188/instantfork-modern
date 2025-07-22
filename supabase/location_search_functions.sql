-- Function to calculate distance between two points using Haversine formula
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
CREATE OR REPLACE FUNCTION get_deals_near_location(
  user_lat FLOAT,
  user_lon FLOAT,
  max_distance FLOAT DEFAULT 10 -- Default 10km radius
) RETURNS TABLE (
  id UUID,
  restaurant_id UUID,
  title TEXT,
  description TEXT,
  original_price DECIMAL,
  deal_price DECIMAL,
  image_url TEXT,
  tags TEXT[],
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  active BOOLEAN,
  views INTEGER,
  claims INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  restaurant_name TEXT,
  restaurant_category TEXT,
  restaurant_location JSONB,
  restaurant_address TEXT,
  restaurant_logo TEXT,
  restaurant_phone TEXT,
  distance FLOAT
) AS $$
BEGIN
  RETURN QUERY
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
    calculate_distance(
      user_lat, 
      user_lon, 
      (r.location->>'lat')::FLOAT, 
      (r.location->>'lng')::FLOAT
    ) as distance
  FROM deals d
  JOIN restaurants r ON d.restaurant_id = r.id
  WHERE d.active = true 
    AND d.end_time > NOW()
    AND calculate_distance(
      user_lat, 
      user_lon, 
      (r.location->>'lat')::FLOAT, 
      (r.location->>'lng')::FLOAT
    ) <= max_distance
  ORDER BY distance ASC;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION calculate_distance TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_deals_near_location TO anon, authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_restaurants_location ON restaurants USING GIN (location);
CREATE INDEX IF NOT EXISTS idx_deals_active_end_time ON deals(active, end_time);

-- Test the function
SELECT * FROM get_deals_near_location(40.7128, -74.0060, 50); -- NYC coordinates, 50km radius
