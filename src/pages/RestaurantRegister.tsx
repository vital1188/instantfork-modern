import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Store, 
  Mail, 
  Lock, 
  User, 
  Phone, 
  MapPin, 
  Globe, 
  FileText,
  ArrowRight,
  Check,
  AlertCircle
} from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';
import { createRestaurant } from '../lib/restaurantHelpers';
import { supabase } from '../lib/supabase';

interface FormData {
  // Account Info
  email: string;
  password: string;
  confirmPassword: string;
  
  // Restaurant Info
  restaurantName: string;
  ownerName: string;
  phone: string;
  category: string;
  description: string;
  
  // Location
  address: string;
  city: string;
  state: string;
  zipCode: string;
  
  // Optional
  website?: string;
  
  // Terms
  agreeToTerms: boolean;
}

export function RestaurantRegister() {
  const navigate = useNavigate();
  const { signUp } = useAuthContext();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    restaurantName: '',
    ownerName: '',
    phone: '',
    category: '',
    description: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    website: '',
    agreeToTerms: false
  });

  const steps = [
    { number: 1, title: 'Account Info' },
    { number: 2, title: 'Restaurant Details' },
    { number: 3, title: 'Location' },
    { number: 4, title: 'Review & Submit' }
  ];

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.email || !formData.password || !formData.confirmPassword) {
          setError('Please fill in all fields');
          return false;
        }
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          return false;
        }
        if (formData.password.length < 6) {
          setError('Password must be at least 6 characters');
          return false;
        }
        break;
      case 2:
        if (!formData.restaurantName || !formData.ownerName || !formData.phone || !formData.category || !formData.description) {
          setError('Please fill in all fields');
          return false;
        }
        break;
      case 3:
        if (!formData.address || !formData.city || !formData.state || !formData.zipCode) {
          setError('Please fill in all fields');
          return false;
        }
        break;
      case 4:
        if (!formData.agreeToTerms) {
          setError('You must agree to the terms and conditions');
          return false;
        }
        break;
    }
    setError(null);
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) return;
    
    setIsLoading(true);
    setError(null);

    try {
      // 1. Create user account
      const { error: signUpError } = await signUp(formData.email, formData.password, formData.ownerName);
      
      if (signUpError) {
        throw new Error(signUpError.message || 'Failed to create account');
      }

      // 2. Get the newly created user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Failed to get user after signup');
      }

      // 3. Create restaurant profile using our helper function
      const { error: restaurantError } = await createRestaurant({
        owner_id: user.id,
        name: formData.restaurantName,
        description: formData.description,
        category: formData.category,
        address: `${formData.address}, ${formData.city}, ${formData.state} ${formData.zipCode}`,
        phone: formData.phone,
        email: formData.email,
        website: formData.website,
        location: {
          lat: 0, // You would normally geocode the address here
          lng: 0
        }
      });

      if (restaurantError) {
        throw new Error(restaurantError.message || 'Failed to create restaurant profile');
      }

      // Success! Navigate to dashboard
      navigate('/restaurant-dashboard');
    } catch (err) {
      console.error('Registration error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred during registration';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Store className="w-8 h-8 text-rose-500" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Restaurant Registration
              </h1>
            </div>
            <button
              onClick={() => navigate('/')}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            >
              Back to Home
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                  currentStep > step.number 
                    ? 'bg-rose-500 border-rose-500 text-white'
                    : currentStep === step.number
                    ? 'border-rose-500 text-rose-500'
                    : 'border-gray-300 text-gray-400'
                }`}>
                  {currentStep > step.number ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    step.number
                  )}
                </div>
                <div className={`ml-3 ${index === steps.length - 1 ? 'hidden sm:block' : ''}`}>
                  <p className={`text-sm font-medium ${
                    currentStep >= step.number ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-full h-0.5 mx-4 ${
                    currentStep > step.number ? 'bg-rose-500' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Form Steps */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-6">
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
                Create Your Account
              </h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-rose-500 dark:bg-gray-800"
                  placeholder="restaurant@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Lock className="w-4 h-4 inline mr-1" />
                  Password
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-rose-500 dark:bg-gray-800"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Lock className="w-4 h-4 inline mr-1" />
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-rose-500 dark:bg-gray-800"
                  placeholder="••••••••"
                />
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
                Restaurant Details
              </h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Store className="w-4 h-4 inline mr-1" />
                  Restaurant Name
                </label>
                <input
                  type="text"
                  value={formData.restaurantName}
                  onChange={(e) => setFormData({ ...formData, restaurantName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-rose-500 dark:bg-gray-800"
                  placeholder="Joe's Pizza"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  Owner Name
                </label>
                <input
                  type="text"
                  value={formData.ownerName}
                  onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-rose-500 dark:bg-gray-800"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-rose-500 dark:bg-gray-800"
                  placeholder="(555) 123-4567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
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
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <FileText className="w-4 h-4 inline mr-1" />
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-rose-500 dark:bg-gray-800"
                  placeholder="Tell us about your restaurant..."
                />
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
                Location Information
              </h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Street Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
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
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-rose-500 dark:bg-gray-800"
                    placeholder="New York"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    State
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-rose-500 dark:bg-gray-800"
                    placeholder="NY"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ZIP Code
                </label>
                <input
                  type="text"
                  value={formData.zipCode}
                  onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-rose-500 dark:bg-gray-800"
                  placeholder="10001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Globe className="w-4 h-4 inline mr-1" />
                  Website (Optional)
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-rose-500 dark:bg-gray-800"
                  placeholder="https://www.example.com"
                />
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
                Review & Submit
              </h2>
              
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Account Information</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Email: {formData.email}</p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Restaurant Details</h3>
                  <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <p>Name: {formData.restaurantName}</p>
                    <p>Owner: {formData.ownerName}</p>
                    <p>Phone: {formData.phone}</p>
                    <p>Category: {formData.category}</p>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Location</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {formData.address}, {formData.city}, {formData.state} {formData.zipCode}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="terms"
                  checked={formData.agreeToTerms}
                  onChange={(e) => setFormData({ ...formData, agreeToTerms: e.target.checked })}
                  className="mt-1 w-4 h-4 text-rose-500 border-gray-300 rounded focus:ring-rose-500"
                />
                <label htmlFor="terms" className="text-sm text-gray-600 dark:text-gray-400">
                  I agree to the Terms of Service and Privacy Policy. I understand that I am creating a business account
                  and will be responsible for managing deals and restaurant information.
                </label>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            {currentStep > 1 && (
              <button
                onClick={handleBack}
                className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              >
                Back
              </button>
            )}
            
            {currentStep < 4 ? (
              <button
                onClick={handleNext}
                className="ml-auto flex items-center space-x-2 px-6 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600"
              >
                <span>Next</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="ml-auto flex items-center space-x-2 px-6 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Complete Registration</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Already have an account */}
        <div className="text-center mt-6">
          <p className="text-gray-600 dark:text-gray-400">
            Already have a restaurant account?{' '}
            <button
              onClick={() => navigate('/restaurant-login')}
              className="text-rose-600 hover:text-rose-700 font-medium"
            >
              Sign in here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
