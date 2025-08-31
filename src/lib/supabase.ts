import { createClient } from '@supabase/supabase-js';

// These should be in environment variables for production
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Check if Supabase is configured
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey && 
  supabaseUrl !== 'https://your-project.supabase.co' && 
  supabaseAnonKey !== 'your-anon-key');

// Create client only if configured
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null as any;

// Auth helper functions
export const signUp = async (email: string, password: string, fullName: string) => {
  if (!isSupabaseConfigured) {
    return { 
      data: null, 
      error: new Error('Supabase is not configured. Please follow the setup instructions in SUPABASE_SETUP.md') 
    };
  }
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo: undefined, // Disable email confirmation
      },
    });
    
    if (error) {
      console.error('Supabase signUp error:', error);
      return { data: null, error };
    }
    
    return { data, error: null };
  } catch (err) {
    console.error('SignUp exception:', err);
    return { data: null, error: err };
  }
};

export const signIn = async (email: string, password: string) => {
  if (!isSupabaseConfigured) {
    return { 
      data: null, 
      error: new Error('Supabase is not configured. Please follow the setup instructions in SUPABASE_SETUP.md') 
    };
  }
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    
    if (error) {
      console.error('Supabase signIn error:', error);
      return { data: null, error };
    }
    
    return { data, error: null };
  } catch (err) {
    console.error('SignIn exception:', err);
    return { data: null, error: err };
  }
};

export const signOut = async () => {
  if (!isSupabaseConfigured) {
    return { error: null };
  }
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async () => {
  if (!isSupabaseConfigured) {
    return null;
  }
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

export const updateProfile = async (userId: string, updates: any) => {
  if (!isSupabaseConfigured) {
    return { data: null, error: new Error('Supabase not configured') };
  }
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId);
  return { data, error };
};

export const getUserProfile = async (userId: string) => {
  if (!isSupabaseConfigured) {
    return { data: null, error: new Error('Supabase not configured') };
  }
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return { data, error };
};

// Favorites functions
export const addFavorite = async (userId: string, dealId: string) => {
  if (!isSupabaseConfigured) {
    return { data: null, error: new Error('Supabase not configured') };
  }
  const { data, error } = await supabase
    .from('favorites')
    .insert({ user_id: userId, deal_id: dealId });
  return { data, error };
};

export const removeFavorite = async (userId: string, dealId: string) => {
  if (!isSupabaseConfigured) {
    return { error: new Error('Supabase not configured') };
  }
  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', userId)
    .eq('deal_id', dealId);
  return { error };
};

export const getUserFavorites = async (userId: string) => {
  if (!isSupabaseConfigured) {
    return { data: [], error: null };
  }
  const { data, error } = await supabase
    .from('favorites')
    .select('deal_id')
    .eq('user_id', userId);
  return { data, error };
};

// Deal history functions
export const addDealToHistory = async (userId: string, dealId: string) => {
  if (!isSupabaseConfigured) {
    return { data: null, error: new Error('Supabase not configured') };
  }
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
  if (!isSupabaseConfigured) {
    return { data: [], error: null };
  }
  const { data, error } = await supabase
    .from('deal_history')
    .select('*')
    .eq('user_id', userId)
    .order('redeemed_at', { ascending: false });
  return { data, error };
};