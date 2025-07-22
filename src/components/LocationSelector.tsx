import React, { useState, useEffect } from 'react';
import { MapPin, Search, Navigation, Check, AlertCircle } from 'lucide-react';
import { DMV_LOCATIONS, findDMVLocation, isWithinDMV, Location } from '../config/locations';

interface LocationSelectorProps {
  onLocationSelect: (location: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    coordinates: { lat: number; lng: number };
  }) => void;
  initialAddress?: string;
  initialCity?: string;
  initialState?: string;
  initialZipCode?: string;
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({
  onLocationSelect,
  initialAddress = '',
  initialCity = '',
  initialState = '',
  initialZipCode = ''
}) => {
  const [mode, setMode] = useState<'manual' | 'search' | 'detect'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionError, setDetectionError] = useState<string | null>(null);
  
  // Manual form fields
  const [manualForm, setManualForm] = useState({
    address: initialAddress,
    city: initialCity,
    state: initialState,
    zipCode: initialZipCode
  });

  // Filter locations based on search query
  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = DMV_LOCATIONS.filter(location => {
        const fullName = `${location.name}, ${location.state}`.toLowerCase();
        const query = searchQuery.toLowerCase();
        return fullName.includes(query) || location.name.toLowerCase().includes(query);
      });
      setFilteredLocations(filtered);
    } else {
      setFilteredLocations(DMV_LOCATIONS);
    }
  }, [searchQuery]);

  const handleLocationDetection = async () => {
    setIsDetecting(true);
    setDetectionError(null);

    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by your browser');
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });

      const { latitude, longitude } = position.coords;

      // Check if within DMV area
      if (!isWithinDMV(latitude, longitude)) {
        throw new Error('Your location is outside the DMV service area. Please select a location manually.');
      }

      // Use reverse geocoding (in a real app, you'd use Google Maps API or similar)
      // For now, we'll find the nearest DMV location
      const nearestLocation = DMV_LOCATIONS.reduce((nearest, location) => {
        const distance = Math.sqrt(
          Math.pow(latitude - location.coordinates.lat, 2) + 
          Math.pow(longitude - location.coordinates.lng, 2)
        );
        const nearestDistance = Math.sqrt(
          Math.pow(latitude - nearest.coordinates.lat, 2) + 
          Math.pow(longitude - nearest.coordinates.lng, 2)
        );
        return distance < nearestDistance ? location : nearest;
      });

      setSelectedLocation(nearestLocation);
      
      // Auto-fill the form with detected location
      onLocationSelect({
        address: 'Current Location', // In a real app, you'd get the actual address
        city: nearestLocation.name,
        state: nearestLocation.state,
        zipCode: '00000', // Would be detected via reverse geocoding
        coordinates: { lat: latitude, lng: longitude }
      });

    } catch (error) {
      console.error('Location detection error:', error);
      setDetectionError(error instanceof Error ? error.message : 'Failed to detect location');
    } finally {
      setIsDetecting(false);
    }
  };

  const handleLocationSelect = (location: Location) => {
    setSelectedLocation(location);
    onLocationSelect({
      address: '', // Will be filled manually or detected
      city: location.name,
      state: location.state,
      zipCode: '', // Will be filled manually
      coordinates: location.coordinates
    });
  };

  const handleManualSubmit = () => {
    if (!manualForm.address || !manualForm.city || !manualForm.state || !manualForm.zipCode) {
      return;
    }

    // Try to find matching DMV location
    const dmvLocation = findDMVLocation(`${manualForm.city}, ${manualForm.state}`);
    
    onLocationSelect({
      address: manualForm.address,
      city: manualForm.city,
      state: manualForm.state,
      zipCode: manualForm.zipCode,
      coordinates: dmvLocation?.coordinates || { lat: 0, lng: 0 }
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Choose Your Location Method
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          We serve the DMV area (DC, Maryland, Northern Virginia)
        </p>
      </div>

      {/* Mode Selection */}
      <div className="flex space-x-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        <button
          onClick={() => setMode('search')}
          className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
            mode === 'search'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>Search Cities</span>
        </button>
        <button
          onClick={() => setMode('detect')}
          className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
            mode === 'detect'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
          }`}
        >
          <Navigation className="w-4 h-4" />
          <span>Auto-Detect</span>
        </button>
        <button
          onClick={() => setMode('manual')}
          className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
            mode === 'manual'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Manual Entry</span>
        </button>
      </div>

      {/* Search Mode */}
      {mode === 'search' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search DMV Cities
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-rose-500 dark:bg-gray-800"
                placeholder="Search for Washington, Arlington, Bethesda..."
              />
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
            {filteredLocations.map((location) => (
              <button
                key={`${location.name}-${location.state}`}
                onClick={() => handleLocationSelect(location)}
                className={`w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors ${
                  selectedLocation?.name === location.name && selectedLocation?.state === location.state
                    ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800'
                    : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {location.name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {location.state} • {location.radius} mile radius
                    </p>
                  </div>
                  {selectedLocation?.name === location.name && selectedLocation?.state === location.state && (
                    <Check className="w-5 h-5 text-rose-500" />
                  )}
                </div>
              </button>
            ))}
          </div>

          {selectedLocation && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                <p className="text-green-800 dark:text-green-200 font-medium">
                  Selected: {selectedLocation.name}, {selectedLocation.state}
                </p>
              </div>
              <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                You can now proceed to the next step or add your specific address manually.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Auto-Detect Mode */}
      {mode === 'detect' && (
        <div className="space-y-4">
          <div className="text-center">
            <button
              onClick={handleLocationDetection}
              disabled={isDetecting}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-rose-500 text-white rounded-lg hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDetecting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Detecting Location...</span>
                </>
              ) : (
                <>
                  <Navigation className="w-4 h-4" />
                  <span>Detect My Location</span>
                </>
              )}
            </button>
          </div>

          {detectionError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                <p className="text-red-800 dark:text-red-200 font-medium">Location Detection Failed</p>
              </div>
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">{detectionError}</p>
            </div>
          )}

          {selectedLocation && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                <p className="text-green-800 dark:text-green-200 font-medium">
                  Location Detected: {selectedLocation.name}, {selectedLocation.state}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Manual Mode */}
      {mode === 'manual' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              Street Address
            </label>
            <input
              type="text"
              value={manualForm.address}
              onChange={(e) => setManualForm({ ...manualForm, address: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-rose-500 dark:bg-gray-800"
              placeholder="123 Main Street"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                City
              </label>
              <input
                type="text"
                value={manualForm.city}
                onChange={(e) => setManualForm({ ...manualForm, city: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-rose-500 dark:bg-gray-800"
                placeholder="Washington"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                State
              </label>
              <select
                value={manualForm.state}
                onChange={(e) => setManualForm({ ...manualForm, state: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-rose-500 dark:bg-gray-800"
              >
                <option value="">Select State</option>
                <option value="DC">Washington DC</option>
                <option value="MD">Maryland</option>
                <option value="VA">Virginia</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              ZIP Code
            </label>
            <input
              type="text"
              value={manualForm.zipCode}
              onChange={(e) => setManualForm({ ...manualForm, zipCode: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-rose-500 dark:bg-gray-800"
              placeholder="20001"
            />
          </div>

          <button
            onClick={handleManualSubmit}
            disabled={!manualForm.address || !manualForm.city || !manualForm.state || !manualForm.zipCode}
            className="w-full py-2 px-4 bg-rose-500 text-white rounded-lg hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirm Location
          </button>
        </div>
      )}
    </div>
  );
};
