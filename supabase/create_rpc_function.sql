-- Create RPC function as a workaround for schema cache issues
CREATE OR REPLACE FUNCTION create_restaurant(
  p_owner_id UUID,
  p_name TEXT,
  p_description TEXT,
  p_category TEXT,
  p_address TEXT,
  p_phone TEXT,
  p_email TEXT,
  p_website TEXT,
  p_location JSONB
)
RETURNS UUID AS $$
DECLARE
  v_restaurant_id UUID;
BEGIN
  -- Insert the restaurant
  INSERT INTO restaurants (
    owner_id,
    name,
    description,
    category,
    address,
    phone,
    email,
    website,
    location
  ) VALUES (
    p_owner_id,
    p_name,
    p_description,
    p_category,
    p_address,
    p_phone,
    p_email,
    p_website,
    p_location
  ) RETURNING id INTO v_restaurant_id;
  
  RETURN v_restaurant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION create_restaurant TO authenticated;
