import React, { useEffect, useState, useCallback } from 'react';
import { GoogleMap, Marker, InfoWindow, Circle, useLoadScript } from '@react-google-maps/api';
import { Deal } from '../types';
import { useStore } from '../store/useStore';
import { formatPrice, calculateSavings, calculateDistance } from '../utils/helpers';
import { MapPin, Navigation, Zap, X } from 'lucide-react';

interface MapViewProps {
  deals: Deal[];
}

const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

const options = {
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  scaleControl: false,
  streetViewControl: false,
  rotateControl: false,
  fullscreenControl: true,
  styles: [
    {
      featureType: "poi",
      elementType: "labels",
      stylers: [{ visibility: "off" }]
    }
  ]
};

// Fallback Map Component when Google Maps is not available
const FallbackMap: React.FC<MapViewProps> = ({ deals }) => {
  const { userLocation, setSelectedDeal } = useStore();
  const [selectedDeal, setSelectedDealLocal] = useState<Deal | null>(null);

  const handleDealClick = (deal: Deal) => {
    setSelectedDealLocal(deal);
  };

  const handleViewDeal = (deal: Deal) => {
    setSelectedDeal(deal);
    setSelectedDealLocal(null);
  };

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Header */}
      <div className="absolute top-4 left-4 right-4 z-10">
        <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-rose-500 rounded-xl">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-gray-100">
                  {deals.length} Deals Near You
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {userLocation ? 'Washington DC Area' : 'Select location to see distances'}
                </p>
              </div>
            </div>
            {userLocation && (
              <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
                <Navigation className="w-4 h-4" />
                <span className="text-sm font-medium">Your Location</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Deals Grid */}
      <div className="absolute inset-0 pt-24 pb-4 px-4 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-7xl mx-auto">
          {deals.map((deal, index) => {
            const savings = calculateSavings(deal.original_price, deal.deal_price);
            const distance = userLocation 
              ? calculateDistance(userLocation.lat, userLocation.lng, deal.location.lat, deal.location.lng)
              : null;

            return (
              <div
                key={deal.id}
                className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group"
                onClick={() => handleDealClick(deal)}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Deal Image */}
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={deal.image_url} 
                    alt={deal.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  
                  {/* Savings Badge */}
                  <div className="absolute top-3 right-3 bg-rose-500 text-white px-3 py-1.5 rounded-xl text-sm font-bold shadow-lg flex items-center space-x-1">
                    <Zap className="w-3 h-3" />
                    <span>{savings}% OFF</span>
                  </div>

                  {/* Location Pin */}
                  <div className="absolute top-3 left-3 bg-blue-500 text-white p-2 rounded-xl shadow-lg">
                    <MapPin className="w-4 h-4" />
                  </div>

                  {/* Distance */}
                  {distance && (
                    <div className="absolute bottom-3 left-3 bg-black/50 text-white px-2 py-1 rounded-lg text-xs font-medium">
                      {distance.toFixed(1)} mi away
                    </div>
                  )}
                </div>

                {/* Deal Content */}
                <div className="p-4">
                  <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 mb-1 line-clamp-1">
                    {deal.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                    {deal.restaurant.name}
                  </p>
                  
                  {/* Price */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-baseline space-x-2">
                      <span className="text-2xl font-bold text-rose-500">
                        {formatPrice(deal.deal_price)}
                      </span>
                      <span className="text-sm text-gray-500 line-through">
                        {formatPrice(deal.original_price)}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                        Save {formatPrice(deal.original_price - deal.deal_price)}
                      </p>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {deal.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* View Deal Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewDeal(deal);
                    }}
                    className="w-full bg-rose-500 hover:bg-rose-600 text-white py-2.5 rounded-xl font-medium transition-colors shadow-lg"
                  >
                    View Deal
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {deals.length === 0 && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No deals found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Try adjusting your filters or location
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Selected Deal Modal */}
      {selectedDeal && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="relative">
              <img 
                src={selectedDeal.image_url} 
                alt={selectedDeal.title}
                className="w-full h-48 object-cover"
              />
              <button
                onClick={() => setSelectedDealLocal(null)}
                className="absolute top-3 right-3 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                {selectedDeal.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {selectedDeal.restaurant.name}
              </p>
              
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl font-bold text-rose-500">
                    {formatPrice(selectedDeal.deal_price)}
                  </span>
                  <span className="text-lg text-gray-500 line-through">
                    {formatPrice(selectedDeal.original_price)}
                  </span>
                </div>
              </div>

              <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm leading-relaxed">
                {selectedDeal.description}
              </p>

              <div className="flex space-x-3">
                <button
                  onClick={() => setSelectedDealLocal(null)}
                  className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => handleViewDeal(selectedDeal)}
                  className="flex-1 bg-rose-500 hover:bg-rose-600 text-white py-3 rounded-xl font-medium transition-colors shadow-lg"
                >
                  View Full Deal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const MapView: React.FC<MapViewProps> = ({ deals }) => {
  const { userLocation, setSelectedDeal, filters } = useStore();
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<Deal | null>(null);
  const [hoveredMarkerId, setHoveredMarkerId] = useState<string | null>(null);
  const center = userLocation || { lat: 38.9072, lng: -77.0369 }; // Default to Washington DC
  
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  });

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  useEffect(() => {
    if (map && userLocation) {
      map.panTo({ lat: userLocation.lat, lng: userLocation.lng });
    }
  }, [userLocation, map]);

  const createDealIcon = useCallback((deal: Deal, isHovered: boolean = false) => {
    if (!isLoaded || !window.google) return undefined;
    
    const savings = calculateSavings(deal.original_price, deal.deal_price);
    const scale = isHovered ? 1.2 : 1;
    
    return {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
        <svg width="${50 * scale}" height="${50 * scale}" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
          <g transform="scale(${scale})">
            <!-- Shadow -->
            <ellipse cx="25" cy="48" rx="10" ry="2" fill="rgba(0,0,0,0.2)"/>
            
            <!-- Main marker pin -->
            <path d="M25 2 C12 2 2 12 2 25 C2 35 25 48 25 48 S48 35 48 25 C48 12 38 2 25 2 Z" 
                  fill="${isHovered ? '#dc2626' : '#ef4444'}" 
                  stroke="white" 
                  stroke-width="2"/>
            
            <!-- Inner circle -->
            <circle cx="25" cy="22" r="15" fill="white"/>
            
            <!-- Savings badge -->
            <circle cx="35" cy="12" r="10" fill="#dc2626" stroke="white" stroke-width="2"/>
            <text x="35" y="17" text-anchor="middle" font-family="Arial, sans-serif" 
                  font-size="10" font-weight="bold" fill="white">${savings}%</text>
            
            <!-- Fork icon -->
            <path d="M20 18 L20 28 M25 18 L25 28 M30 18 L30 28 M20 18 Q20 15 22 15 L28 15 Q30 15 30 18" 
                  stroke="#ef4444" 
                  stroke-width="2" 
                  fill="none" 
                  stroke-linecap="round"/>
          </g>
        </svg>
      `)}`,
      scaledSize: new window.google.maps.Size(50 * scale, 50 * scale),
      anchor: new window.google.maps.Point(25 * scale, 48 * scale),
    };
  }, [isLoaded]);

  const createUserIcon = useCallback(() => {
    if (!isLoaded || !window.google) return undefined;
    
    return {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
        <svg width="30" height="30" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
          <!-- Pulsing ring -->
          <circle cx="15" cy="15" r="12" fill="rgba(59, 130, 246, 0.2)" stroke="none">
            <animate attributeName="r" from="8" to="14" dur="2s" repeatCount="indefinite"/>
            <animate attributeName="opacity" from="0.6" to="0" dur="2s" repeatCount="indefinite"/>
          </circle>
          
          <!-- Outer ring -->
          <circle cx="15" cy="15" r="8" fill="#3b82f6" stroke="white" stroke-width="3"/>
          
          <!-- Inner dot -->
          <circle cx="15" cy="15" r="3" fill="white"/>
        </svg>
      `)}`,
      scaledSize: new window.google.maps.Size(30, 30),
      anchor: new window.google.maps.Point(15, 15),
    };
  }, [isLoaded]);

  // If Google Maps fails to load or no API key, show fallback
  if (loadError || !import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
    return <FallbackMap deals={deals} />;
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={center}
      zoom={13}
      onLoad={onLoad}
      onUnmount={onUnmount}
      options={options}
    >
      {/* User location marker */}
      {userLocation && (
        <>
          <Marker
            position={{ lat: userLocation.lat, lng: userLocation.lng }}
            icon={createUserIcon()}
            zIndex={1000}
          />
          <Circle
            center={{ lat: userLocation.lat, lng: userLocation.lng }}
            radius={filters.distance * 1609.34} // Convert miles to meters
            options={{
              fillColor: '#3B82F6',
              fillOpacity: 0.1,
              strokeColor: '#3B82F6',
              strokeOpacity: 0.3,
              strokeWeight: 1,
            }}
          />
        </>
      )}

      {/* Deal markers */}
      {deals.map((deal) => {
        return (
          <Marker
            key={deal.id}
            position={{ lat: deal.location.lat, lng: deal.location.lng }}
            icon={createDealIcon(deal, hoveredMarkerId === deal.id)}
            onClick={() => setSelectedMarker(deal)}
            onMouseOver={() => setHoveredMarkerId(deal.id)}
            onMouseOut={() => setHoveredMarkerId(null)}
            zIndex={hoveredMarkerId === deal.id ? 999 : 100}
          />
        );
      })}

      {/* Info window for selected marker */}
      {selectedMarker && (
        <InfoWindow
          position={{ lat: selectedMarker.location.lat, lng: selectedMarker.location.lng }}
          onCloseClick={() => setSelectedMarker(null)}
        >
          <div className="p-2 min-w-[200px] max-w-[250px]">
            <h3 className="font-semibold text-sm mb-1">{selectedMarker.title}</h3>
            <p className="text-xs text-gray-600 mb-2">{selectedMarker.restaurant.name}</p>
            {userLocation && (
              <p className="text-xs text-gray-500 mb-2">
                {calculateDistance(
                  userLocation.lat, 
                  userLocation.lng, 
                  selectedMarker.location.lat, 
                  selectedMarker.location.lng
                ).toFixed(1)} miles away
              </p>
            )}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-lg font-bold text-green-600">
                  {formatPrice(selectedMarker.deal_price)}
                </span>
                <span className="text-xs text-gray-500 line-through ml-1">
                  {formatPrice(selectedMarker.original_price)}
                </span>
              </div>
              <button
                onClick={() => {
                  setSelectedDeal(selectedMarker);
                  setSelectedMarker(null);
                }}
                className="text-xs bg-red-500 text-white px-3 py-1.5 rounded hover:bg-red-600 transition-colors"
              >
                View Deal
              </button>
            </div>
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
};
