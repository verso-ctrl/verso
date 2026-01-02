import React, { useState, useEffect } from 'react';
import { 
  BarChart3, PieChart, TrendingUp, BookOpen, Star, Clock, 
  Calendar, Award, Flame, Target, ChevronRight, Users
} from 'lucide-react';
import { statsAPI } from '../services/api';
import { Link } from 'react-router-dom';

function Statistics() {
  const [stats, setStats] = useState(null);
  const [streak, setStreak] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [statsRes, streakRes] = await Promise.all([
        statsAPI.getDetailedStats(),
        statsAPI.getReadingStreak()
      ]);
      setStats(statsRes.data);
      setStreak(streakRes.data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
    setLoading(false);
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (!stats) {
    return (
      <div className="empty-state">
        <BarChart3 className="empty-state-icon" />
        <h3 className="text-lg font-semibold text-ink-900 dark:text-cream-100 mb-2">
          No statistics available
        </h3>
        <p className="text-ink-500 dark:text-ink-400 mb-4">
          Start adding books to see your reading statistics
        </p>
        <Link to="/discover" className="btn-primary">
          Discover Books
        </Link>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'timeline', label: 'Timeline', icon: Calendar },
    { id: 'breakdown', label: 'Breakdown', icon: PieChart },
  ];

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-serif font-bold text-ink-900 dark:text-cream-100 flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-primary-500" />
          Reading Statistics
        </h1>
        <p className="text-ink-500 dark:text-ink-400 mt-1">
          Track your reading journey and discover patterns
        </p>
      </div>

      {/* Streak Banner */}
      {streak && streak.current_streak_months > 0 && (
        <div className="card p-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Flame className="h-6 w-6" />
              </div>
              <div>
                <p className="text-white/80 text-sm">Current Streak</p>
                <p className="text-2xl font-bold">
                  {streak.current_streak_months} {streak.current_streak_months === 1 ? 'month' : 'months'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white/80 text-sm">Best Streak</p>
              <p className="text-xl font-semibold">{streak.longest_streak_months} months</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-cream-200/50 dark:bg-ink-800/50 rounded-2xl overflow-x-auto">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-ink-700 text-ink-900 dark:text-cream-100 shadow-sm'
                  : 'text-ink-500 dark:text-ink-400 hover:text-ink-700 dark:hover:text-cream-300'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <OverviewTab stats={stats} streak={streak} />
      )}
      {activeTab === 'timeline' && (
        <TimelineTab stats={stats} />
      )}
      {activeTab === 'breakdown' && (
        <BreakdownTab stats={stats} />
      )}
    </div>
  );
}

function OverviewTab({ stats, streak }) {
  const overview = stats.overview;
  
  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<BookOpen className="h-5 w-5" />}
          value={overview.books_read}
          label="Books Read"
          color="sage"
        />
        <StatCard
          icon={<Target className="h-5 w-5" />}
          value={overview.total_books}
          label="In Library"
          color="primary"
        />
        <StatCard
          icon={<Star className="h-5 w-5" />}
          value={overview.average_rating_given || '—'}
          label="Avg Rating Given"
          color="ocean"
        />
        <StatCard
          icon={<Clock className="h-5 w-5" />}
          value={stats.reading_pace.avg_days_per_book || '—'}
          label="Avg Days/Book"
          color="wine"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Pages Stats */}
        <div className="card p-5">
          <h3 className="font-serif font-bold text-ink-900 dark:text-cream-100 mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary-500" />
            Reading Volume
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-cream-200 dark:border-ink-700">
              <span className="text-ink-600 dark:text-ink-300">Total Pages Read</span>
              <span className="font-bold text-ink-900 dark:text-cream-100">
                {overview.total_pages.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-cream-200 dark:border-ink-700">
              <span className="text-ink-600 dark:text-ink-300">Books with Ratings</span>
              <span className="font-bold text-ink-900 dark:text-cream-100">
                {overview.total_ratings}
              </span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-ink-600 dark:text-ink-300">Books with Reviews</span>
              <span className="font-bold text-ink-900 dark:text-cream-100">
                {overview.total_reviews}
              </span>
            </div>
          </div>
        </div>

        {/* Reading Pace */}
        <div className="card p-5">
          <h3 className="font-serif font-bold text-ink-900 dark:text-cream-100 mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-ocean-500" />
            Reading Pace
          </h3>
          {stats.reading_pace.fastest_read ? (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-ink-500 dark:text-ink-400 mb-1">Fastest Read</p>
                <p className="font-medium text-ink-900 dark:text-cream-100 line-clamp-1">
                  {stats.reading_pace.fastest_read.title}
                </p>
                <p className="text-sm text-sage-600 dark:text-sage-400">
                  {stats.reading_pace.fastest_read.days} days
                </p>
              </div>
              <div>
                <p className="text-sm text-ink-500 dark:text-ink-400 mb-1">Slowest Read</p>
                <p className="font-medium text-ink-900 dark:text-cream-100 line-clamp-1">
                  {stats.reading_pace.slowest_read.title}
                </p>
                <p className="text-sm text-wine-600 dark:text-wine-400">
                  {stats.reading_pace.slowest_read.days} days
                </p>
              </div>
            </div>
          ) : (
            <p className="text-ink-500 dark:text-ink-400 text-sm">
              Add start and finish dates to track reading pace
            </p>
          )}
        </div>
      </div>

      {/* This Year Stats */}
      {streak && (
        <div className="card p-5 bg-gradient-to-br from-primary-50 to-cream-100 dark:from-primary-950/50 dark:to-ink-800 border border-primary-100 dark:border-primary-900">
          <h3 className="font-serif font-bold text-ink-900 dark:text-cream-100 mb-4 flex items-center gap-2">
            <Award className="h-5 w-5 text-primary-600" />
            This Year
          </h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                {streak.books_this_year}
              </p>
              <p className="text-sm text-ink-500 dark:text-ink-400">Books Read</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                {streak.books_this_month}
              </p>
              <p className="text-sm text-ink-500 dark:text-ink-400">This Month</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                {streak.current_streak_months}
              </p>
              <p className="text-sm text-ink-500 dark:text-ink-400">Month Streak</p>
            </div>
          </div>
          {streak.most_productive_month && (
            <p className="text-sm text-ink-600 dark:text-ink-300 mt-4 text-center">
              Most productive: <strong>{streak.most_productive_month.month}</strong> with {streak.most_productive_month.count} books
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function TimelineTab({ stats }) {
  const months = Object.entries(stats.books_by_month).slice(-12);
  const maxBooks = Math.max(...months.map(([_, count]) => count), 1);
  
  const years = Object.entries(stats.books_by_year).sort((a, b) => b[0].localeCompare(a[0]));
  
  return (
    <div className="space-y-6">
      {/* Books by Month Chart */}
      <div className="card p-5">
        <h3 className="font-serif font-bold text-ink-900 dark:text-cream-100 mb-4">
          Books Read by Month (Last 12 Months)
        </h3>
        {months.length > 0 ? (
          <div className="space-y-3">
            {months.map(([month, count]) => {
              const percentage = (count / maxBooks) * 100;
              const label = new Date(month + '-01').toLocaleDateString('en-US', { 
                month: 'short', 
                year: '2-digit' 
              });
              return (
                <div key={month} className="flex items-center gap-3">
                  <span className="w-16 text-sm text-ink-500 dark:text-ink-400 text-right">
                    {label}
                  </span>
                  <div className="flex-1 h-8 bg-cream-200 dark:bg-ink-700 rounded-lg overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-lg flex items-center justify-end pr-2 transition-all duration-500"
                      style={{ width: `${Math.max(percentage, 8)}%` }}
                    >
                      <span className="text-xs font-bold text-white">{count}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-ink-500 dark:text-ink-400 text-center py-8">
            No reading data with dates yet
          </p>
        )}
      </div>

      {/* Pages by Month */}
      {Object.keys(stats.pages_by_month).length > 0 && (
        <div className="card p-5">
          <h3 className="font-serif font-bold text-ink-900 dark:text-cream-100 mb-4">
            Pages Read by Month
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {Object.entries(stats.pages_by_month).slice(-8).map(([month, pages]) => {
              const label = new Date(month + '-01').toLocaleDateString('en-US', { 
                month: 'short', 
                year: '2-digit' 
              });
              return (
                <div key={month} className="p-3 bg-cream-100 dark:bg-ink-800 rounded-xl text-center">
                  <p className="text-xs text-ink-500 dark:text-ink-400">{label}</p>
                  <p className="text-lg font-bold text-ink-900 dark:text-cream-100">
                    {pages.toLocaleString()}
                  </p>
                  <p className="text-xs text-ink-400">pages</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Books by Year */}
      {years.length > 0 && (
        <div className="card p-5">
          <h3 className="font-serif font-bold text-ink-900 dark:text-cream-100 mb-4">
            Books by Year
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {years.slice(0, 8).map(([year, count]) => (
              <div key={year} className="text-center p-4 bg-cream-100 dark:bg-ink-800 rounded-xl">
                <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">{count}</p>
                <p className="text-sm text-ink-500 dark:text-ink-400">{year}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Goal Progress */}
      {stats.monthly_goal_progress.length > 0 && (
        <div className="card p-5">
          <h3 className="font-serif font-bold text-ink-900 dark:text-cream-100 mb-4">
            Monthly Goal Progress
          </h3>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-12 gap-2">
            {stats.monthly_goal_progress.map((month, idx) => {
              const isOnTrack = month.actual >= month.target;
              const isFuture = idx > new Date().getMonth();
              return (
                <div 
                  key={month.month} 
                  className={`p-2 rounded-lg text-center ${
                    isFuture 
                      ? 'bg-cream-100 dark:bg-ink-800' 
                      : isOnTrack 
                        ? 'bg-sage-100 dark:bg-sage-900/50' 
                        : 'bg-wine-100 dark:bg-wine-900/50'
                  }`}
                >
                  <p className="text-xs text-ink-500 dark:text-ink-400">{month.month}</p>
                  <p className={`text-lg font-bold ${
                    isFuture 
                      ? 'text-ink-300 dark:text-ink-600' 
                      : isOnTrack 
                        ? 'text-sage-700 dark:text-sage-300' 
                        : 'text-wine-700 dark:text-wine-300'
                  }`}>
                    {month.actual}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function BreakdownTab({ stats }) {
  const genres = Object.entries(stats.genres).sort((a, b) => b[1] - a[1]);
  const authors = Object.entries(stats.authors);
  const ratings = stats.ratings_distribution;
  const totalRatings = Object.values(ratings).reduce((a, b) => a + b, 0);
  
  const genreColors = [
    'bg-primary-500', 'bg-ocean-500', 'bg-sage-500', 'bg-wine-500',
    'bg-primary-400', 'bg-ocean-400', 'bg-sage-400', 'bg-wine-400',
  ];
  
  return (
    <div className="space-y-6">
      {/* Ratings Distribution */}
      <div className="card p-5">
        <h3 className="font-serif font-bold text-ink-900 dark:text-cream-100 mb-4">
          Your Ratings Distribution
        </h3>
        {totalRatings > 0 ? (
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map(rating => {
              const count = ratings[rating] || 0;
              const percentage = totalRatings > 0 ? (count / totalRatings) * 100 : 0;
              return (
                <div key={rating} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-20">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`h-4 w-4 ${i < rating ? 'star-filled' : 'star-empty'}`} 
                      />
                    ))}
                  </div>
                  <div className="flex-1 h-6 bg-cream-200 dark:bg-ink-700 rounded-lg overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-lg transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-12 text-sm text-ink-600 dark:text-ink-300 text-right">
                    {count} ({Math.round(percentage)}%)
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-ink-500 dark:text-ink-400 text-center py-8">
            Rate some books to see your distribution
          </p>
        )}
      </div>

      {/* Genre Breakdown */}
      <div className="card p-5">
        <h3 className="font-serif font-bold text-ink-900 dark:text-cream-100 mb-4">
          Genres You Read
        </h3>
        {genres.length > 0 ? (
          <>
            {/* Visual Bar */}
            <div className="h-8 rounded-lg overflow-hidden flex mb-4">
              {genres.slice(0, 8).map(([genre, count], idx) => {
                const totalGenres = genres.reduce((sum, [_, c]) => sum + c, 0);
                const percentage = (count / totalGenres) * 100;
                return (
                  <div
                    key={genre}
                    className={`${genreColors[idx % genreColors.length]} transition-all duration-500`}
                    style={{ width: `${percentage}%` }}
                    title={`${genre}: ${count} books`}
                  />
                );
              })}
            </div>
            {/* Legend */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {genres.slice(0, 8).map(([genre, count], idx) => (
                <div key={genre} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded ${genreColors[idx % genreColors.length]}`} />
                  <span className="text-sm text-ink-600 dark:text-ink-300 truncate">
                    {genre} ({count})
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-ink-500 dark:text-ink-400 text-center py-8">
            Add books with genres to see your breakdown
          </p>
        )}
      </div>

      {/* Top Authors */}
      <div className="card p-5">
        <h3 className="font-serif font-bold text-ink-900 dark:text-cream-100 mb-4">
          Most Read Authors
        </h3>
        {authors.length > 0 ? (
          <div className="grid sm:grid-cols-2 gap-3">
            {authors.map(([author, count], idx) => (
              <div 
                key={author} 
                className="flex items-center gap-3 p-3 bg-cream-100 dark:bg-ink-800 rounded-xl"
              >
                <span className="w-8 h-8 bg-primary-100 dark:bg-primary-900/50 rounded-lg flex items-center justify-center text-primary-700 dark:text-primary-300 font-bold text-sm">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-ink-900 dark:text-cream-100 truncate">
                    {author}
                  </p>
                  <p className="text-sm text-ink-500 dark:text-ink-400">
                    {count} {count === 1 ? 'book' : 'books'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-ink-500 dark:text-ink-400 text-center py-8">
            No author data available
          </p>
        )}
      </div>

      {/* Publication Years */}
      {Object.keys(stats.publication_years).length > 0 && (
        <div className="card p-5">
          <h3 className="font-serif font-bold text-ink-900 dark:text-cream-100 mb-4">
            When Were Your Books Published?
          </h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.publication_years)
              .sort((a, b) => b[0].localeCompare(a[0]))
              .slice(0, 20)
              .map(([year, count]) => (
                <span 
                  key={year}
                  className="px-3 py-1.5 bg-cream-200 dark:bg-ink-700 rounded-full text-sm"
                >
                  <span className="font-medium text-ink-900 dark:text-cream-100">{year}</span>
                  <span className="text-ink-500 dark:text-ink-400 ml-1">({count})</span>
                </span>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, value, label, color }) {
  const colors = {
    sage: 'bg-sage-100 text-sage-700 dark:bg-sage-900/50 dark:text-sage-300',
    ocean: 'bg-ocean-100 text-ocean-700 dark:bg-ocean-900/50 dark:text-ocean-300',
    wine: 'bg-wine-100 text-wine-700 dark:bg-wine-900/50 dark:text-wine-300',
    primary: 'bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300',
  };
  
  const iconColors = {
    sage: 'text-sage-600 dark:text-sage-400',
    ocean: 'text-ocean-600 dark:text-ocean-400',
    wine: 'text-wine-600 dark:text-wine-400',
    primary: 'text-primary-600 dark:text-primary-400',
  };

  return (
    <div className={`card p-4 ${colors[color]}`}>
      <div className={`mb-2 ${iconColors[color]}`}>
        {icon}
      </div>
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-sm opacity-80">{label}</p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="skeleton w-8 h-8 rounded"></div>
        <div className="skeleton h-10 w-64"></div>
      </div>
      <div className="skeleton h-20 rounded-2xl"></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="skeleton h-28 rounded-2xl"></div>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="skeleton h-64 rounded-2xl"></div>
        <div className="skeleton h-64 rounded-2xl"></div>
      </div>
    </div>
  );
}

export default Statistics;
