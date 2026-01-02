import React, { useState, useRef, useEffect } from 'react';
import { Filter, ChevronDown, X, Star } from 'lucide-react';

function FilterDropdown({ onFilterChange }) {
  const [showFilters, setShowFilters] = useState(false);
  const menuRef = useRef(null);
  const [activeFilters, setActiveFilters] = useState({
    genre: '',
    yearFrom: '',
    yearTo: '',
    minPages: '',
    maxPages: '',
    minRating: '',
  });

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowFilters(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const genres = [
    'Fiction', 'Non-Fiction', 'Mystery', 'Thriller', 'Romance', 'Science Fiction',
    'Fantasy', 'Biography', 'History', 'Self-Help', 'Business', 'Psychology',
    'Philosophy', 'Poetry', 'Horror', 'Young Adult', 'Children', 'Comedy',
    'Drama', 'Adventure', 'Crime', 'Graphic Novel'
  ];

  const handleApplyFilters = () => {
    onFilterChange(activeFilters);
    setShowFilters(false);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      genre: '',
      yearFrom: '',
      yearTo: '',
      minPages: '',
      maxPages: '',
      minRating: '',
    };
    setActiveFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  const hasActiveFilters = Object.values(activeFilters).some(v => v !== '');
  const filterCount = Object.values(activeFilters).filter(v => v !== '').length;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setShowFilters(!showFilters)}
        className={`btn-secondary flex items-center gap-2 ${hasActiveFilters ? 'ring-2 ring-primary-500' : ''}`}
      >
        <Filter className="h-4 w-4" />
        <span className="hidden sm:inline">Filters</span>
        {filterCount > 0 && (
          <span className="px-1.5 py-0.5 bg-primary-600 text-white text-xs rounded-full">
            {filterCount}
          </span>
        )}
        <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
      </button>

      {showFilters && (
        <div className="absolute top-full mt-2 right-0 w-80 sm:w-96 bg-white dark:bg-ink-900 rounded-2xl shadow-card-hover border border-cream-200 dark:border-ink-700 z-50 overflow-hidden animate-slide-down">
          <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-serif font-bold text-ink-900 dark:text-cream-100">
                Filter Books
              </h3>
              {hasActiveFilters && (
                <button
                  onClick={handleClearFilters}
                  className="text-sm text-wine-600 dark:text-wine-400 hover:text-wine-700 flex items-center gap-1 font-medium"
                >
                  <X className="h-4 w-4" />
                  <span>Clear</span>
                </button>
              )}
            </div>

            {/* Genre Filter */}
            <div>
              <label className="block text-sm font-medium text-ink-700 dark:text-cream-300 mb-2">
                Genre
              </label>
              <select
                value={activeFilters.genre}
                onChange={(e) => setActiveFilters({...activeFilters, genre: e.target.value})}
                className="input-field"
              >
                <option value="">All Genres</option>
                {genres.map(genre => (
                  <option key={genre} value={genre}>{genre}</option>
                ))}
              </select>
            </div>

            {/* Publication Year Range */}
            <div>
              <label className="block text-sm font-medium text-ink-700 dark:text-cream-300 mb-2">
                Publication Year
              </label>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  placeholder="From"
                  value={activeFilters.yearFrom}
                  onChange={(e) => setActiveFilters({...activeFilters, yearFrom: e.target.value})}
                  className="input-field"
                  min="1000"
                  max={new Date().getFullYear()}
                />
                <input
                  type="number"
                  placeholder="To"
                  value={activeFilters.yearTo}
                  onChange={(e) => setActiveFilters({...activeFilters, yearTo: e.target.value})}
                  className="input-field"
                  min="1000"
                  max={new Date().getFullYear()}
                />
              </div>
            </div>

            {/* Page Count Range */}
            <div>
              <label className="block text-sm font-medium text-ink-700 dark:text-cream-300 mb-2">
                Page Count
              </label>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  placeholder="Min"
                  value={activeFilters.minPages}
                  onChange={(e) => setActiveFilters({...activeFilters, minPages: e.target.value})}
                  className="input-field"
                  min="0"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={activeFilters.maxPages}
                  onChange={(e) => setActiveFilters({...activeFilters, maxPages: e.target.value})}
                  className="input-field"
                  min="0"
                />
              </div>
            </div>

            {/* Minimum Rating */}
            <div>
              <label className="block text-sm font-medium text-ink-700 dark:text-cream-300 mb-2">
                Minimum Rating
              </label>
              <div className="flex gap-2">
                {[{ val: '', label: 'Any' }, { val: '3', label: '3+' }, { val: '3.5', label: '3.5+' }, { val: '4', label: '4+' }, { val: '4.5', label: '4.5+' }].map(option => (
                  <button
                    key={option.val}
                    onClick={() => setActiveFilters({...activeFilters, minRating: option.val})}
                    className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                      activeFilters.minRating === option.val
                        ? 'bg-primary-600 text-white'
                        : 'bg-cream-200 dark:bg-ink-700 text-ink-600 dark:text-cream-300 hover:bg-cream-300 dark:hover:bg-ink-600'
                    }`}
                  >
                    {option.val && <Star className="h-3 w-3" />}
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 bg-cream-50 dark:bg-ink-800 border-t border-cream-200 dark:border-ink-700">
            <button
              onClick={handleApplyFilters}
              className="w-full btn-primary"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default FilterDropdown;
