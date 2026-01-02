import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Mail, BookOpen, Calendar, Edit2, X, Check, Upload, BarChart3, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../stores';
import { useToast } from '../components/Toast';

function Profile() {
  const toast = useToast();
  const { user, updateProfile } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    bio: user?.bio || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const result = await updateProfile(formData);
    setSaving(false);
    
    if (result.success) {
      setEditing(false);
      toast.success('Profile updated successfully!');
    } else {
      toast.error(result.error);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCancel = () => {
    setEditing(false);
    setFormData({
      full_name: user?.full_name || '',
      bio: user?.bio || '',
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-up">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-serif font-bold text-ink-900 dark:text-cream-100">
          Profile
        </h1>
        <p className="text-ink-500 dark:text-ink-400 mt-1">
          Manage your account settings
        </p>
      </div>

      {/* Profile Card */}
      <div className="card overflow-hidden">
        {/* Header Section */}
        <div className="bg-gradient-to-br from-primary-100 to-cream-100 dark:from-primary-900/40 dark:to-ink-800 p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                {user?.username?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <h2 className="text-2xl font-serif font-bold text-ink-900 dark:text-cream-100">
                  {user?.username}
                </h2>
                <p className="text-ink-500 dark:text-ink-400 flex items-center gap-1.5 mt-1">
                  <Mail className="h-4 w-4" />
                  {user?.email}
                </p>
              </div>
            </div>

            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="btn-secondary flex items-center gap-2"
              >
                <Edit2 className="h-4 w-4" />
                <span>Edit</span>
              </button>
            )}
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6">
          {editing ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-ink-700 dark:text-cream-300 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-700 dark:text-cream-300 mb-2">
                  Bio
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  className="input-field h-32 resize-none"
                  placeholder="Tell us about yourself and your reading interests..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="btn-secondary flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  <span>Cancel</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-medium text-ink-500 dark:text-ink-400 mb-1">
                  Full Name
                </h3>
                <p className="text-ink-900 dark:text-cream-100">
                  {user?.full_name || <span className="text-ink-400 italic">Not set</span>}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-ink-500 dark:text-ink-400 mb-1">
                  Bio
                </h3>
                <p className="text-ink-900 dark:text-cream-100">
                  {user?.bio || <span className="text-ink-400 italic">No bio yet. Tell others about your reading interests!</span>}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Account Information */}
      <div className="card p-6">
        <h3 className="text-lg font-serif font-semibold text-ink-900 dark:text-cream-100 mb-4">
          Account Information
        </h3>
        <div className="space-y-0">
          <div className="flex justify-between items-center py-3 border-b border-cream-200 dark:border-ink-700">
            <span className="text-ink-500 dark:text-ink-400">Username</span>
            <span className="font-medium text-ink-900 dark:text-cream-100">{user?.username}</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-cream-200 dark:border-ink-700">
            <span className="text-ink-500 dark:text-ink-400">Email</span>
            <span className="font-medium text-ink-900 dark:text-cream-100">{user?.email}</span>
          </div>
          <div className="flex justify-between items-center py-3">
            <span className="text-ink-500 dark:text-ink-400 flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              Member Since
            </span>
            <span className="font-medium text-ink-900 dark:text-cream-100">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              }) : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card p-6">
        <h3 className="text-lg font-serif font-semibold text-ink-900 dark:text-cream-100 mb-4">
          Quick Actions
        </h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <Link 
            to="/import"
            className="flex items-center gap-4 p-4 bg-cream-50 dark:bg-ink-800/50 rounded-xl hover:bg-cream-100 dark:hover:bg-ink-800 transition-colors group"
          >
            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/50 rounded-xl flex items-center justify-center">
              <Upload className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-ink-900 dark:text-cream-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                Import from Goodreads
              </p>
              <p className="text-sm text-ink-500 dark:text-ink-400">
                Bring your reading history
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-ink-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" />
          </Link>
          
          <Link 
            to="/statistics"
            className="flex items-center gap-4 p-4 bg-cream-50 dark:bg-ink-800/50 rounded-xl hover:bg-cream-100 dark:hover:bg-ink-800 transition-colors group"
          >
            <div className="w-10 h-10 bg-ocean-100 dark:bg-ocean-900/50 rounded-xl flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-ocean-600 dark:text-ocean-400" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-ink-900 dark:text-cream-100 group-hover:text-ocean-600 dark:group-hover:text-ocean-400 transition-colors">
                Reading Statistics
              </p>
              <p className="text-sm text-ink-500 dark:text-ink-400">
                View your reading insights
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-ink-400 group-hover:text-ocean-600 group-hover:translate-x-1 transition-all" />
          </Link>
        </div>
      </div>

      {/* About Section */}
      <div className="card p-6 bg-gradient-to-br from-primary-50 to-cream-100 dark:from-primary-950/50 dark:to-ink-800 border border-primary-100 dark:border-primary-900">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/50 rounded-xl flex items-center justify-center flex-shrink-0">
            <BookOpen className="h-5 w-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h3 className="text-lg font-serif font-semibold text-ink-900 dark:text-cream-100 mb-2">
              About Verso
            </h3>
            <p className="text-sm text-ink-600 dark:text-ink-300 leading-relaxed">
              Verso is your personal reading companion, powered by AI to help you discover,
              track, and enjoy books. Keep your reading organized, get intelligent recommendations,
              and connect with fellow readers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
