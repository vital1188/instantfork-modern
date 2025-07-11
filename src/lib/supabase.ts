import { createClient } from '@supabase/supabase-js';

// These should be in environment variables for production
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Auth helper functions
export const signUp = async (email: string, password: string, fullName: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });
  return { data, error };
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

export const updateProfile = async (userId: string, updates: any) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId);
  return { data, error };
};

export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return { data, error };
};

// Favorites functions
export const addFavorite = async (userId: string, dealId: string) => {
  const { data, error } = await supabase
    .from('favorites')
    .insert({ user_id: userId, deal_id: dealId });
  return { data, error };
};

export const removeFavorite = async (userId: string, dealId: string) => {
  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', userId)
    .eq('deal_id', dealId);
  return { error };
};

export const getUserFavorites = async (userId: string) => {
  const { data, error } = await supabase
    .from('favorites')
    .select('deal_id')
    .eq('user_id', userId);
  return { data, error };
};

// Deal history functions
export const addDealToHistory = async (userId: string, dealId: string) => {
  const { data, error } = await supabase
    .from('deal_history')
    .insert({ 
      user_id: userId, 
      deal_id: dealId,
      redeemed_at: new Date().toISOString()
    });
  return { data, error };
};

export const getUserDealHistory = async (userId: string) => {
  const { data, error } = await supabase
    .from('deal_history')
    .select('*')
    .eq('user_id', userId)
    .order('redeemed_at', { ascending: false });
  return { data, error };
};
