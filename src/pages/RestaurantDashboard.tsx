import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Clock, 
  DollarSign, 
  Eye, 
  EyeOff,
  BarChart3,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Globe,
  Save,
  X,
  QrCode
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuthContext } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { QRScanner } from '../components/QRScanner';
import { ClaimCodeInput } from '../components/ClaimCodeInput';

interface RestaurantDeal {
  id: string;
  title: string;
  description: string;
  original_price: number;
  deal_price: number;
  start_time: string;
  end_time: string;
  active: boolean;
  views: number;
  claims: number;
  image_url?: string;
  tags: string[];
  created_at: string;
  quantity_available?: number;
  quantity_claimed?: number;
}

interface RestaurantProfile {
  id: string;
  name: string;
  description: string;
  category: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  logo?: string;
  location: {
    lat: number;
    lng: number;
  };
  opening_hours: {
    [key: string]: { open: string; close: string };
  };
}

export function RestaurantDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [activeTab, setActiveTab] = useState<'deals' | 'profile' | 'analytics'>('deals');
  const [deals, setDeals] = useState<RestaurantDeal[]>([]);
  const [profile, setProfile] = useState<RestaurantProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDealModal, setShowDealModal] = useState(false);
  const [editingDeal, setEditingDeal] = useState<RestaurantDeal | null>(null);
  const [showClaimInput, setShowClaimInput] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/restaurant-register');
      return;
    }
    loadRestaurantData();
  }, [user, navigate]);

  const loadRestaurantData = async () => {
    try {
      // Load restaurant profile
      const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('owner_id', user?.id)
        .single();

      if (restaurantError) throw restaurantError;
      setProfile(restaurantData);

      // Load deals
      if (restaurantData) {
        const { data: dealsData, error: dealsError } = await supabase
          .from('deals')
          .select('*')
          .eq('restaurant_id', restaurantData.id)
          .order('created_at', { ascending: false });

        if (dealsError) throw dealsError;
        setDeals(dealsData || []);
      }
    } catch (error) {
      console.error('Error loading restaurant data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDeal = async (dealId: string) => {
    if (!confirm('Are you sure you want to delete this deal?')) return;

    try {
      const { error } = await supabase
        .from('deals')
        .delete()
        .eq('id', dealId);

      if (error) throw error;
      setDeals(deals.filter(d => d.id !== dealId));
    } catch (error) {
      console.error('Error deleting deal:', error);
      alert('Failed to delete deal');
    }
  };

  const toggleDealStatus = async (dealId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('deals')
        .update({ active: !currentStatus })
        .eq('id', dealId);

      if (error) throw error;
      setDeals(deals.map(d => 
        d.id === dealId ? { ...d, active: !currentStatus } : d
      ));
    } catch (error) {
      console.error('Error updating deal status:', error);
      alert('Failed to update deal status');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">
              <span className="hidden sm:inline">Restaurant Dashboard</span>
              <span className="sm:hidden">Dashboard</span>
            </h1>
            <button
              onClick={() => navigate('/')}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 text-sm sm:text-base px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <span className="hidden sm:inline">View Public Site</span>
              <span className="sm:hidden">Public</span>
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 mt-4 sm:mt-6">
        <div className="border-b border-gray-200 dark:border-gray-800">
          <nav className="-mb-px flex">
            {(['deals', 'profile', 'analytics'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 sm:flex-none py-3 sm:py-2 px-1 sm:px-4 border-b-2 font-medium text-sm capitalize transition-colors text-center ${
                  activeTab === tab
                    ? 'border-rose-500 text-rose-600 dark:text-rose-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {activeTab === 'deals' && (
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Your Deals
              </h2>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={() => setShowClaimInput(true)}
                  className="flex items-center justify-center space-x-2 px-4 py-3 sm:py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
                >
                  <Hash className="w-5 h-5" />
                  <span className="hidden sm:inline">Redeem Code</span>
                  <span className="sm:hidden">Redeem</span>
                </button>
                <button
                  onClick={() => {
                    setEditingDeal(null);
                    setShowDealModal(true);
                  }}
                  className="flex items-center justify-center space-x-2 px-4 py-3 sm:py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors font-medium"
                >
                  <Plus className="w-5 h-5" />
                  <span className="hidden sm:inline">Add New Deal</span>
                  <span className="sm:hidden">Add Deal</span>
                </button>
              </div>
            </div>

            {deals.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-lg">
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  You haven't created any deals yet
                </p>
                <button
                  onClick={() => setShowDealModal(true)}
                  className="btn-primary"
                >
                  Create Your First Deal
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {deals.map((deal) => (
                  <div
                    key={deal.id}
                    className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-800"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {deal.title}
                          </h3>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            deal.active 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                          }`}>
                            {deal.active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 mb-3">
                          {deal.description}
                        </p>
                        <div className="flex items-center space-x-6 text-sm">
                          <div className="flex items-center space-x-1">
                            <DollarSign className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-500 line-through">${deal.original_price}</span>
                            <span className="text-rose-600 font-semibold">${deal.deal_price}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600 dark:text-gray-400">
                              {format(new Date(deal.end_time), 'MMM d, h:mm a')}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Eye className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600 dark:text-gray-400">
                              {deal.views} views
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <BarChart3 className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600 dark:text-gray-400">
                              {deal.claims} claims
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => toggleDealStatus(deal.id, deal.active)}
                          className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                          title={deal.active ? 'Deactivate' : 'Activate'}
                        >
                          {deal.active ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                        <button
                          onClick={() => {
                            setEditingDeal(deal);
                            setShowDealModal(true);
                          }}
                          className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                          title="Edit"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteDeal(deal.id)}
                          className="p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <RestaurantProfileTab profile={profile} onUpdate={setProfile} />
        )}

        {activeTab === 'analytics' && (
          <RestaurantAnalytics deals={deals} />
        )}
      </div>

      {/* Deal Modal */}
      {showDealModal && (
        <DealFormModal
          deal={editingDeal}
          restaurantId={profile?.id || ''}
          onClose={() => {
            setShowDealModal(false);
            setEditingDeal(null);
          }}
          onSave={(newDeal) => {
            if (editingDeal) {
              setDeals(deals.map(d => d.id === editingDeal.id ? newDeal : d));
            } else {
              setDeals([newDeal, ...deals]);
            }
            setShowDealModal(false);
            setEditingDeal(null);
          }}
        />
      )}

      {/* QR Scanner Modal */}
      {showClaimInput && (
        <ClaimCodeInput
          isOpen={showClaimInput}
          onClose={() => setShowClaimInput(false)}
          restaurantId={profile?.id}
        />
      )}
    </div>
  );
}

// Restaurant Profile Tab Component
function RestaurantProfileTab({ 
  profile, 
  onUpdate 
}: { 
  profile: RestaurantProfile | null; 
  onUpdate: (profile: RestaurantProfile) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(profile || {
    name: '',
    description: '',
    category: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    location: { lat: 0, lng: 0 }
  });

  const handleSave = async () => {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .update(formData)
        .eq('id', profile?.id)
        .select()
        .single();

      if (error) throw error;
      onUpdate(data);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    }
  };

  if (!profile) return null;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Restaurant Profile
        </h2>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center space-x-2 px-4 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
          >
            <Edit2 className="w-4 h-4" />
            <span>Edit Profile</span>
          </button>
        ) : (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center space-x-2 px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Restaurant Name
          </label>
          {isEditing ? (
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-rose-500 dark:bg-gray-800"
            />
          ) : (
            <p className="text-gray-900 dark:text-gray-100">{profile.name}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Category
          </label>
          {isEditing ? (
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-rose-500 dark:bg-gray-800"
            >
              <option value="">Select a category</option>
              <option value="Pizza">Pizza</option>
              <option value="Coffee">Coffee</option>
              <option value="Dining">Dining</option>
              <option value="Fast Food">Fast Food</option>
              <option value="Desserts">Desserts</option>
              <option value="Drinks">Drinks</option>
            </select>
          ) : (
            <p className="text-gray-900 dark:text-gray-100">{profile.category}</p>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Description
          </label>
          {isEditing ? (
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-rose-500 dark:bg-gray-800"
            />
          ) : (
            <p className="text-gray-900 dark:text-gray-100">{profile.description}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <MapPin className="w-4 h-4 inline mr-1" />
            Address
          </label>
          {isEditing ? (
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-rose-500 dark:bg-gray-800"
            />
          ) : (
            <p className="text-gray-900 dark:text-gray-100">{profile.address}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Phone className="w-4 h-4 inline mr-1" />
            Phone
          </label>
          {isEditing ? (
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-rose-500 dark:bg-gray-800"
            />
          ) : (
            <p className="text-gray-900 dark:text-gray-100">{profile.phone}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Mail className="w-4 h-4 inline mr-1" />
            Email
          </label>
          {isEditing ? (
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-rose-500 dark:bg-gray-800"
            />
          ) : (
            <p className="text-gray-900 dark:text-gray-100">{profile.email}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Globe className="w-4 h-4 inline mr-1" />
            Website
          </label>
          {isEditing ? (
            <input
              type="url"
              value={formData.website || ''}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-rose-500 dark:bg-gray-800"
            />
          ) : (
            <p className="text-gray-900 dark:text-gray-100">{profile.website || 'Not provided'}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// Analytics Component
function RestaurantAnalytics({ deals }: { deals: RestaurantDeal[] }) {
  const totalViews = deals.reduce((sum, deal) => sum + deal.views, 0);
  const totalClaims = deals.reduce((sum, deal) => sum + deal.claims, 0);
  const activeDeals = deals.filter(deal => deal.active).length;
  const avgDiscount = deals.length > 0
    ? Math.round(deals.reduce((sum, deal) => 
        sum + ((deal.original_price - deal.deal_price) / deal.original_price * 100), 0
      ) / deals.length)
    : 0;

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
        Analytics Overview
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 dark:text-gray-400">Total Views</span>
            <Eye className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalViews}</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 dark:text-gray-400">Total Claims</span>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalClaims}</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 dark:text-gray-400">Active Deals</span>
            <Calendar className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{activeDeals}</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 dark:text-gray-400">Avg Discount</span>
            <DollarSign className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{avgDiscount}%</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Deal Performance
        </h3>
        <div className="space-y-4">
          {deals.map((deal) => (
            <div key={deal.id} className="flex items-center justify-between">
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-gray-100">{deal.title}</p>
                <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
                  <span>{deal.views} views</span>
                  <span>{deal.claims} claims</span>
                  <span>{deal.claims > 0 ? Math.round((deal.claims / deal.views) * 100) : 0}% conversion</span>
                </div>
              </div>
              <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-rose-500 h-2 rounded-full"
                  style={{ width: `${deal.views > 0 ? (deal.claims / deal.views) * 100 : 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Deal Form Modal Component
function DealFormModal({ 
  deal, 
  restaurantId,
  onClose, 
  onSave 
}: { 
  deal: RestaurantDeal | null;
  restaurantId: string;
  onClose: () => void;
  onSave: (deal: RestaurantDeal) => void;
}) {
  const [formData, setFormData] = useState({
    title: deal?.title || '',
    description: deal?.description || '',
    original_price: deal?.original_price?.toString() || '',
    deal_price: deal?.deal_price?.toString() || '',
    image_url: deal?.image_url || '',
    tags: deal?.tags || [],
    start_time: deal?.start_time ? new Date(deal.start_time).toISOString().slice(0, 16) : '',
    end_time: deal?.end_time ? new Date(deal.end_time).toISOString().slice(0, 16) : '',
    quantity_available: deal?.quantity_available?.toString() || ''
  });

  const [tagInput, setTagInput] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (deal) {
        // Update existing deal
        const { data, error } = await supabase
          .from('deals')
          .update({
            ...formData,
            active: true
          })
          .eq('id', deal.id)
          .select()
          .single();

        if (error) throw error;
        onSave(data);
      } else {
        // Create new deal
        const { data, error } = await supabase
          .from('deals')
          .insert({
            ...formData,
            restaurant_id: restaurantId,
            active: true,
            views: 0,
            claims: 0
          })
          .select()
          .single();

        if (error) throw error;
        onSave(data);
      }
    } catch (error) {
      console.error('Error saving deal:', error);
      alert('Failed to save deal');
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {deal ? 'Edit Deal' : 'Create New Deal'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Deal Title
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-rose-500 dark:bg-gray-800"
              placeholder="e.g., 50% Off All Pizzas"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-rose-500 dark:bg-gray-800"
              placeholder="Describe your deal..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Original Price
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.original_price}
                onChange={(e) => setFormData({ ...formData, original_price: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-rose-500 dark:bg-gray-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Deal Price
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.deal_price}
                onChange={(e) => setFormData({ ...formData, deal_price: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-rose-500 dark:bg-gray-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Start Time
              </label>
              <input
                type="datetime-local"
                required
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-rose-500 dark:bg-gray-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                End Time
              </label>
              <input
                type="datetime-local"
                required
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-rose-500 dark:bg-gray-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Image URL
            </label>
            <input
              type="url"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-rose-500 dark:bg-gray-800"
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Quantity Available
            </label>
            <input
              type="number"
              min="1"
              value={formData.quantity_available}
              onChange={(e) => setFormData({ ...formData, quantity_available: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-rose-500 dark:bg-gray-800"
              placeholder="Leave empty for unlimited"
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Leave empty for unlimited quantity
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tags
            </label>
            <div className="flex items-center space-x-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-rose-500 dark:bg-gray-800"
                placeholder="Add a tag..."
              />
              <button
                type="button"
                onClick={addTag}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 rounded-full text-sm flex items-center space-x-1"
                >
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-1 hover:text-rose-900 dark:hover:text-rose-100"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600"
            >
              {deal ? 'Update Deal' : 'Create Deal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
