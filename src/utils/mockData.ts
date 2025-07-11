import { Deal, Restaurant } from '../types';

const restaurants: Restaurant[] = [
  {
    id: '1',
    name: 'The Rustic Table',
    location: { lat: 40.7128, lng: -74.0060, address: '123 Main St, New York, NY' },
    description: 'Farm-to-table dining experience',
    category: 'American',
    rating: 4.5,
    website: 'https://rustictable.com',
    phone: '(555) 123-4567'
  },
  {
    id: '2',
    name: 'Sakura Sushi',
    location: { lat: 40.7180, lng: -74.0020, address: '456 Broadway, New York, NY' },
    description: 'Authentic Japanese cuisine',
    category: 'Japanese',
    rating: 4.8,
    website: 'https://sakurasushi.com',
    phone: '(555) 234-5678'
  },
  {
    id: '3',
    name: 'Bella Italia',
    location: { lat: 40.7080, lng: -74.0100, address: '789 Park Ave, New York, NY' },
    description: 'Traditional Italian recipes',
    category: 'Italian',
    rating: 4.6,
    website: 'https://bellaitalia.com',
    phone: '(555) 345-6789'
  },
  {
    id: '4',
    name: 'Taco Fiesta',
    location: { lat: 40.7200, lng: -74.0000, address: '321 5th Ave, New York, NY' },
    description: 'Authentic Mexican street food',
    category: 'Mexican',
    rating: 4.4,
    phone: '(555) 456-7890'
  },
  {
    id: '5',
    name: 'Green Garden Cafe',
    location: { lat: 40.7150, lng: -74.0080, address: '654 Green St, New York, NY' },
    description: 'Vegan and vegetarian delights',
    category: 'Vegetarian',
    rating: 4.7,
    website: 'https://greengarden.com',
    phone: '(555) 567-8901'
  }
];

export const mockDeals: Deal[] = [
  {
    id: '1',
    title: '50% Off Farm Fresh Dinner',
    restaurant_id: '1',
    restaurant: restaurants[0],
    image_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800',
    original_price: 45,
    deal_price: 22.50,
    description: 'Enjoy our signature farm-to-table dinner menu at half price! Includes appetizer, main course, and dessert.',
    tags: ['dinner', 'farm-to-table', 'limited-time'],
    location: restaurants[0].location,
    start_time: new Date(),
    end_time: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
    active: true,
    created_at: new Date()
  },
  {
    id: '2',
    title: 'All-You-Can-Eat Sushi Special',
    restaurant_id: '2',
    restaurant: restaurants[1],
    image_url: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800',
    original_price: 60,
    deal_price: 35,
    description: 'Unlimited sushi rolls, sashimi, and appetizers for 90 minutes. Drinks not included.',
    tags: ['sushi', 'all-you-can-eat', 'dinner'],
    location: restaurants[1].location,
    start_time: new Date(),
    end_time: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours from now
    active: true,
    created_at: new Date()
  },
  {
    id: '3',
    title: 'Lunch Special: Pizza + Drink',
    restaurant_id: '3',
    restaurant: restaurants[2],
    image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800',
    original_price: 25,
    deal_price: 15,
    description: 'Any personal pizza with a soft drink. Perfect for a quick lunch break!',
    tags: ['lunch', 'pizza', 'quick-bite'],
    location: restaurants[2].location,
    start_time: new Date(),
    end_time: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
    active: true,
    created_at: new Date()
  },
  {
    id: '4',
    title: 'Taco Tuesday: 3 for $10',
    restaurant_id: '4',
    restaurant: restaurants[3],
    image_url: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800',
    original_price: 18,
    deal_price: 10,
    description: 'Choose any 3 tacos from our menu. Includes chips and salsa!',
    tags: ['tacos', 'tuesday-special', 'mexican'],
    location: restaurants[3].location,
    start_time: new Date(),
    end_time: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 hours from now
    active: true,
    created_at: new Date()
  },
  {
    id: '5',
    title: 'Healthy Bowl Happy Hour',
    restaurant_id: '5',
    restaurant: restaurants[4],
    image_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800',
    original_price: 22,
    deal_price: 12,
    description: 'Any signature bowl with fresh juice. Vegan and gluten-free options available.',
    tags: ['healthy', 'vegan', 'happy-hour'],
    location: restaurants[4].location,
    start_time: new Date(),
    end_time: new Date(Date.now() + 3 * 60 * 60 * 1000), // 3 hours from now
    active: true,
    created_at: new Date()
  }
];
