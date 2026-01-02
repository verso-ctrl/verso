import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Star, Clock, TrendingUp, Sparkles, ChevronRight, Target, Plus, ArrowRight } from 'lucide-react';
import { useLibraryStore, useAuthStore } from '../stores';
import { booksAPI } from '../services/api';
import ReadingGoalWidget from '../components/ReadingGoalWidget';
import ReadingProgress from '../components/ReadingProgress';

function Home() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { stats, fetchStats, myBooks, fetchMyBooks } = useLibraryStore();
  const [popularBooks, setPopularBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    await Promise.all([
      fetchStats(),
      fetchMyBooks()
    ]);
    try {
      const popularRes = await booksAPI.getPopularBooks(6);
      setPopularBooks(popularRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    
    // Expose global refresh function
    window.refreshStats = () => {
      fetchStats();
      fetchMyBooks();
    };
    
    return () => {
      delete window.refreshStats;
    };
  }, [fetchStats, fetchMyBooks]);

  const currentlyReading = myBooks.filter(b => b.status === 'currently_reading');
  const recentlyRead = myBooks.filter(b => b.status === 'read').slice(0, 6);
  const wantToRead = myBooks.filter(b => b.status === 'want_to_read').slice(0, 4);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-8 animate-fade-up">
      {/* Welcome Header */}
      <section>
        <p className="text-primary-600 dark:text-primary-400 font-medium text-sm">
          {getGreeting()}
        </p>
        <h1 className="text-3xl font-serif font-bold text-ink-900 dark:text-cream-100 mt-1">
          {user?.username}
        </h1>
      </section>

      {/* Currently Reading - Primary Focus */}
      {currentlyReading.length > 0 ? (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-ink-900 dark:text-cream-100 flex items-center gap-2">
              <Clock className="h-5 w-5 text-ocean-500" />
              Continue Reading
            </h2>
            <Link to="/library" className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
              View all <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          
          <div className="space-y-3">
            {currentlyReading.slice(0, 2).map(({ book, current_page }) => (
              <CurrentlyReadingCard 
                key={book.id} 
                book={book} 
                currentPage={current_page}
                onStatusChange={() => loadData()}
              />
            ))}
          </div>
        </section>
      ) : myBooks.length === 0 ? (
        // Empty state for new users
        <section className="card p-8 text-center">
          <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BookOpen className="h-8 w-8 text-primary-600 dark:text-primary-400" />
          </div>
          <h2 className="text-xl font-serif font-bold text-ink-900 dark:text-cream-100 mb-2">
            Welcome to Verso
          </h2>
          <p className="text-ink-500 dark:text-ink-400 mb-6 max-w-sm mx-auto">
            Your reading life starts here. Add your first book to begin.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/discover" className="btn-primary inline-flex items-center justify-center gap-2">
              <Sparkles className="h-4 w-4" />
              Discover Books
            </Link>
            <Link to="/import" className="btn-secondary inline-flex items-center justify-center gap-2">
              Import from Goodreads
            </Link>
          </div>
        </section>
      ) : (
        // No currently reading, but has books
        <section className="card p-6 bg-gradient-to-r from-ocean-50 to-primary-50 dark:from-ocean-950/50 dark:to-primary-950/50 border border-ocean-100 dark:border-ocean-900">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-ocean-100 dark:bg-ocean-900/50 rounded-xl flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-ocean-600 dark:text-ocean-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-ink-900 dark:text-cream-100">Ready for your next book?</h3>
              <p className="text-sm text-ink-500 dark:text-ink-400">
                You have {wantToRead.length} {wantToRead.length === 1 ? 'book' : 'books'} waiting to be read
              </p>
            </div>
            <Link to="/library" className="btn-primary text-sm">
              Start Reading
            </Link>
          </div>
        </section>
      )}

      {/* Stats & Goal Row */}
      <section className="grid md:grid-cols-2 gap-4">
        {/* Reading Goal */}
        <ReadingGoalWidget />

        {/* Quick Stats */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-ink-500 dark:text-ink-400 uppercase tracking-wider mb-4">
            Your Stats
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-sage-600 dark:text-sage-400">{stats?.books_read || 0}</p>
              <p className="text-xs text-ink-500 dark:text-ink-400 mt-1">Read</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-ocean-600 dark:text-ocean-400">{stats?.currently_reading || 0}</p>
              <p className="text-xs text-ink-500 dark:text-ink-400 mt-1">Reading</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-wine-600 dark:text-wine-400">{stats?.want_to_read || 0}</p>
              <p className="text-xs text-ink-500 dark:text-ink-400 mt-1">Wishlist</p>
            </div>
          </div>
          {stats?.total_pages_read > 0 && (
            <div className="mt-4 pt-4 border-t border-cream-200 dark:border-ink-700 text-center">
              <p className="text-sm text-ink-600 dark:text-ink-300">
                <span className="font-bold text-primary-600 dark:text-primary-400">{stats.total_pages_read.toLocaleString()}</span> pages read
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Recently Finished */}
      {recentlyRead.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-ink-900 dark:text-cream-100">
              Recently Finished
            </h2>
            <Link to="/library" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              See all
            </Link>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {recentlyRead.map(({ book, rating }) => (
              <Link 
                key={book.id} 
                to={`/books/${book.id}`}
                className="group"
              >
                <div className="aspect-[2/3] rounded-xl overflow-hidden bg-cream-200 dark:bg-ink-700 shadow-sm group-hover:shadow-md transition-shadow">
                  {book.cover_url ? (
                    <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="h-6 w-6 text-cream-400 dark:text-ink-500" />
                    </div>
                  )}
                </div>
                <p className="text-xs font-medium text-ink-900 dark:text-cream-100 mt-2 line-clamp-1 group-hover:text-primary-600 transition-colors">
                  {book.title}
                </p>
                {rating && (
                  <div className="flex items-center gap-0.5 mt-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`h-2.5 w-2.5 ${i < rating ? 'star-filled' : 'star-empty'}`} />
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Trending / Popular */}
      {popularBooks.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-ink-900 dark:text-cream-100 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary-500" />
              Trending Books
            </h2>
            <Link to="/discover" className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
              Discover more <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {popularBooks.map(book => (
              <Link 
                key={book.id} 
                to={`/books/${book.id}`}
                className="group"
              >
                <div className="aspect-[2/3] rounded-xl overflow-hidden bg-cream-200 dark:bg-ink-700 shadow-sm group-hover:shadow-md transition-shadow">
                  {book.cover_url ? (
                    <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="h-6 w-6 text-cream-400 dark:text-ink-500" />
                    </div>
                  )}
                </div>
                <p className="text-xs font-medium text-ink-900 dark:text-cream-100 mt-2 line-clamp-1 group-hover:text-primary-600 transition-colors">
                  {book.title}
                </p>
                <p className="text-xs text-ink-500 dark:text-ink-400 line-clamp-1">
                  {book.author}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Want to Read */}
      {wantToRead.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-ink-900 dark:text-cream-100">
              Up Next
            </h2>
            <Link to="/library" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              See all
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {wantToRead.map(({ book }) => (
              <Link 
                key={book.id} 
                to={`/books/${book.id}`}
                className="card p-3 group hover:shadow-card-hover transition-shadow"
              >
                <div className="flex gap-3">
                  <div className="w-12 h-16 rounded-lg overflow-hidden bg-cream-200 dark:bg-ink-700 flex-shrink-0">
                    {book.cover_url ? (
                      <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="h-4 w-4 text-cream-400 dark:text-ink-500" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink-900 dark:text-cream-100 line-clamp-2 group-hover:text-primary-600 transition-colors">
                      {book.title}
                    </p>
                    <p className="text-xs text-ink-500 dark:text-ink-400 mt-1 line-clamp-1">
                      {book.author}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function CurrentlyReadingCard({ book, currentPage, onStatusChange }) {
  const navigate = useNavigate();
  const [localPage, setLocalPage] = useState(currentPage);

  return (
    <div className="card p-4">
      <div className="flex gap-4">
        {/* Cover */}
        <div 
          className="w-16 sm:w-20 flex-shrink-0 cursor-pointer"
          onClick={() => navigate(`/books/${book.id}`)}
        >
          <div className="aspect-[2/3] rounded-xl overflow-hidden shadow-book">
            {book.cover_url ? (
              <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-cream-200 dark:bg-ink-700">
                <BookOpen className="h-6 w-6 text-cream-400 dark:text-ink-500" />
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 
            className="font-semibold text-ink-900 dark:text-cream-100 line-clamp-1 cursor-pointer hover:text-primary-600 transition-colors"
            onClick={() => navigate(`/books/${book.id}`)}
          >
            {book.title}
          </h3>
          <p className="text-sm text-ink-500 dark:text-ink-400 mb-3">
            {book.author}
          </p>
          
          <ReadingProgress 
            book={book} 
            currentPage={localPage || 0}
            onUpdate={(newPage) => setLocalPage(newPage)}
            onStatusChange={onStatusChange}
          />
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <div className="skeleton h-4 w-24 mb-2"></div>
        <div className="skeleton h-10 w-48"></div>
      </div>
      <div className="skeleton h-32 rounded-2xl"></div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="skeleton h-48 rounded-2xl"></div>
        <div className="skeleton h-48 rounded-2xl"></div>
      </div>
    </div>
  );
}

export default Home;
