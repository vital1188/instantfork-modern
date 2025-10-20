import React, { useState, useEffect } from 'react';
import {
  User,
  Settings,
  Heart,
  LogOut,
  ChevronRight,
  Star,
  Clock,
  MapPin,
  Mail,
  Phone,
  Edit2,
  Save,
  X,
  Bell,
  Utensils,
  DollarSign,
  Check
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getUserFavorites, removeFavorite } from '../lib/supabase';
import { getUserProfile, updateUserProfile, getUserPreferences, updateUserPreferences, getUserRating, submitAppRating } from '../lib/userHelpers';
import { mockDeals } from '../utils/mockData';
import { formatPrice, calculateSavings, getTimeRemaining } from '../utils/helpers';

interface UserProfileProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'profile' | 'account' | 'dietary' | 'rating' | 'favorites' | 'history';

export const UserProfile: React.FC<UserProfileProps> = ({ isOpen, onClose }) => {
  const { user: authUser, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Profile data
  const [profile, setProfile] = useState<any>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    phone: '',
    bio: ''
  });

  // Preferences data
  const [preferences, setPreferences] = useState<any>(null);
  const [dietaryPrefs, setDietaryPrefs] = useState<string[]>([]);
  const [favCuisines, setFavCuisines] = useState<string[]>([]);
  const [notificationSettings, setNotificationSettings] = useState({
    email_notifications: true,
    push_notifications: true
  });

  // Rating data
  const [userRating, setUserRating] = useState<any>(null);
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingReview, setRatingReview] = useState('');
  const [hoverRating, setHoverRating] = useState(0);

  // Favorites and history
  const [favorites, setFavorites] = useState<any[]>([]);
  const [favoriteDeals, setFavoriteDeals] = useState<any[]>([]);
  const [dealHistory, setDealHistory] = useState<any[]>([]);

  const dietaryOptions = ['Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Nut-Free', 'Halal', 'Kosher'];
  const cuisineOptions = ['Italian', 'Mexican', 'Asian', 'American', 'Mediterranean', 'Indian', 'Japanese', 'Thai', 'French', 'Chinese'];

  useEffect(() => {
    if (authUser && isOpen) {
      loadUserData();
    }
  }, [authUser, isOpen, activeTab]);

  const loadUserData = async () => {
    if (!authUser) return;

    setLoading(true);
    try {
      // Load profile
      const { data: profileData } = await getUserProfile(authUser.id);
      if (profileData) {
        setProfile(profileData);
        setProfileForm({
          full_name: profileData.full_name || '',
          phone: profileData.phone || '',
          bio: profileData.bio || ''
        });
      }

      // Load preferences
      const { data: prefsData } = await getUserPreferences(authUser.id);
      if (prefsData) {
        setPreferences(prefsData);
        setDietaryPrefs(prefsData.dietary_preferences || []);
        setFavCuisines(prefsData.favorite_cuisines || []);
        setNotificationSettings({
          email_notifications: prefsData.email_notifications ?? true,
          push_notifications: prefsData.push_notifications ?? true
        });
      }

      // Load rating
      const { data: ratingData } = await getUserRating(authUser.id);
      if (ratingData) {
        setUserRating(ratingData);
        setRatingValue(ratingData.rating);
        setRatingReview(ratingData.review || '');
      }

      // Load favorites
      if (activeTab === 'favorites') {
        const { data: favoritesData } = await getUserFavorites(authUser.id);
        if (favoritesData && favoritesData.length > 0) {
          setFavorites(favoritesData);
          const favDeals = favoritesData
            .map(fav => mockDeals.find(deal => deal.id === fav.deal_id))
            .filter(Boolean);
          setFavoriteDeals(favDeals);
        } else {
          setFavorites([]);
          setFavoriteDeals([]);
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!authUser) return;

    setSaving(true);
    try {
      await updateUserProfile(authUser.id, profileForm);
      setEditingProfile(false);
      await loadUserData();
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleDietary = (option: string) => {
    setDietaryPrefs(prev =>
      prev.includes(option)
        ? prev.filter(p => p !== option)
        : [...prev, option]
    );
  };

  const handleToggleCuisine = (cuisine: string) => {
    setFavCuisines(prev =>
      prev.includes(cuisine)
        ? prev.filter(c => c !== cuisine)
        : [...prev, cuisine]
    );
  };

  const handleSavePreferences = async () => {
    if (!authUser) return;

    setSaving(true);
    try {
      await updateUserPreferences(authUser.id, {
        dietary_preferences: dietaryPrefs,
        favorite_cuisines: favCuisines,
        ...notificationSettings
      });
      alert('Preferences saved successfully!');
    } catch (error) {
      console.error('Error saving preferences:', error);
      alert('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitRating = async () => {
    if (!authUser || ratingValue === 0) return;

    setSaving(true);
    try {
      await submitAppRating(authUser.id, ratingValue, ratingReview);
      alert('Thank you for your rating!');
      await loadUserData();
    } catch (error) {
      console.error('Error submitting rating:', error);
      alert('Failed to submit rating');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveFavorite = async (dealId: string) => {
    if (!authUser) return;

    try {
      await removeFavorite(authUser.id, dealId);
      await loadUserData();
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    onClose();
  };

  if (!isOpen || !authUser) return null;

  const stats = {
    totalSaved: profile?.total_saved || 0,
    dealsRedeemed: dealHistory.length,
    favoriteRestaurants: favorites.length,
    memberSince: authUser.created_at
      ? new Date(authUser.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      : 'New Member'
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 duration-500 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative h-32 gradient-primary flex-shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          {/* Profile Info */}
          <div className="absolute -bottom-16 left-6 flex items-end space-x-4">
            <div className="w-32 h-32 bg-white dark:bg-gray-800 rounded-2xl shadow-xl flex items-center justify-center border-4 border-white dark:border-gray-900">
              <User className="w-16 h-16 text-gray-400" />
            </div>
            <div className="pb-4">
              <h2 className="text-2xl font-bold text-white">{profile?.full_name || authUser.user_metadata?.full_name || 'User'}</h2>
              <p className="text-white/80">{authUser.email}</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-20 px-6 grid grid-cols-2 sm:grid-cols-4 gap-4 flex-shrink-0">
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
            <p className="text-xl sm:text-2xl font-bold text-gradient">{stats.memberSince}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Member Since</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-6 px-6 flex-shrink-0">
          <div className="flex overflow-x-auto space-x-1 glass-subtle rounded-2xl p-1 scrollbar-none">
            {[
              { id: 'profile', label: 'Profile' },
              { id: 'account', label: 'Account' },
              { id: 'dietary', label: 'Dietary' },
              { id: 'rating', label: 'Rate App' },
              { id: 'favorites', label: 'Favorites' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'gradient-primary text-white shadow-lg'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Profile Information</h3>
                {!editingProfile ? (
                  <button
                    onClick={() => setEditingProfile(true)}
                    className="flex items-center space-x-2 text-rose-500 hover:text-rose-600"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span className="text-sm">Edit</span>
                  </button>
                ) : (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setEditingProfile(false)}
                      className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="flex items-center space-x-1 px-3 py-1 text-sm bg-rose-500 text-white rounded-lg hover:bg-rose-600 disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      <span>{saving ? 'Saving...' : 'Save'}</span>
                    </button>
                  </div>
                )}
              </div>

              {editingProfile ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={profileForm.full_name}
                      onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-rose-500 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-rose-500 dark:bg-gray-800 dark:text-white"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Bio
                    </label>
                    <textarea
                      value={profileForm.bio}
                      onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-rose-500 dark:bg-gray-800 dark:text-white"
                      placeholder="Tell us about yourself..."
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 glass rounded-2xl">
                    <div className="flex items-center space-x-3 mb-2">
                      <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Full Name</span>
                    </div>
                    <p className="text-gray-900 dark:text-gray-100">{profile?.full_name || 'Not set'}</p>
                  </div>
                  <div className="p-4 glass rounded-2xl">
                    <div className="flex items-center space-x-3 mb-2">
                      <Mail className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Email</span>
                    </div>
                    <p className="text-gray-900 dark:text-gray-100">{authUser.email}</p>
                  </div>
                  <div className="p-4 glass rounded-2xl">
                    <div className="flex items-center space-x-3 mb-2">
                      <Phone className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Phone</span>
                    </div>
                    <p className="text-gray-900 dark:text-gray-100">{profile?.phone || 'Not set'}</p>
                  </div>
                  {profile?.bio && (
                    <div className="p-4 glass rounded-2xl">
                      <div className="flex items-center space-x-3 mb-2">
                        <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Bio</span>
                      </div>
                      <p className="text-gray-900 dark:text-gray-100">{profile.bio}</p>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={handleSignOut}
                className="w-full mt-6 flex items-center justify-between p-4 glass rounded-2xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-600 dark:text-red-400"
              >
                <div className="flex items-center space-x-3">
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Sign Out</span>
                </div>
              </button>
            </div>
          )}

          {/* Account Settings Tab */}
          {activeTab === 'account' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Account Settings</h3>

              <div className="space-y-4">
                <div className="p-4 glass rounded-2xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">Email Notifications</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Receive deal alerts via email</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.email_notifications}
                        onChange={(e) => setNotificationSettings({ ...notificationSettings, email_notifications: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-rose-300 dark:peer-focus:ring-rose-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-rose-500"></div>
                    </label>
                  </div>
                </div>

                <div className="p-4 glass rounded-2xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">Push Notifications</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Receive push notifications</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.push_notifications}
                        onChange={(e) => setNotificationSettings({ ...notificationSettings, push_notifications: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-rose-300 dark:peer-focus:ring-rose-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-rose-500"></div>
                    </label>
                  </div>
                </div>

                <button
                  onClick={handleSavePreferences}
                  disabled={saving}
                  className="w-full btn-primary disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </div>
          )}

          {/* Dietary Preferences Tab */}
          {activeTab === 'dietary' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Dietary Preferences</h3>

              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Dietary Restrictions</h4>
                <div className="flex flex-wrap gap-2">
                  {dietaryOptions.map((option) => (
                    <button
                      key={option}
                      onClick={() => handleToggleDietary(option)}
                      className={`px-4 py-2 rounded-full text-sm transition-colors ${
                        dietaryPrefs.includes(option)
                          ? 'bg-rose-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Favorite Cuisines</h4>
                <div className="flex flex-wrap gap-2">
                  {cuisineOptions.map((cuisine) => (
                    <button
                      key={cuisine}
                      onClick={() => handleToggleCuisine(cuisine)}
                      className={`px-4 py-2 rounded-full text-sm transition-colors ${
                        favCuisines.includes(cuisine)
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      <Utensils className="w-3 h-3 inline mr-1" />
                      {cuisine}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleSavePreferences}
                disabled={saving}
                className="w-full btn-primary disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
          )}

          {/* Rate App Tab */}
          {activeTab === 'rating' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Rate Our App</h3>

              <div className="text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  How would you rate your experience?
                </p>
                <div className="flex justify-center space-x-2 mb-6">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRatingValue(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-10 h-10 ${
                          star <= (hoverRating || ratingValue)
                            ? 'text-yellow-500 fill-yellow-500'
                            : 'text-gray-300 dark:text-gray-600'
                        }`}
                      />
                    </button>
                  ))}
                </div>

                {ratingValue > 0 && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    You rated us {ratingValue} out of 5 stars
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tell us more (optional)
                </label>
                <textarea
                  value={ratingReview}
                  onChange={(e) => setRatingReview(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-rose-500 dark:bg-gray-800 dark:text-white"
                  placeholder="Share your thoughts about the app..."
                />
              </div>

              <button
                onClick={handleSubmitRating}
                disabled={saving || ratingValue === 0}
                className="w-full btn-primary disabled:opacity-50"
              >
                {saving ? 'Submitting...' : userRating ? 'Update Rating' : 'Submit Rating'}
              </button>

              {userRating && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
                    <Check className="w-5 h-5" />
                    <span className="font-medium">Thank you for your feedback!</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Favorites Tab */}
          {activeTab === 'favorites' && (
            loading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              </div>
            ) : favoriteDeals.length > 0 ? (
              <div className="space-y-3">
                {favoriteDeals.map((deal: any) => (
                  <div key={deal.id} className="p-4 glass rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">{deal.title}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{deal.restaurant.name}</p>

                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex items-center space-x-1 text-xs">
                            <Clock className="w-3 h-3 text-rose-500" />
                            <span className="text-gray-600 dark:text-gray-400">{getTimeRemaining(deal.end_time)}</span>
                          </div>
                          <div className="flex items-center space-x-1 text-xs">
                            <MapPin className="w-3 h-3 text-blue-500" />
                            <span className="text-gray-600 dark:text-gray-400">{deal.restaurant.cuisine}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right ml-4">
                        <div className="flex items-baseline space-x-2 mb-2">
                          <span className="text-xl font-bold text-gradient">{formatPrice(deal.deal_price)}</span>
                          <span className="text-xs text-gray-500 line-through">{formatPrice(deal.original_price)}</span>
                        </div>
                        <button
                          onClick={() => handleRemoveFavorite(deal.id)}
                          className="text-xs text-red-600 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Heart className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">No favorite deals yet</p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                  Start adding deals to your favorites!
                </p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};
