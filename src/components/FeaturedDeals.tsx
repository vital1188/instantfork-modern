import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, Flame, Clock, Star } from 'lucide-react';
import { Deal } from '../types';
import { formatPrice, getTimeRemaining, calculateSavings } from '../utils/helpers';

interface FeaturedDealsProps {
  deals: Deal[];
  onDealClick: (deal: Deal) => void;
}

export const FeaturedDeals: React.FC<FeaturedDealsProps> = ({ deals, onDealClick }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Get top deals (highest discount percentage)
  const featuredDeals = deals
    .sort((a, b) => {
      const aDiscount = calculateSavings(a.original_price, a.deal_price);
      const bDiscount = calculateSavings(b.original_price, b.deal_price);
      return bDiscount - aDiscount;
    })
    .slice(0, 6);

  if (featuredDeals.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
            <Flame className="w-6 h-6 text-orange-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Hot Deals</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Limited time offers</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => scroll('left')}
            className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      <div className="relative">
        <div
          ref={scrollRef}
          className="flex space-x-4 overflow-x-auto scrollbar-thin pb-4 snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {featuredDeals.map((deal) => {
            const discount = calculateSavings(deal.original_price, deal.deal_price);
            const rating = (4.2 + (parseInt(deal.id.slice(-1)) || 0) * 0.1).toFixed(1);
            
            return (
              <div
                key={deal.id}
                onClick={() => onDealClick(deal)}
                className="flex-none w-72 snap-start cursor-pointer"
              >
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm hover:shadow-lg border border-gray-200 dark:border-gray-800 overflow-hidden transition-all duration-300 group">
                  {/* Image */}
                  <div className="relative h-40 overflow-hidden">
                    <img 
                      src={deal.image_url} 
                      alt={deal.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                    
                    {/* Discount Badge */}
                    <div className="absolute top-3 right-3 bg-rose-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                      {discount}% OFF
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 pr-2">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 line-clamp-1">
                          {deal.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">{deal.restaurant.name}</p>
                      </div>
                      <div className="flex items-center space-x-1 flex-shrink-0">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{rating}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-baseline space-x-2">
                        <span className="text-2xl font-bold text-rose-500">{formatPrice(deal.deal_price)}</span>
                        <span className="text-sm line-through text-gray-500">{formatPrice(deal.original_price)}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                        <Clock className="w-3 h-3" />
                        <span>{getTimeRemaining(deal.end_time)}</span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDealClick(deal);
                      }}
                      className="w-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 py-2.5 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      View Deal
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};