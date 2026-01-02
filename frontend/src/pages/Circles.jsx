import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Users, Plus, Trophy, Target, Lock, Globe, ChevronRight, 
  Sparkles, Search, Copy, Check, UserPlus
} from 'lucide-react';
import { circlesAPI } from '../services/api';
import { useToast } from '../components/Toast';

function Circles() {
  const navigate = useNavigate();
  const toast = useToast();
  const [myCircles, setMyCircles] = useState([]);
  const [discoverCircles, setDiscoverCircles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [activeTab, setActiveTab] = useState('my-circles');

  useEffect(() => {
    loadCircles();
  }, []);

  const loadCircles = async () => {
    try {
      const [myRes, discoverRes] = await Promise.all([
        circlesAPI.getMyCircles(),
        circlesAPI.discoverCircles(12)
      ]);
      setMyCircles(myRes.data);
      setDiscoverCircles(discoverRes.data);
    } catch (error) {
      console.error('Failed to load circles:', error);
    }
    setLoading(false);
  };

  const handleJoinCircle = async (circleId) => {
    try {
      await circlesAPI.joinCircle(circleId);
      toast.success('Successfully joined the circle!');
      loadCircles();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to join circle');
    }
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-ink-900 dark:text-cream-100 flex items-center gap-3">
            <Users className="h-8 w-8 text-primary-500" />
            Reading Circles
          </h1>
          <p className="text-ink-500 dark:text-ink-400 mt-1">
            Compete with friends, track progress together, and celebrate reading
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowJoinModal(true)}
            className="btn-secondary flex items-center gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Join Circle
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Circle
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-cream-200/50 dark:bg-ink-800/50 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('my-circles')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'my-circles'
              ? 'bg-white dark:bg-ink-700 text-ink-900 dark:text-cream-100 shadow-sm'
              : 'text-ink-500 hover:text-ink-700 dark:hover:text-cream-300'
          }`}
        >
          My Circles ({myCircles.length})
        </button>
        <button
          onClick={() => setActiveTab('discover')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'discover'
              ? 'bg-white dark:bg-ink-700 text-ink-900 dark:text-cream-100 shadow-sm'
              : 'text-ink-500 hover:text-ink-700 dark:hover:text-cream-300'
          }`}
        >
          Discover
        </button>
      </div>

      {/* Content */}
      {activeTab === 'my-circles' ? (
        myCircles.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {myCircles.map(circle => (
              <CircleCard key={circle.id} circle={circle} isMember={true} />
            ))}
          </div>
        ) : (
          <EmptyState onCreateClick={() => setShowCreateModal(true)} />
        )
      ) : (
        discoverCircles.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {discoverCircles.map(circle => (
              <CircleCard 
                key={circle.id} 
                circle={circle} 
                isMember={false}
                onJoin={() => handleJoinCircle(circle.id)}
              />
            ))}
          </div>
        ) : (
          <div className="card p-12 text-center">
            <Globe className="h-12 w-12 text-ink-300 dark:text-ink-600 mx-auto mb-4" />
            <h3 className="font-semibold text-ink-900 dark:text-cream-100 mb-2">
              No public circles found
            </h3>
            <p className="text-ink-500 dark:text-ink-400 mb-4">
              Be the first to create a public reading circle!
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary"
            >
              Create Circle
            </button>
          </div>
        )
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateCircleModal 
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            loadCircles();
          }}
        />
      )}
      
      {showJoinModal && (
        <JoinCircleModal 
          onClose={() => setShowJoinModal(false)}
          onJoined={() => {
            setShowJoinModal(false);
            loadCircles();
          }}
        />
      )}
    </div>
  );
}

function CircleCard({ circle, isMember, onJoin }) {
  const navigate = useNavigate();
  
  return (
    <div 
      className="card p-5 hover:shadow-card-hover transition-all cursor-pointer group"
      onClick={() => isMember ? navigate(`/circles/${circle.id}`) : null}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
            {circle.name[0].toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-ink-900 dark:text-cream-100 group-hover:text-primary-600 transition-colors">
              {circle.name}
            </h3>
            <p className="text-xs text-ink-500 dark:text-ink-400">
              by {circle.creator_username}
            </p>
          </div>
        </div>
        {circle.is_private ? (
          <Lock className="h-4 w-4 text-ink-400" />
        ) : (
          <Globe className="h-4 w-4 text-ink-400" />
        )}
      </div>
      
      {circle.description && (
        <p className="text-sm text-ink-600 dark:text-ink-300 mb-3 line-clamp-2">
          {circle.description}
        </p>
      )}
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-sm">
          <span className="flex items-center gap-1 text-ink-500 dark:text-ink-400">
            <Users className="h-4 w-4" />
            {circle.member_count}
          </span>
          {isMember && circle.my_points > 0 && (
            <span className="flex items-center gap-1 text-primary-600 dark:text-primary-400">
              <Trophy className="h-4 w-4" />
              {circle.my_points} pts
            </span>
          )}
        </div>
        
        {isMember ? (
          <ChevronRight className="h-5 w-5 text-ink-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" />
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onJoin?.();
            }}
            className="btn-primary text-xs py-1.5 px-3"
          >
            Join
          </button>
        )}
      </div>
    </div>
  );
}

