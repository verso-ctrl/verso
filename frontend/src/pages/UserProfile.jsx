import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { BookOpen, Users, UserPlus, UserMinus, Star, ArrowLeft, Library, MessageSquare } from 'lucide-react';
import { usersAPI, socialAPI } from '../services/api';
import { useToast } from '../components/Toast';

function UserProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [books, setBooks] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [activeTab, setActiveTab] = useState('books');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const [profileResponse, booksResponse, reviewsResponse] = await Promise.all([
        usersAPI.getUserProfile(userId),
        usersAPI.getUserBooks(userId),
        usersAPI.getUserReviews(userId)
      ]);
      setProfile(profileResponse.data);
      setBooks(booksResponse.data);
      setReviews(reviewsResponse.data);
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
    setLoading(false);
  };

  const handleFollow = async () => {
    setFollowLoading(true);
    try {
      if (profile.is_following) {
        await socialAPI.unfollowUser(userId);
        toast.success(`Unfollowed ${profile.username}`);
      } else {
        await socialAPI.followUser(userId);
        toast.success(`Following ${profile.username}`);
      }
      loadProfile();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update follow status');
    }
    setFollowLoading(false);
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (!profile) {
    return (
      <div className="empty-state">
        <Users className="empty-state-icon" />
        <h3 className="text-lg font-semibold text-ink-900 dark:text-cream-100 mb-2">
          User not found
        </h3>
        <button onClick={() => navigate('/users')} className="btn-primary">
          Find Readers
        </button>
      </div>
    );
  }

  const filteredBooks = statusFilter === 'all' 
    ? books 
    : books.filter(b => b.status === statusFilter);

  const statusLabels = {
    all: 'All',
    read: 'Completed',
    currently_reading: 'Reading',
    want_to_read: 'Want to Read'
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-up">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-ink-500 dark:text-ink-400 hover:text-ink-700 dark:hover:text-cream-300 transition-colors group"
      >
        <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
        <span>Back</span>
      </button>

      {/* Profile Header */}
      <div className="card overflow-hidden">
        <div className="bg-gradient-to-br from-primary-100 to-cream-100 dark:from-primary-900/40 dark:to-ink-800 p-6 md:p-8">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center text-white text-4xl font-bold shadow-lg flex-shrink-0">
              {profile.username?.[0]?.toUpperCase() || 'U'}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-serif font-bold text-ink-900 dark:text-cream-100">
                    {profile.username}
                  </h1>
                  {profile.full_name && (
                    <p className="text-lg text-ink-500 dark:text-ink-400 mt-1">
                      {profile.full_name}
                    </p>
                  )}
                </div>

                {/* Follow Button */}
                <button
                  onClick={handleFollow}
                  disabled={followLoading}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all disabled:opacity-50 ${
                    profile.is_following
                      ? 'bg-cream-200 dark:bg-ink-700 text-ink-700 dark:text-cream-300 hover:bg-cream-300 dark:hover:bg-ink-600'
                      : 'bg-primary-600 text-white hover:bg-primary-700 shadow-md'
                  }`}
                >
                  {profile.is_following ? (
                    <>
                      <UserMinus className="h-5 w-5" />
                      <span>Unfollow</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-5 w-5" />
                      <span>Follow</span>
                    </>
                  )}
                </button>
              </div>

              {profile.bio && (
                <p className="text-ink-600 dark:text-ink-300 mt-4 max-w-2xl">
                  {profile.bio}
                </p>
              )}
              
              {/* Stats */}
              <div className="flex items-center gap-6 mt-5">
                <div className="text-center">
                  <div className="text-2xl font-bold text-ink-900 dark:text-cream-100">
                    {profile.stats?.books_read || 0}
                  </div>
                  <div className="text-sm text-ink-500 dark:text-ink-400">Books Read</div>
                </div>
                <div className="w-px h-10 bg-cream-300 dark:bg-ink-700"></div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-ink-900 dark:text-cream-100">
                    {profile.stats?.followers || 0}
                  </div>
                  <div className="text-sm text-ink-500 dark:text-ink-400">Followers</div>
                </div>
                <div className="w-px h-10 bg-cream-300 dark:bg-ink-700"></div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-ink-900 dark:text-cream-100">
                    {profile.stats?.following || 0}
                  </div>
                  <div className="text-sm text-ink-500 dark:text-ink-400">Following</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-cream-200/50 dark:bg-ink-800/50 rounded-2xl">
        <button
          onClick={() => setActiveTab('books')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'books'
              ? 'bg-white dark:bg-ink-700 text-ink-900 dark:text-cream-100 shadow-sm'
              : 'text-ink-500 dark:text-ink-400 hover:text-ink-700 dark:hover:text-cream-300'
          }`}
        >
          <Library className="h-4 w-4" />
          <span>Library</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-cream-200 dark:bg-ink-600">
            {books.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('reviews')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'reviews'
              ? 'bg-white dark:bg-ink-700 text-ink-900 dark:text-cream-100 shadow-sm'
              : 'text-ink-500 dark:text-ink-400 hover:text-ink-700 dark:hover:text-cream-300'
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          <span>Reviews</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-cream-200 dark:bg-ink-600">
            {reviews.length}
          </span>
        </button>
      </div>

      {/* Content */}
      {activeTab === 'books' && (
        <div className="space-y-5">
          {/* Status Filter */}
          <div className="flex gap-2 flex-wrap">
            {Object.entries(statusLabels).map(([status, label]) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  statusFilter === status
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'bg-cream-200 dark:bg-ink-700 text-ink-600 dark:text-cream-300 hover:bg-cream-300 dark:hover:bg-ink-600'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Books Grid */}
          {filteredBooks.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredBooks.map(({ book, rating }) => (
                <Link key={book.id} to={`/books/${book.id}`} className="book-card group">
                  <div className="book-cover aspect-[2/3]">
                    {book.cover_url ? (
                      <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-cream-400 dark:text-ink-600">
                        <BookOpen className="h-10 w-10" />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-semibold text-ink-900 dark:text-cream-100 line-clamp-2 group-hover:text-primary-600 transition-colors">
                      {book.title}
                    </h3>
                    {rating && (
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="h-3 w-3 star-filled" />
                        <span className="text-xs text-ink-500">{rating}/5</span>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty-state py-12">
              <BookOpen className="empty-state-icon" />
              <p className="text-ink-500 dark:text-ink-400">No books in this category</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'reviews' && (
        <div className="space-y-4">
          {reviews.length > 0 ? (
            reviews.map((review, index) => (
              <Link key={index} to={`/books/${review.book.id}`} className="card p-5 block group">
                <div className="flex gap-4">
                  <div className="w-16 h-24 bg-cream-200 dark:bg-ink-700 rounded-xl overflow-hidden flex-shrink-0">
                    {review.book.cover_url ? (
                      <img src={review.book.cover_url} alt={review.book.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-cream-400 dark:text-ink-500">
                        <BookOpen className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-ink-900 dark:text-cream-100 group-hover:text-primary-600 transition-colors">
                      {review.book.title}
                    </h3>
                    <p className="text-sm text-ink-500 dark:text-ink-400">
                      {review.book.author}
                    </p>
                    {review.rating && (
                      <div className="flex items-center gap-0.5 mt-2">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${i < review.rating ? 'star-filled' : 'star-empty'}`}
                          />
                        ))}
                      </div>
                    )}
                    <p className="text-ink-600 dark:text-ink-300 mt-2 line-clamp-2">
                      {review.review}
                    </p>
                    {review.created_at && (
                      <p className="text-xs text-ink-400 mt-2">
                        {new Date(review.created_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="empty-state py-12">
              <MessageSquare className="empty-state-icon" />
              <p className="text-ink-500 dark:text-ink-400">No reviews yet</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="skeleton h-6 w-20"></div>
      <div className="card p-8">
        <div className="flex items-start gap-6">
          <div className="skeleton w-24 h-24 rounded-2xl"></div>
          <div className="flex-1 space-y-3">
            <div className="skeleton h-8 w-48"></div>
            <div className="skeleton h-5 w-32"></div>
            <div className="skeleton h-16 w-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserProfile;
