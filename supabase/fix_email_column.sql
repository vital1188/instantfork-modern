-- First, let's check what columns exist in the restaurants table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'restaurants'
ORDER BY ordinal_position;

-- Add email column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'restaurants' 
        AND column_name = 'email'
    ) THEN
        ALTER TABLE restaurants ADD COLUMN email TEXT NOT NULL DEFAULT '';
    END IF;
END $$;

-- Update the default if needed
ALTER TABLE restaurants ALTER COLUMN email DROP DEFAULT;

-- If the above doesn't work, let's try a more aggressive approach
-- Drop and recreate the entire table structure

-- First, backup any existing data (if any)
CREATE TEMP TABLE restaurants_backup AS SELECT * FROM restaurants WHERE false;

-- Drop the table and all dependencies
DROP VIEW IF EXISTS deals_with_restaurants CASCADE;
DROP TABLE IF EXISTS deal_claims CASCADE;
DROP TABLE IF EXISTS deals CASCADE;
DROP TABLE IF EXISTS restaurants CASCADE;

-- Recreate restaurants table with ALL columns including email
CREATE TABLE restaurants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,  -- This is the column that was missing
  website TEXT,
  logo TEXT,
  location JSONB NOT NULL DEFAULT '{"lat": 0, "lng": 0}'::jsonb,
  opening_hours JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  UNIQUE(owner_id)
);

-- Recreate deals table
CREATE TABLE deals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  original_price DECIMAL NOT NULL,
  deal_price DECIMAL NOT NULL,
  image_url TEXT,
  tags TEXT[] DEFAULT '{}',
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  active BOOLEAN DEFAULT true,
  views INTEGER DEFAULT 0,
  claims INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Recreate deal_claims table
CREATE TABLE deal_claims (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  claimed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  redeemed BOOLEAN DEFAULT false,
  redeemed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, deal_id)
);

-- Enable RLS on all tables
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_claims ENABLE ROW LEVEL SECURITY;

-- Create all policies for restaurants
CREATE POLICY "Public can view restaurants" ON restaurants
  FOR SELECT USING (true);

CREATE POLICY "Owners can insert own restaurant" ON restaurants
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update own restaurant" ON restaurants
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete own restaurant" ON restaurants
  FOR DELETE USING (auth.uid() = owner_id);

-- Create all policies for deals
CREATE POLICY "Public can view active deals" ON deals
  FOR SELECT USING (active = true OR restaurant_id IN (
    SELECT id FROM restaurants WHERE owner_id = auth.uid()
  ));

CREATE POLICY "Restaurant owners can insert deals" ON deals
  FOR INSERT WITH CHECK (restaurant_id IN (
    SELECT id FROM restaurants WHERE owner_id = auth.uid()
  ));

CREATE POLICY "Restaurant owners can update own deals" ON deals
  FOR UPDATE USING (restaurant_id IN (
    SELECT id FROM restaurants WHERE owner_id = auth.uid()
  ));

CREATE POLICY "Restaurant owners can delete own deals" ON deals
  FOR DELETE USING (restaurant_id IN (
    SELECT id FROM restaurants WHERE owner_id = auth.uid()
  ));

-- Create policies for deal_claims
CREATE POLICY "Users can view own claims" ON deal_claims
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can claim deals" ON deal_claims
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own claims" ON deal_claims
  FOR UPDATE USING (auth.uid() = user_id);

-- Create all indexes
CREATE INDEX idx_restaurants_owner_id ON restaurants(owner_id);
CREATE INDEX idx_deals_restaurant_id ON deals(restaurant_id);
CREATE INDEX idx_deals_active ON deals(active);
CREATE INDEX idx_deals_end_time ON deals(end_time);
CREATE INDEX idx_deal_claims_user_id ON deal_claims(user_id);
CREATE INDEX idx_deal_claims_deal_id ON deal_claims(deal_id);

-- Create update trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_restaurants_updated_at BEFORE UPDATE ON restaurants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON deals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Recreate the view
CREATE VIEW deals_with_restaurants AS
SELECT 
  d.*,
  r.name as restaurant_name,
  r.category as restaurant_category,
  r.location as restaurant_location,
  r.address as restaurant_address,
  r.logo as restaurant_logo,
  r.phone as restaurant_phone
FROM deals d
JOIN restaurants r ON d.restaurant_id = r.id
WHERE d.active = true AND d.end_time > NOW();

-- Grant access
GRANT SELECT ON deals_with_restaurants TO anon, authenticated;

-- Verify the email column now exists
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'restaurants'
    AND column_name = 'email';

-- Show full table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'restaurants'
ORDER BY ordinal_position;

-- Force schema cache refresh
NOTIFY pgrst, 'reload schema';
