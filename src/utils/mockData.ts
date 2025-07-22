import { Deal, Restaurant } from '../types';

const restaurants: Restaurant[] = [
  {
    id: '1',
    name: 'The Capital Grille',
    location: { lat: 38.9047, lng: -77.0368, address: '601 Pennsylvania Ave NW, Washington, DC' },
    description: 'Upscale steakhouse in the heart of DC',
    category: 'American',
    rating: 4.5,
    website: 'https://capitalgrille.com',
    phone: '(202) 737-6200'
  },
  {
    id: '2',
    name: 'Bethesda Crab House',
    location: { lat: 38.9807, lng: -77.0947, address: '4958 Bethesda Ave, Bethesda, MD' },
    description: 'Fresh Maryland seafood and crab cakes',
    category: 'Seafood',
    rating: 4.8,
    website: 'https://bethesdacrabhouse.com',
    phone: '(301) 652-3382'
  },
  {
    id: '3',
    name: 'Pupatella',
    location: { lat: 38.8816, lng: -77.0910, address: '5104 Wilson Blvd, Arlington, VA' },
    description: 'Authentic Neapolitan pizza',
    category: 'Italian',
    rating: 4.6,
    website: 'https://pupatella.com',
    phone: '(571) 312-7230'
  },
  {
    id: '4',
    name: 'Taco Bamba',
    location: { lat: 38.8823, lng: -77.1711, address: '164 Maple Ave W, Falls Church, VA' },
    description: 'Creative tacos and Mexican street food',
    category: 'Mexican',
    rating: 4.4,
    phone: '(703) 639-0161'
  },
  {
    id: '5',
    name: 'Sweetgreen',
    location: { lat: 38.9097, lng: -77.0434, address: '1512 Connecticut Ave NW, Washington, DC' },
    description: 'Fresh salads and healthy bowls',
    category: 'Healthy',
    rating: 4.7,
    website: 'https://sweetgreen.com',
    phone: '(202) 387-9338'
  }
];

export const mockDeals: Deal[] = [
  {
    id: '1',
    title: '40% Off Premium Steaks',
    restaurant_id: '1',
    restaurant: restaurants[0],
    image_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800',
    original_price: 85,
    deal_price: 51,
    description: 'Enjoy our finest cuts at 40% off! Includes choice of ribeye, filet mignon, or NY strip with sides.',
    tags: ['dinner', 'steak', 'upscale'],
    location: restaurants[0].location,
    start_time: new Date(),
    end_time: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
    active: true,
    created_at: new Date()
  },
  {
    id: '2',
    title: 'Maryland Crab Cake Special',
    restaurant_id: '2',
    restaurant: restaurants[1],
    image_url: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800',
    original_price: 45,
    deal_price: 28,
    description: 'Two jumbo lump crab cakes with coleslaw and fries. A true Maryland classic!',
    tags: ['seafood', 'maryland', 'dinner'],
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
