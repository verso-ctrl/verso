import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Users as UsersIcon, BookOpen, ArrowRight } from 'lucide-react';
import { usersAPI } from '../services/api';

function Users() {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setSearched(true);
    try {
      const response = await usersAPI.searchUsers(searchQuery);
      setUsers(response.data);
    } catch (error) {
      console.error('Search failed:', error);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-ocean-400 to-ocean-600 rounded-xl flex items-center justify-center">
            <UsersIcon className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-ink-900 dark:text-cream-100">
            Find Readers
          </h1>
        </div>
        <p className="text-ink-500 dark:text-ink-400">
          Discover other book lovers and see what they're reading
        </p>
      </div>

      {/* Search Bar */}
      <div className="card p-4">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-ink-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by username..."
              className="input-field pl-12"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !searchQuery.trim()}
            className="btn-primary px-6 disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card p-5">
              <div className="flex items-center gap-4">
                <div className="skeleton w-14 h-14 rounded-2xl"></div>
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-5 w-32"></div>
                  <div className="skeleton h-4 w-24"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : users.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {users.map(user => (
            <UserCard key={user.id} user={user} />
          ))}
        </div>
      ) : searched ? (
        <div className="empty-state">
          <UsersIcon className="empty-state-icon" />
          <h3 className="text-lg font-semibold text-ink-900 dark:text-cream-100 mb-2">
            No readers found
          </h3>
          <p className="text-ink-500 dark:text-ink-400">
            Try a different username
          </p>
        </div>
      ) : (
        <div className="empty-state">
          <UsersIcon className="empty-state-icon" />
          <h3 className="text-lg font-semibold text-ink-900 dark:text-cream-100 mb-2">
            Search for readers
          </h3>
          <p className="text-ink-500 dark:text-ink-400 max-w-sm mx-auto">
            Enter a username to find other book lovers and see what they're reading
          </p>
        </div>
      )}
    </div>
  );
}

function UserCard({ user }) {
  return (
    <Link 
      to={`/users/${user.id}`} 
      className="card p-5 group hover:border-primary-200 dark:hover:border-primary-800 transition-all"
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="w-14 h-14 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl flex items-center justify-center text-white text-xl font-bold flex-shrink-0 group-hover:scale-105 transition-transform">
          {user.username?.[0]?.toUpperCase() || 'U'}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-lg font-semibold text-ink-900 dark:text-cream-100 truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
              {user.username}
            </h3>
            <ArrowRight className="h-4 w-4 text-ink-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
          </div>
          {user.full_name && (
            <p className="text-sm text-ink-500 dark:text-ink-400 truncate mt-0.5">
              {user.full_name}
            </p>
          )}
          {user.bio && (
            <p className="text-sm text-ink-600 dark:text-ink-300 mt-2 line-clamp-2">
              {user.bio}
            </p>
          )}
          {user.books_count !== undefined && (
            <div className="flex items-center gap-1.5 mt-2 text-xs text-ink-400">
              <BookOpen className="h-3.5 w-3.5" />
              <span>{user.books_count} books</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

export default Users;
