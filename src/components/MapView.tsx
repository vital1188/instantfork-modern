import React, { useEffect, useState, useCallback, useRef } from 'react';
import { GoogleMap, LoadScript, Marker, InfoWindow, Circle, useLoadScript } from '@react-google-maps/api';
import { Deal } from '../types';
import { useStore } from '../store/useStore';
import { formatPrice, calculateSavings, calculateDistance } from '../utils/helpers';

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

export const MapView: React.FC<MapViewProps> = ({ deals }) => {
  const { userLocation, setSelectedDeal, filters } = useStore();
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<Deal | null>(null);
  const [hoveredMarkerId, setHoveredMarkerId] = useState<string | null>(null);
  const center = userLocation || { lat: 40.7128, lng: -74.0060 };
  
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
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

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100">
        <div className="text-center">
          <p className="text-red-600 mb-2">Error loading maps</p>
          <p className="text-sm text-gray-600">Please check your internet connection and try again.</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading map...</p>
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
        const distance = userLocation 
          ? calculateDistance(userLocation.lat, userLocation.lng, deal.location.lat, deal.location.lng)
          : null;

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
