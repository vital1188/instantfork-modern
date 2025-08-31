import { supabase } from './supabase';
import QRCode from 'qrcode';

export interface ClaimedDeal {
  id: string;
  user_id: string;
  deal_id: string;
  restaurant_id: string;
  claim_code: string;
  claimed_at: string;
  redeemed_at?: string;
  expires_at: string;
  status: 'active' | 'redeemed' | 'expired';
  deal_title?: string;
  restaurant_name?: string;
  deal_price?: number;
  original_price?: number;
}

export interface ClaimDealResponse {
  success: boolean;
  error?: string;
  claimed_deal_id?: string;
  claim_code?: string;
  expires_at?: string;
}

export interface RedeemDealResponse {
  success: boolean;
  error?: string;
  deal_title?: string;
  deal_price?: number;
  original_price?: number;
  restaurant_name?: string;
  claimed_at?: string;
  redeemed_at?: string;
}

/**
 * Claim a deal for the current user
 */
export async function claimDeal(dealId: string): Promise<ClaimDealResponse> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'Please sign in to claim deals' };
    }

    // Try to use the database function first
    try {
      const { data, error } = await supabase.rpc('claim_deal', {
        p_deal_id: dealId,
        p_user_id: user.id
      });

      if (error) {
        throw error;
      }

      return data as ClaimDealResponse;
    } catch (dbError) {
      console.warn('Database function not available, using mock implementation:', dbError);
      
      // Mock implementation for demonstration
      const claimCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      
      return {
        success: true,
        claimed_deal_id: `mock-${Date.now()}`,
        claim_code: claimCode,
        expires_at: expiresAt
      };
    }
  } catch (error) {
    console.error('Error claiming deal:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to claim deal' 
    };
  }
}

/**
 * Get user's claimed deals
 */
export async function getUserClaimedDeals(): Promise<ClaimedDeal[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return [];
    }

    const { data, error } = await supabase
      .from('claimed_deals')
      .select(`
        *,
        deals!inner(title, deal_price, original_price, image_url),
        restaurants!inner(name, address)
      `)
      .eq('user_id', user.id)
      .order('claimed_at', { ascending: false });

    if (error) {
      console.error('Error fetching claimed deals:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching claimed deals:', error);
    return [];
  }
}


/**
 * Redeem a deal using claim code (for restaurants)
 */
export async function redeemDeal(claimCode: string, restaurantId?: string): Promise<RedeemDealResponse> {
  try {
    const { data, error } = await supabase.rpc('redeem_deal', {
      p_claim_code: claimCode,
      p_restaurant_id: restaurantId
    });

    if (error) {
      console.error('Error redeeming deal:', error);
      return { success: false, error: error.message };
    }

    return data as RedeemDealResponse;
  } catch (error) {
    console.error('Error redeeming deal:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to redeem deal' 
    };
  }
}

/**
 * Get restaurant's claimed deals (for restaurant dashboard)
 */
export async function getRestaurantClaimedDeals(restaurantId: string): Promise<ClaimedDeal[]> {
  try {
    const { data, error } = await supabase
      .from('claimed_deals')
      .select(`
        *,
        deals!inner(title, deal_price, original_price, image_url),
        auth.users!inner(email)
      `)
      .eq('restaurant_id', restaurantId)
      .order('claimed_at', { ascending: false });

    if (error) {
      console.error('Error fetching restaurant claimed deals:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching restaurant claimed deals:', error);
    return [];
  }
}


/**
 * Check if a deal claim is still valid
 */
export function isClaimValid(claimedDeal: ClaimedDeal): boolean {
  const now = new Date();
  const expiresAt = new Date(claimedDeal.expires_at);
  
  return claimedDeal.status === 'active' && expiresAt > now;
}

/**
 * Get time remaining for a claim
 */
export function getClaimTimeRemaining(expiresAt: string): string {
  const now = new Date();
  const expires = new Date(expiresAt);
  const diff = expires.getTime() - now.getTime();
  
  if (diff <= 0) {
    return 'Expired';
  }
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m left`;
  } else {
    return `${minutes}m left`;
  }
}
