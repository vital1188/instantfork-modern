-- Create the deals_with_restaurants view
CREATE OR REPLACE VIEW deals_with_restaurants AS
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

-- Grant permissions to the view
GRANT SELECT ON deals_with_restaurants TO anon, authenticated;

-- Test the view
SELECT COUNT(*) as total_deals FROM deals_with_restaurants;

-- Show the deals in the view
SELECT 
    id,
    title,
    restaurant_name,
    deal_price,
    end_time
FROM deals_with_restaurants;
