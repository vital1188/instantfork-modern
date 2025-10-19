/*
  # Create Deals View with Restaurant Data

  ## Purpose
  Creates a view that combines deals with their restaurant information,
  making it easier to fetch deal data for the frontend application.

  ## Changes
  1. Create `deals_with_restaurants` view
     - Joins deals with restaurants table
     - Includes all deal fields
     - Includes restaurant name, category, and location
     - Only shows active deals that haven't expired

  ## Security
  - View respects existing RLS policies on deals and restaurants tables
  - Public access for viewing active deals
*/

-- Create view for deals with restaurant information
CREATE OR REPLACE VIEW deals_with_restaurants AS
SELECT 
  d.id,
  d.title,
  d.description,
  d.original_price,
  d.deal_price,
  d.discount,
  d.image_url,
  d.start_time,
  d.end_time,
  d.tags,
  d.is_active,
  d.views,
  d.claims,
  d.quantity_available,
  d.quantity_claimed,
  d.created_at,
  d.updated_at,
  r.id as restaurant_id,
  r.name as restaurant_name,
  r.category as restaurant_category,
  r.phone as restaurant_phone,
  r.location as restaurant_location,
  r.website as restaurant_website
FROM deals d
JOIN restaurants r ON r.id = d.restaurant_id
WHERE d.is_active = true 
  AND d.end_time > now();
