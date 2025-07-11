import React from 'react';
import { X, Clock, MapPin, Tag, Share2, Heart, Navigation, Phone, Globe } from 'lucide-react';
import { Deal } from '../types';
import { formatPrice, calculateSavings, getTimeRemaining, calculateDistance } from '../utils/helpers';
import { useStore } from '../store/useStore';

interface DealModalProps {
  deal: Deal;
  onClose: () => void;
}

export const DealModal: React.FC<DealModalProps> = ({ deal, onClose }) => {
  const { user, userLocation, toggleFavorite } = useStore();
  const savings = calculateSavings(deal.original_price, deal.deal_price);
  const timeRemaining = getTimeRemaining(deal.end_time);
  const distance = userLocation 
    ? calculateDistance(userLocation.lat, userLocation.lng, deal.location.lat, deal.location.lng)
    : null;
  
  const isFavorite = user?.favorites.includes(deal.id) || false;

  const handleShare = async () => {
    const shareData = {
      title: deal.title,
      text: `Check out this amazing deal: ${deal.title} at ${deal.restaurant.name} - ${savings}% off!`,
      url: window.location.href
    };

    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        // Fallback to copying to clipboard
        await navigator.clipboard.writeText(
          `${shareData.text}\n${shareData.url}`
        );
        alert('Deal link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleDirections = () => {
    const destination = `${deal.location.lat},${deal.location.lng}`;
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
    window.open(mapsUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom-4 duration-500 mx-auto my-auto">
        <div className="relative h-64 sm:h-80">
          <img 
            src={deal.image_url} 
            alt={deal.title}
            className="w-full h-full object-cover"
          />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="absolute top-4 left-4 bg-red-500 text-white px-4 py-2 rounded-full text-lg font-bold shadow-lg">
            {savings}% OFF
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">{deal.title}</h2>
              <p className="text-gray-600">{deal.restaurant.name}</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => toggleFavorite(deal.id)}
                className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
              >
                <Heart 
                  className={`w-5 h-5 ${
                    isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'
                  }`} 
                />
              </button>
              <button
                onClick={handleShare}
                className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
              >
                <Share2 className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Deal Price</p>
              <p className="text-2xl font-bold text-green-600">{formatPrice(deal.deal_price)}</p>
              <p className="text-sm text-gray-500 line-through">{formatPrice(deal.original_price)}</p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Time Left</p>
              <div className="flex items-center">
                <Clock className="w-5 h-5 mr-2 text-orange-500" />
                <p className="text-xl font-bold text-orange-600">{timeRemaining}</p>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-gray-600">{deal.description}</p>
          </div>

          <div className="mb-6">
            <h3 className="font-semibold mb-2">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {deal.tags.map((tag, index) => (
                <span 
                  key={index}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">Restaurant Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center text-gray-600">
                <MapPin className="w-4 h-4 mr-2" />
                <span>{deal.restaurant.location.address}</span>
              </div>
              {distance && (
                <div className="flex items-center text-gray-600">
                  <Navigation className="w-4 h-4 mr-2" />
                  <span>{distance.toFixed(1)} miles away</span>
                </div>
              )}
              {deal.restaurant.phone && (
                <div className="flex items-center text-gray-600">
                  <Phone className="w-4 h-4 mr-2" />
                  <a href={`tel:${deal.restaurant.phone}`} className="hover:text-gray-900">
                    {deal.restaurant.phone}
                  </a>
                </div>
              )}
              {deal.restaurant.website && (
                <div className="flex items-center text-gray-600">
                  <Globe className="w-4 h-4 mr-2" />
                  <a 
                    href={deal.restaurant.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-gray-900"
                  >
                    Visit Website
                  </a>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={handleDirections}
              className="flex-1 bg-blue-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-600 transition-colors flex items-center justify-center"
            >
              <Navigation className="w-5 h-5 mr-2" />
              Get Directions
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-red-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-red-600 transition-colors"
            >
              Claim Deal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
