import { differenceInHours, differenceInMinutes } from 'date-fns';

export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Radius of the Earth in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export function formatTimeRemaining(endTime: Date): string {
  const now = new Date();
  const hoursLeft = differenceInHours(endTime, now);
  const minutesLeft = differenceInMinutes(endTime, now) % 60;
  
  if (hoursLeft > 24) {
    return `${Math.floor(hoursLeft / 24)}d left`;
  } else if (hoursLeft > 0) {
    return `${hoursLeft}h ${minutesLeft}m left`;
  } else if (minutesLeft > 0) {
    return `${minutesLeft}m left`;
  } else {
    return 'Expired';
  }
}

// Add the missing getTimeRemaining function (alias for formatTimeRemaining)
export function getTimeRemaining(endTime: Date): string {
  return formatTimeRemaining(endTime);
}

export function calculateSavings(original: number, deal: number): number {
  return Math.round(((original - deal) / original) * 100);
}

export function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}

export function getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  if (hour < 21) return 'evening';
  return 'night';
}

export function suggestBestDeal(deals: any[], userLocation: { lat: number; lng: number } | null): any | null {
  if (!deals.length || !userLocation) return null;
  
  const timeOfDay = getTimeOfDay();
  const mealPreferences = {
    morning: ['breakfast', 'coffee', 'brunch'],
    afternoon: ['lunch', 'quick-bite'],
    evening: ['dinner', 'happy-hour'],
    night: ['dinner', 'late-night']
  };
  
  const scoredDeals = deals.map(deal => {
    let score = 0;
    
    // Distance score (closer is better)
    const distance = calculateDistance(userLocation.lat, userLocation.lng, deal.location.lat, deal.location.lng);
    score += (10 - Math.min(distance, 10)) * 10;
    
    // Savings score
    const savings = calculateSavings(deal.original_price, deal.deal_price);
    score += savings;
    
    // Time relevance score
    const relevantTags = mealPreferences[timeOfDay];
    const hasRelevantTag = deal.tags.some((tag: string) => relevantTags.some(pref => tag.includes(pref)));
    if (hasRelevantTag) score += 20;
    
    // Time remaining score (urgent deals get priority)
    const hoursLeft = differenceInHours(deal.end_time, new Date());
    if (hoursLeft < 2) score += 15;
    else if (hoursLeft < 4) score += 10;
    
    return { ...deal, score };
  });
  
  return scoredDeals.sort((a, b) => b.score - a.score)[0];
}
