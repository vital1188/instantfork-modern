import React, { useState, useEffect } from 'react';
import { Clock, MapPin, Tag, Heart, Star, TrendingUp, Users } from 'lucide-react';
import { Deal } from '../types';
import { formatPrice, calculateSavings, getTimeRemaining, calculateDistance } from '../utils/helpers';
import { useStore } from '../store/useStore';
import { useAuth } from '../contexts/AuthContext';
import { addFavorite, removeFavorite, getUserFavorites } from '../lib/supabase';
import { claimDeal, ClaimedDeal } from '../lib/dealClaimHelpers';
import { ClaimCodeModal } from './ClaimCodeModal';

interface DealCardProps {
  deal: Deal;
  onClick: () => void;
}

export const DealCard: React.FC<DealCardProps> = ({ deal, onClick }) => {
  const { userLocation } = useStore();
  const { user } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoadingFavorite, setIsLoadingFavorite] = useState(false);
  const [isClaimingDeal, setIsClaimingDeal] = useState(false);
  const [claimedDeal, setClaimedDeal] = useState<ClaimedDeal | null>(null);
  const [showClaimModal, setShowClaimModal] = useState(false);
  
  const savings = calculateSavings(deal.original_price, deal.deal_price);
  const timeRemaining = getTimeRemaining(deal.end_time);
  const distance = userLocation 
    ? calculateDistance(userLocation.lat, userLocation.lng, deal.location.lat, deal.location.lng)
    : null;

  useEffect(() => {
    if (user) {
      checkIfFavorite();
    } else {
      setIsFavorite(false);
    }
  }, [user, deal.id]);

  const checkIfFavorite = async () => {
    if (!user) return;
    
    const { data } = await getUserFavorites(user.id);
    if (data) {
      setIsFavorite(data.some((fav: { deal_id: string }) => fav.deal_id === deal.id));
    }
  };

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user) {
      return;
    }

    setIsLoadingFavorite(true);
    try {
      if (isFavorite) {
        await removeFavorite(user.id, deal.id);
        setIsFavorite(false);
      } else {
        await addFavorite(user.id, deal.id);
        setIsFavorite(true);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setIsLoadingFavorite(false);
    }
  };

  const handleClaimDeal = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user) {
      return;
    }

    setIsClaimingDeal(true);
    try {
      const result = await claimDeal(deal.id);
      
      if (result.success && result.claim_code) {
        const newClaimedDeal: ClaimedDeal = {
          id: result.claimed_deal_id || '',
          user_id: user.id,
          deal_id: deal.id,
          restaurant_id: deal.restaurant.id,
          claim_code: result.claim_code || '',
          claimed_at: new Date().toISOString(),
          expires_at: result.expires_at || '',
          status: 'active',
          deal_title: deal.title,
          restaurant_name: deal.restaurant.name,
          deal_price: deal.deal_price,
          original_price: deal.original_price
        };
        
        setClaimedDeal(newClaimedDeal);
        setShowClaimModal(true);
      } else {
        alert(result.error || 'Failed to claim deal');
      }
    } catch (error) {
      console.error('Error claiming deal:', error);
      alert('Failed to claim deal. Please try again.');
    } finally {
      setIsClaimingDeal(false);
    }
  };

  // Generate consistent demo values
  const rating = (4.2 + (parseInt(deal.id.slice(-1)) || 0) * 0.1).toFixed(1);
  const peopleViewing = Math.floor((parseInt(deal.id.slice(-2)) || 0) % 15) + 8;

  return (
    <>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm hover:shadow-lg border border-gray-200 dark:border-gray-800 overflow-hidden transition-all duration-300 group">
        {/* Image Section */}
        <div className="relative h-48 overflow-hidden">
          <img 
            src={deal.image_url} 
            alt={deal.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          
          {/* Overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
          
          {/* Top Row - Favorite and Discount */}
          <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
            <button
              onClick={handleFavoriteClick}
              disabled={isLoadingFavorite || !user}
              className="p-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-full shadow-sm hover:bg-white dark:hover:bg-gray-900 transition-all duration-200 disabled:opacity-50"
            >
              <Heart 
                className={`w-4 h-4 transition-colors ${
                  isFavorite 
                    ? 'fill-rose-500 text-rose-500' 
                    : 'text-gray-600 dark:text-gray-400'
                } ${isLoadingFavorite ? 'animate-pulse' : ''}`} 
              />
            </button>

            <div className="bg-rose-500 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-sm">
              {savings}% OFF
            </div>
          </div>

          {/* Bottom Row - Live indicator */}
          {peopleViewing > 10 && (
            <div className="absolute bottom-3 left-3 flex items-center space-x-2 bg-black/60 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>{peopleViewing} viewing</span>
            </div>
          )}
        </div>
        
        {/* Content Section */}
        <div className="p-4 space-y-4">
          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-start justify-between">
              <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 line-clamp-2 flex-1 pr-2">
                {deal.title}
              </h3>
              <div className="flex items-center space-x-1 flex-shrink-0">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{rating}</span>
              </div>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm">{deal.restaurant.name}</p>
          </div>
          
          {/* Price Section */}
          <div className="flex items-center justify-between">
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-rose-500">{formatPrice(deal.deal_price)}</span>
              <span className="text-sm text-gray-500 dark:text-gray-400 line-through">{formatPrice(deal.original_price)}</span>
            </div>
            <div className="text-right">
              <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                Save {formatPrice(deal.original_price - deal.deal_price)}
              </p>
            </div>
          </div>
          
          {/* Info Pills */}
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-lg text-xs">
              <Clock className="w-3 h-3 text-rose-500" />
              <span className="font-medium text-gray-700 dark:text-gray-300">{timeRemaining}</span>
            </div>
            
            {distance && (
              <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-lg text-xs">
                <MapPin className="w-3 h-3 text-blue-500" />
                <span className="font-medium text-gray-700 dark:text-gray-300">{distance.toFixed(1)} mi</span>
              </div>
            )}
            
            {deal.quantity_available && (
              <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-lg text-xs">
                <Users className="w-3 h-3 text-orange-500" />
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {Math.max(0, deal.quantity_available - (deal.quantity_claimed || 0))} left
                </span>
              </div>
            )}
            
            <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-lg text-xs">
              <Tag className="w-3 h-3 text-purple-500" />
              <span className="font-medium text-gray-700 dark:text-gray-300">{deal.tags[0]}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2 pt-2">
            <button
              onClick={onClick}
              className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 py-2.5 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              View Details
            </button>
            <button
              onClick={handleClaimDeal}
              disabled={isClaimingDeal || !user}
              className="flex-1 bg-rose-500 text-white py-2.5 rounded-lg font-medium hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isClaimingDeal ? (
                <div className="flex items-center justify-center space-x-1">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                  <span className="text-sm">Claiming...</span>
                </div>
              ) : !user ? (
                'Sign in'
              ) : (
                'Claim Deal'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Claim Code Modal */}
      <ClaimCodeModal
        isOpen={showClaimModal}
        onClose={() => setShowClaimModal(false)}
        claimedDeal={claimedDeal}
      />
    </>
  );
};