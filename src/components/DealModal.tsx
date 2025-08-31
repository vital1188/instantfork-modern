import React, { useState } from 'react';
import { X, Clock, MapPin, Tag, Star, Heart, TrendingUp } from 'lucide-react';
import { Deal } from '../types';
import { formatPrice, calculateSavings, getTimeRemaining, calculateDistance } from '../utils/helpers';
import { useStore } from '../store/useStore';
import { useAuth } from '../contexts/AuthContext';
import { addFavorite, removeFavorite } from '../lib/supabase';
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

  if (!isOpen || !deal) return null;

  const savings = calculateSavings(deal.original_price, deal.deal_price);
  const timeRemaining = getTimeRemaining(deal.end_time);
  const distance = userLocation 
    ? calculateDistance(userLocation.lat, userLocation.lng, deal.location.lat, deal.location.lng)
    : null;

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
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
          claim_code: result.claim_code
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

  // Generate random values for demo
  const rating = (4 + Math.random()).toFixed(1);
  const peopleViewing = Math.floor(Math.random() * 20) + 5;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9998] p-2 sm:p-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-2xl max-h-[95vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-gray-700 animate-in fade-in-0 zoom-in-95 duration-300">
          {/* Header */}
          <div className="relative">
            <img 
              src={deal.image_url} 
              alt={deal.title}
              className="w-full h-64 sm:h-80 object-cover"
            />
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
            
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-black/20 backdrop-blur-sm text-white rounded-full hover:bg-black/40 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Favorite Button */}
            <button
              onClick={handleFavoriteClick}
              disabled={isLoadingFavorite || !user}
              className="absolute top-4 left-4 p-2 bg-black/20 backdrop-blur-sm rounded-full hover:bg-black/40 transition-colors disabled:opacity-50"
            >
              <Heart 
                className={`w-5 h-5 transition-all duration-300 ${
                  isFavorite 
                    ? 'fill-rose-500 text-rose-500' 
                    : 'text-white hover:text-rose-500'
                } ${isLoadingFavorite ? 'animate-pulse' : ''}`} 
              />
            </button>

            {/* Discount Badge */}
            <div className="absolute top-4 right-16 bg-rose-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg flex items-center space-x-1">
              <TrendingUp className="w-4 h-4" />
              <span>{savings}% OFF</span>
            </div>

            {/* Live Indicator */}
            {peopleViewing > 10 && (
              <div className="absolute bottom-4 left-4 flex items-center space-x-2 bg-black/20 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-medium text-white">
                <span className="flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span>{peopleViewing} viewing now</span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Title and Restaurant */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                {deal.title}
              </h2>
              <div className="flex items-center justify-between">
                <p className="text-gray-600 dark:text-gray-400 text-lg">{deal.restaurant.name}</p>
                <div className="flex items-center space-x-1">
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  <span className="text-lg font-medium text-gray-700 dark:text-gray-300">{rating}</span>
                </div>
              </div>
            </div>

            {/* Price Section */}
            <div className="bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-baseline space-x-3">
                    <span className="text-4xl font-bold text-rose-500">{formatPrice(deal.deal_price)}</span>
                    <span className="text-xl text-gray-500 dark:text-gray-400 line-through">{formatPrice(deal.original_price)}</span>
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

            {/* Deal Info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {/* Time Remaining */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-center">
                <Clock className="w-6 h-6 text-rose-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{timeRemaining}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">remaining</p>
              </div>
              
              {/* Distance */}
              {distance && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-center">
                  <MapPin className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{distance.toFixed(1)} mi</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">away</p>
                </div>
              )}
              
              {/* Quantity Available */}
              {deal.quantity_available && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-center">
                  <TrendingUp className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {Math.max(0, deal.quantity_available - (deal.quantity_claimed || 0))}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">left</p>
                </div>
              )}
              
              {/* Category */}
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
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">
                    {deal.location.lat.toFixed(4)}, {deal.location.lng.toFixed(4)}
                  </span>
                </div>
                {deal.restaurant.phone && (
                  <div className="flex items-center space-x-3">
                    <span className="text-gray-600 dark:text-gray-400">{deal.restaurant.phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Claim Deal Button */}
            <div className="sticky bottom-0 bg-white dark:bg-gray-900 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleClaimDeal}
                disabled={isClaimingDeal || !user}
                className="w-full btn-primary py-4 text-lg font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isClaimingDeal ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Claiming Deal...</span>
                  </div>
                ) : !user ? (
                  'Sign in to Claim Deal'
                ) : (
                  'Claim Deal & Get Code'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      <ClaimCodeModal
        isOpen={showClaimModal}
        onClose={() => setShowClaimModal(false)}
        claimedDeal={claimedDeal}
      />
    </>
  );
};