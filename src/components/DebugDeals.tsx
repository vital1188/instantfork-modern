import React from 'react';
import { useStore } from '../store/useStore';

export const DebugDeals: React.FC = () => {
  const { deals } = useStore();
  
  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg max-w-md max-h-96 overflow-y-auto z-50">
      <h3 className="font-bold mb-2">Debug: Deals on Map</h3>
      <div className="space-y-2 text-xs">
        {deals.map((deal, index) => (
          <div key={deal.id} className="border-b pb-2">
            <p className="font-semibold">{index + 1}. {deal.title}</p>
            <p>Restaurant: {deal.restaurant.name}</p>
            <p>Location: {deal.location ? `${deal.location.lat}, ${deal.location.lng}` : 'NO LOCATION'}</p>
            <p className={deal.location ? 'text-green-600' : 'text-red-600'}>
              {deal.location ? '✓ Has coordinates' : '✗ Missing coordinates'}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-2 font-semibold">
        Total deals: {deals.length} | 
        With location: {deals.filter(d => d.location && d.location.lat && d.location.lng).length}
      </p>
    </div>
  );
};
