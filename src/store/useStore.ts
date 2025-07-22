import { create } from 'zustand';
import { Deal, User } from '../types';

interface AppState {
  user: User | null;
  deals: Deal[];
  selectedDeal: Deal | null;
  filters: {
    cuisine: string[];
    priceRange: [number, number];
    distance: number;
    timeLeft: number;
    dietaryNeeds: string[];
  };
  viewMode: 'map' | 'list';
  userLocation: { lat: number; lng: number } | null;
  searchQuery: string;
  setUser: (user: User | null) => void;
  setDeals: (deals: Deal[]) => void;
  setSelectedDeal: (deal: Deal | null) => void;
  setFilters: (filters: Partial<AppState['filters']>) => void;
  setViewMode: (mode: 'map' | 'list') => void;
  setUserLocation: (location: { lat: number; lng: number } | null) => void;
  setSearchQuery: (query: string) => void;
  toggleFavorite: (dealId: string) => void;
}

export const useStore = create<AppState>((set) => ({
  user: null,
  deals: [],
  selectedDeal: null,
  filters: {
    cuisine: [],
    priceRange: [0, 100],
    distance: 50, // Increased from 5 to 50 miles to show deals from nearby cities
    timeLeft: 24,
    dietaryNeeds: [],
  },
  viewMode: 'list',
  userLocation: null,
  searchQuery: '',
  setUser: (user) => set({ user }),
  setDeals: (deals) => set({ deals }),
  setSelectedDeal: (deal) => set({ selectedDeal: deal }),
  setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
  setViewMode: (viewMode) => set({ viewMode }),
  setUserLocation: (userLocation) => set({ userLocation }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  toggleFavorite: (dealId) => set((state) => {
    if (!state.user) return state;
    const favorites = state.user.favorites.includes(dealId)
      ? state.user.favorites.filter(id => id !== dealId)
      : [...state.user.favorites, dealId];
    return { user: { ...state.user, favorites } };
  }),
}));
