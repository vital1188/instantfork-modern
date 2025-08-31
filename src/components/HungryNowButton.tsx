import React, { useState } from 'react';
import { Zap, Navigation, X, Sparkles, ArrowRight } from 'lucide-react';
import { useStore } from '../store/useStore';
import { suggestBestDeal } from '../utils/helpers';
import { DealCard } from './DealCard';

export const HungryNowButton: React.FC = () => {
  const { deals, userLocation, setSelectedDeal } = useStore();
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [suggestedDeal, setSuggestedDeal] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleHungryNow = async () => {
    if (!userLocation) {
      alert('Please enable location services to use this feature');
      return;
    }

    setIsLoading(true);
    setShowSuggestion(true);

    // Simulate AI processing time
    setTimeout(() => {
      const bestDeal = suggestBestDeal(deals, userLocation);
      setSuggestedDeal(bestDeal);
      setIsLoading(false);
    }, 1500);
  };

  const handleAcceptDeal = () => {
    if (suggestedDeal) {
      setSelectedDeal(suggestedDeal);
      setShowSuggestion(false);
    }
  };

  const handleGetDirections = () => {
    if (suggestedDeal && userLocation) {
      const directionsUrl = `https://www.google.com/maps/dir/${userLocation.lat},${userLocation.lng}/${suggestedDeal.location.lat},${suggestedDeal.location.lng}`;
      window.open(directionsUrl, '_blank');
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={handleHungryNow}
        className="fixed bottom-6 right-6 group gradient-accent text-white px-6 py-4 rounded-2xl shadow-2xl hover:shadow-glow-lg transform hover:scale-105 transition-all duration-300 flex items-center space-x-3 z-40 overflow-hidden"
      >
        {/* Animated Background */}
        {/* Content */}
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Zap className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
          </div>
          <span className="font-bold text-lg">Hungry Now?</span>
          <ArrowRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300" />
        </div>
      </button>

      {/* Suggestion Modal */}
      {showSuggestion && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-md w-full max-h-[90vh] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 duration-500 mx-auto">
            {/* Header */}
            <div className="relative p-6 pb-0">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
                    {isLoading ? 'Finding Your Perfect Deal' : 'Perfect Match Found!'}
                    <Sparkles className="w-6 h-6 ml-2 text-yellow-500 animate-pulse" />
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    {isLoading ? 'Analyzing your preferences...' : 'Based on your location and time'}
                  </p>
                </div>
                <button
                  onClick={() => setShowSuggestion(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 pt-4">
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="relative inline-flex">
                    <div className="w-20 h-20 border-4 border-rose-200 dark:border-rose-900 rounded-full"></div>
                    <div className="w-20 h-20 border-4 border-transparent border-t-rose-500 rounded-full animate-spin absolute inset-0"></div>
                    <Zap className="w-8 h-8 text-rose-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                  </div>
                  <div className="mt-6 space-y-2">
                    <p className="text-gray-600 dark:text-gray-400 font-medium">Analyzing nearby deals...</p>
                    <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 dark:text-gray-500">
                      <span className="flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                      </span>
                      <span>Checking real-time availability</span>
                    </div>
                  </div>
                </div>
              ) : suggestedDeal ? (
                <div className="space-y-4">
                  {/* Deal Card */}
                  <div className="transform scale-95 origin-top">
                    <DealCard deal={suggestedDeal} onClick={handleAcceptDeal} />
                  </div>

                  {/* AI Reasoning */}
                  <div className="glass rounded-2xl p-4 space-y-2">
                    <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 flex items-center">
                      <Sparkles className="w-4 h-4 mr-2 text-purple-500" />
                      Why this deal?
                    </h3>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <li className="flex items-start">
                        <span className="text-green-500 mr-2">•</span>
                        <span>Closest to your current location</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-500 mr-2">•</span>
                        <span>Best value for money (highest discount)</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-500 mr-2">•</span>
                        <span>Ending soon - don't miss out!</span>
                      </li>
                    </ul>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handleAcceptDeal}
                      className="flex-1 btn-primary flex items-center justify-center space-x-2"
                    >
                      <span>View Full Details</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleGetDirections}
                      className="flex-1 btn-secondary flex items-center justify-center space-x-2"
                    >
                      <Navigation className="w-4 h-4" />
                      <span>Get Directions</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                    <Zap className="w-10 h-10 text-gray-400" />
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 font-medium">No deals available at the moment</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Check back soon for new offers!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
