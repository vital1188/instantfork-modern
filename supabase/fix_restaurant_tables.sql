-- Check if restaurants table exists and has all columns
DO $$
BEGIN
    -- Check if restaurants table exists
    IF NOT EXISTS (SELECT FROM information_schema.tables 
                   WHERE table_schema = 'public' 
                   AND table_name = 'restaurants') THEN
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
        
        -- Enable RLS
        ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
        
        -- Create policies
        CREATE POLICY "Public can view restaurants" ON restaurants
          FOR SELECT USING (true);

        CREATE POLICY "Owners can insert own restaurant" ON restaurants
          FOR INSERT WITH CHECK (auth.uid() = owner_id);

        CREATE POLICY "Owners can update own restaurant" ON restaurants
          FOR UPDATE USING (auth.uid() = owner_id);

        CREATE POLICY "Owners can delete own restaurant" ON restaurants
          FOR DELETE USING (auth.uid() = owner_id);
          
        -- Create index
        CREATE INDEX idx_restaurants_owner_id ON restaurants(owner_id);
    END IF;
    
    -- Check if deals table exists
    IF NOT EXISTS (SELECT FROM information_schema.tables 
                   WHERE table_schema = 'public' 
                   AND table_name = 'deals') THEN
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
        
        -- Enable RLS
        ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
        
        -- Create policies
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
          
        -- Create indexes
        CREATE INDEX idx_deals_restaurant_id ON deals(restaurant_id);
        CREATE INDEX idx_deals_active ON deals(active);
        CREATE INDEX idx_deals_end_time ON deals(end_time);
    END IF;
    
    -- Check if deal_claims table exists
    IF NOT EXISTS (SELECT FROM information_schema.tables 
                   WHERE table_schema = 'public' 
                   AND table_name = 'deal_claims') THEN
        -- Create deal_claims table
        CREATE TABLE deal_claims (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
          claimed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
          redeemed BOOLEAN DEFAULT false,
          redeemed_at TIMESTAMP WITH TIME ZONE,
          UNIQUE(user_id, deal_id)
        );
        
        -- Enable RLS
        ALTER TABLE deal_claims ENABLE ROW LEVEL SECURITY;
        
        -- Create policies
        CREATE POLICY "Users can view own claims" ON deal_claims
          FOR SELECT USING (auth.uid() = user_id);

        CREATE POLICY "Users can claim deals" ON deal_claims
          FOR INSERT WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Users can update own claims" ON deal_claims
          FOR UPDATE USING (auth.uid() = user_id);
          
        -- Create indexes
        CREATE INDEX idx_deal_claims_user_id ON deal_claims(user_id);
        CREATE INDEX idx_deal_claims_deal_id ON deal_claims(deal_id);
    END IF;
END $$;

-- Create or replace functions
CREATE OR REPLACE FUNCTION increment_deal_views(deal_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE deals 
  SET views = views + 1 
  WHERE id = deal_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_deal_claims(deal_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE deals 
  SET claims = claims + 1 
  WHERE id = deal_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or replace trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_restaurants_updated_at') THEN
        CREATE TRIGGER update_restaurants_updated_at BEFORE UPDATE ON restaurants
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_deals_updated_at') THEN
        CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON deals
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Create view if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.views 
                   WHERE table_schema = 'public' 
                   AND table_name = 'deals_with_restaurants') THEN
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
    END IF;
END $$;

-- Verify the tables were created successfully
SELECT 
    t.table_name,
    COUNT(c.column_name) as column_count
FROM information_schema.tables t
LEFT JOIN information_schema.columns c 
    ON t.table_schema = c.table_schema 
    AND t.table_name = c.table_name
WHERE t.table_schema = 'public' 
    AND t.table_name IN ('restaurants', 'deals', 'deal_claims')
GROUP BY t.table_name
ORDER BY t.table_name;

-- Show restaurants table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'restaurants'
ORDER BY ordinal_position;
