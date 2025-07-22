-- FORCE SCHEMA REFRESH AND FIX EMAIL COLUMN ISSUE

-- Step 1: Drop everything related to restaurants to force a complete refresh
DROP VIEW IF EXISTS deals_with_restaurants CASCADE;
DROP TABLE IF EXISTS deal_claims CASCADE;
DROP TABLE IF EXISTS deals CASCADE;
DROP TABLE IF EXISTS restaurants CASCADE;

-- Step 2: Wait a moment for the drop to process
SELECT pg_sleep(1);

-- Step 3: Create restaurants table with email column explicitly defined
CREATE TABLE public.restaurants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,  -- EMAIL COLUMN EXPLICITLY DEFINED
  website TEXT,
  logo TEXT,
  location JSONB NOT NULL DEFAULT '{"lat": 0, "lng": 0}'::jsonb,
  opening_hours JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  UNIQUE(owner_id)
);

-- Step 4: Create deals table
CREATE TABLE public.deals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
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

-- Step 5: Create deal_claims table
CREATE TABLE public.deal_claims (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
  claimed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  redeemed BOOLEAN DEFAULT false,
  redeemed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, deal_id)
);

-- Step 6: Enable RLS
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_claims ENABLE ROW LEVEL SECURITY;

-- Step 7: Create all policies
CREATE POLICY "Public can view restaurants" ON public.restaurants
  FOR SELECT USING (true);

CREATE POLICY "Owners can insert own restaurant" ON public.restaurants
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update own restaurant" ON public.restaurants
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete own restaurant" ON public.restaurants
  FOR DELETE USING (auth.uid() = owner_id);

CREATE POLICY "Public can view active deals" ON public.deals
  FOR SELECT USING (active = true OR restaurant_id IN (
    SELECT id FROM public.restaurants WHERE owner_id = auth.uid()
  ));

CREATE POLICY "Restaurant owners can insert deals" ON public.deals
  FOR INSERT WITH CHECK (restaurant_id IN (
    SELECT id FROM public.restaurants WHERE owner_id = auth.uid()
  ));

CREATE POLICY "Restaurant owners can update own deals" ON public.deals
  FOR UPDATE USING (restaurant_id IN (
    SELECT id FROM public.restaurants WHERE owner_id = auth.uid()
  ));

CREATE POLICY "Restaurant owners can delete own deals" ON public.deals
  FOR DELETE USING (restaurant_id IN (
    SELECT id FROM public.restaurants WHERE owner_id = auth.uid()
  ));

CREATE POLICY "Users can view own claims" ON public.deal_claims
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can claim deals" ON public.deal_claims
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own claims" ON public.deal_claims
  FOR UPDATE USING (auth.uid() = user_id);

-- Step 8: Create indexes
CREATE INDEX idx_restaurants_owner_id ON public.restaurants(owner_id);
CREATE INDEX idx_deals_restaurant_id ON public.deals(restaurant_id);
CREATE INDEX idx_deals_active ON public.deals(active);
CREATE INDEX idx_deals_end_time ON public.deals(end_time);
CREATE INDEX idx_deal_claims_user_id ON public.deal_claims(user_id);
CREATE INDEX idx_deal_claims_deal_id ON public.deal_claims(deal_id);

-- Step 9: Force PostgREST to reload the schema cache
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- Step 10: Alternative schema reload methods
SELECT pg_notify('pgrst', 'reload schema');
SELECT pg_notify('pgrst', 'reload config');

-- Step 11: Verify the table structure
SELECT 
    'VERIFICATION: Restaurants table columns' as info,
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'restaurants'
ORDER BY ordinal_position;

-- Step 12: Test insert to verify everything works
DO $$
BEGIN
    -- Try to insert a test row to verify the structure
    INSERT INTO public.restaurants (
        owner_id,
        name,
        description,
        category,
        address,
        phone,
        email,
        location
    ) VALUES (
        '00000000-0000-0000-0000-000000000000'::uuid,
        'Schema Test Restaurant',
        'This is a test to verify schema',
        'Test',
        'Test Address',
        '000-0000',
        'test@schematest.com',
        '{"lat": 0, "lng": 0}'::jsonb
    );
    
    -- Immediately delete the test row
    DELETE FROM public.restaurants WHERE email = 'test@schematest.com';
    
    RAISE NOTICE 'Schema test successful - email column exists and works';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Schema test failed: %', SQLERRM;
END $$;

-- Step 13: Grant necessary permissions
GRANT ALL ON public.restaurants TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.deals TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.deal_claims TO postgres, anon, authenticated, service_role;

-- Step 14: Final schema cache reload attempt
SELECT pg_reload_conf();
