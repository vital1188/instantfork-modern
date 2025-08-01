import { supabase } from './supabase';

interface RestaurantDeal {
  id: string;
  title: string;
  description: string;
  restaurant_name: string;
  restaurant_category: string;
  original_price: number;
  deal_price: number;
  image_url: string | null;
  tags: string[];
  restaurant_address: string;
  restaurant_location: { lat: number; lng: number };
  start_time: string;
  end_time: string;
  views: number;
  claims: number;
}

// Fetch all active deals from restaurants
export const fetchRestaurantDeals = async () => {
  console.log('Fetching restaurant deals from Supabase...');
  
  const { data, error } = await supabase
    .from('deals_with_restaurants')
    .select('*')
    .gte('end_time', new Date().toISOString())
    .eq('active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching restaurant deals:', error);
    return [];
  }

  console.log('Raw restaurant deals from Supabase:', data);

  // Transform the data to match the format expected by the app
  const transformedDeals = (data as RestaurantDeal[]).map(deal => ({
    id: deal.id,
    restaurant_id: deal.id, // Use deal ID as restaurant_id for now
    title: deal.title,
    description: deal.description,
    image_url: deal.image_url || '/api/placeholder/400/300',
    original_price: deal.original_price,
    deal_price: deal.deal_price,
    discount_percentage: Math.round(((deal.original_price - deal.deal_price) / deal.original_price) * 100),
    start_time: new Date(deal.start_time),
    end_time: new Date(deal.end_time),
    location: deal.restaurant_location,
    tags: deal.tags || [],
    active: true, // Only fetching active deals
    created_at: new Date(), // Use current date as created_at
    restaurant: {
      id: deal.id,
      name: deal.restaurant_name,
      location: {
        lat: deal.restaurant_location.lat,
        lng: deal.restaurant_location.lng,
        address: deal.restaurant_address
      },
      description: '',
      category: deal.restaurant_category,
      rating: 4.5, // Default rating
      website: '',
      logo: deal.image_url || '/api/placeholder/400/300',
      phone: ''
    }
  }));
  
  console.log('Transformed restaurant deals:', transformedDeals);
  return transformedDeals;
};

// Search restaurant deals
export const searchRestaurantDeals = async (query: string, filters?: {
  category?: string;
  maxPrice?: number;
  tags?: string[];
}) => {
  let queryBuilder = supabase
    .from('deals_with_restaurants')
    .select('*')
    .gte('end_time', new Date().toISOString())
    .eq('active', true);

  // Apply search query
  if (query) {
    queryBuilder = queryBuilder.or(`title.ilike.%${query}%,description.ilike.%${query}%,restaurant_name.ilike.%${query}%`);
  }

  // Apply filters
  if (filters?.category && filters.category !== 'All') {
    queryBuilder = queryBuilder.eq('restaurant_category', filters.category);
  }

  if (filters?.maxPrice) {
    queryBuilder = queryBuilder.lte('deal_price', filters.maxPrice);
  }

  if (filters?.tags && filters.tags.length > 0) {
    queryBuilder = queryBuilder.contains('tags', filters.tags);
  }

  const { data, error } = await queryBuilder.order('created_at', { ascending: false });

  if (error) {
    console.error('Error searching restaurant deals:', error);
    return [];
  }

  // Transform the data
  return (data as RestaurantDeal[]).map(deal => ({
    id: deal.id,
    title: deal.title,
    description: deal.description,
    restaurant: deal.restaurant_name,
    category: deal.restaurant_category,
    originalPrice: deal.original_price,
    dealPrice: deal.deal_price,
    discount: Math.round(((deal.original_price - deal.deal_price) / deal.original_price) * 100),
    image: deal.image_url || '/api/placeholder/400/300',
    tags: deal.tags || [],
    location: deal.restaurant_address,
    coordinates: deal.restaurant_location,
    startTime: deal.start_time,
    endTime: deal.end_time,
    views: deal.views || 0,
    claims: deal.claims || 0,
    isRestaurantDeal: true
  }));
};

// Increment deal views
export const incrementDealViews = async (dealId: string) => {
  const { error } = await supabase.rpc('increment_deal_views', { deal_id: dealId });
  
  if (error) {
    console.error('Error incrementing deal views:', error);
  }
};

// Claim a deal
export const claimDeal = async (dealId: string, userId: string) => {
  // First, check if already claimed
  const { data: existingClaim } = await supabase
    .from('deal_claims')
    .select('id')
    .eq('deal_id', dealId)
    .eq('user_id', userId)
    .single();

  if (existingClaim) {
    return { error: new Error('Deal already claimed') };
  }

  // Create the claim
  const { error: claimError } = await supabase
    .from('deal_claims')
    .insert({ deal_id: dealId, user_id: userId });

  if (claimError) {
    return { error: claimError };
  }

  // Increment the claims count
  const { error: incrementError } = await supabase.rpc('increment_deal_claims', { deal_id: dealId });

  if (incrementError) {
    console.error('Error incrementing deal claims:', incrementError);
  }

  return { error: null };
};

// Get user's claimed deals
export const getUserClaimedDeals = async (userId: string) => {
  const { data, error } = await supabase
    .from('deal_claims')
    .select(`
      *,
      deals!inner(
        *,
        restaurants!inner(
          name,
          category,
          address,
          location
        )
      )
    `)
    .eq('user_id', userId)
    .order('claimed_at', { ascending: false });

  if (error) {
    console.error('Error fetching claimed deals:', error);
    return [];
  }

  return data;
};
