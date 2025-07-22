import { supabase } from './supabase';

// Helper function to create restaurant with explicit column mapping
export const createRestaurant = async (restaurantData: {
  owner_id: string;
  name: string;
  description: string;
  category: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  location: { lat: number; lng: number };
}) => {
  // First, let's try a direct insert with explicit column names
  const { data, error } = await supabase
    .from('restaurants')
    .insert([{
      owner_id: restaurantData.owner_id,
      name: restaurantData.name,
      description: restaurantData.description,
      category: restaurantData.category,
      address: restaurantData.address,
      phone: restaurantData.phone,
      email: restaurantData.email,
      website: restaurantData.website || null,
      location: restaurantData.location
    }])
    .select()
    .single();

  if (error) {
    console.error('Restaurant creation error:', error);
    
    // If the error is about the email column, try an alternative approach
    if (error.message.includes('email')) {
      console.log('Attempting alternative insert method...');
      
      // Try using RPC function as a workaround
      const { data: rpcData, error: rpcError } = await supabase.rpc('create_restaurant', {
        p_owner_id: restaurantData.owner_id,
        p_name: restaurantData.name,
        p_description: restaurantData.description,
        p_category: restaurantData.category,
        p_address: restaurantData.address,
        p_phone: restaurantData.phone,
        p_email: restaurantData.email,
        p_website: restaurantData.website || null,
        p_location: restaurantData.location
      });
      
      if (rpcError) {
        console.error('RPC error:', rpcError);
        return { data: null, error: rpcError };
      }
      
      return { data: rpcData, error: null };
    }
  }

  return { data, error };
};

// Helper to get restaurant by owner ID
export const getRestaurantByOwner = async (ownerId: string) => {
  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .eq('owner_id', ownerId)
    .single();
    
  return { data, error };
};

// Helper to update restaurant
export const updateRestaurant = async (restaurantId: string, updates: Partial<{
  name: string;
  description: string;
  category: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  logo: string;
  location: { lat: number; lng: number };
  opening_hours: Record<string, unknown>;
}>) => {
  const { data, error } = await supabase
    .from('restaurants')
    .update(updates)
    .eq('id', restaurantId)
    .select()
    .single();
    
  return { data, error };
};
