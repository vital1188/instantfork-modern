-- COMPREHENSIVE DEBUG SCRIPT FOR RESTAURANT DEALS

-- 1. Check if deals exist
SELECT 'STEP 1: Checking deals table' as step;
SELECT COUNT(*) as total_deals FROM deals;
SELECT * FROM deals LIMIT 5;

-- 2. Check if restaurants exist
SELECT 'STEP 2: Checking restaurants table' as step;
SELECT COUNT(*) as total_restaurants FROM restaurants;
SELECT id, name, location, address FROM restaurants LIMIT 5;

-- 3. Check active deals with future end time
SELECT 'STEP 3: Checking active future deals' as step;
SELECT COUNT(*) as active_future_deals 
FROM deals 
WHERE active = true 
AND end_time > NOW();

-- 4. Show deal details with timing
SELECT 'STEP 4: Deal timing details' as step;
SELECT 
    id,
    title,
    active,
    start_time,
    end_time,
    NOW() as current_time,
    end_time > NOW() as is_future,
    (end_time - NOW()) as time_remaining
FROM deals
ORDER BY created_at DESC
LIMIT 5;

-- 5. Check if views exist
SELECT 'STEP 5: Checking views' as step;
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public' 
AND table_name IN ('deals_with_restaurants', 'deals_with_restaurants_enhanced');

-- 6. Test deals_with_restaurants view
SELECT 'STEP 6: Testing deals_with_restaurants view' as step;
SELECT COUNT(*) as view_count FROM deals_with_restaurants;
SELECT * FROM deals_with_restaurants LIMIT 2;

-- 7. Test location function
SELECT 'STEP 7: Testing location function' as step;
SELECT calculate_distance(40.7128, -74.0060, 40.7580, -73.9855) as distance_km;

-- 8. Test location-based search
SELECT 'STEP 8: Testing location search' as step;
SELECT COUNT(*) as location_search_count 
FROM search_deals_by_location(
    40.7128, -- NYC lat
    -74.0060, -- NYC lng
    1000.0 -- 1000km radius to catch everything
);

-- 9. Check permissions
SELECT 'STEP 9: Checking permissions' as step;
SELECT 
    grantee,
    privilege_type,
    table_name
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
AND table_name IN ('deals', 'restaurants', 'deals_with_restaurants')
AND grantee IN ('anon', 'authenticated');

-- 10. Create a test deal with proper future date
SELECT 'STEP 10: Creating test deal' as step;
DO $$
DECLARE
    v_restaurant_id UUID;
BEGIN
    -- Get first restaurant
    SELECT id INTO v_restaurant_id FROM restaurants LIMIT 1;
    
    IF v_restaurant_id IS NOT NULL THEN
        -- Insert a test deal that's definitely active
        INSERT INTO deals (
            restaurant_id,
            title,
            description,
            original_price,
            deal_price,
            start_time,
            end_time,
            active,
            tags
        ) VALUES (
            v_restaurant_id,
            'TEST DEAL - 50% Off Everything',
            'This is a test deal to verify the system is working',
            20.00,
            10.00,
            NOW(),
            NOW() + INTERVAL '7 days',
            true,
            ARRAY['test', 'discount']
        );
        
        RAISE NOTICE 'Test deal created successfully';
    ELSE
        RAISE NOTICE 'No restaurants found to create test deal';
    END IF;
END $$;

-- 11. Final check - what's in the view now?
SELECT 'STEP 11: Final view check' as step;
SELECT 
    id,
    title,
    restaurant_name,
    deal_price,
    active,
    end_time,
    end_time > NOW() as is_future
FROM deals_with_restaurants
ORDER BY created_at DESC
LIMIT 5;

-- 12. Direct query to see what should be visible
SELECT 'STEP 12: Direct query for visible deals' as step;
SELECT 
    d.id,
    d.title,
    r.name as restaurant_name,
    d.active,
    d.end_time,
    d.end_time > NOW() as should_be_visible
FROM deals d
JOIN restaurants r ON d.restaurant_id = r.id
WHERE d.active = true 
AND d.end_time > NOW()
ORDER BY d.created_at DESC;
