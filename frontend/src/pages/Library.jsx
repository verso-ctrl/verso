import React, { useEffect, useState } from 'react';
import { Star, Edit2, Trash2, BookOpen, Check, Clock, Heart, Package, X, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLibraryStore } from '../stores';
import { useToast } from '../components/Toast';
import ReadingProgress from '../components/ReadingProgress';

function Library() {
  const navigate = useNavigate();
  const toast = useToast();
  const { myBooks, fetchMyBooks, removeBook, updateBook, loading } = useLibraryStore();
  const [activeTab, setActiveTab] = useState('all');
  const [editingBook, setEditingBook] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  useEffect(() => {
    fetchMyBooks();
  }, [fetchMyBooks]);

  const tabs = [
    { id: 'all', label: 'All', icon: BookOpen },
    { id: 'currently_reading', label: 'Reading', icon: Clock },
    { id: 'want_to_read', label: 'Want to Read', icon: Heart },
    { id: 'read', label: 'Completed', icon: Check },
  ];

  const filteredBooks = activeTab === 'all'
    ? myBooks
    : myBooks.filter(b => b.status === activeTab);

  const handleRemove = async (bookId, bookTitle) => {
    if (window.confirm(`Remove "${bookTitle}" from your library?`)) {
      await removeBook(bookId);
      toast.success('Book removed from library');
    }
  };

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-ink-900 dark:text-cream-100">
            My Library
          </h1>
          <p className="text-ink-500 dark:text-ink-400 mt-1">
            {myBooks.length} {myBooks.length === 1 ? 'book' : 'books'} in your collection
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-cream-200/50 dark:bg-ink-800/50 rounded-2xl overflow-x-auto">
        {tabs.map(tab => {
          const count = tab.id === 'all' 
            ? myBooks.length 
            : myBooks.filter(b => b.status === tab.id).length;
          const Icon = tab.icon;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-ink-700 text-ink-900 dark:text-cream-100 shadow-sm'
                  : 'text-ink-500 dark:text-ink-400 hover:text-ink-700 dark:hover:text-cream-300'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                activeTab === tab.id
                  ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300'
                  : 'bg-cream-300 dark:bg-ink-700 text-ink-500 dark:text-ink-400'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Books Grid */}
      {loading ? (
        <LoadingSkeleton />
      ) : filteredBooks.length === 0 ? (
        <EmptyState activeTab={activeTab} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredBooks.map(({ book, status, rating, review, current_page }) => (
            <BookCard
              key={book.id}
              book={book}
              status={status}
              rating={rating}
              review={review}
              currentPage={current_page}
              onEdit={() => setEditingBook({ book, status, rating, review })}
              onRemove={() => handleRemove(book.id, book.title)}
              onClick={() => navigate(`/books/${book.id}`)}
              onStatusChange={() => fetchMyBooks()}
            />
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editingBook && (
        <EditBookModal
          bookData={editingBook}
          onClose={() => setEditingBook(null)}
          onSave={async (updates) => {
            await updateBook(editingBook.book.id, updates);
            setEditingBook(null);
            toast.success('Book updated successfully');
          }}
        />
      )}
    </div>
  );
}

function BookCard({ book, status, rating, review, currentPage, onEdit, onRemove, onClick, onStatusChange }) {
  const [localCurrentPage, setLocalCurrentPage] = useState(currentPage);
  const [localStatus, setLocalStatus] = useState(status);
  
  const statusConfig = {
    read: { badge: 'badge-read', label: 'Completed', icon: Check },
    currently_reading: { badge: 'badge-reading', label: 'Reading', icon: Clock },
    want_to_read: { badge: 'badge-want', label: 'Want to Read', icon: Heart },
    owned: { badge: 'badge-owned', label: 'Owned', icon: Package },
  };

  const config = statusConfig[localStatus] || statusConfig.want_to_read;
  const StatusIcon = config.icon;

  const handleStatusChange = (newStatus) => {
    setLocalStatus(newStatus);
    if (onStatusChange) onStatusChange();
  };

  return (
    <div className="book-card group">
      <div className="flex gap-4 p-4">
        {/* Book Cover */}
        <div 
          className="w-24 flex-shrink-0 cursor-pointer" 
          onClick={onClick}
        >
          <div className="book-cover aspect-[2/3] rounded-xl">
            {book.cover_url ? (
              <img
                src={book.cover_url}
                alt={book.title}
                className="w-full h-full object-cover rounded-xl"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-cream-400 dark:text-ink-600 rounded-xl">
                <BookOpen className="h-8 w-8" />
              </div>
            )}
          </div>
        </div>

        {/* Book Info */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex items-start justify-between gap-2">
            <div className="cursor-pointer" onClick={onClick}>
              <h3 className="font-semibold text-ink-900 dark:text-cream-100 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                {book.title}
              </h3>
              <p className="text-sm text-ink-500 dark:text-ink-400 mt-0.5">
                {book.author}
              </p>
            </div>
            <span className={`badge ${config.badge} flex-shrink-0`}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {config.label}
            </span>
          </div>

          {/* Rating */}
          {rating && (
            <div className="flex items-center gap-1 mt-2">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${i < rating ? 'star-filled' : 'star-empty'}`}
                />
              ))}
              <span className="ml-1 text-sm text-ink-500">{rating}/5</span>
            </div>
          )}

          {/* Review Preview */}
          {review && (
            <p className="text-sm text-ink-600 dark:text-ink-300 mt-2 line-clamp-2 italic">
              "{review}"
            </p>
          )}

          {/* Reading Progress */}
          {localStatus === 'currently_reading' && (
            <div className="mt-3">
              <ReadingProgress 
                book={book} 
                currentPage={localCurrentPage || 0}
                onUpdate={(newPage) => setLocalCurrentPage(newPage)}
                onStatusChange={handleStatusChange}
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 mt-auto pt-3">
            <button
              onClick={onEdit}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-xl hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors text-sm font-medium"
            >
              <Edit2 className="h-4 w-4" />
              <span>Edit</span>
            </button>
            <button
              onClick={onRemove}
              className="p-2 bg-wine-50 dark:bg-wine-900/30 text-wine-600 dark:text-wine-400 rounded-xl hover:bg-wine-100 dark:hover:bg-wine-900/50 transition-colors"
              title="Remove from library"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EditBookModal({ bookData, onClose, onSave }) {
  const [formData, setFormData] = useState({
    status: bookData.status,
    rating: bookData.rating || '',
    review: bookData.review || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const updates = {
      status: formData.status,
      rating: formData.rating ? parseFloat(formData.rating) : null,
      review: formData.review || null,
    };
    await onSave(updates);
    setSaving(false);
  };

  const statusOptions = [
    { value: 'want_to_read', label: 'Want to Read', icon: Heart },
    { value: 'currently_reading', label: 'Currently Reading', icon: Clock },
    { value: 'read', label: 'Completed', icon: Check },
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-serif font-bold text-ink-900 dark:text-cream-100">
              Edit Book
            </h2>
            <p className="text-sm text-ink-500 dark:text-ink-400 mt-1 line-clamp-1">
              {bookData.book.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="btn-icon"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-ink-700 dark:text-cream-300 mb-2">
              Status
            </label>
            <div className="grid grid-cols-3 gap-2">
              {statusOptions.map(option => {
                const Icon = option.icon;
                const isSelected = formData.status === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, status: option.value })}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                        : 'border-cream-300 dark:border-ink-700 hover:border-cream-400 dark:hover:border-ink-600'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-xs font-medium">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-ink-700 dark:text-cream-300 mb-2">
              Your Rating
            </label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFormData({ 
                    ...formData, 
                    rating: formData.rating === star ? '' : star 
                  })}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= formData.rating ? 'star-filled' : 'star-empty'
                    }`}
                  />
                </button>
              ))}
              {formData.rating && (
                <span className="ml-2 text-sm text-ink-500">
                  {formData.rating}/5
                </span>
              )}
            </div>
          </div>

          {/* Review */}
          <div>
            <label className="block text-sm font-medium text-ink-700 dark:text-cream-300 mb-2">
              Review
            </label>
            <textarea
              value={formData.review}
              onChange={(e) => setFormData({ ...formData, review: e.target.value })}
              className="input-field h-32 resize-none"
              placeholder="Share your thoughts about this book..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 btn-primary"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EmptyState({ activeTab }) {
  const navigate = useNavigate();
  
  const messages = {
    all: { title: 'Your library is empty', desc: 'Start by adding some books to your collection' },
    currently_reading: { title: 'Not reading anything?', desc: 'Pick up a book and start a new adventure' },
    want_to_read: { title: 'No books on your wishlist', desc: 'Discover new books to add to your reading list' },
    read: { title: 'No completed books yet', desc: 'Mark books as read when you finish them' },
  };

  const msg = messages[activeTab] || messages.all;

  return (
    <div className="empty-state">
      <BookOpen className="empty-state-icon" />
      <h3 className="text-lg font-semibold text-ink-900 dark:text-cream-100 mb-2">
        {msg.title}
      </h3>
      <p className="text-ink-500 dark:text-ink-400 mb-6 max-w-sm mx-auto">
        {msg.desc}
      </p>
      <button
        onClick={() => navigate('/discover')}
        className="btn-primary"
      >
        Discover Books
      </button>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="card p-4">
          <div className="flex gap-4">
            <div className="skeleton w-24 aspect-[2/3] rounded-xl"></div>
            <div className="flex-1 space-y-3">
              <div className="skeleton h-5 w-3/4"></div>
              <div className="skeleton h-4 w-1/2"></div>
              <div className="skeleton h-4 w-full"></div>
              <div className="skeleton h-10 w-full mt-auto"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default Library;
