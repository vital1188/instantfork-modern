import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, Flame, Clock } from 'lucide-react';
import { Deal } from '../types';
import { formatPrice, getTimeRemaining } from '../utils/helpers';

interface FeaturedDealsProps {
  deals: Deal[];
  onDealClick: (deal: Deal) => void;
}

export const FeaturedDeals: React.FC<FeaturedDealsProps> = ({ deals, onDealClick }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 320;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Get top deals (highest discount percentage)
  const featuredDeals = deals
    .sort((a, b) => {
      const aDiscount = ((a.original_price - a.deal_price) / a.original_price) * 100;
      const bDiscount = ((b.original_price - b.deal_price) / b.original_price) * 100;
      return bDiscount - aDiscount;
    })
    .slice(0, 6);

  if (featuredDeals.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Flame className="w-6 h-6 text-orange-500" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Hot Deals</h2>
          <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-full text-sm font-medium">
            Limited Time
          </span>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => scroll('left')}
            className="p-2 glass rounded-xl hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-200"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-2 glass rounded-xl hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-200"
          >
            <ChevronRight className="w-5 h-5" />
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
            const discount = Math.round(((deal.original_price - deal.deal_price) / deal.original_price) * 100);
            
            return (
              <div
                key={deal.id}
                onClick={() => onDealClick(deal)}
                className="flex-none w-80 snap-start cursor-pointer"
              >
                <div className="relative h-full bg-gradient-to-br from-rose-500 via-pink-500 to-purple-600 rounded-2xl shadow-xl overflow-hidden group hover:scale-105 transition-transform duration-300">
                  {/* Background Pattern */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0" style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    }} />
                  </div>

                  <div className="relative p-6 text-white">
                    {/* Discount Badge */}
                    <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                      <span className="text-2xl font-bold">{discount}%</span>
                      <span className="text-sm ml-1">OFF</span>
                    </div>

                    {/* Content */}
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-2xl font-bold mb-1">{deal.title}</h3>
                        <p className="text-white/80">{deal.restaurant.name}</p>
                      </div>

                      <div className="flex items-baseline space-x-3">
                        <span className="text-4xl font-bold">{formatPrice(deal.deal_price)}</span>
                        <span className="text-xl line-through text-white/60">{formatPrice(deal.original_price)}</span>
                      </div>

                      <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{getTimeRemaining(deal.end_time)}</span>
                        </div>
                        <div className="h-4 w-px bg-white/30"></div>
                        <span>{deal.tags[0]}</span>
                      </div>

                      <div className="pt-2">
                        <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl group-hover:bg-white/30 transition-colors">
                          <span className="font-medium">Get Deal</span>
                          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
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
