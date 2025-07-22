import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, getCurrentUser, signIn, signUp, signOut, isSupabaseConfigured } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Alias for compatibility
export const useAuthContext = useAuth;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If Supabase is not configured, skip auth initialization
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    // Check active sessions and sets the user
    const initializeAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Error getting current user:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for changes on auth state (sign in, sign out, etc.)
    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      
      // Update user in store when auth state changes
      if (session?.user) {
        // You can update the store here if needed
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const value = {
    user,
    loading,
    signIn: async (email: string, password: string) => {
      const result = await signIn(email, password);
      if (!result.error && result.data?.user) {
        setUser(result.data.user);
      }
      return { error: result.error };
    },
    signUp: async (email: string, password: string, fullName: string) => {
      const result = await signUp(email, password, fullName);
      if (!result.error && result.data?.user) {
        setUser(result.data.user);
      }
      return { error: result.error };
    },
    signOut: async () => {
      const result = await signOut();
      if (!result.error) {
        setUser(null);
      }
      return result;
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
