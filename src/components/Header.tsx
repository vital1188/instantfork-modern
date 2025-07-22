import React, { useState, useEffect } from 'react';
import { MapPin, Bell, User, Menu, X, Sparkles, Moon, Sun, LogOut, Store, Settings } from 'lucide-react';
import { useStore } from '../store/useStore';
import { LocationModal } from './LocationModal';
import { UserProfile } from './UserProfile';
import { NotificationsPanel } from './NotificationsPanel';
import { AuthModal } from './AuthModal';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getRestaurantByOwner } from '../lib/restaurantHelpers';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const { viewMode, setViewMode, userLocation } = useStore();
  const { user, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isUserProfileOpen, setIsUserProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [locationDisplay, setLocationDisplay] = useState('Near you');
  const [hasRestaurant, setHasRestaurant] = useState(false);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  // Fetch location name when coordinates change
  useEffect(() => {
    if (userLocation) {
      fetchLocationName(userLocation.lat, userLocation.lng);
    }
  }, [userLocation]);

  // Check if user has a restaurant
  useEffect(() => {
    const checkRestaurant = async () => {
      if (user) {
        const { data } = await getRestaurantByOwner(user.id);
        setHasRestaurant(!!data);
      } else {
        setHasRestaurant(false);
      }
    };
    
    checkRestaurant();
  }, [user]);

  const fetchLocationName = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await response.json();
      if (data.address) {
        // Try to get neighborhood, suburb, or city
        const location = data.address.neighbourhood || 
                        data.address.suburb || 
                        data.address.city || 
                        data.address.town || 
                        data.address.village ||
                        'Near you';
        setLocationDisplay(location);
      }
    } catch (err) {
      console.error('Error fetching location name:', err);
      setLocationDisplay('Near you');
    }
  };

  return (
    <header className="glass sticky top-0 z-50 border-b border-gray-200/20 dark:border-gray-700/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex items-center space-x-3 group">
              <div className="relative">
                <div className="absolute inset-0 gradient-primary rounded-xl blur-lg opacity-60 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative bg-gradient-to-br from-rose-500 to-pink-600 p-2 rounded-xl shadow-lg">
                  <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M3 2v7c0 1.1.9 2 2 2h4c1.1 0 2-.9 2-2V2" />
                    <path d="M7 2v20" />
                    <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7" />
                  </svg>
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
                  Instant Fork
                  <Sparkles className="w-4 h-4 ml-1 text-rose-500 animate-pulse" />
                </h1>
                <p className="text-xs text-gray-600 dark:text-gray-400 hidden sm:block">Discover deals instantly</p>
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {/* View Mode Toggle */}
            <div className="flex items-center space-x-1 glass-subtle rounded-2xl p-1 relative z-10">
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  viewMode === 'list' 
                    ? 'gradient-primary text-white shadow-lg' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                List View
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  viewMode === 'map' 
                    ? 'gradient-primary text-white shadow-lg' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                Map View
              </button>
            </div>

            {/* Location */}
            {userLocation && (
              <button
                onClick={() => setIsLocationModalOpen(true)}
                className="flex items-center text-sm text-gray-600 dark:text-gray-400 glass-subtle px-4 py-2 rounded-xl hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-200 group"
              >
                <MapPin className="w-4 h-4 mr-2 text-rose-500 group-hover:scale-110 transition-transform" />
                <span className="font-medium">{locationDisplay}</span>
              </button>
            )}

            {/* Actions */}
            <div className="flex items-center space-x-2">
              <button 
                onClick={toggleDarkMode}
                className="p-2.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 glass-subtle rounded-xl transition-all duration-200 hover:shadow-lg"
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              
              <button 
                onClick={() => setIsNotificationsOpen(true)}
                className="p-2.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 relative glass-subtle rounded-xl transition-all duration-200 hover:shadow-lg"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                </span>
              </button>

              {/* Restaurant Button - Dynamic based on user state */}
              {!user ? (
                // Not logged in - show sign in prompt
                <button 
                  onClick={() => navigate('/restaurant-login')}
                  className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 glass-subtle rounded-xl transition-all duration-200 hover:shadow-lg"
                  title="Sign in to manage your restaurant"
                >
                  <Store className="w-5 h-5" />
                  <span className="text-sm font-medium hidden lg:inline">For Restaurants</span>
                </button>
              ) : hasRestaurant ? (
                // Has restaurant - go to dashboard
                <button 
                  onClick={() => navigate('/restaurant-dashboard')}
                  className="flex items-center space-x-2 px-4 py-2 gradient-primary text-white rounded-xl transition-all duration-200 hover:shadow-lg"
                  title="Go to Restaurant Dashboard"
                >
                  <Settings className="w-5 h-5" />
                  <span className="text-sm font-medium hidden lg:inline">Dashboard</span>
                </button>
              ) : (
                // Logged in but no restaurant - show register
                <button 
                  onClick={() => navigate('/restaurant-register')}
                  className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 glass-subtle rounded-xl transition-all duration-200 hover:shadow-lg"
                  title="Register Your Restaurant"
                >
                  <Store className="w-5 h-5" />
                  <span className="text-sm font-medium hidden lg:inline">Add Restaurant</span>
                </button>
              )}

              {user ? (
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => setIsUserProfileOpen(true)}
                    className="p-2.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 glass-subtle rounded-xl transition-all duration-200 hover:shadow-lg"
                  >
                    <User className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={async () => {
                      await signOut();
                    }}
                    className="p-2.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 glass-subtle rounded-xl transition-all duration-200 hover:shadow-lg"
                    title="Sign Out"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setIsAuthModalOpen(true)}
                  className="px-4 py-2 btn-primary text-sm"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center space-x-2">
            <button 
              onClick={toggleDarkMode}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200/20 dark:border-gray-700/20 animate-in slide-in-from-top-2">
            <div className="space-y-3">
              {userLocation && (
                <button
                  onClick={() => {
                    setIsLocationModalOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center text-sm text-gray-600 dark:text-gray-400 px-4 py-2 w-full text-left hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <MapPin className="w-4 h-4 mr-2 text-rose-500" />
                  <span>{locationDisplay}</span>
                </button>
              )}
              
              {/* Restaurant Button - Dynamic based on user state */}
              {!user ? (
                // Not logged in - show sign in prompt
                <button
                  onClick={() => {
                    navigate('/restaurant-login');
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center text-sm text-gray-600 dark:text-gray-400 px-4 py-2 w-full text-left hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <Store className="w-4 h-4 mr-2 text-rose-500" />
                  <span>For Restaurants</span>
                </button>
              ) : hasRestaurant ? (
                // Has restaurant - go to dashboard
                <button
                  onClick={() => {
                    navigate('/restaurant-dashboard');
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center text-sm text-white px-4 py-2 w-full text-left bg-gradient-to-r from-rose-500 to-pink-600 rounded-lg transition-colors"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  <span>Restaurant Dashboard</span>
                </button>
              ) : (
                // Logged in but no restaurant - show register
                <button
                  onClick={() => {
                    navigate('/restaurant-register');
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center text-sm text-gray-600 dark:text-gray-400 px-4 py-2 w-full text-left hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <Store className="w-4 h-4 mr-2 text-rose-500" />
                  <span>Add Your Restaurant</span>
                </button>
              )}
              
              <div className="flex items-center space-x-2 px-4">
                <button 
                  onClick={() => {
                    setIsNotificationsOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex-1 p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 relative glass-subtle rounded-xl transition-all duration-200"
                >
                  <Bell className="w-5 h-5 mx-auto" />
                  <span className="absolute top-1 right-1/4 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                  </span>
                </button>

                {user ? (
                  <>
                    <button 
                      onClick={() => {
                        setIsUserProfileOpen(true);
                        setIsMobileMenuOpen(false);
                      }}
                      className="flex-1 p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 glass-subtle rounded-xl transition-all duration-200"
                    >
                      <User className="w-5 h-5 mx-auto" />
                    </button>
                    <button 
                      onClick={async () => {
                        await signOut();
                        setIsMobileMenuOpen(false);
                      }}
                      className="flex-1 p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 glass-subtle rounded-xl transition-all duration-200"
                    >
                      <LogOut className="w-5 h-5 mx-auto" />
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => {
                      setIsAuthModalOpen(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex-1 p-2 btn-primary mx-4"
                  >
                    Sign In
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Location Modal */}
      <LocationModal 
        isOpen={isLocationModalOpen} 
        onClose={() => setIsLocationModalOpen(false)} 
      />

      {/* User Profile Modal */}
      <UserProfile
        isOpen={isUserProfileOpen}
        onClose={() => setIsUserProfileOpen(false)}
      />

      {/* Notifications Panel */}
      <NotificationsPanel
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </header>
  );
};
