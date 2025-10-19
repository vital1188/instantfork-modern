/*
  # Complete InstantFork Database Schema

  ## 1. New Tables
  
  ### `restaurants`
  - `id` (uuid, primary key)
  - `owner_id` (uuid, references auth.users)
  - `name` (text)
  - `owner_name` (text)
  - `phone` (text)
  - `category` (text)
  - `description` (text)
  - `location` (jsonb) - stores address, city, state, zip, coordinates
  - `website` (text, optional)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `deals`
  - `id` (uuid, primary key)
  - `restaurant_id` (uuid, references restaurants)
  - `title` (text)
  - `description` (text)
  - `original_price` (numeric)
  - `deal_price` (numeric)
  - `discount` (numeric, calculated)
  - `image_url` (text)
  - `start_time` (timestamptz)
  - `end_time` (timestamptz)
  - `tags` (text[])
  - `is_active` (boolean)
  - `views` (integer)
  - `claims` (integer)
  - `quantity_available` (integer)
  - `quantity_claimed` (integer)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `deal_claims`
  - `id` (uuid, primary key)
  - `deal_id` (uuid, references deals)
  - `user_id` (uuid, references auth.users)
  - `claimed_at` (timestamptz)
  - `redeemed_at` (timestamptz, optional)
  - `is_redeemed` (boolean)
  - `claim_code` (text, unique)

  ## 2. Security
  - Enable RLS on all tables
  - Restaurants: owners can read/update their own data, anyone can read active restaurants
  - Deals: owners can manage their own deals, anyone can read active deals
  - Deal Claims: users can read/create their own claims, restaurants can read claims for their deals

  ## 3. Functions
  - `increment_deal_views()` - Increments view count for a deal
  - `claim_deal()` - Claims a deal for a user with validation
  - `redeem_deal()` - Marks a deal as redeemed

  ## 4. Important Notes
  - All timestamps use timestamptz for timezone support
  - Location data stored as JSONB for flexibility
  - Claim codes are unique 8-character alphanumeric strings
  - Deal quantities are tracked to prevent overbooking
*/

-- Create restaurants table
CREATE TABLE IF NOT EXISTS restaurants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  owner_name text NOT NULL,
  phone text NOT NULL,
  category text NOT NULL,
  description text NOT NULL,
  location jsonb NOT NULL,
  website text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create deals table
CREATE TABLE IF NOT EXISTS deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  original_price numeric NOT NULL CHECK (original_price >= 0),
  deal_price numeric NOT NULL CHECK (deal_price >= 0),
  discount numeric GENERATED ALWAYS AS (
    CASE 
      WHEN original_price > 0 THEN ROUND(((original_price - deal_price) / original_price * 100)::numeric, 0)
      ELSE 0
    END
  ) STORED,
  image_url text NOT NULL,
  start_time timestamptz DEFAULT now() NOT NULL,
  end_time timestamptz NOT NULL,
  tags text[] DEFAULT ARRAY[]::text[] NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  views integer DEFAULT 0 NOT NULL,
  claims integer DEFAULT 0 NOT NULL,
  quantity_available integer DEFAULT 100 NOT NULL CHECK (quantity_available >= 0),
  quantity_claimed integer DEFAULT 0 NOT NULL CHECK (quantity_claimed >= 0),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT valid_time_range CHECK (end_time > start_time),
  CONSTRAINT valid_quantity CHECK (quantity_claimed <= quantity_available)
);

