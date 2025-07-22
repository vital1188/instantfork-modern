-- Create restaurants table
CREATE TABLE restaurants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  website TEXT,
  logo TEXT,
  location JSONB NOT NULL DEFAULT '{"lat": 0, "lng": 0}'::jsonb,
  opening_hours JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  UNIQUE(owner_id)
);

-- Create deals table
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

-- Create deal_claims table to track user claims
CREATE TABLE deal_claims (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  claimed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  redeemed BOOLEAN DEFAULT false,
  redeemed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, deal_id)
);

-- Enable Row Level Security
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_claims ENABLE ROW LEVEL SECURITY;

-- Restaurants policies
CREATE POLICY "Public can view restaurants" ON restaurants
  FOR SELECT USING (true);

CREATE POLICY "Owners can insert own restaurant" ON restaurants
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update own restaurant" ON restaurants
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete own restaurant" ON restaurants
  FOR DELETE USING (auth.uid() = owner_id);

-- Deals policies
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

-- Deal claims policies
CREATE POLICY "Users can view own claims" ON deal_claims
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can claim deals" ON deal_claims
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own claims" ON deal_claims
  FOR UPDATE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_restaurants_owner_id ON restaurants(owner_id);
CREATE INDEX idx_deals_restaurant_id ON deals(restaurant_id);
CREATE INDEX idx_deals_active ON deals(active);
CREATE INDEX idx_deals_end_time ON deals(end_time);
CREATE INDEX idx_deal_claims_user_id ON deal_claims(user_id);
CREATE INDEX idx_deal_claims_deal_id ON deal_claims(deal_id);

-- Create a function to increment deal views
CREATE OR REPLACE FUNCTION increment_deal_views(deal_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE deals 
  SET views = views + 1 
  WHERE id = deal_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to increment deal claims
CREATE OR REPLACE FUNCTION increment_deal_claims(deal_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE deals 
  SET claims = claims + 1 
  WHERE id = deal_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_restaurants_updated_at BEFORE UPDATE ON restaurants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON deals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create a view for deals with restaurant info
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

-- Grant access to the view
GRANT SELECT ON deals_with_restaurants TO anon, authenticated;
