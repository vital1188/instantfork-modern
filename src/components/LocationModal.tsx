import React, { useState } from 'react';
import { MapPin, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useStore } from '../store/useStore';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LocationModal: React.FC<LocationModalProps> = ({ isOpen, onClose }) => {
  const { userLocation, setUserLocation } = useStore();
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const updateLocation = () => {
    setIsLoading(true);
    setStatus('idle');

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(newLocation);
          setStatus('success');
          setMessage(`Location updated successfully!\nLat: ${newLocation.lat.toFixed(4)}, Lng: ${newLocation.lng.toFixed(4)}`);
          setIsLoading(false);
          
          // Auto close after 2 seconds on success
          setTimeout(() => {
            onClose();
            setStatus('idle');
          }, 2000);
        },
        (error) => {
          setStatus('error');
          let errorMessage = 'Unable to get your location. ';
          
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage += 'Please enable location permissions in your browser settings.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage += 'Location information is currently unavailable.';
              break;
            case error.TIMEOUT:
              errorMessage += 'Location request timed out. Please try again.';
              break;
            default:
              errorMessage += 'An unknown error occurred.';
          }
          
          setMessage(errorMessage);
          setIsLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      setStatus('error');
      setMessage('Geolocation is not supported by your browser.');
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-md w-full shadow-2xl animate-in slide-in-from-bottom-4 duration-500">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-rose-100 dark:bg-rose-900/30 rounded-2xl">
                <MapPin className="w-6 h-6 text-rose-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Update Location</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Get deals near your current location</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Current Location */}
          {userLocation && status === 'idle' && (
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Current location:</p>
              <p className="font-mono text-sm text-gray-900 dark:text-gray-100">
                {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
              </p>
            </div>
          )}

          {/* Status Messages */}
          {status === 'success' && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/30 rounded-2xl flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-800 dark:text-green-200 whitespace-pre-line">{message}</p>
            </div>
          )}

          {status === 'error' && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 rounded-2xl flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 dark:text-red-200">{message}</p>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="mb-6 text-center py-8">
              <Loader2 className="w-8 h-8 text-rose-500 animate-spin mx-auto mb-3" />
              <p className="text-sm text-gray-600 dark:text-gray-400">Getting your location...</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={updateLocation}
              disabled={isLoading}
              className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <MapPin className="w-4 h-4" />
              <span>{isLoading ? 'Updating...' : 'Update Location'}</span>
            </button>
            <button
              onClick={onClose}
              className="flex-1 btn-secondary"
            >
              Cancel
            </button>
          </div>

          {/* Help Text */}
          <p className="text-xs text-gray-500 dark:text-gray-500 text-center mt-4">
            Make sure location services are enabled in your browser
          </p>
        </div>
      </div>
    </div>
  );
};
