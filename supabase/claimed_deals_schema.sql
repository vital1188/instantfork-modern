-- Create claimed_deals table to track user deal claims
CREATE TABLE IF NOT EXISTS claimed_deals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    claim_code VARCHAR(50) UNIQUE NOT NULL, -- Unique code for QR generation
    claimed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    redeemed_at TIMESTAMP WITH TIME ZONE NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'redeemed', 'expired')),
    qr_data JSONB, -- Store QR code data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_claimed_deals_user_id ON claimed_deals(user_id);
CREATE INDEX IF NOT EXISTS idx_claimed_deals_deal_id ON claimed_deals(deal_id);
CREATE INDEX IF NOT EXISTS idx_claimed_deals_restaurant_id ON claimed_deals(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_claimed_deals_claim_code ON claimed_deals(claim_code);
CREATE INDEX IF NOT EXISTS idx_claimed_deals_status ON claimed_deals(status);

-- Enable RLS
ALTER TABLE claimed_deals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own claimed deals" ON claimed_deals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own claimed deals" ON claimed_deals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Restaurants can view claims for their deals" ON claimed_deals
    FOR SELECT USING (
        restaurant_id IN (
            SELECT id FROM restaurants WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Restaurants can update claims for their deals" ON claimed_deals
    FOR UPDATE USING (
        restaurant_id IN (
            SELECT id FROM restaurants WHERE owner_id = auth.uid()
        )
    );

-- Function to generate unique claim code
CREATE OR REPLACE FUNCTION generate_claim_code()
RETURNS TEXT AS $$
DECLARE
    code TEXT;
    exists BOOLEAN;
BEGIN
    LOOP
        -- Generate a random 8-character alphanumeric code
        code := upper(substring(md5(random()::text) from 1 for 8));
        
        -- Check if code already exists
        SELECT EXISTS(SELECT 1 FROM claimed_deals WHERE claim_code = code) INTO exists;
        
        -- Exit loop if code is unique
        IF NOT exists THEN
            EXIT;
        END IF;
    END LOOP;
    
    RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Function to claim a deal
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
    IF v_deal.expires_at < NOW() THEN
        RETURN json_build_object('success', false, 'error', 'Deal has expired');
    END IF;
    
    -- Check if deal has available quantity
    IF v_deal.quantity_available IS NOT NULL AND v_deal.quantity_claimed >= v_deal.quantity_available THEN
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
    
    -- Create claimed deal record
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
            'claim_code', v_claim_code,
            'deal_title', v_deal.title,
            'restaurant_name', v_restaurant.name,
            'deal_price', v_deal.deal_price,
            'original_price', v_deal.original_price,
            'expires_at', v_expires_at,
            'claimed_at', NOW()
        )
    ) RETURNING id INTO v_claimed_deal_id;
    
    -- Update deal quantity claimed
    UPDATE deals 
    SET quantity_claimed = quantity_claimed + 1,
        updated_at = NOW()
    WHERE id = p_deal_id;
    
    -- Return success with claim information
    RETURN json_build_object(
        'success', true,
        'claimed_deal_id', v_claimed_deal_id,
        'claim_code', v_claim_code,
        'expires_at', v_expires_at,
        'qr_data', json_build_object(
            'claim_code', v_claim_code,
            'deal_title', v_deal.title,
            'restaurant_name', v_restaurant.name,
            'deal_price', v_deal.deal_price,
            'original_price', v_deal.original_price,
            'expires_at', v_expires_at,
            'claimed_at', NOW()
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to redeem a deal (for restaurants)
CREATE OR REPLACE FUNCTION redeem_deal(
    p_claim_code TEXT,
    p_restaurant_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_claimed_deal claimed_deals%ROWTYPE;
    v_deal deals%ROWTYPE;
    v_restaurant restaurants%ROWTYPE;
BEGIN
    -- Get claimed deal by code
    SELECT * INTO v_claimed_deal FROM claimed_deals WHERE claim_code = p_claim_code;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Invalid claim code');
    END IF;
    
    -- Check if deal has expired
    IF v_claimed_deal.expires_at < NOW() THEN
        -- Update status to expired
        UPDATE claimed_deals SET status = 'expired', updated_at = NOW() WHERE id = v_claimed_deal.id;
        RETURN json_build_object('success', false, 'error', 'Deal claim has expired');
    END IF;
    
    -- Check if deal is already redeemed
    IF v_claimed_deal.status = 'redeemed' THEN
        RETURN json_build_object('success', false, 'error', 'Deal has already been redeemed');
    END IF;
    
    -- If restaurant_id is provided, verify it matches
    IF p_restaurant_id IS NOT NULL AND v_claimed_deal.restaurant_id != p_restaurant_id THEN
        RETURN json_build_object('success', false, 'error', 'This deal is not for your restaurant');
    END IF;
    
    -- Get deal and restaurant information
    SELECT * INTO v_deal FROM deals WHERE id = v_claimed_deal.deal_id;
    SELECT * INTO v_restaurant FROM restaurants WHERE id = v_claimed_deal.restaurant_id;
    
    -- Mark deal as redeemed
    UPDATE claimed_deals 
    SET status = 'redeemed',
        redeemed_at = NOW(),
        updated_at = NOW()
    WHERE id = v_claimed_deal.id;
    
    -- Return success with redemption information
    RETURN json_build_object(
        'success', true,
        'deal_title', v_deal.title,
        'deal_price', v_deal.deal_price,
        'original_price', v_deal.original_price,
        'restaurant_name', v_restaurant.name,
        'claimed_at', v_claimed_deal.claimed_at,
        'redeemed_at', NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
