import React, { useState, useEffect } from 'react';
import { Clock, MapPin, Tag, Heart, Star, TrendingUp } from 'lucide-react';
import { Deal } from '../types';
import { formatPrice, calculateSavings, getTimeRemaining, calculateDistance } from '../utils/helpers';
import { useStore } from '../store/useStore';
import { useAuth } from '../contexts/AuthContext';
import { addFavorite, removeFavorite, getUserFavorites } from '../lib/supabase';
import { claimDeal, ClaimedDeal } from '../lib/dealClaimHelpers';
import { QRCodeModal } from './QRCodeModal';

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
  const [showQRModal, setShowQRModal] = useState(false);
  
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
      // Could show auth modal here
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
      // Could show auth modal here
      return;
    }

    setIsClaimingDeal(true);
    try {
      const result = await claimDeal(deal.id);
      
      if (result.success && result.qr_data) {
        // Create a ClaimedDeal object for the modal
        const newClaimedDeal: ClaimedDeal = {
          id: result.claimed_deal_id || '',
          user_id: user.id,
          deal_id: deal.id,
          restaurant_id: deal.restaurant.id,
          claim_code: result.claim_code || '',
          claimed_at: new Date().toISOString(),
          expires_at: result.expires_at || '',
          status: 'active',
          qr_data: result.qr_data
        };
        
        setClaimedDeal(newClaimedDeal);
        setShowQRModal(true);
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

  // Generate random values for demo purposes
  const rating = (4 + Math.random()).toFixed(1);
  const peopleViewing = Math.floor(Math.random() * 20) + 5;

  return (
    <div 
      className="group relative bg-white dark:bg-gray-900 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden hover-lift"
      onClick={onClick}
    >
      {/* Image Container */}
      <div className="relative h-56 overflow-hidden">
        <img 
          src={deal.image_url} 
          alt={deal.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        {/* Top Actions */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
          {/* Favorite Button */}
          <button
            onClick={handleFavoriteClick}
            disabled={isLoadingFavorite}
            className="p-2.5 glass rounded-xl shadow-lg hover:bg-white/90 dark:hover:bg-gray-800/90 transition-all duration-200 group/fav disabled:opacity-50"
          >
            <Heart 
              className={`w-5 h-5 transition-all duration-300 ${
                isFavorite 
                  ? 'fill-rose-500 text-rose-500 scale-110' 
                  : 'text-gray-700 dark:text-gray-300 group-hover/fav:text-rose-500 group-hover/fav:scale-110'
              } ${isLoadingFavorite ? 'animate-pulse' : ''}`} 
            />
          </button>

          {/* Discount Badge */}
          <div className="gradient-accent text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg flex items-center space-x-1">
            <TrendingUp className="w-4 h-4" />
            <span>{savings}% OFF</span>
          </div>
        </div>

        {/* Live Indicator */}
        {peopleViewing > 10 && (
          <div className="absolute bottom-4 left-4 flex items-center space-x-2 glass px-3 py-1.5 rounded-full text-xs font-medium">
            <span className="flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-white">{peopleViewing} viewing now</span>
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="p-5">
        {/* Title and Restaurant */}
        <div className="mb-3">
          <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 line-clamp-1 group-hover:text-rose-500 transition-colors">
            {deal.title}
          </h3>
          <div className="flex items-center justify-between mt-1">
            <p className="text-gray-600 dark:text-gray-400 text-sm">{deal.restaurant.name}</p>
            <div className="flex items-center space-x-1">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{rating}</span>
            </div>
          </div>
        </div>
        
        {/* Price Section */}
        <div className="flex items-end justify-between mb-4">
          <div>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-bold text-gradient">{formatPrice(deal.deal_price)}</span>
              <span className="text-sm text-gray-500 dark:text-gray-500 line-through">{formatPrice(deal.original_price)}</span>
            </div>
            <p className="text-xs text-green-600 dark:text-green-400 font-medium mt-1">
              Save {formatPrice(deal.original_price - deal.deal_price)}
            </p>
          </div>
        </div>
        
        {/* Info Pills */}
        <div className="flex flex-wrap gap-2">
          {/* Time Remaining */}
          <div className="flex items-center space-x-1.5 text-sm glass-subtle px-3 py-1.5 rounded-full">
            <Clock className="w-3.5 h-3.5 text-rose-500" />
            <span className="font-medium text-gray-700 dark:text-gray-300">{timeRemaining}</span>
          </div>
          
          {/* Distance */}
          {distance && (
            <div className="flex items-center space-x-1.5 text-sm glass-subtle px-3 py-1.5 rounded-full">
              <MapPin className="w-3.5 h-3.5 text-blue-500" />
              <span className="font-medium text-gray-700 dark:text-gray-300">{distance.toFixed(1)} mi</span>
            </div>
          )}
          
          {/* Quantity Available */}
          {deal.quantity_available && (
            <div className="flex items-center space-x-1.5 text-sm glass-subtle px-3 py-1.5 rounded-full">
              <TrendingUp className="w-3.5 h-3.5 text-orange-500" />
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {Math.max(0, deal.quantity_available - (deal.quantity_claimed || 0))} left
              </span>
            </div>
          )}
          
          {/* Category Tag */}
          <div className="flex items-center space-x-1.5 text-sm glass-subtle px-3 py-1.5 rounded-full">
            <Tag className="w-3.5 h-3.5 text-purple-500" />
            <span className="font-medium text-gray-700 dark:text-gray-300">{deal.tags[0]}</span>
          </div>
        </div>

        {/* Claim Deal Button */}
        <div className="mt-4">
          <button
            onClick={handleClaimDeal}
            disabled={isClaimingDeal || !user}
            className="w-full btn-primary py-3 text-sm font-semibold shadow-glow disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* QR Code Modal */}
      <QRCodeModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        claimedDeal={claimedDeal}
      />
    </div>
  );
};
