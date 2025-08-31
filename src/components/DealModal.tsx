import React, { useState, useEffect } from 'react';
import { X, Clock, MapPin, Tag, Star, Heart, TrendingUp, Navigation } from 'lucide-react';
import { Deal } from '../types';
import { formatPrice, calculateSavings, getTimeRemaining, calculateDistance } from '../utils/helpers';
import { useStore } from '../store/useStore';
import { useAuth } from '../contexts/AuthContext';
import { addFavorite, removeFavorite, getUserFavorites } from '../lib/supabase';
import { claimDeal, ClaimedDeal } from '../lib/dealClaimHelpers';
import { ClaimCodeModal } from './ClaimCodeModal';

interface DealModalProps {
  deal: Deal | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DealModal: React.FC<DealModalProps> = ({ deal, isOpen, onClose }) => {
  const { userLocation } = useStore();
  const { user } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoadingFavorite, setIsLoadingFavorite] = useState(false);
  const [isClaimingDeal, setIsClaimingDeal] = useState(false);
  const [claimedDeal, setClaimedDeal] = useState<ClaimedDeal | null>(null);
  const [showClaimModal, setShowClaimModal] = useState(false);

  useEffect(() => {
    if (user && deal) {
      checkIfFavorite();
    } else {
      setIsFavorite(false);
    }
  }, [user, deal?.id]);

  const checkIfFavorite = async () => {
    if (!user || !deal) return;
    
    const { data } = await getUserFavorites(user.id);
    if (data) {
      setIsFavorite(data.some((fav: { deal_id: string }) => fav.deal_id === deal.id));
    }
  };

  if (!isOpen || !deal) return null;

  const savings = calculateSavings(deal.original_price, deal.deal_price);
  const timeRemaining = getTimeRemaining(deal.end_time);
  const distance = userLocation 
    ? calculateDistance(userLocation.lat, userLocation.lng, deal.location.lat, deal.location.lng)
    : null;
  const rating = (4.2 + (parseInt(deal.id.slice(-1)) || 0) * 0.1).toFixed(1);

  const handleFavoriteClick = async () => {
    if (!user) return;

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

  const handleClaimDeal = async () => {
    if (!user) return;

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

  const handleGetDirections = () => {
    if (userLocation) {
      const directionsUrl = `https://www.google.com/maps/dir/${userLocation.lat},${userLocation.lng}/${deal.location.lat},${deal.location.lng}`;
      window.open(directionsUrl, '_blank');
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-2xl max-h-[95vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-gray-700">
          {/* Header Image */}
          <div className="relative h-64 overflow-hidden">
            <img 
              src={deal.image_url} 
              alt={deal.title}
              className="w-full h-full object-cover"
            />
            
            {/* Header Actions */}
            <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
              <button
                onClick={handleFavoriteClick}
                disabled={isLoadingFavorite || !user}
                className="p-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-full shadow-sm hover:bg-white dark:hover:bg-gray-900 transition-colors disabled:opacity-50"
              >
                <Heart 
                  className={`w-5 h-5 transition-colors ${
                    isFavorite 
                      ? 'fill-rose-500 text-rose-500' 
                      : 'text-gray-600 dark:text-gray-400'
                  } ${isLoadingFavorite ? 'animate-pulse' : ''}`} 
                />
              </button>

              <div className="flex items-center space-x-2">
                <div className="bg-rose-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-sm">
                  {savings}% OFF
                </div>
                <button
                  onClick={onClose}
                  className="p-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-full shadow-sm hover:bg-white dark:hover:bg-gray-900 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Title and Restaurant */}
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex-1 pr-4">
                  {deal.title}
                </h2>
                <div className="flex items-center space-x-1 flex-shrink-0">
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  <span className="text-lg font-medium text-gray-700 dark:text-gray-300">{rating}</span>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-lg">{deal.restaurant.name}</p>
            </div>

            {/* Price Section */}
            <div className="bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-baseline space-x-3">
                    <span className="text-4xl font-bold text-rose-500">{formatPrice(deal.deal_price)}</span>
                    <span className="text-xl line-through text-gray-500 dark:text-gray-400">{formatPrice(deal.original_price)}</span>
                  </div>
                  <p className="text-green-600 dark:text-green-400 font-semibold mt-2">
                    Save {formatPrice(deal.original_price - deal.deal_price)} ({savings}% off)
                  </p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                About this deal
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {deal.description || `Enjoy ${deal.title} at ${deal.restaurant.name} with this exclusive discount. Limited time offer!`}
              </p>
            </div>

            {/* Deal Info Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-center">
                <Clock className="w-6 h-6 text-rose-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{timeRemaining}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">remaining</p>
              </div>
              
              {distance && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-center">
                  <MapPin className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{distance.toFixed(1)} mi</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">away</p>
                </div>
              )}
              
              {deal.quantity_available && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-center">
                  <TrendingUp className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {Math.max(0, deal.quantity_available - (deal.quantity_claimed || 0))}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">left</p>
                </div>
              )}
              
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-center">
                <Tag className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{deal.tags[0]}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">category</p>
              </div>
            </div>

            {/* Restaurant Info */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Restaurant Details
              </h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-600 dark:text-gray-400 text-sm">
                    {deal.restaurant.location?.address || `${deal.location.lat.toFixed(4)}, ${deal.location.lng.toFixed(4)}`}
                  </span>
                </div>
                {deal.restaurant.phone && (
                  <div className="flex items-center space-x-3">
                    <span className="text-gray-600 dark:text-gray-400 text-sm">{deal.restaurant.phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                onClick={handleGetDirections}
                className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 py-3 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2"
              >
                <Navigation className="w-4 h-4" />
                <span>Directions</span>
              </button>
              <button
                onClick={handleClaimDeal}
                disabled={isClaimingDeal || !user}
                className="flex-1 bg-rose-500 text-white py-3 rounded-lg font-medium hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isClaimingDeal ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Claiming...</span>
                  </div>
                ) : !user ? (
                  'Sign in to Claim'
                ) : (
                  'Claim Deal'
                )}
              </button>
            </div>
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