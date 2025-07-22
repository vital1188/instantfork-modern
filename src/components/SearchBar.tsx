import React, { useState, useRef, useEffect } from 'react';
import { Search, X, TrendingUp, Clock, MapPin, Filter } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Deal } from '../types';
import { DMV_LOCATIONS } from '../config/locations';

export const SearchBar: React.FC = () => {
  const { deals, setFilters, filters, userLocation, searchQuery, setSearchQuery } = useStore();
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchResults, setSearchResults] = useState<Deal[]>([]);
  const [selectedSearchType, setSelectedSearchType] = useState<'all' | 'restaurant' | 'cuisine' | 'location'>('all');
  const searchRef = useRef<HTMLDivElement>(null);

  // Get unique cuisines from deals
  const cuisines = Array.from(new Set(deals.map(deal => deal.restaurant.category))).sort();
  
  // Recent searches stored in localStorage
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    const saved = localStorage.getItem('recentSearches');
    return saved ? JSON.parse(saved) : ['Pizza', 'Sushi', 'Burgers', 'Italian'];
  });
  
  // Trending searches based on popular tags
  const trendingSearches = ['Happy Hour', 'Lunch Special', 'Date Night', 'Family Meals', 'Vegan', 'Gluten-Free'];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      let results: Deal[] = [];
      const query = searchQuery.toLowerCase();
      
      switch (selectedSearchType) {
        case 'restaurant':
          results = deals.filter(deal => 
            deal.restaurant.name.toLowerCase().includes(query)
          );
          break;
        case 'cuisine':
          results = deals.filter(deal => 
            deal.restaurant.category.toLowerCase().includes(query)
          );
          break;
        case 'location':
          // Search by location/address
          results = deals.filter(deal => 
            deal.restaurant.location?.address?.toLowerCase().includes(query) ||
            DMV_LOCATIONS.some(loc => 
              loc.name.toLowerCase().includes(query) && 
              Math.abs(deal.location.lat - loc.coordinates.lat) < 0.1 &&
              Math.abs(deal.location.lng - loc.coordinates.lng) < 0.1
            )
          );
          break;
        default:
          // Search all fields
          results = deals.filter(deal => 
            deal.title.toLowerCase().includes(query) ||
            deal.restaurant.name.toLowerCase().includes(query) ||
            deal.restaurant.category.toLowerCase().includes(query) ||
            deal.description.toLowerCase().includes(query) ||
            deal.tags.some(tag => tag.toLowerCase().includes(query))
          );
      }
      
      setSearchResults(results.slice(0, 8));
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, deals, selectedSearchType]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    // Add to recent searches
    const updatedRecent = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
    setRecentSearches(updatedRecent);
    localStorage.setItem('recentSearches', JSON.stringify(updatedRecent));
    
    // Apply search as filter
    if (query.trim()) {
      // Check if it's a cuisine
      if (cuisines.some(c => c.toLowerCase() === query.toLowerCase())) {
        setFilters({ cuisine: [query] });
      }
      // Check if it's a tag
      else if (trendingSearches.some(t => t.toLowerCase().includes(query.toLowerCase()))) {
        // Filter by matching tags
        const matchingTag = query.toLowerCase();
        // This would need to be implemented in the main filter logic
      }
    }
    
    setIsSearchFocused(false);
  };

  const handleLocationSearch = (location: typeof DMV_LOCATIONS[0]) => {
    // This would update the user's location to search near that area
    console.log('Searching near:', location.name);
    setIsSearchFocused(false);
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl mx-auto mb-6">
      {/* Search Type Selector */}
      <div className="flex gap-2 mb-3">
        {(['all', 'restaurant', 'cuisine', 'location'] as const).map((type) => (
          <button
            key={type}
            onClick={() => setSelectedSearchType(type)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              selectedSearchType === type
                ? 'bg-rose-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsSearchFocused(true)}
          onKeyPress={(e) => e.key === 'Enter' && searchQuery && handleSearch(searchQuery)}
          placeholder={
            selectedSearchType === 'restaurant' ? "Search restaurants..." :
            selectedSearchType === 'cuisine' ? "Search cuisines (Italian, Mexican, etc.)..." :
            selectedSearchType === 'location' ? "Search locations in DMV..." :
            "Search for restaurants, cuisines, or deals..."
          }
          className="w-full pl-12 pr-12 py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 right-0 pr-4 flex items-center"
          >
            <X className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
          </button>
        )}
      </div>

      {/* Search Dropdown */}
      {isSearchFocused && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50 animate-in slide-in-from-top-2 duration-200">
          {searchQuery ? (
            // Search Results
            <div className="p-4">
              {searchResults.length > 0 ? (
                <>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 font-medium uppercase tracking-wider">
                    Search Results
                  </p>
                  <div className="space-y-2">
                    {searchResults.map((deal) => (
                      <button
                        key={deal.id}
                        onClick={() => handleSearch(deal.title)}
                        className="w-full flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors text-left"
                      >
                        <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 overflow-hidden">
                          <img 
                            src={deal.image_url} 
                            alt={deal.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                            {deal.title}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {deal.restaurant.name} • {deal.tags[0]}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-green-600 dark:text-green-400">
                            ${deal.deal_price}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <Search className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No results found for "{searchQuery}"
                  </p>
                </div>
              )}
            </div>
          ) : (
            // Recent & Trending Searches
            <div className="p-4 space-y-4">
              {/* Recent Searches */}
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">
                    Recent Searches
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((search) => (
                    <button
                      key={search}
                      onClick={() => handleSearch(search)}
                      className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full text-sm text-gray-700 dark:text-gray-300 transition-colors"
                    >
                      {search}
                    </button>
                  ))}
                </div>
              </div>

              {/* Trending Searches */}
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-rose-500" />
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">
                    Trending Now
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {trendingSearches.map((search) => (
                    <button
                      key={search}
                      onClick={() => handleSearch(search)}
                      className="px-4 py-2 gradient-primary text-white rounded-full text-sm hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                    >
                      {search}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nearby */}
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <MapPin className="w-4 h-4 text-blue-500" />
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">
                    Popular Locations
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {DMV_LOCATIONS.slice(0, 4).map((location) => {
                    const locationDeals = deals.filter(deal => 
                      Math.abs(deal.location.lat - location.coordinates.lat) < 0.05 &&
                      Math.abs(deal.location.lng - location.coordinates.lng) < 0.05
                    );
                    return (
                      <button 
                        key={location.name}
                        onClick={() => {
                          setSelectedSearchType('location');
                          setSearchQuery(location.name);
                          handleLocationSearch(location);
                        }}
                        className="p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors"
                      >
                        <p className="font-medium text-sm text-gray-900 dark:text-gray-100">{location.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{locationDeals.length} deals</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cuisines */}
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <Filter className="w-4 h-4 text-green-500" />
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">
                    Popular Cuisines
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {cuisines.slice(0, 5).map((cuisine) => (
                    <button
                      key={cuisine}
                      onClick={() => {
                        setSelectedSearchType('cuisine');
                        handleSearch(cuisine);
                      }}
                      className="px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                    >
                      {cuisine}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
