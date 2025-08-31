/*
  # Update claim_deal function to return simple claim code

  1. Changes
    - Simplify claim_deal function to return just claim code
    - Remove QR data complexity
    - Make redemption process faster for restaurants
    
  2. Security
    - Maintain existing RLS policies
    - Keep claim validation logic
*/

-- Update the claim_deal function to be simpler
CREATE OR REPLACE FUNCTION claim_deal(
    p_deal_id UUID,
    p_user_id UUID DEFAULT auth.uid()
)
RETURNS JSON AS $$
DECLARE
    v_deal deals%ROWTYPE;
    v_restaurant restaurants%ROWTYPE;
    v_claim_code TEXT;
    v_claimed_deal_id UUID;
    v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Check if user is authenticated
    IF p_user_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'User not authenticated');
    END IF;
    
    -- Get deal information
    SELECT * INTO v_deal FROM deals WHERE id = p_deal_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Deal not found');
    END IF;
    
    -- Check if deal is still active
    IF v_deal.end_time < NOW() THEN
        RETURN json_build_object('success', false, 'error', 'Deal has expired');
    END IF;
    
    -- Check if deal has available quantity
    IF v_deal.quantity_available IS NOT NULL AND COALESCE(v_deal.quantity_claimed, 0) >= v_deal.quantity_available THEN
        RETURN json_build_object('success', false, 'error', 'Deal is sold out');
    END IF;
    
    -- Check if user has already claimed this deal
    IF EXISTS(SELECT 1 FROM claimed_deals WHERE deal_id = p_deal_id AND user_id = p_user_id AND status = 'active') THEN
        RETURN json_build_object('success', false, 'error', 'You have already claimed this deal');
    END IF;
    
    -- Get restaurant information
    SELECT * INTO v_restaurant FROM restaurants WHERE id = v_deal.restaurant_id;
    
    -- Generate unique claim code
    v_claim_code := generate_claim_code();
    
    -- Set expiration time (24 hours from now)
    v_expires_at := NOW() + INTERVAL '24 hours';
    
    -- Create claimed deal record with simplified structure
    INSERT INTO claimed_deals (
        user_id,
        deal_id,
        restaurant_id,
        claim_code,
        expires_at,
        qr_data
    ) VALUES (
        p_user_id,
        p_deal_id,
        v_deal.restaurant_id,
        v_claim_code,
        v_expires_at,
        json_build_object(
            'deal_title', v_deal.title,
            'restaurant_name', v_restaurant.name,
            'deal_price', v_deal.deal_price,
            'original_price', v_deal.original_price
        )
    ) RETURNING id INTO v_claimed_deal_id;
    
    -- Update deal quantity claimed
    UPDATE deals 
    SET quantity_claimed = COALESCE(quantity_claimed, 0) + 1,
        updated_at = NOW()
    WHERE id = p_deal_id;
    
    -- Return simplified response with just the claim code
    RETURN json_build_object(
        'success', true,
        'claimed_deal_id', v_claimed_deal_id,
        'claim_code', v_claim_code,
        'expires_at', v_expires_at
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;