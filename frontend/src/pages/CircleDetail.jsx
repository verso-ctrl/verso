import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Users, Trophy, Target, Plus, Clock, BookOpen, Copy, Check, 
  ChevronLeft, Flame, Star, Medal, Crown, ArrowRight, Calendar,
  TrendingUp, Zap, Settings, LogOut, Share2, RefreshCw
} from 'lucide-react';
import { circlesAPI, booksAPI, userBooksAPI } from '../services/api';
import { useToast } from '../components/Toast';
import { useAuthStore } from '../stores';

function CircleDetail() {
  const { circleId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuthStore();
  
  const [circle, setCircle] = useState(null);
  const [challenges, setChallenges] = useState([]);
  const [activity, setActivity] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('challenges');
  const [showCreateChallenge, setShowCreateChallenge] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    loadCircleData();
  }, [circleId]);

  const loadCircleData = async () => {
    try {
      const [circleRes, challengesRes, activityRes, leaderboardRes] = await Promise.all([
        circlesAPI.getCircle(circleId),
        circlesAPI.getChallenges(circleId, false),
        circlesAPI.getActivity(circleId),
        circlesAPI.getLeaderboard(circleId)
      ]);
      
      setCircle(circleRes.data);
      setChallenges(challengesRes.data);
      setActivity(activityRes.data);
      setLeaderboard(leaderboardRes.data);
    } catch (error) {
      console.error('Failed to load circle:', error);
      if (error.response?.status === 403 || error.response?.status === 404) {
        navigate('/circles');
      }
    }
    setLoading(false);
  };

  const handleCopyInviteCode = () => {
    if (circle?.invite_code) {
      navigator.clipboard.writeText(circle.invite_code);
      setCopiedCode(true);
      toast.success('Invite code copied!');
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleLeaveCircle = async () => {
    if (!window.confirm('Are you sure you want to leave this circle?')) return;
    
    try {
      await circlesAPI.leaveCircle(circleId);
      toast.success('You\'ve left the circle');
      navigate('/circles');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to leave circle');
    }
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (!circle) {
    return null;
  }

  const activeChallenges = challenges.filter(c => c.is_active && new Date(c.end_date) >= new Date());
  const pastChallenges = challenges.filter(c => !c.is_active || new Date(c.end_date) < new Date());
  const myRank = leaderboard.findIndex(m => m.is_current_user) + 1;

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Back link */}
      <Link 
        to="/circles" 
        className="inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-700 dark:hover:text-cream-300 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        All Circles
      </Link>

      {/* Circle Header */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              {circle.name[0].toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-serif font-bold text-ink-900 dark:text-cream-100">
                {circle.name}
              </h1>
              {circle.description && (
                <p className="text-ink-600 dark:text-ink-300 mt-1">
                  {circle.description}
                </p>
              )}
              <div className="flex items-center gap-4 mt-2 text-sm text-ink-500 dark:text-ink-400">
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {circle.member_count} members
                </span>
                <span>Created by {circle.creator_username}</span>
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-2">
            {circle.invite_code && (
              <button
                onClick={handleCopyInviteCode}
                className="btn-secondary text-sm flex items-center gap-2"
              >
                {copiedCode ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copiedCode ? 'Copied!' : circle.invite_code}
              </button>
            )}
            <button
              onClick={handleLeaveCircle}
              className="btn-icon text-wine-600 hover:bg-wine-50 dark:hover:bg-wine-900/30"
              title="Leave circle"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-cream-200 dark:border-ink-700">
          <div className="text-center">
            <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">
              #{myRank || '—'}
            </p>
            <p className="text-sm text-ink-500 dark:text-ink-400">Your Rank</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-ocean-600 dark:text-ocean-400">
              {activeChallenges.length}
            </p>
            <p className="text-sm text-ink-500 dark:text-ink-400">Active Challenges</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-sage-600 dark:text-sage-400">
              {leaderboard.find(m => m.is_current_user)?.circle_points || 0}
            </p>
            <p className="text-sm text-ink-500 dark:text-ink-400">Your Points</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-cream-200/50 dark:bg-ink-800/50 rounded-xl overflow-x-auto">
        {[
          { id: 'challenges', label: 'Challenges', icon: Target },
          { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
          { id: 'activity', label: 'Activity', icon: Zap },
          { id: 'members', label: 'Members', icon: Users },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-ink-700 text-ink-900 dark:text-cream-100 shadow-sm'
                  : 'text-ink-500 hover:text-ink-700 dark:hover:text-cream-300'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'challenges' && (
        <ChallengesTab 
          challenges={activeChallenges}
          pastChallenges={pastChallenges}
          circleId={circleId}
          onCreateClick={() => setShowCreateChallenge(true)}
          onProgressUpdate={loadCircleData}
        />
      )}
      
      {activeTab === 'leaderboard' && (
        <LeaderboardTab leaderboard={leaderboard} />
      )}
      
      {activeTab === 'activity' && (
        <ActivityTab activity={activity} />
      )}
      
      {activeTab === 'members' && (
        <MembersTab members={circle.members} />
      )}

      {/* Create Challenge Modal */}
      {showCreateChallenge && (
        <CreateChallengeModal
          circleId={circleId}
          onClose={() => setShowCreateChallenge(false)}
          onCreated={() => {
            setShowCreateChallenge(false);
            loadCircleData();
          }}
        />
      )}
    </div>
  );
}

function ChallengesTab({ challenges, pastChallenges, circleId, onCreateClick, onProgressUpdate }) {
  return (
    <div className="space-y-6">
      {/* Active Challenges */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-ink-900 dark:text-cream-100">
          Active Challenges
        </h2>
        <button onClick={onCreateClick} className="btn-primary text-sm flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Challenge
        </button>
      </div>

      {challenges.length > 0 ? (
        <div className="space-y-4">
          {challenges.map(challenge => (
            <ChallengeCard 
              key={challenge.id} 
              challenge={challenge} 
              circleId={circleId}
              onProgressUpdate={onProgressUpdate}
            />
          ))}
        </div>
      ) : (
        <div className="card p-8 text-center">
          <Target className="h-12 w-12 text-ink-300 dark:text-ink-600 mx-auto mb-3" />
          <h3 className="font-semibold text-ink-900 dark:text-cream-100 mb-1">
            No Active Challenges
          </h3>
          <p className="text-sm text-ink-500 dark:text-ink-400 mb-4">
            Start a book race or reading challenge to compete with your circle
          </p>
          <button onClick={onCreateClick} className="btn-primary text-sm">
            Create First Challenge
          </button>
        </div>
      )}

      {/* Past Challenges */}
      {pastChallenges.length > 0 && (
        <>
          <h2 className="text-lg font-semibold text-ink-900 dark:text-cream-100 mt-8">
            Past Challenges
          </h2>
          <div className="space-y-3 opacity-75">
            {pastChallenges.slice(0, 5).map(challenge => (
              <ChallengeCard 
                key={challenge.id} 
                challenge={challenge} 
                circleId={circleId}
                isPast={true}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ChallengeCard({ challenge, circleId, isPast = false, onProgressUpdate }) {
  const toast = useToast();
  const navigate = useNavigate();
  const [updating, setUpdating] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [addingToLibrary, setAddingToLibrary] = useState(false);
  
  const myProgress = challenge.progress.find(p => p.is_current_user) || 
                     challenge.progress[0];
  
  const isBookRace = challenge.challenge_type === 'book_race';
  const maxValue = isBookRace ? challenge.target_book_pages : challenge.target_count;
  const libraryStatus = challenge.user_library_status;
  
  const getTypeLabel = () => {
    switch (challenge.challenge_type) {
      case 'book_race': return 'Book Race';
      case 'books_count': return 'Books Challenge';
      case 'pages_count': return 'Pages Challenge';
      case 'genre_challenge': return `${challenge.target_genre} Challenge`;
      default: return 'Challenge';
    }
  };

  const getTimeRemaining = () => {
    const end = new Date(challenge.end_date);
    const now = new Date();
    const days = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    if (days < 0) return 'Ended';
    if (days === 0) return 'Ends today';
    if (days === 1) return '1 day left';
    return `${days} days left`;
  };

  const handleAddToLibrary = async () => {
    if (!challenge.target_book_id) return;
    setAddingToLibrary(true);
    try {
      await userBooksAPI.addBookToLibrary({
        book_id: challenge.target_book_id,
        status: 'currently_reading'
      });
      toast.success('Book added to your library!');
      onProgressUpdate?.();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add book');
    }
    setAddingToLibrary(false);
  };

  const handleSyncFromLibrary = async () => {
    setSyncing(true);
    try {
      const response = await circlesAPI.syncFromLibrary(circleId, challenge.id);
      if (response.data.completed_now) {
        toast.success('🎉 Challenge completed! Great job!');
      } else if (response.data.current_value > (myProgress?.current_value || 0)) {
        toast.success(`Progress synced! Now at page ${response.data.current_value}`);
      } else {
        toast.info('Your challenge progress is already up to date');
      }
      onProgressUpdate?.();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to sync');
    }
    setSyncing(false);
  };

  return (
    <div className={`card p-5 ${isPast ? 'bg-cream-50 dark:bg-ink-900/50' : ''}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          {isBookRace && challenge.target_book_cover ? (
            <Link to={`/books/${challenge.target_book_id}`} className="shrink-0">
              <img 
                src={challenge.target_book_cover} 
                alt={challenge.target_book_title}
                className="w-14 h-20 rounded-lg object-cover shadow-sm hover:shadow-md transition-shadow"
              />
            </Link>
          ) : (
            <div className="w-12 h-12 bg-ocean-100 dark:bg-ocean-900/50 rounded-xl flex items-center justify-center">
              <Target className="h-6 w-6 text-ocean-600 dark:text-ocean-400" />
            </div>
          )}
          <div className="min-w-0">
            <span className="text-xs font-medium text-ocean-600 dark:text-ocean-400 uppercase tracking-wider">
              {getTypeLabel()}
            </span>
            <h3 className="font-semibold text-ink-900 dark:text-cream-100">
              {challenge.name}
            </h3>
            {isBookRace && challenge.target_book_title && (
              <Link 
                to={`/books/${challenge.target_book_id}`}
                className="group flex items-center gap-1 mt-1"
              >
                <BookOpen className="h-3.5 w-3.5 text-ink-400 group-hover:text-primary-500" />
                <span className="text-sm text-ink-600 dark:text-ink-300 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                  {challenge.target_book_title}
                </span>
                {challenge.target_book_author && (
                  <span className="text-xs text-ink-400">
                    by {challenge.target_book_author}
                  </span>
                )}
              </Link>
            )}
          </div>
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded-full shrink-0 ${
          isPast 
            ? 'bg-ink-100 dark:bg-ink-700 text-ink-500'
            : 'bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300'
        }`}>
          {getTimeRemaining()}
        </span>
      </div>

      {/* Library Status Banner for Book Races */}
      {isBookRace && !isPast && libraryStatus && (
        <div className={`mb-4 p-3 rounded-xl flex items-center justify-between ${
          libraryStatus.in_library
            ? 'bg-sage-50 dark:bg-sage-900/30 border border-sage-200 dark:border-sage-800'
            : 'bg-ocean-50 dark:bg-ocean-900/30 border border-ocean-200 dark:border-ocean-800'
        }`}>
          {libraryStatus.in_library ? (
            <>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-sage-600 dark:text-sage-400" />
                <span className="text-sm text-sage-800 dark:text-sage-200">
                  In your library • Page {libraryStatus.current_page || 0} of {challenge.target_book_pages || '?'}
                </span>
              </div>
              <button
                onClick={handleSyncFromLibrary}
                disabled={syncing}
                className="text-xs font-medium text-sage-700 dark:text-sage-300 hover:text-sage-900 dark:hover:text-sage-100 flex items-center gap-1 disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing...' : 'Sync Progress'}
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-ocean-600 dark:text-ocean-400" />
                <span className="text-sm text-ocean-800 dark:text-ocean-200">
                  Not in your library yet
                </span>
              </div>
              <button
                onClick={handleAddToLibrary}
                disabled={addingToLibrary}
                className="text-xs font-medium bg-ocean-600 hover:bg-ocean-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 disabled:opacity-50 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                {addingToLibrary ? 'Adding...' : 'Add to Library'}
              </button>
            </>
          )}
        </div>
      )}

      {/* Race Tracker - The Main Feature! */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-xs text-ink-500 dark:text-ink-400">
          <span>Progress Race</span>
          <span>{maxValue || '?'} {isBookRace ? 'pages' : 'books'} goal</span>
        </div>
        
        {/* Race bars for each participant */}
        <div className="space-y-2 bg-cream-100 dark:bg-ink-800 rounded-xl p-3">
          {challenge.progress.slice(0, 5).map((participant, index) => (
            <RaceBar 
              key={participant.user_id}
              participant={participant}
              maxValue={maxValue}
              rank={index + 1}
              isBookRace={isBookRace}
            />
          ))}
        </div>
      </div>

      {/* Actions */}
      {!isPast && (
        <div className="flex items-center justify-between pt-3 border-t border-cream-200 dark:border-ink-700">
          <div className="text-sm text-ink-500 dark:text-ink-400">
            {challenge.progress.filter(p => p.completed).length} of {challenge.progress.length} completed
          </div>
          <button
            onClick={() => setShowUpdateModal(true)}
            className="btn-primary text-sm"
          >
            Update Progress
          </button>
        </div>
      )}

      {/* Update Progress Modal */}
      {showUpdateModal && (
        <UpdateProgressModal
          challenge={challenge}
          circleId={circleId}
          onClose={() => setShowUpdateModal(false)}
          onUpdated={() => {
            setShowUpdateModal(false);
            onProgressUpdate?.();
          }}
        />
      )}
    </div>
  );
}

function RaceBar({ participant, maxValue, rank, isBookRace }) {
  const percentage = Math.min((participant.current_value / maxValue) * 100, 100);
  
  const getRankIcon = () => {
    switch (rank) {
      case 1: return <Crown className="h-4 w-4 text-yellow-500" />;
      case 2: return <Medal className="h-4 w-4 text-gray-400" />;
      case 3: return <Medal className="h-4 w-4 text-amber-600" />;
      default: return <span className="text-xs font-bold text-ink-400 w-4 text-center">{rank}</span>;
    }
  };

  const getBarColor = () => {
    if (participant.completed) return 'from-sage-500 to-sage-400';
    switch (rank) {
      case 1: return 'from-yellow-500 to-yellow-400';
      case 2: return 'from-gray-400 to-gray-300';
      case 3: return 'from-amber-500 to-amber-400';
      default: return 'from-primary-500 to-primary-400';
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="w-6 flex justify-center">
        {getRankIcon()}
      </div>
      <div className="w-20 truncate">
        <span className="text-xs font-medium text-ink-700 dark:text-cream-300">
          {participant.username}
        </span>
      </div>
      <div className="flex-1 h-6 bg-cream-200 dark:bg-ink-700 rounded-full overflow-hidden relative">
        <div 
          className={`h-full bg-gradient-to-r ${getBarColor()} rounded-full transition-all duration-700 ease-out flex items-center justify-end pr-2`}
          style={{ width: `${Math.max(percentage, 5)}%` }}
        >
          {percentage > 15 && (
            <span className="text-[10px] font-bold text-white">
              {participant.current_value}
            </span>
          )}
        </div>
        {percentage <= 15 && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-medium text-ink-500">
            {participant.current_value}
          </span>
        )}
        {participant.completed && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <Check className="h-4 w-4 text-sage-700" />
          </div>
        )}
      </div>
      <div className="w-12 text-right">
        <span className="text-xs text-ink-500 dark:text-ink-400">
          {Math.round(percentage)}%
        </span>
      </div>
    </div>
  );
}

function UpdateProgressModal({ challenge, circleId, onClose, onUpdated }) {
  const toast = useToast();
  const [value, setValue] = useState('');
  const [updating, setUpdating] = useState(false);
  
  const isBookRace = challenge.challenge_type === 'book_race';
  const maxValue = isBookRace ? challenge.target_book_pages : challenge.target_count;
  const currentProgress = challenge.progress.find(p => p.is_current_user) || challenge.progress[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    const numValue = parseInt(value);
    if (isNaN(numValue) || numValue < 0) {
      toast.error('Please enter a valid number');
      return;
    }

    setUpdating(true);
    try {
      const result = await circlesAPI.updateProgress(circleId, challenge.id, numValue);
      if (result.data.completed_now) {
        toast.success('🎉 Challenge completed! Great job!');
      } else {
        toast.success('Progress updated!');
      }
      onUpdated();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update progress');
    }
    setUpdating(false);
  };

  return (
    <div className="fixed inset-0 bg-ink-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-ink-800 rounded-2xl w-full max-w-md shadow-modal animate-scale-in">
        <div className="p-6 border-b border-cream-200 dark:border-ink-700">
          <h2 className="text-xl font-serif font-bold text-ink-900 dark:text-cream-100">
            Update Your Progress
          </h2>
          <p className="text-sm text-ink-500 dark:text-ink-400 mt-1">
            {challenge.name}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink-700 dark:text-cream-300 mb-1.5">
              {isBookRace ? 'Current Page' : 'Books Completed'}
            </label>
            <input
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={`Current: ${currentProgress?.current_value || 0}`}
              className="input-field text-center text-xl"
              min="0"
              max={maxValue}
              autoFocus
            />
            <p className="text-xs text-ink-500 dark:text-ink-400 text-center mt-2">
              Goal: {maxValue} {isBookRace ? 'pages' : 'books'}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={updating}
              className="flex-1 btn-primary"
            >
              {updating ? 'Updating...' : 'Update'}
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

function LeaderboardTab({ leaderboard }) {
  return (
    <div className="card overflow-hidden">
      <div className="p-4 border-b border-cream-200 dark:border-ink-700">
        <h2 className="font-semibold text-ink-900 dark:text-cream-100 flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary-500" />
          Circle Leaderboard
        </h2>
      </div>
      
      <div className="divide-y divide-cream-200 dark:divide-ink-700">
        {leaderboard.map((member, index) => (
          <div 
            key={member.user_id}
            className={`flex items-center gap-4 p-4 ${
              member.is_current_user ? 'bg-primary-50 dark:bg-primary-900/20' : ''
            }`}
          >
            <div className="w-8 text-center">
              {index === 0 ? (
                <Crown className="h-6 w-6 text-yellow-500 mx-auto" />
              ) : index === 1 ? (
                <Medal className="h-6 w-6 text-gray-400 mx-auto" />
              ) : index === 2 ? (
                <Medal className="h-6 w-6 text-amber-600 mx-auto" />
              ) : (
                <span className="text-lg font-bold text-ink-400">{member.rank}</span>
              )}
            </div>
            
            <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
              {member.username[0].toUpperCase()}
            </div>
            
            <div className="flex-1">
              <p className={`font-medium ${
                member.is_current_user 
                  ? 'text-primary-700 dark:text-primary-300' 
                  : 'text-ink-900 dark:text-cream-100'
              }`}>
                {member.username}
                {member.is_current_user && <span className="text-xs ml-2">(You)</span>}
              </p>
              <p className="text-xs text-ink-500 dark:text-ink-400">
                {member.challenges_completed} challenges completed
              </p>
            </div>
            
            <div className="text-right">
              <p className="text-xl font-bold text-primary-600 dark:text-primary-400">
                {member.circle_points}
              </p>
              <p className="text-xs text-ink-500">points</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActivityTab({ activity }) {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'joined': return <Users className="h-4 w-4 text-ocean-500" />;
      case 'challenge_complete': return <Trophy className="h-4 w-4 text-yellow-500" />;
      case 'progress_update': return <TrendingUp className="h-4 w-4 text-sage-500" />;
      case 'challenge_created': return <Target className="h-4 w-4 text-primary-500" />;
      default: return <Zap className="h-4 w-4 text-ink-400" />;
    }
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="card">
      <div className="p-4 border-b border-cream-200 dark:border-ink-700">
        <h2 className="font-semibold text-ink-900 dark:text-cream-100 flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary-500" />
          Recent Activity
        </h2>
      </div>
      
      {activity.length > 0 ? (
        <div className="divide-y divide-cream-200 dark:divide-ink-700">
          {activity.map((item) => (
            <div key={item.id} className="flex items-start gap-3 p-4">
              <div className="w-8 h-8 bg-cream-100 dark:bg-ink-700 rounded-full flex items-center justify-center">
                {getActivityIcon(item.activity_type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-ink-900 dark:text-cream-100">
                  <span className="font-medium">{item.username}</span>{' '}
                  <span className="text-ink-600 dark:text-ink-300">{item.content}</span>
                </p>
                <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">
                  {formatTime(item.created_at)}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-8 text-center text-ink-500 dark:text-ink-400">
          No activity yet
        </div>
      )}
    </div>
  );
}

function MembersTab({ members }) {
  return (
    <div className="card">
      <div className="p-4 border-b border-cream-200 dark:border-ink-700">
        <h2 className="font-semibold text-ink-900 dark:text-cream-100 flex items-center gap-2">
          <Users className="h-5 w-5 text-primary-500" />
          Members ({members.length})
        </h2>
      </div>
      
      <div className="grid sm:grid-cols-2 gap-px bg-cream-200 dark:bg-ink-700">
        {members.map((member) => (
          <Link
            key={member.user_id}
            to={`/users/${member.user_id}`}
            className="flex items-center gap-3 p-4 bg-white dark:bg-ink-800 hover:bg-cream-50 dark:hover:bg-ink-700 transition-colors"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
              {member.username[0].toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="font-medium text-ink-900 dark:text-cream-100 flex items-center gap-2">
                {member.username}
                {member.role === 'admin' && (
                  <span className="text-xs bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 px-1.5 py-0.5 rounded">
                    Admin
                  </span>
                )}
              </p>
              <p className="text-xs text-ink-500 dark:text-ink-400">
                {member.circle_points} points
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function CreateChallengeModal({ circleId, onClose, onCreated }) {
  const toast = useToast();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    challenge_type: 'book_race',
    target_book_id: null,
    target_count: 5,
    target_genre: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState(false);

  const challengeTypes = [
    { 
      value: 'book_race', 
      label: 'Book Race', 
      description: 'Race to finish a specific book',
      icon: BookOpen 
    },
    { 
      value: 'books_count', 
      label: 'Books Challenge', 
      description: 'Read X books by the deadline',
      icon: Target 
    },
    { 
      value: 'pages_count', 
      label: 'Pages Challenge', 
      description: 'Read X total pages',
      icon: TrendingUp 
    },
  ];

  const searchBooks = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const response = await booksAPI.searchExternal(searchQuery, 10);
      setSearchResults(response.data);
    } catch (error) {
      console.error('Search failed:', error);
    }
    setSearching(false);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('Please enter a challenge name');
      return;
    }
    if (!formData.end_date) {
      toast.error('Please select an end date');
      return;
    }
    if (formData.challenge_type === 'book_race' && !formData.target_book_id) {
      toast.error('Please select a book for the race');
      return;
    }

    setCreating(true);
    try {
      const submitData = {
        ...formData,
        start_date: new Date(formData.start_date).toISOString(),
        end_date: new Date(formData.end_date).toISOString()
      };
      
      await circlesAPI.createChallenge(circleId, submitData);
      toast.success('Challenge created! Let the race begin! 🏁');
      onCreated();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create challenge');
    }
    setCreating(false);
  };

  const selectBook = async (book) => {
    // If book doesn't have an ID, we need to import it first
    let bookId = book.id;
    if (!bookId) {
      try {
        const response = await booksAPI.importBook(book);
        bookId = response.data.id;
      } catch (error) {
        toast.error('Failed to select book');
        return;
      }
    }
    
    setSelectedBook(book);
    setFormData({ ...formData, target_book_id: bookId });
    setSearchResults([]);
    setSearchQuery('');
  };

  return (
    <div className="fixed inset-0 bg-ink-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-ink-800 rounded-2xl w-full max-w-lg shadow-modal animate-scale-in max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-cream-200 dark:border-ink-700 sticky top-0 bg-white dark:bg-ink-800">
          <h2 className="text-xl font-serif font-bold text-ink-900 dark:text-cream-100">
            Create Challenge
          </h2>
          <p className="text-sm text-ink-500 dark:text-ink-400 mt-1">
            Step {step} of 2
          </p>
        </div>

        <div className="p-6 space-y-4">
          {step === 1 ? (
            <>
              {/* Challenge Type Selection */}
              <div>
                <label className="block text-sm font-medium text-ink-700 dark:text-cream-300 mb-2">
                  Challenge Type
                </label>
                <div className="space-y-2">
                  {challengeTypes.map(type => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, challenge_type: type.value })}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                          formData.challenge_type === type.value
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                            : 'border-cream-200 dark:border-ink-700 hover:border-cream-300'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          formData.challenge_type === type.value
                            ? 'bg-primary-500 text-white'
                            : 'bg-cream-100 dark:bg-ink-700 text-ink-500'
                        }`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium text-ink-900 dark:text-cream-100">{type.label}</p>
                          <p className="text-xs text-ink-500 dark:text-ink-400">{type.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Book Selection for Book Race */}
              {formData.challenge_type === 'book_race' && (
                <div>
                  <label className="block text-sm font-medium text-ink-700 dark:text-cream-300 mb-2">
                    Select Book
                  </label>
                  {selectedBook ? (
                    <div className="flex items-center gap-3 p-3 bg-cream-100 dark:bg-ink-700 rounded-xl">
                      {selectedBook.cover_url && (
                        <img src={selectedBook.cover_url} alt="" className="w-10 h-14 rounded object-cover" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-ink-900 dark:text-cream-100 truncate">{selectedBook.title}</p>
                        <p className="text-xs text-ink-500">{selectedBook.author}</p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedBook(null);
                          setFormData({ ...formData, target_book_id: null });
                        }}
                        className="text-ink-400 hover:text-ink-600"
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && searchBooks()}
                          placeholder="Search for a book..."
                          className="input-field flex-1"
                        />
                        <button onClick={searchBooks} className="btn-primary" disabled={searching}>
                          Search
                        </button>
                      </div>
                      {searchResults.length > 0 && (
                        <div className="max-h-48 overflow-y-auto space-y-1 border border-cream-200 dark:border-ink-700 rounded-xl p-2">
                          {searchResults.map((book, idx) => (
                            <button
                              key={idx}
                              onClick={() => selectBook(book)}
                              className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-cream-100 dark:hover:bg-ink-700 text-left"
                            >
                              {book.cover_url && (
                                <img src={book.cover_url} alt="" className="w-8 h-10 rounded object-cover" />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-ink-900 dark:text-cream-100 truncate">{book.title}</p>
                                <p className="text-xs text-ink-500 truncate">{book.author}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Target Count for other challenges */}
              {formData.challenge_type !== 'book_race' && (
                <div>
                  <label className="block text-sm font-medium text-ink-700 dark:text-cream-300 mb-1.5">
                    Target {formData.challenge_type === 'pages_count' ? 'Pages' : 'Books'}
                  </label>
                  <input
                    type="number"
                    value={formData.target_count}
                    onChange={(e) => setFormData({ ...formData, target_count: parseInt(e.target.value) || 0 })}
                    className="input-field"
                    min="1"
                  />
                </div>
              )}

              <button
                onClick={() => setStep(2)}
                className="w-full btn-primary"
              >
                Next
              </button>
            </>
          ) : (
            <>
              {/* Challenge Details */}
              <div>
                <label className="block text-sm font-medium text-ink-700 dark:text-cream-300 mb-1.5">
                  Challenge Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., January Reading Sprint"
                  className="input-field"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-700 dark:text-cream-300 mb-1.5">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional details about this challenge..."
                  className="input-field h-20 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ink-700 dark:text-cream-300 mb-1.5">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-700 dark:text-cream-300 mb-1.5">
                    End Date *
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="input-field"
                    min={formData.start_date}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setStep(1)}
                  className="btn-secondary"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={creating}
                  className="flex-1 btn-primary"
                >
                  {creating ? 'Creating...' : 'Create Challenge'}
                </button>
              </div>
            </>
          )}

          {step === 1 && (
            <button
              type="button"
              onClick={onClose}
              className="w-full btn-ghost"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="skeleton h-6 w-24"></div>
      <div className="skeleton h-48 rounded-2xl"></div>
      <div className="skeleton h-12 w-96 rounded-xl"></div>
      <div className="skeleton h-64 rounded-2xl"></div>
    </div>
  );
}

export default CircleDetail;
