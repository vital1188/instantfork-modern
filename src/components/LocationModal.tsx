import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, X, Loader2, Search } from 'lucide-react';
import { useStore } from '../store/useStore';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LocationModal: React.FC<LocationModalProps> = ({ isOpen, onClose }) => {
  const { userLocation, setUserLocation } = useStore();
  const [isLoading, setIsLoading] = useState(false);
  const [address, setAddress] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Reverse geocode to get address from coordinates
  useEffect(() => {
    if (userLocation) {
      fetchAddress(userLocation.lat, userLocation.lng);
    }
  }, [userLocation]);

  const fetchAddress = async (lat: number, lng: number) => {
    try {
      // Using OpenStreetMap's Nominatim API for reverse geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await response.json();
      if (data.display_name) {
        // Extract relevant parts of the address
        const parts = data.display_name.split(',');
        const shortAddress = parts.slice(0, 3).join(',').trim();
        setAddress(shortAddress);
      }
    } catch (err) {
      console.error('Error fetching address:', err);
      setAddress('Location detected');
    }
  };

  const handleGetCurrentLocation = () => {
    setIsLoading(true);
    setError(null);

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setIsLoading(false);
        },
        (error) => {
          setError('Unable to get your location. Please check your permissions.');
          setIsLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      setError('Geolocation is not supported by your browser.');
      setIsLoading(false);
    }
  };

  const handleSearchLocation = async () => {
    if (!searchInput.trim()) return;
    
    setIsLoading(true);
    setError(null);

    try {
      // Using OpenStreetMap's Nominatim API for geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchInput)}&limit=1`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const location = data[0];
        setUserLocation({
          lat: parseFloat(location.lat),
          lng: parseFloat(location.lon)
        });
        setSearchInput('');
      } else {
        setError('Location not found. Please try a different search.');
      }
    } catch (err) {
      setError('Error searching for location. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-md w-full shadow-2xl animate-in slide-in-from-bottom-4 duration-500 mx-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
                <MapPin className="w-6 h-6 mr-2 text-rose-500" />
                Your Location
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Set your location to find the best deals nearby
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Current Location Display */}
          {userLocation && (
            <div className="glass rounded-2xl p-4 space-y-2">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-rose-100 dark:bg-rose-900/30 rounded-xl">
                  <MapPin className="w-5 h-5 text-rose-500" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-gray-100">Current Location</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {address || 'Loading address...'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {userLocation.lat.toFixed(6)}, {userLocation.lng.toFixed(6)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Search Location */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Search for a location
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearchLocation()}
                placeholder="Enter city, address, or zip code"
                className="flex-1 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
              />
              <button
                onClick={handleSearchLocation}
                disabled={isLoading || !searchInput.trim()}
                className="p-3 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-gray-600 dark:text-gray-400" />
                ) : (
                  <Search className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                )}
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3 pt-2">
            <button
              onClick={handleGetCurrentLocation}
              disabled={isLoading}
              className="w-full btn-primary flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Getting location...</span>
                </>
              ) : (
                <>
                  <Navigation className="w-5 h-5" />
                  <span>Use Current Location</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="w-full btn-secondary"
            >
              Done
            </button>
          </div>

          {/* Privacy Note */}
          <p className="text-xs text-center text-gray-500 dark:text-gray-500 pt-2">
            Your location is only used to show nearby deals and is never shared.
          </p>
        </div>
      </div>
    </div>
  );
};
