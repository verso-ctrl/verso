import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, Library, Compass, Sparkles, User, LogOut, BookOpen, Users, 
  Menu, X, Search, BarChart3, Upload, ChevronRight, Trophy
} from 'lucide-react';
import { useAuthStore } from '../stores';
import PointsDisplay from './PointsDisplay';
import DarkModeToggle from './DarkModeToggle';

function Layout() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  // Primary navigation - most used features
  const primaryNav = [
    { path: '/home', icon: Home, label: 'Home' },
    { path: '/library', icon: Library, label: 'My Library' },
    { path: '/discover', icon: Compass, label: 'Discover' },
    { path: '/circles', icon: Trophy, label: 'Circles' },
  ];

  // Secondary navigation
  const secondaryNav = [
    { path: '/statistics', icon: BarChart3, label: 'Statistics' },
    { path: '/recommendations', icon: Sparkles, label: 'AI Picks' },
    { path: '/users', icon: Users, label: 'Readers' },
    { path: '/import', icon: Upload, label: 'Import' },
  ];

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleQuickSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/discover?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  return (
    <div className="min-h-screen bg-cream-100 dark:bg-ink-950">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-full w-64 bg-white dark:bg-ink-900 border-r border-cream-200 dark:border-ink-800 z-40">
        {/* Logo */}
        <div className="p-5 border-b border-cream-200 dark:border-ink-800">
          <Link to="/home" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-sm">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-serif font-bold text-ink-900 dark:text-cream-100">
              Verso
            </span>
          </Link>
        </div>

        {/* Search */}
        <div className="p-4">
          <form onSubmit={handleQuickSearch}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search books..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-cream-100 dark:bg-ink-800 border-0 
                         text-ink-900 dark:text-cream-100 placeholder:text-ink-400 text-sm
                         focus:ring-2 focus:ring-primary-500 transition-all"
              />
            </div>
          </form>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          <div className="text-xs font-semibold text-ink-400 dark:text-ink-500 uppercase tracking-wider mb-2 px-3">
            Main
          </div>
          {primaryNav.map(({ path, icon: Icon, label }) => (
            <Link
              key={path}
              to={path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive(path)
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300'
                  : 'text-ink-600 hover:bg-cream-100 dark:text-cream-400 dark:hover:bg-ink-800'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </Link>
          ))}

          <div className="text-xs font-semibold text-ink-400 dark:text-ink-500 uppercase tracking-wider mt-6 mb-2 px-3">
            Explore
          </div>
          {secondaryNav.map(({ path, icon: Icon, label }) => (
            <Link
              key={path}
              to={path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive(path)
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300'
                  : 'text-ink-600 hover:bg-cream-100 dark:text-cream-400 dark:hover:bg-ink-800'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        {/* User Section */}
        <div className="p-3 border-t border-cream-200 dark:border-ink-800">
          <div className="flex items-center justify-between mb-3 px-2">
            <DarkModeToggle />
            <PointsDisplay />
          </div>
          
          <Link
            to="/profile"
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-cream-100 dark:hover:bg-ink-800 transition-colors"
          >
            <div className="w-9 h-9 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-ink-900 dark:text-cream-100 truncate">
                {user?.username}
              </p>
              <p className="text-xs text-ink-500 dark:text-ink-400 truncate">
                View Profile
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-ink-400" />
          </Link>
          
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2 mt-2 rounded-xl text-sm font-medium text-wine-600 dark:text-wine-400 hover:bg-wine-50 dark:hover:bg-wine-900/30 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden bg-white/95 dark:bg-ink-900/95 backdrop-blur-lg border-b border-cream-200 dark:border-ink-800 sticky top-0 z-50">
        <div className="flex justify-between items-center h-14 px-4">
          <Link to="/home" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
              <BookOpen className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-serif font-bold text-ink-900 dark:text-cream-100">
              Verso
            </span>
          </Link>

          <div className="flex items-center gap-1">
            <PointsDisplay />
            <DarkModeToggle />
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-lg hover:bg-cream-100 dark:hover:bg-ink-800"
            >
              <Menu className="h-5 w-5 text-ink-600 dark:text-cream-400" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div 
            className="absolute inset-0 bg-ink-900/50 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute right-0 top-0 h-full w-80 max-w-[85vw] bg-white dark:bg-ink-900 shadow-2xl animate-slide-in-right overflow-y-auto">
            {/* Menu Header */}
            <div className="flex items-center justify-between p-4 border-b border-cream-200 dark:border-ink-800 sticky top-0 bg-white dark:bg-ink-900">
              <span className="font-serif font-bold text-ink-900 dark:text-cream-100">Menu</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-cream-100 dark:hover:bg-ink-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-cream-200 dark:border-ink-800">
              <form onSubmit={(e) => { handleQuickSearch(e); setMobileMenuOpen(false); }}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search books..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-cream-100 dark:bg-ink-800 border-0 text-sm"
                  />
                </div>
              </form>
            </div>

            {/* Navigation */}
            <nav className="p-4 space-y-1">
              <div className="text-xs font-semibold text-ink-400 uppercase tracking-wider mb-2 px-2">Main</div>
              {primaryNav.map(({ path, icon: Icon, label }) => (
                <Link
                  key={path}
                  to={path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors ${
                    isActive(path)
                      ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300'
                      : 'text-ink-600 hover:bg-cream-100 dark:text-cream-400 dark:hover:bg-ink-800'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{label}</span>
                </Link>
              ))}
              
              <div className="text-xs font-semibold text-ink-400 uppercase tracking-wider mt-4 mb-2 px-2">Explore</div>
              {secondaryNav.map(({ path, icon: Icon, label }) => (
                <Link
                  key={path}
                  to={path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors ${
                    isActive(path)
                      ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300'
                      : 'text-ink-600 hover:bg-cream-100 dark:text-cream-400 dark:hover:bg-ink-800'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{label}</span>
                </Link>
              ))}
            </nav>

            {/* User Section */}
            <div className="p-4 border-t border-cream-200 dark:border-ink-800 mt-auto">
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-cream-100 dark:hover:bg-ink-800 transition-colors"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {user?.username?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-ink-900 dark:text-cream-100">{user?.username}</p>
                  <p className="text-xs text-ink-500 dark:text-ink-400">View Profile</p>
                </div>
                <ChevronRight className="h-4 w-4 text-ink-400" />
              </Link>
              <button
                onClick={() => { logout(); setMobileMenuOpen(false); }}
                className="w-full flex items-center justify-center gap-2 mt-3 py-2.5 rounded-xl text-wine-600 dark:text-wine-400 hover:bg-wine-50 dark:hover:bg-wine-900/30 font-medium transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-ink-900/95 backdrop-blur-lg border-t border-cream-200 dark:border-ink-800 z-40 safe-area-pb">
        <div className="grid grid-cols-5 max-w-lg mx-auto">
          {[
            { path: '/home', icon: Home, label: 'Home' },
            { path: '/library', icon: Library, label: 'Library' },
            { path: '/circles', icon: Trophy, label: 'Circles' },
            { path: '/discover', icon: Compass, label: 'Discover' },
            { path: '/profile', icon: User, label: 'Profile' }
          ].map(({ path, icon: Icon, label }) => (
            <Link
              key={path}
              to={path}
              className={`flex flex-col items-center py-2 transition-colors ${
                isActive(path)
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-ink-400 dark:text-ink-500'
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive(path) ? 'scale-110' : ''} transition-transform`} />
              <span className="text-[10px] mt-0.5 font-medium">{label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-24 lg:pb-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default Layout;
