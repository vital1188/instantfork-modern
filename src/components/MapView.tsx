import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Deal } from '../types';
import { useStore } from '../store/useStore';
import { formatPrice, calculateSavings, calculateDistance } from '../utils/helpers';
import { MapPin, Navigation, X, Clock, Zap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface MapViewProps {
  deals: Deal[];
}

export const MapView: React.FC<MapViewProps> = ({ deals }) => {
  const { userLocation, setSelectedDeal, filters } = useStore();
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const radiusCircleRef = useRef<L.Circle | null>(null);
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const center = userLocation || { lat: 38.9072, lng: -77.0369 };

    const map = L.map(mapContainerRef.current, {
      center: [center.lat, center.lng],
      zoom: 13,
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !userLocation) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
    }
    if (radiusCircleRef.current) {
      radiusCircleRef.current.remove();
    }

    const userIcon = L.divIcon({
      className: 'custom-user-marker',
      html: `
        <div class="relative">
          <div class="absolute inset-0 animate-ping">
            <div class="w-8 h-8 rounded-full bg-blue-400 opacity-75"></div>
          </div>
          <div class="relative w-8 h-8 rounded-full bg-blue-500 border-4 border-white shadow-lg flex items-center justify-center">
            <div class="w-2 h-2 rounded-full bg-white"></div>
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], {
      icon: userIcon,
      zIndexOffset: 1000,
    }).addTo(mapRef.current);

    userMarkerRef.current.bindPopup(`
      <div class="text-center p-2">
        <div class="flex items-center space-x-2 mb-2">
          <svg class="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
          </svg>
          <span class="font-semibold text-gray-900">Your Location</span>
        </div>
        <p class="text-xs text-gray-600">Washington DC Area</p>
      </div>
    `);

    radiusCircleRef.current = L.circle([userLocation.lat, userLocation.lng], {
      radius: filters.distance * 1609.34,
      fillColor: '#3B82F6',
      fillOpacity: 0.1,
      color: '#3B82F6',
      opacity: 0.3,
      weight: 1,
    }).addTo(mapRef.current);

    mapRef.current.setView([userLocation.lat, userLocation.lng], 13);
  }, [userLocation, filters.distance]);

  useEffect(() => {
    if (!mapRef.current) return;

    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    deals.forEach((deal) => {
      if (!deal.location?.lat || !deal.location?.lng) return;

      const savings = calculateSavings(deal.original_price, deal.deal_price);
      const distance = userLocation
        ? calculateDistance(userLocation.lat, userLocation.lng, deal.location.lat, deal.location.lng)
        : null;

      const dealIcon = L.divIcon({
        className: 'custom-deal-marker',
        html: `
          <div class="relative cursor-pointer transform transition-transform duration-200 hover:scale-110" style="width: 50px; height: 60px;">
            <svg width="50" height="60" viewBox="0 0 50 60" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <filter id="shadow-${deal.id}" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
                  <feOffset dx="0" dy="2" result="offsetblur"/>
                  <feComponentTransfer>
                    <feFuncA type="linear" slope="0.3"/>
                  </feComponentTransfer>
                  <feMerge>
                    <feMergeNode/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>

              <g filter="url(#shadow-${deal.id})">
                <path d="M25 2 C12 2 2 12 2 25 C2 35 25 58 25 58 S48 35 48 25 C48 12 38 2 25 2 Z"
                      fill="#ef4444"
                      stroke="white"
                      stroke-width="2"/>

                <circle cx="25" cy="22" r="14" fill="white"/>

                <circle cx="35" cy="12" r="9" fill="#dc2626" stroke="white" stroke-width="2"/>
                <text x="35" y="16" text-anchor="middle" font-family="Arial, sans-serif"
                      font-size="9" font-weight="bold" fill="white">${savings}%</text>

                <path d="M20 18 L20 28 M25 18 L25 28 M30 18 L30 28 M20 18 Q20 15 22 15 L28 15 Q30 15 30 18"
                      stroke="#ef4444"
                      stroke-width="2.5"
                      fill="none"
                      stroke-linecap="round"/>
              </g>
            </svg>
          </div>
        `,
        iconSize: [50, 60],
        iconAnchor: [25, 58],
        popupAnchor: [0, -58],
      });

      const marker = L.marker([deal.location.lat, deal.location.lng], {
        icon: dealIcon,
        zIndexOffset: 100,
      }).addTo(mapRef.current!);

      const timeLeft = formatDistanceToNow(deal.end_time, { addSuffix: true });

      marker.bindPopup(`
        <div class="min-w-[280px] max-w-[300px]">
          <div class="relative h-32 -m-3 mb-3 overflow-hidden rounded-t-xl">
            <img
              src="${deal.image_url}"
              alt="${deal.title}"
              class="w-full h-full object-cover"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            <div class="absolute top-2 right-2 bg-rose-500 text-white px-2 py-1 rounded-lg text-xs font-bold flex items-center space-x-1">
              <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M11.983 1.907a.75.75 0 00-1.292-.657l-8.5 9.5A.75.75 0 002.75 12h6.572l-1.305 6.093a.75.75 0 001.292.657l8.5-9.5A.75.75 0 0017.25 8h-6.572l1.305-6.093z"/>
              </svg>
              <span>${savings}% OFF</span>
            </div>
            ${distance ? `
              <div class="absolute bottom-2 left-2 bg-black/60 text-white px-2 py-1 rounded-lg text-xs font-medium">
                ${distance.toFixed(1)} mi away
              </div>
            ` : ''}
          </div>

          <div class="space-y-2">
            <h3 class="font-bold text-base text-gray-900 leading-tight">${deal.title}</h3>
            <p class="text-sm text-gray-600">${deal.restaurant.name}</p>

            <div class="flex items-center space-x-2 text-xs text-gray-500">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span>Ends ${timeLeft}</span>
            </div>

            <div class="flex items-center justify-between pt-2 border-t border-gray-200">
              <div class="flex items-baseline space-x-1.5">
                <span class="text-xl font-bold text-rose-500">${formatPrice(deal.deal_price)}</span>
                <span class="text-sm text-gray-500 line-through">${formatPrice(deal.original_price)}</span>
              </div>
              <button
                onclick="window.dispatchEvent(new CustomEvent('deal-selected', { detail: '${deal.id}' }))"
                class="bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg"
              >
                View Deal
              </button>
            </div>
          </div>
        </div>
      `, {
        maxWidth: 300,
        className: 'custom-popup'
      });

      marker.on('click', () => {
        setSelectedDealId(deal.id);
      });

      markersRef.current.push(marker);
    });
  }, [deals, userLocation]);

  useEffect(() => {
    const handleDealSelected = (e: Event) => {
      const customEvent = e as CustomEvent;
      const dealId = customEvent.detail;
      const deal = deals.find(d => d.id === dealId);
      if (deal) {
        setSelectedDeal(deal);
      }
    };

    window.addEventListener('deal-selected', handleDealSelected);
    return () => window.removeEventListener('deal-selected', handleDealSelected);
  }, [deals, setSelectedDeal]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="absolute inset-0" />

      <div className="absolute top-4 left-4 right-4 z-[1000] pointer-events-none">
        <div className="glass rounded-2xl p-4 shadow-xl border border-white/20 dark:border-gray-700/20 pointer-events-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-rose-500 to-pink-500 rounded-xl shadow-lg">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 dark:text-gray-100 text-lg">
                  {deals.length} {deals.length === 1 ? 'Deal' : 'Deals'} Near You
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {userLocation ? 'Washington DC Area' : 'Select location to see distances'}
                </p>
              </div>
            </div>
            {userLocation && (
              <div className="hidden sm:flex items-center space-x-2 text-blue-600 dark:text-blue-400">
                <Navigation className="w-4 h-4" />
                <span className="text-sm font-medium">Your Location</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {deals.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center z-[999] pointer-events-none">
          <div className="glass rounded-2xl p-8 text-center max-w-md pointer-events-auto">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-rose-100 to-pink-100 dark:from-rose-900/20 dark:to-pink-900/20 mb-4">
              <MapPin className="w-8 h-8 text-rose-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              No deals found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Try adjusting your filters or location to see available deals
            </p>
          </div>
        </div>
      )}

      {!userLocation && deals.length > 0 && (
        <div className="absolute bottom-4 left-4 right-4 z-[999] pointer-events-none">
          <div className="glass rounded-2xl p-4 shadow-xl border border-yellow-500/20 bg-yellow-50/80 dark:bg-yellow-900/20 pointer-events-auto">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-yellow-500 rounded-lg">
                <Navigation className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  Enable Location
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Allow location access to see distances and get personalized deal recommendations
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
