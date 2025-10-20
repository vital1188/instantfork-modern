import { supabase } from './supabase';

// User Profile helpers
export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  return { data, error };
};

export const updateUserProfile = async (userId: string, updates: {
  full_name?: string;
  avatar_url?: string;
  phone?: string;
  bio?: string;
  location?: { lat: number; lng: number; address?: string };
}) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('user_id', userId)
    .select()
    .single();

  return { data, error };
};

// User Preferences helpers
export const getUserPreferences = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  return { data, error };
};

export const updateUserPreferences = async (userId: string, updates: {
  dietary_preferences?: string[];
  favorite_cuisines?: string[];
  notification_enabled?: boolean;
  email_notifications?: boolean;
  push_notifications?: boolean;
  distance_preference?: number;
  price_range?: { min: number; max: number };
}) => {
  const { data, error } = await supabase
    .from('user_preferences')
    .update(updates)
    .eq('user_id', userId)
    .select()
    .single();

  return { data, error };
};

// App Rating helpers
export const getUserRating = async (userId: string) => {
  const { data, error } = await supabase
    .from('app_ratings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  return { data, error };
};

export const submitAppRating = async (userId: string, rating: number, review?: string) => {
  // Check if user already has a rating
  const { data: existing } = await getUserRating(userId);

  if (existing) {
    // Update existing rating
    const { data, error } = await supabase
      .from('app_ratings')
      .update({ rating, review })
      .eq('user_id', userId)
      .select()
      .single();

    return { data, error };
  } else {
    // Insert new rating
    const { data, error } = await supabase
      .from('app_ratings')
      .insert([{ user_id: userId, rating, review }])
      .select()
      .single();

    return { data, error };
  }
};

export const getAverageAppRating = async () => {
  const { data, error } = await supabase
    .from('app_ratings')
    .select('rating');

  if (error || !data || data.length === 0) {
    return { average: 0, count: 0 };
  }

  const average = data.reduce((sum, item) => sum + item.rating, 0) / data.length;
  return { average: Math.round(average * 10) / 10, count: data.length };
};
