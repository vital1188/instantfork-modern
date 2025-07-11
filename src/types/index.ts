export interface Deal {
  id: string;
  title: string;
  restaurant_id: string;
  restaurant: Restaurant;
  image_url: string;
  original_price: number;
  deal_price: number;
  description: string;
  tags: string[];
  location: {
    lat: number;
    lng: number;
  };
  start_time: Date;
  end_time: Date;
  active: boolean;
  created_at: Date;
}

export interface Restaurant {
  id: string;
  name: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  description: string;
  category: string;
  rating: number;
  website?: string;
  logo?: string;
  phone?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  location?: {
    lat: number;
    lng: number;
  };
  favorites: string[];
  preferences: {
    cuisines: string[];
    maxDistance: number;
    priceRange: [number, number];
    dietaryNeeds: string[];
  };
}

export interface DealSubmission {
  restaurant_name: string;
  deal_title: string;
  description: string;
  original_price: number;
  deal_price: number;
  category: string;
  tags: string[];
  start_time: string;
  end_time: string;
  contact_email: string;
  contact_phone: string;
  address: string;
}
