import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Eye, EyeOff, ArrowRight, Check } from 'lucide-react';
import { useAuthStore } from '../stores';

function Register() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    const result = await register({
      username: formData.username,
      email: formData.email,
      password: formData.password,
    });
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

  const passwordRequirements = [
    { met: formData.password.length >= 6, text: 'At least 6 characters' },
    { met: formData.password === formData.confirmPassword && formData.confirmPassword.length > 0, text: 'Passwords match' },
  ];

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
              Join Verso
            </h1>
            <p className="text-ink-500 dark:text-ink-400">
              Elevate your reading life
            </p>
          </div>

          {/* Register Card */}
          <div className="card p-8 animate-fade-up" style={{ animationDelay: '0.1s' }}>
            <h2 className="text-2xl font-serif font-bold text-ink-900 dark:text-cream-100 mb-6">
              Create account
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
                  placeholder="Choose a username"
                  required
                  autoComplete="username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-700 dark:text-cream-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="your@email.com"
                  required
                  autoComplete="email"
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
                    placeholder="Create a password"
                    required
                    autoComplete="new-password"
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

              <div>
                <label className="block text-sm font-medium text-ink-700 dark:text-cream-300 mb-2">
                  Confirm Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Confirm your password"
                  required
                  autoComplete="new-password"
                />
              </div>

              {/* Password requirements */}
              {formData.password && (
                <div className="space-y-2 animate-fade-in">
                  {passwordRequirements.map((req, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                        req.met 
                          ? 'bg-sage-500 text-white' 
                          : 'bg-cream-300 dark:bg-ink-700'
                      }`}>
                        {req.met && <Check className="h-3 w-3" />}
                      </div>
                      <span className={req.met ? 'text-sage-700 dark:text-sage-400' : 'text-ink-500'}>
                        {req.text}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-3.5 flex items-center justify-center gap-2 text-base"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Creating account...</span>
                  </>
                ) : (
                  <>
                    <span>Create account</span>
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-cream-200 dark:border-ink-700 text-center">
              <p className="text-ink-600 dark:text-ink-400">
                Already have an account?{' '}
                <Link 
                  to="/login" 
                  className="text-primary-600 dark:text-primary-400 font-semibold hover:underline"
                >
                  Log in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
