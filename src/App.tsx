import React, { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { DealCard } from './components/DealCard';
import { MapView } from './components/MapView';
import { FilterPanel } from './components/FilterPanel';
import { DealModal } from './components/DealModal';
import { HungryNowButton } from './components/HungryNowButton';
import { Filter, Grid3X3, Map, Sparkles } from 'lucide-react';
import { useStore } from './store/useStore';
import { mockDeals } from './utils/mockData';
import { calculateDistance } from './utils/helpers';
import { differenceInHours } from 'date-fns';

function App() {
  const { 
    deals, 
    setDeals, 
    viewMode, 
    setViewMode,
    filters, 
    selectedDeal, 
    setSelectedDeal,
    userLocation,
    setUserLocation,
    setUser
  } = useStore();
  
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Initialize app
  useEffect(() => {
    // Get user location with better error handling
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setLocationError(null);
        },
        (error) => {
          console.error('Error getting location:', error);
          let errorMessage = 'Unable to get your location. ';
          
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage += 'Please enable location permissions.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage += 'Location information unavailable.';
              break;
            case error.TIMEOUT:
              errorMessage += 'Location request timed out.';
              break;
          }
          
          setLocationError(errorMessage);
          // Default to NYC
          setUserLocation({ lat: 40.7128, lng: -74.0060 });
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      setLocationError('Geolocation is not supported by your browser.');
      // Default to NYC
      setUserLocation({ lat: 40.7128, lng: -74.0060 });
    }

    // Set mock user
    setUser({
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      favorites: [],
      preferences: {
        cuisines: [],
        maxDistance: 10,
        priceRange: [0, 100],
        dietaryNeeds: []
      }
    });

    // Load deals
    setDeals(mockDeals);
    setIsLoading(false);
  }, [setDeals, setUserLocation, setUser]);

  // Filter deals based on current filters
  const filteredDeals = deals.filter(deal => {
    // Price filter
    if (deal.deal_price > filters.priceRange[1]) return false;

    // Distance filter
    if (userLocation) {
      const distance = calculateDistance(
        userLocation.lat, 
        userLocation.lng, 
        deal.location.lat, 
        deal.location.lng
      );
      if (distance > filters.distance) return false;
    }

    // Time filter
    const hoursLeft = differenceInHours(deal.end_time, new Date());
    if (hoursLeft > filters.timeLeft || hoursLeft < 0) return false;

    // Cuisine filter
    if (filters.cuisine.length > 0 && !filters.cuisine.includes(deal.restaurant.category)) {
      return false;
    }

    // Dietary filter
    if (filters.dietaryNeeds.length > 0) {
      const hasDietaryTag = filters.dietaryNeeds.some(need => 
        deal.tags.some(tag => tag.toLowerCase().includes(need.toLowerCase()))
      );
      if (!hasDietaryTag) return false;
    }

    return true;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin"></div>
            <Sparkles className="w-6 h-6 text-rose-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <p className="mt-6 text-gray-600 dark:text-gray-400 font-medium">Finding the best deals near you...</p>
          <div className="loading-dots mt-2">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      {/* Gradient mesh background */}
      <div className="fixed inset-0 gradient-mesh opacity-30 dark:opacity-20 pointer-events-none"></div>
      
      <Header />
      
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Location Error Alert */}
        {locationError && (
          <div className="mb-4 p-4 glass rounded-2xl border-yellow-500/20 bg-yellow-50/50 dark:bg-yellow-900/20">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">{locationError}</p>
          </div>
        )}

        {/* Mobile View Toggle */}
        <div className="flex sm:hidden items-center justify-between mb-6">
          <div className="flex items-center space-x-1 glass rounded-2xl p-1.5">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2.5 rounded-xl transition-all duration-200 ${
                viewMode === 'list' 
                  ? 'gradient-primary text-white shadow-lg' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              <Grid3X3 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`p-2.5 rounded-xl transition-all duration-200 ${
                viewMode === 'map' 
                  ? 'gradient-primary text-white shadow-lg' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              <Map className="w-5 h-5" />
            </button>
          </div>
          <button
            onClick={() => setIsFilterOpen(true)}
            className="flex items-center space-x-2 px-5 py-2.5 glass rounded-2xl hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-200 group"
          >
            <Filter className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" />
            <span className="font-medium">Filters</span>
            {(filters.cuisine.length > 0 || filters.dietaryNeeds.length > 0 || filters.distance !== 5) && (
              <span className="flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
            )}
          </button>
        </div>

        {/* Desktop Filter Button */}
        <div className="hidden sm:flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              <span className="text-gradient">{filteredDeals.length}</span> deals near you
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Fresh deals updated in real-time</p>
          </div>
          <button
            onClick={() => setIsFilterOpen(true)}
            className="flex items-center space-x-2 px-6 py-3 glass rounded-2xl hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-200 group"
          >
            <Filter className="w-5 h-5 group-hover:rotate-180 transition-transform duration-300" />
            <span className="font-medium">Filters</span>
            {(filters.cuisine.length > 0 || filters.dietaryNeeds.length > 0 || filters.distance !== 5) && (
              <span className="flex h-2 w-2 ml-2">
                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
            )}
          </button>
        </div>

        {/* Content */}
        {viewMode === 'list' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in">
            {filteredDeals.map((deal, index) => (
              <div
                key={deal.id}
                className="animate-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <DealCard
                  deal={deal}
                  onClick={() => setSelectedDeal(deal)}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="h-[calc(100vh-200px)] rounded-2xl overflow-hidden shadow-2xl animate-in">
            <MapView deals={filteredDeals} />
          </div>
        )}

        {filteredDeals.length === 0 && (
          <div className="text-center py-16 animate-in">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 mb-6">
              <Filter className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-lg mb-2">No deals found matching your filters</p>
            <p className="text-gray-500 dark:text-gray-500 text-sm mb-6">Try adjusting your search criteria</p>
            <button
              onClick={() => setIsFilterOpen(true)}
              className="btn-primary"
            >
              Adjust Filters
            </button>
          </div>
        )}
      </main>

      <HungryNowButton />

      <FilterPanel 
        isOpen={isFilterOpen} 
        onClose={() => setIsFilterOpen(false)} 
      />

      {selectedDeal && (
        <DealModal 
          deal={selectedDeal} 
          onClose={() => setSelectedDeal(null)} 
        />
      )}
    </div>
  );
}

export default App;
