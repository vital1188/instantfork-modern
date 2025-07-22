// DMV Area (DC, Maryland, Northern Virginia) locations configuration

export interface Location {
  name: string;
  state: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  radius: number; // in miles
}

export const DMV_LOCATIONS: Location[] = [
  // Washington DC
  {
    name: "Washington",
    state: "DC",
    coordinates: { lat: 38.9072, lng: -77.0369 },
    radius: 10
  },
  {
    name: "Georgetown",
    state: "DC",
    coordinates: { lat: 38.9097, lng: -77.0654 },
    radius: 3
  },
  {
    name: "Capitol Hill",
    state: "DC",
    coordinates: { lat: 38.8899, lng: -76.9926 },
    radius: 3
  },
  {
    name: "Dupont Circle",
    state: "DC",
    coordinates: { lat: 38.9097, lng: -77.0434 },
    radius: 2
  },
  
  // Maryland
  {
    name: "Bethesda",
    state: "MD",
    coordinates: { lat: 38.9807, lng: -77.0947 },
    radius: 5
  },
  {
    name: "Silver Spring",
    state: "MD",
    coordinates: { lat: 38.9907, lng: -77.0261 },
    radius: 5
  },
  {
    name: "Rockville",
    state: "MD",
    coordinates: { lat: 39.0840, lng: -77.1528 },
    radius: 5
  },
  {
    name: "College Park",
    state: "MD",
    coordinates: { lat: 38.9807, lng: -76.9369 },
    radius: 4
  },
  {
    name: "Greenbelt",
    state: "MD",
    coordinates: { lat: 39.0046, lng: -76.8755 },
    radius: 4
  },
  {
    name: "Gaithersburg",
    state: "MD",
    coordinates: { lat: 39.1434, lng: -77.2014 },
    radius: 5
  },
  {
    name: "Annapolis",
    state: "MD",
    coordinates: { lat: 38.9784, lng: -76.4922 },
    radius: 5
  },
  {
    name: "Baltimore",
    state: "MD",
    coordinates: { lat: 39.2904, lng: -76.6122 },
    radius: 10
  },
  
  // Northern Virginia
  {
    name: "Arlington",
    state: "VA",
    coordinates: { lat: 38.8816, lng: -77.0910 },
    radius: 5
  },
  {
    name: "Alexandria",
    state: "VA",
    coordinates: { lat: 38.8048, lng: -77.0469 },
    radius: 5
  },
  {
    name: "Fairfax",
    state: "VA",
    coordinates: { lat: 38.8462, lng: -77.3064 },
    radius: 5
  },
  {
    name: "Falls Church",
    state: "VA",
    coordinates: { lat: 38.8823, lng: -77.1711 },
    radius: 3
  },
  {
    name: "McLean",
    state: "VA",
    coordinates: { lat: 38.9339, lng: -77.1773 },
    radius: 4
  },
  {
    name: "Tysons",
    state: "VA",
    coordinates: { lat: 38.9187, lng: -77.2311 },
    radius: 3
  },
  {
    name: "Reston",
    state: "VA",
    coordinates: { lat: 38.9586, lng: -77.3570 },
    radius: 4
  },
  {
    name: "Herndon",
    state: "VA",
    coordinates: { lat: 38.9695, lng: -77.3861 },
    radius: 3
  },
  {
    name: "Manassas",
    state: "VA",
    coordinates: { lat: 38.7509, lng: -77.4753 },
    radius: 5
  }
];

// Get all DMV area names for autocomplete
export const DMV_LOCATION_NAMES = DMV_LOCATIONS.map(loc => `${loc.name}, ${loc.state}`);

// Find location by name
export const findDMVLocation = (searchTerm: string): Location | null => {
  const normalizedSearch = searchTerm.toLowerCase().trim();
  
  return DMV_LOCATIONS.find(loc => {
    const fullName = `${loc.name}, ${loc.state}`.toLowerCase();
    const cityName = loc.name.toLowerCase();
    
    return fullName.includes(normalizedSearch) || 
           cityName.includes(normalizedSearch) ||
           normalizedSearch.includes(cityName);
  }) || null;
};

// Check if coordinates are within DMV area
export const isWithinDMV = (lat: number, lng: number): boolean => {
  // Rough boundaries of DMV area
  const bounds = {
    north: 39.5,
    south: 38.5,
    east: -76.3,
    west: -77.7
  };
  
  return lat >= bounds.south && lat <= bounds.north && 
         lng >= bounds.west && lng <= bounds.east;
};

// Get nearest DMV location to coordinates
export const getNearestDMVLocation = (lat: number, lng: number): Location => {
  let nearest = DMV_LOCATIONS[0];
  let minDistance = Infinity;
  
  DMV_LOCATIONS.forEach(location => {
    const distance = Math.sqrt(
      Math.pow(lat - location.coordinates.lat, 2) + 
      Math.pow(lng - location.coordinates.lng, 2)
    );
    
    if (distance < minDistance) {
      minDistance = distance;
      nearest = location;
    }
  });
  
  return nearest;
};
