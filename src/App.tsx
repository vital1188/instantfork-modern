import { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { DealCard } from './components/DealCard';
import { MapView } from './components/MapView';
import { FilterPanel } from './components/FilterPanel';
import { DealModal } from './components/DealModal';
import { HungryNowButton } from './components/HungryNowButton';
import { SearchBar } from './components/SearchBar';
import { FeaturedDeals } from './components/FeaturedDeals';
import { Filter, Grid3X3, Map, Sparkles, Pizza, Coffee, Utensils, Wine, Sandwich, IceCream } from 'lucide-react';
import { useStore } from './store/useStore';
import { mockDeals } from './utils/mockData';
import { calculateDistance } from './utils/helpers';
import { differenceInHours } from 'date-fns';
import { fetchRestaurantDeals } from './lib/dealsHelpers';
import { isSupabaseConfigured } from './lib/supabase';
import { isWithinDMV, getNearestDMVLocation } from './config/locations';
import { ServiceUnavailable } from './components/ServiceUnavailable';

function App() {
  const { 
    deals, 
    setDeals, 
    viewMode, 
    setViewMode,
    filters,
    setFilters, 
    selectedDeal, 
    setSelectedDeal,
    userLocation,
    setUserLocation,
    setUser,
    searchQuery
  } = useStore();
  
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isOutsideDMV, setIsOutsideDMV] = useState(false);

  // Initialize app
  useEffect(() => {
    // Get user location with better error handling
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          // Check if location is within DMV area
          if (isWithinDMV(lat, lng)) {
            setUserLocation({ lat, lng });
            setLocationError(null);
            setIsOutsideDMV(false);
          } else {
            // User is outside DMV area
            setIsOutsideDMV(true);
            const nearestLocation = getNearestDMVLocation(lat, lng);
            setUserLocation(nearestLocation.coordinates);
          }
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
          // Default to Washington DC
          setUserLocation({ lat: 38.9072, lng: -77.0369 });
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      setLocationError('Geolocation is not supported by your browser.');
      // Default to Washington DC
      setUserLocation({ lat: 38.9072, lng: -77.0369 });
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
    const loadDeals = async () => {
      try {
        // Start with mock deals
        let allDeals = [...mockDeals];
        
        // If Supabase is configured, fetch restaurant deals
        if (isSupabaseConfigured) {
          console.log('Supabase is configured, fetching restaurant deals...');
          const restaurantDeals = await fetchRestaurantDeals();
          console.log('Restaurant deals fetched:', restaurantDeals);
          
          // Combine mock deals with restaurant deals
          allDeals = [...mockDeals, ...restaurantDeals];
          console.log('Total deals:', allDeals.length, '(Mock:', mockDeals.length, ', Restaurant:', restaurantDeals.length, ')');
        } else {
          console.log('Supabase not configured, using only mock deals');
        }
        
        setDeals(allDeals);
      } catch (error) {
        console.error('Error loading deals:', error);
        // Fall back to mock deals if there's an error
        setDeals(mockDeals);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadDeals();
  }, [setDeals, setUserLocation, setUser]);

  // Filter deals based on current filters and search query
  const filteredDeals = deals.filter(deal => {
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        deal.title.toLowerCase().includes(query) ||
        deal.restaurant.name.toLowerCase().includes(query) ||
        deal.restaurant.category.toLowerCase().includes(query) ||
        deal.description.toLowerCase().includes(query) ||
        deal.tags.some(tag => tag.toLowerCase().includes(query)) ||
        deal.restaurant.location?.address?.toLowerCase().includes(query);
      
      if (!matchesSearch) return false;
    }

    // Price filter
    if (deal.deal_price > filters.priceRange[1]) return false;

    // Distance filter
    if (userLocation && deal.location && deal.location.lat && deal.location.lng) {
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

  // Show service unavailable message if user is outside DMV area
  if (isOutsideDMV && !isLoading) {
    return (
      <ServiceUnavailable 
        userLocation={userLocation || undefined}
        onSelectLocation={(location) => {
          setUserLocation(location);
          setIsOutsideDMV(false);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      {/* Gradient mesh background */}
      <div className="fixed inset-0 gradient-mesh opacity-30 dark:opacity-20 pointer-events-none"></div>
      
      <Header />
      
      {viewMode === 'map' ? (
        // Map View - Full screen without other elements
        <main className="relative h-[calc(100vh-64px)]">
          <MapView deals={filteredDeals} />
        </main>
      ) : (
        // List View - With all the features
        <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Search Bar */}
          <SearchBar />

          {/* Featured Deals Carousel */}
          <FeaturedDeals deals={filteredDeals} onDealClick={setSelectedDeal} />

          {/* Categories */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Browse by Category</h3>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
              {[
                { icon: Pizza, name: 'Pizza', category: 'Italian', color: 'text-orange-500' },
                { icon: Coffee, name: 'Coffee', category: 'Coffee', color: 'text-brown-600' },
                { icon: Utensils, name: 'Dining', category: 'American', color: 'text-blue-500' },
                { icon: Wine, name: 'Drinks', category: 'Drinks', color: 'text-purple-500' },
                { icon: Sandwich, name: 'Fast Food', category: 'Fast Food', color: 'text-green-500' },
                { icon: IceCream, name: 'Desserts', category: 'Desserts', color: 'text-pink-500' },
              ].map((category) => {
                const categoryDeals = deals.filter(deal => 
                  deal.restaurant.category === category.category || 
                  deal.tags.some(tag => tag.toLowerCase().includes(category.name.toLowerCase()))
                );
                const isActive = filters.cuisine.includes(category.category);
                
                return (
                  <button
                    key={category.name}
                    onClick={() => {
                      if (isActive) {
                        setFilters({ cuisine: filters.cuisine.filter(c => c !== category.category) });
                      } else {
                        setFilters({ cuisine: [...filters.cuisine, category.category] });
                      }
                    }}
                    className={`flex flex-col items-center p-4 glass rounded-2xl transition-all duration-200 group relative ${
                      isActive ? 'ring-2 ring-rose-500 bg-rose-50/50 dark:bg-rose-900/20' : 'hover:bg-white/80 dark:hover:bg-gray-800/80'
                    }`}
                  >
                    <category.icon className={`w-8 h-8 ${category.color} group-hover:scale-110 transition-transform duration-200`} />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-2">{category.name}</span>
                    {categoryDeals.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {categoryDeals.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

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
                  viewMode === 'list' 
                    ? 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                    : 'gradient-primary text-white shadow-lg'
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
      )}

      <HungryNowButton />

      <FilterPanel 
        isOpen={isFilterOpen} 
        onClose={() => setIsFilterOpen(false)} 
      />

      <DealModal 
        deal={selectedDeal} 
        isOpen={!!selectedDeal}
        onClose={() => setSelectedDeal(null)} 
      />
    </div>
  );
}

export default App;
