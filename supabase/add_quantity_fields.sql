-- Add quantity fields to deals table

-- Add quantity_available column (how many deals are available)
ALTER TABLE deals 
ADD COLUMN IF NOT EXISTS quantity_available INTEGER DEFAULT NULL;

-- Add quantity_claimed column (how many have been claimed)
ALTER TABLE deals 
ADD COLUMN IF NOT EXISTS quantity_claimed INTEGER DEFAULT 0;

-- Add comments for clarity
COMMENT ON COLUMN deals.quantity_available IS 'Total number of deals available (NULL means unlimited)';
COMMENT ON COLUMN deals.quantity_claimed IS 'Number of deals that have been claimed';

-- Update existing deals to have some sample quantities
UPDATE deals 
SET 
  quantity_available = CASE 
    WHEN random() < 0.3 THEN NULL  -- 30% unlimited
    WHEN random() < 0.5 THEN 50    -- 20% have 50 available
    WHEN random() < 0.7 THEN 25    -- 20% have 25 available
    ELSE 10                        -- 30% have 10 available
  END,
  quantity_claimed = CASE 
    WHEN random() < 0.5 THEN 0     -- 50% have no claims yet
    WHEN random() < 0.8 THEN FLOOR(random() * 5)::INTEGER  -- 30% have 0-4 claims
    ELSE FLOOR(random() * 10)::INTEGER  -- 20% have 0-9 claims
  END
WHERE quantity_available IS NULL AND quantity_claimed IS NULL;

-- Create or replace the deals_with_restaurants view to include quantity fields
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
  d.quantity_available,
  d.quantity_claimed,
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

-- Create function to claim a deal (decrements available quantity)
CREATE OR REPLACE FUNCTION claim_deal(deal_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_available INTEGER;
  current_claimed INTEGER;
BEGIN
  -- Get current quantities
  SELECT quantity_available, quantity_claimed 
  INTO current_available, current_claimed
  FROM deals 
  WHERE id = deal_id AND active = true AND end_time > NOW();
  
  -- Check if deal exists
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Check if there are deals available (NULL means unlimited)
  IF current_available IS NOT NULL AND current_claimed >= current_available THEN
    RETURN FALSE; -- No more deals available
  END IF;
  
  -- Increment claimed count and claims
  UPDATE deals 
  SET 
    quantity_claimed = COALESCE(quantity_claimed, 0) + 1,
    claims = COALESCE(claims, 0) + 1
  WHERE id = deal_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION claim_deal(UUID) TO authenticated;

-- Create function to check if deal is available
CREATE OR REPLACE FUNCTION is_deal_available(deal_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_available INTEGER;
  current_claimed INTEGER;
BEGIN
  SELECT quantity_available, quantity_claimed 
  INTO current_available, current_claimed
  FROM deals 
  WHERE id = deal_id AND active = true AND end_time > NOW();
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- If quantity_available is NULL, it's unlimited
  IF current_available IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- Check if there are still deals available
  RETURN current_claimed < current_available;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION is_deal_available(UUID) TO anon, authenticated;

-- Show summary
SELECT 
  'Quantity fields added successfully' as status,
  COUNT(*) as total_deals,
  COUNT(CASE WHEN quantity_available IS NULL THEN 1 END) as unlimited_deals,
  COUNT(CASE WHEN quantity_available IS NOT NULL THEN 1 END) as limited_deals,
  AVG(quantity_claimed) as avg_claimed
FROM deals;
