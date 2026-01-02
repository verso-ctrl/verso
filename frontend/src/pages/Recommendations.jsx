import React, { useState } from 'react';
import { Sparkles, RefreshCw, BookOpen, Lightbulb } from 'lucide-react';
import { recommendationsAPI } from '../services/api';
import { useToast } from '../components/Toast';

function Recommendations() {
  const toast = useToast();
  const [recommendations, setRecommendations] = useState([]);
  const [reasoning, setReasoning] = useState('');
  const [loading, setLoading] = useState(false);
  const [count, setCount] = useState(10);

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      const response = await recommendationsAPI.getRecommendations({ count });
      setRecommendations(response.data.books || []);
      setReasoning(response.data.reasoning || '');
    } catch (error) {
      console.error('Failed to load recommendations:', error);
      toast.error('Add some books to your library first!');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-ink-900 dark:text-cream-100">
            AI Recommendations
          </h1>
        </div>
        <p className="text-ink-500 dark:text-ink-400">
          Personalized book suggestions powered by AI based on your reading history
        </p>
      </div>

      {/* Controls Card */}
      <div className="card p-6 bg-gradient-to-br from-primary-50 to-cream-100 dark:from-primary-950/50 dark:to-ink-800 border border-primary-100 dark:border-primary-900">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
          <div>
            <label className="block text-sm font-medium text-ink-700 dark:text-cream-300 mb-2">
              How many recommendations?
            </label>
            <div className="flex gap-2">
              {[5, 10, 15, 20].map(num => (
                <button
                  key={num}
                  onClick={() => setCount(num)}
                  className={`px-4 py-2 rounded-xl font-medium transition-all ${
                    count === num
                      ? 'bg-primary-600 text-white shadow-md'
                      : 'bg-white dark:bg-ink-700 text-ink-600 dark:text-cream-300 hover:bg-cream-100 dark:hover:bg-ink-600'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
          
          <button
            onClick={loadRecommendations}
            disabled={loading}
            className="btn-primary flex items-center gap-2 py-3 px-6 disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                <span>Get Recommendations</span>
              </>
            )}
          </button>
        </div>

        {/* AI Reasoning */}
        {reasoning && (
          <div className="mt-5 p-4 bg-white/80 dark:bg-ink-800/80 rounded-xl border border-primary-200 dark:border-primary-800 animate-fade-in">
            <div className="flex items-start gap-3">
              <Lightbulb className="h-5 w-5 text-primary-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-ink-700 dark:text-cream-300">
                <span className="font-semibold">AI Insight:</span> {reasoning}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-cream-300 dark:border-ink-700 rounded-full"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
            <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-primary-600 animate-pulse" />
          </div>
          <p className="text-ink-600 dark:text-ink-400 font-medium">
            AI is analyzing your reading preferences...
          </p>
        </div>
      )}

      {/* Recommendations Grid */}
      {!loading && recommendations.length > 0 && (
        <div className="animate-fade-up">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-serif font-bold text-ink-900 dark:text-cream-100">
              Your Personalized Picks
            </h2>
            <button
              onClick={loadRecommendations}
              className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {recommendations.map((rec, index) => (
              <RecommendationCard key={index} recommendation={rec} rank={index + 1} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && recommendations.length === 0 && (
        <div className="empty-state">
          <Sparkles className="empty-state-icon" />
          <h3 className="text-lg font-semibold text-ink-900 dark:text-cream-100 mb-2">
            Ready for recommendations?
          </h3>
          <p className="text-ink-500 dark:text-ink-400 max-w-md mx-auto mb-6">
            Click "Get Recommendations" to discover books tailored to your reading taste. 
            Make sure you have some books in your library first!
          </p>
        </div>
      )}
    </div>
  );
}

function RecommendationCard({ recommendation, rank }) {
  return (
    <div className="card p-5 hover:shadow-card-hover transition-all group">
      <div className="flex gap-4">
        {/* Rank Badge */}
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-md group-hover:scale-105 transition-transform">
            {rank}
          </div>
        </div>

        {/* Book Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-serif font-bold text-ink-900 dark:text-cream-100 line-clamp-1">
            {recommendation.title}
          </h3>
          <p className="text-sm text-ink-500 dark:text-ink-400 mt-0.5">
            by {recommendation.author}
          </p>

          {recommendation.genre && (
            <span className="inline-block mt-2 px-2.5 py-1 bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 text-xs font-medium rounded-full">
              {recommendation.genre}
            </span>
          )}

          {recommendation.description && (
            <p className="text-sm text-ink-600 dark:text-ink-300 mt-3 line-clamp-2">
              {recommendation.description}
            </p>
          )}

          {recommendation.reasoning && (
            <div className="mt-4 p-3 bg-primary-50 dark:bg-primary-900/30 rounded-xl">
              <p className="text-xs font-semibold text-primary-800 dark:text-primary-300 mb-1">
                Why you'll love this:
              </p>
              <p className="text-xs text-primary-700 dark:text-primary-400 line-clamp-2">
                {recommendation.reasoning}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Recommendations;
