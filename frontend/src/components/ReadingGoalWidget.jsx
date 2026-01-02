import React, { useState, useEffect } from 'react';
import { Target, TrendingUp, Calendar, Sparkles, X } from 'lucide-react';
import { goalsAPI } from '../services/api';

function ReadingGoalWidget() {
  const [goal, setGoal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSetGoal, setShowSetGoal] = useState(false);
  const [newGoal, setNewGoal] = useState(50);
  const [newYear, setNewYear] = useState(new Date().getFullYear());

  useEffect(() => {
    loadGoal();
    window.refreshReadingGoal = loadGoal;
    const interval = setInterval(loadGoal, 30000);
    
    return () => {
      clearInterval(interval);
      delete window.refreshReadingGoal;
    };
  }, []);

  const loadGoal = async () => {
    try {
      const res = await goalsAPI.getReadingGoal();
      setGoal(res.data);
    } catch (error) {
      console.error('Failed to load goal:', error);
    }
    setLoading(false);
  };

  const handleSetGoal = async (e) => {
    e.preventDefault();
    try {
      await goalsAPI.setReadingGoal(newGoal, newYear);
      await loadGoal();
      setShowSetGoal(false);
    } catch (error) {
      console.error('Failed to set goal:', error);
    }
  };

  if (loading) {
    return (
      <div className="card p-6">
        <div className="skeleton h-4 w-1/3 mb-4"></div>
        <div className="skeleton h-8 w-full mb-3"></div>
        <div className="skeleton h-3 w-full"></div>
      </div>
    );
  }

  // Show goal setup form
  if (showSetGoal || !goal || !goal.goal) {
    return (
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-serif font-bold text-ink-900 dark:text-cream-100 flex items-center gap-2">
            <Target className="h-5 w-5 text-primary-600" />
            Set Reading Goal
          </h3>
          {goal && goal.goal && (
            <button
              onClick={() => setShowSetGoal(false)}
              className="btn-icon"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        
        <form onSubmit={handleSetGoal} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink-700 dark:text-cream-300 mb-2">
              How many books do you want to read?
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                value={newGoal}
                onChange={(e) => setNewGoal(parseInt(e.target.value))}
                min="1"
                max="200"
                className="flex-1 h-2 bg-cream-300 dark:bg-ink-700 rounded-full appearance-none cursor-pointer
                         [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 
                         [&::-webkit-slider-thumb]:bg-primary-600 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer
                         [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:hover:bg-primary-700"
              />
              <input
                type="number"
                value={newGoal}
                onChange={(e) => setNewGoal(parseInt(e.target.value) || 1)}
                className="w-20 input-field text-center font-bold"
                min="1"
                max="1000"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-ink-700 dark:text-cream-300 mb-2">
              For which year?
            </label>
            <div className="flex gap-2">
              {[new Date().getFullYear(), new Date().getFullYear() + 1].map(year => (
                <button
                  key={year}
                  type="button"
                  onClick={() => setNewYear(year)}
                  className={`flex-1 py-2.5 rounded-xl font-medium transition-all ${
                    newYear === year
                      ? 'bg-primary-600 text-white'
                      : 'bg-cream-200 dark:bg-ink-700 text-ink-700 dark:text-cream-300 hover:bg-cream-300 dark:hover:bg-ink-600'
                  }`}
                >
                  {year}
                </button>
              ))}
            </div>
          </div>

          <button type="submit" className="w-full btn-primary py-3">
            Set Goal
          </button>
        </form>
      </div>
    );
  }

  const percentage = Math.min(Math.round((goal.progress / goal.goal) * 100), 100);
  const remaining = Math.max(goal.goal - goal.progress, 0);
  const isComplete = goal.progress >= goal.goal;

  return (
    <div className={`card p-6 relative overflow-hidden ${
      isComplete 
        ? 'bg-gradient-to-br from-sage-50 to-sage-100 dark:from-sage-950/50 dark:to-sage-900/30 border border-sage-200 dark:border-sage-800' 
        : 'bg-gradient-to-br from-primary-50 to-cream-100 dark:from-primary-950/50 dark:to-ink-800 border border-primary-100 dark:border-primary-900'
    }`}>
      {/* Decorative element */}
      <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-gradient-to-br from-primary-200/30 to-transparent dark:from-primary-800/20"></div>
      
      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-serif font-bold text-ink-900 dark:text-cream-100 flex items-center gap-2">
            <Target className={`h-5 w-5 ${isComplete ? 'text-sage-600' : 'text-primary-600'}`} />
            {goal.year} Reading Goal
          </h3>
          <button
            onClick={() => setShowSetGoal(true)}
            className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline"
          >
            Edit
          </button>
        </div>

        {/* Complete celebration */}
        {isComplete && (
          <div className="mb-4 p-3 bg-sage-100 dark:bg-sage-900/50 rounded-xl text-center animate-scale-in">
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="h-5 w-5 text-sage-600 dark:text-sage-400" />
              <p className="text-sage-800 dark:text-sage-200 font-bold">Goal Complete!</p>
              <Sparkles className="h-5 w-5 text-sage-600 dark:text-sage-400" />
            </div>
          </div>
        )}

        {/* Progress display */}
        <div className="flex items-end justify-between mb-4">
          <div>
            <span className={`text-5xl font-serif font-bold ${isComplete ? 'text-sage-600' : 'text-primary-600'} dark:text-primary-400`}>
              {goal.progress}
            </span>
            <span className="text-2xl text-ink-400 dark:text-ink-500">/{goal.goal}</span>
            <p className="text-sm text-ink-500 dark:text-ink-400 mt-1">books read</p>
          </div>
          <div className="text-right">
            <div className={`text-3xl font-bold ${isComplete ? 'text-sage-600' : 'text-ink-900'} dark:text-cream-100`}>
              {percentage}%
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="progress-bar mb-4">
          <div 
            className={`progress-bar-fill ${isComplete ? '!bg-gradient-to-r !from-sage-500 !to-sage-400' : ''}`}
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1.5 text-ink-500 dark:text-ink-400">
            <TrendingUp className="h-4 w-4" />
            <span>{remaining} {remaining === 1 ? 'book' : 'books'} to go</span>
          </div>
          <div className="flex items-center gap-1.5 text-ink-500 dark:text-ink-400">
            <Calendar className="h-4 w-4" />
            <span>{goal.year}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReadingGoalWidget;
