import React from 'react';
import { MapPin, AlertCircle, ArrowRight } from 'lucide-react';
import { DMV_LOCATIONS } from '../config/locations';

interface ServiceUnavailableProps {
  userLocation?: { lat: number; lng: number };
  onSelectLocation: (location: { lat: number; lng: number }) => void;
}

export const ServiceUnavailable: React.FC<ServiceUnavailableProps> = ({ 
  userLocation, 
  onSelectLocation 
}) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 md:p-12 text-center">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full mb-6">
            <MapPin className="w-10 h-10 text-red-500" />
          </div>
          
          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            InstantFork is not available in your area
          </h1>
          
          {/* Subtitle */}
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
            We're currently serving the Washington DC, Maryland, and Northern Virginia area.
          </p>
          
          {/* Alert Box */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-6 mb-8">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="text-left">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  Your current location is outside our service area. You can still browse deals by selecting one of our available locations below.
                </p>
              </div>
            </div>
          </div>
          
          {/* Available Locations */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Browse deals in these areas:
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
              {DMV_LOCATIONS.slice(0, 9).map((location) => (
                <button
                  key={`${location.name}-${location.state}`}
                  onClick={() => onSelectLocation(location.coordinates)}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all group"
                >
                  <div className="text-left">
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {location.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {location.state}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                </button>
              ))}
            </div>
          </div>
          
          {/* Coming Soon */}
          <div className="border-t border-gray-200 dark:border-gray-800 pt-8">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              We're working hard to expand to more areas. Stay tuned!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
