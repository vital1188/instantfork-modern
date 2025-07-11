import React, { useState } from 'react';
import { User, Settings, Heart, LogOut, ChevronRight, Star } from 'lucide-react';
import { useStore } from '../store/useStore';

interface UserProfileProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ isOpen, onClose }) => {
  const { user } = useStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'favorites' | 'history'>('profile');

  if (!isOpen || !user) return null;

  // Mock data for demonstration
  const stats = {
    totalSaved: 245.50,
    dealsRedeemed: 23,
    favoriteRestaurants: 8,
    memberSince: 'Jan 2024'
  };

  const recentHistory = [
    { id: 1, restaurant: 'The Rustic Table', deal: '50% Off Dinner', date: '2 days ago', saved: 22.50 },
    { id: 2, restaurant: 'Sakura Sushi', deal: 'BOGO Sushi Rolls', date: '5 days ago', saved: 18.00 },
    { id: 3, restaurant: 'Bella Italia', deal: 'Free Dessert', date: '1 week ago', saved: 8.00 },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 duration-500 mx-auto my-auto">
        {/* Header */}
        <div className="relative h-32 gradient-primary">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-white rotate-180" />
          </button>
          
          {/* Profile Info */}
          <div className="absolute -bottom-16 left-6 flex items-end space-x-4">
            <div className="w-32 h-32 bg-white dark:bg-gray-800 rounded-2xl shadow-xl flex items-center justify-center">
              <User className="w-16 h-16 text-gray-400" />
            </div>
            <div className="pb-4">
              <h2 className="text-2xl font-bold text-white">{user.name}</h2>
              <p className="text-white/80">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-20 px-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="glass rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-gradient">${stats.totalSaved}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Saved</p>
          </div>
          <div className="glass rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-gradient">{stats.dealsRedeemed}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Deals Used</p>
          </div>
          <div className="glass rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-gradient">{stats.favoriteRestaurants}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Favorites</p>
          </div>
          <div className="glass rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-gradient">{stats.memberSince}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Member Since</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-6 px-6">
          <div className="flex space-x-1 glass-subtle rounded-2xl p-1">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === 'profile' 
                  ? 'gradient-primary text-white shadow-lg' 
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Profile
            </button>
            <button
              onClick={() => setActiveTab('favorites')}
              className={`flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === 'favorites' 
                  ? 'gradient-primary text-white shadow-lg' 
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Favorites
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === 'history' 
                  ? 'gradient-primary text-white shadow-lg' 
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              History
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[400px] scrollbar-thin">
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <button className="w-full flex items-center justify-between p-4 glass rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div className="flex items-center space-x-3">
                  <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <span className="font-medium">Account Settings</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>

              <button className="w-full flex items-center justify-between p-4 glass rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div className="flex items-center space-x-3">
                  <Heart className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <span className="font-medium">Dietary Preferences</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>

              <button className="w-full flex items-center justify-between p-4 glass rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div className="flex items-center space-x-3">
                  <Star className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <span className="font-medium">Rate App</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>

              <button className="w-full flex items-center justify-between p-4 glass rounded-2xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-600 dark:text-red-400">
                <div className="flex items-center space-x-3">
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Sign Out</span>
                </div>
              </button>
            </div>
          )}

          {activeTab === 'favorites' && (
            <div className="text-center py-8">
              <Heart className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Your favorite deals will appear here</p>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-3">
              {recentHistory.map((item) => (
                <div key={item.id} className="p-4 glass rounded-2xl">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100">{item.restaurant}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{item.deal}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{item.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600 dark:text-green-400">
                        Saved ${item.saved.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