function CreateCircleModal({ onClose, onCreated }) {
  const toast = useToast();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_private: false
  });
  const [creating, setCreating] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Please enter a circle name');
      return;
    }

    setCreating(true);
    try {
      await circlesAPI.createCircle(formData);
      toast.success('Circle created! 🎉');
      onCreated();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create circle');
    }
    setCreating(false);
  };

  return (
    <div className="fixed inset-0 bg-ink-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-ink-800 rounded-2xl w-full max-w-md shadow-modal animate-scale-in">
        <div className="p-6 border-b border-cream-200 dark:border-ink-700">
          <h2 className="text-xl font-serif font-bold text-ink-900 dark:text-cream-100">
            Create a Reading Circle
          </h2>
          <p className="text-sm text-ink-500 dark:text-ink-400 mt-1">
            Start a group to read and compete with friends
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink-700 dark:text-cream-300 mb-1.5">
              Circle Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Book Club 2024"
              className="input-field"
              maxLength={100}
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
              placeholder="What's this circle about?"
              className="input-field h-24 resize-none"
            />
          </div>

          <div className="flex items-center gap-3 p-3 bg-cream-100 dark:bg-ink-700 rounded-xl">
            <input
              type="checkbox"
              id="is_private"
              checked={formData.is_private}
              onChange={(e) => setFormData({ ...formData, is_private: e.target.checked })}
              className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="is_private" className="flex-1">
              <span className="font-medium text-ink-900 dark:text-cream-100 flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Private Circle
              </span>
              <span className="text-xs text-ink-500 dark:text-ink-400 block">
                Only people with the invite code can join
              </span>
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={creating}
              className="flex-1 btn-primary"
            >
              {creating ? 'Creating...' : 'Create Circle'}
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

function JoinCircleModal({ onClose, onJoined }) {
  const toast = useToast();
  const navigate = useNavigate();
  const [inviteCode, setInviteCode] = useState('');
  const [joining, setJoining] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inviteCode.trim()) {
      toast.error('Please enter an invite code');
      return;
    }

    setJoining(true);
    try {
      const response = await circlesAPI.joinByCode(inviteCode.trim().toUpperCase());
      toast.success(`Joined ${response.data.circle_name}! 🎉`);
      onJoined();
      navigate(`/circles/${response.data.circle_id}`);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Invalid invite code');
    }
    setJoining(false);
  };

  return (
    <div className="fixed inset-0 bg-ink-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-ink-800 rounded-2xl w-full max-w-md shadow-modal animate-scale-in">
        <div className="p-6 border-b border-cream-200 dark:border-ink-700">
          <h2 className="text-xl font-serif font-bold text-ink-900 dark:text-cream-100">
            Join a Circle
          </h2>
          <p className="text-sm text-ink-500 dark:text-ink-400 mt-1">
            Enter an invite code to join a private circle
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink-700 dark:text-cream-300 mb-1.5">
              Invite Code
            </label>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="e.g., ABCD1234"
              className="input-field text-center text-lg tracking-widest font-mono"
              maxLength={10}
              autoFocus
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={joining}
              className="flex-1 btn-primary"
            >
              {joining ? 'Joining...' : 'Join Circle'}
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

function EmptyState({ onCreateClick }) {
  return (
    <div className="card p-12 text-center">
      <div className="w-20 h-20 bg-primary-100 dark:bg-primary-900/50 rounded-full flex items-center justify-center mx-auto mb-6">
        <Users className="h-10 w-10 text-primary-600 dark:text-primary-400" />
      </div>
      <h2 className="text-xl font-serif font-bold text-ink-900 dark:text-cream-100 mb-2">
        No Reading Circles Yet
      </h2>
      <p className="text-ink-500 dark:text-ink-400 mb-6 max-w-sm mx-auto">
        Create a circle to start competing with friends on reading challenges, book races, and more!
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button onClick={onCreateClick} className="btn-primary inline-flex items-center justify-center gap-2">
          <Plus className="h-4 w-4" />
          Create Your First Circle
        </button>
      </div>
      
      {/* Feature highlights */}
      <div className="grid sm:grid-cols-3 gap-4 mt-8 pt-8 border-t border-cream-200 dark:border-ink-700">
        <div className="text-center">
          <div className="w-10 h-10 bg-ocean-100 dark:bg-ocean-900/50 rounded-xl flex items-center justify-center mx-auto mb-2">
            <Target className="h-5 w-5 text-ocean-600 dark:text-ocean-400" />
          </div>
          <h4 className="font-medium text-ink-900 dark:text-cream-100 text-sm">Book Races</h4>
          <p className="text-xs text-ink-500 dark:text-ink-400 mt-1">
            Race through books together
          </p>
        </div>
        <div className="text-center">
          <div className="w-10 h-10 bg-sage-100 dark:bg-sage-900/50 rounded-xl flex items-center justify-center mx-auto mb-2">
            <Trophy className="h-5 w-5 text-sage-600 dark:text-sage-400" />
          </div>
          <h4 className="font-medium text-ink-900 dark:text-cream-100 text-sm">Leaderboards</h4>
          <p className="text-xs text-ink-500 dark:text-ink-400 mt-1">
            Compete for the top spot
          </p>
        </div>
        <div className="text-center">
          <div className="w-10 h-10 bg-wine-100 dark:bg-wine-900/50 rounded-xl flex items-center justify-center mx-auto mb-2">
            <Sparkles className="h-5 w-5 text-wine-600 dark:text-wine-400" />
          </div>
          <h4 className="font-medium text-ink-900 dark:text-cream-100 text-sm">Challenges</h4>
          <p className="text-xs text-ink-500 dark:text-ink-400 mt-1">
            Monthly & custom goals
          </p>
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <div className="skeleton h-10 w-64 mb-2"></div>
          <div className="skeleton h-5 w-48"></div>
        </div>
        <div className="skeleton h-10 w-32"></div>
      </div>
      <div className="skeleton h-12 w-64 rounded-xl"></div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="skeleton h-40 rounded-2xl"></div>
        ))}
      </div>
    </div>
  );
}

export default Circles;
