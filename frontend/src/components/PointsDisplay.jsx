import React, { useState, useEffect } from 'react';
import { Star, Award } from 'lucide-react';
import { pointsAPI } from '../services/api';

function PointsDisplay() {
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    loadPoints();
    // Refresh points every 30 seconds
    const interval = setInterval(loadPoints, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadPoints = async () => {
    try {
      const res = await pointsAPI.getPoints();
      setPoints(res.data.points);
    } catch (error) {
      console.error('Failed to load points:', error);
    }
    setLoading(false);
  };

  // Expose refresh function globally for other components to call
  useEffect(() => {
    window.refreshPoints = loadPoints;
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-primary-100 dark:bg-primary-900/30 rounded-xl">
        <div className="h-4 w-4 bg-primary-200 dark:bg-primary-800 rounded-full animate-pulse"></div>
        <div className="h-3 w-10 bg-primary-200 dark:bg-primary-800 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div 
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-primary-100 to-primary-50 dark:from-primary-900/40 dark:to-primary-900/20 rounded-xl cursor-pointer hover:shadow-sm transition-all">
        <Star className="h-4 w-4 text-primary-500 fill-primary-500" />
        <span className="font-bold text-ink-900 dark:text-cream-100 text-sm">{points.toLocaleString()}</span>
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute top-full mt-2 right-0 bg-ink-900 dark:bg-ink-800 text-cream-100 text-xs rounded-2xl p-4 shadow-lg z-50 w-56 animate-fade-in">
          <div className="font-bold mb-3 flex items-center gap-2">
            <Award className="h-4 w-4 text-primary-400" />
            <span>How to Earn Points</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-cream-300">Add a book</span>
              <span className="text-primary-400 font-semibold">+5</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-cream-300">Rate a book</span>
              <span className="text-primary-400 font-semibold">+10</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-cream-300">Write a review</span>
              <span className="text-primary-400 font-semibold">+20</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-cream-300">Review liked</span>
              <span className="text-primary-400 font-semibold">+1</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-ink-700 text-center text-primary-300 font-medium">
            Keep reading! 📚
          </div>
        </div>
      )}
    </div>
  );
}

export default PointsDisplay;
