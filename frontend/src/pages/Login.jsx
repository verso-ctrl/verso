import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../stores';

function Login() {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(formData);
    setLoading(false);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-100 via-cream-50 to-primary-50 dark:from-ink-950 dark:via-ink-900 dark:to-ink-950 flex flex-col">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-200/30 dark:bg-primary-900/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary-100/40 dark:bg-primary-950/30 rounded-full blur-3xl"></div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12 relative z-10">
        <div className="w-full max-w-md">
          {/* Logo & Header */}
          <div className="text-center mb-8 animate-fade-up">
            <Link to="/" className="inline-flex items-center gap-3 mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center shadow-lg">
                <BookOpen className="h-7 w-7 text-white" />
              </div>
            </Link>
            <h1 className="text-4xl font-serif font-bold text-ink-900 dark:text-cream-100 mb-2">
              Verso
            </h1>
            <p className="text-ink-500 dark:text-ink-400">
              Your reading life, elevated
            </p>
          </div>

          {/* Login Card */}
          <div className="card p-8 animate-fade-up" style={{ animationDelay: '0.1s' }}>
            <h2 className="text-2xl font-serif font-bold text-ink-900 dark:text-cream-100 mb-6">
              Welcome back
            </h2>

            {error && (
              <div className="mb-6 p-4 bg-wine-50 dark:bg-wine-900/30 border border-wine-200 dark:border-wine-800 rounded-xl text-wine-700 dark:text-wine-300 text-sm animate-fade-in">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-ink-700 dark:text-cream-300 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Enter your username"
                  required
                  autoComplete="username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-700 dark:text-cream-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="input-field pr-12"
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-ink-400 hover:text-ink-600 dark:hover:text-cream-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-3.5 flex items-center justify-center gap-2 text-base"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Logging in...</span>
                  </>
                ) : (
                  <>
                    <span>Log in</span>
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-cream-200 dark:border-ink-700 text-center">
              <p className="text-ink-600 dark:text-ink-400">
                Don't have an account?{' '}
                <Link 
                  to="/register" 
                  className="text-primary-600 dark:text-primary-400 font-semibold hover:underline"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </div>

          {/* Quote */}
          <p className="text-center text-sm text-ink-400 dark:text-ink-500 mt-8 italic font-serif animate-fade-up" style={{ animationDelay: '0.2s' }}>
            "A room without books is like a body without a soul." — Cicero
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
