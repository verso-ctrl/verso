import React, { useState } from 'react';
import { BookOpen, Edit2, Check, X, Sparkles } from 'lucide-react';
import { goalsAPI, userBooksAPI } from '../services/api';
import { useToast } from './Toast';

function ReadingProgress({ book, currentPage, onUpdate, onStatusChange }) {
  const toast = useToast();
  const [page, setPage] = useState(currentPage || 0);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleUpdate = async () => {
    setSaving(true);
    try {
      await goalsAPI.updateProgress(book.id, page);
      if (onUpdate) onUpdate(page);
      
      // Check if book is complete (read all pages)
      if (page >= book.page_count) {
        // Auto-mark as finished
        try {
          await userBooksAPI.updateBook(book.id, { status: 'read' });
          toast.success('Congratulations! Book marked as finished! 🎉');
          
          // Refresh all relevant data
          if (window.refreshPoints) window.refreshPoints();
          if (window.refreshReadingGoal) window.refreshReadingGoal();
          if (window.refreshStats) window.refreshStats();
          
          // Notify parent component if callback provided
          if (onStatusChange) onStatusChange('read');
        } catch (err) {
          console.error('Failed to auto-mark as finished:', err);
        }
      }
      
      setEditing(false);
    } catch (error) {
      console.error('Failed to update progress:', error);
      toast.error('Failed to update progress');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setPage(currentPage || 0);
    setEditing(false);
  };

  const handleMarkComplete = async () => {
    setPage(book.page_count);
    setSaving(true);
    try {
      await goalsAPI.updateProgress(book.id, book.page_count);
      await userBooksAPI.updateBook(book.id, { status: 'read' });
      
      toast.success('Book marked as finished! 🎉');
      
      if (window.refreshPoints) window.refreshPoints();
      if (window.refreshReadingGoal) window.refreshReadingGoal();
      if (window.refreshStats) window.refreshStats();
      
      if (onUpdate) onUpdate(book.page_count);
      if (onStatusChange) onStatusChange('read');
    } catch (error) {
      console.error('Failed to mark complete:', error);
      toast.error('Failed to mark as complete');
    } finally {
      setSaving(false);
    }
  };

  if (!book.page_count) {
    return (
      <div className="text-xs text-ink-400 italic">
        Page count not available
      </div>
    );
  }

  const percentage = Math.min(Math.round((page / book.page_count) * 100), 100);
  const isComplete = percentage === 100;

  return (
    <div className={`p-3 rounded-xl ${isComplete ? 'bg-sage-50 dark:bg-sage-900/30' : 'bg-ocean-50 dark:bg-ocean-900/30'}`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs font-semibold flex items-center gap-1 ${isComplete ? 'text-sage-700 dark:text-sage-300' : 'text-ocean-700 dark:text-ocean-300'}`}>
          <BookOpen className="h-3 w-3" />
          Reading Progress
        </span>
        {!editing && !isComplete && (
          <button
            onClick={() => setEditing(true)}
            className="text-xs font-medium flex items-center gap-1 text-ocean-600 hover:text-ocean-700 dark:text-ocean-400 dark:hover:text-ocean-300 transition-colors"
          >
            <Edit2 className="h-3 w-3" />
            Update
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-2 animate-fade-in">
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={page}
              onChange={(e) => setPage(Math.min(parseInt(e.target.value) || 0, book.page_count))}
              className="flex-1 px-3 py-1.5 text-sm bg-white dark:bg-ink-800 border-2 border-ocean-200 dark:border-ocean-700 rounded-lg focus:border-ocean-500 focus:outline-none transition-colors"
              min="0"
              max={book.page_count}
              disabled={saving}
              autoFocus
            />
            <span className="text-sm text-ink-500 dark:text-ink-400">/ {book.page_count}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleUpdate}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-ocean-600 text-white text-xs font-medium rounded-lg hover:bg-ocean-700 disabled:opacity-50 transition-colors"
            >
              <Check className="h-3 w-3" />
              <span>{saving ? 'Saving...' : 'Save'}</span>
            </button>
            <button
              onClick={handleCancel}
              disabled={saving}
              className="px-3 py-1.5 bg-cream-200 dark:bg-ink-700 text-ink-600 dark:text-ink-300 text-xs rounded-lg hover:bg-cream-300 dark:hover:bg-ink-600 disabled:opacity-50 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
          {/* Quick mark as complete */}
          <button
            onClick={handleMarkComplete}
            disabled={saving}
            className="w-full flex items-center justify-center gap-1 px-3 py-1.5 bg-sage-100 dark:bg-sage-900/50 text-sage-700 dark:text-sage-300 text-xs font-medium rounded-lg hover:bg-sage-200 dark:hover:bg-sage-900 disabled:opacity-50 transition-colors"
          >
            <Sparkles className="h-3 w-3" />
            <span>Mark as Finished</span>
          </button>
        </div>
      ) : (
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-ink-600 dark:text-ink-300">
              Page {page} of {book.page_count}
            </span>
            <span className={`font-semibold ${isComplete ? 'text-sage-700 dark:text-sage-400' : 'text-ocean-700 dark:text-ocean-400'}`}>
              {percentage}%
            </span>
          </div>
          <div className={`h-2 rounded-full overflow-hidden ${isComplete ? 'bg-sage-200 dark:bg-sage-800' : 'bg-ocean-200 dark:bg-ocean-800'}`}>
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                isComplete 
                  ? 'bg-gradient-to-r from-sage-500 to-sage-400' 
                  : 'bg-gradient-to-r from-ocean-500 to-ocean-400'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          {isComplete && (
            <div className="mt-2 flex items-center justify-center gap-1 text-xs font-semibold text-sage-700 dark:text-sage-400 animate-fade-in">
              <Sparkles className="h-3 w-3" />
              <span>Complete!</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ReadingProgress;
