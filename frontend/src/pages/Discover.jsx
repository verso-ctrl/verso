import React, { useState, useEffect } from 'react';
import { Search, TrendingUp, Sparkles, BookOpen, Filter, X, Plus, Star, ChevronDown, Calendar, FileText, ArrowLeft } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { booksAPI, userBooksAPI } from '../services/api';
import { useToast } from '../components/Toast';

function Discover() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const toast = useToast();
  
  const [displayBooks, setDisplayBooks] = useState([]);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [loading, setLoading] = useState(true);
  const [addingBookId, setAddingBookId] = useState(null);
  const [selectedBook, setSelectedBook] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    genre: '',
    yearFrom: '',
    yearTo: '',
    minRating: '',
  });

  useEffect(() => {
    if (searchParams.get('q')) {
      performSearch(searchParams.get('q'));
    } else {
      loadPopularBooks();
    }
  }, []);

  const loadPopularBooks = async () => {
    setLoading(true);
    try {
      const response = await booksAPI.getPopularBooks(50);
      setDisplayBooks(response.data || []);
    } catch (error) {
      console.error('Failed to load popular books:', error);
      setDisplayBooks([]);
    }
    setLoading(false);
  };

  const performSearch = async (query = searchQuery) => {
    if (!query.trim() && !filters.genre && !filters.yearFrom && !filters.yearTo) {
      loadPopularBooks();
      return;
    }

    setLoading(true);
    try {
      // Build search query with filters
      let searchTerm = query.trim();
      
      // Add genre to search if specified
      if (filters.genre) {
        searchTerm = searchTerm ? `${searchTerm} ${filters.genre}` : filters.genre;
      }
      
      // Pass year filters to API for server-side filtering
      const yearFrom = filters.yearFrom ? parseInt(filters.yearFrom) : null;
      const yearTo = filters.yearTo ? parseInt(filters.yearTo) : null;
      
      const response = await booksAPI.searchExternal(
        searchTerm || 'popular fiction', 
        100,
        yearFrom,
        yearTo
      );
      let results = response.data || [];
      
      // Additional client-side filters (rating, etc.)
      if (filters.minRating) {
        results = results.filter(book => 
          book.average_rating && book.average_rating >= parseFloat(filters.minRating)
        );
      }
      
      setDisplayBooks(results);
      
      if (results.length === 0) {
        toast.info('No books found. Try different search terms or filters.');
      }
    } catch (error) {
      console.error('Search failed:', error);
      toast.error('Search failed. Please try again.');
      setDisplayBooks([]);
    }
    setLoading(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    performSearch();
  };

  const applyFilters = () => {
    setShowFilters(false);
    performSearch();
  };

  const handleAddBook = async (book, status = 'want_to_read') => {
    setAddingBookId(book.isbn || book.title);
    
    try {
      let bookId = book.id;
      
      if (!book.id) {
        const importResponse = await booksAPI.importBook({
          title: book.title,
          author: book.author,
          isbn: book.isbn,
          description: book.description,
          cover_url: book.cover_url,
          published_year: book.published_year,
          page_count: book.page_count,
          publisher: book.publisher,
          genre: book.genre,
        });
        bookId = importResponse.data.id;
      }
      
      await userBooksAPI.addBookToLibrary({
        book_id: bookId,
        status: status,
      });
      
      if (window.refreshPoints) window.refreshPoints();
      if (window.refreshReadingGoal) window.refreshReadingGoal();
      if (window.refreshStats) window.refreshStats();
      
      toast.success('Book added to your library!');
      setSelectedBook(null);
    } catch (error) {
      console.error('Failed to add book:', error);
      toast.error(error.response?.data?.detail || 'Failed to add book');
    }
    
    setAddingBookId(null);
  };

  const handleBookClick = async (book) => {
    if (book.id) {
      // Book exists in our database, navigate to details
      navigate(`/books/${book.id}`);
    } else {
      // External book - import first, then navigate
      try {
        const importResponse = await booksAPI.importBook({
          title: book.title,
          author: book.author,
          isbn: book.isbn,
          description: book.description,
          cover_url: book.cover_url,
          published_year: book.published_year,
          page_count: book.page_count,
          publisher: book.publisher,
          genre: book.genre,
        });
        navigate(`/books/${importResponse.data.id}`);
      } catch (error) {
        console.error('Failed to import book:', error);
        // Fallback to showing preview modal
        setSelectedBook(book);
      }
    }
  };

  const clearFilters = () => {
    setFilters({
      genre: '',
      yearFrom: '',
      yearTo: '',
      minRating: '',
    });
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== '');
  const filterCount = Object.values(filters).filter(v => v !== '').length;

  const genres = [
    'Fiction', 'Non-Fiction', 'Mystery', 'Thriller', 'Romance', 'Science Fiction',
    'Fantasy', 'Biography', 'History', 'Self-Help', 'Horror', 'Young Adult'
  ];

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-serif font-bold text-ink-900 dark:text-cream-100 flex items-center gap-3">
          <Sparkles className="h-8 w-8 text-primary-500" />
          Discover
        </h1>
        <p className="text-ink-500 dark:text-ink-400 mt-1">
          Find your next favorite book
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="card p-4 space-y-4">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-ink-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, author, or genre..."
              className="input-field pl-12 pr-4"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary px-6"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary flex items-center gap-2 ${hasActiveFilters ? 'ring-2 ring-primary-500' : ''}`}
          >
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Filters</span>
            {filterCount > 0 && (
              <span className="bg-primary-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                {filterCount}
              </span>
            )}
          </button>
        </form>

        {/* Filters Panel */}
        {showFilters && (
          <div className="pt-4 border-t border-cream-200 dark:border-ink-700 animate-slide-down space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-ink-900 dark:text-cream-100">Filters</h3>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-wine-600 hover:text-wine-700 font-medium flex items-center gap-1"
                >
                  <X className="h-4 w-4" />
                  Clear all
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Genre */}
              <div>
                <label className="block text-xs font-medium text-ink-600 dark:text-ink-400 mb-1.5">
                  Genre
                </label>
                <select
                  value={filters.genre}
                  onChange={(e) => setFilters({ ...filters, genre: e.target.value })}
                  className="input-field py-2.5"
                >
                  <option value="">All Genres</option>
                  {genres.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              {/* Year From */}
              <div>
                <label className="block text-xs font-medium text-ink-600 dark:text-ink-400 mb-1.5">
                  Published After
                </label>
                <input
                  type="number"
                  value={filters.yearFrom}
                  onChange={(e) => setFilters({ ...filters, yearFrom: e.target.value })}
                  placeholder="e.g. 2000"
                  className="input-field py-2.5"
                  min="1800"
                  max={new Date().getFullYear()}
                />
              </div>

              {/* Year To */}
              <div>
                <label className="block text-xs font-medium text-ink-600 dark:text-ink-400 mb-1.5">
                  Published Before
                </label>
                <input
                  type="number"
                  value={filters.yearTo}
                  onChange={(e) => setFilters({ ...filters, yearTo: e.target.value })}
                  placeholder="e.g. 2024"
                  className="input-field py-2.5"
                  min="1800"
                  max={new Date().getFullYear()}
                />
              </div>

              {/* Min Rating */}
              <div>
                <label className="block text-xs font-medium text-ink-600 dark:text-ink-400 mb-1.5">
                  Min Rating
                </label>
                <select
                  value={filters.minRating}
                  onChange={(e) => setFilters({ ...filters, minRating: e.target.value })}
                  className="input-field py-2.5"
                >
                  <option value="">Any Rating</option>
                  <option value="3">3+ Stars</option>
                  <option value="3.5">3.5+ Stars</option>
                  <option value="4">4+ Stars</option>
                </select>
              </div>
            </div>

            <button
              onClick={applyFilters}
              className="btn-primary w-full sm:w-auto"
            >
              Apply Filters
            </button>
          </div>
        )}
      </div>

      {/* Quick Genre Buttons */}
      <div className="flex gap-2 flex-wrap">
        {['Fiction', 'Mystery', 'Romance', 'Fantasy', 'Science Fiction', 'History'].map(genre => (
          <button
            key={genre}
            onClick={() => {
              setFilters({ ...filters, genre });
              setSearchQuery('');
              performSearch(genre);
            }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filters.genre === genre
                ? 'bg-primary-600 text-white'
                : 'bg-cream-200 dark:bg-ink-700 text-ink-600 dark:text-cream-300 hover:bg-cream-300 dark:hover:bg-ink-600'
            }`}
          >
            {genre}
          </button>
        ))}
      </div>

      {/* Results Info */}
      {!loading && displayBooks.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-ink-500 dark:text-ink-400">
          {!searchQuery && !hasActiveFilters && <TrendingUp className="h-4 w-4" />}
          <span>
            {displayBooks.length} {displayBooks.length === 1 ? 'book' : 'books'} found
          </span>
        </div>
      )}

      {/* Books Grid */}
      {loading ? (
        <LoadingSkeleton />
      ) : displayBooks.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {displayBooks.map((book, index) => (
            <BookCard
              key={book.isbn || book.id || `${book.title}-${index}`}
              book={book}
              onAdd={handleAddBook}
              isAdding={addingBookId === (book.isbn || book.title)}
              onClick={() => handleBookClick(book)}
            />
          ))}
        </div>
      )}

      {/* Book Preview Modal */}
      {selectedBook && (
        <BookPreviewModal
          book={selectedBook}
          onClose={() => setSelectedBook(null)}
          onAdd={handleAddBook}
          isAdding={addingBookId === (selectedBook.isbn || selectedBook.title)}
        />
      )}
    </div>
  );
}

function BookCard({ book, onAdd, isAdding, onClick }) {
  return (
    <div className="book-card group cursor-pointer" onClick={onClick}>
      {/* Cover */}
      <div className="relative">
        <div className="book-cover aspect-[2/3]">
          {book.cover_url ? (
            <img
              src={book.cover_url}
              alt={book.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-cream-400 dark:text-ink-600 bg-gradient-to-br from-cream-200 to-cream-300 dark:from-ink-700 dark:to-ink-800">
              <BookOpen className="h-12 w-12" />
            </div>
          )}
        </div>

        {/* Rating Badge */}
        {book.average_rating > 0 && (
          <div className="absolute top-2 right-2 bg-ink-900/80 text-white px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1">
            <Star className="h-3 w-3 fill-primary-400 text-primary-400" />
            {book.average_rating.toFixed(1)}
          </div>
        )}

        {/* Database indicator */}
        {book.id && (
          <div className="absolute top-2 left-2 bg-sage-600/90 text-white px-2 py-1 rounded-lg text-xs font-semibold">
            In Library
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="font-semibold text-sm text-ink-900 dark:text-cream-100 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
          {book.title}
        </h3>
        <p className="text-xs text-ink-500 dark:text-ink-400 mt-1 line-clamp-1">
          {book.author}
        </p>
        
        {/* Metadata */}
        <div className="flex items-center gap-2 mt-2 text-xs text-ink-400">
          {book.published_year && <span>{book.published_year}</span>}
          {book.published_year && book.page_count && <span>•</span>}
          {book.page_count && <span>{book.page_count}p</span>}
        </div>

        {/* Genre Tag */}
        {book.genre && (
          <span className="inline-block mt-2 px-2 py-0.5 bg-cream-200 dark:bg-ink-700 text-ink-600 dark:text-ink-300 text-xs rounded-full">
            {book.genre}
          </span>
        )}
      </div>
    </div>
  );
}

function BookPreviewModal({ book, onClose, onAdd, isAdding }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content max-w-lg p-0 overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header with cover */}
        <div className="bg-gradient-to-br from-cream-100 to-cream-200 dark:from-ink-800 dark:to-ink-900 p-6">
          <div className="flex gap-5">
            {/* Cover */}
            <div className="w-28 flex-shrink-0">
              <div className="book-cover aspect-[2/3] rounded-xl shadow-book overflow-hidden">
                {book.cover_url ? (
                  <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-cream-300 dark:bg-ink-700">
                    <BookOpen className="h-10 w-10 text-cream-400 dark:text-ink-500" />
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-serif font-bold text-ink-900 dark:text-cream-100 line-clamp-2">
                {book.title}
              </h2>
              <p className="text-ink-600 dark:text-ink-300 mt-1">
                by {book.author}
              </p>

              {book.average_rating > 0 && (
                <div className="flex items-center gap-2 mt-3">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.round(book.average_rating) ? 'star-filled' : 'star-empty'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium text-ink-700 dark:text-cream-300">
                    {book.average_rating.toFixed(1)}
                  </span>
                </div>
              )}

              {/* Metadata */}
              <div className="flex flex-wrap gap-3 mt-3 text-sm text-ink-500 dark:text-ink-400">
                {book.published_year && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {book.published_year}
                  </span>
                )}
                {book.page_count && (
                  <span className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    {book.page_count} pages
                  </span>
                )}
              </div>

              {book.genre && (
                <span className="inline-block mt-3 px-3 py-1 bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 text-sm font-medium rounded-full">
                  {book.genre}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="p-6">
          {book.description ? (
            <div>
              <h3 className="text-sm font-semibold text-ink-900 dark:text-cream-100 mb-2">
                About This Book
              </h3>
              <p className="text-sm text-ink-600 dark:text-ink-300 leading-relaxed line-clamp-4">
                {book.description}
              </p>
            </div>
          ) : (
            <p className="text-sm text-ink-500 dark:text-ink-400 italic">
              No description available.
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => onAdd(book, 'want_to_read')}
              disabled={isAdding}
              className="flex-1 btn-primary flex items-center justify-center gap-2"
            >
              {isAdding ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Add to Library
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="btn-secondary"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="empty-state">
      <BookOpen className="empty-state-icon" />
      <h3 className="text-lg font-semibold text-ink-900 dark:text-cream-100 mb-2">
        No books found
      </h3>
      <p className="text-ink-500 dark:text-ink-400 max-w-sm mx-auto">
        Try different search terms or adjust your filters
      </p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {[...Array(10)].map((_, i) => (
        <div key={i} className="card overflow-hidden">
          <div className="skeleton aspect-[2/3]"></div>
          <div className="p-3 space-y-2">
            <div className="skeleton h-4 w-full"></div>
            <div className="skeleton h-3 w-2/3"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default Discover;
