import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader, BookOpen, Mail } from 'lucide-react';
import { authAPI } from '../services/api';
import { useAuthStore } from '../stores';

function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuthStore();
  
  const [status, setStatus] = useState('verifying'); // verifying, success, error, already_verified
  const [error, setError] = useState('');
  
  const token = searchParams.get('token');
  
  useEffect(() => {
    if (token) {
      verifyEmail();
    } else {
      setStatus('error');
      setError('No verification token provided');
    }
  }, [token]);
  
  const verifyEmail = async () => {
    try {
      const response = await authAPI.verifyEmail(token);
      
      if (response.data.already_verified) {
        setStatus('already_verified');
      } else {
        setStatus('success');
        
        // Auto-login the user
        if (response.data.access_token) {
          login(response.data.access_token);
          
          // Redirect to home after 2 seconds
          setTimeout(() => {
            navigate('/');
          }, 2000);
        }
      }
    } catch (err) {
      setStatus('error');
      setError(err.response?.data?.detail || 'Verification failed. Please try again.');
    }
  };
  
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-ink-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 mb-6">
            <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center shadow-lg">
              <BookOpen className="h-7 w-7 text-white" />
            </div>
          </Link>
          <h1 className="text-3xl font-serif font-bold text-ink-900 dark:text-cream-100">
            Verso
          </h1>
        </div>
        
        {/* Status Card */}
        <div className="card p-8 text-center">
          {status === 'verifying' && (
            <>
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader className="h-8 w-8 text-primary-600 animate-spin" />
              </div>
              <h2 className="text-xl font-serif font-bold text-ink-900 dark:text-cream-100 mb-2">
                Verifying your email...
              </h2>
              <p className="text-ink-500 dark:text-ink-400">
                Please wait while we verify your email address.
              </p>
            </>
          )}
          
          {status === 'success' && (
            <>
              <div className="w-16 h-16 bg-sage-100 dark:bg-sage-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-sage-600" />
              </div>
              <h2 className="text-xl font-serif font-bold text-ink-900 dark:text-cream-100 mb-2">
                Email Verified!
              </h2>
              <p className="text-ink-500 dark:text-ink-400 mb-4">
                Your email has been verified successfully. Redirecting you to Verso...
              </p>
              <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto"></div>
            </>
          )}
          
          {status === 'already_verified' && (
            <>
              <div className="w-16 h-16 bg-ocean-100 dark:bg-ocean-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-ocean-600" />
              </div>
              <h2 className="text-xl font-serif font-bold text-ink-900 dark:text-cream-100 mb-2">
                Already Verified
              </h2>
              <p className="text-ink-500 dark:text-ink-400 mb-6">
                Your email has already been verified. You can log in to your account.
              </p>
              <Link to="/login" className="btn-primary">
                Go to Login
              </Link>
            </>
          )}
          
          {status === 'error' && (
            <>
              <div className="w-16 h-16 bg-wine-100 dark:bg-wine-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="h-8 w-8 text-wine-600" />
              </div>
              <h2 className="text-xl font-serif font-bold text-ink-900 dark:text-cream-100 mb-2">
                Verification Failed
              </h2>
              <p className="text-ink-500 dark:text-ink-400 mb-6">
                {error}
              </p>
              <div className="space-y-3">
                <Link to="/login" className="btn-primary block">
                  Go to Login
                </Link>
                <Link to="/register" className="btn-secondary block">
                  Create New Account
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default VerifyEmail;
