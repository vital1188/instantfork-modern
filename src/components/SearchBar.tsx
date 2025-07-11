import React, { useState, useRef, useEffect } from 'react';
import { Search, X, TrendingUp, Clock, MapPin } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Deal } from '../types';

export const SearchBar: React.FC = () => {
  const { deals } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchResults, setSearchResults] = useState<Deal[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  // Recent searches (mock data)
  const recentSearches = ['Pizza', 'Sushi', 'Burgers', 'Italian'];
  
  // Trending searches (mock data)
  const trendingSearches = ['Happy Hour', 'Brunch Deals', 'Date Night', 'Family Meals'];

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
      // Simple search implementation
      const results = deals.filter(deal => 
        deal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        deal.restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        deal.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setSearchResults(results.slice(0, 5));
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, deals]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setIsSearchFocused(false);
    // Here you would implement actual search navigation
    console.log('Searching for:', query);
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl mx-auto mb-6">
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
          placeholder="Search for restaurants, cuisines, or deals..."
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
                    Popular Nearby
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button className="p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors">
                    <p className="font-medium text-sm text-gray-900 dark:text-gray-100">Downtown</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">23 deals</p>
                  </button>
                  <button className="p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors">
                    <p className="font-medium text-sm text-gray-900 dark:text-gray-100">Midtown</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">18 deals</p>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