-- Create deal_claims table
CREATE TABLE IF NOT EXISTS deal_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid REFERENCES deals(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  claimed_at timestamptz DEFAULT now() NOT NULL,
  redeemed_at timestamptz,
  is_redeemed boolean DEFAULT false NOT NULL,
  claim_code text UNIQUE NOT NULL,
  UNIQUE(deal_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_deals_restaurant_id ON deals(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_deals_is_active ON deals(is_active);
CREATE INDEX IF NOT EXISTS idx_deals_end_time ON deals(end_time);
CREATE INDEX IF NOT EXISTS idx_deal_claims_deal_id ON deal_claims(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_claims_user_id ON deal_claims(user_id);
CREATE INDEX IF NOT EXISTS idx_deal_claims_claim_code ON deal_claims(claim_code);
CREATE INDEX IF NOT EXISTS idx_restaurants_owner_id ON restaurants(owner_id);

-- Enable Row Level Security
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_claims ENABLE ROW LEVEL SECURITY;

-- Restaurants policies
CREATE POLICY "Anyone can view restaurants"
  ON restaurants FOR SELECT
  USING (true);

CREATE POLICY "Owners can insert their own restaurant"
  ON restaurants FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their own restaurant"
  ON restaurants FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their own restaurant"
  ON restaurants FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- Deals policies
CREATE POLICY "Anyone can view active deals"
  ON deals FOR SELECT
  USING (is_active = true AND end_time > now());

CREATE POLICY "Restaurant owners can view all their deals"
  ON deals FOR SELECT
  TO authenticated
  USING (
    restaurant_id IN (
      SELECT id FROM restaurants WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Restaurant owners can insert deals"
  ON deals FOR INSERT
  TO authenticated
  WITH CHECK (
    restaurant_id IN (
      SELECT id FROM restaurants WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Restaurant owners can update their deals"
  ON deals FOR UPDATE
  TO authenticated
  USING (
    restaurant_id IN (
      SELECT id FROM restaurants WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    restaurant_id IN (
      SELECT id FROM restaurants WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Restaurant owners can delete their deals"
  ON deals FOR DELETE
  TO authenticated
  USING (
    restaurant_id IN (
      SELECT id FROM restaurants WHERE owner_id = auth.uid()
    )
  );

-- Deal claims policies
CREATE POLICY "Users can view their own claims"
  ON deal_claims FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Restaurant owners can view claims for their deals"
  ON deal_claims FOR SELECT
  TO authenticated
  USING (
    deal_id IN (
      SELECT d.id FROM deals d
      JOIN restaurants r ON r.id = d.restaurant_id
      WHERE r.owner_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can claim deals"
  ON deal_claims FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own claims"
  ON deal_claims FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to generate claim code
CREATE OR REPLACE FUNCTION generate_claim_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  characters text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i integer;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(characters, floor(random() * length(characters) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- Function to increment deal views
CREATE OR REPLACE FUNCTION increment_deal_views(deal_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE deals
  SET views = views + 1,
      updated_at = now()
  WHERE id = deal_id_param;
END;
$$;

-- Function to claim a deal
CREATE OR REPLACE FUNCTION claim_deal(deal_id_param uuid, user_id_param uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deal_record RECORD;
  claim_code_value text;
  claim_id_value uuid;
BEGIN
  -- Check if deal exists and is active
  SELECT * INTO deal_record
  FROM deals
  WHERE id = deal_id_param
    AND is_active = true
    AND end_time > now();
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Deal not found or no longer active'
    );
  END IF;

  -- Check if user already claimed this deal
  IF EXISTS (
    SELECT 1 FROM deal_claims
    WHERE deal_id = deal_id_param
      AND user_id = user_id_param
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'You have already claimed this deal'
    );
  END IF;

  -- Check if deal has available quantity
  IF deal_record.quantity_claimed >= deal_record.quantity_available THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'This deal is sold out'
    );
  END IF;

  -- Generate unique claim code
  LOOP
    claim_code_value := generate_claim_code();
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM deal_claims WHERE claim_code = claim_code_value
    );
  END LOOP;

  -- Create claim
  INSERT INTO deal_claims (deal_id, user_id, claim_code)
  VALUES (deal_id_param, user_id_param, claim_code_value)
  RETURNING id INTO claim_id_value;

  -- Update deal statistics
  UPDATE deals
  SET claims = claims + 1,
      quantity_claimed = quantity_claimed + 1,
      updated_at = now()
  WHERE id = deal_id_param;

  RETURN jsonb_build_object(
    'success', true,
    'claim_id', claim_id_value,
    'claim_code', claim_code_value
  );
END;
$$;

-- Function to redeem a deal
CREATE OR REPLACE FUNCTION redeem_deal(claim_code_param text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  claim_record RECORD;
BEGIN
  -- Find the claim
  SELECT * INTO claim_record
  FROM deal_claims
  WHERE claim_code = claim_code_param;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid claim code'
    );
  END IF;

  -- Check if already redeemed
  IF claim_record.is_redeemed THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'This deal has already been redeemed'
    );
  END IF;

  -- Mark as redeemed
  UPDATE deal_claims
  SET is_redeemed = true,
      redeemed_at = now()
  WHERE claim_code = claim_code_param;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Deal redeemed successfully',
    'redeemed_at', now()
  );
END;
$$;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_restaurants_updated_at ON restaurants;
CREATE TRIGGER update_restaurants_updated_at
  BEFORE UPDATE ON restaurants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_deals_updated_at ON deals;
CREATE TRIGGER update_deals_updated_at
  BEFORE UPDATE ON deals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
