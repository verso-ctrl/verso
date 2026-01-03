import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Eye, EyeOff, ArrowRight, Check, Mail, RefreshCw } from 'lucide-react';
import { authAPI } from '../services/api';

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
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [resending, setResending] = useState(false);
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
    try {
      const response = await authAPI.register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });
      
      if (response.data.requires_verification) {
        setRegistrationComplete(true);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
    }
    setLoading(false);
  };

  const handleResendVerification = async () => {
    setResending(true);
    try {
      await authAPI.resendVerification(formData.email);
      setError('');
    } catch (err) {
      // Don't show errors for security
    }
    setResending(false);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const passwordRequirements = [
    { met: formData.password.length >= 6, text: 'At least 6 characters' },
    { met: formData.password === formData.confirmPassword && formData.confirmPassword.length > 0, text: 'Passwords match' },
  ];

  // Show verification email sent screen
  if (registrationComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-primary-50 dark:from-ink-950 dark:via-ink-900 dark:to-ink-950 flex flex-col">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-200/30 dark:bg-primary-900/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary-100/40 dark:bg-primary-950/30 rounded-full blur-3xl"></div>
        </div>

        <div className="flex-1 flex items-center justify-center px-4 py-12 relative z-10">
          <div className="w-full max-w-md">
            <div className="text-center mb-8 animate-fade-up">
              <Link to="/" className="inline-flex items-center gap-3 mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center shadow-lg">
                  <BookOpen className="h-7 w-7 text-white" />
                </div>
              </Link>
            </div>

            <div className="card p-8 text-center animate-fade-up">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail className="h-8 w-8 text-primary-600" />
              </div>
              
              <h2 className="text-2xl font-serif font-bold text-ink-900 dark:text-cream-100 mb-3">
                Check your email
              </h2>
              
              <p className="text-ink-600 dark:text-ink-300 mb-2">
                We've sent a verification link to:
              </p>
              
              <p className="font-semibold text-ink-900 dark:text-cream-100 mb-6">
                {formData.email}
              </p>
              
              <p className="text-sm text-ink-500 dark:text-ink-400 mb-6">
                Click the link in the email to verify your account and start using Verso.
                The link will expire in 24 hours.
              </p>

              <div className="space-y-3">
                <button
                  onClick={handleResendVerification}
                  disabled={resending}
                  className="w-full btn-secondary flex items-center justify-center gap-2"
                >
                  {resending ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4" />
                      Resend verification email
                    </>
                  )}
                </button>
                
                <Link to="/login" className="block text-center text-primary-600 dark:text-primary-400 font-medium hover:underline">
                  Back to login
                </Link>
              </div>
              
              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-ink-700">
                <p className="text-xs text-ink-400 dark:text-ink-500">
                  Didn't receive the email? Check your spam folder or try a different email address.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-primary-50 dark:from-ink-950 dark:via-ink-900 dark:to-ink-950 flex flex-col">
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
                          : 'bg-slate-300 dark:bg-ink-700'
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

            <div className="mt-8 pt-6 border-t border-slate-200 dark:border-ink-700 text-center">
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
