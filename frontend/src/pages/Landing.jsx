import React from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  Search, 
  Users, 
  Trophy, 
  BarChart3, 
  Sparkles,
  Star,
  Library,
  Target,
  ArrowRight,
  CheckCircle,
  Quote
} from 'lucide-react';

function Landing() {
  const features = [
    {
      icon: Library,
      title: 'Track Your Library',
      description: 'Organize books by status - currently reading, want to read, finished. Never lose track of your reading journey.',
      color: 'from-primary-500 to-primary-600'
    },
    {
      icon: Search,
      title: 'Discover New Books',
      description: 'Search millions of books, explore trending titles, and find your next favorite read with powerful filters.',
      color: 'from-ocean-500 to-ocean-600'
    },
    {
      icon: Sparkles,
      title: 'AI Recommendations',
      description: 'Get personalized book suggestions powered by AI that learns your taste and reading preferences.',
      color: 'from-violet-500 to-violet-600'
    },
    {
      icon: Users,
      title: 'Reading Circles',
      description: 'Create or join reading groups. Challenge friends, track progress together, and discuss books.',
      color: 'from-sage-500 to-sage-600'
    },
    {
      icon: Trophy,
      title: 'Goals & Achievements',
      description: 'Set yearly reading goals, earn points for finishing books, and celebrate your milestones.',
      color: 'from-amber-500 to-amber-600'
    },
    {
      icon: BarChart3,
      title: 'Reading Statistics',
      description: 'Visualize your reading habits with beautiful charts. Track pages, genres, and reading streaks.',
      color: 'from-rose-500 to-rose-600'
    }
  ];

  const testimonials = [
    {
      quote: "Finally, a modern alternative to Goodreads. The interface is beautiful and the AI recommendations are spot-on.",
      author: "Sarah K.",
      role: "Avid Reader"
    },
    {
      quote: "The Reading Circles feature got my book club actually engaged. We can track our progress and compete!",
      author: "Michael T.",
      role: "Book Club Organizer"
    },
    {
      quote: "I've read 40% more books this year just because of the goal tracking. It's addictive in the best way.",
      author: "Emma L.",
      role: "Fantasy Enthusiast"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-ink-950">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-ink-900/80 backdrop-blur-lg border-b border-slate-200 dark:border-ink-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-serif font-bold text-ink-900 dark:text-cream-100">Verso</span>
            </div>
            <div className="flex items-center gap-4">
              <Link 
                to="/login" 
                className="text-ink-600 dark:text-ink-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-colors"
              >
                Log in
              </Link>
              <Link 
                to="/register" 
                className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-primary-500/25"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-200/40 dark:bg-primary-900/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 -left-40 w-80 h-80 bg-ocean-200/30 dark:bg-ocean-900/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-20 right-1/4 w-72 h-72 bg-violet-200/30 dark:bg-violet-900/20 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 dark:bg-primary-900/50 rounded-full text-primary-700 dark:text-primary-300 text-sm font-medium mb-8">
              <Sparkles className="h-4 w-4" />
              <span>AI-powered book recommendations</span>
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-serif font-bold text-ink-900 dark:text-cream-100 mb-6 leading-tight">
              Your reading life,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-violet-500">
                elevated
              </span>
            </h1>
            
            <p className="text-xl text-ink-600 dark:text-ink-300 mb-10 max-w-2xl mx-auto leading-relaxed">
              Track your books, discover new favorites, set reading goals, and connect with fellow readers. 
              The modern book tracking app you've been waiting for.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/register" 
                className="inline-flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-2xl font-semibold text-lg transition-all hover:shadow-xl hover:shadow-primary-500/25 hover:-translate-y-0.5"
              >
                Start Reading Journey
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link 
                to="/login" 
                className="inline-flex items-center justify-center gap-2 bg-white dark:bg-ink-800 hover:bg-slate-50 dark:hover:bg-ink-700 text-ink-900 dark:text-cream-100 px-8 py-4 rounded-2xl font-semibold text-lg border border-slate-200 dark:border-ink-700 transition-all hover:shadow-lg"
              >
                I have an account
              </Link>
            </div>

            <p className="mt-6 text-sm text-ink-500 dark:text-ink-400">
              Free forever • No credit card required
            </p>
          </div>

          {/* Hero Image/Mockup */}
          <div className="mt-16 relative">
            <div className="bg-white dark:bg-ink-900 rounded-3xl shadow-2xl shadow-slate-300/50 dark:shadow-ink-950/50 border border-slate-200 dark:border-ink-800 overflow-hidden mx-auto max-w-5xl">
              <div className="h-8 bg-slate-100 dark:bg-ink-800 flex items-center px-4 gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-400"></div>
                <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                <div className="w-3 h-3 rounded-full bg-sage-400"></div>
              </div>
              <div className="p-8 bg-gradient-to-br from-slate-50 to-white dark:from-ink-900 dark:to-ink-800">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="aspect-[2/3] bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/50 dark:to-primary-800/50 rounded-xl flex items-center justify-center">
                      <BookOpen className="h-8 w-8 text-primary-400" />
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-violet-500"></div>
                    <div>
                      <div className="h-3 w-24 bg-slate-200 dark:bg-ink-700 rounded"></div>
                      <div className="h-2 w-16 bg-slate-100 dark:bg-ink-800 rounded mt-2"></div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="h-4 w-4 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-ink-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-ink-900 dark:text-cream-100 mb-4">
              Everything you need to read more
            </h2>
            <p className="text-lg text-ink-600 dark:text-ink-400 max-w-2xl mx-auto">
              Powerful features designed to help you discover, track, and enjoy your reading journey.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="group p-8 rounded-2xl bg-slate-50 dark:bg-ink-800 hover:bg-white dark:hover:bg-ink-700 border border-transparent hover:border-slate-200 dark:hover:border-ink-600 transition-all hover:shadow-xl hover:-translate-y-1"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-ink-900 dark:text-cream-100 mb-3">
                  {feature.title}
                </h3>
                <p className="text-ink-600 dark:text-ink-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary-600 to-violet-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRoLTJ2LTRoMnY0em0wLTZ2LTRoLTJ2NGgyem0tNiA2di00aC00djRoNHptMC02di00aC00djRoNHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30"></div>
        
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white mb-4">
              Loved by readers everywhere
            </h2>
            <p className="text-lg text-primary-100 max-w-2xl mx-auto">
              Join thousands of book lovers who've transformed their reading habits with Verso.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div 
                key={index} 
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20"
              >
                <Quote className="h-8 w-8 text-primary-200 mb-4" />
                <p className="text-white text-lg mb-6 leading-relaxed">
                  "{testimonial.quote}"
                </p>
                <div>
                  <p className="font-semibold text-white">{testimonial.author}</p>
                  <p className="text-primary-200 text-sm">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-ink-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-ink-900 dark:text-cream-100 mb-4">
              Get started in minutes
            </h2>
            <p className="text-lg text-ink-600 dark:text-ink-400">
              Three simple steps to begin your organized reading journey.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Create your account', desc: 'Sign up for free in seconds. No credit card required.' },
              { step: '2', title: 'Add your books', desc: 'Search our database or import from Goodreads. Build your library.' },
              { step: '3', title: 'Start tracking', desc: 'Set goals, join circles, and watch your reading flourish.' }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400 text-2xl font-bold flex items-center justify-center mx-auto mb-6">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-ink-900 dark:text-cream-100 mb-3">
                  {item.title}
                </h3>
                <p className="text-ink-600 dark:text-ink-400">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-ink-950">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-ink-900 dark:text-cream-100 mb-6">
            Ready to read more?
          </h2>
          <p className="text-xl text-ink-600 dark:text-ink-400 mb-10">
            Join Verso today and transform your reading life. It's free, forever.
          </p>
          <Link 
            to="/register" 
            className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-10 py-5 rounded-2xl font-semibold text-lg transition-all hover:shadow-xl hover:shadow-primary-500/25 hover:-translate-y-0.5"
          >
            Create Free Account
            <ArrowRight className="h-5 w-5" />
          </Link>
          <div className="mt-8 flex items-center justify-center gap-8 text-sm text-ink-500 dark:text-ink-400">
            <span className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-sage-500" />
              Free forever
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-sage-500" />
              No credit card
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-sage-500" />
              Import from Goodreads
            </span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-white dark:bg-ink-900 border-t border-slate-200 dark:border-ink-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-serif font-bold text-ink-900 dark:text-cream-100">Verso</span>
            </div>
            <p className="text-ink-500 dark:text-ink-400 text-sm">
              © 2026 Verso. Your reading life, elevated.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Landing;
