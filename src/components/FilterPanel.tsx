import React from 'react';
import { X, DollarSign, MapPin, Clock, Utensils } from 'lucide-react';
import { useStore } from '../store/useStore';

interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const cuisineOptions = [
  'Italian', 'Mexican', 'Asian', 'American', 'Mediterranean', 
  'Indian', 'Japanese', 'Thai', 'French', 'Chinese'
];

const dietaryOptions = [
  'Vegetarian', 'Vegan', 'Gluten-Free', 'Halal', 'Kosher'
];

export const FilterPanel: React.FC<FilterPanelProps> = ({ isOpen, onClose }) => {
  const { filters, setFilters } = useStore();

  const handleCuisineToggle = (cuisine: string) => {
    const newCuisines = filters.cuisine.includes(cuisine)
      ? filters.cuisine.filter(c => c !== cuisine)
      : [...filters.cuisine, cuisine];
    setFilters({ cuisine: newCuisines });
  };

  const handleDietaryToggle = (dietary: string) => {
    const newDietary = filters.dietaryNeeds.includes(dietary)
      ? filters.dietaryNeeds.filter(d => d !== dietary)
      : [...filters.dietaryNeeds, dietary];
    setFilters({ dietaryNeeds: newDietary });
  };

  const handleReset = () => {
    setFilters({
      cuisine: [],
      priceRange: [0, 100],
      distance: 50,
      timeLeft: 24,
      dietaryNeeds: []
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-900 p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center z-10">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Filters</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-600 dark:text-gray-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Price Range */}
          <div>
            <div className="flex items-center mb-3">
              <DollarSign className="w-5 h-5 mr-2 text-gray-600" />
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Price Range</h3>
            </div>
            <div className="space-y-2">
              <input
                type="range"
                min="0"
                max="100"
                value={filters.priceRange[1]}
                onChange={(e) => setFilters({ priceRange: [0, parseInt(e.target.value)] })}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-600">
                <span>$0</span>
                <span className="font-semibold">${filters.priceRange[1]}</span>
              </div>
            </div>
          </div>

          {/* Distance */}
          <div>
            <div className="flex items-center mb-3">
              <MapPin className="w-5 h-5 mr-2 text-gray-600" />
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Distance</h3>
            </div>
            <div className="space-y-2">
              <input
                type="range"
                min="1"
                max="100"
                value={filters.distance}
                onChange={(e) => setFilters({ distance: parseInt(e.target.value) })}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-600">
                <span>1 mi</span>
                <span className="font-semibold">{filters.distance} mi</span>
                <span>100 mi</span>
              </div>
            </div>
          </div>

          {/* Time Left */}
          <div>
            <div className="flex items-center mb-3">
              <Clock className="w-5 h-5 mr-2 text-gray-600" />
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Time Left</h3>
            </div>
            <div className="space-y-2">
              <input
                type="range"
                min="1"
                max="24"
                value={filters.timeLeft}
                onChange={(e) => setFilters({ timeLeft: parseInt(e.target.value) })}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-600">
                <span>1 hr</span>
                <span className="font-semibold">{filters.timeLeft} hrs</span>
              </div>
            </div>
          </div>

          {/* Cuisine */}
          <div>
            <div className="flex items-center mb-3">
              <Utensils className="w-5 h-5 mr-2 text-gray-600" />
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Cuisine</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {cuisineOptions.map((cuisine) => (
                <button
                  key={cuisine}
                  onClick={() => handleCuisineToggle(cuisine)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    filters.cuisine.includes(cuisine)
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cuisine}
                </button>
              ))}
            </div>
          </div>

          {/* Dietary Needs */}
          <div>
            <h3 className="font-semibold mb-3">Dietary Needs</h3>
            <div className="flex flex-wrap gap-2">
              {dietaryOptions.map((dietary) => (
                <button
                  key={dietary}
                  onClick={() => handleDietaryToggle(dietary)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    filters.dietaryNeeds.includes(dietary)
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {dietary}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white dark:bg-gray-900 p-4 border-t border-gray-200 dark:border-gray-700 flex space-x-3 z-10">
          <button
            onClick={handleReset}
            className="flex-1 py-2 border border-gray-300 dark:border-gray-600 rounded-lg font-semibold text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Reset
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2 bg-rose-500 text-white rounded-lg font-semibold hover:bg-rose-600 transition-colors shadow-lg"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};
