import React, { useState, useEffect, useRef } from 'react';
import { Plus, Check, Star, BookOpen, Heart, Package, Clock, ChevronDown } from 'lucide-react';
import { userBooksAPI } from '../services/api';

function BookActions({ book, onSuccess }) {
  const [inLibrary, setInLibrary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    checkIfInLibrary();
  }, [book.id]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowStatusMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const checkIfInLibrary = async () => {
    try {
      const response = await userBooksAPI.getMyBooks();
      const bookInLib = response.data.find(ub => ub.book.id === book.id);
      setInLibrary(bookInLib || null);
    } catch (error) {
      console.error('Failed to check library:', error);
    }
    setLoading(false);
  };

  const handleAddToLibrary = async (status) => {
    setActionLoading(true);
    setShowStatusMenu(false);
    
    try {
      await userBooksAPI.addBookToLibrary({
        book_id: book.id,
        status: status,
      });
      
      if (window.refreshPoints) window.refreshPoints();
      if (window.refreshReadingGoal) window.refreshReadingGoal();
      
      await checkIfInLibrary();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Failed to add book:', error);
    }
    
    setActionLoading(false);
  };

  const handleUpdateStatus = async (newStatus) => {
    setActionLoading(true);
    setShowStatusMenu(false);
    
    try {
      await userBooksAPI.updateBook(book.id, {
        status: newStatus,
      });
      
      if (window.refreshPoints) window.refreshPoints();
      if (window.refreshReadingGoal) window.refreshReadingGoal();
      
      await checkIfInLibrary();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Failed to update book:', error);
    }
    
    setActionLoading(false);
  };

  const statusOptions = [
    { value: 'want_to_read', label: 'Want to Read', icon: Heart, color: 'text-wine-600 dark:text-wine-400' },
    { value: 'currently_reading', label: 'Currently Reading', icon: Clock, color: 'text-ocean-600 dark:text-ocean-400' },
    { value: 'read', label: 'Completed', icon: Check, color: 'text-sage-600 dark:text-sage-400' },
    { value: 'owned', label: 'Owned', icon: Package, color: 'text-primary-600 dark:text-primary-400' },
  ];

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Not in library - show add button
  if (!inLibrary) {
    return (
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setShowStatusMenu(!showStatusMenu)}
          disabled={actionLoading}
          className="w-full btn-primary flex items-center justify-center gap-2 py-3 disabled:opacity-50"
        >
          {actionLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Adding...</span>
            </>
          ) : (
            <>
              <Plus className="h-5 w-5" />
              <span>Add to Library</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${showStatusMenu ? 'rotate-180' : ''}`} />
            </>
          )}
        </button>

        {showStatusMenu && (
          <div className="dropdown left-0 right-0 animate-slide-down">
            <div className="p-2">
              {statusOptions.map(option => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    onClick={() => handleAddToLibrary(option.value)}
                    className="dropdown-item w-full"
                  >
                    <Icon className={`h-5 w-5 ${option.color}`} />
                    <span className="font-medium text-ink-900 dark:text-cream-100">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Already in library - show status and change option
  const currentStatus = statusOptions.find(opt => opt.value === inLibrary.status);
  const CurrentIcon = currentStatus?.icon || Check;

  return (
    <div className="space-y-3">
      {/* In Library Badge */}
      <div className="flex items-center gap-2 p-3 bg-sage-50 dark:bg-sage-900/30 rounded-xl border border-sage-200 dark:border-sage-800">
        <Check className="h-5 w-5 text-sage-600 dark:text-sage-400" />
        <span className="font-medium text-sage-800 dark:text-sage-200">In Your Library</span>
      </div>

      {/* Change Status Button */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setShowStatusMenu(!showStatusMenu)}
          disabled={actionLoading}
          className="w-full btn-secondary flex items-center justify-center gap-2 py-2.5"
        >
          <CurrentIcon className={`h-5 w-5 ${currentStatus?.color}`} />
          <span>{currentStatus?.label || 'Change Status'}</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${showStatusMenu ? 'rotate-180' : ''}`} />
        </button>

        {showStatusMenu && (
          <div className="dropdown left-0 right-0 animate-slide-down">
            <div className="p-2">
              {statusOptions.map(option => {
                const Icon = option.icon;
                const isSelected = option.value === inLibrary.status;
                return (
                  <button
                    key={option.value}
                    onClick={() => handleUpdateStatus(option.value)}
                    className={`dropdown-item w-full ${isSelected ? 'bg-cream-100 dark:bg-ink-700' : ''}`}
                  >
                    <Icon className={`h-5 w-5 ${option.color}`} />
                    <span className="font-medium text-ink-900 dark:text-cream-100 flex-1 text-left">{option.label}</span>
                    {isSelected && (
                      <Check className="h-4 w-4 text-sage-600 dark:text-sage-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Show rating if rated */}
      {inLibrary.rating && (
        <div className="flex items-center gap-2 text-sm text-ink-600 dark:text-ink-400">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${i < inLibrary.rating ? 'star-filled' : 'star-empty'}`}
              />
            ))}
          </div>
          <span>Your rating: {inLibrary.rating}/5</span>
        </div>
      )}
    </div>
  );
}

export default BookActions;
