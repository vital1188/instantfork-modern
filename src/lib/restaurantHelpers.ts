import { supabase } from './supabase';

// Helper function to create restaurant with proper column mapping
export const createRestaurant = async (restaurantData: {
  owner_id: string;
  name: string;
  owner_name: string;
  description: string;
  category: string;
  address: string;
  phone: string;
  website?: string;
  location: { lat: number; lng: number };
}) => {
  // Create restaurant according to the database schema
  // Schema has: owner_id, name, owner_name, phone, category, description, location, website

  const { data, error } = await supabase
    .from('restaurants')
    .insert([{
      owner_id: restaurantData.owner_id,
      name: restaurantData.name,
      owner_name: restaurantData.owner_name,
      phone: restaurantData.phone,
      category: restaurantData.category,
      description: restaurantData.description,
      location: {
        address: restaurantData.address,
        coordinates: restaurantData.location
      },
      website: restaurantData.website || null
    }])
    .select()
    .single();

  if (error) {
    console.error('Restaurant creation error:', error);
  }

  return { data, error };
};

// Helper to get restaurant by owner ID
export const getRestaurantByOwner = async (ownerId: string) => {
  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .eq('owner_id', ownerId)
    .maybeSingle();

  return { data, error };
};

// Helper to update restaurant
export const updateRestaurant = async (restaurantId: string, updates: Partial<{
  name: string;
  description: string;
  category: string;
  phone: string;
  website: string;
  logo: string;
  location: { address: string; coordinates: { lat: number; lng: number } };
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
