import React, { useState } from 'react';
import { MapPin, Bell, User, Menu, X, Sparkles, Moon, Sun } from 'lucide-react';
import { useStore } from '../store/useStore';

export const Header: React.FC = () => {
  const { viewMode, setViewMode, userLocation } = useStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
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
            <div className="flex items-center space-x-1 glass-subtle rounded-2xl p-1">
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
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 glass-subtle px-4 py-2 rounded-xl">
                <MapPin className="w-4 h-4 mr-2 text-rose-500" />
                <span className="font-medium">Near you</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center space-x-2">
              <button 
                onClick={toggleDarkMode}
                className="p-2.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 glass-subtle rounded-xl transition-all duration-200 hover:shadow-lg"
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              
              <button className="p-2.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 relative glass-subtle rounded-xl transition-all duration-200 hover:shadow-lg">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                </span>
              </button>

              <button className="p-2.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 glass-subtle rounded-xl transition-all duration-200 hover:shadow-lg">
                <User className="w-5 h-5" />
              </button>
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
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 px-4 py-2">
                  <MapPin className="w-4 h-4 mr-2 text-rose-500" />
                  <span>Near you</span>
                </div>
              )}
              
              <div className="flex items-center space-x-2 px-4">
                <button className="flex-1 p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 relative glass-subtle rounded-xl transition-all duration-200">
                  <Bell className="w-5 h-5 mx-auto" />
                  <span className="absolute top-1 right-1/4 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                  </span>
                </button>

                <button className="flex-1 p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 glass-subtle rounded-xl transition-all duration-200">
                  <User className="w-5 h-5 mx-auto" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
