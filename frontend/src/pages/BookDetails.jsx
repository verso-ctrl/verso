import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Star, Calendar, FileText, User, MessageSquare, ArrowLeft, Heart, BookOpen, Tag, Building } from 'lucide-react';
import { booksAPI, reviewsAPI } from '../services/api';
import BookActions from '../components/BookActions';

function BookDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookDetails();
  }, [id]);

  const loadBookDetails = async () => {
    setLoading(true);
    try {
      const [bookResponse, reviewsResponse] = await Promise.all([
        booksAPI.getBook(id),
        booksAPI.getBookReviews(id)
      ]);
      
      setBook(bookResponse.data);
      setReviews(reviewsResponse.data.reviews || []);
    } catch (error) {
      console.error('Failed to load book:', error);
    }
    setLoading(false);
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (!book) {
    return (
      <div className="empty-state">
        <BookOpen className="empty-state-icon" />
        <h2 className="text-xl font-serif font-bold text-ink-900 dark:text-cream-100 mb-2">
          Book not found
        </h2>
        <p className="text-ink-500 dark:text-ink-400 mb-6">
          This book may have been removed or doesn't exist.
        </p>
        <button onClick={() => navigate('/discover')} className="btn-primary">
          Discover Books
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-ink-500 dark:text-ink-400 hover:text-ink-700 dark:hover:text-cream-300 transition-colors group"
      >
        <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
        <span>Back</span>
      </button>

      {/* Book Header */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
          {/* Cover Section */}
          <div className="md:col-span-1 p-6 bg-gradient-to-br from-cream-100 to-cream-200 dark:from-ink-800 dark:to-ink-900 rounded-t-2xl md:rounded-l-2xl md:rounded-tr-none">
            <div className="max-w-[280px] mx-auto">
              <div className="book-cover aspect-[2/3] rounded-2xl shadow-book overflow-hidden">
                {book.cover_url ? (
                  <img
                    src={book.cover_url}
                    alt={book.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-cream-200 dark:bg-ink-700">
                    <BookOpen className="h-20 w-20 text-cream-400 dark:text-ink-500" />
                  </div>
                )}
              </div>

              {/* Add to Library Actions */}
              <div className="mt-6 relative z-10">
                <BookActions book={book} onSuccess={loadBookDetails} />
              </div>
            </div>
          </div>

          {/* Info Section */}
          <div className="md:col-span-2 p-6 md:p-8 space-y-6">
            {/* Title & Author */}
            <div>
              <h1 className="text-3xl md:text-4xl font-serif font-bold text-ink-900 dark:text-cream-100 mb-2">
                {book.title}
              </h1>
              <p className="text-xl text-ink-500 dark:text-ink-400">
                by <span className="text-ink-700 dark:text-cream-300">{book.author}</span>
              </p>
            </div>

            {/* Rating */}
            {book.average_rating > 0 && (
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-6 w-6 ${
                        i < Math.round(book.average_rating)
                          ? 'star-filled'
                          : 'star-empty'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-2xl font-bold text-ink-900 dark:text-cream-100">
                  {book.average_rating.toFixed(1)}
                </span>
                <span className="text-ink-500 dark:text-ink-400">
                  ({book.ratings_count} {book.ratings_count === 1 ? 'rating' : 'ratings'})
                </span>
              </div>
            )}

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 gap-4 py-4 border-t border-b border-cream-200 dark:border-ink-700">
              {book.published_year && (
                <div className="flex items-center gap-2 text-ink-600 dark:text-ink-300">
                  <Calendar className="h-5 w-5 text-ink-400" />
                  <span>Published {book.published_year}</span>
                </div>
              )}
              {book.page_count && (
                <div className="flex items-center gap-2 text-ink-600 dark:text-ink-300">
                  <FileText className="h-5 w-5 text-ink-400" />
                  <span>{book.page_count} pages</span>
                </div>
              )}
              {book.genre && (
                <div className="flex items-center gap-2">
                  <Tag className="h-5 w-5 text-ink-400" />
                  <span className="badge bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300">
                    {book.genre}
                  </span>
                </div>
              )}
              {book.publisher && (
                <div className="flex items-center gap-2 text-ink-600 dark:text-ink-300">
                  <Building className="h-5 w-5 text-ink-400" />
                  <span className="truncate">{book.publisher}</span>
                </div>
              )}
            </div>

            {book.isbn && (
              <div className="text-sm text-ink-500 dark:text-ink-400">
                <span className="font-medium">ISBN:</span> {book.isbn}
              </div>
            )}

            {/* Description */}
            {book.description && (
              <div>
                <h2 className="text-lg font-serif font-semibold text-ink-900 dark:text-cream-100 mb-3">
                  About This Book
                </h2>
                <p className="text-ink-600 dark:text-ink-300 leading-relaxed">
                  {book.description}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-6">
          <MessageSquare className="h-5 w-5 text-primary-600" />
          <h2 className="text-xl font-serif font-bold text-ink-900 dark:text-cream-100">
            Reviews {reviews.length > 0 && `(${reviews.length})`}
          </h2>
        </div>
        
        {reviews.length > 0 ? (
          <div className="space-y-6">
            {reviews.map((review, index) => (
              <ReviewCard key={index} review={review} bookId={id} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 text-cream-300 dark:text-ink-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-ink-900 dark:text-cream-100 mb-2">
              No reviews yet
            </h3>
            <p className="text-ink-500 dark:text-ink-400">
              Be the first to share your thoughts on this book!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function ReviewCard({ review, bookId }) {
  const [liked, setLiked] = useState(review.user_liked || false);
  const [likeCount, setLikeCount] = useState(review.like_count || 0);
  const [loading, setLoading] = useState(false);

  const handleLike = async () => {
    if (loading) return;
    setLoading(true);
    
    try {
      if (liked) {
        await reviewsAPI.unlikeReview(bookId, review.user.id);
        setLiked(false);
        setLikeCount(prev => Math.max(0, prev - 1));
      } else {
        await reviewsAPI.likeReview(bookId, review.user.id);
        setLiked(true);
        setLikeCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Failed to like review:', error);
    } finally {
      setLoading(false);
    }
  };

  const statusLabels = {
    read: 'Completed',
    currently_reading: 'Reading',
    want_to_read: 'Want to Read'
  };

  return (
    <div className="border-b border-cream-200 dark:border-ink-700 pb-6 last:border-b-0 last:pb-0">
      <div className="flex gap-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <Link to={`/users/${review.user.id}`}>
            <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-lg hover:shadow-md transition-shadow">
              {review.user.username?.[0]?.toUpperCase() || 'U'}
            </div>
          </Link>
        </div>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <Link
                to={`/users/${review.user.id}`}
                className="font-semibold text-ink-900 dark:text-cream-100 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                {review.user.username}
              </Link>
              {review.rating && (
                <div className="flex items-center gap-1 mt-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i < review.rating ? 'star-filled' : 'star-empty'}`}
                    />
                  ))}
                  <span className="ml-1 text-sm text-ink-500">{review.rating}/5</span>
                </div>
              )}
            </div>
            {review.created_at && (
              <span className="text-sm text-ink-400 flex-shrink-0">
                {new Date(review.created_at).toLocaleDateString()}
              </span>
            )}
          </div>
          
          {/* Review Text */}
          <p className="text-ink-700 dark:text-ink-300 leading-relaxed mb-3">
            {review.review}
          </p>
          
          {/* Footer */}
          <div className="flex items-center gap-4">
            {review.status && (
              <span className="badge bg-cream-200 dark:bg-ink-700 text-ink-600 dark:text-ink-300">
                {statusLabels[review.status] || review.status}
              </span>
            )}
            
            <button
              onClick={handleLike}
              disabled={loading}
              className={`flex items-center gap-1.5 text-sm transition-all disabled:opacity-50 group ${
                liked ? 'text-wine-600' : 'text-ink-400 hover:text-wine-500'
              }`}
            >
              <Heart 
                className={`h-4 w-4 transition-all group-hover:scale-110 ${
                  liked ? 'fill-wine-500 text-wine-500' : ''
                }`}
              />
              <span className={`font-medium ${liked ? 'text-wine-600' : ''}`}>
                {likeCount}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="skeleton h-6 w-20"></div>
      <div className="card overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
          <div className="p-6 bg-cream-100 dark:bg-ink-800">
            <div className="skeleton aspect-[2/3] rounded-2xl max-w-[280px] mx-auto"></div>
          </div>
          <div className="md:col-span-2 p-6 space-y-4">
            <div className="skeleton h-10 w-3/4"></div>
            <div className="skeleton h-6 w-1/2"></div>
            <div className="skeleton h-8 w-1/3"></div>
            <div className="skeleton h-32 w-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BookDetails;
